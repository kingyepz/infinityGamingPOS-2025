"use client";

import React from 'react';
import { Trophy, Crown, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tournament, TournamentMatch, TournamentParticipant } from '@/types';
import { cn } from '@/lib/utils';

interface TournamentBracketProps {
  matches: TournamentMatch[];
  participants: TournamentParticipant[];
  tournament: Tournament;
}

export function TournamentBracket({ matches, participants, tournament }: TournamentBracketProps) {
  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12">
          <div className="text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No bracket generated</h3>
            <p className="text-sm text-muted-foreground">
              Start the tournament to generate the knockout bracket
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bracket Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Knockout Bracket
          </CardTitle>
          <CardDescription>
            Single elimination tournament bracket - lose and you're out!
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bracket Visualization */}
      <div className="overflow-x-auto">
        <div className="flex gap-8 pb-4">
          {rounds.map((round, roundIndex) => (
            <div key={round} className="flex flex-col min-w-[280px]">
              {/* Round Header */}
              <div className="mb-6 text-center">
                <Badge variant="outline" className="text-sm">
                  {round === tournament.total_rounds ? 'Final' : 
                   round === tournament.total_rounds - 1 ? 'Semi-Final' :
                   round === tournament.total_rounds - 2 ? 'Quarter-Final' :
                   `Round ${round}`}
                </Badge>
              </div>

              {/* Matches in this round */}
              <div className="space-y-6">
                {matchesByRound[round]
                  .sort((a, b) => a.match_number - b.match_number)
                  .map((match, matchIndex) => (
                  <BracketMatch 
                    key={match.id}
                    match={match}
                    roundIndex={roundIndex}
                    matchIndex={matchIndex}
                    isLast={roundIndex === rounds.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bracket Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded"></div>
            <span>Match completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/30 rounded"></div>
            <span>Match scheduled</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-muted border rounded"></div>
            <span>Awaiting previous round</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Winner</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface BracketMatchProps {
  match: TournamentMatch;
  roundIndex: number;
  matchIndex: number;
  isLast: boolean;
}

function BracketMatch({ match, roundIndex, matchIndex, isLast }: BracketMatchProps) {
  const getMatchCardStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/30 bg-green-500/5';
      case 'ongoing':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'scheduled':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-muted bg-muted/20';
    }
  };

  const isWinner = (participantId: string) => {
    return match.winner_id === participantId;
  };

  return (
    <div className="relative">
      <Card className={cn('transition-all duration-200', getMatchCardStyle(match.status))}>
        <CardContent className="p-4">
          {/* Match Header */}
          <div className="text-center mb-3">
            <Badge variant="outline" className="text-xs">
              Match #{match.match_number}
            </Badge>
            {match.status === 'completed' && (
              <Badge className="ml-2 text-xs bg-green-500/10 text-green-600">
                Completed
              </Badge>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-2">
            {/* Participant 1 */}
            <div className={cn(
              'p-3 rounded-lg border transition-colors',
              isWinner(match.participant1_id) 
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' 
                : 'bg-muted/30 border-muted'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {match.participant1_name}
                  </span>
                  {isWinner(match.participant1_id) && (
                    <Crown className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                {match.status === 'completed' && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {match.participant1_score}
                  </Badge>
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-center text-xs text-muted-foreground">
              vs
            </div>

            {/* Participant 2 */}
            <div className={cn(
              'p-3 rounded-lg border transition-colors',
              isWinner(match.participant2_id) 
                ? 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' 
                : 'bg-muted/30 border-muted'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {match.participant2_name}
                  </span>
                  {isWinner(match.participant2_id) && (
                    <Crown className="h-3 w-3 text-amber-500" />
                  )}
                </div>
                {match.status === 'completed' && (
                  <Badge variant="outline" className="text-xs font-mono">
                    {match.participant2_score}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Match Status */}
          <div className="mt-3 text-center">
            {match.status === 'scheduled' && (
              <Badge variant="outline" className="text-xs">
                Scheduled
              </Badge>
            )}
            {match.status === 'ongoing' && (
              <Badge className="text-xs bg-green-500/10 text-green-600">
                In Progress
              </Badge>
            )}
            {match.station_name && (
              <div className="text-xs text-muted-foreground mt-1">
                {match.station_name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Lines (simplified for now) */}
      {!isLast && (
        <div className="absolute top-1/2 -right-4 w-8 h-0.5 bg-border"></div>
      )}
    </div>
  );
}