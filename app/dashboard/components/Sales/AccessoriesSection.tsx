'use client'
import { useState } from 'react'
import { Product } from '@/types'

interface AccessoriesSectionProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function AccessoriesSection({ products, onAddToCart }: AccessoriesSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubCategory, setFilterSubCategory] = useState('all')

  // Filter products to show accessories only
  const accessoryProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Filter for accessories category
    const isAccessory = product.category === 'Accessories' || 
      product.name.toLowerCase().includes('case') ||
      product.name.toLowerCase().includes('cover') ||
      product.name.toLowerCase().includes('protector') ||
      product.name.toLowerCase().includes('charger') ||
      product.name.toLowerCase().includes('cable') ||
      product.name.toLowerCase().includes('holder') ||
      product.name.toLowerCase().includes('stand')

    // Sub-category filtering
    let matchesSubCategory = true
    if (filterSubCategory !== 'all') {
      const productName = product.name.toLowerCase()
      switch (filterSubCategory) {
        case 'cases':
          matchesSubCategory = productName.includes('case') || productName.includes('cover')
          break
        case 'protectors':
          matchesSubCategory = productName.includes('protector') || productName.includes('guard')
          break
        case 'charging':
          matchesSubCategory = productName.includes('charger') || productName.includes('cable') || productName.includes('adapter')
          break
        case 'stands':
          matchesSubCategory = productName.includes('stand') || productName.includes('holder') || productName.includes('mount')
          break
        default:
          matchesSubCategory = true
      }
    }
    
    return matchesSearch && isAccessory && matchesSubCategory && product.isActive
  })

  // Group accessories by type for better organization
  const groupedAccessories = accessoryProducts.reduce((groups: { [key: string]: Product[] }, product) => {
    const name = product.name.toLowerCase()
    let category = 'Other'
    
    if (name.includes('case') || name.includes('cover')) {
      category = 'Cases & Covers'
    } else if (name.includes('protector') || name.includes('guard')) {
      category = 'Screen Protectors'
    } else if (name.includes('charger') || name.includes('cable') || name.includes('adapter')) {
      category = 'Charging & Cables'
    } else if (name.includes('stand') || name.includes('holder') || name.includes('mount')) {
      category = 'Stands & Mounts'
    }
    
    if (!groups[category]) groups[category] = []
    groups[category].push(product)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Accessories</h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {accessoryProducts.length} accessories available
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search accessories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterSubCategory}
          onChange={(e) => setFilterSubCategory(e.target.value)}
          className="rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="all">All Accessories</option>
          <option value="cases">Cases & Covers</option>
          <option value="protectors">Screen Protectors</option>
          <option value="charging">Charging & Cables</option>
          <option value="stands">Stands & Mounts</option>
        </select>
      </div>

      {/* Accessories grouped by category */}
      <div className="space-y-8">
        {Object.entries(groupedAccessories).map(([categoryName, categoryProducts]) => (
          <div key={categoryName}>
            <h4 className="text-md font-medium text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
              <span className="text-lg">
                {categoryName === 'Cases & Covers' && '📱'}
                {categoryName === 'Screen Protectors' && '🛡️'}
                {categoryName === 'Charging & Cables' && '🔌'}
                {categoryName === 'Stands & Mounts' && '📐'}
                {categoryName === 'Other' && '🔧'}
              </span>
              {categoryName}
              <span className="text-sm text-slate-500 dark:text-slate-400">({categoryProducts.length})</span>
            </h4>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {categoryProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-3 hover:shadow-md transition-all duration-200 hover:scale-[1.01]">
                  {/* Accessory Image Placeholder */}
                  <div className="w-full h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-md mb-3 flex items-center justify-center">
                    <span className="text-2xl">
                      {product.name.toLowerCase().includes('case') && '📱'}
                      {product.name.toLowerCase().includes('protector') && '🛡️'}
                      {product.name.toLowerCase().includes('charger') && '🔌'}
                      {product.name.toLowerCase().includes('cable') && '🔌'}
                      {product.name.toLowerCase().includes('stand') && '📐'}
                      {!['case', 'protector', 'charger', 'cable', 'stand'].some(keyword => 
                        product.name.toLowerCase().includes(keyword)
                      ) && '🔧'}
                    </span>
                  </div>

                  {/* Accessory Info */}
                  <div className="space-y-2">
                    <h5 className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2">
                      {product.name}
                    </h5>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-brand-700 dark:text-brand-400 font-bold">
                          ${product.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Stock: <span className={`font-medium ${product.stock > 5 ? 'text-green-600 dark:text-green-400' : product.stock > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                            {product.stock}
                          </span>
                        </p>
                      </div>
                      
                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={product.stock === 0}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          product.stock === 0
                            ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                            : 'bg-brand-700 hover:bg-brand-600 text-white shadow-sm hover:shadow-md'
                        }`}
                      >
                        {product.stock === 0 ? 'Out' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {accessoryProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Accessories Found</h4>
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm || filterSubCategory !== 'all' ? 'Try adjusting your search or filter.' : 'No accessories available.'}
          </p>
        </div>
      )}
    </div>
  )
}
