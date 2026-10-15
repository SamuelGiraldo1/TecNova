import React, { useState, useRef } from 'react';
import { 
  ShoppingCart, 
  Barcode, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ScanLine, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  Send, 
  User, 
  Mail, 
  Sparkles,
  Zap,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product, User as AppUser, MovementItem, InventoryMovement } from '../types/inventory';
import { formatCurrency, getStockStatus } from '../utils/inventoryUtils';
import { ReceiptModal } from './ReceiptModal';

interface POSModuleProps {
  products: Product[];
  currentUser: AppUser;
  onCompleteSale: (movement: Omit<InventoryMovement, 'id' | 'timestamp'>) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  serialNumbers: string[];
}

export const POSModule: React.FC<POSModuleProps> = ({
  products,
  currentUser,
  onCompleteSale
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [customerEmail, setCustomerEmail] = useState('cliente@example.com');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Completed sale receipt state
  const [lastCompletedMovement, setLastCompletedMovement] = useState<InventoryMovement | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const activeProducts = products.filter(p => p.status === 'active' && p.stock > 0);

  // Handle adding product by Barcode (Scanner USB simulation)
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const product = products.find(p => p.barcode === code && p.status === 'active');
    if (!product) {
      setScanMessage({ text: `Producto con código "${code}" no encontrado o inactivo.`, type: 'error' });
      setBarcodeInput('');
      return;
    }

    if (product.stock <= 0) {
      setScanMessage({ text: `¡Atención! "${product.name}" está AGOTADO en stock.`, type: 'error' });
      setBarcodeInput('');
      return;
    }

    addToCart(product);
    setBarcodeInput('');
    setScanMessage({ text: `✓ ${product.name} agregado al carrito`, type: 'success' });
    setTimeout(() => setScanMessage(null), 2500);
  };

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        // Enforce stock availability check
        if (existing.quantity >= product.stock) {
          alert(`No puedes agregar más unidades. El stock máximo disponible es ${product.stock} un.`);
          return prevCart;
        }
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, serialNumbers: [] }];
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && newQty > product.stock) {
      alert(`Stock insuficiente. Solo quedan ${product.stock} unidades en inventario.`);
      return;
    }

    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity: newQty } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.product.sellingPrice * item.quantity), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fast Checkout (< 3 clicks requirement)
  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Build movement items
    const movementItems: MovementItem[] = cart.map(item => ({
      productId: item.product.id,
      barcode: item.product.barcode,
      productName: item.product.name,
      quantity: item.quantity,
      unitCost: item.product.purchaseCost,
      unitPrice: item.product.sellingPrice,
      serialNumbers: item.serialNumbers
    }));

    const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newMovement: Omit<InventoryMovement, 'id' | 'timestamp'> = {
      type: 'VENTA',
      items: movementItems,
      totalAmount: subtotal,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      notes: `Venta POS por ${currentUser.name}`,
      invoiceNumber: invoiceNum,
      customerName,
      customerEmail,
      paymentMethod
    };

    // Save movement & update stock
    onCompleteSale(newMovement);

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });

    const fullMovementObj: InventoryMovement = {
      ...newMovement,
      id: `MOV-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    setLastCompletedMovement(fullMovementObj);
    setIsReceiptOpen(true);
    setCart([]);
  };

  const filteredGridProducts = activeProducts.filter(p => {
    const term = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(term) || 
           p.barcode.toLowerCase().includes(term) ||
           p.brand.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-indigo-400" />
            Terminal de Ventas POS (Salida de Inventario)
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Flujo ultra-rápido (&lt; 3 clics). Descuento automático de stock y emisión de comprobantes.
          </p>
        </div>

        {/* Quick Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Escanear código de barras USB..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-900 border border-indigo-500/40 rounded-xl text-xs font-mono text-indigo-300 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md shadow-indigo-500/10"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shrink-0"
          >
            <ScanLine className="w-4 h-4" />
            Escanear
          </button>
        </form>
      </div>

      {scanMessage && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in ${
          scanMessage.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scanMessage.text}</span>
        </div>
      )}

      {/* Grid Layout: Left Product Picker, Right Cart & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Quick Picker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <input
              type="text"
              placeholder="Buscar producto por nombre, marca o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredGridProducts.map((product) => {
              const inCart = cart.find(c => c.product.id === product.id);
              const isLow = product.stock <= 5;

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                        {product.barcode}
                      </span>
                      {isLow && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          Quedan {product.stock}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-100 text-xs group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">{product.brand} • {product.category}</p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="font-extrabold text-emerald-400 text-sm">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                    <button className="px-2.5 py-1 bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" />
                      {inCart ? `(${inCart.quantity})` : 'Agregar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Cart */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" />
                <h2 className="font-bold text-white text-sm">Carrito de Compra</h2>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold">
                  {totalItemsCount} ítems
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  El carrito está vacío. Escanee un producto o selecciónelo del listado.
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-200 text-xs truncate">{product.name}</h4>
                      <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                        {formatCurrency(product.sellingPrice)} c/u
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-xs font-bold text-white w-5 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details Form */}
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Datos para Comprobante Digital (Opcional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nombre del Cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email del Cliente"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Método de Pago (1 Clic)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Efectivo')}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    paymentMethod === 'Efectivo' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Tarjeta')}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    paymentMethod === 'Tarjeta' 
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Transferencia')}
                  className={`p-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    paymentMethod === 'Transferencia' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Nequi/Transf.
                </button>
              </div>
            </div>

            {/* Total Summary & Confirm Button */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 font-medium">TOTAL A PAGAR</span>
                <span className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 hover:from-emerald-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                <Sparkles className="w-5 h-5 text-amber-300" />
                PROCESAR VENTA Y DESCONTAR STOCK
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Sale Receipt Modal */}
      {isReceiptOpen && lastCompletedMovement && (
        <ReceiptModal
          movement={lastCompletedMovement}
          onClose={() => setIsReceiptOpen(false)}
        />
      )}
    </div>
  );
};
