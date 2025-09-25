"use client";

import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { InventoryItem, InventoryCategory, InventoryTransaction, Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Edit3, Trash2, PackagePlus, ArrowDownUp, Download, Percent, ShoppingCart, Gift, TrendingUp, DollarSign, CalendarClock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { POINTS_PER_CURRENCY_UNIT } from '@/lib/constants';
import { StatCard } from '@/components/ui/stat-card';

type SortKey = 'name' | 'category' | 'stock_quantity' | 'is_promo_active';

const CATEGORIES: InventoryCategory[] = ['Snack','Drink','Merchandise','Equipment','Voucher'];

async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('inventory_items').select('*').order('name');
  if (error) throw new Error(error.message);
  return data as unknown as InventoryItem[];
}

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ['inventory-items'], queryFn: fetchInventoryItems });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [promoOnly, setPromoOnly] = useState<boolean>(false);
  const [redeemableOnly, setRedeemableOnly] = useState<boolean>(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);

  const [isSellOpen, setIsSellOpen] = useState(false);
  const [sellItem, setSellItem] = useState<InventoryItem | null>(null);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [redeemItem, setRedeemItem] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    let list = (items || []).filter((i: InventoryItem) =>
      (!lower || i.name.toLowerCase().includes(lower) || i.category.toLowerCase().includes(lower)) &&
      (category === 'all' || i.category === category) &&
      (!promoOnly || i.is_promo_active) &&
      (!redeemableOnly || i.is_redeemable)
    );
    list = list.sort((a: InventoryItem, b: InventoryItem) => {
      const dir = sortAsc ? 1 : -1;
      const av: any = (a as any)[sortKey];
      const bv: any = (b as any)[sortKey];
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
    return list;
  }, [items, search, category, promoOnly, redeemableOnly, sortKey, sortAsc]);

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<InventoryItem>) => {
      const supabase = createClient();
      if (payload.id) {
        const { error } = await supabase.from('inventory_items').update(payload).eq('id', payload.id);
        if (error) throw new Error(error.message);
        return payload;
      } else {
        const { data, error } = await supabase.from('inventory_items').insert([payload]).select().single();
        if (error) throw new Error(error.message);
        return data as InventoryItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsFormOpen(false);
      setEditingItem(null);
      toast({ title: 'Saved', description: 'Inventory item saved.' });
    },
    onError: (err: Error) => toast({ title: 'Save failed', description: err.message, variant: 'destructive' }),
  });

  // Analytics
  const totalStockValue = useMemo(() => {
    return (items || []).reduce((sum: number, it: InventoryItem) => sum + (it.unit_price || 0) * (it.stock_quantity || 0), 0);
  }, [items]);

  const nearingExpiryCount = useMemo(() => {
    const now = new Date();
    const inDays = (d1: Date, d2: Date) => Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return (items || []).filter((it: InventoryItem) => {
      if (!it.expiry_date) return false;
      const diff = inDays(now, new Date(it.expiry_date));
      return diff >= 0 && diff <= 14;
    }).length;
  }, [items]);

  const { data: recentTx } = useQuery<{ item_id: string; change_quantity: number; created_at: string; }[]>({
    queryKey: ['inventory-recent-tx'],
    queryFn: async () => {
      const supabase = createClient();
      const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('item_id, change_quantity, created_at, transaction_type')
        .gte('created_at', since)
        .in('transaction_type', ['sale','redeem']);
      if (error) throw new Error(error.message);
      return data as any;
    }
  });

  const topSellers = useMemo(() => {
    const map = new Map<string, number>();
    (recentTx || []).forEach((t) => {
      const prev = map.get(t.item_id) || 0;
      // change_quantity is negative for sale/redeem
      map.set(t.item_id, prev + Math.abs(t.change_quantity));
    });
    const rows = Array.from(map.entries()).map(([itemId, units]) => ({
      itemId,
      units,
      name: (items || []).find(i => i.id === itemId)?.name || 'Unknown',
    }));
    rows.sort((a, b) => b.units - a.units);
    return rows.slice(0, 5);
  }, [recentTx, items]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      toast({ title: 'Deleted', description: 'Inventory item deleted.' });
    },
    onError: (err: Error) => toast({ title: 'Delete failed', description: err.message, variant: 'destructive' }),
  });

  const adjustMutation = useMutation({
    mutationFn: async (params: { item: InventoryItem; type: 'restock' | 'adjustment'; quantity: number; note?: string }) => {
      const { item, type, quantity, note } = params;
      const supabase = createClient();
      const change = type === 'restock' ? Math.abs(quantity) : quantity; // adjustment can be negative or positive
      const tx: Partial<InventoryTransaction> = {
        item_id: item.id,
        transaction_type: type,
        change_quantity: change,
        unit_price: item.unit_price,
        notes: note || null,
      };
      const { error } = await supabase.from('inventory_transactions').insert([tx]);
      if (error) throw new Error(error.message);
      return tx;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsAdjustOpen(false);
      setAdjustItem(null);
      toast({ title: 'Stock updated', description: 'Stock level adjusted.' });
    },
    onError: (err: Error) => toast({ title: 'Adjustment failed', description: err.message, variant: 'destructive' }),
  });

  // Customers for sale/redeem
  const { data: customers } = useQuery<Customer[]>({
    queryKey: ['customers-basic'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, loyalty_points, loyalty_tier')
        .order('full_name');
      if (error) throw new Error(error.message);
      return data as unknown as Customer[];
    }
  });

  const sellMutation = useMutation({
    mutationFn: async (params: { item: InventoryItem; quantity: number; customerId?: string | null; payment: 'cash' | 'mpesa' | 'split'; sessionId?: string | null }) => {
      const { item, quantity, customerId, payment, sessionId } = params;
      if (quantity <= 0) throw new Error('Quantity must be greater than zero');
      const supabase = createClient();
      // 1) Insert sale transaction (negative quantity)
      const tx: Partial<InventoryTransaction> = {
        item_id: item.id,
        transaction_type: 'sale',
        change_quantity: -Math.abs(quantity),
        unit_price: item.unit_price,
        payment_method: payment,
        session_id: sessionId || null,
        customer_id: customerId || null,
      };
      const { error: txError } = await supabase.from('inventory_transactions').insert([tx]);
      if (txError) throw new Error(txError.message);

      // 2) Award loyalty points if customer present
      if (customerId) {
        const totalAmount = (item.unit_price || 0) * Math.abs(quantity);
        const points = Math.floor(totalAmount * POINTS_PER_CURRENCY_UNIT);
        if (points > 0) {
          const { error: lpError } = await supabase.from('loyalty_transactions').insert([
            { customer_id: customerId, transaction_type: 'earn', points, description: `Points from ${item.name} purchase`, session_id: sessionId || null }
          ]);
          if (lpError) {
            // Non-fatal
            // eslint-disable-next-line no-console
            console.warn('Failed to award loyalty points:', lpError.message);
          }
        }
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      setIsSellOpen(false);
      setSellItem(null);
      toast({ title: 'Sale recorded', description: 'Stock reduced and points awarded if applicable.' });
    },
    onError: (err: Error) => toast({ title: 'Sale failed', description: err.message, variant: 'destructive' }),
  });

  const redeemMutation = useMutation({
    mutationFn: async (params: { item: InventoryItem; quantity: number; customerId: string }) => {
      const { item, quantity, customerId } = params;
      if (!item.is_redeemable) throw new Error('Item is not redeemable with points');
      if (quantity <= 0) throw new Error('Quantity must be greater than zero');

      const supabase = createClient();
      // Check customer points and VIP tier if required
      const { data: customer, error: cErr } = await supabase.from('customers').select('id, loyalty_points, loyalty_tier').eq('id', customerId).single();
      if (cErr) throw new Error(cErr.message);
      if (item.is_vip_only && customer.loyalty_tier !== 'VIP') {
        throw new Error('This item is VIP-only. Customer is not VIP.');
      }
      const pointsNeeded = (item.points_required || 0) * quantity;
      if ((customer.loyalty_points || 0) < pointsNeeded) {
        throw new Error('Insufficient loyalty points for redemption');
      }

      // 1) Insert redeem transaction (negative quantity, no payment)
      const tx: Partial<InventoryTransaction> = {
        item_id: item.id,
        transaction_type: 'redeem',
        change_quantity: -Math.abs(quantity),
        unit_price: 0,
        payment_method: null,
        customer_id: customerId,
      };
      const { error: txError } = await supabase.from('inventory_transactions').insert([tx]);
      if (txError) throw new Error(txError.message);

      // 2) Deduct points
      const { error: lpError } = await supabase.from('loyalty_transactions').insert([
        { customer_id: customerId, transaction_type: 'redeem', points: -pointsNeeded, description: `Redeemed ${quantity} x ${item.name}` }
      ]);
      if (lpError) throw new Error(lpError.message);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['customers-basic'] });
      setIsRedeemOpen(false);
      setRedeemItem(null);
      toast({ title: 'Redeemed', description: 'Item redeemed and points deducted.' });
    },
    onError: (err: Error) => toast({ title: 'Redemption failed', description: err.message, variant: 'destructive' }),
  });

  const exportCsv = () => {
    const rows = filtered;
    const header = ['Name','Category','Stock','Unit Price','Cost Price','Supplier','Expiry','Redeemable','Points Required','VIP Only','Promo'];
    const csv = [header.join(',')].concat(
      rows.map(r => [
        r.name,
        r.category,
        r.stock_quantity,
        r.unit_price?.toFixed(2),
        r.cost_price != null ? r.cost_price.toFixed(2) : '',
        r.supplier || '',
        r.expiry_date || '',
        r.is_redeemable ? 'Yes' : 'No',
        r.points_required,
        r.is_vip_only ? 'Yes' : 'No',
        r.is_promo_active ? 'Yes' : 'No',
      ].join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const stockBadge = (qty: number) => {
    if (qty < 5) return <Badge className="bg-red-600 hover:bg-red-600">Low</Badge>;
    if (qty < 10) return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-black">Warning</Badge>;
    return <Badge variant="outline">OK</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Analytics summary */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatCard title="Inventory Value" value={`KES ${totalStockValue.toFixed(2)}`} icon={DollarSign} />
        <StatCard title="Top Sellers (30d)" value={topSellers[0]?.name ? `${topSellers[0].name} (${topSellers[0].units})` : '—'} icon={TrendingUp} />
        <StatCard title="Nearing Expiry (≤14d)" value={String(nearingExpiryCount)} icon={CalendarClock} />
      </div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-semibold">Inventory</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportCsv()}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsFormOpen(true); }}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <Input placeholder="Search by name or category" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Label className="flex items-center gap-2"><Checkbox checked={promoOnly} onCheckedChange={v => setPromoOnly(Boolean(v))} /> Promo Only</Label>
        <Label className="flex items-center gap-2"><Checkbox checked={redeemableOnly} onCheckedChange={v => setRedeemableOnly(Boolean(v))} /> Redeemable</Label>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => { setSortKey('name'); setSortAsc(k => sortKey === 'name' ? !k : true); }}>
                Name <ArrowDownUp className="inline h-3 w-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => { setSortKey('category'); setSortAsc(k => sortKey === 'category' ? !k : true); }}>Category <ArrowDownUp className="inline h-3 w-3 ml-1" /></TableHead>
              <TableHead className="cursor-pointer" onClick={() => { setSortKey('stock_quantity'); setSortAsc(k => sortKey === 'stock_quantity' ? !k : true); }}>Stock <ArrowDownUp className="inline h-3 w-3 ml-1" /></TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={6}>Loading...</TableCell></TableRow>
            )}
            {!isLoading && filtered.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{item.stock_quantity}</span>
                    {stockBadge(item.stock_quantity)}
                  </div>
                </TableCell>
                <TableCell>{item.unit_price.toFixed(2)}</TableCell>
                <TableCell className="space-x-2">
                  {item.is_promo_active && <Badge className="bg-indigo-600 hover:bg-indigo-600"><Percent className="h-3 w-3 mr-1"/>Promo</Badge>}
                  {item.is_redeemable && <Badge variant="secondary">Redeemable</Badge>}
                  {item.is_vip_only && <Badge variant="destructive">VIP Only</Badge>}
                  {item.expiry_date && <Badge variant="outline">Exp: {item.expiry_date}</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button size="sm" onClick={() => { setSellItem(item); setIsSellOpen(true); }}>
                    <ShoppingCart className="h-4 w-4 mr-1"/> Sell
                  </Button>
                  {item.is_redeemable && (
                    <Button size="sm" variant="secondary" onClick={() => { setRedeemItem(item); setIsRedeemOpen(true); }}>
                      <Gift className="h-4 w-4 mr-1"/> Redeem
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setAdjustItem(item); setIsAdjustOpen(true); }}>
                    <PackagePlus className="h-4 w-4 mr-1"/> Stock
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditingItem(item); setIsFormOpen(true); }}>
                    <Edit3 className="h-4 w-4 mr-1"/> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>
                    <Trash2 className="h-4 w-4 mr-1"/> Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={6}>No items found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <InventoryForm
            initial={editingItem || undefined}
            onCancel={() => { setIsFormOpen(false); setEditingItem(null); }}
            onSubmit={(values) => upsertMutation.mutate(values)}
          />
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock{adjustItem ? ` – ${adjustItem.name}` : ''}</DialogTitle>
          </DialogHeader>
          <StockAdjustForm
            item={adjustItem}
            onCancel={() => { setIsAdjustOpen(false); setAdjustItem(null); }}
            onSubmit={(payload) => adjustMutation.mutate(payload)}
          />
        </DialogContent>
      </Dialog>

      {/* Sell Dialog */}
      <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell{sellItem ? ` – ${sellItem.name}` : ''}</DialogTitle>
          </DialogHeader>
          <SellForm
            item={sellItem}
            customers={customers || []}
            onCancel={() => { setIsSellOpen(false); setSellItem(null); }}
            onSubmit={(p) => sellMutation.mutate(p)}
          />
        </DialogContent>
      </Dialog>

      {/* Redeem Dialog */}
      <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Redeem{redeemItem ? ` – ${redeemItem.name}` : ''}</DialogTitle>
          </DialogHeader>
          <RedeemForm
            item={redeemItem}
            customers={customers || []}
            onCancel={() => { setIsRedeemOpen(false); setRedeemItem(null); }}
            onSubmit={(p) => redeemMutation.mutate(p)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Inventory Form Component ---
function InventoryForm({ initial, onSubmit, onCancel }: { initial?: Partial<InventoryItem>; onSubmit: (values: Partial<InventoryItem>) => void; onCancel: () => void }) {
  const [values, setValues] = useState<Partial<InventoryItem>>({
    name: initial?.name || '',
    category: (initial?.category as InventoryCategory) || 'Snack',
    unit_price: initial?.unit_price ?? 0,
    cost_price: initial?.cost_price ?? null,
    supplier: initial?.supplier ?? '',
    expiry_date: initial?.expiry_date ?? '',
    is_redeemable: initial?.is_redeemable ?? false,
    points_required: initial?.points_required ?? 0,
    is_vip_only: initial?.is_vip_only ?? false,
    is_promo_active: initial?.is_promo_active ?? false,
  });

  const handleChange = (key: keyof InventoryItem, val: any) => setValues(v => ({ ...v, [key]: val }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Name</Label>
          <Input value={values.name as string} onChange={e => handleChange('name', e.target.value)} />
        </div>
        <div>
          <Label>Category</Label>
          <Select value={values.category as string} onValueChange={(v) => handleChange('category', v)}>
            <SelectTrigger><SelectValue placeholder="Category"/></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Unit Price</Label>
          <Input type="number" step="0.01" value={values.unit_price as number} onChange={e => handleChange('unit_price', Number(e.target.value))} />
        </div>
        <div>
          <Label>Cost Price</Label>
          <Input type="number" step="0.01" value={(values.cost_price as number | null) ?? ''} onChange={e => handleChange('cost_price', e.target.value === '' ? null : Number(e.target.value))} />
        </div>
        <div>
          <Label>Supplier</Label>
          <Input value={(values.supplier as string) || ''} onChange={e => handleChange('supplier', e.target.value)} />
        </div>
        <div>
          <Label>Expiry Date</Label>
          <Input type="date" value={(values.expiry_date as string) || ''} onChange={e => handleChange('expiry_date', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(values.is_promo_active)} onCheckedChange={v => handleChange('is_promo_active', Boolean(v))} /> Promo Active</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(values.is_redeemable)} onCheckedChange={v => handleChange('is_redeemable', Boolean(v))} /> Redeemable</label>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(values.is_vip_only)} onCheckedChange={v => handleChange('is_vip_only', Boolean(v))} /> VIP Only</label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Points Required (if redeemable)</Label>
          <Input type="number" value={values.points_required as number} onChange={e => handleChange('points_required', Number(e.target.value))} />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ ...values, id: initial?.id })}>Save</Button>
      </div>
    </div>
  );
}

// --- Stock Adjust Form ---
function StockAdjustForm({ item, onSubmit, onCancel }: { item: InventoryItem | null; onSubmit: (p: { item: InventoryItem; type: 'restock' | 'adjustment'; quantity: number; note?: string }) => void; onCancel: () => void }) {
  const [type, setType] = useState<'restock' | 'adjustment'>('restock');
  const [quantity, setQuantity] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  if (!item) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={v => setType(v as any)}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="restock">Restock</SelectItem>
              <SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1">
          <Label>Quantity</Label>
          <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div className="md:col-span-3">
          <Label>Note</Label>
          <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ item, type, quantity, note })}>
          Apply
        </Button>
      </div>
    </div>
  );
}

// --- Sell Form ---
function SellForm({ item, customers, onSubmit, onCancel }: { item: InventoryItem | null; customers: Customer[]; onSubmit: (p: { item: InventoryItem; quantity: number; customerId?: string | null; payment: 'cash' | 'mpesa' | 'split'; sessionId?: string | null }) => void; onCancel: () => void }) {
  const [quantity, setQuantity] = useState<number>(1);
  const [payment, setPayment] = useState<'cash' | 'mpesa' | 'split'>('cash');
  const [customerId, setCustomerId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  if (!item) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Quantity</Label>
          <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <Label>Payment</Label>
          <Select value={payment} onValueChange={v => setPayment(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="split">Split</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Customer (optional)</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Select customer (for points)"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Session (optional)</Label>
          <Input placeholder="Session ID (if during a session)" value={sessionId} onChange={e => setSessionId(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ item, quantity, payment, customerId: customerId || null, sessionId: sessionId || null })}>Confirm Sale</Button>
      </div>
    </div>
  );
}

// --- Redeem Form ---
function RedeemForm({ item, customers, onSubmit, onCancel }: { item: InventoryItem | null; customers: Customer[]; onSubmit: (p: { item: InventoryItem; quantity: number; customerId: string }) => void; onCancel: () => void }) {
  const [quantity, setQuantity] = useState<number>(1);
  const [customerId, setCustomerId] = useState<string>('');
  if (!item) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Quantity</Label>
          <Input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        </div>
        <div>
          <Label>Customer</Label>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Select customer"/></SelectTrigger>
            <SelectContent>
              {customers.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={!customerId} onClick={() => onSubmit({ item, quantity, customerId })}>Redeem</Button>
      </div>
    </div>
  );
}

