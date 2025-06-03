
"use client";

import React, { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    // Mock initial data
    const initialCustomers: Customer[] = [
      { id: 'cust1', name: 'John Doe', phone: '0712345678', email: 'john.doe@example.com', loyaltyPoints: 120, createdAt: new Date(), sessionHistory: [] },
      { id: 'cust2', name: 'Jane Smith', phone: '0723456789', email: 'jane.smith@example.com', loyaltyPoints: 75, createdAt: new Date(), sessionHistory: []  },
    ];
    setCustomers(initialCustomers);
  }, []);

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
      setCustomers(customers.filter(c => c.id !== customerToDelete.id));
      toast({ title: "Customer Deleted", description: `${customerToDelete.name} has been removed.` });
      setCustomerToDelete(null);
    }
  };

  const handleFormSubmit = (data: Omit<Customer, 'id' | 'createdAt' | 'loyaltyPoints' | 'sessionHistory'>) => {
    if (selectedCustomer) {
      // Edit existing customer
      setCustomers(customers.map(c => 
        c.id === selectedCustomer.id ? { ...selectedCustomer, ...data } : c
      ));
      toast({ title: "Customer Updated", description: `${data.name}'s details have been updated.` });
    } else {
      // Add new customer
      const newCustomer: Customer = {
        ...data,
        id: `cust${Date.now()}`,
        createdAt: new Date(),
        loyaltyPoints: 0,
        sessionHistory: []
      };
      setCustomers([...customers, newCustomer]);
      toast({ title: "Customer Added", description: `${newCustomer.name} has been registered.` });
    }
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Manage Customers</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <CustomerTable 
        customers={customers} 
        onEdit={handleEditCustomer} 
        onDelete={handleDeleteCustomer} 
      />

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
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
