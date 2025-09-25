"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Star, 
  Package, 
  Search,
  Filter,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryItem, Customer } from '@/types';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CartItem extends InventoryItem {
  quantity: number;
  total_price: number;
}

export interface InventorySale {
  items: CartItem[];
  total_amount: number;
  total_points_used: number;
  payment_method: 'cash' | 'mpesa' | 'mpesa-stk' | 'loyalty_points' | 'mixed';
  customer_id?: string;
  session_id?: string;
}

interface InventoryPOSProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  sessionId?: string;
  onSaleComplete: (sale: InventorySale) => void;
}

// Fetch available inventory items
const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .gt('stock_quantity', 0) // Only items in stock
    .order('name');

  if (error) {
    throw new Error(`Error fetching inventory: ${error.message}`);
  }

  return data || [];
};

export function InventoryPOS({ open, onOpenChange, customer, sessionId, onSaleComplete }: InventoryPOSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'loyalty_points' | 'mixed'>('cash');
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const { toast } = useToast();

  // Query hooks
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory-items-pos'],
    queryFn: fetchInventoryItems,
    enabled: open,
  });

  const categories = ['Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher'];

  // Filter items based on customer tier and search criteria
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // VIP restriction check
      if (item.is_vip_only && customer?.loyalty_tier !== 'VIP') {
        return false;
      }

      // Search filter
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter, customer]);

  // Calculate cart totals
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
    const totalPointsAvailable = cart
      .filter(item => item.is_redeemable)
      .reduce((sum, item) => sum + (item.points_required * item.quantity), 0);
    
    const pointsToUse = Math.min(loyaltyPointsToUse, totalPointsAvailable, customer?.loyalty_points || 0);
    const cashAmount = subtotal - pointsToUse;

    return {
      subtotal,
      totalPointsAvailable,
      pointsToUse,
      cashAmount: Math.max(0, cashAmount),
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  }, [cart, loyaltyPointsToUse, customer]);

  // Add item to cart
  const addToCart = (item: InventoryItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        // Check stock limit
        if (existingItem.quantity >= item.stock_quantity) {
          toast({
            title: 'Stock limit reached',
            description: `Only ${item.stock_quantity} units available`,
            variant: 'destructive',
          });
          return prevCart;
        }
        
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                total_price: (cartItem.quantity + 1) * cartItem.unit_price
              }
            : cartItem
        );
      } else {
        return [...prevCart, {
          ...item,
          quantity: 1,
          total_price: item.unit_price
        }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(cartItem =>
          cartItem.id === itemId
            ? {
                ...cartItem,
                quantity: cartItem.quantity - 1,
                total_price: (cartItem.quantity - 1) * cartItem.unit_price
              }
            : cartItem
        );
      } else {
        return prevCart.filter(cartItem => cartItem.id !== itemId);
      }
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setLoyaltyPointsToUse(0);
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty cart',
        description: 'Please add items to cart before processing sale.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const sale: InventorySale = {
        items: cart,
        total_amount: cartTotals.cashAmount,
        total_points_used: cartTotals.pointsToUse,
        payment_method: cartTotals.pointsToUse > 0 && cartTotals.cashAmount > 0 ? 'mixed' : 
                       cartTotals.pointsToUse > 0 ? 'loyalty_points' : paymentMethod,
        customer_id: customer?.id,
        session_id: sessionId,
      };

      onSaleComplete(sale);
      clearCart();
      onOpenChange(false);
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        title: 'Error',
        description: 'Failed to process sale. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      clearCart();
      setSearchQuery('');
      setCategoryFilter('all');
      setPaymentMethod('cash');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Inventory Sales
            {customer && (
              <Badge variant="outline">
                {customer.full_name} ({customer.loyalty_points} pts)
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Select items to sell {sessionId ? 'with this session' : 'to the customer'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
          {/* Items Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items Grid */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredItems.map((item) => {
                    const cartItem = cart.find(c => c.id === item.id);
                    const inCart = cartItem?.quantity || 0;
                    
                    return (
                      <Card key={item.id} className="relative">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm">{item.name}</CardTitle>
                              <CardDescription className="text-xs">
                                <Badge variant="outline" className="mr-1">{item.category}</Badge>
                                {item.stock_quantity} in stock
                              </CardDescription>
                            </div>
                            <div className="flex gap-1">
                              {item.is_promo_active && (
                                <Badge variant="default" className="text-xs">
                                  <Star className="h-3 w-3" />
                                </Badge>
                              )}
                              {item.is_vip_only && (
                                <Badge variant="secondary" className="text-xs">VIP</Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold">
                                {CURRENCY_SYMBOL} {item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </p>
                              {item.is_redeemable && (
                                <p className="text-xs text-muted-foreground">
                                  or {item.points_required} points
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {inCart > 0 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeFromCart(item.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                              {inCart > 0 && (
                                <span className="min-w-[20px] text-center text-sm font-medium">
                                  {inCart}
                                </span>
                              )}
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                                disabled={inCart >= item.stock_quantity}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Cart */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Cart ({cartTotals.totalItems})
                  {cart.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCart}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Cart is empty</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="max-h-40">
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} × {CURRENCY_SYMBOL}{item.unit_price}
                              </p>
                            </div>
                            <p className="text-sm font-semibold">
                              {CURRENCY_SYMBOL}{item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Separator />

                    {/* Loyalty Points */}
                    {customer && cartTotals.totalPointsAvailable > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Use Loyalty Points</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max={Math.min(cartTotals.totalPointsAvailable, customer.loyalty_points)}
                            value={loyaltyPointsToUse}
                            onChange={(e) => setLoyaltyPointsToUse(Number(e.target.value))}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLoyaltyPointsToUse(Math.min(cartTotals.totalPointsAvailable, customer.loyalty_points))}
                          >
                            Max
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Available: {customer.loyalty_points} points
                        </p>
                      </div>
                    )}

                    {/* Payment Method */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Totals */}
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{CURRENCY_SYMBOL} {cartTotals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {cartTotals.pointsToUse > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Points Used:</span>
                          <span>-{cartTotals.pointsToUse} pts</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>{CURRENCY_SYMBOL} {cartTotals.cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={processSale}
            disabled={cart.length === 0}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Process Sale ({CURRENCY_SYMBOL} {cartTotals.cashAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}