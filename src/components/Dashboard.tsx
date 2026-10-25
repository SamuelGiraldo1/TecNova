import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Zap, 
  ArrowUpRight, 
  Boxes,
  PlusCircle,
  Truck,
  RotateCcw
} from 'lucide-react';
import { Product, InventoryMovement, User } from '../types/inventory';
import { formatCurrency, getStockStatus, getEffectiveMinStock } from '../utils/inventoryUtils';

interface DashboardProps {
  products: Product[];
  movements: InventoryMovement[];
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  products,
  movements,
  currentUser,
  onNavigate
}) => {
  const activeProducts = products.filter(p => p.status === 'active');
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.stock, 0);
  
  const totalInventoryCost = activeProducts.reduce((sum, p) => sum + (p.stock * p.purchaseCost), 0);
  const totalInventoryValue = activeProducts.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
  
  // Low stock products based on individual rotation velocity minimums
  const lowStockProducts = activeProducts.filter(p => p.stock <= getEffectiveMinStock(p))
    .sort((a, b) => (a.stock / getEffectiveMinStock(a)) - (b.stock / getEffectiveMinStock(b)));

  // Sales today count
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesMovements = movements.filter(
    m => m.type === 'VENTA' && m.timestamp.startsWith(todayStr)
  );
  const todaySalesTotal = todaySalesMovements.reduce((sum, m) => sum + m.totalAmount, 0);

  const isAdmin = currentUser.role === 'Admin';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                ¡Hola, {currentUser.name}! 👋
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {currentUser.role}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Resumen en tiempo real del inventario y ventas de <span className="text-indigo-400 font-semibold">TecNova</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('pos')}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Nueva Venta
            </button>
            {isAdmin && (
              <button
                onClick={() => onNavigate('catalog')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                Registrar Producto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Product References */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Referencias en Catálogo</span>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">{activeProducts.length}</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <Boxes className="w-3.5 h-3.5 text-indigo-400" />
              <span>{totalStockUnits} unidades físicas totales</span>
            </div>
          </div>
        </div>

        {/* Card 2: Valoración de Inventario */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor Inventario (P. Venta)</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
              {formatCurrency(totalInventoryValue)}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
                <span>Costo base: {formatCurrency(totalInventoryCost)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Ventas Hoy */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-white tracking-tight">
              {formatCurrency(todaySalesTotal)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-300 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{todaySalesMovements.length} transacciones registradas</span>
            </div>
          </div>
        </div>

        {/* Card 4: Low Stock Alert Warning */}
        <div className={`bg-slate-900/80 border rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all ${
          lowStockProducts.length > 0 ? 'border-rose-500/40 bg-rose-950/20' : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas de Stock Bajo</span>
            <div className={`p-2.5 rounded-xl ${lowStockProducts.length > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold tracking-tight ${lowStockProducts.length > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {lowStockProducts.length}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-400">
              <span>{lowStockProducts.length > 0 ? 'Requieren reabastecimiento urgente' : 'Todo el inventario óptimo'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Widget & Fast Action Section */}
      {lowStockProducts.length > 0 && (
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Productos Agotándose o por Debajo del Límite Mínimo
                </h2>
                <p className="text-xs text-slate-400">
                  El sistema detecta automáticamente según la <span className="text-amber-400 font-semibold">velocidad de rotación</span> (Alta rotación requiere mayor stock preventivo).
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => onNavigate('purchases')}
                className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                Registrar Entrada de Compras
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((product) => {
              const status = getStockStatus(product);
              const minLimit = getEffectiveMinStock(product);
              return (
                <div 
                  key={product.id}
                  className="bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.badgeColor}`}>
                        {status.label}
                      </span>
                      {product.velocity === 'fast' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                          Alta Rotación
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-100 text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Cód: <code className="text-slate-300">{product.barcode}</code> | Proveedor: {product.supplier}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Stock Actual: </span>
                      <span className="font-extrabold text-rose-400 text-sm">{product.stock} un.</span>
                      <span className="text-slate-500"> (Mín: {minLimit})</span>
                    </div>

                    <span className="text-[11px] text-indigo-300 font-medium bg-indigo-500/10 px-2 py-1 rounded-lg">
                      Lead time: {product.leadTime}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Products & Quick Inventory View Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Vista Rápida de Existencias Tecnológicas</h2>
            <p className="text-xs text-slate-400">Mostrando artículos con stock disponible en tiempo real</p>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all cursor-pointer"
          >
            Ver Catálogo Completo ({activeProducts.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Código / Barcode</th>
                <th className="py-3 px-4">Producto & Marca</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4">Estado Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {activeProducts.slice(0, 6).map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-indigo-300">{product.barcode}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{product.name}</div>
                      <div className="text-[11px] text-slate-400">{product.brand} - {product.model}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-sm">{product.stock}</span>
                      <span className="text-slate-500 text-[10px]"> / {product.maxStock}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.badgeColor}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
