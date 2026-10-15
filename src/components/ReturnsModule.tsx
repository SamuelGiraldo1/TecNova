import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert, FileText, Plus, User, Mail } from 'lucide-react';
import { Product, ProductReturn, ReturnReason, User as AppUser } from '../types/inventory';
import { formatCurrency } from '../utils/inventoryUtils';

interface ReturnsModuleProps {
  products: Product[];
  returns: ProductReturn[];
  currentUser: AppUser;
  onAddReturn: (returnRecord: Omit<ProductReturn, 'id' | 'timestamp'>) => void;
}

export const ReturnsModule: React.FC<ReturnsModuleProps> = ({
  products,
  returns,
  currentUser,
  onAddReturn
}) => {
  const activeProducts = products.filter(p => p.status === 'active');

  const [selectedProductId, setSelectedProductId] = useState<string>(activeProducts[0]?.id || '');
  const [originalInvoiceNumber, setOriginalInvoiceNumber] = useState('INV-2026-0102');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<ReturnReason>('Garantia_Defectuoso');
  const [disposition, setDisposition] = useState<'reingreso_stock' | 'merma'>('reingreso_stock');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedProduct) {
      setMessage({ text: 'Seleccione un producto válido.', type: 'error' });
      return;
    }
    if (!originalInvoiceNumber.trim()) {
      setMessage({ text: 'Ingrese el número de comprobante/factura de origen.', type: 'error' });
      return;
    }

    onAddReturn({
      originalInvoiceNumber,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      barcode: selectedProduct.barcode,
      quantity,
      reason,
      disposition,
      customerName: customerName || 'Cliente Mostrador',
      customerEmail: customerEmail || 'cliente@example.com',
      notes,
      registeredBy: currentUser.name
    });

    const statusText = disposition === 'reingreso_stock' 
      ? `Reingresado a inventario (+${quantity} un.)` 
      : `Registrado como MERMA / DAÑADO (No vuelve a stock)`;

    setMessage({
      text: `✓ Devolución registrada correctamente. Estado: ${statusText}`,
      type: 'success'
    });

    setNotes('');
    setCustomerName('');
    setCustomerEmail('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <RotateCcw className="w-7 h-7 text-indigo-400" />
          Módulo de Devoluciones, Garantías y Mermas
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Registro completo de devoluciones por falla, cambios o mermas con control de disposición de stock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Registration Form */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-indigo-400" />
            Registrar Nueva Devolución
          </h2>

          {message && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Producto a Devolver *</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {activeProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.barcode}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Comprobante Origen *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. INV-2026-0102"
                  value={originalInvoiceNumber}
                  onChange={(e) => setOriginalInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Cantidad *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Motivo de Devolución *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Garantia_Defectuoso">🛠️ Garantía por Defecto de Fábrica</option>
                <option value="Cambio_Producto">🔄 Cambio por otro Producto / Talla</option>
                <option value="Merma_Dañado">⚠️ Merma / Producto Dañado en Tienda</option>
                <option value="Otro">Otro Motivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Disposición de Inventario *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDisposition('reingreso_stock')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    disposition === 'reingreso_stock' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  ➕ Reingresar a Stock
                </button>
                <button
                  type="button"
                  onClick={() => setDisposition('merma')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    disposition === 'merma' 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  ❌ Registrar como Merma
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Cliente</label>
                <input
                  type="text"
                  placeholder="Cliente"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email Cliente</label>
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Detalles / Explicación del Daño</label>
              <textarea
                rows={2}
                placeholder="Describa el fallo técnico o razón del cambio..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              REGISTRAR DEVOLUCIÓN
            </button>
          </form>
        </div>

        {/* Right: History Log of Returns */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center justify-between pb-3 border-b border-slate-800">
            <span>Historial de Devoluciones y Garantías</span>
            <span className="text-xs font-normal text-slate-400">Total: {returns.length} registros</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Producto & Comprobante</th>
                  <th className="py-3 px-3">Motivo</th>
                  <th className="py-3 px-3 text-center">Disposición</th>
                  <th className="py-3 px-3">Registrado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No hay registros de devoluciones acumulados.
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                        {new Date(ret.timestamp).toLocaleDateString('es-CO')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100">{ret.productName}</div>
                        <div className="text-[10px] text-indigo-300 font-mono">Fac: {ret.originalInvoiceNumber}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                          {ret.reason}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          ret.disposition === 'reingreso_stock' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {ret.disposition === 'reingreso_stock' ? '+ Stock' : 'Merma'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{ret.registeredBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
