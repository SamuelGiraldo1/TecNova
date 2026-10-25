import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function initDatabase() {
  console.log('🔄 Conectando a MySQL tecnova_db...');
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '120140213.s',
    database: 'tecnova_db'
  });

  console.log('✅ Conexión establecida.');

  // Helper function to safely add column if not exists
  const addColumnIfNotExists = async (table, column, definition) => {
    try {
      const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
      if (cols.length === 0) {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`➕ Columna agregada: ${table}.${column}`);
      } else {
        console.log(`✔ Columna existente: ${table}.${column}`);
      }
    } catch (err) {
      console.warn(`Aviso en ${table}.${column}:`, err.message);
    }
  };

  // 1. Ampliar tabla productos para soporte total del catálogo y POS
  await addColumnIfNotExists('productos', 'marca', 'VARCHAR(100) DEFAULT "Genérico"');
  await addColumnIfNotExists('productos', 'modelo', 'VARCHAR(100) DEFAULT "N/A"');
  await addColumnIfNotExists('productos', 'velocidad', 'ENUM("fast", "medium", "slow") DEFAULT "medium"');
  await addColumnIfNotExists('productos', 'tiempo_entrega', 'VARCHAR(50) DEFAULT "3 días hábiles"');
  await addColumnIfNotExists('productos', 'activo', 'TINYINT(1) DEFAULT 1');
  await addColumnIfNotExists('productos', 'imagen_url', 'TEXT');
  await addColumnIfNotExists('productos', 'stock_maximo', 'INT DEFAULT 1000');
  await addColumnIfNotExists('productos', 'requiere_serie', 'TINYINT(1) DEFAULT 0');

  // 2. Ampliar tabla ventas para trazabilidad de comprobante fiscal
  await addColumnIfNotExists('ventas', 'numero_factura', 'VARCHAR(50)');
  await addColumnIfNotExists('ventas', 'cliente_nombre', 'VARCHAR(150) DEFAULT "Cliente Mostrador"');
  await addColumnIfNotExists('ventas', 'metodo_pago', 'VARCHAR(50) DEFAULT "Efectivo"');
  await addColumnIfNotExists('ventas', 'subtotal', 'DECIMAL(12,2) DEFAULT 0');
  await addColumnIfNotExists('ventas', 'iva', 'DECIMAL(12,2) DEFAULT 0');
  await addColumnIfNotExists('ventas', 'descuento', 'DECIMAL(12,2) DEFAULT 0');

  // 3. Crear tabla movimientos_inventario (Auditoría Kardex - Trazabilidad HU-003)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS movimientos_inventario (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tipo ENUM('VENTA', 'COMPRA', 'AJUSTE_MANUAL', 'DEVOLUCION_REINGRESO', 'DEVOLUCION_MERMA') NOT NULL,
      producto_id INT,
      cantidad INT NOT NULL,
      costo_unitario DECIMAL(12,2) DEFAULT 0,
      precio_unitario DECIMAL(12,2) DEFAULT 0,
      total DECIMAL(12,2) NOT NULL,
      numero_comprobante VARCHAR(50),
      usuario_id INT,
      usuario_nombre VARCHAR(100),
      notas TEXT,
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Tabla movimientos_inventario verificada.');

  // 4. Crear tabla devoluciones (Garantías & Mermas)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS devoluciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      numero_factura VARCHAR(50) NOT NULL,
      producto_id INT,
      cantidad INT NOT NULL,
      motivo VARCHAR(100) NOT NULL,
      disposicion ENUM('reingreso_stock', 'merma') NOT NULL,
      cliente_nombre VARCHAR(150),
      cliente_correo VARCHAR(150),
      notas TEXT,
      registrado_por VARCHAR(100),
      fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log('✅ Tabla devoluciones verificada.');

  // 5. Configurar usuarios iniciales por defecto (Admin y Cajero)
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin123!', salt);
  const cajeroHash = await bcrypt.hash('Cajero123!', salt);

  // Asegurar admin@tecnova.com
  const [admins] = await connection.query('SELECT * FROM usuarios WHERE correo = ? OR email = ?', ['admin@tecnova.com', 'admin@tecnova.com']);
  if (admins.length === 0) {
    await connection.query(
      'INSERT INTO usuarios (nombre, correo, email, password, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)',
      ['Administrador TecNova', 'admin@tecnova.com', 'admin@tecnova.com', adminHash, adminHash, 'ADMIN']
    );
    console.log('👤 Usuario Administrador creado: admin@tecnova.com / Admin123!');
  } else {
    await connection.query(
      'UPDATE usuarios SET password = ?, password_hash = ?, rol = "ADMIN" WHERE id = ?',
      [adminHash, adminHash, admins[0].id]
    );
    console.log('👤 Contraseña de admin@tecnova.com actualizada a: Admin123!');
  }

  // Asegurar cajero@tecnova.com
  const [cajeros] = await connection.query('SELECT * FROM usuarios WHERE correo = ? OR email = ?', ['cajero@tecnova.com', 'cajero@tecnova.com']);
  if (cajeros.length === 0) {
    await connection.query(
      'INSERT INTO usuarios (nombre, correo, email, password, password_hash, rol) VALUES (?, ?, ?, ?, ?, ?)',
      ['Carlos Andrés (Cajero)', 'cajero@tecnova.com', 'cajero@tecnova.com', cajeroHash, cajeroHash, 'cajero']
    );
    console.log('👤 Usuario Cajero creado: cajero@tecnova.com / Cajero123!');
  } else {
    await connection.query(
      'UPDATE usuarios SET password = ?, password_hash = ?, rol = "cajero" WHERE id = ?',
      [cajeroHash, cajeroHash, cajeros[0].id]
    );
    console.log('👤 Contraseña de cajero@tecnova.com sincronizada a: Cajero123!');
  }

  // 6. Si hay pocos productos, insertar catálogo tecnológico de muestra con código de barras y niveles de stock
  const [prodCount] = await connection.query('SELECT COUNT(*) as total FROM productos');
  if (prodCount[0].total < 5) {
    console.log('📦 Sembrando catálogo de productos de alta rotación...');
    const demoProducts = [
      ['770123456701', 'Mouse Gamer Inalámbrico Logitech G Pro X Superlight', 'Periféricos', 'Logitech', 'G-PRO-X-SL', 350000, 520000, 4, 10, 'fast', 'Logitech Colombia S.A.S.'],
      ['770123456702', 'Teclado Mecánico Redragon Kumara K552 RGB', 'Periféricos', 'Redragon', 'K552-RGB', 140000, 210000, 18, 10, 'fast', 'Importaciones Tech SAS'],
      ['770123456703', 'Monitor Gamer ASUS TUF Gaming 27" 165Hz IPS', 'Monitores', 'ASUS', 'VG279Q1A', 720000, 1050000, 3, 8, 'medium', 'ASUS Wholesale Latam'],
      ['770123456704', 'Laptop Gamer Asus TUF F15 i7 16GB RTX 3050', 'Portátiles', 'ASUS', 'FX506HF', 2900000, 3890000, 7, 5, 'medium', 'ASUS Wholesale Latam'],
      ['770123456705', 'Procesador AMD Ryzen 7 5700X 8-Cores 4.6GHz', 'Componentes', 'AMD', '100-100000926WOF', 750000, 990000, 2, 10, 'fast', 'TechData Colombia'],
      ['770123456706', 'Tarjeta Gráfica MSI GeForce RTX 4060 Ventus 2X 8G', 'Componentes', 'MSI', 'RTX-4060-V2X', 1450000, 1950000, 12, 6, 'medium', 'TechData Colombia'],
      ['770123456707', 'Audífonos Gaming Kingston HyperX Cloud II Red', 'Audio', 'HyperX', 'KHX-HSCP-RD', 260000, 380000, 3, 12, 'fast', 'Kingston Tech Latam'],
      ['770123456708', 'Disco Sólido SSD NVMe Kingston KC3000 1TB PCIe 4.0', 'Almacenamiento', 'Kingston', 'SKC3000S/1024G', 320000, 460000, 15, 8, 'fast', 'Kingston Tech Latam']
    ];

    for (const p of demoProducts) {
      await connection.query(
        `INSERT INTO productos (codigo_barras, nombre, categoria, marca, modelo, precio_compra, precio_venta, stock_actual, stock_minimo, velocidad, proveedor, activo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE stock_actual = VALUES(stock_actual)`,
        p
      );
    }
    console.log('✅ Catálogo tecnológico de demostración sembrado con éxito.');
  }

  await connection.end();
  console.log('🎉 Migración de base de datos finalizada con éxito.');
}

initDatabase().catch(err => {
  console.error('❌ Error al inicializar BD:', err);
  process.exit(1);
});
