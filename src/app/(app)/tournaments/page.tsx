"use client";

import React, { useState } from 'react';
import { Plus, Trophy, Calendar, Users, Target, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TournamentCard } from './components/tournament-card';
import { CreateTournamentDialog } from './components/create-tournament-dialog';
import { useTournaments } from './hooks/use-tournaments';
import { Tournament } from '@/types';

export default function TournamentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  
  const { tournaments, isLoading, error } = useTournaments();

  // Filter tournaments based on search and filters
  const filteredTournaments = tournaments?.filter(tournament => {
    const matchesSearch = tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.game_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    const matchesFormat = formatFilter === 'all' || tournament.format === formatFilter;
    
    return matchesSearch && matchesStatus && matchesFormat;
  }) || [];

  // Group tournaments by status
  const upcomingTournaments = filteredTournaments.filter(t => t.status === 'upcoming');
  const ongoingTournaments = filteredTournaments.filter(t => t.status === 'ongoing');
  const completedTournaments = filteredTournaments.filter(t => t.status === 'completed');
  const allTournaments = filteredTournaments;

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Error loading tournaments</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground">
            Manage gaming tournaments, brackets, and competitions
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Tournament
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allTournaments.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all formats
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTournaments.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to start
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTournaments.reduce((sum, t) => sum + t.current_players, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              In all tournaments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ongoingTournaments.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently playing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="ongoing">Ongoing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Formats</SelectItem>
            <SelectItem value="knockout">Knockout</SelectItem>
            <SelectItem value="round_robin">Round Robin</SelectItem>
            <SelectItem value="group_knockout">Group + Knockout</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tournament Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1">
              {allTournaments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            Upcoming
            <Badge variant="secondary" className="ml-1">
              {upcomingTournaments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="gap-2">
            Ongoing
            <Badge variant="secondary" className="ml-1">
              {ongoingTournaments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="ml-1">
              {completedTournaments.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TournamentGrid tournaments={allTournaments} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="upcoming">
          <TournamentGrid tournaments={upcomingTournaments} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="ongoing">
          <TournamentGrid tournaments={ongoingTournaments} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="completed">
          <TournamentGrid tournaments={completedTournaments} isLoading={isLoading} />
        </TabsContent>
      </Tabs>

      {/* Create Tournament Dialog */}
      <CreateTournamentDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen}
      />
    </div>
  );
}

interface TournamentGridProps {
  tournaments: Tournament[];
  isLoading: boolean;
}

function TournamentGrid({ tournaments, isLoading }: TournamentGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tournaments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No tournaments found</h3>
          <p className="text-sm text-muted-foreground">
            Create your first tournament to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}