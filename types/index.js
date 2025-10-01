// Product types

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {number} [cost]
 * @property {number} stock
 * @property {string} barcode
 * @property {string} [category]
 * @property {string} [description]
 * @property {string[]} [images]
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

// Sales types

/**
 * @typedef {Object} SaleItem
 * @property {string} productId
 * @property {string} productName
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {number} totalPrice
 * @property {number} [discount]
 */

/**
 * @typedef {Object} Sale
 * @property {string} id
 * @property {SaleItem[]} items
 * @property {number} subtotal
 * @property {number} tax
 * @property {number} discount
 * @property {number} total
 * @property {'Cash' | 'Card' | 'Online' | 'Transfer' | 'Store Credit' | 'Square'} paymentMethod
 * @property {'pending' | 'completed' | 'refunded'} paymentStatus
 * @property {CustomerInfo} [customerInfo]
 * @property {string} receiptNumber
 * @property {string} cashierId
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} CustomerInfo
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [phone]
 */

// Repair types

/**
 * @typedef {Object} RepairCategory
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} estimatedCost
 * @property {number} estimatedTime - in minutes
 * @property {boolean} isActive
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} RepairTicket
 * @property {string} id
 * @property {string} ticketNumber
 * @property {RepairCustomerInfo} customerInfo
 * @property {DeviceInfo} deviceInfo
 * @property {'pending' | 'in-progress' | 'waiting-parts' | 'completed' | 'picked-up' | 'cancelled'} status
 * @property {'low' | 'medium' | 'high' | 'urgent'} priority
 * @property {string} [categoryId] - Reference to RepairCategory
 * @property {string} [categoryName] - Name of repair category
 * @property {number} estimatedCost
 * @property {number} [actualCost]
 * @property {PartUsed[]} [partsUsed]
 * @property {number} laborCost
 * @property {string} notes
 * @property {string} [technicianId]
 * @property {Date} dateReceived
 * @property {Date} [estimatedCompletion]
 * @property {Date} [actualCompletion]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef {Object} RepairCustomerInfo
 * @property {string} name
 * @property {string} [email]
 * @property {string} phone
 */

/**
 * @typedef {Object} DeviceInfo
 * @property {string} brand
 * @property {string} model
 * @property {string} [serialNumber]
 * @property {string} condition
 * @property {string} issueDescription
 */

/**
 * @typedef {Object} PartUsed
 * @property {string} partName
 * @property {number} cost
 * @property {number} quantity
 */

// Settings types

/**
 * @typedef {Object} StoreSettings
 * @property {string} storeName
 * @property {string} storeAddress
 * @property {string} storePhone
 * @property {string} storeEmail
 * @property {number} taxRate
 * @property {string} currency
 * @property {string} receiptFooter
 * @property {number} lowStockThreshold
 * @property {boolean} autoBackup
 * @property {PrinterSettings} printerSettings
 */

/**
 * @typedef {Object} PrinterSettings
 * @property {string} receiptPrinter
 * @property {string} labelPrinter
 */

// Modal types

/**
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen
 * @property {() => void} onClose
 * @property {string} [title]
 * @property {React.ReactNode} children
 */

// Form types

/**
 * @typedef {Object} FormField
 * @property {string} name
 * @property {string} label
 * @property {'text' | 'number' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'checkbox'} type
 * @property {boolean} [required]
 * @property {Array<{value: string, label: string}>} [options]
 * @property {(value: any) => string | null} [validation]
 */

export {}
