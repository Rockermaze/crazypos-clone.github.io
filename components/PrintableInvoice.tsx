'use client'
import { Sale, StoreSettings } from '@/types'

interface PrintableInvoiceProps {
  sale: Sale
  storeSettings: StoreSettings | null
}

export function PrintableInvoice({ sale, storeSettings }: PrintableInvoiceProps) {
  return (
    <div className="print-invoice" style={{ display: 'none' }}>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-invoice,
          .print-invoice * {
            visibility: visible;
          }
          .print-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      `}</style>
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        color: '#000'
      }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#4F46E5', 
          color: '#fff', 
          padding: '30px',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: '32px', 
            margin: '0 0 15px 0',
            fontWeight: 'bold'
          }}>
            {storeSettings?.storeName || 'YourPOS Store'}
          </h1>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div>{storeSettings?.storeAddress || ''}</div>
            <div>Phone: {storeSettings?.storePhone || 'N/A'}</div>
            <div>Email: {storeSettings?.storeEmail || 'N/A'}</div>
          </div>
        </div>

        {/* Invoice Title and Details */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '30px'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '28px', 
              margin: '0 0 10px 0',
              fontWeight: 'bold'
            }}>
              INVOICE
            </h2>
            {sale.customerInfo && (sale.customerInfo.name || sale.customerInfo.phone) && (
              <div>
                <strong>Bill To:</strong>
                <div style={{ marginTop: '5px' }}>
                  {sale.customerInfo.name && <div>{sale.customerInfo.name}</div>}
                  {sale.customerInfo.phone && <div>Phone: {sale.customerInfo.phone}</div>}
                  {sale.customerInfo.email && <div>Email: {sale.customerInfo.email}</div>}
                </div>
              </div>
            )}
          </div>
          <div style={{ 
            backgroundColor: '#F3F4F6', 
            padding: '15px',
            textAlign: 'right'
          }}>
            <div><strong>Receipt #:</strong> {sale.receiptNumber || 'N/A'}</div>
            <div><strong>Date:</strong> {new Date(sale.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</div>
            <div><strong>Payment:</strong> {sale.paymentMethod || 'CASH'}</div>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          marginBottom: '30px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#4F46E5', color: '#fff' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>#</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Item</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Qty</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Unit Price</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Discount</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, index) => (
              <tr key={index}>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                  {index + 1}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>
                  {item.productName}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                  {item.quantity}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  {storeSettings?.currency || 'USD'} {item.unitPrice.toFixed(2)}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  {item.discount ? `${storeSettings?.currency || 'USD'} ${item.discount.toFixed(2)}` : '-'}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  {storeSettings?.currency || 'USD'} {item.totalPrice.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          marginBottom: '40px'
        }}>
          <div style={{ 
            backgroundColor: '#F3F4F6', 
            padding: '20px',
            minWidth: '300px'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Subtotal:</span>
              <span>{storeSettings?.currency || 'USD'} {sale.subtotal.toFixed(2)}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span>Tax ({storeSettings?.taxRate || 0}%):</span>
              <span>{storeSettings?.currency || 'USD'} {sale.tax.toFixed(2)}</span>
            </div>
            {sale.discount > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span>Discount:</span>
                <span>-{storeSettings?.currency || 'USD'} {sale.discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '18px',
              fontWeight: 'bold',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '2px solid #000'
            }}>
              <span>TOTAL:</span>
              <span>{storeSettings?.currency || 'USD'} {sale.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          borderTop: '1px solid #ddd',
          paddingTop: '20px',
          textAlign: 'center',
          color: '#6B7280',
          fontSize: '12px'
        }}>
          <p>{storeSettings?.receiptFooter || 'Thank you for your business!'}</p>
          <p style={{ marginTop: '10px' }}>
            Generated on {new Date().toLocaleString('en-US')}
          </p>
        </div>
      </div>
    </div>
  )
}
