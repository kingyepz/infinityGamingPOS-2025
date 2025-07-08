
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer, LoyaltyTransaction } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Edit, Mail, Phone, User, Star, Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TransactionHistoryTable from './components/transaction-history-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CustomerForm, { type CustomerFormData } from '../components/customer-form';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';

const fetchCustomerDetails = async (id: string): Promise<Customer> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data;
};

const fetchTransactionHistory = async (customerId: string): Promise<LoyaltyTransaction[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('loyalty_transactions').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
};

const updateCustomer = async (customer: Pick<Customer, 'id' | 'full_name' | 'phone_number' | 'email'> & { dob?: Date | null }) => {
  const supabase = createClient();
  const { id, ...updateData } = customer;
  const payload = {
      ...updateData,
      dob: updateData.dob ? updateData.dob.toISOString().split('T')[0] : null
  };
  
  // Add count: 'exact' to get the number of updated rows
  const { error, count } = await supabase.from('customers').update(payload, { count: 'exact' }).eq('id', id);

  if (error) {
    // If there's a database error, throw it
    throw new Error(error.message);
  }

  if (count === 0) {
    // If no rows were updated, it's likely an RLS issue or the record was deleted.
    // Throw a more specific error to guide the user.
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
    
    const { data: transactions, isLoading: isLoadingTransactions, isError: isErrorTransactions, error: transactionError } = useQuery<LoyaltyTransaction[]>({
        queryKey: ['transactions', customerId],
        queryFn: () => fetchTransactionHistory(customerId),
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
        // Loyalty points and tier are managed by triggers, so we don't submit them from the form.
        updateMutation.mutate({
            id: customerId,
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            email: formData.email,
            dob: formData.dob,
        });
    };

    if (isLoadingCustomer || isLoadingTransactions) {
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

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/customers')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Customers
            </Button>
            
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
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
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
                        <span>{customer.dob ? format(new Date(customer.dob), 'MMMM do') : 'Birthday not set'}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-muted-foreground" />
                        <span className="font-semibold">{customer.loyalty_points.toLocaleString()} points</span>
                        <Badge variant="outline" className={cn("capitalize", getTierClassName(customer.loyalty_tier))}>
                            {customer.loyalty_tier}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {isErrorTransactions ? (
                <p className="text-center text-destructive py-8">Error loading transactions: {transactionError?.message}</p>
            ) : (
                <TransactionHistoryTable transactions={transactions || []} />
            )}

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
                            dob: customer.dob ? new Date(customer.dob) : undefined,
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
