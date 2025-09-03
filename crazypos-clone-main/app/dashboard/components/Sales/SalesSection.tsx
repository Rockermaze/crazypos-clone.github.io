'use client'
import { useState } from 'react'
import { Product, SaleItem } from '@/types'

interface SalesSectionProps {
  products: Product[]
  cart: SaleItem[]
  onAddToCart: (product: Product) => void
  onRemoveFromCart: (productId: string) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onProcessPayment: () => void
  onClearCart: () => void
  total: number
}

export function SalesSection({
  products,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onProcessPayment,
  onClearCart,
  total
}: SalesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    return matchesSearch && matchesCategory && product.isActive
  })

  return (
    <div className="grid lg:grid-cols-3 gap-6 p-6">
      {/* Product Selection */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Product Catalog</h2>
          </div>
          
          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Accessories">Accessories</option>
              <option value="Phones">Phones</option>
              <option value="Tablets">Tablets</option>
              <option value="Laptops">Laptops</option>
              <option value="Audio">Audio</option>
            </select>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {filteredProducts.map(product => (
              <div key={product.id} className="border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</h3>
                    <p className="text-brand-700 dark:text-brand-500 font-bold">${product.price}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Stock: {product.stock}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">#{product.barcode}</p>
                  </div>
                  <button
                    onClick={() => onAddToCart(product)}
                    className="rounded-lg bg-brand-700 px-3 py-2 text-white text-sm font-medium hover:bg-brand-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Current Sale</h2>
        
        {cart.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">No items in cart</p>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {cart.map(item => (
                <div key={item.productId} className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-600">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{item.productName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">${item.unitPrice} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-slate-900 dark:text-slate-100">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemoveFromCart(item.productId)}
                      className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center text-sm text-red-600 dark:text-red-400 ml-2"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Total:</span>
                <span className="text-xl font-bold text-brand-700 dark:text-brand-500">${total.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={onProcessPayment}
                  className="w-full rounded-xl bg-brand-700 px-4 py-3 text-white font-semibold hover:bg-brand-500"
                >
                  Process Payment
                </button>
                <button 
                  onClick={onClearCart}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
