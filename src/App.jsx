import { useState, useEffect } from 'react';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [estadoBD, setEstadoBD] = useState('Comprobando conexión...');
  const [mensajeForm, setMensajeForm] = useState('');

  // Estado para el formulario de registro (Exigencia Semana 6 - HU-002)
  const [form, setForm] = useState({
    nombre: '',
    precio_venta: '',
    stock_actual: '',
    codigo_barras: '',
    categoria: 'General'
  });

  // 1. Verificar salud del servidor y 3 capas
  const verificarSalud = () => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setEstadoBD(data.mensaje || 'Conexión exitosa'))
      .catch(() => setEstadoBD('🔴 Error: No hay conexión con el servidor o la BD'));
  };

  // 2. Consultar productos desde MySQL
  const cargarProductos = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch('http://localhost:5000/api/productos');
      const datos = await respuesta.json();
      setProductos(Array.isArray(datos) ? datos : []);
    } catch (error) {
      console.error('Error al conectar con el backend:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    verificarSalud();
    cargarProductos();
  }, []);

  // 3. Enviar nuevo producto a la base de datos (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.precio_venta) {
      setMensajeForm('⚠️ El nombre y el precio son obligatorios');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre,
          precio: Number(form.precio_venta),
          stock: Number(form.stock_actual) || 0,
          codigo_barras: form.codigo_barras || null,
          categoria: form.categoria
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMensajeForm('✅ ¡Producto guardado exitosamente!');
        setForm({ nombre: '', precio_venta: '', stock_actual: '', codigo_barras: '', categoria: 'General' });
        cargarProductos(); // Refrescar catálogo en tiempo real
      } else {
        setMensajeForm(`❌ Error: ${data.mensaje || 'No se pudo guardar'}`);
      }
    } catch (error) {
      setMensajeForm('❌ Error de conexión al intentar guardar');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Encabezado Principal */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#111827', fontWeight: 'bold' }}>⚡ TecNova - Control de Inventario</h1>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>Gestión en tiempo real de productos y alertas de stock</p>
          </div>
          <button 
            onClick={() => { cargarProductos(); verificarSalud(); }}
            style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
          >
            🔄 Actualizar Datos
          </button>
        </header>

        {/* Indicador de Estado de Conexión de 3 Capas */}
        <div style={{ padding: '12px 16px', backgroundColor: '#ffffff', borderRadius: '8px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>Estado de Conexión (3 Capas):</span>
          <span style={{ fontSize: '14px', color: estadoBD.includes('Error') ? '#dc2626' : '#059669', fontWeight: '600' }}>
            {estadoBD}
          </span>
        </div>

        {/* Formulario de Registro de Productos (Semana 6 - HU-002) */}
        {/* Formulario de Registro de Productos con texto visible */}
<section style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', marginBottom: '28px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
  <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#111827' }}>➕ Registrar Nuevo Producto</h2>
  
  {mensajeForm && (
    <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', fontSize: '14px', backgroundColor: mensajeForm.includes('✅') ? '#ecfdf5' : '#fef2f2', color: mensajeForm.includes('✅') ? '#047857' : '#b91c1c' }}>
      {mensajeForm}
    </div>
  )}

  <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
    <input 
      type="text" 
      placeholder="Nombre del producto *" 
      value={form.nombre} 
      onChange={e => setForm({ ...form, nombre: e.target.value })} 
      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff' }}
    />
    <input 
      type="number" 
      placeholder="Precio de venta ($) *" 
      value={form.precio_venta} 
      onChange={e => setForm({ ...form, precio_venta: e.target.value })} 
      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff' }}
    />
    <input 
      type="number" 
      placeholder="Stock inicial" 
      value={form.stock_actual} 
      onChange={e => setForm({ ...form, stock_actual: e.target.value })} 
      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff' }}
    />
    <input 
      type="text" 
      placeholder="Código de barras" 
      value={form.codigo_barras} 
      onChange={e => setForm({ ...form, codigo_barras: e.target.value })} 
      style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', color: '#111827', backgroundColor: '#ffffff' }}
    />
    <button 
      type="submit" 
      style={{ gridColumn: '1 / -1', padding: '12px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
    >
      Guardar en Base de Datos
    </button>
  </form>
</section>
        {/* Estado de Carga / Tabla de Productos */}
        {cargando ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>Cargando inventario desde la base de datos...</p>
        ) : productos.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#6b7280' }}>No hay productos registrados en la base de datos.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {productos.map((prod) => {
              // Soporte para variaciones de nombres de columnas de MySQL
              const precio = prod.precio_venta ?? prod.precio ?? 0;
              const stock = prod.stock_actual ?? prod.stock ?? 0;
              const stockMinimo = prod.stock_minimo ?? 5;
              const stockBajo = stock <= stockMinimo;

              return (
                <div 
                  key={prod.id} 
                  style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    borderLeft: stockBajo ? '6px solid #ef4444' : '6px solid #10b981'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', backgroundColor: '#e5e7eb', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {prod.categoria || 'General'}
                    </span>
                    {stockBajo && (
                      <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                        ⚠️ ¡ALERTA STOCK BAJO!
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '12px 0 4px 0', fontSize: '18px', color: '#1f2937' }}>{prod.nombre}</h3>
                  <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>Cód: {prod.codigo_barras || 'N/A'}</p>

                  <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#059669' }}>
                      ${Number(precio).toLocaleString('es-CO')}
                    </span>
                    <span style={{ fontSize: '14px', color: '#4b5563' }}>
                      Stock: <strong style={{ color: stockBajo ? '#dc2626' : '#111827', fontSize: '16px' }}>{stock}</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: '#6b7280', borderTop: '1px solid #f3f4f6', paddingTop: '10px' }}>
                    Proveedor: <strong>{prod.proveedor || 'Sin asignar'}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}