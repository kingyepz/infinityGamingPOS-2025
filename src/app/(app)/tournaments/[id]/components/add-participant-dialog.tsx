"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Loader2, UserPlus, Phone } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTournamentDetail } from '../hooks/use-tournament-detail';
import { useCustomers } from './hooks/use-customers';
import { Customer } from '@/types';

const addParticipantSchema = z.object({
  customer_id: z.string().min(1, 'Please select a customer'),
  team_name: z.string().optional(),
});

type AddParticipantFormData = z.infer<typeof addParticipantSchema>;

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
}

export function AddParticipantDialog({ open, onOpenChange, tournamentId }: AddParticipantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addParticipant } = useTournamentDetail(tournamentId);
  const { customers, isLoading: customersLoading } = useCustomers(searchTerm);

  const form = useForm<AddParticipantFormData>({
    resolver: zodResolver(addParticipantSchema),
    defaultValues: {
      customer_id: '',
      team_name: '',
    },
  });

  const selectedCustomerId = form.watch('customer_id');
  const selectedCustomer = customers?.find(c => c.id === selectedCustomerId);

  const onSubmit = async (data: AddParticipantFormData) => {
    try {
      setIsSubmitting(true);
      
      await addParticipant(data.customer_id, data.team_name);
      
      form.reset();
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add participant:', error);
      // Handle error (you could add toast notification here)
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const filteredCustomers = customers?.filter(customer => 
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone_number.includes(searchTerm)
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Participant
          </DialogTitle>
          <DialogDescription>
            Add a customer to the tournament as a participant
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Customer Search */}
            <div className="space-y-3">
              <FormLabel>Search Customers</FormLabel>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Customer Selection */}
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customersLoading ? (
                          <SelectItem value="" disabled>Loading customers...</SelectItem>
                        ) : filteredCustomers.length === 0 ? (
                          <SelectItem value="" disabled>
                            {searchTerm ? 'No customers found' : 'Start typing to search'}
                          </SelectItem>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              <div className="flex items-center gap-3 py-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(customer.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{customer.full_name}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {customer.phone_number}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {customer.loyalty_tier}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {customer.loyalty_points} pts
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Selected Customer Preview */}
            {selectedCustomer && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">
                      {getInitials(selectedCustomer.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{selectedCustomer.full_name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedCustomer.phone_number}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{selectedCustomer.loyalty_tier}</Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedCustomer.loyalty_points} points
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Optional Team Name */}
            <FormField
              control={form.control}
              name="team_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter team name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedCustomer}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Participant
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}