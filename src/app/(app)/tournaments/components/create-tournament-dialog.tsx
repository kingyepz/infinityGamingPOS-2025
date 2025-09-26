"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTournaments } from '../hooks/use-tournaments';
import { useGames } from '../hooks/use-games';

const createTournamentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  game_id: z.string().optional(),
  platform: z.enum(['PC', 'PlayStation', 'Xbox', 'Nintendo', 'VR']),
  format: z.enum(['knockout', 'round_robin', 'group_knockout']),
  start_date: z.date({
    required_error: 'Start date is required',
  }),
  max_players: z.coerce.number().min(2, 'Must have at least 2 players').max(128, 'Maximum 128 players'),
  entry_fee: z.coerce.number().min(0, 'Entry fee cannot be negative'),
  prize_type: z.enum(['cash', 'free_sessions', 'loyalty_points', 'merchandise', 'mixed']),
  prize_value: z.coerce.number().min(0, 'Prize value cannot be negative'),
  prize_description: z.string().optional(),
  description: z.string().optional(),
  rules: z.string().optional(),
});

type CreateTournamentFormData = z.infer<typeof createTournamentSchema>;

interface CreateTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTournamentDialog({ open, onOpenChange }: CreateTournamentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createTournament } = useTournaments();
  const { games, isLoading: gamesLoading } = useGames();

  const form = useForm<CreateTournamentFormData>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      title: '',
      platform: 'PlayStation',
      format: 'knockout',
      start_date: undefined,
      max_players: 8,
      entry_fee: 0,
      prize_type: 'loyalty_points',
      prize_value: 0,
      prize_description: '',
      description: '',
      rules: '',
    },
  });

  const prizeType = form.watch('prize_type');
  const format = form.watch('format');

  const onSubmit = async (data: CreateTournamentFormData) => {
    try {
      setIsSubmitting(true);
      
      // Process rules if provided
      let processedRules = null;
      if (data.rules && data.rules.trim()) {
        try {
          // Try to parse as JSON, otherwise store as text
          processedRules = { rules: data.rules.split('\n').filter(line => line.trim()) };
        } catch {
          processedRules = { rules: [data.rules] };
        }
      }

      await createTournament({
        ...data,
        start_date: data.start_date.toISOString(),
        rules: processedRules,
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create tournament:', error);
      // Handle error (you could add toast notification here)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tournament</DialogTitle>
          <DialogDescription>
            Set up a new tournament for your gaming lounge. Configure the format, prizes, and rules.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Title</FormLabel>
                    <FormControl>
                      <Input placeholder="EA FC 25 Weekend Cup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="game_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a game" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gamesLoading ? (
                            <SelectItem value="" disabled>Loading games...</SelectItem>
                          ) : (
                            games?.map((game) => (
                              <SelectItem key={game.id} value={game.id}>
                                {game.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PC">PC</SelectItem>
                          <SelectItem value="PlayStation">PlayStation</SelectItem>
                          <SelectItem value="Xbox">Xbox</SelectItem>
                          <SelectItem value="Nintendo">Nintendo</SelectItem>
                          <SelectItem value="VR">VR</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Format</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="knockout">Knockout (Single Elimination)</SelectItem>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="group_knockout">Group + Knockout</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {format === 'knockout' && 'Single elimination bracket'}
                        {format === 'round_robin' && 'Everyone plays everyone'}
                        {format === 'group_knockout' && 'Group stage then knockout'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_players"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Players</FormLabel>
                      <FormControl>
                        <Input type="number" min="2" max="128" {...field} />
                      </FormControl>
                      <FormDescription>
                        {format === 'knockout' && 'Powers of 2 work best (4, 8, 16, 32)'}
                        {format === 'round_robin' && 'Keep small for manageable schedule'}
                        {format === 'group_knockout' && 'Divisible by group size recommended'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entry_fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entry Fee (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormDescription>
                        Set to 0 for free tournaments
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Prize Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prize Configuration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prize_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash Prize</SelectItem>
                          <SelectItem value="free_sessions">Free Gaming Sessions</SelectItem>
                          <SelectItem value="loyalty_points">Loyalty Points</SelectItem>
                          <SelectItem value="merchandise">Merchandise</SelectItem>
                          <SelectItem value="mixed">Mixed Rewards</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prize_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Prize Value 
                        {prizeType === 'cash' && ' (KES)'}
                        {prizeType === 'free_sessions' && ' (Hours)'}
                        {prizeType === 'loyalty_points' && ' (Points)'}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min="0" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {(prizeType === 'merchandise' || prizeType === 'mixed') && (
                <FormField
                  control={form.control}
                  name="prize_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the prizes in detail..."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Details</h3>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tournament description and overview..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rules</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tournament rules (one rule per line)..."
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Enter tournament rules, one per line
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Tournament
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}