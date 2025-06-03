
"use client";

import React from 'react'; // Import React
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Customer, GameConsole } from '@/types'; // Removed GameSession as it's not directly used for form data

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCY_SYMBOL } from "@/lib/constants";

const sessionFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  consoleId: z.string().min(1, "Console is required."),
  gameName: z.string().min(2, "Game name must be at least 2 characters.").max(100, "Game name too long."),
  billingType: z.enum(['per-hour', 'per-game'], { required_error: "Billing type is required." }),
  rate: z.coerce.number().min(0, "Rate must be a non-negative number.").max(10000, "Rate seems too high."), // Added max validation
});

export type SessionFormData = z.infer<typeof sessionFormSchema>; // Exporting for use in page.tsx

interface StartSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => void;
  customers: Customer[];
  consoles: GameConsole[];
}

export default function StartSessionDialog({ isOpen, onClose, onSubmit, customers, consoles }: StartSessionDialogProps) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      customerId: "",
      consoleId: "",
      gameName: "",
      billingType: "per-hour",
      rate: 0, // Default rate, could be dynamic based on console/game later
    },
  });

  // Reset form when dialog is opened/closed or props change
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        customerId: "",
        consoleId: "",
        gameName: "",
        billingType: "per-hour",
        rate: 0, 
      });
    }
  }, [isOpen, form]);


  const handleSubmit = (data: SessionFormData) => {
    onSubmit(data);
    // form.reset(); // Form reset is handled by useEffect or parent component on close
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose(); // Call onClose when dialog is dismissed
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Start New Game Session</DialogTitle>
          <DialogDescription>Select customer, console, game, and billing details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.length > 0 ? customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name} ({customer.phone})</SelectItem>
                      )) : <SelectItem value="no-customers" disabled>No customers available</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consoleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Console</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                        field.onChange(value);
                        // Optionally, set a default rate based on console type here
                        // const selectedConsole = consoles.find(c => c.id === value);
                        // if (selectedConsole && selectedConsole.defaultRate) {
                        //   form.setValue('rate', selectedConsole.defaultRate);
                        // }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a console" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {consoles.length > 0 ? consoles.map(console => (
                        <SelectItem key={console.id} value={console.id} disabled={console.status !== 'available'}>
                          {console.name} <span className={cn("text-xs ml-2", console.status === 'available' ? 'text-green-500' : 'text-red-500')}>({console.status})</span>
                        </SelectItem>
                      )) : <SelectItem value="no-consoles" disabled>No consoles available</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gameName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. FIFA 2024, Apex Legends" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per-hour">Per Hour</SelectItem>
                        <SelectItem value="per-game">Per Game (Fixed)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate ({CURRENCY_SYMBOL})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 200" {...field} step="10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Start Session</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
