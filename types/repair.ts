// Repair Category Types
export interface RepairCategory {
  _id: string
  name: string
  description?: string
  estimatedCost: number
  estimatedTime: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Customer Info for Repairs
export interface RepairCustomerInfo {
  name: string
  email?: string
  phone: string
}

// Device Information for Repairs  
export interface DeviceInfo {
  brand: string
  model: string
  serialNumber?: string
  imei?: string
  condition: string
  issueDescription: string
}

// Parts Used in Repair
export interface PartUsed {
  partName: string
  cost: number
  quantity: number
}

// Complete Repair Ticket Interface
export interface RepairTicket {
  id: string
  ticketNumber: string
  customerInfo: RepairCustomerInfo
  deviceInfo: DeviceInfo
  status: 'pending' | 'in-progress' | 'waiting-parts' | 'completed' | 'picked-up' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  categoryId?: string
  categoryName?: string
  estimatedCost: number
  actualCost?: number
  partsUsed?: PartUsed[]
  laborCost: number
  notes: string
  technicianId?: string
  dateReceived: Date
  estimatedCompletionDate?: Date
  actualCompletionDate?: Date
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  paidAmount: number
  paymentMethod?: 'cash' | 'card' | 'upi' | 'bank-transfer' | 'other'
  paymentDate?: Date
  paymentNotes?: string
  createdAt: Date
  updatedAt: Date
}

// Modal and Component Props
export interface RepairCategoriesSectionProps {
  onCategoryChange?: () => void
}

export interface RepairTicketsSectionProps {
  repairs: RepairTicket[]
  onAddRepair: () => void
  onUpdateRepairStatus: (repairId: string, status: RepairTicket['status'], additionalData?: Partial<RepairTicket>) => Promise<void>
}

export interface RepairsSectionProps {
  repairs: RepairTicket[]
  onAddRepair: () => void
  onUpdateRepairStatus: (repairId: string, status: RepairTicket['status'], additionalData?: Partial<RepairTicket>) => Promise<void>
}
