'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { Product } from '@/types'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  product?: Product | null
}

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    barcode: '',
    category: '',
    description: '',
    isActive: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        cost: product.cost || 0,
        stock: product.stock,
        barcode: product.barcode,
        category: product.category || '',
        description: product.description || '',
        isActive: product.isActive
      })
    } else {
      setFormData({
        name: '',
        price: 0,
        cost: 0,
        stock: 0,
        barcode: '',
        category: '',
        description: '',
        isActive: true
      })
    }
    setErrors({})
  }, [product, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0'
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative'
    if (!formData.barcode.trim()) newErrors.barcode = 'Barcode is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSave(formData)
    }
  }

  const categories = [
    'Electronics',
    'Accessories',
    'Phones',
    'Tablets',
    'Laptops',
    'Audio',
    'Cables',
    'Cases',
    'Other'
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                errors.name 
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-brand-500'
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sale Price * ($)
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                errors.price 
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-brand-500'
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.price}</p>}
          </div>

          <div>
            <label htmlFor="cost" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cost Price ($) <span className="text-slate-500 dark:text-slate-400 text-xs">(for profit calculation)</span>
            </label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              className={`w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                formData.cost === 0 && formData.price > 0
                  ? 'border-yellow-300 dark:border-yellow-600 focus:border-yellow-500 focus:ring-yellow-500'
                  : 'border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-brand-500'
              }`}
              placeholder="0.00"
            />
            {formData.cost === 0 && formData.price > 0 && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                ⚠️ Cost not set - profit calculations will be inaccurate
              </p>
            )}
            {formData.price > 0 && formData.cost > 0 && (
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                💰 Profit Margin: ${(formData.price - formData.cost).toFixed(2)} ({(((formData.price - formData.cost) / formData.price) * 100).toFixed(1)}%)
              </p>
            )}
          </div>

          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className={`w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
                errors.stock 
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-brand-500'
              }`}
              placeholder="0"
            />
            {errors.stock && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.stock}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="barcode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Barcode/SKU *
          </label>
          <input
            type="text"
            id="barcode"
            name="barcode"
            value={formData.barcode}
            onChange={handleInputChange}
            className={`w-full rounded-xl border px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 ${
              errors.barcode 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                : 'border-slate-300 dark:border-slate-600 focus:border-brand-500 focus:ring-brand-500'
            }`}
            placeholder="Enter barcode or SKU"
          />
          {errors.barcode && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.barcode}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Enter product description (optional)"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleInputChange}
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-slate-700 dark:text-slate-300">
            Product is active
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-700 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500 px-4 py-2 text-white font-medium"
          >
            {product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
