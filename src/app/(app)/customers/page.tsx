
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CustomerForm from './components/customer-form';
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

// Define functions to interact with Supabase
const fetchCustomers = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data as Customer[];
};

const addCustomer = async (customer: Omit<Customer, 'id' | 'created_at' | 'loyalty_points'>) => {
  const supabase = createClient();
  const { data, error } = await supabase.from('customers').insert([customer]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

const updateCustomer = async (customer: Omit<Customer, 'created_at' | 'loyalty_points'>) => {
  const supabase = createClient();
  const { id, ...updateData } = customer;
  const { data, error } = await supabase.from('customers').update(updateData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

const deleteCustomer = async (customerId: string) => {
  const supabase = createClient();
  const { error } = await supabase.from('customers').delete().eq('id', customerId);
  if (error) throw new Error(error.message);
};

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { data: customers, isLoading, isError, error } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const addMutation = useMutation({
    mutationFn: addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer Added", description: "The new customer has been registered successfully." });
      setIsFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({ title: "Customer Updated", description: "The customer's details have been updated." });
      setIsFormOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        toast({ title: "Customer Deleted", description: `${customerToDelete?.name} has been removed.` });
        setCustomerToDelete(null);
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setCustomerToDelete(null);
    }
  });


  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
  };
  
  const confirmDelete = () => {
    if (customerToDelete) {
      deleteMutation.mutate(customerToDelete.id);
    }
  };

  const handleFormSubmit = (formData: { name: string; phone: string; email: string; }) => {
    if (selectedCustomer) {
      updateMutation.mutate({ ...selectedCustomer, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const isMutating = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Manage Customers</h2>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (isMutating) return; // Prevent closing while submitting
          setIsFormOpen(open);
          if (!open) setSelectedCustomer(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddCustomer}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <CustomerForm 
              onSubmit={handleFormSubmit} 
              defaultValues={selectedCustomer ? { name: selectedCustomer.name, phone: selectedCustomer.phone, email: selectedCustomer.email } : undefined} 
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedCustomer(null);
              }}
              isSubmitting={isMutating}
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
          onEdit={handleEditCustomer} 
          onDelete={handleDeleteCustomer} 
        />
      )}

      {customerToDelete && (
        <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete {customerToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the customer record.
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
