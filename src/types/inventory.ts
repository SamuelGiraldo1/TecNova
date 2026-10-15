export type UserRole = 'Admin' | 'Vendedor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  active: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
}

export type SalesVelocity = 'fast' | 'medium' | 'slow';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  purchaseCost: number; // Costo de compra
  sellingPrice: number; // Precio de venta
  stock: number; // Stock actual
  minStock: number; // Límite mínimo para alerta
  maxStock: number; // Límite máximo (1000 unidades)
  velocity: SalesVelocity; // Rapidez de rotación
  supplier: string; // Proveedor
  leadTime: string; // Tiempo de compra/entrega (ej. '3 días', '1 semana')
  serialNumberRequired: boolean;
  status: 'active' | 'inactive'; // Eliminación lógica
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'VENTA' | 'COMPRA' | 'AJUSTE_MANUAL' | 'DEVOLUCION_REINGRESO' | 'DEVOLUCION_MERMA';

export interface MovementItem {
  productId: string;
  barcode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  serialNumbers?: string[];
}

export interface InventoryMovement {
  id: string;
  timestamp: string;
  type: MovementType;
  items: MovementItem[];
  totalAmount: number;
  userId: string;
  userName: string;
  userRole: UserRole;
  notes?: string;
  invoiceNumber?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: 'Efectivo' | 'Tarjeta' | 'Transferencia';
}

export type ReturnReason = 'Garantia_Defectuoso' | 'Cambio_Producto' | 'Merma_Dañado' | 'Otro';

export interface ProductReturn {
  id: string;
  timestamp: string;
  originalInvoiceNumber: string;
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  reason: ReturnReason;
  disposition: 'reingreso_stock' | 'merma'; // Si vuelve a inventario o es descarte
  customerName: string;
  customerEmail: string;
  notes: string;
  registeredBy: string;
}
