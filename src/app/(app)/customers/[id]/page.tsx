
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer, CustomerOffer } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Mail, Phone, User, Star, Cake, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionHistoryTable from './components/transaction-history-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CustomerForm, { type CustomerFormData } from '../components/customer-form';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const fetchCustomerDetails = async (id: string): Promise<Customer> => {
    const supabase = createClient();
    
    const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
    if (customerError) {
        console.error("Error fetching customer:", customerError.message);
        throw new Error(customerError.message);
    }
    
    if (!customerData) {
        throw new Error("Customer not found.");
    }

    const { data: transactionData, error: transactionError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('customer_id', id)
        .order('created_at', { ascending: false });

    if (transactionError) {
        console.error("Error fetching loyalty transactions:", transactionError.message);
        (customerData as Customer).loyalty_transactions = [];
    } else {
        (customerData as Customer).loyalty_transactions = transactionData || [];
    }

    // Step 3: Fetch active offers.
    const { data: offerData, error: offerError } = await supabase
        .from('customer_offers')
        .select('*')
        .eq('customer_id', id)
        .eq('is_used', false)
        .gte('expires_at', new Date().toISOString());

    if (offerError) {
        console.error("Error fetching customer offers:", offerError.message);
        (customerData as Customer).offers = [];
    } else {
        (customerData as Customer).offers = offerData || [];
    }

    return customerData as Customer;
};

const fetchSessionStats = async (customerId: string): Promise<{ solo: number; coop: number }> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('sessions')
        .select('id, customer_id, secondary_customer_id')
        .or(`customer_id.eq.${customerId},secondary_customer_id.eq.${customerId}`);

    if (error) {
        console.error("Error fetching session stats:", error);
        throw new Error(error.message);
    }
    
    const solo = data.filter(s => s.customer_id === customerId && !s.secondary_customer_id).length;
    const coop = data.filter(s => !!s.secondary_customer_id).length;

    return { solo, coop };
};


const updateCustomer = async (customer: { id: string; full_name: string; phone_number: string; email: string; dob?: Date | null }) => {
  const supabase = createClient();
  
  const payload = {
    full_name: customer.full_name,
    phone_number: customer.phone_number,
    email: customer.email,
    dob: customer.dob ? new Date(customer.dob.getTime() - (customer.dob.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null,
  };

  const { error, count } = await supabase
    .from('customers')
    .update(payload, { count: 'exact' })
    .eq('id', customer.id);

  if (error) {
    throw new Error(error.message);
  }

  if (count === 0) {
    throw new Error("Update failed. The record may not exist or you may not have permission to modify it. Please check your database's Row Level Security (RLS) policies for the 'customers' table.");
  }
  
  return null;
};


const getTierClassName = (tier: string = 'Bronze'): string => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'bg-sky-200 text-sky-800 border-sky-400 hover:bg-sky-200/80';
      case 'gold':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-400/80';
      case 'silver':
        return 'bg-slate-300 text-slate-800 border-slate-400 hover:bg-slate-300/80';
      case 'bronze':
        return 'bg-amber-600 text-white border-amber-700 hover:bg-amber-600/80';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
}


export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const customerId = params.id as string;
    
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);

    const { data: customer, isLoading: isLoadingCustomer, isError: isErrorCustomer, error: customerError } = useQuery<Customer>({
        queryKey: ['customer', customerId],
        queryFn: () => fetchCustomerDetails(customerId),
        enabled: !!customerId,
    });
    
    const { data: sessionStats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['sessionStats', customerId],
        queryFn: () => fetchSessionStats(customerId),
        enabled: !!customerId,
    });

    const updateMutation = useMutation({
        mutationFn: updateCustomer,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer', customerId] });
            queryClient.invalidateQueries({ queryKey: ['customers'] }); // Invalidate list on main page
            toast({ title: "Customer Updated", description: "The customer's details have been updated." });
            setIsEditFormOpen(false);
        },
        onError: (err: Error) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        },
    });
    
    const handleFormSubmit = (formData: CustomerFormData) => {
        updateMutation.mutate({
            id: customerId,
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            email: formData.email,
            dob: formData.dob,
        });
    };

    if (isLoadingCustomer || isLoadingStats) {
        return (
            <div className="space-y-6">
                 <Skeleton className="h-10 w-48" />
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/2 mb-2" />
                        <Skeleton className="h-5 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-full" />
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-1/3 mb-2" />
                        <Skeleton className="h-5 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </CardContent>
                 </Card>
            </div>
        )
    }

    if (isErrorCustomer) {
        return <p className="text-center text-destructive py-8">Error loading customer: {customerError?.message}</p>
    }
    
    if (!customer) {
       return <p className="text-center text-muted-foreground py-8">Customer not found.</p>
    }

    const parseDateInLocalTime = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };
    const customerDob = customer.dob ? parseDateInLocalTime(customer.dob) : undefined;


    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/customers')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Customers
            </Button>
            
            {customer.offers && customer.offers.length > 0 && (
                <Alert className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400">
                    <Gift className="h-4 w-4" />
                    <AlertTitle className="font-bold">Active Offer Available!</AlertTitle>
                    <AlertDescription>
                        {customer.offers.map(offer => (
                            <div key={offer.id}>
                                {offer.description} (Expires: {format(new Date(offer.expires_at), 'dd/MM/yyyy')})
                            </div>
                        ))}
                    </AlertDescription>
                </Alert>
            )}

            <Card className="shadow-md">
                <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle className="text-2xl font-headline flex items-center gap-3">
                            <User className="h-7 w-7 text-primary" />
                            {customer.full_name}
                        </CardTitle>
                        <CardDescription>Joined on {format(new Date(customer.join_date), 'dd/MM/yyyy')}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditFormOpen(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Customer
                    </Button>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <a href={`mailto:${customer.email}`} className="text-primary hover:underline">{customer.email}</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <span>{customer.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Cake className="h-5 w-5 text-muted-foreground" />
                        <span>{customerDob ? format(customerDob, 'dd/MM/yyyy') : 'Birthday not set'}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{customer.loyalty_points.toLocaleString()} points</span>
                        <Badge variant="outline" className={cn("capitalize", getTierClassName(customer.loyalty_tier))}>
                            {customer.loyalty_tier}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span>Solo Sessions: <span className="font-semibold">{sessionStats?.solo ?? 0}</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span>Co-op Sessions: <span className="font-semibold">{sessionStats?.coop ?? 0}</span></span>
                    </div>
                </CardContent>
            </Card>

            <TransactionHistoryTable transactions={customer.loyalty_transactions || []} />

            <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Customer</DialogTitle>
                    </DialogHeader>
                    <CustomerForm
                        onSubmit={handleFormSubmit}
                        defaultValues={{
                            full_name: customer.full_name,
                            phone_number: customer.phone_number,
                            email: customer.email,
                            dob: customerDob,
                            loyalty_points: customer.loyalty_points,
                            loyalty_tier: customer.loyalty_tier,
                        }}
                        onCancel={() => setIsEditFormOpen(false)}
                        isSubmitting={updateMutation.isPending}
                        isEditMode={true}
                    />
                </DialogContent>
            </Dialog>

        </div>
    );
}
