"use client";

import React from 'react';
import { Trophy, Target, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tournament, TournamentStanding } from '@/types';

interface TournamentStandingsProps {
  standings: TournamentStanding[];
  tournament: Tournament;
}

export function TournamentStandings({ standings, tournament }: TournamentStandingsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">🥇 1st</Badge>;
    } else if (position === 2) {
      return <Badge className="bg-gray-400/10 text-gray-600 border-gray-400/20">🥈 2nd</Badge>;
    } else if (position === 3) {
      return <Badge className="bg-amber-600/10 text-amber-700 border-amber-600/20">🥉 3rd</Badge>;
    }
    return <Badge variant="outline">{position}th</Badge>;
  };

  // Sort standings by points, then by goal difference, then by goals for
  const sortedStandings = [...standings].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.goal_difference !== b.goal_difference) return b.goal_difference - a.goal_difference;
    return b.goals_for - a.goals_for;
  });

  // Group by group_id if it's a group stage tournament
  const standingsByGroup = tournament.format === 'group_knockout' 
    ? sortedStandings.reduce((acc, standing) => {
        const groupId = standing.group_id || 0;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push(standing);
        return acc;
      }, {} as Record<number, TournamentStanding[]>)
    : { 0: sortedStandings };

  if (standings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12">
          <div className="text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No standings yet</h3>
            <p className="text-sm text-muted-foreground">
              Standings will appear after matches are played
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standings Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standings.length}</div>
            <p className="text-xs text-muted-foreground">
              Active in standings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...standings.map(s => s.matches_played), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum by participant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {standings.reduce((sum, s) => sum + s.goals_for, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Scored across all matches
            </p>
          </CardContent>
        </Card>

        {sortedStandings.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leader</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate">
                {sortedStandings[0]?.participant_name}
              </div>
              <p className="text-xs text-muted-foreground">
                {sortedStandings[0]?.points} points
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Standings Tables */}
      {Object.entries(standingsByGroup).map(([groupId, groupStandings]) => (
        <Card key={groupId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {tournament.format === 'group_knockout' ? `Group ${Number(groupId) + 1} Standings` : 'Tournament Standings'}
            </CardTitle>
            <CardDescription>
              {tournament.format === 'round_robin' 
                ? 'Points: Win = 3, Draw = 1, Loss = 0'
                : tournament.format === 'group_knockout'
                ? 'Group stage points - top performers advance'
                : 'Current tournament standings'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Pos</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead className="text-center">MP</TableHead>
                  <TableHead className="text-center">W</TableHead>
                  <TableHead className="text-center">D</TableHead>
                  <TableHead className="text-center">L</TableHead>
                  <TableHead className="text-center">GF</TableHead>
                  <TableHead className="text-center">GA</TableHead>
                  <TableHead className="text-center">GD</TableHead>
                  <TableHead className="text-center">Pts</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupStandings.map((standing, index) => {
                  const position = index + 1;
                  return (
                    <TableRow key={standing.id} className={position <= 3 ? 'bg-muted/30' : ''}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {getPositionBadge(position)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(standing.participant_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{standing.participant_name}</div>
                            {standing.is_qualified && (
                              <Badge variant="outline" className="text-xs mt-1 bg-green-500/10 text-green-600">
                                Qualified
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono">{standing.matches_played}</TableCell>
                      <TableCell className="text-center font-mono">{standing.wins}</TableCell>
                      <TableCell className="text-center font-mono">{standing.draws}</TableCell>
                      <TableCell className="text-center font-mono">{standing.losses}</TableCell>
                      <TableCell className="text-center font-mono">{standing.goals_for}</TableCell>
                      <TableCell className="text-center font-mono">{standing.goals_against}</TableCell>
                      <TableCell className="text-center font-mono">
                        <span className={standing.goal_difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {standing.goal_difference >= 0 ? '+' : ''}{standing.goal_difference}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono font-bold">
                          {standing.points}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {position === 1 && (
                          <Trophy className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}