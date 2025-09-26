"use client";

import React, { useEffect, useState, ChangeEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type SettingsRecord = {
  id: string;
  app_name: string;
  timezone: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  default_points_per_hour: number;
  redeem_rule_description?: string | null;
  max_points_per_customer?: number | null;
  role_policy?: any | null;
  staff_password_policy?: string | null;
  session_timeout_minutes?: number | null;
  enable_2fa?: boolean | null;
  notify_email?: string | null;
  notify_sms_sender_id?: string | null;
  payment_methods?: string[] | null;
  default_discount_percent?: number | null;
  tax_percent?: number | null;
  supabase_keys?: any | null;
  payment_gateway_keys?: any | null;
  analytics_keys?: any | null;
  created_at?: string;
  updated_at?: string;
};

const DEFAULTS: Partial<SettingsRecord> = {
  app_name: 'Infinity Gaming Lounge',
  timezone: 'Africa/Nairobi',
  currency: 'KES',
  theme: 'system',
  default_points_per_hour: 10,
  payment_methods: ['mpesa', 'cash', 'card'],
};

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsRecord | null>(null);

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings(data as SettingsRecord);
      } else {
        // Fallback to defaults if table empty
        const base = { ...(DEFAULTS as Partial<SettingsRecord>) };
        setSettings({ ...(base as SettingsRecord), id: 'local' });
      }
    } catch (err) {
      console.warn('Settings table missing or unreadable, using defaults', err);
      const base = { ...(DEFAULTS as Partial<SettingsRecord>) };
      setSettings({ ...(base as SettingsRecord), id: 'local' });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      const payload = { ...settings } as any;
      delete payload.id;
      if (settings.id === 'local') {
        const { error } = await supabase.from('settings').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      }
      toast({ title: 'Settings saved' });
      await fetchSettings();
    } catch (err: any) {
      toast({ title: 'Failed to save settings', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!settings) return;
    const base = { ...(DEFAULTS as Partial<SettingsRecord>) };
    setSettings({ ...(base as SettingsRecord), id: settings.id });
  };

  const updateField = (key: keyof SettingsRecord, value: unknown) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } as SettingsRecord : prev));
  };

  const onTextInputChange = (key: keyof SettingsRecord) => (e: ChangeEvent<HTMLInputElement>) => {
    updateField(key, e.target.value);
  };

  const onNumberInputChange = (key: keyof SettingsRecord) => (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    updateField(key, val === '' ? null : Number(val));
  };

  const onTextareaChange = (key: keyof SettingsRecord) => (e: ChangeEvent<HTMLTextAreaElement>) => {
    updateField(key, e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={loading || saving}>Reset to defaults</Button>
          <Button onClick={saveSettings} disabled={loading || saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="loyalty">Customer & Loyalty</TabsTrigger>
          <TabsTrigger value="security">Security & Access</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>App Name</Label>
                <Input value={settings?.app_name || ''} onChange={onTextInputChange('app_name')} placeholder="App Name" />
              </div>
              <div>
                <Label>Timezone</Label>
                <Input value={settings?.timezone || ''} onChange={onTextInputChange('timezone')} placeholder="Africa/Nairobi" />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={settings?.currency || 'KES'} onValueChange={(v: string) => updateField('currency', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Theme</Label>
                <Select value={settings?.theme || 'system'} onValueChange={(v: 'light' | 'dark' | 'system') => updateField('theme', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle>Customer & Loyalty Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Default points per hour</Label>
                <Input type="number" value={settings?.default_points_per_hour ?? 0} onChange={onNumberInputChange('default_points_per_hour')} />
              </div>
              <div className="md:col-span-2">
                <Label>Redeem Rules</Label>
                <Textarea value={settings?.redeem_rule_description || ''} onChange={onTextareaChange('redeem_rule_description')} placeholder="Describe how points convert to rewards..." />
              </div>
              <div>
                <Label>Max points per customer</Label>
                <Input type="number" value={settings?.max_points_per_customer ?? ''} onChange={onNumberInputChange('max_points_per_customer')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Access</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Role policy (JSON)</Label>
                <Textarea value={JSON.stringify(settings?.role_policy ?? {}, null, 2)} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
                  try { updateField('role_policy', JSON.parse(e.target.value)); } catch { /* ignore */ }
                }} />
              </div>
              <div>
                <Label>Password policy</Label>
                <Input value={settings?.staff_password_policy || ''} onChange={onTextInputChange('staff_password_policy')} placeholder="Min 8 chars, number, symbol" />
              </div>
              <div>
                <Label>Session timeout (minutes)</Label>
                <Input type="number" value={settings?.session_timeout_minutes ?? ''} onChange={onNumberInputChange('session_timeout_minutes')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Notification email</Label>
                <Input type="email" value={settings?.notify_email || ''} onChange={onTextInputChange('notify_email')} />
              </div>
              <div>
                <Label>SMS sender ID</Label>
                <Input value={settings?.notify_sms_sender_id || ''} onChange={onTextInputChange('notify_sms_sender_id')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment & Transaction Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Supported payment methods (comma separated)</Label>
                <Input value={(settings?.payment_methods || []).join(', ')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField('payment_methods', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="mpesa, cash, card" />
              </div>
              <div>
                <Label>Default discount (%)</Label>
                <Input type="number" value={settings?.default_discount_percent ?? ''} onChange={onNumberInputChange('default_discount_percent')} />
              </div>
              <div>
                <Label>Tax (%)</Label>
                <Input type="number" value={settings?.tax_percent ?? ''} onChange={onNumberInputChange('tax_percent')} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Supabase / Firebase (JSON)</Label>
                <Textarea value={JSON.stringify(settings?.supabase_keys ?? {}, null, 2)} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { try { updateField('supabase_keys', JSON.parse(e.target.value)); } catch {} }} />
              </div>
              <div className="md:col-span-2">
                <Label>Payment gateways (JSON)</Label>
                <Textarea value={JSON.stringify(settings?.payment_gateway_keys ?? {}, null, 2)} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { try { updateField('payment_gateway_keys', JSON.parse(e.target.value)); } catch {} }} />
              </div>
              <div className="md:col-span-2">
                <Label>Reporting/Analytics (JSON)</Label>
                <Textarea value={JSON.stringify(settings?.analytics_keys ?? {}, null, 2)} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { try { updateField('analytics_keys', JSON.parse(e.target.value)); } catch {} }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Use Customers page to export/import lists. Backups should be handled via Supabase backups or your cloud provider.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => toast({ title: 'Export started' })}>Export Data</Button>
                <Button variant="outline" onClick={() => toast({ title: 'Import not implemented' })}>Import Data</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

