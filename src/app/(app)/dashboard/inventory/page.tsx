"use client";

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, PackagePlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { InventoryItem } from '@/types';

const supabase = createClient();

const fetchItems = async (q?: string, category?: string) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category) params.set('category', category);
  const res = await fetch(`/api/inventory-items?${params.toString()}`, { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch inventory');
  return json.items as InventoryItem[];
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string | undefined>();

  const { data: items, isLoading, isError, refetch } = useQuery<InventoryItem[]>({
    queryKey: ['inventory-items', q, category],
    queryFn: () => fetchItems(q, category),
  });

  const addOrUpdateMutation = useMutation({
    mutationFn: async (payload: Partial<InventoryItem>) => {
      const method = payload.id ? 'PUT' : 'POST';
      const res = await fetch('/api/inventory-items', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      return json.item as InventoryItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory-items?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const adjustStock = useMutation({
    mutationFn: async ({ item_id, delta, type, note }: { item_id: string; delta: number; type: 'restock' | 'adjustment'; note?: string }) => {
      const res = await fetch('/api/inventory-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id, delta, type, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Adjustment failed');
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-items'] }),
  });

  const lowStock = (qty: number): boolean => qty < 5;
  const nearingExpiry = (expiry?: string | null): boolean => {
    if (!expiry) return false;
    const d = new Date(expiry);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 14; // 2 weeks
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <div className="flex items-center gap-2">
          <a href="/api/inventory-export" target="_blank" rel="noreferrer">
            <Button variant="outline">Export CSV</Button>
          </a>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <ItemForm onSubmit={(values) => addOrUpdateMutation.mutate(values)} submitting={addOrUpdateMutation.isPending} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={q} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)} className="pl-8" />
            </div>
            <Select onValueChange={(v: string) => setCategory(v === 'All' ? undefined : v)}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Snack">Snack</SelectItem>
                <SelectItem value="Drink">Drink</SelectItem>
                <SelectItem value="Merchandise">Merchandise</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Voucher">Voucher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Promo</TableHead>
                <TableHead>Redeemable</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map((item: InventoryItem) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {lowStock(item.stock_quantity) && (
                        <Badge variant="destructive">Low</Badge>
                      )}
                      <span>{item.stock_quantity}</span>
                    </div>
                  </TableCell>
                  <TableCell>{Number(item.unit_price).toLocaleString()}</TableCell>
                  <TableCell>
                    {item.is_promo_active ? (
                      <Badge>Promo</Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.is_redeemable ? (
                      <Badge variant="secondary">{item.points_required} pts</Badge>
                    ) : (
                      <Badge variant="outline">—</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {nearingExpiry(item.expiry_date) ? (
                      <Badge variant="destructive">Soon</Badge>
                    ) : item.expiry_date ? (
                      new Date(item.expiry_date).toLocaleDateString()
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <StockDialog id={item.id} onSubmit={(delta) => adjustStock.mutate({ item_id: item.id, delta, type: 'restock' })} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Item</DialogTitle></DialogHeader>
                        <ItemForm initial={item} onSubmit={(values: Partial<InventoryItem>) => addOrUpdateMutation.mutate({ ...values, id: item.id })} submitting={addOrUpdateMutation.isPending} />
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ItemForm({ initial, onSubmit, submitting }: { initial?: Partial<InventoryItem>, onSubmit: (values: Partial<InventoryItem>) => void, submitting?: boolean }) {
  const [form, setForm] = useState<Partial<InventoryItem>>(initial ?? { is_redeemable: false, is_promo_active: false, is_vip_only: false, points_required: 0 });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Name" value={form.name ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} />
        <Select value={(form.category as string) ?? undefined} onValueChange={(v: string) => setForm({ ...form, category: v as any })}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Snack">Snack</SelectItem>
            <SelectItem value="Drink">Drink</SelectItem>
            <SelectItem value="Merchandise">Merchandise</SelectItem>
            <SelectItem value="Equipment">Equipment</SelectItem>
            <SelectItem value="Voucher">Voucher</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Stock" value={form.stock_quantity ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
        <Input type="number" placeholder="Unit Price" value={form.unit_price ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, unit_price: Number(e.target.value) })} />
        <Input type="number" placeholder="Cost Price (optional)" value={(form.cost_price as number | undefined) ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, cost_price: e.target.value === '' ? null : Number(e.target.value) })} />
        <Input placeholder="Supplier (optional)" value={form.supplier ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, supplier: e.target.value || null })} />
        <Input type="date" placeholder="Expiry (optional)" value={form.expiry_date ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, expiry_date: e.target.value || null })} />
        <div className="flex items-center gap-2">
          <label className="text-sm">Redeemable</label>
          <input type="checkbox" checked={!!form.is_redeemable} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, is_redeemable: e.target.checked })} />
          <Input className="ml-2" type="number" placeholder="Points" value={form.points_required ?? 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, points_required: Number(e.target.value) })} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">VIP Only</label>
          <input type="checkbox" checked={!!form.is_vip_only} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, is_vip_only: e.target.checked })} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">Promo Active</label>
          <input type="checkbox" checked={!!form.is_promo_active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, is_promo_active: e.target.checked })} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onSubmit(form)} disabled={submitting}>Save</Button>
      </div>
    </div>
  );
}

function StockDialog({ id, onSubmit }: { id: string, onSubmit: (delta: number) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(1);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary"><PackagePlus className="h-4 w-4" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Stock</DialogTitle></DialogHeader>
        <div className="flex items-center gap-2">
          <Input type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))} />
          <Button onClick={() => { onSubmit(amount); setOpen(false); }}>Confirm</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

