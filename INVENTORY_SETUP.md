# Infinity Gaming Lounge POS - Inventory Module Setup

## Overview

This inventory management system provides comprehensive stock tracking, sales integration, and analytics for your gaming lounge. It includes real-time stock monitoring, loyalty point redemption, and detailed reporting.

## Features Implemented

### ✅ Core Inventory Management
- **CRUD Operations**: Add, view, edit, and delete inventory items
- **Stock Tracking**: Real-time stock level monitoring
- **Categories**: Snack, Drink, Merchandise, Equipment, Voucher
- **Supplier Management**: Track suppliers and cost prices
- **Expiry Tracking**: Monitor items nearing expiration

### ✅ Smart Features
- **Low Stock Alerts**: Automatic alerts for items below 5 units
- **VIP-Only Items**: Restrict certain items to VIP customers
- **Promotional Items**: Highlight items on promotion
- **Loyalty Integration**: Items redeemable with points
- **Stock Value Calculation**: Real-time inventory value tracking

### ✅ Analytics & Reporting
- **Dashboard Statistics**: Total items, stock value, sales metrics
- **Top Selling Items**: Daily best performers
- **Category Breakdown**: Inventory distribution by category
- **Expiring Items**: Items expiring within 7 days
- **Transaction History**: Complete audit trail

### ✅ Sales Integration
- **POS Integration**: Sell items during game sessions
- **Payment Methods**: Cash, M-Pesa, Points redemption
- **Automatic Stock Reduction**: Stock updates on sale
- **Session Linking**: Connect sales to game sessions

## Database Setup

### Step 1: Run the Database Schema

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `src/lib/sql/inventory_schema.sql`
4. Click **Run** to execute the schema

This will create:
- `inventory_items` table with all required fields
- `inventory_transactions` table for audit trail
- Database functions for automated stock management
- Sample inventory items for testing

### Step 2: Verify Tables Created

Run this query in Supabase SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory_items', 'inventory_transactions');

-- Check sample data
SELECT COUNT(*) as item_count FROM inventory_items;
```

## Frontend Features

### Inventory Dashboard (`/inventory`)

**Main Features:**
- 📊 **Statistics Cards**: Total items, stock value, low stock alerts
- 📋 **Inventory Table**: Searchable, filterable item listing
- ⚡ **Quick Actions**: Add, edit, restock, delete items
- 🎯 **Smart Filters**: By category, stock level, search terms

**Analytics Sidebar:**
- 🚨 **Low Stock Alerts**: Items needing immediate attention
- ⏰ **Expiring Items**: Items expiring within 7 days
- 🏆 **Top Selling Items**: Daily best performers
- 📊 **Category Breakdown**: Inventory distribution

### Item Management

**Add New Item:**
- Name, category, stock quantity, pricing
- Supplier information and cost tracking
- Expiry date management
- Loyalty points integration
- VIP-only and promotional flags

**Edit Existing Items:**
- Update all item details
- Modify stock quantities
- Change pricing and supplier info
- Toggle special features

**Stock Management:**
- **Restock**: Add inventory with cost tracking
- **Adjustments**: Manual stock corrections
- **Automatic Updates**: Stock reduces on sales

## API Endpoints

### Inventory CRUD
- `GET /api/inventory` - List all items (with filters)
- `POST /api/inventory` - Create new item
- `GET /api/inventory/[id]` - Get specific item
- `PUT /api/inventory/[id]` - Update item
- `DELETE /api/inventory/[id]` - Delete item

### Stock Operations
- `POST /api/inventory/restock` - Add stock to item
- `POST /api/inventory/sale` - Process item sale
- `GET /api/inventory/stats` - Get dashboard statistics

## Integration Points

### With Existing POS System

**Session Sales Integration:**
```typescript
// Example: Sell item during game session
const saleResult = await fetch('/api/inventory/sale', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_id: 'item-uuid',
    quantity: 2,
    session_id: 'session-uuid',
    customer_id: 'customer-uuid',
    payment_method: 'cash'
  })
});
```

**Loyalty Points Integration:**
- Items marked as `is_redeemable: true`
- Customers can redeem with `points_required`
- Automatic points deduction on redemption

### With Customer Management
- VIP customers see VIP-only items
- Loyalty tier affects item visibility
- Purchase history tracked per customer

## Sample Data

The setup includes sample inventory items:

**Beverages:**
- Coca Cola 500ml (50 units, KES 80)
- Energy Drink (25 units, KES 120)

**Snacks:**
- Crispy Chicken Wings (30 units, KES 350) - *Promo Active*
- Pizza Slice (15 units, KES 200) - *Promo Active*

**Equipment:**
- Gaming Headset (5 units, KES 2,500) - *VIP Only, Redeemable*
- Gaming Mouse (8 units, KES 1,800) - *VIP Only, Redeemable*

**Vouchers:**
- Free Hour Voucher (20 units) - *Redeemable with 500 points*
- VIP Session Pass (10 units) - *VIP Only, 1000 points*

## Usage Examples

### Adding Stock
1. Navigate to Inventory page
2. Find item in table
3. Click "Restock" from actions menu
4. Enter quantity and optional cost/supplier info
5. Stock automatically updates

### Selling Items
1. During game session setup
2. Select items to sell
3. Choose payment method (cash/mpesa/points)
4. Stock automatically reduces
5. Transaction logged with session link

### Monitoring Alerts
1. Check dashboard for low stock alerts
2. Review expiring items weekly
3. Monitor top-selling items for reordering
4. Track category performance

## Security & Permissions

**Role-Based Access:**
- **Admin**: Full inventory management
- **Supervisor**: Full inventory management
- **Cashier**: View inventory, process sales

**Data Protection:**
- All operations require authentication
- Audit trail for all transactions
- Soft validation on stock levels

## Troubleshooting

### Common Issues

**1. "Database function not found" Error**
```sql
-- Re-run the schema file in Supabase SQL Editor
-- Ensure all functions are created properly
```

**2. Stock Not Updating**
- Check if `update_inventory_stock` trigger exists
- Verify transaction records are being created

**3. Low Stock Alerts Not Showing**
- Refresh the page (data updates every 30 seconds)
- Check if items have stock_quantity < 5

### Database Verification

Run these queries to verify setup:

```sql
-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%inventory%';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%inventory%';

-- Test stats function
SELECT get_inventory_stats();
```

## Next Steps

### Immediate Actions
1. ✅ Run the database schema
2. ✅ Navigate to `/inventory` to see the dashboard
3. ✅ Test adding/editing items
4. ✅ Try restocking operations

### Future Enhancements
- **Barcode Scanning**: Add barcode support for items
- **Supplier Integration**: Automated reordering
- **Advanced Reports**: Export to CSV/Excel
- **Mobile App**: Inventory management on mobile
- **Integration APIs**: Connect with external suppliers

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify database functions are created
3. Ensure proper authentication
4. Review the sample data is loaded

The inventory system is now fully integrated with your POS and ready for production use! 🎮📦