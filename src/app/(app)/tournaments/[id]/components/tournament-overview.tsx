"use client";

import React from 'react';
import { format } from 'date-fns';
import { Calendar, Users, Trophy, Crown, Target, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tournament } from '@/types';

interface TournamentOverviewProps {
  tournament: Tournament;
}

export function TournamentOverview({ tournament }: TournamentOverviewProps) {
  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'Single elimination bracket where losers are immediately eliminated.';
      case 'round_robin':
        return 'Every player plays against every other player once.';
      case 'group_knockout':
        return 'Group stage followed by knockout elimination rounds.';
      default:
        return format;
    }
  };

  const rules = tournament.rules as any;
  const rulesList = rules?.rules || [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Tournament Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Tournament Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Format</span>
              <p className="font-medium">{tournament.format.replace('_', ' ').toUpperCase()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getFormatDescription(tournament.format)}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Platform</span>
              <p className="font-medium">{tournament.platform}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Game</span>
              <p className="font-medium">{tournament.game_name || 'TBD'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Created by</span>
              <p className="font-medium">{tournament.creator_name || 'System'}</p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Schedule</span>
            </div>
            <p className="text-sm">
              <span className="font-medium">Start:</span> {format(new Date(tournament.start_date), 'PPP p')}
            </p>
            {tournament.end_date && (
              <p className="text-sm">
                <span className="font-medium">End:</span> {format(new Date(tournament.end_date), 'PPP p')}
              </p>
            )}
          </div>

          {tournament.description && (
            <div className="pt-2 border-t">
              <span className="font-medium text-muted-foreground">Description</span>
              <p className="text-sm mt-1">{tournament.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prize Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Prize Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">
              {tournament.prize_type === 'cash' && `KES ${tournament.prize_value}`}
              {tournament.prize_type === 'loyalty_points' && `${tournament.prize_value} Points`}
              {tournament.prize_type === 'free_sessions' && `${tournament.prize_value} Hours`}
              {tournament.prize_type === 'merchandise' && 'Merchandise'}
              {tournament.prize_type === 'mixed' && 'Mixed Rewards'}
            </div>
            <p className="text-muted-foreground text-sm">
              {tournament.prize_type === 'cash' && 'Cash Prize Pool'}
              {tournament.prize_type === 'loyalty_points' && 'Loyalty Points'}
              {tournament.prize_type === 'free_sessions' && 'Free Gaming Sessions'}
              {tournament.prize_type === 'merchandise' && 'Physical Rewards'}
              {tournament.prize_type === 'mixed' && 'Various Rewards'}
            </p>
          </div>

          {tournament.prize_description && (
            <div>
              <span className="font-medium text-muted-foreground">Prize Details</span>
              <p className="text-sm mt-1">{tournament.prize_description}</p>
            </div>
          )}

          {tournament.entry_fee > 0 && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="font-medium">KES {tournament.entry_fee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Collected</span>
                <span className="font-medium">
                  KES {tournament.entry_fee * tournament.current_players}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tournament Rules */}
      {rulesList.length > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tournament Rules
            </CardTitle>
            <CardDescription>
              Please ensure all participants are aware of these rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rulesList.map((rule: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5 text-xs">
                    {index + 1}
                  </Badge>
                  <p className="text-sm flex-1">{rule}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tournament Progress */}
      {tournament.status === 'ongoing' && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Tournament Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{tournament.current_round}</div>
                <p className="text-muted-foreground text-sm">Current Round</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{tournament.total_rounds}</div>
                <p className="text-muted-foreground text-sm">Total Rounds</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  {Math.round((tournament.current_round / tournament.total_rounds) * 100)}%
                </div>
                <p className="text-muted-foreground text-sm">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}