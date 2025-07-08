
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Customer, Station, Game } from '@/types';
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
import { Loader2, UserPlus, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const sessionFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  secondaryCustomerId: z.string().optional(),
  stationId: z.string().min(1, "Station is required."),
  gameId: z.string().min(1, "Game is required."),
  sessionType: z.enum(['per-hour', 'per-game'], { required_error: "Billing type is required." }),
  rate: z.coerce.number().min(0, "Rate must be a non-negative number.").max(10000, "Rate seems too high."),
}).refine(data => {
    if (data.secondaryCustomerId) {
        return data.customerId !== data.secondaryCustomerId;
    }
    return true;
}, {
    message: "Primary and secondary customer cannot be the same.",
    path: ["secondaryCustomerId"],
});

export type SessionFormData = z.infer<typeof sessionFormSchema>;

interface StartSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => void;
  customers: Customer[];
  stations: Station[];
  games: Game[];
  isSubmitting: boolean;
}

export default function StartSessionDialog({ isOpen, onClose, onSubmit, customers, stations, games, isSubmitting }: StartSessionDialogProps) {
  const [showSecondPlayer, setShowSecondPlayer] = useState(false);
  
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      customerId: "",
      secondaryCustomerId: "",
      stationId: "",
      gameId: "",
      sessionType: "per-hour",
      rate: 200,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        customerId: "",
        secondaryCustomerId: "",
        stationId: "",
        gameId: "",
        sessionType: "per-hour",
        rate: 200, 
      });
      setShowSecondPlayer(false);
    }
  }, [isOpen, form]);

  const handleSubmit = (data: SessionFormData) => {
    onSubmit(data);
  };
  
  const primaryCustomerId = form.watch("customerId");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
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
                  <FormLabel>Primary Customer</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.length > 0 ? customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id} disabled={customer.isActive}>
                          {customer.full_name} ({customer.phone_number})
                          {customer.isActive && <span className="text-muted-foreground ml-2">(In Session)</span>}
                        </SelectItem>
                      )) : <SelectItem value="no-customers" disabled>No customers available</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showSecondPlayer && (
              <FormField
                control={form.control}
                name="secondaryCustomerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Second Customer (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select second player" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(customer => (
                          <SelectItem key={customer.id} value={customer.id} disabled={customer.isActive || customer.id === primaryCustomerId}>
                             {customer.full_name} ({customer.phone_number})
                             {customer.isActive && <span className="text-muted-foreground ml-2">(In Session)</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {!showSecondPlayer ? (
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setShowSecondPlayer(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Second Player
                </Button>
            ) : (
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => {
                    setShowSecondPlayer(false);
                    form.setValue("secondaryCustomerId", "");
                }}>
                    <X className="mr-2 h-4 w-4" /> Remove Second Player
                </Button>
            )}

            <Separator />
            
            <FormField
              control={form.control}
              name="stationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Station</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a station" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stations.length > 0 ? stations.map(station => (
                        <SelectItem key={station.id} value={station.id} disabled={station.status !== 'available'}>
                          {station.name} <span className={cn("text-xs ml-2 capitalize", station.status === 'available' ? 'text-green-500' : 'text-red-500')}>({station.status.replace('-', ' ')})</span>
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
              name="gameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       {games.length > 0 ? games.map(game => (
                        <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                      )) : <SelectItem value="no-games" disabled>No games available</SelectItem>}
                    </SelectContent>
                  </Select>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                      <Input type="number" placeholder="e.g. 200" {...field} step="10" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Session
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
