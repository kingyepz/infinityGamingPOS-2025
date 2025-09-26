"use client";

import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Calendar, 
  Trophy, 
  Users, 
  DollarSign, 
  Gamepad2,
  Clock,
  Target,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tournament } from '@/types';
import { cn } from '@/lib/utils';

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'knockout':
        return 'Knockout';
      case 'round_robin':
        return 'Round Robin';
      case 'group_knockout':
        return 'Group + Knockout';
      default:
        return format;
    }
  };

  const getPlatformIcon = (platform: string) => {
    // You could add specific platform icons here
    return <Gamepad2 className="h-4 w-4" />;
  };

  const progressPercentage = tournament.max_players > 0 
    ? (tournament.current_players / tournament.max_players) * 100 
    : 0;

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border hover:border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg font-semibold leading-tight group-hover:text-primary transition-colors">
              {tournament.title}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {getPlatformIcon(tournament.platform)}
              <span>{tournament.game_name || 'Game TBD'}</span>
            </div>
          </div>
          <Badge className={cn("text-xs font-medium", getStatusColor(tournament.status))}>
            {tournament.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs">
            {getFormatLabel(tournament.format)}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {tournament.platform}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tournament Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(tournament.start_date), 'MMM dd')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {tournament.current_players}/{tournament.max_players}
            </span>
          </div>
          
          {tournament.entry_fee > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                KES {tournament.entry_fee}
              </span>
            </div>
          )}
          
          {tournament.status === 'ongoing' && (
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Round {tournament.current_round}/{tournament.total_rounds}
              </span>
            </div>
          )}
        </div>

        {/* Player Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Registration</span>
            <span className="text-muted-foreground">
              {tournament.current_players}/{tournament.max_players}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Prize Info */}
        {tournament.prize_value > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <Crown className="h-4 w-4 text-amber-500" />
            <div className="text-sm">
              <span className="font-medium">Prize: </span>
              <span className="text-muted-foreground">
                {tournament.prize_type === 'cash' && `KES ${tournament.prize_value}`}
                {tournament.prize_type === 'loyalty_points' && `${tournament.prize_value} points`}
                {tournament.prize_type === 'free_sessions' && `${tournament.prize_value} sessions`}
                {tournament.prize_type === 'merchandise' && tournament.prize_description}
                {tournament.prize_type === 'mixed' && tournament.prize_description}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link href={`/tournaments/${tournament.id}`}>
          <Button className="w-full" variant="outline">
            <Trophy className="h-4 w-4 mr-2" />
            View Tournament
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}