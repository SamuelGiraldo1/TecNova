import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'secreto_super_seguro_tecnova_2026'; // Clave para firmar Tokens JWT

// ==========================================
// 1. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 2. CONEXIÓN A BASE DE DATOS (MYSQL)
// ==========================================
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '120140213.s',
  database: 'tecnova_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==========================================
// 3. MIDDLEWARE DE SEGURIDAD (TOKEN JWT)
// ==========================================
const verificarToken = (req, res, next) => {
  const tokenHeader = req.headers['authorization'];
  
  if (!tokenHeader) {
    return res.status(401).json({ mensaje: 'Acceso denegado: Token no proporcionado.' });
  }

  const token = tokenHeader.split(' ')[1]; // Formato "Bearer <token>"

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
};

// ==========================================
// 4. ENDPOINT DE SALUD (HEALTH CHECK)
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ 
      estado: 'ONLINE', 
      mensaje: 'Conexión exitosa de 3 Capas (React -> Express -> MySQL)' 
    });
  } catch (error) {
    res.status(500).json({ 
      estado: 'ERROR', 
      mensaje: 'Error de conexión con MySQL',
      error: error.message 
    });
  }
});

// ==========================================
// 5. RUTAS DE AUTENTICACIÓN Y SEGURIDAD
// ==========================================

// Registrar nuevo usuario con contraseña cifrada (bcrypt)
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, email y contraseña son obligatorios.' });
    }

    // Hashear la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);

    const [resultado] = await db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, passwordHashed, rol || 'cajero']
    );

    res.status(201).json({ 
      mensaje: 'Usuario registrado exitosamente', 
      id: resultado.insertId 
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario en la base de datos.' });
  }
});

// Iniciar Sesión (Login) y obtener Token JWT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (usuarios.length === 0) {
      return res.status(44).json({ mensaje: 'Usuario no encontrado.' });
    }

    const usuario = usuarios[0];

    // Validar contraseña cifrada
    const passwordValido = await bcrypt.compare(password, usuario.password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    // Generar Token JWT con validez de 4 horas
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '4h' }
    );

    res.json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error en el servidor al intentar iniciar sesión.' });
  }
});

// ==========================================
// 6. RUTAS DE PRODUCTOS (INVENTARIO)
// ==========================================

// Obtener lista de productos
app.get('/api/productos', async (req, res) => {
  try {
    const [productos] = await db.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(productos);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    res.status(500).json({ mensaje: 'Error al consultar productos' });
  }
});

// Crear nuevo producto
app.post('/api/productos', async (req, res) => {
  try {
    let { nombre, precio, precio_venta, precio_compra, stock, stock_actual, codigo_barras, categoria } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
    }

    // Sanitizar formato de precio
    let rawPrecioVenta = precio_venta || precio || 0;
    if (typeof rawPrecioVenta === 'string') {
      rawPrecioVenta = rawPrecioVenta.replace(/\./g, '').replace(',', '.');
    }
    const numPrecioVenta = Number(rawPrecioVenta) || 0;

    // Asignar valor por defecto a precio_compra si no viene
    let rawPrecioCompra = precio_compra || (numPrecioVenta * 0.7);
    if (typeof rawPrecioCompra === 'string') {
      rawPrecioCompra = rawPrecioCompra.replace(/\./g, '').replace(',', '.');
    }
    const numPrecioCompra = Number(rawPrecioCompra) || 0;

    const numStock = Number(stock_actual || stock) || 0;

    const [resultado] = await db.query(
      'INSERT INTO productos (nombre, precio_compra, precio_venta, stock_actual, codigo_barras, categoria) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, numPrecioCompra, numPrecioVenta, numStock, codigo_barras || null, categoria || 'General']
    );

    res.status(201).json({
      mensaje: 'Producto registrado exitosamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('❌ Error exacto en MySQL:', error.message);
    res.status(500).json({ mensaje: `Error en la base de datos: ${error.message}` });
  }
});

// ==========================================
// 7. INICIAR SERVIDOR (SIEMPRE AL FINAL)
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});