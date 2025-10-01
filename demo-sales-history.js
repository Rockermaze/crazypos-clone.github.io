// Sales History Demo Script
// This script demonstrates the functionality and generates sample output

const fs = require('fs');
const path = require('path');

// Sample sales data that would come from your database
const sampleSalesData = [
  {
    id: "674d1a2b3c4e5f6789012345",
    receiptNumber: "R1001",
    createdAt: "2024-12-01T10:30:00Z",
    items: [
      {
        productId: "prod001",
        productName: "iPhone 15 Pro",
        quantity: 1,
        unitPrice: 999.00,
        totalPrice: 999.00,
        itemCost: 750.00,
        itemProfit: 249.00,
        profitMargin: 24.9
      },
      {
        productId: "prod002",
        productName: "AirPods Pro",
        quantity: 2,
        unitPrice: 249.00,
        totalPrice: 498.00,
        itemCost: 360.00,
        itemProfit: 138.00,
        profitMargin: 27.7
      }
    ],
    subtotal: 1497.00,
    tax: 149.70,
    total: 1646.70,
    totalCost: 1110.00,
    totalProfit: 387.00,
    profitMargin: 23.5,
    paymentMethod: "card",
    customerInfo: {
      name: "John Smith",
      email: "john@email.com",
      phone: "+1-555-0123"
    }
  },
  {
    id: "674d1a2b3c4e5f6789012346",
    receiptNumber: "R1002",
    createdAt: "2024-12-01T14:45:00Z",
    items: [
      {
        productId: "prod003",
        productName: "MacBook Air M3",
        quantity: 1,
        unitPrice: 1299.00,
        totalPrice: 1299.00,
        itemCost: 950.00,
        itemProfit: 349.00,
        profitMargin: 26.9
      }
    ],
    subtotal: 1299.00,
    tax: 129.90,
    total: 1428.90,
    totalCost: 950.00,
    totalProfit: 349.00,
    profitMargin: 24.4,
    paymentMethod: "cash",
    customerInfo: {
      name: "Sarah Johnson",
      email: "sarah@email.com",
      phone: "+1-555-0456"
    }
  },
  {
    id: "674d1a2b3c4e5f6789012347",
    receiptNumber: "R1003",
    createdAt: "2024-12-02T09:15:00Z",
    items: [
      {
        productId: "prod004",
        productName: "iPad Pro 12.9\"",
        quantity: 1,
        unitPrice: 1099.00,
        totalPrice: 1099.00,
        itemCost: 800.00,
        itemProfit: 299.00,
        profitMargin: 27.2
      },
      {
        productId: "prod005",
        productName: "Apple Pencil",
        quantity: 1,
        unitPrice: 129.00,
        totalPrice: 129.00,
        itemCost: 85.00,
        itemProfit: 44.00,
        profitMargin: 34.1
      }
    ],
    subtotal: 1228.00,
    tax: 122.80,
    total: 1350.80,
    totalCost: 885.00,
    totalProfit: 343.00,
    profitMargin: 25.4,
    paymentMethod: "digital",
    customerInfo: {
      name: "Mike Wilson",
      email: "mike@email.com",
      phone: "+1-555-0789"
    }
  }
];

// Calculate summary statistics
function calculateSummary(salesData) {
  const totalSales = salesData.length;
  const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
  const totalSubtotal = salesData.reduce((sum, sale) => sum + sale.subtotal, 0);
  const totalTax = salesData.reduce((sum, sale) => sum + sale.tax, 0);
  const totalCost = salesData.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalProfit = salesData.reduce((sum, sale) => sum + sale.totalProfit, 0);
  const grossProfit = totalSubtotal - totalCost;
  const averageOrderValue = totalRevenue / totalSales;
  const profitMargin = (totalProfit / totalRevenue) * 100;
  const grossProfitMargin = (grossProfit / totalSubtotal) * 100;

  return {
    totalSales,
    totalRevenue,
    totalSubtotal,
    totalTax,
    totalCost,
    totalProfit,
    grossProfit,
    averageOrderValue,
    profitMargin,
    grossProfitMargin
  };
}

// Generate API response format
function generateAPIResponse() {
  const summary = calculateSummary(sampleSalesData);
  
  return {
    sales: sampleSalesData,
    summary: summary
  };
}

// Generate readable report output
function generateReportOutput() {
  const summary = calculateSummary(sampleSalesData);
  const dateRange = {
    startDate: "2024-01-01",
    endDate: "2024-12-31"
  };

  let output = `
╔══════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                        📊 FINANCIAL REPORT                                          ║
║                                          YourPOS Store                                              ║
╠══════════════════════════════════════════════════════════════════════════════════════════════════════╣
║ Period: ${dateRange.startDate} - ${dateRange.endDate}                                                     ║
║ Report Generated: ${new Date().toLocaleDateString()}                                                              ║
║ Total Transactions: ${summary.totalSales}                                                                         ║
╚══════════════════════════════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    💰 FINANCIAL SUMMARY                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Primary Metrics:                          │ Analysis:                                           │
│ • Total Revenue:      $${summary.totalRevenue.toFixed(2).padStart(10)}   │ • Net Margin:        ${summary.profitMargin.toFixed(1).padStart(6)}%     │
│ • Cost of Goods:      $${summary.totalCost.toFixed(2).padStart(10)}   │ • Avg Order:         $${summary.averageOrderValue.toFixed(2).padStart(7)}    │
│ • Net Profit:         $${summary.totalProfit.toFixed(2).padStart(10)}   │ • Gross Margin:      ${summary.grossProfitMargin.toFixed(1).padStart(6)}%     │
│                                           │                                                     │
│ Tax Analysis:                             │                                                     │
│ • Pre-Tax Revenue:    $${summary.totalSubtotal.toFixed(2).padStart(10)}   │                                                     │
│ • Tax Collected:      $${summary.totalTax.toFixed(2).padStart(10)}   │                                                     │
│ • Gross Profit:       $${summary.grossProfit.toFixed(2).padStart(10)}   │                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      📋 SALES DETAILS                                              │
├──────────┬─────────────┬──────────┬──────────┬─────────┬─────────┬────────┬─────────────────────────┤
│Receipt # │ Date        │ Time     │ Total    │ Cost    │ Profit  │Margin% │ Payment   │ Customer  │
├──────────┼─────────────┼──────────┼──────────┼─────────┼─────────┼────────┼───────────┼───────────┤`;

  sampleSalesData.forEach(sale => {
    const date = new Date(sale.createdAt);
    const dateStr = date.toLocaleDateString().padEnd(11);
    const timeStr = date.toLocaleTimeString().substring(0, 8).padEnd(8);
    
    output += `\n│ ${sale.receiptNumber.padEnd(8)} │ ${dateStr} │ ${timeStr} │ $${sale.total.toFixed(2).padStart(7)} │ $${sale.totalCost.toFixed(2).padStart(6)} │ $${sale.totalProfit.toFixed(2).padStart(6)} │ ${sale.profitMargin.toFixed(1).padStart(5)}% │ ${sale.paymentMethod.toUpperCase().padEnd(9)} │ ${(sale.customerInfo?.name || 'Guest').padEnd(9)} │`;
  });

  output += `
└──────────┴─────────────┴──────────┴──────────┴─────────┴─────────┴────────┴───────────┴───────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    📦 TOP SELLING ITEMS                                             │
├─────────────────────────────────┬─────────┬──────────┬─────────┬─────────┬─────────────────────────┤
│ Product Name                    │Qty Sold │ Revenue  │ Cost    │ Profit  │ Margin %              │
├─────────────────────────────────┼─────────┼──────────┼─────────┼─────────┼───────────────────────┤`;

  // Aggregate items
  const itemsMap = new Map();
  sampleSalesData.forEach(sale => {
    sale.items.forEach(item => {
      const key = item.productName;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          name: item.productName,
          quantity: 0,
          revenue: 0,
          profit: 0,
          cost: 0
        });
      }
      const existing = itemsMap.get(key);
      existing.quantity += item.quantity;
      existing.revenue += item.totalPrice;
      existing.profit += item.itemProfit;
      existing.cost += item.itemCost;
    });
  });

  const topItems = Array.from(itemsMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  topItems.forEach(item => {
    const margin = item.revenue > 0 ? (item.profit / item.revenue * 100) : 0;
    output += `\n│ ${item.name.padEnd(31)} │ ${item.quantity.toString().padStart(7)} │ $${item.revenue.toFixed(2).padStart(7)} │ $${item.cost.toFixed(2).padStart(6)} │ $${item.profit.toFixed(2).padStart(6)} │ ${margin.toFixed(1).padStart(20)}% │`;
  });

  output += `
└─────────────────────────────────┴─────────┴──────────┴─────────┴─────────┴───────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      🎯 KEY INSIGHTS                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ • Best Performing Category: Electronics with ${summary.profitMargin.toFixed(1)}% average margin                        │
│ • Highest Value Sale: $${Math.max(...sampleSalesData.map(s => s.total)).toFixed(2)} (${sampleSalesData.find(s => s.total === Math.max(...sampleSalesData.map(s => s.total))).receiptNumber})                                       │
│ • Most Popular Payment: ${getMostPopularPayment(sampleSalesData)}                                                      │
│ • Customer Retention: ${sampleSalesData.filter(s => s.customerInfo?.name).length}/${sampleSalesData.length} sales with customer info                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════════════════════════════════════════
Generated by YourPOS - Professional Point of Sale System
Report ID: RPT-${Date.now()} | Generated: ${new Date().toISOString()}
═════════════════════════════════════════════════════════════════════════════════════════════════════
`;

  return output;
}

function getMostPopularPayment(sales) {
  const paymentCounts = {};
  sales.forEach(sale => {
    paymentCounts[sale.paymentMethod] = (paymentCounts[sale.paymentMethod] || 0) + 1;
  });
  const mostPopular = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1])[0];
  return `${mostPopular[0].toUpperCase()} (${mostPopular[1]} transactions)`;
}

// Generate component state demo
function generateComponentStateDemo() {
  const dateRange = {
    startDate: "2024-01-01",
    endDate: "2024-12-31"
  };

  return {
    dateRange,
    isGeneratingReport: false,
    reportPreview: generateAPIResponse(),
    showPreview: true,
    filteredSales: sampleSalesData
  };
}

console.log("🚀 YourPOS Sales History Demo");
console.log("=" .repeat(80));
console.log();

console.log("📊 API Response Format:");
console.log("─".repeat(40));
console.log(JSON.stringify(generateAPIResponse(), null, 2));
console.log();

console.log("📄 Report Output:");
console.log(generateReportOutput());

console.log();
console.log("⚛️ React Component State:");
console.log("─".repeat(40));
console.log(JSON.stringify(generateComponentStateDemo(), null, 2));

// Write output to file for easy viewing
fs.writeFileSync('sales-history-demo-output.txt', generateReportOutput());
console.log();
console.log("✅ Demo output saved to: sales-history-demo-output.txt");
console.log("✅ You can also view the PDF report by running the React component in your browser!");