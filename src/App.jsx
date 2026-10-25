import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { POSModule } from './components/POSModule';
import { ProductCatalog } from './components/ProductCatalog';
import { PurchasesModule } from './components/PurchasesModule';
import { ReturnsModule } from './components/ReturnsModule';
import { MovementHistory } from './components/MovementHistory';
import { LoginModal } from './components/LoginModal';
import { StorageService } from './services/storage';
import { AuthService } from './services/auth';
import { ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Server, Database, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');

  const [products, setProducts] = useState(() => StorageService.getProducts());
  const [movements, setMovements] = useState(() => StorageService.getMovements());
  const [returns, setReturns] = useState(() => StorageService.getReturns());
  const [backendStatus, setBackendStatus] = useState('Comprobando 3 Capas...');
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Sincronizar salud de arquitectura de 3 Capas (React -> Express -> MySQL)
  const verificarConexion = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/health');
      const data = await res.json();
      if (res.ok && data.estado === 'ONLINE') {
        setIsBackendOnline(true);
        setBackendStatus('ONLINE: React ⇄ Express ⇄ MySQL (3 Capas)');
      } else {
        setIsBackendOnline(false);
        setBackendStatus('Backend con aviso: ' + (data.mensaje || 'Error'));
      }
    } catch {
      setIsBackendOnline(false);
      setBackendStatus('Modo Offline: Usando StorageService local');
    }
  };

  // 2. Cargar datos remotos desde Express/MySQL con respaldo local
  const sincronizarDatos = async () => {
    setIsSyncing(true);
    try {
      // Cargar productos
      const resProd = await fetch('http://localhost:5000/api/productos?includeInactive=true');
      if (resProd.ok) {
        const prods = await resProd.json();
        if (Array.isArray(prods) && prods.length > 0) {
          setProducts(prods);
          StorageService.saveProducts(prods);
        }
      }

      // Cargar movimientos auditados (Kardex)
      const resMov = await fetch('http://localhost:5000/api/movimientos');
      if (resMov.ok) {
        const movs = await resMov.json();
        if (Array.isArray(movs) && movs.length > 0) {
          setMovements(movs);
          StorageService.saveMovements(movs);
        }
      }

      // Cargar devoluciones
      const resDev = await fetch('http://localhost:5000/api/devoluciones');
      if (resDev.ok) {
        const devs = await resDev.json();
        if (Array.isArray(devs)) {
          setReturns(devs);
          StorageService.saveReturns(devs);
        }
      }
    } catch (err) {
      console.warn('Usando datos de respaldo local:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    verificarConexion();
    sincronizarDatos();
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  // ==========================================
  // OPERACIONES DE PRODUCTOS (CRUD)
  // ==========================================
  const handleAddProduct = async (newProdData) => {
    // 1. Enviar al Backend MySQL
    try {
      const res = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProdData)
      });
      if (res.ok) {
        const data = await res.json();
        const createdProduct = {
          ...newProdData,
          id: String(data.id || Date.now()),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const updated = [createdProduct, ...products];
        setProducts(updated);
        StorageService.saveProducts(updated);
        return;
      }
    } catch (err) {
      console.warn('Error al guardar en backend, guardando localmente:', err);
    }

    // Fallback local
    const fallbackProd = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [fallbackProd, ...products];
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleUpdateProduct = async (updatedProduct) => {
    try {
      await fetch(`http://localhost:5000/api/productos/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
    } catch (err) {
      console.warn('Actualización local:', err);
    }

    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await fetch(`http://localhost:5000/api/productos/${productId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Desactivación local:', err);
    }

    const updated = products.map(p => p.id === productId ? { ...p, status: 'inactive' } : p);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  const handleRestoreProduct = async (productId) => {
    try {
      await fetch(`http://localhost:5000/api/productos/${productId}/restore`, {
        method: 'PATCH'
      });
    } catch (err) {
      console.warn('Restauración local:', err);
    }

    const updated = products.map(p => p.id === productId ? { ...p, status: 'active' } : p);
    setProducts(updated);
    StorageService.saveProducts(updated);
  };

  // ==========================================
  // OPERACIONES POS & VENTAS (HU-003)
  // Transacción con control de concurrencia
  // ==========================================
  const handleCompleteSale = async (movementData) => {
    try {
      const res = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData)
      });
      if (res.ok) {
        // Venta procesada en MySQL exitosamente
        sincronizarDatos();
        return;
      }
    } catch (err) {
      console.warn('Procesando venta en modo de contingencia local:', err);
    }

    // Rebajar stock en memoria y registrar movimiento localmente
    const updatedProducts = products.map(p => {
      const soldItem = movementData.items.find(i => i.productId === p.id);
      if (soldItem) {
        return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      }
      return p;
    });

    const fullMovement = {
      ...movementData,
      id: `MOV-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    const updatedMovements = [fullMovement, ...movements];

    setProducts(updatedProducts);
    setMovements(updatedMovements);
    StorageService.saveProducts(updatedProducts);
    StorageService.saveMovements(updatedMovements);
  };

  // ==========================================
  // OPERACIONES DE COMPRAS (REABASTECIMIENTO)
  // ==========================================
  const handleAddPurchase = async (purchaseMovement) => {
    try {
      const item = purchaseMovement.items[0];
      await fetch('http://localhost:5000/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          invoiceNumber: purchaseMovement.invoiceNumber,
          notes: purchaseMovement.notes,
          userId: currentUser?.id,
          userName: currentUser?.name
        })
      });
      sincronizarDatos();
      return;
    } catch (err) {
      console.warn('Compra registrada localmente:', err);
    }

    // Actualización local
    const item = purchaseMovement.items[0];
    const updatedProducts = products.map(p => {
      if (p.id === item.productId) {
        return { ...p, stock: Math.min(1000, p.stock + item.quantity), purchaseCost: item.unitCost };
      }
      return p;
    });

    const fullMovement = {
      ...purchaseMovement,
      id: `MOV-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setProducts(updatedProducts);
    setMovements([fullMovement, ...movements]);
    StorageService.saveProducts(updatedProducts);
    StorageService.saveMovements([fullMovement, ...movements]);
  };

  // ==========================================
  // OPERACIONES DE DEVOLUCIONES Y MERMAS
  // ==========================================
  const handleAddReturn = async (returnData) => {
    try {
      await fetch('http://localhost:5000/api/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });
      sincronizarDatos();
      return;
    } catch (err) {
      console.warn('Devolución registrada localmente:', err);
    }

    const fullReturn = {
      ...returnData,
      id: `RET-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    if (returnData.disposition === 'reingreso_stock') {
      const updatedProducts = products.map(p => 
        p.id === returnData.productId ? { ...p, stock: p.stock + returnData.quantity } : p
      );
      setProducts(updatedProducts);
      StorageService.saveProducts(updatedProducts);
    }

    const updatedReturns = [fullReturn, ...returns];
    setReturns(updatedReturns);
    StorageService.saveReturns(updatedReturns);
  };

  // Si no hay usuario autenticado, desplegar pantalla de Login futurista con validación y demo rápido
  if (!currentUser) {
    return (
      <LoginModal 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          sincronizarDatos();
        }} 
      />
    );
  }

  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        products={products}
      />

      {/* Main Content Workspace */}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard
            products={products}
            movements={movements}
            currentUser={currentUser}
            onNavigate={setActiveTab}
          />
        )}

        {/* TAB: TERMINAL POS (VENTAS) */}
        {activeTab === 'pos' && (
          <POSModule
            products={products}
            currentUser={currentUser}
            onCompleteSale={handleCompleteSale}
          />
        )}

        {/* TAB: CATÁLOGO DE PRODUCTOS */}
        {activeTab === 'catalog' && (
          <ProductCatalog
            products={products}
            currentUser={currentUser}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRestoreProduct={handleRestoreProduct}
          />
        )}

        {/* TAB: COMPRAS / ENTRADAS (RESTRINGIDO A ADMIN) */}
        {activeTab === 'purchases' && (
          isAdmin ? (
            <PurchasesModule
              products={products}
              currentUser={currentUser}
              onAddPurchase={handleAddPurchase}
            />
          ) : (
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Módulo Protegido por Roles</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El módulo de <strong className="text-slate-200">Entradas de Mercancía (Compras)</strong> está reservado exclusivamente para usuarios con rol <strong className="text-purple-400">Administrador</strong>.
              </p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-600/20"
              >
                Cambiar a Cuenta de Administrador
              </button>
            </div>
          )
        )}

        {/* TAB: DEVOLUCIONES & MERMAS (RESTRINGIDO A ADMIN) */}
        {activeTab === 'returns' && (
          isAdmin ? (
            <ReturnsModule
              products={products}
              returns={returns}
              currentUser={currentUser}
              onAddReturn={handleAddReturn}
            />
          ) : (
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Módulo Protegido por Roles</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El registro y auditoría de <strong className="text-slate-200">Garantías y Mermas</strong> requiere permisos de <strong className="text-purple-400">Administrador</strong>.
              </p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-600/20"
              >
                Cambiar a Cuenta de Administrador
              </button>
            </div>
          )
        )}

        {/* TAB: HISTORIAL AUDITADO KARDEX (RESTRINGIDO A ADMIN) */}
        {activeTab === 'history' && (
          isAdmin ? (
            <MovementHistory
              movements={movements}
            />
          ) : (
            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-2xl">
              <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Módulo Protegido por Roles</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El <strong className="text-slate-200">Historial de Auditoría Kardex y Exportación</strong> requiere privilegios de <strong className="text-purple-400">Administrador</strong>.
              </p>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-purple-600/20"
              >
                Cambiar a Cuenta de Administrador
              </button>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <p>
          ⚡ <strong className="text-slate-400">TecNova v2.4 Pro</strong> — Sistema de Control de Inventario y Ventas Concurrente.
        </p>
      </footer>
    </div>
  );
}