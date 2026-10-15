import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Pool de conexiones a MySQL (Estándar profesional en lugar de abrir/cerrar conexiones manuales)
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '120140213.s',
  database: 'tecnova_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 1. Endpoint de Salud (Semana 4 - Corregido para usar la variable 'db')
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

// 2. Endpoint para OBTENER productos (Semana 4)
app.get('/api/productos', async (req, res) => {
  try {
    const [productos] = await db.query('SELECT * FROM productos ORDER BY id DESC');
    res.json(productos);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    res.status(500).json({ mensaje: 'Error al consultar productos' });
  }
});

// 3. Endpoint para CREAR productos (NUEVO: Exigencia de la Semana 6 - HU-002)
// Endpoint para CREAR productos (Semana 6 - Corregido con precio_compra)
app.post('/api/productos', async (req, res) => {
  try {
    let { nombre, precio, precio_venta, precio_compra, stock, stock_actual, codigo_barras, categoria } = req.body;

    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
    }

    // 1. Limpiar puntos de miles si se escribieron (ej: "200.000")
    let rawPrecioVenta = precio_venta || precio || 0;
    if (typeof rawPrecioVenta === 'string') {
      rawPrecioVenta = rawPrecioVenta.replace(/\./g, '').replace(',', '.');
    }
    const numPrecioVenta = Number(rawPrecioVenta) || 0;

    // 2. Manejar precio_compra (si no viene, le asignamos un valor por defecto para cumplir con MySQL)
    let rawPrecioCompra = precio_compra || (numPrecioVenta * 0.7);
    if (typeof rawPrecioCompra === 'string') {
      rawPrecioCompra = rawPrecioCompra.replace(/\./g, '').replace(',', '.');
    }
    const numPrecioCompra = Number(rawPrecioCompra) || 0;

    const numStock = Number(stock_actual || stock) || 0;

    // 3. Insertar en MySQL incluyendo precio_compra
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});