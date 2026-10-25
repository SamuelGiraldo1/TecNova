-- =============================================================================
-- PROYECTO: TECNOVA - SISTEMA DE CONTROL DE INVENTARIO Y PUNTO DE VENTA (POS)
-- ENTREGABLE GANTT FASE 2 - TAREA 2.1: SCRIPT SQL NORMALIZADO EN 3FN
-- Motor de Base de Datos: MySQL 8.0+ / MariaDB
-- =============================================================================

CREATE DATABASE IF NOT EXISTS tecnova_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tecnova_db;

-- -----------------------------------------------------------------------------
-- 1. TABLA: usuarios (Autenticación, JWT, Roles: Administrador / Cajero)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  password VARCHAR(255),
  rol ENUM('ADMIN', 'cajero', 'administrador') NOT NULL DEFAULT 'cajero',
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_usuarios_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. TABLA: productos (Catálogo Tecnológico, Alertas de Stock, 3FN)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo_barras VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  categoria VARCHAR(50) NOT NULL DEFAULT 'General',
  marca VARCHAR(100) DEFAULT 'Genérico',
  modelo VARCHAR(100) DEFAULT 'N/A',
  precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 5,
  stock_maximo INT NOT NULL DEFAULT 1000,
  velocidad ENUM('fast', 'medium', 'slow') DEFAULT 'medium',
  proveedor VARCHAR(100) DEFAULT 'Sin asignar',
  tiempo_entrega VARCHAR(50) DEFAULT '3 días hábiles',
  requiere_serie TINYINT(1) DEFAULT 0,
  activo TINYINT(1) DEFAULT 1,
  imagen_url TEXT,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_productos_codigo (codigo_barras),
  INDEX idx_productos_categoria (categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. TABLA: ventas (Cabecera de Transacciones POS con Concurrencia HU-003)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_factura VARCHAR(50) NOT NULL UNIQUE,
  usuario_id INT,
  cliente_nombre VARCHAR(150) DEFAULT 'Cliente Mostrador',
  correo_cliente VARCHAR(100) DEFAULT 'cliente@example.com',
  metodo_pago ENUM('Efectivo', 'Tarjeta', 'Transferencia') DEFAULT 'Efectivo',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  iva DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  descuento DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
  INDEX idx_ventas_factura (numero_factura),
  INDEX idx_ventas_fecha (fecha_venta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. TABLA: detalle_ventas (Líneas de Comprobante / Ítems Vendidos)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(12,2) NOT NULL,
  costo_unitario DECIMAL(12,2) DEFAULT 0.00,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
  INDEX idx_detalle_venta (venta_id),
  INDEX idx_detalle_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. TABLA: movimientos_inventario (Auditoría Kardex y Trazabilidad HU-003)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('VENTA', 'COMPRA', 'AJUSTE_MANUAL', 'DEVOLUCION_REINGRESO', 'DEVOLUCION_MERMA') NOT NULL,
  producto_id INT,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(12,2) DEFAULT 0.00,
  precio_unitario DECIMAL(12,2) DEFAULT 0.00,
  total DECIMAL(12,2) NOT NULL,
  numero_comprobante VARCHAR(50),
  usuario_id INT,
  usuario_nombre VARCHAR(100),
  notas TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL,
  INDEX idx_mov_fecha (fecha),
  INDEX idx_mov_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. TABLA: devoluciones (Garantías, Devoluciones y Mermas)
-- -----------------------------------------------------------------------------
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- DATOS INICIALES SEMILLA (SEED DATA)
-- =============================================================================
-- Contraseña admin: Admin123! | Contraseña cajero: Cajero123!
INSERT INTO usuarios (nombre, correo, email, password_hash, rol) VALUES
('Administrador TecNova', 'admin@tecnova.com', 'admin@tecnova.com', '$2b$10$wKlhIkgJpMfZv3Xl1g7c3e53z2j6UaWvXv2c/t0aJv4gq8z1y2hKi', 'ADMIN'),
('Carlos Andrés (Cajero)', 'cajero@tecnova.com', 'cajero@tecnova.com', '$2b$10$wKlhIkgJpMfZv3Xl1g7c3e53z2j6UaWvXv2c/t0aJv4gq8z1y2hKi', 'cajero')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);
