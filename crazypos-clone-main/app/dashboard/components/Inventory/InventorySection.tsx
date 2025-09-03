'use client'
import { Product } from '@/types'

interface InventorySectionProps {
  products: Product[]
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (product: Product) => void
}

export function InventorySection({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}: InventorySectionProps) {
  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inventory Management</h2>
          <button 
            onClick={onAddProduct}
            className="rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500"
          >
            Add Product
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-600">
                <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Product</th>
                <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Price</th>
                <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Stock</th>
                <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Category</th>
                <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Barcode</th>
                <th className="text-left py-3 px-4 text-slate-900 dark:text-slate-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{product.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{product.description}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-900 dark:text-slate-100">${product.price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock < 10 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                        : product.stock < 50
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {product.stock} units
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{product.category || 'Uncategorized'}</td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{product.barcode}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onEditProduct(product)}
                        className="text-sm text-brand-700 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 font-medium"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => onDeleteProduct(product)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">No Products Yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Add your first product to start managing your inventory.</p>
              <button 
                onClick={onAddProduct}
                className="rounded-xl bg-brand-700 px-6 py-3 text-white font-medium hover:bg-brand-500"
              >
                Add First Product
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
