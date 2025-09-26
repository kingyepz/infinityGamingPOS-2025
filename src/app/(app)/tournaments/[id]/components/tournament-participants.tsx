"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { 
  Users, 
  Phone, 
  Calendar,
  Crown,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tournament, TournamentParticipant } from '@/types';
import { cn } from '@/lib/utils';

interface TournamentParticipantsProps {
  participants: TournamentParticipant[];
  tournament: Tournament;
}

export function TournamentParticipants({ participants, tournament }: TournamentParticipantsProps) {
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'eliminated':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'disqualified':
        return <X className="h-4 w-4 text-red-600" />;
      case 'withdrew':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'eliminated':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'disqualified':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'withdrew':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Group participants by status
  const activeParticipants = participants.filter(p => p.status === 'active');
  const eliminatedParticipants = participants.filter(p => p.status !== 'active');

  return (
    <div className="space-y-6">
      {/* Participants Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{participants.length}</div>
            <p className="text-xs text-muted-foreground">
              {tournament.max_players - participants.length} slots remaining
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeParticipants.length}</div>
            <p className="text-xs text-muted-foreground">
              Still in competition
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Entry</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants.filter(p => p.entry_fee_paid).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of {participants.length} participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registration Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((participants.length / tournament.max_players) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tournament capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Participants</CardTitle>
          <CardDescription>
            Manage tournament participants, entry fees, and registration status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No participants yet</h3>
              <p className="text-sm text-muted-foreground">
                Add participants to get the tournament started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Entry Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(participant.customer_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{participant.customer_name}</div>
                          {participant.seed_position && (
                            <div className="text-xs text-muted-foreground">
                              Seed #{participant.seed_position}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {participant.customer_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {participant.team_name ? (
                        <Badge variant="outline">{participant.team_name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(participant.registration_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(participant.registration_date), 'HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tournament.entry_fee > 0 ? (
                        <div className="flex items-center gap-2">
                          {participant.entry_fee_paid ? (
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                              <XCircle className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {participant.payment_method && (
                            <span className="text-xs text-muted-foreground">
                              via {participant.payment_method}
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(participant.status)}
                        <Badge className={cn("text-xs", getStatusColor(participant.status))}>
                          {participant.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!participant.entry_fee_paid && tournament.entry_fee > 0 && (
                            <DropdownMenuItem>
                              Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {participant.status === 'active' && tournament.status === 'ongoing' && (
                            <DropdownMenuItem>
                              Disqualify
                            </DropdownMenuItem>
                          )}
                          {tournament.status === 'upcoming' && (
                            <DropdownMenuItem className="text-red-600">
                              Remove from Tournament
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}