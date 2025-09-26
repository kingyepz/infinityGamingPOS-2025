"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Calendar, 
  Crown,
  Play,
  Settings,
  UserPlus,
  Zap,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentOverview } from './components/tournament-overview';
import { TournamentParticipants } from './components/tournament-participants';
import { TournamentBracket } from './components/tournament-bracket';
import { TournamentStandings } from './components/tournament-standings';
import { TournamentMatches } from './components/tournament-matches';
import { TournamentRewards } from './components/tournament-rewards';
import { AddParticipantDialog } from './components/add-participant-dialog';
import { StartTournamentDialog } from './components/start-tournament-dialog';
import { useTournamentDetail } from './hooks/use-tournament-detail';

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [isAddParticipantOpen, setIsAddParticipantOpen] = useState(false);
  const [isStartTournamentOpen, setIsStartTournamentOpen] = useState(false);
  
  const { 
    tournament, 
    participants, 
    matches, 
    standings, 
    isLoading, 
    error 
  } = useTournamentDetail(tournamentId);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }

  if (error || !tournament) {
    return <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground">Tournament not found</h3>
        <p className="text-sm text-muted-foreground">The tournament may have been deleted or you don't have access to it.</p>
        <Link href="/tournaments">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </Link>
      </div>
    </div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ongoing': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed': return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const canStartTournament = tournament.status === 'upcoming' && 
                           tournament.current_players >= 2;
  const canAddParticipants = tournament.status === 'upcoming' && 
                           tournament.current_players < tournament.max_players;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tournaments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{tournament.title}</h1>
              <Badge className={`${getStatusColor(tournament.status)}`}>
                {tournament.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {tournament.game_name} • {tournament.platform} • {tournament.format}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canAddParticipants && (
            <Button 
              onClick={() => setIsAddParticipantOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Participant
            </Button>
          )}
          {canStartTournament && (
            <Button 
              onClick={() => setIsStartTournamentOpen(true)}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Start Tournament
            </Button>
          )}
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tournament Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournament.current_players}/{tournament.max_players}
            </div>
            <p className="text-xs text-muted-foreground">
              {((tournament.current_players / tournament.max_players) * 100).toFixed(0)}% full
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Start Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(tournament.start_date), 'MMM dd')}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(tournament.start_date), 'yyyy HH:mm')}
            </p>
          </CardContent>
        </Card>

        {tournament.entry_fee > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entry Fee</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {tournament.entry_fee}</div>
              <p className="text-xs text-muted-foreground">
                Total pool: KES {tournament.entry_fee * tournament.current_players}
              </p>
            </CardContent>
          </Card>
        )}

        {tournament.prize_value > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tournament.prize_type === 'cash' && `KES ${tournament.prize_value}`}
                {tournament.prize_type === 'loyalty_points' && `${tournament.prize_value} pts`}
                {tournament.prize_type === 'free_sessions' && `${tournament.prize_value}h`}
                {tournament.prize_type === 'merchandise' && 'Prizes'}
                {tournament.prize_type === 'mixed' && 'Mixed'}
              </div>
              <p className="text-xs text-muted-foreground">
                {tournament.prize_type === 'cash' && 'Cash prize'}
                {tournament.prize_type === 'loyalty_points' && 'Loyalty points'}
                {tournament.prize_type === 'free_sessions' && 'Free gaming'}
                {tournament.prize_type === 'merchandise' && 'Merchandise'}
                {tournament.prize_type === 'mixed' && 'Various rewards'}
              </p>
            </CardContent>
          </Card>
        )}

        {tournament.status === 'ongoing' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Round</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tournament.current_round}/{tournament.total_rounds}
              </div>
              <p className="text-xs text-muted-foreground">
                {tournament.format === 'knockout' && 'Elimination round'}
                {tournament.format === 'round_robin' && 'Round robin'}
                {tournament.format === 'group_knockout' && 'Tournament stage'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tournament Details Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">
            Participants ({tournament.current_players})
          </TabsTrigger>
          <TabsTrigger value="matches">
            Matches ({matches?.length || 0})
          </TabsTrigger>
          {(tournament.format === 'round_robin' || tournament.format === 'group_knockout') && (
            <TabsTrigger value="standings">
              Standings
            </TabsTrigger>
          )}
          {tournament.format === 'knockout' && tournament.status !== 'upcoming' && (
            <TabsTrigger value="bracket">
              Bracket
            </TabsTrigger>
          )}
          <TabsTrigger value="rewards">
            Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <TournamentOverview tournament={tournament} />
        </TabsContent>

        <TabsContent value="participants">
          <TournamentParticipants 
            participants={participants || []} 
            tournament={tournament}
          />
        </TabsContent>

        <TabsContent value="matches">
          <TournamentMatches 
            matches={matches || []} 
            tournament={tournament}
          />
        </TabsContent>

        {(tournament.format === 'round_robin' || tournament.format === 'group_knockout') && (
          <TabsContent value="standings">
            <TournamentStandings 
              standings={standings || []} 
              tournament={tournament}
            />
          </TabsContent>
        )}

        {tournament.format === 'knockout' && tournament.status !== 'upcoming' && (
          <TabsContent value="bracket">
            <TournamentBracket 
              matches={matches || []} 
              participants={participants || []}
              tournament={tournament}
            />
          </TabsContent>
        )}

        <TabsContent value="rewards">
          <TournamentRewards tournament={tournament} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddParticipantDialog
        open={isAddParticipantOpen}
        onOpenChange={setIsAddParticipantOpen}
        tournamentId={tournamentId}
      />
      
      <StartTournamentDialog
        open={isStartTournamentOpen}
        onOpenChange={setIsStartTournamentOpen}
        tournament={tournament}
      />
    </div>
  );
}