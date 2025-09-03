// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  barcode: string;
  category?: string;
  description?: string;
  images?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sales types
export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount?: number;
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Online' | 'Transfer' | 'Store Credit' | 'Square';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  receiptNumber: string;
  cashierId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Repair types
export interface RepairTicket {
  id: string;
  ticketNumber: string;
  customerInfo: {
    name: string;
    email?: string;
    phone: string;
  };
  deviceInfo: {
    brand: string;
    model: string;
    serialNumber?: string;
    condition: string;
    issueDescription: string;
  };
  status: 'pending' | 'in-progress' | 'waiting-parts' | 'completed' | 'picked-up' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCost: number;
  actualCost?: number;
  partsUsed?: Array<{
    partName: string;
    cost: number;
    quantity: number;
  }>;
  laborCost: number;
  notes: string;
  technicianId?: string;
  dateReceived: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Settings types
export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  lowStockThreshold: number;
  autoBackup: boolean;
  printerSettings: {
    receiptPrinter: string;
    labelPrinter: string;
  };
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'checkbox';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: (value: any) => string | null;
}
