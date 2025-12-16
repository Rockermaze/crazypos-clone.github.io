'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ProductModal } from '@/components/ProductModal'
import { PaymentModal, PaymentData } from '@/components/PaymentModal'
import { RepairModal } from '@/components/RepairModal'
import { APIDataManager } from '@/lib/apiDataManager'
import { Product, Sale, StoreSettings, SaleItem } from '@/types'
import type { RepairTicket } from '@/types/repair'
import { DashboardHeader } from '@/components/DashboardHeader'
import DashboardOnboarding from '@/components/DashboardOnboarding'
import { CompanyInformationModal } from '@/components/onboarding/CompanyInformationModal'
import { PaymentSettingsModal } from '@/components/onboarding/PaymentSettingsModal'

// Import modular components
import { SalesSection } from './components/Sales/SalesSection'
import { InventorySection } from './components/Inventory/InventorySection'
import { SalesHistorySection } from './components/SalesHistory/SalesHistorySection'
import { RepairsSection } from './components/Repairs/RepairsSection'
import { ReportsSection } from './components/Reports/ReportsSection'
import { SettingsSection } from './components/Settings/SettingsSection'
import { PaymentDashboard } from '@/components/PaymentDashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State management - Initialize all hooks at the top level
  const [activeTab, setActiveTab] = useState('dashboard')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [repairs, setRepairs] = useState<RepairTicket[]>([])
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [cart, setCart] = useState<SaleItem[]>([])
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showPOS, setShowPOS] = useState(false)
  const [onboardingStatus, setOnboardingStatus] = useState(null)
  const [activeOnboardingModal, setActiveOnboardingModal] = useState<string | null>(null)
  
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

  // Authentication redirect effect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
  }, [status, router])

  // Initialize data and load products
  useEffect(() => {
    const loadData = async () => {
      if (status === 'authenticated') {
        try {
          // Check onboarding status first
          const onboardingResponse = await fetch('/api/onboarding')
          if (onboardingResponse.ok) {
            const onboardingData = await onboardingResponse.json()
            setOnboardingStatus(onboardingData.onboardingStatus)
            
            // Show onboarding if not completed and not skipped
            const shouldShowOnboarding = !onboardingData.onboardingStatus.completed && 
                                       !onboardingData.onboardingStatus.skipped
            setShowOnboarding(shouldShowOnboarding)
            
            // Show POS if onboarding is completed/skipped or user explicitly requested it
            setShowPOS(onboardingData.onboardingStatus.completed || onboardingData.onboardingStatus.skipped)
          }
          
          // Load main data (if showing POS or onboarding is completed)
          if (showPOS || onboardingData.onboardingStatus.completed || onboardingData.onboardingStatus.skipped) {
            const [productsData, salesData, repairsData] = await Promise.all([
              APIDataManager.getProducts(),
              APIDataManager.getSales(),
              APIDataManager.getRepairs()
            ])
            setProducts(productsData)
            setSales(salesData)
            setRepairs(repairsData)
          }
        } catch (error) {
          console.error('Error loading data:', error)
          setNotification({ message: 'Failed to load data', type: 'error' })
        } finally {
          setLoading(false)
        }
      }
    }
    
    if (status !== 'loading') {
      loadData()
    }
  }, [status, showPOS])


  // Clear notification effect
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Navigation handlers
  const handleGoToPOS = async () => {
    setShowPOS(true)
    setShowOnboarding(false)
    
    // Load POS data if not already loaded
    if (products.length === 0) {
      try {
        const [productsData, salesData, repairsData] = await Promise.all([
          APIDataManager.getProducts(),
          APIDataManager.getSales(),
          APIDataManager.getRepairs()
        ])
        setProducts(productsData)
        setSales(salesData)
        setRepairs(repairsData)
      } catch (error) {
        console.error('Error loading POS data:', error)
        setNotification({ message: 'Failed to load POS data', type: 'error' })
      }
    }
  }

  const handleBackToSetup = () => {
    setShowPOS(false)
    setShowOnboarding(true)
  }

  const handleOpenOnboardingTask = (taskId: string) => {
    setActiveOnboardingModal(taskId)
  }

  const handleCloseOnboardingModal = () => {
    setActiveOnboardingModal(null)
  }

  const handleOnboardingTaskComplete = () => {
    setActiveOnboardingModal(null)
    // Refresh onboarding status
    fetch('/api/onboarding')
      .then(res => res.json())
      .then(data => setOnboardingStatus(data.onboardingStatus))
      .catch(console.error)
  }

  // Early returns after all hooks are defined
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

  // Dashboard summary metrics
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const weekStart = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000))
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const todaysSales = sales.filter(sale => new Date(sale.createdAt) >= todayStart)
  const weekSales = sales.filter(sale => new Date(sale.createdAt) >= weekStart)
  const monthSales = sales.filter(sale => new Date(sale.createdAt) >= monthStart)

  const todaysRevenue = todaysSales.reduce((sum, sale) => sum + sale.total, 0)
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total, 0)
  const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0)

  const lowStockItems = products.filter(p => p.stock < 10)
  const outOfStockItems = products.filter(p => p.stock === 0)
  const activeRepairsCount = repairs.filter(r => r.status === 'in-progress' || r.status === 'waiting-parts').length

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

  const handleToggleProductActive = async (product: Product) => {
    try {
      await APIDataManager.updateProduct(product.id, {
        isActive: !product.isActive
      })
      const updatedProducts = await APIDataManager.getProducts()
      setProducts(updatedProducts)
      setNotification({ 
        message: `Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`, 
        type: 'success' 
      })
    } catch (error) {
      console.error('Error toggling product status:', error)
      setNotification({ 
        message: 'Failed to update product status', 
        type: 'error' 
      })
    }
  }

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      try {
        await APIDataManager.deleteProduct(productToDelete.id)
        const updatedProducts = await APIDataManager.getProducts()
        setProducts(updatedProducts)
        setNotification({ message: 'Product deleted successfully', type: 'success' })
      } catch (error) {
        console.error('Error deleting product:', error)
        setNotification({ message: 'Failed to delete product', type: 'error' })
      }
    }
    setProductToDelete(null)
    setShowConfirmDialog(false)
  }

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingProduct) {
        // Update existing product
        await APIDataManager.updateProduct(editingProduct.id, productData)
        setNotification({ message: 'Product updated successfully', type: 'success' })
      } else {
        // Add new product
        await APIDataManager.addProduct(productData)
        setNotification({ message: 'Product added successfully', type: 'success' })
      }
      
      // Refresh products list
      const updatedProducts = await APIDataManager.getProducts()
      setProducts(updatedProducts)
      
      setShowProductModal(false)
      setEditingProduct(null)
    } catch (error: any) {
      console.error('Error saving product:', error)
      setNotification({ 
        message: error.message || 'Failed to save product', 
        type: 'error' 
      })
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

  const handlePaymentComplete = async (paymentData: PaymentData) => {
    try {
      // Create sale record
      const saleData = {
        items: cart,
        subtotal: paymentData.subtotal,
        tax: paymentData.tax,
        discount: paymentData.discount,
        total: paymentData.total,
        paymentMethod: paymentData.paymentMethod,
        customerInfo: paymentData.customerInfo
      }

      const sale = await APIDataManager.addSale(saleData)
      
      if (sale) {
        // Refresh data
        const [updatedSales, updatedProducts] = await Promise.all([
          APIDataManager.getSales(),
          APIDataManager.getProducts() // Refresh products to see updated stock
        ])
        
        setSales(updatedSales)
        setProducts(updatedProducts)
        
        // Clear cart
        setCart([])
        setShowPaymentModal(false)
        
        setNotification({ 
          message: `Sale completed! Receipt #${sale.receiptNumber}`, 
          type: 'success' 
        })
      }
    } catch (error: any) {
      console.error('Error processing payment:', error)
      setNotification({ 
        message: error.message || 'Failed to process payment', 
        type: 'error' 
      })
    }
  }

  // Repair management functions
  const handleAddRepair = () => {
    setShowRepairModal(true)
  }

  const handleSaveRepair = async (repairData: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      await APIDataManager.addRepair(repairData)
      const updatedRepairs = await APIDataManager.getRepairs()
      setRepairs(updatedRepairs)
      setNotification({ message: 'Repair ticket created successfully', type: 'success' })
      setShowRepairModal(false)
    } catch (error: any) {
      console.error('Error creating repair ticket:', error)
      setNotification({ 
        message: error.message || 'Failed to create repair ticket', 
        type: 'error' 
      })
    }
  }

  const handleUpdateRepairStatus = async (repairId: string, status: RepairTicket['status'], additionalData?: Partial<RepairTicket>) => {
    try {
      const updateData = { status, ...additionalData }
      await APIDataManager.updateRepair(repairId, updateData)
      
      // Refresh repairs list
      const updatedRepairs = await APIDataManager.getRepairs()
      setRepairs(updatedRepairs)
      
      // Show appropriate success message based on status
      const statusMessages = {
        'completed': 'Repair marked as completed! ✓',
        'in-progress': 'Repair started and in progress',
        'waiting-parts': 'Repair marked as waiting for parts',
        'picked-up': 'Device marked as picked up! 📦',
        'cancelled': 'Repair cancelled',
        'pending': 'Repair status updated'
      }
      
      setNotification({ 
        message: statusMessages[status] || 'Repair status updated successfully', 
        type: 'success' 
      })
    } catch (error: any) {
      console.error('Error updating repair status:', error)
      setNotification({ 
        message: error.message || 'Failed to update repair status', 
        type: 'error' 
      })
    }
  }


  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', description: 'Overview & setup' },
    { id: 'pos', label: 'POS', icon: '💰', description: 'Process transactions' },
    { id: 'inventory', label: 'Inventory', icon: '📦', description: 'Manage products' },
    { id: 'history', label: 'Sales History', icon: '📋', description: 'View past sales' },
    { id: 'repairs', label: 'Repairs', icon: '🔧', description: 'Manage repairs' },
    { id: 'reports', label: 'Reports', icon: '📊', description: 'Analytics & insights' },
    { id: 'settings', label: 'Settings', icon: '⚙️', description: 'System configuration' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-16">
      <DashboardHeader
        userLabel={session.user?.name || session.user?.email || 'Store Owner'}
        onLogout={handleLogout}
      />

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
                  <div className="flex-1 flex items-center justify-between">
                    <span>{tab.label}</span>
                    {tab.id === 'dashboard' && showOnboarding && onboardingStatus && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-orange-600 dark:text-orange-400">
                          {Object.values(onboardingStatus).filter(Boolean).length - 2}/7
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            showOnboarding ? (
              <DashboardOnboarding 
                onOpenTask={handleOpenOnboardingTask}
                onGoToPOS={handleGoToPOS}
              />
            ) : (
              <div className="p-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Summary</h2>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Today's Revenue</span>
                        <span className="font-bold text-brand-700 dark:text-brand-400">${todaysRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">This Week</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">${weekRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">This Month</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">${monthRevenue.toFixed(2)}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Low Stock Items</span>
                          <span className="font-bold text-yellow-600 dark:text-yellow-400">{lowStockItems.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Out of Stock</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{outOfStockItems.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Active Repairs</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{activeRepairsCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <PaymentDashboard />
                </div>
              </div>
            )
          )}

          {(activeTab === 'pos' && showPOS) && (
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

          {(activeTab === 'inventory' && showPOS) && (
            <InventorySection
              products={products}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onToggleActive={handleToggleProductActive}
            />
          )}

          {(activeTab === 'history' && showPOS) && (
            <SalesHistorySection sales={sales} />
          )}

          {(activeTab === 'repairs' && showPOS) && (
            <RepairsSection 
              repairs={repairs} 
              onAddRepair={handleAddRepair} 
              onUpdateRepairStatus={handleUpdateRepairStatus} 
            />
          )}

          {(activeTab === 'reports' && showPOS) && (
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

          {/* Show message when trying to access POS without completing setup */}
          {!showPOS && activeTab !== 'dashboard' && activeTab !== 'settings' && showOnboarding && (
            <div className="p-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  Complete Setup First
                </h3>
                <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                  Please complete the required setup tasks before accessing POS features.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-lg transition-colors"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={handleGoToPOS}
                    className="px-6 py-2 border border-yellow-600 text-yellow-700 hover:bg-yellow-50 font-medium rounded-lg transition-colors"
                  >
                    Skip & Access POS
                  </button>
                </div>
              </div>
            </div>
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

      {/* Onboarding Modals */}
      {activeOnboardingModal === 'companyInformation' && (
        <CompanyInformationModal
          isOpen={true}
          onClose={handleCloseOnboardingModal}
          onComplete={handleOnboardingTaskComplete}
        />
      )}
      
      {activeOnboardingModal === 'paymentSettings' && (
        <PaymentSettingsModal
          isOpen={true}
          onClose={handleCloseOnboardingModal}
          onComplete={handleOnboardingTaskComplete}
        />
      )}
      
      {/* Placeholder modals for other tasks */}
      {(activeOnboardingModal === 'storeInformation' || 
        activeOnboardingModal === 'supplierConnection' ||
        activeOnboardingModal === 'emailSettings' ||
        activeOnboardingModal === 'printingSettings' ||
        activeOnboardingModal === 'addProduct') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 capitalize">
              {activeOnboardingModal?.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              This setup task will be implemented with full functionality.
              For now, you can mark it as complete to continue.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseOnboardingModal}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleOnboardingTaskComplete}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors"
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
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
