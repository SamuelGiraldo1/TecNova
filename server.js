import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'secreto_super_seguro_tecnova_2026';

// ==========================================
// 1. MIDDLEWARES GLOBALES
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// 2. CONEXIÓN A BASE DE DATOS (MYSQL CON POOL)
// ==========================================
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '120140213.s',
  database: 'tecnova_db',
  waitForConnections: true,
  connectionLimit: 15,
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

  const token = tokenHeader.startsWith('Bearer ') ? tokenHeader.slice(7) : tokenHeader;

  try {
    const verificado = jwt.verify(token, JWT_SECRET);
    req.usuario = verificado;
    next();
  } catch (error) {
    return res.status(403).json({ mensaje: 'Token inválido o expirado.' });
  }
};

// ==========================================
// 4. ENDPOINT DE SALUD (HEALTH CHECK - 3 CAPAS)
// ==========================================
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as ping, DATABASE() as dbName, VERSION() as version');
    const [counts] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM productos WHERE activo = 1) as productosActivos,
        (SELECT COUNT(*) FROM usuarios) as totalUsuarios,
        (SELECT COUNT(*) FROM ventas) as totalVentas
    `);

    res.json({
      estado: 'ONLINE',
      mensaje: 'Conexión exitosa de 3 Capas (React -> Express -> MySQL)',
      bd: result[0]?.dbName || 'tecnova_db',
      versionMySql: result[0]?.version,
      estadisticas: counts[0] || {}
    });
  } catch (error) {
    console.error('Error health check:', error);
    res.status(500).json({
      estado: 'ERROR',
      mensaje: 'Error de conexión con MySQL',
      error: error.message
    });
  }
});

// ==========================================
// 5. AUTENTICACIÓN, USUARIOS Y ROLES (SPRINT 1 - HU-001)
// ==========================================

// Registrar nuevo usuario
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, correo electrónico y contraseña son obligatorios.' });
    }

    // Verificar si ya existe el usuario
    const [existentes] = await db.query('SELECT id FROM usuarios WHERE email = ? OR correo = ?', [email, email]);
    if (existentes.length > 0) {
      return res.status(400).json({ mensaje: 'El correo electrónico ya se encuentra registrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHashed = await bcrypt.hash(password, salt);
    const assignedRole = (rol && rol.toLowerCase().includes('admin')) ? 'ADMIN' : 'cajero';

    const [resultado] = await db.query(
      'INSERT INTO usuarios (nombre, correo, email, password, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, email, passwordHashed, passwordHashed, assignedRole]
    );

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id: resultado.insertId,
      usuario: { id: resultado.insertId, nombre, email, rol: assignedRole }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario en la base de datos.' });
  }
});

// Iniciar Sesión (Login) y retorno de JWT
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (email || username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ mensaje: 'Identificador y contraseña requeridos.' });
    }

    // Permitir buscar por email, correo o parte de nombre
    const [usuarios] = await db.query(
      'SELECT * FROM usuarios WHERE email = ? OR correo = ? OR nombre = ? LIMIT 1',
      [identifier, identifier, identifier]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const usuario = usuarios[0];
    const storedPassword = usuario.password_hash || usuario.password;

    if (!storedPassword) {
      return res.status(401).json({ mensaje: 'Contraseña no configurada.' });
    }

    const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$');
    let valido = false;

    if (isBcrypt) {
      valido = await bcrypt.compare(password, storedPassword);
    } else {
      valido = (password === storedPassword);
      if (valido) {
        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(password, salt);
        await db.query('UPDATE usuarios SET password = ?, password_hash = ? WHERE id = ?', [newHash, newHash, usuario.id]);
      }
    }

    // Respaldo de acceso rápido para demo si credenciales son las conocidas
    if (!valido) {
      if ((usuario.correo === 'admin@tecnova.com' && password === 'Admin123!') ||
          (usuario.correo === 'cajero@tecnova.com' && password === 'Cajero123!')) {
        valido = true;
      }
    }

    if (!valido) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    const rolNormalizado = (usuario.rol || '').toUpperCase().includes('ADMIN') ? 'Admin' : 'Vendedor';
    const userEmail = usuario.email || usuario.correo;

    const token = jwt.sign(
      { id: usuario.id, email: userEmail, rol: rolNormalizado, nombre: usuario.nombre },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      mensaje: 'Autenticación exitosa',
      token,
      usuario: {
        id: String(usuario.id),
        username: userEmail.split('@')[0],
        nombre: usuario.nombre,
        name: usuario.nombre,
        email: userEmail,
        role: rolNormalizado,
        rol: rolNormalizado
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ mensaje: 'Error interno en el servidor.' });
  }
});

// Listar usuarios registrados (para gestión de roles)
app.get('/api/usuarios', async (req, res) => {
  try {
    const [usuarios] = await db.query('SELECT id, nombre, correo, email, rol, creado_en FROM usuarios ORDER BY id ASC');
    res.json(usuarios.map(u => ({
      id: String(u.id),
      name: u.nombre,
      email: u.email || u.correo,
      role: (u.rol || '').toUpperCase().includes('ADMIN') ? 'Admin' : 'Vendedor',
      createdAt: u.creado_en
    })));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar usuarios' });
  }
});

// ==========================================
// 6. CRUD DE PRODUCTOS (SPRINT 1 - HU-002)
// ==========================================

// Obtener productos (con soporte para incluir inactivos)
app.get('/api/productos', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const sql = includeInactive 
      ? 'SELECT * FROM productos ORDER BY id DESC' 
      : 'SELECT * FROM productos WHERE activo = 1 ORDER BY id DESC';
    
    const [productos] = await db.query(sql);

    // Mapeo unificado para frontend React
    const formatted = productos.map(p => ({
      id: String(p.id),
      barcode: p.codigo_barras,
      name: p.nombre,
      brand: p.marca || 'Genérico',
      model: p.modelo || 'N/A',
      category: p.categoria || 'General',
      purchaseCost: Number(p.precio_compra) || 0,
      sellingPrice: Number(p.precio_venta) || 0,
      stock: Number(p.stock_actual) || 0,
      minStock: Number(p.stock_minimo) || 5,
      maxStock: Number(p.stock_maximo) || 1000,
      velocity: p.velocidad || 'medium',
      supplier: p.proveedor || 'Distribuidor Mayorista',
      leadTime: p.tiempo_entrega || '3 días hábiles',
      serialNumberRequired: Boolean(p.requiere_serie),
      status: p.activo ? 'active' : 'inactive',
      imageUrl: p.imagen_url || null,
      updatedAt: p.actualizado_en
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error al consultar productos:', error);
    res.status(500).json({ mensaje: 'Error al consultar productos en BD' });
  }
});

// Crear producto
app.post('/api/productos', async (req, res) => {
  try {
    const { 
      barcode, codigo_barras, 
      name, nombre, 
      category, categoria, 
      brand, marca, 
      model, modelo, 
      purchaseCost, precio_compra, 
      sellingPrice, precio_venta, precio, 
      stock, stock_actual, 
      minStock, stock_minimo, 
      maxStock, stock_maximo, 
      velocity, velocidad, 
      supplier, proveedor, 
      leadTime, tiempo_entrega,
      serialNumberRequired, requiere_serie,
      imageUrl, imagen_url
    } = req.body;

    const prodNombre = (name || nombre || '').trim();
    if (!prodNombre) {
      return res.status(400).json({ mensaje: 'El nombre del producto es obligatorio.' });
    }

    const prodBarcode = (barcode || codigo_barras || '770' + Math.floor(100000000 + Math.random() * 900000000)).trim();
    const prodPrecioVenta = Number(sellingPrice || precio_venta || precio) || 0;
    const prodPrecioCompra = Number(purchaseCost || precio_compra) || (prodPrecioVenta * 0.7);
    const prodStock = Number(stock || stock_actual) || 0;
    const prodMinStock = Number(minStock || stock_minimo) || 5;
    const prodMaxStock = Number(maxStock || stock_maximo) || 1000;

    const [resultado] = await db.query(
      `INSERT INTO productos 
       (codigo_barras, nombre, categoria, marca, modelo, precio_compra, precio_venta, stock_actual, stock_minimo, stock_maximo, velocidad, proveedor, tiempo_entrega, requiere_serie, activo, imagen_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        prodBarcode,
        prodNombre,
        category || categoria || 'General',
        brand || marca || 'Genérico',
        model || modelo || 'N/A',
        prodPrecioCompra,
        prodPrecioVenta,
        prodStock,
        prodMinStock,
        prodMaxStock,
        velocity || velocidad || 'medium',
        supplier || proveedor || 'Distribuidor Local',
        leadTime || tiempo_entrega || '3 días hábiles',
        serialNumberRequired || requiere_serie ? 1 : 0,
        imageUrl || imagen_url || null
      ]
    );

    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      id: resultado.insertId,
      producto: {
        id: String(resultado.insertId),
        barcode: prodBarcode,
        name: prodNombre,
        stock: prodStock,
        sellingPrice: prodPrecioVenta
      }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ mensaje: `Error al crear producto: ${error.message}` });
  }
});

// Actualizar producto
app.put('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    await db.query(
      `UPDATE productos SET 
        nombre = COALESCE(?, nombre),
        categoria = COALESCE(?, categoria),
        marca = COALESCE(?, marca),
        modelo = COALESCE(?, modelo),
        precio_compra = COALESCE(?, precio_compra),
        precio_venta = COALESCE(?, precio_venta),
        stock_actual = COALESCE(?, stock_actual),
        stock_minimo = COALESCE(?, stock_minimo),
        stock_maximo = COALESCE(?, stock_maximo),
        velocidad = COALESCE(?, velocidad),
        proveedor = COALESCE(?, proveedor),
        tiempo_entrega = COALESCE(?, tiempo_entrega),
        imagen_url = COALESCE(?, imagen_url)
      WHERE id = ?`,
      [
        data.name || data.nombre,
        data.category || data.categoria,
        data.brand || data.marca,
        data.model || data.modelo,
        data.purchaseCost || data.precio_compra,
        data.sellingPrice || data.precio_venta,
        data.stock || data.stock_actual,
        data.minStock || data.stock_minimo,
        data.maxStock || data.stock_maximo,
        data.velocity || data.velocidad,
        data.supplier || data.proveedor,
        data.leadTime || data.tiempo_entrega,
        data.imageUrl || data.imagen_url,
        id
      ]
    );

    res.json({ mensaje: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar producto' });
  }
});

// Desactivación lógica de producto
app.delete('/api/productos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE productos SET activo = 0 WHERE id = ?', [id]);
    res.json({ mensaje: 'Producto desactivado lógicamente del catálogo' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al desactivar producto' });
  }
});

// Restauración de producto
app.patch('/api/productos/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE productos SET activo = 1 WHERE id = ?', [id]);
    res.json({ mensaje: 'Producto restaurado exitosamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al restaurar producto' });
  }
});

// ==========================================
// 7. TRANSACCIONES POS & VENTAS (SPRINT 2 - HU-003)
// Concurrencia con SELECT ... FOR UPDATE y Rollback
// ==========================================
app.post('/api/sales', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { 
      items, 
      totalAmount, 
      customerName, 
      customerEmail, 
      paymentMethod, 
      userId, 
      userName, 
      userRole 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ mensaje: 'El carrito no contiene productos para procesar la venta.' });
    }

    const facturaNum = 'INV-2026-' + String(Date.now()).slice(-6);

    // Iniciar transacción SQL para garantizar atomicidad y consistencia
    await connection.beginTransaction();

    let subtotalCalculado = 0;
    const detallesProcesados = [];

    // Validar y descontar stock con control de concurrencia
    for (const item of items) {
      const prodId = item.productId || item.id;
      const cant = Number(item.quantity) || 1;

      // Bloqueo de fila para concurrencia (evita sobreventa)
      const [rows] = await connection.query(
        'SELECT id, nombre, stock_actual, precio_compra, precio_venta FROM productos WHERE id = ? FOR UPDATE',
        [prodId]
      );

      if (rows.length === 0) {
        throw new Error(`El producto con ID ${prodId} no existe en la base de datos.`);
      }

      const prod = rows[0];
      if (prod.stock_actual < cant) {
        throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock_actual}, Solicitado: ${cant}.`);
      }

      // Rebajar stock en tiempo real
      await connection.query(
        'UPDATE productos SET stock_actual = stock_actual - ? WHERE id = ?',
        [cant, prodId]
      );

      const precioUnit = Number(item.unitPrice || prod.precio_venta) || 0;
      const costoUnit = Number(item.unitCost || prod.precio_compra) || 0;
      const subtotalItem = cant * precioUnit;
      subtotalCalculado += subtotalItem;

      detallesProcesados.push({
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad: cant,
        precio_unitario: precioUnit,
        costo_unitario: costoUnit,
        subtotal: subtotalItem
      });
    }

    const totalVenta = Number(totalAmount) || subtotalCalculado;
    const subtotal = totalVenta * 0.81;
    const iva = totalVenta * 0.19;

    // Registrar cabecera de venta
    const [ventaResult] = await connection.query(
      `INSERT INTO ventas 
       (numero_factura, usuario_id, cliente_nombre, correo_cliente, metodo_pago, subtotal, iva, total) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        facturaNum,
        userId && !isNaN(Number(userId)) ? Number(userId) : null,
        customerName || 'Cliente Mostrador',
        customerEmail || 'cliente@example.com',
        paymentMethod || 'Efectivo',
        subtotal,
        iva,
        totalVenta
      ]
    );

    const ventaId = ventaResult.insertId;

    // Registrar detalles de venta y movimiento de inventario Kardex
    for (const d of detallesProcesados) {
      await connection.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, costo_unitario) VALUES (?, ?, ?, ?, ?)',
        [ventaId, d.producto_id, d.cantidad, d.precio_unitario, d.costo_unitario]
      );

      await connection.query(
        `INSERT INTO movimientos_inventario 
         (tipo, producto_id, cantidad, costo_unitario, precio_unitario, total, numero_comprobante, usuario_id, usuario_nombre, notas) 
         VALUES ('VENTA', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          d.producto_id,
          d.cantidad,
          d.costo_unitario,
          d.precio_unitario,
          d.subtotal,
          facturaNum,
          userId && !isNaN(Number(userId)) ? Number(userId) : null,
          userName || 'Cajero',
          `Venta Mostrador ${paymentMethod || 'Efectivo'}`
        ]
      );
    }

    // Confirmar transacción
    await connection.commit();

    res.status(201).json({
      mensaje: '¡Venta procesada exitosamente con control de concurrencia!',
      ventaId,
      invoiceNumber: facturaNum,
      numero_factura: facturaNum,
      totalAmount: totalVenta,
      detalles: detallesProcesados
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error en transacción de venta:', error.message);
    res.status(400).json({ mensaje: `Error en transacción: ${error.message}` });
  } finally {
    connection.release();
  }
});

// Listar ventas procesadas
app.get('/api/sales', async (req, res) => {
  try {
    const [ventas] = await db.query(`
      SELECT v.*, u.nombre as vendedor_nombre 
      FROM ventas v 
      LEFT JOIN usuarios u ON v.usuario_id = u.id 
      ORDER BY v.id DESC LIMIT 50
    `);
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar historial de ventas' });
  }
});

// ==========================================
// 8. COMPRAS (ENTRADAS DE MERCANCÍA)
// ==========================================
app.post('/api/compras', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { productId, quantity, unitCost, invoiceNumber, supplierName, userId, userName, notes } = req.body;
    const cant = Number(quantity);

    if (!productId || cant <= 0) {
      return res.status(400).json({ mensaje: 'Producto y cantidad válida requeridos.' });
    }

    await connection.beginTransaction();

    const [prods] = await connection.query('SELECT stock_actual, stock_maximo, nombre, precio_venta FROM productos WHERE id = ? FOR UPDATE', [productId]);
    if (prods.length === 0) throw new Error('Producto no encontrado');

    const prod = prods[0];
    if (prod.stock_actual + cant > (prod.stock_maximo || 1000)) {
      throw new Error(`Se superaría el límite de stock máximo (${prod.stock_maximo || 1000} un.). Stock actual: ${prod.stock_actual}`);
    }

    await connection.query('UPDATE productos SET stock_actual = stock_actual + ?, precio_compra = ? WHERE id = ?', [cant, unitCost || 0, productId]);

    const compNum = invoiceNumber || `FAC-PROV-${Math.floor(1000 + Math.random() * 9000)}`;

    await connection.query(
      `INSERT INTO movimientos_inventario 
       (tipo, producto_id, cantidad, costo_unitario, precio_unitario, total, numero_comprobante, usuario_id, usuario_nombre, notas) 
       VALUES ('COMPRA', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        cant,
        unitCost || 0,
        prod.precio_venta || 0,
        cant * (unitCost || 0),
        compNum,
        userId && !isNaN(Number(userId)) ? Number(userId) : null,
        userName || 'Administrador',
        notes || `Compra a proveedor ${supplierName || 'General'}`
      ]
    );

    await connection.commit();
    res.status(201).json({ mensaje: 'Entrada de mercancía registrada exitosamente' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ mensaje: error.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// 9. DEVOLUCIONES Y MERMAS
// ==========================================
app.post('/api/devoluciones', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { originalInvoiceNumber, productId, quantity, reason, disposition, customerName, customerEmail, notes, registeredBy } = req.body;
    const cant = Number(quantity) || 1;

    await connection.beginTransaction();

    // Guardar devolución
    await connection.query(
      `INSERT INTO devoluciones (numero_factura, producto_id, cantidad, motivo, disposicion, cliente_nombre, cliente_correo, notas, registrado_por) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [originalInvoiceNumber, productId, cant, reason, disposition, customerName, customerEmail, notes, registeredBy]
    );

    // Si la disposición es reingreso, sumamos al stock
    if (disposition === 'reingreso_stock') {
      await connection.query('UPDATE productos SET stock_actual = stock_actual + ? WHERE id = ?', [cant, productId]);
    }

    // Auditoría Kardex
    const tipoMov = disposition === 'reingreso_stock' ? 'DEVOLUCION_REINGRESO' : 'DEVOLUCION_MERMA';
    await connection.query(
      `INSERT INTO movimientos_inventario (tipo, producto_id, cantidad, total, numero_comprobante, usuario_nombre, notas) 
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [tipoMov, productId, cant, originalInvoiceNumber, registeredBy || 'Administrador', notes || reason]
    );

    await connection.commit();
    res.status(201).json({ mensaje: 'Devolución procesada correctamente' });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ mensaje: error.message });
  } finally {
    connection.release();
  }
});

// Listar devoluciones
app.get('/api/devoluciones', async (req, res) => {
  try {
    const [devs] = await db.query(`
      SELECT d.*, p.nombre as producto_nombre, p.codigo_barras 
      FROM devoluciones d 
      LEFT JOIN productos p ON d.producto_id = p.id 
      ORDER BY d.id DESC
    `);
    res.json(devs);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar devoluciones' });
  }
});

// ==========================================
// 10. HISTORIAL KARDEX & AUDITORÍA DE MOVIMIENTOS
// ==========================================
app.get('/api/movimientos', async (req, res) => {
  try {
    const [movs] = await db.query(`
      SELECT m.*, p.nombre as producto_nombre, p.codigo_barras 
      FROM movimientos_inventario m 
      LEFT JOIN productos p ON m.producto_id = p.id 
      ORDER BY m.id DESC LIMIT 100
    `);

    const formatted = movs.map(m => ({
      id: `MOV-${m.id}`,
      timestamp: m.fecha,
      type: m.tipo,
      invoiceNumber: m.numero_comprobante,
      userName: m.usuario_nombre || 'Sistema',
      userRole: 'Admin',
      totalAmount: Number(m.total) || 0,
      notes: m.notas,
      items: [
        {
          productId: String(m.producto_id),
          barcode: m.codigo_barras || 'N/A',
          productName: m.producto_nombre || 'Producto General',
          quantity: m.cantidad,
          unitCost: Number(m.costo_unitario) || 0,
          unitPrice: Number(m.precio_unitario) || 0
        }
      ]
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar movimientos' });
  }
});

// ==========================================
// 11. DASHBOARD, ALERTAS DE STOCK Y REPORTES (SPRINT 3 - HU-004)
// ==========================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [prodStats] = await db.query(`
      SELECT 
        COUNT(*) as totalReferencias,
        COALESCE(SUM(stock_actual), 0) as totalUnidades,
        COALESCE(SUM(stock_actual * precio_compra), 0) as costoTotalInventario,
        COALESCE(SUM(stock_actual * precio_venta), 0) as valorTotalInventario,
        SUM(CASE WHEN stock_actual <= stock_minimo THEN 1 ELSE 0 END) as productosAlertaBajo,
        SUM(CASE WHEN stock_actual = 0 THEN 1 ELSE 0 END) as productosAgotados
      FROM productos 
      WHERE activo = 1
    `);

    const [salesToday] = await db.query(`
      SELECT 
        COUNT(*) as totalVentasHoy,
        COALESCE(SUM(total), 0) as ingresosHoy
      FROM ventas 
      WHERE DATE(fecha_venta) = CURDATE()
    `);

    const [topProducts] = await db.query(`
      SELECT p.nombre, p.codigo_barras, SUM(dv.cantidad) as totalVendido, SUM(dv.cantidad * dv.precio_unitario) as totalGenerado
      FROM detalle_ventas dv
      JOIN productos p ON dv.producto_id = p.id
      GROUP BY p.id, p.nombre, p.codigo_barras
      ORDER BY totalVendido DESC
      LIMIT 5
    `);

    res.json({
      resumen: {
        ...prodStats[0],
        ...salesToday[0]
      },
      topProductos: topProducts
    });
  } catch (error) {
    console.error('Error stats:', error);
    res.status(500).json({ mensaje: 'Error al generar estadísticas' });
  }
});

// ==========================================
// 12. INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor TecNova ejecutándose en http://localhost:${PORT}`);
});