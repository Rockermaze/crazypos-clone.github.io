'use client'
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

interface ImportProduct {
  tempId: string
  name: string
  price: string
  cost: string
  stock: string
  barcode: string
  category: string
  description: string
  errors: string[]
}

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (products: any[]) => Promise<void>
}

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [products, setProducts] = useState<ImportProduct[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        const parsedProducts: ImportProduct[] = jsonData.map((row: any, index) => {
          const errors: string[] = []
          
          // Validate required fields
          if (!row.Name && !row.name) errors.push('Name is required')
          if (!row.Price && !row.price && row.Price !== 0) errors.push('Price is required')
          if (!row.Barcode && !row.barcode) errors.push('Barcode is required')

          return {
            tempId: `temp-${Date.now()}-${index}`,
            name: row.Name || row.name || '',
            price: String(row.Price || row.price || '0'),
            cost: String(row.Cost || row.cost || '0'),
            stock: String(row.Stock || row.stock || '0'),
            barcode: String(row.Barcode || row.barcode || ''),
            category: row.Category || row.category || 'General',
            description: row.Description || row.description || '',
            errors
          }
        })

        setProducts(parsedProducts)
      } catch (error) {
        setUploadError('Failed to parse Excel file. Please check the format.')
        console.error('Excel parsing error:', error)
      }
    }

    reader.readAsBinaryString(file)
  }

  const handleFieldChange = (tempId: string, field: keyof ImportProduct, value: string) => {
    setProducts(prev => prev.map(p => {
      if (p.tempId !== tempId) return p
      
      const updated = { ...p, [field]: value }
      
      // Re-validate
      const errors: string[] = []
      if (!updated.name) errors.push('Name is required')
      if (!updated.price || isNaN(Number(updated.price))) errors.push('Valid price is required')
      if (!updated.barcode) errors.push('Barcode is required')
      if (Number(updated.price) < 0) errors.push('Price cannot be negative')
      if (Number(updated.cost) < 0) errors.push('Cost cannot be negative')
      if (Number(updated.stock) < 0) errors.push('Stock cannot be negative')
      
      updated.errors = errors
      return updated
    }))
  }

  const handleRemoveProduct = (tempId: string) => {
    setProducts(prev => prev.filter(p => p.tempId !== tempId))
  }

  const handleConfirmImport = async () => {
    // Check for any validation errors
    const hasErrors = products.some(p => p.errors.length > 0)
    if (hasErrors) {
      setUploadError('Please fix all validation errors before importing')
      return
    }

    if (products.length === 0) {
      setUploadError('No products to import')
      return
    }

    setIsProcessing(true)
    try {
      const formattedProducts = products.map(p => ({
        name: p.name,
        price: Number(p.price),
        cost: Number(p.cost),
        stock: Number(p.stock),
        barcode: p.barcode,
        category: p.category,
        description: p.description,
        isActive: true
      }))

      await onImport(formattedProducts)
      handleClose()
    } catch (error: any) {
      setUploadError(error.message || 'Failed to import products')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    setProducts([])
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const validProducts = products.filter(p => p.errors.length === 0).length
  const totalProducts = products.length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Bulk Import Products
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Upload an Excel file (.xlsx, .xls) with columns: Name, Price, Cost, Stock, Barcode, Category, Description
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* File Upload */}
          {products.length === 0 && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Upload Excel File
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Select an Excel file containing your product data
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="inline-block bg-brand-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-600 cursor-pointer"
              >
                Choose File
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Required columns: Name, Price, Barcode<br />
                Optional columns: Cost, Stock, Category, Description
              </p>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
              {uploadError}
            </div>
          )}

          {/* Preview Table */}
          {products.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {validProducts} of {totalProducts} products valid
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-brand-700 dark:text-brand-400 hover:underline"
                >
                  Upload Different File
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 dark:border-slate-600 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">#</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Name*</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Price*</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Cost</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Stock</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Barcode*</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Category</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Description</th>
                      <th className="text-left py-3 px-3 text-slate-900 dark:text-slate-100 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <tr
                        key={product.tempId}
                        className={`border-t border-slate-200 dark:border-slate-600 ${
                          product.errors.length > 0 ? 'bg-red-50 dark:bg-red-900/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{index + 1}</td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(e) => handleFieldChange(product.tempId, 'name', e.target.value)}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={product.price}
                            onChange={(e) => handleFieldChange(product.tempId, 'price', e.target.value)}
                            className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={product.cost}
                            onChange={(e) => handleFieldChange(product.tempId, 'cost', e.target.value)}
                            className="w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            value={product.stock}
                            onChange={(e) => handleFieldChange(product.tempId, 'stock', e.target.value)}
                            className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={product.barcode}
                            onChange={(e) => handleFieldChange(product.tempId, 'barcode', e.target.value)}
                            className="w-32 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={product.category}
                            onChange={(e) => handleFieldChange(product.tempId, 'category', e.target.value)}
                            className="w-32 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={product.description}
                            onChange={(e) => handleFieldChange(product.tempId, 'description', e.target.value)}
                            className="w-48 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => handleRemoveProduct(product.tempId)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs"
                            title="Remove"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {products.some(p => p.errors.length > 0) && (
                      <tr>
                        <td colSpan={9} className="py-3 px-3">
                          <div className="text-xs text-red-600 dark:text-red-400">
                            <strong>Validation Errors:</strong>
                            <ul className="list-disc ml-4 mt-1">
                              {products.map((p, idx) => 
                                p.errors.length > 0 ? (
                                  <li key={p.tempId}>
                                    Row {idx + 1}: {p.errors.join(', ')}
                                  </li>
                                ) : null
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {products.length > 0 && (
          <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-600">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing || products.some(p => p.errors.length > 0)}
              className="px-6 py-2 bg-brand-700 text-white rounded-lg hover:bg-brand-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Importing...' : `Import ${validProducts} Product${validProducts !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
