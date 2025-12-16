# Payment Dashboard - Fee Calculations & Accuracy

## Overview
The Payment Dashboard displays accurate financial metrics by tracking all transactions and their associated processing fees.

## Fee Structure

### Stripe Payments
- **Fee**: Platform-dependent (default: 1.5% of transaction)
- **Calculated at**: Payment Intent creation
- **Stored as**: `applicationFeeAmount` in Transaction model
- **Net Amount**: `amount - applicationFeeAmount`

### Manual Payment Methods

#### Credit/Debit Cards
- **Fee**: 2.9% + $0.30 (Standard card processing fee)
- **Type**: PROCESSING_FEE
- **Example**: $100 sale = $3.20 fee, $96.80 net

#### Online Payments
- **Fee**: 3.5% (Gateway fee)
- **Type**: GATEWAY_FEE
- **Example**: $100 sale = $3.50 fee, $96.50 net

#### Cash & Store Credit
- **Fee**: $0.00 (No processing fees)
- **Type**: TRANSACTION_FEE
- **Net Amount**: Equals total amount

## Dashboard Metrics

### 1. Total Revenue
- **Calculation**: Sum of all COMPLETED transaction amounts
- **Query**: `$sum: '$amount'` where `status: 'COMPLETED'`
- **Includes**: All payment methods (Stripe, Cash, Cards, etc.)

### 2. Net Amount
- **Calculation**: Sum of all net amounts (amount - fees)
- **Query**: `$sum: '$netAmount'` where `status: 'COMPLETED'`
- **Formula**: `Total Revenue - Processing Fees`
- **Verification**: Backend validates `netAmount = amount - fee.amount`

### 3. Processing Fees
- **Calculation**: Sum of all transaction fees
- **Query**: `$sum: '$fee.amount'` where `status: 'COMPLETED'`
- **Breakdown**: Separated by payment method

### 4. Average Transaction
- **Calculation**: Average of all transaction amounts
- **Query**: `$avg: '$amount'` where `status: 'COMPLETED'`
- **Display**: Formatted as currency

## Accuracy Checks

### Backend Validation
Location: `app/api/transactions/statistics/route.js` (lines 243-258)

```javascript
// Verify calculation accuracy
const calculatedNetAmount = totalAmount - totalFees
if (Math.abs(storedNetAmount - calculatedNetAmount) > 0.01) {
  console.warn('Net amount mismatch detected')
  // Use calculated value as source of truth
  statistics.overall.totalNetAmount = calculatedNetAmount
}
```

### Transaction Pre-Save Hook
Location: `models/Transaction.js` (lines 229-233)

```javascript
transactionSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('fee.amount')) {
    this.netAmount = this.amount - (this.fee?.amount || 0)
  }
  next()
})
```

## Data Flow

### 1. Sale Creation (Manual Payment)
```
User completes sale → 
Sales API creates Transaction with fees → 
Fee calculated based on payment method → 
netAmount = amount - fee → 
Transaction saved to DB
```

### 2. Stripe Payment
```
Payment Intent created with platform fee → 
Transaction created in PENDING status → 
Webhook receives payment.succeeded → 
Transaction updated to COMPLETED → 
Fee and netAmount verified/updated → 
Sale record created if missing
```

### 3. Dashboard Query
```
User opens dashboard → 
Statistics API aggregates all COMPLETED transactions → 
Calculates sums and averages → 
Validates netAmount calculation → 
Returns formatted data → 
Dashboard displays metrics
```

## Testing Calculations

### Scenario 1: Cash Sale
- Amount: $100.00
- Fee: $0.00
- Net: $100.00
- Dashboard shows: Revenue +$100, Fee +$0, Net +$100

### Scenario 2: Credit Card Sale
- Amount: $100.00
- Fee: $3.20 (2.9% + $0.30)
- Net: $96.80
- Dashboard shows: Revenue +$100, Fee +$3.20, Net +$96.80

### Scenario 3: Stripe Payment
- Amount: $100.00
- Fee: $1.50 (1.5% platform fee)
- Net: $98.50
- Dashboard shows: Revenue +$100, Fee +$1.50, Net +$98.50

## API Endpoints

### Get Transaction Statistics
**Endpoint**: `GET /api/transactions/statistics`

**Query Parameters**:
- `startDate`: Filter start date (optional)
- `endDate`: Filter end date (optional)
- `period`: Grouping period - day/week/month/year (default: month)

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "overall": {
      "totalAmount": 1000.00,
      "totalNetAmount": 960.00,
      "totalFees": 40.00,
      "transactionCount": 10,
      "averageAmount": 100.00,
      "formattedTotalAmount": "$1,000.00",
      "formattedTotalNetAmount": "$960.00",
      "formattedAverageAmount": "$100.00"
    },
    "statusBreakdown": [...],
    "paymentMethodBreakdown": [...],
    "recentTransactions": [...]
  }
}
```

## Common Issues & Solutions

### Issue: Fees showing as $0.00
**Cause**: Old transactions created before fee calculation was implemented
**Solution**: Transactions are calculated on new sales going forward. Old data may show $0 fees.

### Issue: Net Amount equals Total Revenue
**Cause**: No fee-generating payment methods used (all cash)
**Solution**: This is expected if only cash payments are processed

### Issue: Fee percentage seems wrong
**Cause**: Different payment methods have different fee structures
**Solution**: Check payment method breakdown to see fee distribution

## Fee Customization

To modify fee percentages, update the fee calculation logic in:
- **Sales API**: `app/api/sales/route.js` (lines 252-268)
- **Platform Fee**: `lib/stripe.js` - `calculatePlatformFee()` function

### Example: Change Card Processing Fee
```javascript
// In app/api/sales/route.js
if (method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
  feeAmount = (savedSale.total * 0.029) + 0.30  // Change 0.029 to desired %
  feeType = 'PROCESSING_FEE'
}
```

## Best Practices

1. **Always validate calculations**: Backend validates netAmount on every save
2. **Use consistent fee types**: PROCESSING_FEE, GATEWAY_FEE, TRANSACTION_FEE, SERVICE_FEE
3. **Round to 2 decimals**: All amounts stored with 2 decimal precision
4. **Log discrepancies**: Mismatches are logged to console for debugging
5. **Test with real data**: Create test transactions to verify calculations

## Troubleshooting

### Check Transaction Data
```javascript
// In MongoDB or API
db.transactions.find({ userId: "USER_ID", status: "COMPLETED" })
  .forEach(t => {
    const calculated = t.amount - (t.fee?.amount || 0)
    console.log(`${t.transactionId}: Amount=${t.amount}, Fee=${t.fee?.amount}, Net=${t.netAmount}, Calculated=${calculated}`)
  })
```

### Verify Dashboard Query
Test the statistics endpoint directly:
```bash
curl -X GET "http://localhost:3000/api/transactions/statistics" \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

## Future Enhancements

1. **Configurable Fee Rates**: Allow users to set custom fee percentages per payment method
2. **Fee Reports**: Dedicated reports showing fee breakdown over time
3. **Tax Tracking**: Separate sales tax from processing fees
4. **Multi-Currency**: Support fee calculations in different currencies
5. **Batch Fee Updates**: Tool to recalculate fees for historical transactions
