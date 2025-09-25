# Infinity Gaming Lounge - Inventory Management System

## Overview

The Inventory Management System is a comprehensive solution integrated with your POS system, sessions, and loyalty points. It allows you to manage all your gaming lounge inventory items including snacks, drinks, merchandise, equipment, and vouchers.

## Features

### ✅ Core Features Implemented

1. **Database Schema**
   - `inventory_items` table with all required fields
   - `inventory_transactions` table for tracking all stock changes
   - Row Level Security (RLS) policies
   - Database functions for stock management

2. **Inventory Management Dashboard**
   - View all inventory items with search and filtering
   - Real-time stock level tracking
   - Color-coded stock alerts (red for out of stock, orange for low stock)
   - Quick actions: Add Stock, Edit Item, Delete Item

3. **CRUD Operations**
   - Add new inventory items with all details
   - Edit existing items
   - Delete items with confirmation
   - Stock adjustment functionality (restock/remove stock)

4. **Stock Tracking**
   - Real-time stock level updates
   - Transaction logging for all stock changes
   - Low stock alerts and notifications
   - Stock value calculations

5. **POS Integration**
   - API endpoints for selling items
   - Stock validation (prevents overselling)
   - Integration with payment methods
   - Session and customer linking

6. **Promotions & VIP System**
   - Promo item highlighting
   - VIP-only items with customer tier validation
   - Loyalty point redemption support

## Database Setup

### Option 1: Run Migration Script (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `INVENTORY_MIGRATION.sql`
4. Run the script

### Option 2: Manual Setup

Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Create tables and functions from the migration file
-- See INVENTORY_MIGRATION.sql for complete script
```

## API Endpoints

### Get Inventory Items
```
GET /api/inventory/items
```
Query parameters:
- `category` - Filter by category
- `search` - Search in name and category
- `showPromo` - Show only promotional items
- `showVipOnly` - Show VIP-only items (requires customerId)
- `showRedeemable` - Show loyalty point redeemable items
- `customerId` - For VIP filtering

### Sell Inventory Items
```
POST /api/inventory/sell
```
Body:
```json
{
  "itemId": "uuid",
  "quantity": 1,
  "sessionId": "uuid (optional)",
  "customerId": "uuid (optional)",
  "paymentMethod": "cash|mpesa|mpesa-stk|split|loyalty_points",
  "notes": "string (optional)"
}
```

## Usage

### Adding Items

1. Navigate to `/inventory`
2. Click "Add Item" button
3. Fill in all required fields:
   - Name (required)
   - Category (Snack, Drink, Merchandise, Equipment, Voucher)
   - Stock Quantity (required)
   - Unit Price (required)
   - Optional: Cost Price, Supplier, Expiry Date, Low Stock Threshold
4. Configure item properties:
   - Redeemable with Points: Enable loyalty point redemption
   - VIP Only: Restrict to VIP customers
   - Promotion Active: Highlight as promotional item

### Managing Stock

1. **Restocking**: Click the "+" button on any item to add stock
2. **Adjusting Stock**: Use the stock adjustment dialog to remove stock
3. **Monitoring**: View low stock alerts in the sidebar
4. **Tracking**: All stock changes are logged in inventory_transactions

### Selling Items

1. **Quick Sell**: Click the shopping cart icon on any item
2. **POS Integration**: Use the API endpoints in your POS system
3. **Payment Methods**: Cash, M-Pesa, Split Payment, Loyalty Points
4. **Validation**: Automatic stock validation prevents overselling

### Promotions and VIP

1. **Promotional Items**: Set "Promotion Active" to highlight items
2. **VIP Items**: Set "VIP Only" to restrict to VIP customers
3. **Loyalty Redemption**: Enable "Redeemable with Points" for point purchases

## Security

- Row Level Security (RLS) enabled on all tables
- Admin and Supervisor roles have full access
- Cashiers can insert transactions but not modify items
- All stock changes are logged with user tracking

## Integration Points

### With Sessions
- Link inventory sales to game sessions
- Track revenue from inventory items
- Customer spending analytics

### With Loyalty System
- Loyalty point redemption for items
- VIP-only item restrictions
- Point earning from purchases

### With Payments
- Multiple payment method support
- Transaction logging
- Revenue tracking

## Monitoring and Alerts

1. **Low Stock Alerts**: Items below their threshold are highlighted
2. **Stock Value**: Total inventory value calculation
3. **Transaction History**: Complete audit trail of all changes
4. **Real-time Updates**: Dashboard refreshes every 30 seconds

## File Structure

```
src/app/(app)/inventory/
├── page.tsx                    # Main inventory page
├── components/
│   ├── InventoryTable.tsx      # Item listing table
│   ├── AddItemDialog.tsx       # Add new items
│   ├── EditItemDialog.tsx      # Edit existing items
│   ├── DeleteItemDialog.tsx    # Delete items
│   ├── StockAdjustmentDialog.tsx # Adjust stock levels
│   ├── StockAlertsCard.tsx     # Low stock alerts
│   └── QuickSellDialog.tsx     # Quick sell interface

src/app/api/inventory/
├── items/route.ts              # Get inventory items
└── sell/route.ts               # Process sales

src/lib/sql/
└── create_inventory_tables.sql # Database schema

INVENTORY_MIGRATION.sql         # Complete migration script
```

## Next Steps

### Immediate
1. Run the migration script in your Supabase dashboard
2. Test adding a few sample items
3. Test the stock adjustment functionality
4. Integrate the API endpoints into your POS system

### Future Enhancements
1. **Reporting Dashboard**: Sales analytics, top-selling items, revenue reports
2. **Advanced Analytics**: Profit margins, supplier performance
3. **Barcode Integration**: Scanner support for quick item lookup
4. **Bulk Operations**: Import/export functionality
5. **Automated Reordering**: Low stock email notifications
6. **Advanced Search**: Filtering by multiple criteria
7. **Inventory Forecasting**: Predictive stock level management

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure user has 'admin' or 'supervisor' role
2. **Stock Validation**: Check that stock quantity is sufficient before sales
3. **VIP Items**: Verify customer loyalty tier for VIP-only items
4. **Loyalty Points**: Ensure customer has sufficient points for redemption

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=inventory:*
```

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify database permissions and RLS policies
3. Ensure all required environment variables are set
4. Check the Supabase logs for database errors

---

**Happy Managing!** 🎮📦