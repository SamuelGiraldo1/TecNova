import React, { useState } from 'react';
import { Printer, Mail, Download, CheckCircle, Store, X, Barcode, FileText, Send } from 'lucide-react';
import { InventoryMovement } from '../types/inventory';
import { formatCurrency, generateBarcodeSvg } from '../utils/inventoryUtils';

interface ReceiptModalProps {
  movement: InventoryMovement;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ movement, onClose }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSimulateEmail = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 no-print">
        {/* Modal Top Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            ¡Venta Registrada Exitosamente!
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Notification Toast */}
        {emailSent && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-2.5 text-xs text-emerald-300 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>
              Comprobantes enviados digitalmente a <strong>{movement.customerEmail || 'cliente@example.com'}</strong> y a <strong>administracion@tecnova.com</strong>.
            </span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-slate-400 font-mono">Factura: {movement.invoiceNumber}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateEmail}
              disabled={isSending}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              {isSending ? 'Enviando...' : 'Enviar por Email'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Comprobante
            </button>
          </div>
        </div>

        {/* Printable Ticket Receipt Container */}
        <div className="p-6 bg-slate-950 flex justify-center">
          <div className="printable-receipt w-full max-w-md bg-white text-slate-900 p-6 rounded-xl shadow-lg font-mono text-xs border border-slate-200">
            {/* Store Header */}
            <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1">
                <Store className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">TECNOVA S.A.S.</h2>
              <p className="text-[10px] text-slate-600">NIT: 901.458.729-1 • IVA Régimen Común</p>
              <p className="text-[10px] text-slate-600">CC Comercial Tecnológico Local 104</p>
              <p className="text-[10px] text-slate-600">Tel: +57 300 123 4567 • info@tecnova.com</p>
            </div>

            {/* Receipt Metadata */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">COMPROBANTE VENTA:</span>
                <span className="font-bold text-slate-900">{movement.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FECHA / HORA:</span>
                <span>{new Date(movement.timestamp).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CLIENTE:</span>
                <span className="font-semibold">{movement.customerName || 'Cliente Mostrador'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ATENDIDO POR:</span>
                <span>{movement.userName} ({movement.userRole})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FORMA DE PAGO:</span>
                <span className="font-bold text-indigo-700">{movement.paymentMethod || 'Efectivo'}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="py-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase pb-1">
                <span>CANT / DESCRIPCIÓN</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-2">
                {movement.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="font-bold text-slate-800">{item.productName}</div>
                    <div className="flex justify-between text-slate-600 text-[10px] mt-0.5">
                      <span>{item.quantity} x {formatCurrency(item.unitPrice)}</span>
                      <span className="font-bold text-slate-900">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Calculation */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(movement.totalAmount * 0.81)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA (19%):</span>
                <span>{formatCurrency(movement.totalAmount * 0.19)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL PAGADO:</span>
                <span>{formatCurrency(movement.totalAmount)}</span>
              </div>
            </div>

            {/* Barcode & Guarantee Policy */}
            <div className="pt-4 text-center space-y-2">
              <div dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(movement.invoiceNumber || 'INV-2026') }} />
              <p className="text-[9px] text-slate-500 leading-tight">
                ¡Gracias por su compra en TecNova! Conservar este comprobante para trámites de garantía (30 días).
              </p>
              <div className="text-[8px] text-slate-400 border-t border-slate-200 pt-1">
                [ COPIA DUAL: CLIENTE & CONTABILIDAD EMPRESA ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
