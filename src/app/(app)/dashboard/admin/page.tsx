
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?next=/dashboard/admin');
  }

  const { data: staffMember, error: staffError } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffMember || staffMember.role !== 'admin') {
    // Log the error or lack of role for debugging if needed
    console.warn(`Unauthorized access attempt to admin dashboard by user: ${user.id}. Role found: ${staffMember?.role}. Error: ${staffError?.message}`);
    return redirect('/dashboard?error=unauthorized_admin'); // Redirect to general dashboard or an error page
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
      </div>
      <p className="text-muted-foreground">Welcome, Administrator. Here you can manage the entire system.</p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage staff accounts and roles.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">[User management features would go here]</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure global application settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">[System settings controls would go here]</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>View system activity and logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">[Audit log viewer would go here]</p>
          </CardContent>
        </Card>
      </div>
      {/* Add more admin-specific components and data displays here */}
    </div>
  );
}
