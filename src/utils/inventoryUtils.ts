import { Product, SalesVelocity } from '../types/inventory';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

// Determines effective low-stock threshold depending on product sales velocity
// (Rotación rápida necesita mayor colchón de stock antes de agotarse)
export function getEffectiveMinStock(product: Product): number {
  if (product.minStock && product.minStock > 0) {
    return product.minStock;
  }
  switch (product.velocity) {
    case 'fast':
      return 15; // Rotación rápida necesita stock mínimo de 15
    case 'medium':
      return 8;  // Rotación media
    case 'slow':
    default:
      return 3;  // Rotación lenta
  }
}

export type StockStatus = 'CRITICAL' | 'LOW' | 'OPTIMAL' | 'OVERSTOCK';

export function getStockStatus(product: Product): { status: StockStatus; badgeColor: string; label: string; urgency: number } {
  const min = getEffectiveMinStock(product);

  if (product.stock <= 0) {
    return { status: 'CRITICAL', badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40', label: 'Agotado (0)', urgency: 4 };
  }
  if (product.stock <= Math.ceil(min / 2)) {
    return { status: 'CRITICAL', badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse', label: `Crítico (${product.stock}/${min})`, urgency: 3 };
  }
  if (product.stock <= min) {
    return { status: 'LOW', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: `Stock Bajo (${product.stock}/${min})`, urgency: 2 };
  }
  if (product.stock >= product.maxStock * 0.9) {
    return { status: 'OVERSTOCK', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40', label: `Stock Máximo (${product.stock}/${product.maxStock})`, urgency: 0 };
  }
  return { status: 'OPTIMAL', badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', label: `Normal (${product.stock})`, urgency: 0 };
}

// Simple Barcode SVG Generator
export function generateBarcodeSvg(barcodeText: string): string {
  // Generates visual barcode SVG lines
  const lines: string[] = [];
  let x = 10;
  for (let i = 0; i < barcodeText.length; i++) {
    const charCode = barcodeText.charCodeAt(i);
    const width = (charCode % 3) + 1;
    lines.push(`<rect x="${x}" y="5" width="${width}" height="35" fill="#000" />`);
    x += width + 2;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 10} 50" class="w-full h-12">
    <rect width="100%" height="100%" fill="#ffffff" rx="4"/>
    ${lines.join('')}
    <text x="50%" y="46" font-family="monospace" font-size="9" fill="#1e293b" text-anchor="middle">${barcodeText}</text>
  </svg>`;
}
