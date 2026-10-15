import { Product, User, InventoryMovement, ProductReturn } from '../types/inventory';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    barcode: '770123456701',
    name: 'Mouse Gamer Inalámbrico Logitech G Pro X Superlight',
    brand: 'Logitech',
    model: 'G-PRO-X-SL',
    category: 'Periféricos',
    purchaseCost: 350000,
    sellingPrice: 520000,
    stock: 5, // LOW STOCK ALERT! (minStock = 10)
    minStock: 10,
    maxStock: 1000,
    velocity: 'fast',
    supplier: 'Logitech Colombia S.A.S.',
    leadTime: '2 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-002',
    barcode: '770123456702',
    name: 'Teclado Mecánico Redragon Kumara K552 RGB',
    brand: 'Redragon',
    model: 'K552-RGB',
    category: 'Periféricos',
    purchaseCost: 140000,
    sellingPrice: 210000,
    stock: 18,
    minStock: 10,
    maxStock: 1000,
    velocity: 'fast',
    supplier: 'Importaciones Tech SAS',
    leadTime: '3 días hábiles',
    serialNumberRequired: false,
    status: 'active',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-003',
    barcode: '770123456703',
    name: 'Monitor Gamer ASUS TUF Gaming 27" 165Hz IPS',
    brand: 'ASUS',
    model: 'VG279Q1A',
    category: 'Monitores',
    purchaseCost: 720000,
    sellingPrice: 1050000,
    stock: 4, // CRITICAL STOCK! (minStock = 8)
    minStock: 8,
    maxStock: 1000,
    velocity: 'medium',
    supplier: 'ASUS Wholesale Latam',
    leadTime: '5 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-004',
    barcode: '770123456704',
    name: 'Laptop Gamer Asus TUF F15 i7 16GB RTX 3050',
    brand: 'ASUS',
    model: 'FX506HF',
    category: 'Laptops',
    purchaseCost: 2900000,
    sellingPrice: 3890000,
    stock: 7,
    minStock: 5,
    maxStock: 1000,
    velocity: 'medium',
    supplier: 'ASUS Wholesale Latam',
    leadTime: '7 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-005',
    barcode: '770123456705',
    name: 'Procesador AMD Ryzen 7 5700X 8-Cores 4.6GHz',
    brand: 'AMD',
    model: '100-100000926WOF',
    category: 'Componentes',
    purchaseCost: 750000,
    sellingPrice: 990000,
    stock: 2, // CRITICAL STOCK ALERT! (minStock = 10)
    minStock: 10,
    maxStock: 1000,
    velocity: 'fast',
    supplier: 'TechData Colombia',
    leadTime: '2 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-006',
    barcode: '770123456706',
    name: 'Tarjeta Gráfica MSI GeForce RTX 4060 Ventus 2X 8G',
    brand: 'MSI',
    model: 'RTX-4060-V2X',
    category: 'Componentes',
    purchaseCost: 1450000,
    sellingPrice: 1950000,
    stock: 12,
    minStock: 6,
    maxStock: 1000,
    velocity: 'medium',
    supplier: 'TechData Colombia',
    leadTime: '3 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-007',
    barcode: '770123456707',
    name: 'Audífonos Gaming Kingston HyperX Cloud II Red',
    brand: 'HyperX',
    model: 'KHX-HSCP-RD',
    category: 'Audio',
    purchaseCost: 260000,
    sellingPrice: 380000,
    stock: 3, // LOW STOCK ALERT! (minStock = 12)
    minStock: 12,
    maxStock: 1000,
    velocity: 'fast',
    supplier: 'Kingston Tech Latam',
    leadTime: '4 días hábiles',
    serialNumberRequired: false,
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-008',
    barcode: '770123456708',
    name: 'Disco Sólido SSD NVMe Kingston KC3000 1TB PCIe 4.0',
    brand: 'Kingston',
    model: 'SKC3000S/1024G',
    category: 'Almacenamiento',
    purchaseCost: 310000,
    sellingPrice: 440000,
    stock: 25,
    minStock: 10,
    maxStock: 1000,
    velocity: 'fast',
    supplier: 'Kingston Tech Latam',
    leadTime: '2 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-009',
    barcode: '770123456709',
    name: 'Silla Gamer Cougar Armor One Black/Orange',
    brand: 'Cougar',
    model: '3MARONXB.0001',
    category: 'Mobiliario',
    purchaseCost: 650000,
    sellingPrice: 920000,
    stock: 6,
    minStock: 3,
    maxStock: 1000,
    velocity: 'slow',
    supplier: 'Distribuidora Gamer CO',
    leadTime: '10 días hábiles',
    serialNumberRequired: false,
    status: 'active',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod-010',
    barcode: '770123456710',
    name: 'Cámara Web Logitech C920 Pro Full HD 1080p',
    brand: 'Logitech',
    model: 'C920-PRO',
    category: 'Periféricos',
    purchaseCost: 230000,
    sellingPrice: 340000,
    stock: 14,
    minStock: 8,
    maxStock: 1000,
    velocity: 'medium',
    supplier: 'Logitech Colombia S.A.S.',
    leadTime: '3 días hábiles',
    serialNumberRequired: true,
    status: 'active',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    username: 'admin',
    name: 'Administrador Principal',
    role: 'Admin',
    // SHA256 simulation hash for "Admin123!"
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    active: true,
    failedAttempts: 0,
    lockoutUntil: null
  },
  {
    id: 'usr-vendedor',
    username: 'vendedor',
    name: 'Carlos Vendedor',
    role: 'Vendedor',
    // SHA256 simulation hash for "Vendedor123!"
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    active: true,
    failedAttempts: 0,
    lockoutUntil: null
  }
];

const INITIAL_MOVEMENTS: InventoryMovement[] = [
  {
    id: 'MOV-2026-001',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: 'COMPRA',
    items: [
      {
        productId: 'prod-001',
        barcode: '770123456701',
        productName: 'Mouse Gamer Inalámbrico Logitech G Pro X Superlight',
        quantity: 10,
        unitCost: 350000,
        unitPrice: 520000
      }
    ],
    totalAmount: 3500000,
    userId: 'usr-admin',
    userName: 'Administrador Principal',
    userRole: 'Admin',
    notes: 'Reingreso stock proveedor Logitech',
    invoiceNumber: 'FAC-LOGI-8891'
  },
  {
    id: 'MOV-2026-002',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    type: 'VENTA',
    items: [
      {
        productId: 'prod-002',
        barcode: '770123456702',
        productName: 'Teclado Mecánico Redragon Kumara K552 RGB',
        quantity: 2,
        unitCost: 140000,
        unitPrice: 210000
      }
    ],
    totalAmount: 420000,
    userId: 'usr-vendedor',
    userName: 'Carlos Vendedor',
    userRole: 'Vendedor',
    notes: 'Venta presencial mostrador',
    invoiceNumber: 'INV-2026-0102',
    customerName: 'Juan Pérez',
    customerEmail: 'juan.perez@example.com',
    paymentMethod: 'Tarjeta'
  }
];

const INITIAL_RETURNS: ProductReturn[] = [
  {
    id: 'RET-2026-001',
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    originalInvoiceNumber: 'INV-2026-0089',
    productId: 'prod-007',
    productName: 'Audífonos Gaming Kingston HyperX Cloud II Red',
    barcode: '770123456707',
    quantity: 1,
    reason: 'Garantia_Defectuoso',
    disposition: 'merma',
    customerName: 'Maria Rodriguez',
    customerEmail: 'maria.rodriguez@email.com',
    notes: 'Fallo en micrófono derecho. Se envía a merma para trámite con proveedor.',
    registeredBy: 'Administrador Principal'
  }
];

const STORAGE_KEYS = {
  PRODUCTS: 'tecno_stock_products',
  USERS: 'tecno_stock_users',
  MOVEMENTS: 'tecno_stock_movements',
  RETURNS: 'tecno_stock_returns',
  CURRENT_USER: 'tecno_stock_current_user'
};

export const StorageService = {
  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },

  saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getMovements(): InventoryMovement[] {
    const data = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(data);
  },

  saveMovements(movements: InventoryMovement[]): void {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  },

  getReturns(): ProductReturn[] {
    const data = localStorage.getItem(STORAGE_KEYS.RETURNS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(INITIAL_RETURNS));
      return INITIAL_RETURNS;
    }
    return JSON.parse(data);
  },

  saveReturns(returns: ProductReturn[]): void {
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(returns));
  },

  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!data) return null;
    return JSON.parse(data);
  },

  setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(INITIAL_MOVEMENTS));
    localStorage.setItem(STORAGE_KEYS.RETURNS, JSON.stringify(INITIAL_RETURNS));
  }
};
