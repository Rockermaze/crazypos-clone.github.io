'use client'
import { useState } from 'react'
import { Product } from '@/types'

interface ProductsSectionProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function ProductsSection({ products, onAddToCart }: ProductsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter products to show main products (not accessories)
  const readyToSellProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter for main products (phones, tablets, laptops, etc.) - not accessories
    const isMainProduct = product.category && 
      ['Electronics', 'Phones', 'Tablets', 'Laptops', 'Audio', 'Gaming'].includes(product.category)
    
    return matchesSearch && isMainProduct && product.isActive
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Ready-to-Sell Products</h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {readyToSellProducts.length} products available
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Products Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {readyToSellProducts.map(product => (
          <div key={product.id} className="bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            {/* Product Image Placeholder */}
            <div className="w-full h-32 bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-3xl">
                {product.category === 'Phones' && '📱'}
                {product.category === 'Tablets' && '📱'}
                {product.category === 'Laptops' && '💻'}
                {product.category === 'Audio' && '🎧'}
                {product.category === 'Gaming' && '🎮'}
                {!['Phones', 'Tablets', 'Laptops', 'Audio', 'Gaming'].includes(product.category || '') && '📦'}
              </span>
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">
                {product.name}
              </h4>
              
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-brand-700 dark:text-brand-400 font-bold text-xl">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Stock: <span className={`font-medium ${product.stock > 10 ? 'text-green-600 dark:text-green-400' : product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {product.stock}
                    </span>
                  </p>
                </div>
                
                <button
                  onClick={() => onAddToCart(product)}
                  disabled={product.stock === 0}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    product.stock === 0
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-brand-700 hover:bg-brand-600 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {product.category && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="inline-block bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {readyToSellProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Products Found</h4>
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm ? 'Try adjusting your search terms.' : 'No ready-to-sell products available.'}
          </p>
        </div>
      )}
    </div>
  )
}
