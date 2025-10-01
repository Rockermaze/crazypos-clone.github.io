'use client'
import { useState, useEffect } from 'react'
import type { RepairCategory, RepairCategoriesSectionProps } from '@/types/repair'

export function RepairCategoriesSection({ onCategoryChange }: RepairCategoriesSectionProps) {
  const [categories, setCategories] = useState<RepairCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RepairCategory | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedCost: '',
    estimatedTime: ''
  })

  // Load categories on component mount
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/repair-categories')
      if (!response.ok) throw new Error('Failed to load categories')
      
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
      setNotification({ message: 'Failed to load categories', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.estimatedCost || !formData.estimatedTime) {
      setNotification({ message: 'Please fill in all required fields', type: 'error' })
      return
    }

    try {
      const url = editingCategory 
        ? `/api/repair-categories/${editingCategory._id}` 
        : '/api/repair-categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          estimatedCost: parseFloat(formData.estimatedCost),
          estimatedTime: parseInt(formData.estimatedTime)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save category')
      }

      setNotification({ 
        message: editingCategory ? 'Category updated successfully' : 'Category created successfully', 
        type: 'success' 
      })
      
      await loadCategories()
      handleCloseModal()
      onCategoryChange?.()
    } catch (error: any) {
      console.error('Error saving category:', error)
      setNotification({ message: error.message, type: 'error' })
    }
  }

  const handleEdit = (category: RepairCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      estimatedCost: category.estimatedCost.toString(),
      estimatedTime: category.estimatedTime.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (category: RepairCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    try {
      const response = await fetch(`/api/repair-categories/${category._id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete category')

      setNotification({ message: 'Category deleted successfully', type: 'success' })
      await loadCategories()
      onCategoryChange?.()
    } catch (error) {
      console.error('Error deleting category:', error)
      setNotification({ message: 'Failed to delete category', type: 'error' })
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '', estimatedCost: '', estimatedTime: '' })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}min`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}min`
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-700"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Repair Categories</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-brand-700 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔧</div>
          <h4 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No Repair Categories</h4>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Create your first repair category to get started.</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Add First Category
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map(category => (
            <div key={category._id} className="bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100">{category.name}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-slate-500 hover:text-brand-600 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="text-slate-500 hover:text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {category.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{category.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Estimated Cost:</span>
                  <span className="font-medium text-brand-700 dark:text-brand-400">
                    ${category.estimatedCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Estimated Time:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {formatTime(category.estimatedTime)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g., Screen Replacement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  rows={3}
                  placeholder="Brief description of the repair category"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Estimated Cost * ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Time * (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-700 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  )
}
