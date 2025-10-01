'use client'
import { useState } from 'react'
import { Product, SaleItem } from '@/types'
import { ProductsSection } from './ProductsSection'
import { AccessoriesSection } from './AccessoriesSection'

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
  const [activeTab, setActiveTab] = useState('products')

  const tabs = [
    { id: 'products', label: 'Products', icon: '📱', description: 'Ready-to-sell products' },
    { id: 'accessories', label: 'Accessories', icon: '🔧', description: 'Cases, chargers & more' }
  ]

  return (
    <div className="grid lg:grid-cols-3 gap-6 p-6">
      {/* Product Selection with Tabs */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
          {/* Tab Navigation */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-slate-600 text-brand-700 dark:text-brand-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {activeTab === 'products' ? 'Ready-to-sell products' : 'Cases, chargers & more'}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === 'products' && (
              <ProductsSection 
                products={products}
                onAddToCart={onAddToCart}
              />
            )}
            
            {activeTab === 'accessories' && (
              <AccessoriesSection 
                products={products}
                onAddToCart={onAddToCart}
              />
            )}
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
