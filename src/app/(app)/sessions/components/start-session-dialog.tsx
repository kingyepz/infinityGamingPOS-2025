
"use client";

import React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Customer, Station } from '@/types';
import { cn } from '@/lib/utils';
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
  stationId: z.string().min(1, "Station is required."),
  gameName: z.string().min(2, "Game name must be at least 2 characters.").max(100, "Game name too long."),
  sessionType: z.enum(['per-hour', 'per-game'], { required_error: "Billing type is required." }),
  rate: z.coerce.number().min(0, "Rate must be a non-negative number.").max(10000, "Rate seems too high."),
});

export type SessionFormData = z.infer<typeof sessionFormSchema>;

interface StartSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => void;
  customers: Customer[];
  stations: Station[];
}

export default function StartSessionDialog({ isOpen, onClose, onSubmit, customers, stations }: StartSessionDialogProps) {
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      customerId: "",
      stationId: "",
      gameName: "",
      sessionType: "per-hour",
      rate: 200,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        customerId: "",
        stationId: "",
        gameName: "",
        sessionType: "per-hour",
        rate: 200, 
      });
    }
  }, [isOpen, form]);

  const handleSubmit = (data: SessionFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Start New Game Session</DialogTitle>
          <DialogDescription>Select customer, station, game, and billing details.</DialogDescription>
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
                        <SelectItem key={customer.id} value={customer.id}>{customer.full_name} ({customer.phone_number})</SelectItem>
                      )) : <SelectItem value="no-customers" disabled>No customers available</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Station</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a station" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stations.length > 0 ? stations.map(station => (
                        <SelectItem key={station.id} value={station.id} disabled={station.status !== 'available'}>
                          {station.name} <span className={cn("text-xs ml-2", station.status === 'available' ? 'text-green-500' : 'text-red-500')}>({station.status})</span>
                        </SelectItem>
                      )) : <SelectItem value="no-stations" disabled>No stations available</SelectItem>}
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
                name="sessionType"
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
