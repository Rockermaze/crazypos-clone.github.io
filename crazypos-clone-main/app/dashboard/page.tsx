'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/Container'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ProductModal } from '@/components/ProductModal'
import { PaymentModal, PaymentData } from '@/components/PaymentModal'
import { RepairModal } from '@/components/RepairModal'
import { DataManager } from '@/lib/dataManager'
import { Product, Sale, RepairTicket, StoreSettings, SaleItem } from '@/types'
import Link from 'next/link'

// Import modular components
import { SalesSection } from './components/Sales/SalesSection'
import { InventorySection } from './components/Inventory/InventorySection'
import { SalesHistorySection } from './components/SalesHistory/SalesHistorySection'
import { RepairsSection } from './components/Repairs/RepairsSection'
import { ReportsSection } from './components/Reports/ReportsSection'
import { SettingsSection } from './components/Settings/SettingsSection'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management
  const [activeTab, setActiveTab] = useState('sales')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [repairs, setRepairs] = useState<RepairTicket[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [cart, setCart] = useState<SaleItem[]>([])
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Initialize data and load products
  useEffect(() => {
    if (status === 'authenticated') {
      DataManager.initializeData()
      setProducts(DataManager.getProducts())
      setSales(DataManager.getSales())
      setRepairs(DataManager.getRepairs())
      setLoading(false)
    }
  }, [status])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 dark:border-brand-500 mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id)
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                totalPrice: item.unitPrice * (item.quantity + 1)
              }
            : item
        )
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price
      }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item => 
      item.productId === productId ? { 
        ...item, 
        quantity, 
        totalPrice: item.unitPrice * quantity 
      } : item
    ))
  }

  const total = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  // Product management functions
  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setProductToDelete(product)
    setShowConfirmDialog(true)
  }

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      const success = DataManager.deleteProduct(productToDelete.id)
      if (success) {
        setProducts(DataManager.getProducts())
        setNotification({ message: 'Product deleted successfully', type: 'success' })
      } else {
        setNotification({ message: 'Failed to delete product', type: 'error' })
      }
    }
    setProductToDelete(null)
    setShowConfirmDialog(false)
  }

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingProduct) {
        // Update existing product
        const updated = DataManager.updateProduct(editingProduct.id, productData)
        if (updated) {
          setProducts(DataManager.getProducts())
          setNotification({ message: 'Product updated successfully', type: 'success' })
        }
      } else {
        // Add new product
        DataManager.addProduct(productData)
        setProducts(DataManager.getProducts())
        setNotification({ message: 'Product added successfully', type: 'success' })
      }
      setShowProductModal(false)
      setEditingProduct(null)
    } catch (error) {
      setNotification({ message: 'Failed to save product', type: 'error' })
    }
  }

  // Payment processing functions
  const handleProcessPayment = () => {
    if (cart.length === 0) {
      setNotification({ message: 'Cart is empty', type: 'error' })
      return
    }
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = (paymentData: PaymentData) => {
    try {
      // Create sale record
      const saleData = {
        items: cart,
        subtotal: paymentData.subtotal,
        tax: paymentData.tax,
        discount: paymentData.discount,
        total: paymentData.total,
        paymentMethod: paymentData.paymentMethod,
        paymentStatus: 'completed' as const,
        customerInfo: paymentData.customerInfo,
        cashierId: session?.user?.id || 'unknown'
      }

      const sale = DataManager.addSale(saleData)
      setSales(DataManager.getSales())
      
      // Clear cart
      setCart([])
      setShowPaymentModal(false)
      
      setNotification({ 
        message: `Sale completed! Receipt #${sale.receiptNumber}`, 
        type: 'success' 
      })
    } catch (error) {
      setNotification({ message: 'Failed to process payment', type: 'error' })
    }
  }

  // Repair management functions
  const handleAddRepair = () => {
    setShowRepairModal(true)
  }

  const handleSaveRepair = (repairData: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      DataManager.addRepair(repairData)
      setRepairs(DataManager.getRepairs())
      setNotification({ message: 'Repair ticket created successfully', type: 'success' })
      setShowRepairModal(false)
    } catch (error) {
      setNotification({ message: 'Failed to create repair ticket', type: 'error' })
    }
  }

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const tabs = [
    { id: 'sales', label: 'Point of Sales', icon: '💰', description: 'Process transactions' },
    { id: 'inventory', label: 'Inventory', icon: '📦', description: 'Manage products' },
    { id: 'history', label: 'Sales History', icon: '📋', description: 'View past sales' },
    { id: 'repairs', label: 'Repairs', icon: '🔧', description: 'Manage repairs' },
    { id: 'reports', label: 'Reports', icon: '📊', description: 'Analytics & insights' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'System configuration' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-bold text-xl text-brand-700 dark:text-brand-500">YourPOS</Link>
              <span className="text-slate-400 dark:text-slate-500">|</span>
              <span className="text-slate-600 dark:text-slate-300">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Welcome, {session.user?.name || session.user?.email || 'Store Owner'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-brand-700 dark:text-brand-500 hover:text-brand-500 dark:hover:text-brand-400"
              >
                Logout
              </button>
            </div>
          </div>
        </Container>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 font-medium'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === 'sales' && (
            <SalesSection 
              products={products}
              cart={cart}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
              onUpdateQuantity={updateQuantity}
              onProcessPayment={handleProcessPayment}
              onClearCart={() => setCart([])}
              total={total}
            />
          )}

          {activeTab === 'inventory' && (
            <InventorySection
              products={products}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'history' && (
            <SalesHistorySection sales={sales} />
          )}

          {activeTab === 'repairs' && (
            <RepairsSection repairs={repairs} onAddRepair={handleAddRepair} />
          )}

          {activeTab === 'reports' && (
            <ReportsSection products={products} sales={sales} repairs={repairs} />
          )}

          {activeTab === 'settings' && (
            <SettingsSection 
              settings={settings} 
              onSaveSettings={(updatedSettings) => {
                // Here you would typically update the settings in your data store
                console.log('Settings updated:', updatedSettings);
                setNotification({ 
                  message: 'Settings updated successfully', 
                  type: 'success' 
                });
              }}
            />
          )}
        </main>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentComplete={handlePaymentComplete}
          cartItems={cart}
          total={total}
        />
      )}

      {/* Repair Modal */}
      {showRepairModal && (
        <RepairModal
          isOpen={showRepairModal}
          onClose={() => setShowRepairModal(false)}
          onSave={handleSaveRepair}
        />
      )}

      {/* Confirm Delete Dialog */}
      {showConfirmDialog && productToDelete && (
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false)
            setProductToDelete(null)
          }}
          onConfirm={confirmDeleteProduct}
          title="Delete Product"
          message={`Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  )
}
