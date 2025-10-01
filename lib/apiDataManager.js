// API Data Manager - handles all data operations through API calls
export class APIDataManager {
  
  // Product management
  static async getProducts() {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  static async addProduct(productData) {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        credentials: 'include', // Added
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Error adding product:', error)
      throw error
    }
  }

  static async updateProduct(id, updates) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        credentials: 'include', // Added
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update product')
      }

      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Error updating product:', error)
      throw error
    }
  }

  static async deleteProduct(id) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Added
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete product')
      }

      return true
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  static async getProduct(id) {
    try {
      const response = await fetch(`/api/products/${id}`, {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch product')
      }
      const data = await response.json()
      return data.product
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  // Sales management
  static async getSales() {
    try {
      const response = await fetch('/api/sales', {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        throw new Error('Failed to fetch sales')
      }
      const data = await response.json()
      return data.sales || []
    } catch (error) {
      console.error('Error fetching sales:', error)
      return []
    }
  }

  static async addSale(saleData) {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        credentials: 'include', // Added
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create sale')
      }

      const data = await response.json()
      return data.sale
    } catch (error) {
      console.error('Error adding sale:', error)
      throw error
    }
  }

  // Repairs management
  static async getRepairs() {
    try {
      const response = await fetch('/api/repairs', {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        throw new Error('Failed to fetch repairs')
      }
      const data = await response.json()
      return data.repairs || []
    } catch (error) {
      console.error('Error fetching repairs:', error)
      return []
    }
  }

  static async addRepair(repairData) {
    try {
      const response = await fetch('/api/repairs', {
        method: 'POST',
        credentials: 'include', // Added
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repairData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create repair ticket')
      }

      const data = await response.json()
      return data.repair
    } catch (error) {
      console.error('Error adding repair:', error)
      throw error
    }
  }

  static async updateRepair(id, updates) {
    try {
      const response = await fetch(`/api/repairs/${id}`, {
        method: 'PUT',
        credentials: 'include', // Added
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update repair ticket')
      }

      const data = await response.json()
      return data.repair
    } catch (error) {
      console.error('Error updating repair:', error)
      throw error
    }
  }

  static async deleteRepair(id) {
    try {
      const response = await fetch(`/api/repairs/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Added
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete repair ticket')
      }

      return true
    } catch (error) {
      console.error('Error deleting repair:', error)
      throw error
    }
  }

  // Settings management
  static async getSettings() {
    try {
      const response = await fetch('/api/settings', {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch settings')
      }
      const data = await response.json()
      return data.settings
    } catch (error) {
      console.error('Error fetching settings:', error)
      return null
    }
  }

  static async saveSettings(settings) {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        credentials: 'include', // Added
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      const data = await response.json()
      return data.settings
    } catch (error) {
      console.error('Error saving settings:', error)
      throw error
    }
  }

  // Utility methods
  static generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  static formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  // Export data (for backup purposes)
  static async exportData() {
    try {
      const [products, sales, repairs, settings] = await Promise.all([
        this.getProducts(),
        this.getSales(),
        this.getRepairs(),
        this.getSettings()
      ])

      const data = {
        products,
        sales,
        repairs,
        settings,
        exportDate: new Date().toISOString()
      }

      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error('Error exporting data:', error)
      throw error
    }
  }

  // Search products
  static async searchProducts(query, category) {
    try {
      const params = new URLSearchParams()
      if (query) params.append('search', query)
      if (category && category !== 'all') params.append('category', category)
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        throw new Error('Failed to search products')
      }
      const data = await response.json()
      return data.products || []
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  }

  // Get sales with filters
  static async getSalesWithFilters(filters) {
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
      
      const response = await fetch(`/api/sales?${params.toString()}`, {
        credentials: 'include' // Added
      })
      if (!response.ok) {
        throw new Error('Failed to fetch sales')
      }
      const data = await response.json()
      return data.sales || []
    } catch (error) {
      console.error('Error fetching filtered sales:', error)
      return []
    }
  }
}
