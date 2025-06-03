
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react'; // Example icon for cashier

export default async function CashierDashboardPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login?next=/dashboard/cashier');
  }

  const { data: staffMember, error: staffError } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (staffError || !staffMember || (staffMember.role !== 'cashier' && staffMember.role !== 'admin')) {
    // Admins can also access cashier dashboard
    console.warn(`Unauthorized access attempt to cashier dashboard by user: ${user.id}. Role found: ${staffMember?.role}. Error: ${staffError?.message}`);
    return redirect('/dashboard?error=unauthorized_cashier');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShoppingCart className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline">Cashier Dashboard</h1>
      </div>
      <p className="text-muted-foreground">Manage sales, payments, and customer checkouts.</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Process New Sale</CardTitle>
            <CardDescription>Start a new transaction or manage ongoing game sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">[Link to Game Session Management or POS interface]</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>View Transaction History</CardTitle>
            <CardDescription>Review past sales and payment records for the day/shift.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">[Transaction list or reporting tools]</p>
          </CardContent>
        </Card>
      </div>
      {/* Add more cashier-specific components here */}
    </div>
  );
}
