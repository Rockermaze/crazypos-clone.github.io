'use client'
import { useState } from 'react'
import { Container } from '@/components/Container'
import Link from 'next/link'

// Mock data for demonstration
const mockProducts = [
  { id: 1, name: 'iPhone 15 Pro', price: 999, stock: 25, barcode: '123456789' },
  { id: 2, name: 'Samsung Galaxy S24', price: 899, stock: 15, barcode: '987654321' },
  { id: 3, name: 'iPad Air', price: 599, stock: 10, barcode: '456789123' },
  { id: 4, name: 'MacBook Air', price: 1299, stock: 5, barcode: '789123456' },
]

export default function DashboardPage() {
  const [cart, setCart] = useState<Array<{id: number, name: string, price: number, quantity: number}>>([])
  const [activeTab, setActiveTab] = useState('sales')

  const addToCart = (product: typeof mockProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity } : item
    ))
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const tabs = [
    { id: 'sales', label: 'Sales', icon: '💳' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
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
              <span className="text-sm text-slate-600">Welcome, Store Owner</span>
              <button className="text-sm text-brand-700 hover:text-brand-500">Logout</button>
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
                  <h2 className="text-xl font-bold mb-4">Product Catalog</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {mockProducts.map(product => (
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
                        <div key={item.id} className="flex items-center justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-slate-500">${item.price} each</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-sm"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
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
                        <button className="w-full rounded-xl bg-brand-700 px-4 py-3 text-white font-semibold hover:bg-brand-500">
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
                  <button className="rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500">
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
                      {mockProducts.map(product => (
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
                              <button className="text-sm text-brand-700 hover:text-brand-500">Edit</button>
                              <button className="text-sm text-red-600 hover:text-red-500">Delete</button>
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

          {activeTab === 'repairs' && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Repair Management</h2>
                  <button className="rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500">
                    New Repair Ticket
                  </button>
                </div>
                
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔧</div>
                  <h3 className="text-xl font-semibold mb-2">Repair Management</h3>
                  <p className="text-slate-600 mb-6">Track device repairs, parts inventory, and customer communications.</p>
                  <button className="rounded-xl bg-brand-700 px-6 py-3 text-white font-medium hover:bg-brand-500">
                    Create First Repair Ticket
                  </button>
                </div>
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
                      <span className="font-bold">{mockProducts.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock Items:</span>
                      <span className="font-bold text-red-600">
                        {mockProducts.filter(p => p.stock < 10).length}
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
    </div>
  )
}

make sure to keep the user experience as it was originally like the clone of crazy pos the code which I have already given dont mae any changes in to it.
