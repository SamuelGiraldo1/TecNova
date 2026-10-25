import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Barcode, 
  DollarSign, 
  Building2, 
  AlertCircle, 
  Check, 
  X, 
  Zap,
  Tag,
  ScanLine,
  Filter,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { Product, User, SalesVelocity } from '../types/inventory';
import { formatCurrency, getStockStatus, getEffectiveMinStock, generateBarcodeSvg } from '../utils/inventoryUtils';

interface ProductCatalogProps {
  products: Product[];
  currentUser: User;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void; // Logical delete
  onRestoreProduct: (productId: string) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestoreProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    brand: '',
    model: '',
    category: 'Periféricos',
    purchaseCost: 0,
    sellingPrice: 0,
    stock: 10,
    minStock: 10,
    maxStock: 1000,
    velocity: 'medium' as SalesVelocity,
    supplier: '',
    leadTime: '3 días hábiles',
    serialNumberRequired: false,
    imageUrl: ''
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  const isAdmin = currentUser.role === 'Admin';

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filtering products
  const filteredProducts = products.filter(p => {
    const matchesStatus = showInactive ? true : p.status === 'active';
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      p.name.toLowerCase().includes(term) ||
      p.barcode.toLowerCase().includes(term) ||
      p.brand.toLowerCase().includes(term) ||
      p.model.toLowerCase().includes(term) ||
      p.supplier.toLowerCase().includes(term);
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      barcode: '770' + Math.floor(100000000 + Math.random() * 900000000), // Random barcode seed
      name: '',
      brand: '',
      model: '',
      category: categories[0] || 'Periféricos',
      purchaseCost: 0,
      sellingPrice: 0,
      stock: 10,
      minStock: 10,
      maxStock: 1000,
      velocity: 'medium',
      supplier: 'TechData Colombia S.A.S.',
      leadTime: '3 días hábiles',
      serialNumberRequired: false,
      imageUrl: ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      model: product.model,
      category: product.category,
      purchaseCost: product.purchaseCost,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock || 1000,
      velocity: product.velocity,
      supplier: product.supplier,
      leadTime: product.leadTime || '3 días hábiles',
      serialNumberRequired: product.serialNumberRequired,
      imageUrl: product.imageUrl || ''
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('La imagen no debe superar los 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Barcode Scanner Reading Simulation (Tarea 2.2)
  const handleSimulateBarcodeScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      const generatedCode = '770' + Math.floor(100000000 + Math.random() * 900000000);
      setFormData(prev => ({ ...prev, barcode: generatedCode }));
      setIsSimulatingScan(false);
    }, 600);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation (Non-Functional Requirement: Data Integrity)
    if (!formData.barcode.trim()) {
      setFormError('El código de barras es obligatorio.');
      return;
    }
    if (!formData.name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }
    if (formData.sellingPrice <= 0) {
      setFormError('El precio de venta debe ser mayor a 0.');
      return;
    }
    if (formData.purchaseCost < 0 || formData.stock < 0) {
      setFormError('No se permiten valores negativos en costo ni stock.');
      return;
    }
    if (formData.stock > 1000) {
      setFormError('El stock no puede superar el límite máximo configurado (1000 unidades).');
      return;
    }
    if (formData.sellingPrice < formData.purchaseCost && isAdmin) {
      setFormError('Advertencia de margen: El precio de venta no puede ser menor al costo de compra.');
      return;
    }

    // Check unique barcode collision
    const existingBarcode = products.find(
      p => p.barcode === formData.barcode.trim() && p.id !== editingProduct?.id
    );
    if (existingBarcode) {
      setFormError(`El código de barras "${formData.barcode}" ya pertenece a otro producto (${existingBarcode.name}).`);
      return;
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddProduct({
        ...formData,
        status: 'active'
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-400" />
            Catálogo Integral de Productos
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Gestión de artículos tecnológicos, precios, códigos de barra y límites de inventario.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto (Alta)
          </button>
        )}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código de barras, nombre, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Show Inactive Toggle */}
          {isAdmin && (
            <button
              onClick={() => setShowInactive(!showInactive)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border cursor-pointer ${
                showInactive 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {showInactive ? 'Viendo Inactivos (Eliminados)' : 'Ver Inactivos'}
            </button>
          )}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Código de Barras</th>
                <th className="py-3.5 px-4">Producto & Especificaciones</th>
                <th className="py-3.5 px-4">Proveedor</th>
                <th className="py-3.5 px-4 text-center">Rotación</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Costo Compra</th>}
                <th className="py-3.5 px-4 text-right">Precio Venta</th>
                <th className="py-3.5 px-4 text-center">Stock Actual</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                {isAdmin && <th className="py-3.5 px-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 7} className="py-12 text-center text-slate-500">
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stockInfo = getStockStatus(product);
                  const isInactive = product.status === 'inactive';

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isInactive ? 'opacity-50 bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-300">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="w-4 h-4 text-indigo-400 shrink-0" />
                          {product.barcode}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name} 
                              className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-5 h-5 text-indigo-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-100">{product.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{product.brand} - {product.model}</span>
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium">
                                {product.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">{product.supplier}</div>
                        <div className="text-[10px] text-slate-500">Entrega: {product.leadTime}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          product.velocity === 'fast' 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : product.velocity === 'medium'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {product.velocity === 'fast' ? '⚡ Rápida' : product.velocity === 'medium' ? 'Media' : 'Lenta'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right font-medium text-slate-400">
                          {formatCurrency(product.purchaseCost)}
                        </td>
                      )}

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400 text-sm">
                        {formatCurrency(product.sellingPrice)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="font-extrabold text-sm">{product.stock} un.</div>
                        <div className="text-[10px] text-slate-500">Mín: {getEffectiveMinStock(product)} | Máx: 1000</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isInactive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            Eliminado (Inactivo)
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${stockInfo.badgeColor}`}>
                            {stockInfo.label}
                          </span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!isInactive ? (
                              <>
                                <button
                                  onClick={() => handleOpenEditModal(product)}
                                  title="Modificar Detalles"
                                  className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => onDeleteProduct(product.id)}
                                  title="Eliminación Lógica"
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => onRestoreProduct(product.id)}
                                title="Restaurar Producto"
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Restaurar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD Product Modal (Alta / Modificación) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-400" />
                {editingProduct ? 'Modificar Producto Tecnológico' : 'Alta de Nuevo Producto Tecnológico'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Barcode & Reader Simulator Section */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Barcode className="w-4 h-4" />
                    Código de Barras (Obligatorio)
                  </label>
                  <button
                    type="button"
                    onClick={handleSimulateBarcodeScan}
                    disabled={isSimulatingScan}
                    className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ScanLine className={`w-3.5 h-3.5 ${isSimulatingScan ? 'animate-spin' : ''}`} />
                    {isSimulatingScan ? 'Escaneando...' : 'Escanear con Lector'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Escanee o ingrese código..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {formData.barcode && (
                  <div className="mt-2" dangerouslySetInnerHTML={{ __html: generateBarcodeSvg(formData.barcode) }} />
                )}
              </div>

              {/* Image Upload Zone (HU-002 / Tarea 4.4) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Fotografía / Imagen del Producto</label>
                <div className="flex items-center gap-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  {formData.imageUrl ? (
                    <div className="relative">
                      <img src={formData.imageUrl} alt="Preview" className="w-16 h-16 object-cover rounded-lg border border-slate-700 shadow-md" />
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 rounded-full text-white text-[10px] flex items-center justify-center cursor-pointer shadow"
                        title="Quitar imagen"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-800 border border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                      <span className="text-[9px] mt-1 font-medium">Sin imagen</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      Cargar foto desde equipo
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange} 
                        className="hidden" 
                      />
                    </label>
                    <input 
                      type="url" 
                      placeholder="O ingrese URL pública de imagen (https://...)" 
                      value={formData.imageUrl} 
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} 
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nombre Completo del Producto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mouse Gamer Inalámbrico Logitech G Pro X"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Marca</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Logitech, ASUS, Kingston"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Modelo / Referencia</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. G-PRO-X-SL"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Periféricos">Periféricos</option>
                    <option value="Laptops">Laptops</option>
                    <option value="Monitores">Monitores</option>
                    <option value="Componentes">Componentes</option>
                    <option value="Audio">Audio</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Mobiliario">Mobiliario Gamer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Velocidad de Rotación (Venta)</label>
                  <select
                    value={formData.velocity}
                    onChange={(e) => setFormData({ ...formData, velocity: e.target.value as SalesVelocity })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="fast">⚡ Alta Rotación (Se vende rápido)</option>
                    <option value="medium">Media Rotación</option>
                    <option value="slow">Lenta Rotación</option>
                  </select>
                </div>
              </div>

              {/* Pricing & Stock Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Costo Compra (Proveedor)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.purchaseCost}
                    onChange={(e) => setFormData({ ...formData, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-400 mb-1">Precio Venta (Público)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Stock Inicial (Máx 1000)</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Supplier & Lead Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Proveedor Oficial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. TechData Colombia S.A.S."
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tiempo Entrega Proveedor (Lead Time)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 3 días hábiles"
                    value={formData.leadTime}
                    onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="serialRequired"
                  checked={formData.serialNumberRequired}
                  onChange={(e) => setFormData({ ...formData, serialNumberRequired: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <label htmlFor="serialRequired" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Requiere registro de Número de Serie (N/S) para validación de Garantía
                </label>
              </div>

              {/* Form Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
