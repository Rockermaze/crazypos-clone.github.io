# Sample Product Import Template

## Excel File Format

Create an Excel file (.xlsx or .xls) with the following columns:

| Name | Price | Cost | Stock | Barcode | Category | Description |
|------|-------|------|-------|---------|----------|-------------|
| iPhone 13 Pro | 999.99 | 800.00 | 50 | 194252018071 | Electronics | Latest iPhone model |
| Samsung Galaxy S22 | 899.99 | 700.00 | 30 | 887276578 | Electronics | Flagship Samsung phone |
| USB-C Cable | 15.99 | 8.00 | 200 | 123456789012 | Accessories | High-quality USB-C cable |
| Phone Case | 29.99 | 12.00 | 150 | 987654321098 | Accessories | Protective phone case |

## Column Details

### Required Columns:
- **Name**: Product name (max 200 characters)
- **Price**: Selling price (must be >= 0)
- **Barcode**: Unique product barcode/SKU (max 50 characters)

### Optional Columns:
- **Cost**: Product cost/wholesale price (default: 0)
- **Stock**: Initial stock quantity (default: 0)
- **Category**: Product category (default: "General")
- **Description**: Product description (max 1000 characters)

## Important Notes:

1. **Column names are case-insensitive** - "Name", "name", or "NAME" all work
2. **Barcodes must be unique** - Duplicate barcodes will be rejected
3. **Negative values not allowed** - Price, Cost, and Stock must be >= 0
4. **First row must be headers** - Column names in the first row
5. **Empty cells in optional columns** - Will use default values

## Tips:

- Test with a small file (5-10 products) first
- Review the preview table before importing
- Edit any values directly in the preview table if needed
- Remove any products from the preview before importing

## Example Data:

You can copy and paste this table into Excel to get started:

```
Name                    Price   Cost    Stock   Barcode         Category        Description
iPhone 13 Pro          999.99   800.00  50      194252018071    Electronics     Latest iPhone model
Samsung Galaxy S22     899.99   700.00  30      887276578       Electronics     Flagship Samsung phone
Wireless Headphones    149.99   80.00   100     192837465012    Electronics     Noise-cancelling headphones
USB-C Cable            15.99    8.00    200     123456789012    Accessories     High-quality USB-C cable
Phone Case             29.99    12.00   150     987654321098    Accessories     Protective phone case
Screen Protector       12.99    5.00    300     456789123456    Accessories     Tempered glass protector
Laptop Stand           49.99    25.00   75      789123456789    Accessories     Adjustable aluminum stand
Bluetooth Speaker      79.99    40.00   60      321654987321    Electronics     Portable waterproof speaker
```
