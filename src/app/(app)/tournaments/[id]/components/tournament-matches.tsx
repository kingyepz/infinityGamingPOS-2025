"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Calendar,
  Clock,
  Trophy,
  Target,
  Play,
  CheckCircle,
  XCircle,
  Users,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UpdateMatchResultDialog } from './update-match-result-dialog';
import { Tournament, TournamentMatch } from '@/types';
import { cn } from '@/lib/utils';

interface TournamentMatchesProps {
  matches: TournamentMatch[];
  tournament: Tournament;
}

export function TournamentMatches({ matches, tournament }: TournamentMatchesProps) {
  const [selectedMatch, setSelectedMatch] = useState<TournamentMatch | null>(null);
  const [isUpdateResultOpen, setIsUpdateResultOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'no_show':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'ongoing':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'no_show':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleUpdateResult = (match: TournamentMatch) => {
    setSelectedMatch(match);
    setIsUpdateResultOpen(true);
  };

  // Group matches by round and status
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);

  const scheduledMatches = matches.filter(m => m.status === 'scheduled');
  const ongoingMatches = matches.filter(m => m.status === 'ongoing');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Match Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">
              All tournament matches
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting play
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently playing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Results recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matches Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="all">
            All Matches ({matches.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledMatches.length})
          </TabsTrigger>
          <TabsTrigger value="ongoing">
            Ongoing ({ongoingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MatchesByRound 
            matchesByRound={matchesByRound} 
            tournament={tournament}
            onUpdateResult={handleUpdateResult}
          />
        </TabsContent>

        <TabsContent value="scheduled">
          <MatchesList 
            matches={scheduledMatches} 
            tournament={tournament}
            onUpdateResult={handleUpdateResult}
            title="Scheduled Matches"
            description="Matches waiting to be played"
          />
        </TabsContent>

        <TabsContent value="ongoing">
          <MatchesList 
            matches={ongoingMatches} 
            tournament={tournament}
            onUpdateResult={handleUpdateResult}
            title="Ongoing Matches"
            description="Matches currently being played"
          />
        </TabsContent>

        <TabsContent value="completed">
          <MatchesList 
            matches={completedMatches} 
            tournament={tournament}
            onUpdateResult={handleUpdateResult}
            title="Completed Matches"
            description="Matches with recorded results"
          />
        </TabsContent>
      </Tabs>

      {/* Update Match Result Dialog */}
      <UpdateMatchResultDialog
        open={isUpdateResultOpen}
        onOpenChange={setIsUpdateResultOpen}
        match={selectedMatch}
        tournament={tournament}
      />
    </div>
  );
}

interface MatchesListProps {
  matches: TournamentMatch[];
  tournament: Tournament;
  onUpdateResult: (match: TournamentMatch) => void;
  title: string;
  description: string;
}

function MatchesList({ matches, tournament, onUpdateResult, title, description }: MatchesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No matches found</h3>
            <p className="text-sm text-muted-foreground">
              Matches will appear here as the tournament progresses
            </p>
          </div>
        ) : (
          <MatchTable matches={matches} tournament={tournament} onUpdateResult={onUpdateResult} />
        )}
      </CardContent>
    </Card>
  );
}

interface MatchesByRoundProps {
  matchesByRound: Record<number, TournamentMatch[]>;
  tournament: Tournament;
  onUpdateResult: (match: TournamentMatch) => void;
}

function MatchesByRound({ matchesByRound, tournament, onUpdateResult }: MatchesByRoundProps) {
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {rounds.map(round => (
        <Card key={round}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Round {round}
              {tournament.format === 'knockout' && round === tournament.total_rounds && (
                <Badge variant="outline" className="ml-2">Final</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {matchesByRound[round].length} matches in this round
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatchTable 
              matches={matchesByRound[round]} 
              tournament={tournament} 
              onUpdateResult={onUpdateResult} 
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface MatchTableProps {
  matches: TournamentMatch[];
  tournament: Tournament;
  onUpdateResult: (match: TournamentMatch) => void;
}

function MatchTable({ matches, tournament, onUpdateResult }: MatchTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'ongoing':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'no_show':
      case 'cancelled':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />;
      case 'ongoing':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'no_show':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Match</TableHead>
          <TableHead>Participants</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Station</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => (
          <TableRow key={match.id}>
            <TableCell>
              <div className="font-medium">
                Match #{match.match_number}
              </div>
              <div className="text-xs text-muted-foreground">
                {match.stage} • Round {match.round}
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="font-medium">
                  {match.participant1_name} 
                  {match.winner_id === match.participant1_id && (
                    <Trophy className="inline h-3 w-3 ml-1 text-amber-500" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">vs</div>
                <div className="font-medium">
                  {match.participant2_name}
                  {match.winner_id === match.participant2_id && (
                    <Trophy className="inline h-3 w-3 ml-1 text-amber-500" />
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {match.status === 'completed' ? (
                <div className="text-center">
                  <div className="font-mono text-lg font-bold">
                    {match.participant1_score} - {match.participant2_score}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  - : -
                </div>
              )}
            </TableCell>
            <TableCell>
              {match.station_name ? (
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  {match.station_name}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">TBD</span>
              )}
            </TableCell>
            <TableCell>
              <Badge className={cn("flex items-center gap-1 w-fit", getStatusColor(match.status))}>
                {getStatusIcon(match.status)}
                {match.status}
              </Badge>
            </TableCell>
            <TableCell>
              {(match.status === 'scheduled' || match.status === 'ongoing') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateResult(match)}
                >
                  {match.status === 'scheduled' ? 'Start Match' : 'Update Score'}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}