"use client";

import React, { useMemo, useState } from 'react';
import type { InventoryItem, InventoryTransaction, InventoryCategory } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Upload, Download, ArrowUpDown, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { CURRENCY_SYMBOL } from '@/lib/constants';

const categories: InventoryCategory[] = ['Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher'];

const itemSchema = z.object({
  name: z.string().min(2),
  category: z.enum(['Snack', 'Drink', 'Merchandise', 'Equipment', 'Voucher']),
  stock_quantity: z.coerce.number().int().min(0),
  unit_price: z.coerce.number().min(0),
  cost_price: z.coerce.number().min(0).nullable().optional(),
  supplier: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  is_redeemable: z.boolean().default(false),
  points_required: z.coerce.number().min(0).default(0),
  is_vip_only: z.boolean().default(false),
  is_promo_active: z.boolean().default(false),
});

type ItemForm = z.infer<typeof itemSchema>;

const fetchInventory = async (): Promise<InventoryItem[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('inventory_items').select('*').order('name');
  if (error) throw new Error(error.message);
  return data as unknown as InventoryItem[];
};

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name'|'category'|'stock'|'promo'>('name');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockTarget, setStockTarget] = useState<InventoryItem | null>(null);

  const { data: items, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: fetchInventory });

  const filtered = useMemo(() => {
    const list = (items || []).filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' ? true : i.category === category;
      return matchesSearch && matchesCategory;
    });
    switch (sortBy) {
      case 'name':
        return list.sort((a,b) => a.name.localeCompare(b.name));
      case 'category':
        return list.sort((a,b) => a.category.localeCompare(b.category));
      case 'stock':
        return list.sort((a,b) => b.stock_quantity - a.stock_quantity);
      case 'promo':
        return list.sort((a,b) => Number(b.is_promo_active) - Number(a.is_promo_active));
      default:
        return list;
    }
  }, [items, search, category, sortBy]);

  const form = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      category: 'Snack',
      stock_quantity: 0,
      unit_price: 0,
      cost_price: null,
      supplier: '',
      expiry_date: '',
      is_redeemable: false,
      points_required: 0,
      is_vip_only: false,
      is_promo_active: false,
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<InventoryItem>) => {
      const supabase = createClient();
      if (editing) {
        const { error } = await supabase
          .from('inventory_items')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw new Error(error.message);
        return editing.id;
      } else {
        const { data, error } = await supabase
          .from('inventory_items')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        return data?.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsEditorOpen(false);
      setEditing(null);
      toast({ title: 'Saved', description: 'Inventory item saved successfully.' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (item: InventoryItem) => {
      const supabase = createClient();
      const { error } = await supabase.from('inventory_items').delete().eq('id', item.id);
      if (error) throw new Error(error.message);
      return item.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({ title: 'Deleted', description: 'Item deleted.' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const stockForm = useForm<{ quantity: number; notes?: string }>({
    defaultValues: { quantity: 1, notes: '' },
  });

  const adjustStockMutation = useMutation({
    mutationFn: async (params: { item: InventoryItem; quantity: number; notes?: string }) => {
      const supabase = createClient();
      // Positive quantity for add, negative for sale/adjust down
      const { error } = await supabase.rpc('log_inventory_change', {
        p_item_id: params.item.id,
        p_change_type: 'add',
        p_quantity: params.quantity,
        p_unit_price: params.item.unit_price,
        p_session_id: null,
        p_payer_customer_id: null,
        p_notes: params.notes || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsStockDialogOpen(false);
      setStockTarget(null);
      toast({ title: 'Stock Updated', description: 'Stock adjusted successfully.' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const onSubmitItem = (values: ItemForm) => {
    upsertMutation.mutate({ ...values });
  };

  const handleExportCsv = () => {
    const headers = ['Name','Category','Stock','Unit Price','Promo','Redeemable','Points','VIP Only','Expiry'];
    const rows = (filtered || []).map(i => [
      i.name,
      i.category,
      String(i.stock_quantity),
      String(i.unit_price),
      i.is_promo_active ? 'Yes' : 'No',
      i.is_redeemable ? 'Yes' : 'No',
      String(i.points_required ?? 0),
      i.is_vip_only ? 'Yes' : 'No',
      i.expiry_date || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-headline font-semibold">Inventory</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleExportCsv}><Download className="h-4 w-4 mr-2"/>Export CSV</Button>
          <Button onClick={() => { setEditing(null); form.reset(); setIsEditorOpen(true); }}>
            <Plus className="h-4 w-4 mr-2"/>Add Item
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <Input placeholder="Search by name..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Category"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v)=>setSortBy(v as any)}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Sort By"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="stock">Stock</SelectItem>
            <SelectItem value="promo">Promo Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Name</TableHead>
              <TableHead className="whitespace-nowrap">Category</TableHead>
              <TableHead className="whitespace-nowrap text-right">Stock</TableHead>
              <TableHead className="whitespace-nowrap text-right">Price ({CURRENCY_SYMBOL})</TableHead>
              <TableHead className="whitespace-nowrap">Promo</TableHead>
              <TableHead className="whitespace-nowrap">Redeemable</TableHead>
              <TableHead className="whitespace-nowrap">VIP</TableHead>
              <TableHead className="whitespace-nowrap">Expiry</TableHead>
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(filtered || []).map(item => {
              const badgeVariant = item.stock_quantity < 5 ? 'destructive' : item.stock_quantity < 10 ? 'secondary' : 'outline';
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right"><Badge variant={badgeVariant as any}>{item.stock_quantity}</Badge></TableCell>
                  <TableCell className="text-right">{item.unit_price.toFixed(2)}</TableCell>
                  <TableCell>{item.is_promo_active ? <Badge className="bg-green-600">Promo</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                  <TableCell>{item.is_redeemable ? <Badge className="bg-purple-600">Points</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                  <TableCell>{item.is_vip_only ? <Badge className="bg-yellow-600">VIP</Badge> : <Badge variant="outline">—</Badge>}</TableCell>
                  <TableCell>{item.expiry_date || '—'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setStockTarget(item); setIsStockDialogOpen(true); }}>
                      <PackagePlus className="h-4 w-4 mr-2"/>Add Stock
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditing(item); form.reset({
                        name: item.name,
                        category: item.category,
                        stock_quantity: item.stock_quantity,
                        unit_price: item.unit_price,
                        cost_price: item.cost_price ?? null,
                        supplier: item.supplier ?? '',
                        expiry_date: item.expiry_date ?? '',
                        is_redeemable: item.is_redeemable,
                        points_required: item.points_required ?? 0,
                        is_vip_only: item.is_vip_only,
                        is_promo_active: item.is_promo_active,
                    }); setIsEditorOpen(true); }}>
                      <Pencil className="h-4 w-4 mr-2"/>Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(item)}>
                      <Trash2 className="h-4 w-4 mr-2"/>Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isEditorOpen} onOpenChange={(o)=>{ if (!upsertMutation.isPending) setIsEditorOpen(o); }}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitItem)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="name" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g., Coca-Cola 500ml"/></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="category" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue placeholder="Select category"/></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="stock_quantity" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="unit_price" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price ({CURRENCY_SYMBOL})</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="cost_price" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price ({CURRENCY_SYMBOL})</FormLabel>
                    <FormControl><Input type="number" step="0.01" value={field.value ?? ''} onChange={(e)=>field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="supplier" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="expiry_date" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl><Input type="date" value={field.value ?? ''} onChange={field.onChange} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="is_promo_active" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Promo Active</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2"><Checkbox checked={field.value} onCheckedChange={v=>field.onChange(Boolean(v))} /> <span>Highlight as promo</span></div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="is_redeemable" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Redeemable</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2"><Checkbox checked={field.value} onCheckedChange={v=>field.onChange(Boolean(v))} /> <span>Redeem with points</span></div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="points_required" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points Required</FormLabel>
                    <FormControl><Input type="number" step="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="is_vip_only" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>VIP Only</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2"><Checkbox checked={field.value} onCheckedChange={v=>field.onChange(Boolean(v))} /> <span>Visible to VIPs</span></div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={()=>{ setIsEditorOpen(false); setEditing(null); }} disabled={upsertMutation.isPending}>Cancel</Button>
                <Button type="submit" disabled={upsertMutation.isPending}>{editing ? 'Save Changes' : 'Add Item'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockDialogOpen} onOpenChange={(o)=>{ if (!adjustStockMutation.isPending) setIsStockDialogOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock {stockTarget ? `- ${stockTarget.name}` : ''}</DialogTitle>
          </DialogHeader>
          <form onSubmit={stockForm.handleSubmit(({ quantity, notes }) => { if (stockTarget) adjustStockMutation.mutate({ item: stockTarget, quantity, notes }); })} className="space-y-4">
            <div>
              <FormLabel>Quantity to Add</FormLabel>
              <Input type="number" min={1} step={1} {...stockForm.register('quantity', { valueAsNumber: true })} />
            </div>
            <div>
              <FormLabel>Notes (optional)</FormLabel>
              <Input placeholder="e.g., supplier restock delivery" {...stockForm.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={()=>setIsStockDialogOpen(false)} disabled={adjustStockMutation.isPending}>Cancel</Button>
              <Button type="submit" disabled={adjustStockMutation.isPending}>Add Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

