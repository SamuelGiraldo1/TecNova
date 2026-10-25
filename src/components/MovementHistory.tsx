import React, { useState } from 'react';
import { History, Download, Search, Filter, Calendar, FileSpreadsheet, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { InventoryMovement, MovementType } from '../types/inventory';
import { formatCurrency } from '../utils/inventoryUtils';

interface MovementHistoryProps {
  movements: InventoryMovement[];
}

export const MovementHistory: React.FC<MovementHistoryProps> = ({ movements }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const filteredMovements = movements.filter(m => {
    const matchesType = selectedType === 'all' || m.type === selectedType;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (m.invoiceNumber && m.invoiceNumber.toLowerCase().includes(term)) ||
      (m.userName && m.userName.toLowerCase().includes(term)) ||
      m.items.some(i => i.productName.toLowerCase().includes(term) || i.barcode.includes(term));
    return matchesType && matchesSearch;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = ['ID Movimiento', 'Fecha/Hora', 'Tipo', 'Factura/Comprobante', 'Usuario', 'Rol', 'Total COP', 'Detalle Ítems'];
    const rows = filteredMovements.map(m => [
      m.id,
      new Date(m.timestamp).toLocaleString('es-CO'),
      m.type,
      m.invoiceNumber || 'N/A',
      m.userName,
      m.userRole,
      m.totalAmount,
      m.items.map(i => `${i.productName} (${i.quantity} un.)`).join('; ')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Movimientos_TecNova_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'VENTA':
        return { label: 'Venta (Salida)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: ArrowUpRight };
      case 'COMPRA':
        return { label: 'Compra (Entrada)', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', icon: ArrowDownLeft };
      case 'AJUSTE_MANUAL':
        return { label: 'Ajuste Manual', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: RefreshCw };
      case 'DEVOLUCION_REINGRESO':
        return { label: 'Devolución Stock', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', icon: RefreshCw };
      case 'DEVOLUCION_MERMA':
        return { label: 'Devolución Merma', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', icon: RefreshCw };
      default:
        return { label: type, color: 'bg-slate-800 text-slate-400', icon: History };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-7 h-7 text-indigo-400" />
            Historial Auditado de Movimientos
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Registro cronológico inalterable de ventas, compras, mermas y reajustes de inventario.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Reporte a CSV
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por comprobante, usuario o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
          >
            <option value="all">Todos los Tipos de Operación</option>
            <option value="VENTA">Solo Ventas (Salidas)</option>
            <option value="COMPRA">Solo Compras (Entradas)</option>
            <option value="AJUSTE_MANUAL">Ajustes Fisicos</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha & Hora</th>
                <th className="py-3.5 px-4">Tipo de Movimiento</th>
                <th className="py-3.5 px-4">Comprobante / Factura</th>
                <th className="py-3.5 px-4">Productos Involucrados</th>
                <th className="py-3.5 px-4">Usuario Operador</th>
                <th className="py-3.5 px-4 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron registros de movimiento en el historial.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const typeBadge = getTypeBadge(mov.type);
                  const Icon = typeBadge.icon;

                  return (
                    <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                        {new Date(mov.timestamp).toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${typeBadge.color}`}>
                          <Icon className="w-3 h-3" />
                          {typeBadge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        {mov.invoiceNumber || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {mov.items.map((item, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-semibold text-slate-200">{item.productName}</span>
                              <span className="text-indigo-400 font-bold ml-1.5">({item.quantity} un.)</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{mov.userName}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{mov.userRole}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100 text-sm">
                        {formatCurrency(mov.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
