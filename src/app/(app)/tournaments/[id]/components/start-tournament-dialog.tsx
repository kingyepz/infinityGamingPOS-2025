"use client";

import React, { useState } from 'react';
import { Play, Loader2, AlertTriangle, Users, Trophy } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/types';
import { useTournamentDetail } from '../hooks/use-tournament-detail';

interface StartTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: Tournament;
}

export function StartTournamentDialog({ open, onOpenChange, tournament }: StartTournamentDialogProps) {
  const [isStarting, setIsStarting] = useState(false);
  const { startTournament } = useTournamentDetail(tournament.id);

  const handleStartTournament = async () => {
    try {
      setIsStarting(true);
      await startTournament();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to start tournament:', error);
      // Handle error (you could add toast notification here)
    } finally {
      setIsStarting(false);
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'Single elimination bracket will be generated automatically.';
      case 'round_robin':
        return 'Every player will play against every other player.';
      case 'group_knockout':
        return 'Groups will be formed followed by knockout rounds.';
      default:
        return 'Tournament matches will be generated.';
    }
  };

  const canStart = tournament.current_players >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start Tournament
          </DialogTitle>
          <DialogDescription>
            Begin the tournament and generate matches for all participants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tournament Summary */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tournament</span>
              <Badge variant="outline">{tournament.format.replace('_', ' ')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Participants</span>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-medium">{tournament.current_players}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {getFormatDescription(tournament.format)}
            </div>
          </div>

          {/* Warnings and Checks */}
          {!canStart && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need at least 2 participants to start the tournament. 
                Currently have {tournament.current_players} participants.
              </AlertDescription>
            </Alert>
          )}

          {canStart && tournament.current_players < tournament.max_players && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tournament is not full ({tournament.current_players}/{tournament.max_players} participants). 
                You can still start, but no more participants can join after starting.
              </AlertDescription>
            </Alert>
          )}

          {tournament.format === 'knockout' && tournament.current_players > 0 && (
            <div className="text-sm text-muted-foreground">
              <strong>Note:</strong> For knockout tournaments, powers of 2 work best 
              (2, 4, 8, 16, 32). Current participant count: {tournament.current_players}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isStarting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleStartTournament}
            disabled={isStarting || !canStart}
          >
            {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trophy className="mr-2 h-4 w-4" />
            Start Tournament
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}