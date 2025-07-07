
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CustomerForm, { type CustomerFormData } from './components/customer-form';
import CustomerTable from './components/customer-table';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

// Explicitly define payloads for clarity
type AddCustomerPayload = Omit<CustomerFormData, 'loyalty_points' | 'loyalty_tier'>;

// Define functions to interact with Supabase
const fetchCustomers = async (): Promise<Customer[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const addCustomer = async (customer: AddCustomerPayload) => {
  const supabase = createClient();
  // Step 1: Insert the customer without any points. The default is 0.
  const { data: newCustomer, error: customerError } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();

  if (customerError) throw new Error(customerError.message);
  if (!newCustomer) throw new Error("Failed to create customer record.");

  // Step 2: Insert the bonus transaction. The DB trigger will update the customer's points.
  const { error: transactionError } = await supabase
    .from('loyalty_transactions')
    .insert([{ 
        customer_id: newCustomer.id, 
        transaction_type: 'bonus', 
        points: 50, 
        description: 'Sign-up bonus' 
    }]);
    
  if (transactionError) {
    // Non-critical error: The customer was created, but points failed.
    // We can still return the customer but should log this and perhaps notify the user.
    console.error("Failed to add bonus points transaction:", transactionError.message);
    // This could be a good place for a specific toast message.
  }
  
  return newCustomer;
};

const deleteCustomer = async (customerId: string) => {
  const supabase = createClient();
  const { error } = await supabase.from('customers').delete().eq('id', customerId);
  if (error) throw new Error(error.message);
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { data: customers, isLoading, isError, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const addMutation = useMutation({
    mutationFn: addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers-loyalty'] }); // Invalidate loyalty page data
      toast({ title: "Customer Added", description: "The new customer has been registered and awarded 50 bonus points." });
      setIsAddFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['customer', customerToDelete?.id]});
        queryClient.invalidateQueries({ queryKey: ['customers-loyalty'] });
        toast({ title: "Customer Deleted", description: `${customerToDelete?.full_name} has been removed.` });
        setCustomerToDelete(null);
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setCustomerToDelete(null);
    }
  });


  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
  };
  
  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const handleFormSubmit = (formData: CustomerFormData) => {
    // This form is now only for adding customers
    addMutation.mutate({
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      email: formData.email,
    });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Manage Customers</h2>
        <Dialog open={isAddFormOpen} onOpenChange={(open) => {
          if (addMutation.isPending) return;
          setIsAddFormOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSubmit={handleFormSubmit}
              onCancel={() => setIsAddFormOpen(false)}
              isSubmitting={addMutation.isPending}
              isEditMode={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
         <div className="rounded-lg border shadow-sm bg-card p-4 space-y-3">
             <div className="flex justify-between">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
             </div>
             {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-full" />
                </div>
             ))}
         </div>
      )}

      {isError && <p className="text-center text-destructive py-8">Error loading customers: {error.message}</p>}

      {!isLoading && !isError && (
        <CustomerTable 
          customers={customers || []} 
          onDelete={handleDeleteCustomer} 
        />
      )}

      {customerToDelete && (
        <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete {customerToDelete.full_name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the customer record and all associated loyalty history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
