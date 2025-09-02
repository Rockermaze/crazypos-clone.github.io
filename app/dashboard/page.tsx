'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Container } from '@/components/Container'
import { Modal } from '@/components/Modal'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ProductModal } from '@/components/ProductModal'
import { PaymentModal, PaymentData } from '@/components/PaymentModal'
import { RepairModal } from '@/components/RepairModal'
import { DataManager } from '@/lib/dataManager'
import { Product, Sale, RepairTicket, StoreSettings, SaleItem } from '@/types'
import Link from 'next/link'

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
  
  // Form states
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-700 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
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
    { id: 'sales', label: 'Sales', icon: '💳' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'history', label: 'Sales History', icon: '📋' },
    { id: 'repairs', label: 'Repairs', icon: '🔧' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b">
        <Container>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-bold text-xl text-brand-700">YourPOS</Link>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                Welcome, {session.user?.name || session.user?.email || 'Store Owner'}
              </span>
              <button 
                onClick={handleLogout}
                className="text-sm text-brand-700 hover:text-brand-500"
              >
                Logout
              </button>
            </div>
          </div>
        </Container>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-brand-100 text-brand-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
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
            <div className="grid lg:grid-cols-3 gap-6 p-6">
              {/* Product Selection */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Product Catalog</h2>
                  </div>
                  
                  {/* Search and Filter */}
                  <div className="flex gap-4 mb-6">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Phones">Phones</option>
                      <option value="Tablets">Tablets</option>
                      <option value="Laptops">Laptops</option>
                      <option value="Audio">Audio</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    {products
                      .filter(product => {
                        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            product.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (product.category || '').toLowerCase().includes(searchTerm.toLowerCase())
                        const matchesCategory = filterCategory === 'all' || product.category === filterCategory
                        return matchesSearch && matchesCategory && product.isActive
                      })
                      .map(product => (
                      <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-brand-700 font-bold">${product.price}</p>
                            <p className="text-sm text-slate-500">Stock: {product.stock}</p>
                            <p className="text-xs text-slate-400">#{product.barcode}</p>
                          </div>
                          <button
                            onClick={() => addToCart(product)}
                            className="rounded-lg bg-brand-700 px-3 py-2 text-white text-sm font-medium hover:bg-brand-500"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart */}
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">Current Sale</h2>
                
                {cart.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No items in cart</p>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {cart.map(item => (
                        <div key={item.productId} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-slate-500">${item.unitPrice} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center text-sm text-red-600 ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-xl font-bold text-brand-700">${total.toFixed(2)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={handleProcessPayment}
                          className="w-full rounded-xl bg-brand-700 px-4 py-3 text-white font-semibold hover:bg-brand-500"
                        >
                          Process Payment
                        </button>
                        <button 
                          onClick={() => setCart([])}
                          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
                        >
                          Clear Cart
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Inventory Management</h2>
                  <button 
                    onClick={handleAddProduct}
                    className="rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500"
                  >
                    Add Product
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Product</th>
                        <th className="text-left py-3 px-4">Price</th>
                        <th className="text-left py-3 px-4">Stock</th>
                        <th className="text-left py-3 px-4">Barcode</th>
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b">
                          <td className="py-3 px-4 font-medium">{product.name}</td>
                          <td className="py-3 px-4">${product.price}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.stock < 10 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {product.stock} units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{product.barcode}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleEditProduct(product)}
                                className="text-sm text-brand-700 hover:text-brand-500"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product)}
                                className="text-sm text-red-600 hover:text-red-500"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Sales History</h2>
                
                {sales.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold mb-2">No Sales Yet</h3>
                    <p className="text-slate-600">Start selling to see your sales history here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Receipt #</th>
                          <th className="text-left py-3 px-4">Date</th>
                          <th className="text-left py-3 px-4">Items</th>
                          <th className="text-left py-3 px-4">Total</th>
                          <th className="text-left py-3 px-4">Payment</th>
                          <th className="text-left py-3 px-4">Customer</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.slice().reverse().map(sale => (
                          <tr key={sale.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{sale.receiptNumber}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {new Date(sale.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                            </td>
                            <td className="py-3 px-4 font-bold">${sale.total.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                                sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {sale.paymentMethod.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {sale.customerInfo?.name || sale.customerInfo?.email || 'Guest'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'repairs' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Repair Management</h2>
                  <button 
                    onClick={handleAddRepair}
                    className="rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500"
                  >
                    New Repair Ticket
                  </button>
                </div>
                
                {repairs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔧</div>
                    <h3 className="text-xl font-semibold mb-2">No Repair Tickets</h3>
                    <p className="text-slate-600 mb-6">Create your first repair ticket to start tracking device repairs.</p>
                    <button 
                      onClick={handleAddRepair}
                      className="rounded-xl bg-brand-700 px-6 py-3 text-white font-medium hover:bg-brand-500"
                    >
                      Create First Repair Ticket
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Ticket #</th>
                          <th className="text-left py-3 px-4">Customer</th>
                          <th className="text-left py-3 px-4">Device</th>
                          <th className="text-left py-3 px-4">Status</th>
                          <th className="text-left py-3 px-4">Priority</th>
                          <th className="text-left py-3 px-4">Est. Cost</th>
                          <th className="text-left py-3 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repairs.slice().reverse().map(repair => (
                          <tr key={repair.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium">{repair.ticketNumber}</td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{repair.customerInfo.name}</p>
                                <p className="text-xs text-slate-500">{repair.customerInfo.phone}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium">{repair.deviceInfo.brand} {repair.deviceInfo.model}</p>
                              <p className="text-xs text-slate-500">{repair.deviceInfo.issueDescription.slice(0, 30)}...</p>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                repair.status === 'completed' ? 'bg-green-100 text-green-800' :
                                repair.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                repair.status === 'waiting-parts' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {repair.status.replace('-', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                repair.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                repair.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                repair.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {repair.priority.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">${repair.estimatedCost.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {new Date(repair.dateReceived).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Sales Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Today's Sales:</span>
                      <span className="font-bold text-brand-700">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Week:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>This Month:</span>
                      <span className="font-bold">$0.00</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Products:</span>
                      <span className="font-bold">{products.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock Items:</span>
                      <span className="font-bold text-red-600">
                        {products.filter(p => p.stock < 10).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Repairs:</span>
                      <span className="font-bold">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-xl font-bold mb-6">Store Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Your Store"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Store Address
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="123 Main St, City, State 12345"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      defaultValue="8.25"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  
                  <button className="rounded-xl bg-brand-700 px-6 py-3 text-white font-medium hover:bg-brand-500">
                    Save Settings
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
