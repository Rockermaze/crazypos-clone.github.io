// Product Types
export interface Product {
  id: string
  name: string
  category: string
  price: number
  cost: number
  stock: number
  sku?: string
  description?: string
  isActive: boolean
  supplier?: string
  minStockLevel?: number
  createdAt: string
  updatedAt: string
}

// Sale Types
export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  discount?: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  paymentGateway?: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
  customerId?: string
  receiptNumber: string
  transactionId?: string
  externalTransactionId?: string
  cashierId: string
  userId: string
  createdAt: string
  updatedAt: string
}

// Store Settings Types
export interface StoreSettings {
  id?: string
  userId: string
  storeName: string
  storeAddress: string
  storePhone: string
  storeEmail: string
  currency: string
  taxRate: number
  receiptFooter: string
  timezone?: string
  dateFormat?: string
  createdAt?: string
  updatedAt?: string
}

// Customer Types
export interface Customer {
  id: string
  customerId: string
  name: string
  email?: string
  phone: string
  address?: string
  notes?: string
  purchaseCount: number
  totalPurchases: number
  dueAmount: number
  lastPurchaseDate?: string
  createdAt: string
  updatedAt: string
}
