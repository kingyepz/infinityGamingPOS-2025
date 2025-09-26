"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trophy, Loader2, Target } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tournament, TournamentMatch } from '@/types';
import { useTournamentDetail } from '../hooks/use-tournament-detail';

const updateMatchResultSchema = z.object({
  participant1_score: z.coerce.number().min(0, 'Score cannot be negative'),
  participant2_score: z.coerce.number().min(0, 'Score cannot be negative'),
});

type UpdateMatchResultFormData = z.infer<typeof updateMatchResultSchema>;

interface UpdateMatchResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: TournamentMatch | null;
  tournament: Tournament;
}

export function UpdateMatchResultDialog({ 
  open, 
  onOpenChange, 
  match, 
  tournament 
}: UpdateMatchResultDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateMatchResult } = useTournamentDetail(tournament.id);

  const form = useForm<UpdateMatchResultFormData>({
    resolver: zodResolver(updateMatchResultSchema),
    defaultValues: {
      participant1_score: match?.participant1_score || 0,
      participant2_score: match?.participant2_score || 0,
    },
  });

  const participant1Score = form.watch('participant1_score');
  const participant2Score = form.watch('participant2_score');
  
  const winner = participant1Score > participant2Score ? '1' : 
                 participant2Score > participant1Score ? '2' : 'draw';

  // Check if draws are allowed based on both tournament format and match stage
  const allowDraws = tournament.format === 'round_robin' || 
                    (tournament.format === 'group_knockout' && match.stage === 'group');

  const onSubmit = async (data: UpdateMatchResultFormData) => {
    if (!match) return;

    // Validate knockout format doesn't allow draws
    if (!allowDraws && data.participant1_score === data.participant2_score) {
      form.setError('participant2_score', {
        type: 'manual',
        message: 'Knockout tournaments require a winner (no draws allowed)'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const winnerId = data.participant1_score > data.participant2_score 
        ? match.participant1_id 
        : data.participant2_score > data.participant1_score
        ? match.participant2_id
        : null; // null for draws (only allowed in round robin/group)

      await updateMatchResult(
        match.id,
        data.participant1_score,
        data.participant2_score,
        winnerId
      );

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update match result:', error);
      // Handle error (you could add toast notification here)
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when match changes
  React.useEffect(() => {
    if (match) {
      form.reset({
        participant1_score: match.participant1_score || 0,
        participant2_score: match.participant2_score || 0,
      });
    }
  }, [match, form]);

  if (!match) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Update Match Result
          </DialogTitle>
          <DialogDescription>
            Record the final score for this match
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Match Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-center space-y-2">
              <div className="font-medium">Match #{match.match_number}</div>
              <div className="text-sm text-muted-foreground">
                Round {match.round} • {match.stage}
              </div>
              {match.station_name && (
                <div className="text-sm text-muted-foreground">
                  Station: {match.station_name}
                </div>
              )}
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Score Input */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Participant 1 */}
                  <div className="text-center">
                    <div className="font-medium mb-2">
                      {match.participant1_name}
                      {winner === '1' && (
                        <Trophy className="inline h-4 w-4 ml-1 text-amber-500" />
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name="participant1_score"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className="text-center text-lg font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* VS separator */}
                  <div className="text-center text-muted-foreground font-medium">
                    VS
                  </div>

                  {/* Participant 2 */}
                  <div className="text-center">
                    <div className="font-medium mb-2">
                      {match.participant2_name}
                      {winner === '2' && (
                        <Trophy className="inline h-4 w-4 ml-1 text-amber-500" />
                      )}
                    </div>
                    <FormField
                      control={form.control}
                      name="participant2_score"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              className="text-center text-lg font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Winner Display */}
                {winner && winner !== 'draw' && (
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border">
                    <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
                      <Trophy className="h-4 w-4" />
                      <span className="font-medium">
                        Winner: {winner === '1' ? match.participant1_name : match.participant2_name}
                      </span>
                    </div>
                  </div>
                )}

                {winner === 'draw' && !allowDraws && (
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-sm text-red-700 dark:text-red-300">
                      Knockout tournaments require a winner (no draws allowed)
                    </div>
                  </div>
                )}

                {winner === 'draw' && allowDraws && (
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Draw - Both teams get 1 point</span>
                    </div>
                  </div>
                )}
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
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (!winner && participant1Score === 0 && participant2Score === 0) || (winner === 'draw' && !allowDraws)}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Result
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}