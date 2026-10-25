import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  RotateCcw, 
  History, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  BellRing,
  Store
} from 'lucide-react';
import { User, Product } from '../types/inventory';
import { getEffectiveMinStock } from '../utils/inventoryUtils';

interface NavbarProps {
  currentUser: User;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  products: Product[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onLogout,
  products
}) => {
  // Count low stock items for visual alert badge
  const lowStockCount = products.filter(
    p => p.status === 'active' && p.stock <= getEffectiveMinStock(p)
  ).length;

  const isAdmin = currentUser.role === 'Admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roleReq: 'all' },
    { id: 'pos', label: 'Terminal de Ventas', icon: ShoppingCart, roleReq: 'all' },
    { id: 'catalog', label: 'Catálogo de Productos', icon: Package, roleReq: 'all' },
    { id: 'purchases', label: 'Compras (Entradas)', icon: Truck, roleReq: 'Admin' },
    { id: 'returns', label: 'Devoluciones y Mermas', icon: RotateCcw, roleReq: 'Admin' },
    { id: 'history', label: 'Historial de Movimientos', icon: History, roleReq: 'Admin' },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">TecNova</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium">v2.4</span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Control de Inventario & Punto de Venta</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              if (item.roleReq === 'Admin' && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {item.id === 'catalog' && lowStockCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {/* Low stock quick notification button */}
            {lowStockCount > 0 && (
              <button
                onClick={() => onSelectTab('dashboard')}
                title={`${lowStockCount} productos agotándose`}
                className="relative p-2 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer"
              >
                <BellRing className="w-5 h-5 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold rounded-full bg-rose-500 text-white flex items-center justify-center">
                  {lowStockCount}
                </span>
              </button>
            )}

            {/* User Badge */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl">
              <div className={`p-1.5 rounded-lg ${isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name}</p>
                <p className={`text-[10px] font-bold uppercase tracking-wider leading-tight mt-0.5 ${
                  isAdmin ? 'text-purple-400' : 'text-emerald-400'
                }`}>
                  Rol: {currentUser.role}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center overflow-x-auto py-2 space-x-1 border-t border-slate-800">
          {navItems.map((item) => {
            if (item.roleReq === 'Admin' && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
