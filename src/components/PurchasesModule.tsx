import React, { useState } from 'react';
import { Truck, Plus, Check, AlertCircle, Barcode, DollarSign, Boxes } from 'lucide-react';
import { Product, InventoryMovement, User } from '../types/inventory';
import { formatCurrency } from '../utils/inventoryUtils';

interface PurchasesModuleProps {
  products: Product[];
  currentUser: User;
  onAddPurchase: (movement: Omit<InventoryMovement, 'id' | 'timestamp'>) => void;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({
  products,
  currentUser,
  onAddPurchase
}) => {
  const activeProducts = products.filter(p => p.status === 'active');

  const [selectedProductId, setSelectedProductId] = useState<string>(activeProducts[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const selectedProduct = activeProducts.find(p => p.id === selectedProductId);

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const prod = activeProducts.find(p => p.id === id);
    if (prod) {
      setUnitCost(prod.purchaseCost);
      setSupplierName(prod.supplier);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedProduct) {
      setMessage({ text: 'Seleccione un producto válido.', type: 'error' });
      return;
    }
    if (quantity <= 0) {
      setMessage({ text: 'La cantidad debe ser mayor a 0.', type: 'error' });
      return;
    }
    if (selectedProduct.stock + quantity > 1000) {
      setMessage({ text: `No se puede superar el stock máximo (1000 un.). Stock actual: ${selectedProduct.stock}, intentando sumar: ${quantity}`, type: 'error' });
      return;
    }

    const totalAmount = quantity * unitCost;

    const purchaseMovement: Omit<InventoryMovement, 'id' | 'timestamp'> = {
      type: 'COMPRA',
      items: [
        {
          productId: selectedProduct.id,
          barcode: selectedProduct.barcode,
          productName: selectedProduct.name,
          quantity,
          unitCost,
          unitPrice: selectedProduct.sellingPrice
        }
      ],
      totalAmount,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      notes: notes || `Entrada de inventario por proveedor ${supplierName || selectedProduct.supplier}`,
      invoiceNumber: invoiceNumber || `FAC-PROV-${Math.floor(1000 + Math.random() * 9000)}`
    };

    onAddPurchase(purchaseMovement);
    setMessage({ text: `✓ Se han sumado ${quantity} unidades a "${selectedProduct.name}". Stock nuevo: ${selectedProduct.stock + quantity}`, type: 'success' });
    
    // Reset form
    setQuantity(10);
    setNotes('');
    setInvoiceNumber('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Truck className="w-7 h-7 text-indigo-400" />
          Registro de Compras (Entradas de Mercancía)
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Incremente el inventario disponible cuando lleguen despachos de los proveedores.
        </p>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        {message && (
          <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            message.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Seleccionar Producto del Catálogo *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {activeProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.barcode}] {p.name} - (Stock Actual: {p.stock} un.)
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Proveedor Habitual: </span>
                  <span className="font-semibold text-indigo-300">{selectedProduct.supplier}</span>
                </div>
                <div>
                  <span className="text-slate-400">Stock Actual: </span>
                  <span className="font-bold text-white">{selectedProduct.stock} un.</span>
                  <span className="text-slate-500"> (Máx: 1000)</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cantidad a Ingresar *
                </label>
                <div className="relative">
                  <Boxes className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Costo Unitario de Compra (COP) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    min="0"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Número de Factura Proveedor / Remisión
                </label>
                <input
                  type="text"
                  placeholder="Ej. FAC-PROV-9081"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Observaciones / Notas de Entrega
                </label>
                <input
                  type="text"
                  placeholder="Ej. Despacho recibido en orden"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              REGISTRAR ENTRADA Y ACTUALIZAR STOCK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
