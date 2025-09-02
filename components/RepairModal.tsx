'use client'
import { useState, useEffect } from 'react'
import { Modal } from '@/components/Modal'
import { RepairTicket } from '@/types'

interface RepairModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (repairData: Omit<RepairTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => void
  repair?: RepairTicket | null
}

export function RepairModal({ isOpen, onClose, onSave, repair }: RepairModalProps) {
  const [formData, setFormData] = useState({
    customerInfo: {
      name: '',
      email: '',
      phone: ''
    },
    deviceInfo: {
      brand: '',
      model: '',
      serialNumber: '',
      condition: '',
      issueDescription: ''
    },
    status: 'pending' as const,
    priority: 'medium' as const,
    estimatedCost: 0,
    laborCost: 0,
    notes: '',
    dateReceived: new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (repair) {
      setFormData({
        customerInfo: repair.customerInfo,
        deviceInfo: repair.deviceInfo,
        status: repair.status,
        priority: repair.priority,
        estimatedCost: repair.estimatedCost,
        laborCost: repair.laborCost,
        notes: repair.notes,
        dateReceived: new Date(repair.dateReceived).toISOString().split('T')[0]
      })
    } else {
      setFormData({
        customerInfo: {
          name: '',
          email: '',
          phone: ''
        },
        deviceInfo: {
          brand: '',
          model: '',
          serialNumber: '',
          condition: '',
          issueDescription: ''
        },
        status: 'pending',
        priority: 'medium',
        estimatedCost: 0,
        laborCost: 0,
        notes: '',
        dateReceived: new Date().toISOString().split('T')[0]
      })
    }
    setErrors({})
  }, [repair, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('customer.')) {
      const field = name.replace('customer.', '')
      setFormData(prev => ({
        ...prev,
        customerInfo: { ...prev.customerInfo, [field]: value }
      }))
    } else if (name.startsWith('device.')) {
      const field = name.replace('device.', '')
      setFormData(prev => ({
        ...prev,
        deviceInfo: { ...prev.deviceInfo, [field]: value }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      }))
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerInfo.name.trim()) newErrors['customer.name'] = 'Customer name is required'
    if (!formData.customerInfo.phone.trim()) newErrors['customer.phone'] = 'Phone number is required'
    if (!formData.deviceInfo.brand.trim()) newErrors['device.brand'] = 'Device brand is required'
    if (!formData.deviceInfo.model.trim()) newErrors['device.model'] = 'Device model is required'
    if (!formData.deviceInfo.issueDescription.trim()) newErrors['device.issueDescription'] = 'Issue description is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      const repairData = {
        ...formData,
        dateReceived: new Date(formData.dateReceived)
      }
      onSave(repairData)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={repair ? 'Edit Repair Ticket' : 'New Repair Ticket'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="customer.name" className="block text-sm font-medium text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                id="customer.name"
                name="customer.name"
                value={formData.customerInfo.name}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 ${
                  errors['customer.name'] 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                }`}
                placeholder="Enter customer name"
              />
              {errors['customer.name'] && <p className="mt-1 text-xs text-red-600">{errors['customer.name']}</p>}
            </div>

            <div>
              <label htmlFor="customer.phone" className="block text-sm font-medium text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                id="customer.phone"
                name="customer.phone"
                value={formData.customerInfo.phone}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 ${
                  errors['customer.phone'] 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                }`}
                placeholder="Enter phone number"
              />
              {errors['customer.phone'] && <p className="mt-1 text-xs text-red-600">{errors['customer.phone']}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="customer.email" className="block text-sm font-medium text-slate-700 mb-1">
              Email (Optional)
            </label>
            <input
              type="email"
              id="customer.email"
              name="customer.email"
              value={formData.customerInfo.email}
              onChange={handleInputChange}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Device Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Device Information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="device.brand" className="block text-sm font-medium text-slate-700 mb-1">
                Brand *
              </label>
              <input
                type="text"
                id="device.brand"
                name="device.brand"
                value={formData.deviceInfo.brand}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 ${
                  errors['device.brand'] 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                }`}
                placeholder="e.g., Apple, Samsung"
              />
              {errors['device.brand'] && <p className="mt-1 text-xs text-red-600">{errors['device.brand']}</p>}
            </div>

            <div>
              <label htmlFor="device.model" className="block text-sm font-medium text-slate-700 mb-1">
                Model *
              </label>
              <input
                type="text"
                id="device.model"
                name="device.model"
                value={formData.deviceInfo.model}
                onChange={handleInputChange}
                className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 ${
                  errors['device.model'] 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                }`}
                placeholder="e.g., iPhone 15, Galaxy S24"
              />
              {errors['device.model'] && <p className="mt-1 text-xs text-red-600">{errors['device.model']}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="device.issueDescription" className="block text-sm font-medium text-slate-700 mb-1">
              Issue Description *
            </label>
            <textarea
              id="device.issueDescription"
              name="device.issueDescription"
              value={formData.deviceInfo.issueDescription}
              onChange={handleInputChange}
              rows={3}
              className={`w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-1 ${
                errors['device.issueDescription'] 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                  : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
              }`}
              placeholder="Describe the issue with the device"
            />
            {errors['device.issueDescription'] && <p className="mt-1 text-xs text-red-600">{errors['device.issueDescription']}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="estimatedCost" className="block text-sm font-medium text-slate-700 mb-1">
                Estimated Cost ($)
              </label>
              <input
                type="number"
                id="estimatedCost"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-slate-700 font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-brand-700 px-4 py-2 text-white font-medium hover:bg-brand-500"
          >
            {repair ? 'Update Ticket' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
