import { Product, Sale, RepairTicket, StoreSettings } from '@/types'

// Local storage keys
const STORAGE_KEYS = {
  PRODUCTS: 'pos_products',
  SALES: 'pos_sales',
  REPAIRS: 'pos_repairs',
  SETTINGS: 'pos_settings',
  COUNTERS: 'pos_counters'
} as const

// Initialize default data
const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Your Store',
  storeAddress: '123 Main St, City, State 12345',
  storePhone: '+1 (555) 123-4567',
  storeEmail: 'info@yourstore.com',
  taxRate: 8.25,
  currency: 'USD',
  receiptFooter: 'Thank you for your business!',
  lowStockThreshold: 10,
  autoBackup: true,
  printerSettings: {
    receiptPrinter: 'Default Receipt Printer',
    labelPrinter: 'Default Label Printer'
  }
}

// Demo data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    price: 999,
    cost: 700,
    stock: 25,
    barcode: '123456789',
    category: 'Electronics',
    description: 'Latest iPhone with Pro features',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    price: 899,
    cost: 650,
    stock: 15,
    barcode: '987654321',
    category: 'Electronics',
    description: 'Premium Android smartphone',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'iPad Air',
    price: 599,
    cost: 450,
    stock: 10,
    barcode: '456789123',
    category: 'Electronics',
    description: 'Versatile tablet for work and play',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'MacBook Air',
    price: 1299,
    cost: 950,
    stock: 5,
    barcode: '789123456',
    category: 'Electronics',
    description: 'Lightweight laptop with M2 chip',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'AirPods Pro',
    price: 249,
    cost: 150,
    stock: 30,
    barcode: '111222333',
    category: 'Electronics',
    description: 'Wireless earbuds with noise cancellation',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Phone Case',
    price: 29,
    cost: 12,
    stock: 50,
    barcode: '444555666',
    category: 'Accessories',
    description: 'Protective phone case',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Utility functions
export class DataManager {
  // Generic storage methods
  private static setItem<T>(key: string, data: T): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data))
    }
  }

  private static getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : defaultValue
    } catch (error) {
      console.error(`Error parsing stored data for ${key}:`, error)
      return defaultValue
    }
  }

  // Initialize data if not exists
  static initializeData(): void {
    const products = this.getItem(STORAGE_KEYS.PRODUCTS, [])
    if (products.length === 0) {
      this.setItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
    }

    const settings = this.getItem(STORAGE_KEYS.SETTINGS, null)
    if (!settings) {
      this.setItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    }

    const counters = this.getItem(STORAGE_KEYS.COUNTERS, {})
    if (!counters.receiptNumber) {
      this.setItem(STORAGE_KEYS.COUNTERS, {
        receiptNumber: 1000,
        ticketNumber: 1000,
        productId: 1000
      })
    }
  }

  // Product management
  static getProducts(): Product[] {
    return this.getItem(STORAGE_KEYS.PRODUCTS, DEFAULT_PRODUCTS)
  }

  static saveProducts(products: Product[]): void {
    this.setItem(STORAGE_KEYS.PRODUCTS, products)
  }

  static addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts()
    const counters = this.getItem(STORAGE_KEYS.COUNTERS, { productId: 1000 })
    
    const newProduct: Product = {
      ...product,
      id: (++counters.productId).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    products.push(newProduct)
    this.saveProducts(products)
    this.setItem(STORAGE_KEYS.COUNTERS, counters)
    
    return newProduct
  }

  static updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts()
    const index = products.findIndex(p => p.id === id)
    
    if (index === -1) return null
    
    const updatedProduct = {
      ...products[index],
      ...updates,
      updatedAt: new Date()
    }
    
    products[index] = updatedProduct
    this.saveProducts(products)
    
    return updatedProduct
  }

  static deleteProduct(id: string): boolean {
    const products = this.getProducts()
    const filteredProducts = products.filter(p => p.id !== id)
    
    if (filteredProducts.length === products.length) return false
    
    this.saveProducts(filteredProducts)
    return true
  }

  // Sales management
  static getSales(): Sale[] {
    return this.getItem(STORAGE_KEYS.SALES, [])
  }

  static saveSales(sales: Sale[]): void {
    this.setItem(STORAGE_KEYS.SALES, sales)
  }

  static addSale(sale: Omit<Sale, 'id' | 'receiptNumber' | 'createdAt' | 'updatedAt'>): Sale {
    const sales = this.getSales()
    const counters = this.getItem(STORAGE_KEYS.COUNTERS, { receiptNumber: 1000 })
    
    const newSale: Sale = {
      ...sale,
      id: Date.now().toString(),
      receiptNumber: `R${++counters.receiptNumber}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    sales.push(newSale)
    this.saveSales(sales)
    this.setItem(STORAGE_KEYS.COUNTERS, counters)
    
    return newSale
  }

  // Repair management
  static getRepairs(): RepairTicket[] {
    return this.getItem(STORAGE_KEYS.REPAIRS, [])
  }

  static saveRepairs(repairs: RepairTicket[]): void {
    this.setItem(STORAGE_KEYS.REPAIRS, repairs)
  }

  static addRepair(repair: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>): RepairTicket {
    const repairs = this.getRepairs()
    const counters = this.getItem(STORAGE_KEYS.COUNTERS, { ticketNumber: 1000 })
    
    const newRepair: RepairTicket = {
      ...repair,
      id: Date.now().toString(),
      ticketNumber: `T${++counters.ticketNumber}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    repairs.push(newRepair)
    this.saveRepairs(repairs)
    this.setItem(STORAGE_KEYS.COUNTERS, counters)
    
    return newRepair
  }

  static updateRepair(id: string, updates: Partial<RepairTicket>): RepairTicket | null {
    const repairs = this.getRepairs()
    const index = repairs.findIndex(r => r.id === id)
    
    if (index === -1) return null
    
    const updatedRepair = {
      ...repairs[index],
      ...updates,
      updatedAt: new Date()
    }
    
    repairs[index] = updatedRepair
    this.saveRepairs(repairs)
    
    return updatedRepair
  }

  static deleteRepair(id: string): boolean {
    const repairs = this.getRepairs()
    const filteredRepairs = repairs.filter(r => r.id !== id)
    
    if (filteredRepairs.length === repairs.length) return false
    
    this.saveRepairs(filteredRepairs)
    return true
  }

  // Settings management
  static getSettings(): StoreSettings {
    return this.getItem(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }

  static saveSettings(settings: StoreSettings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings)
  }

  // Utility methods
  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  static exportData(): string {
    const data = {
      products: this.getProducts(),
      sales: this.getSales(),
      repairs: this.getRepairs(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString()
    }
    
    return JSON.stringify(data, null, 2)
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.products) this.saveProducts(data.products)
      if (data.sales) this.saveSales(data.sales)
      if (data.repairs) this.saveRepairs(data.repairs)
      if (data.settings) this.saveSettings(data.settings)
      
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  static clearAllData(): void {
    if (typeof window !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    }
  }
}
