"use client";

import React, { useState, useEffect } from 'react';
import { Crown, Gift, CheckCircle, Trophy, Award } from 'lucide-react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tournament, TournamentReward } from '@/types';
import { useTournamentRewards } from '../../hooks/use-tournament-rewards';

interface TournamentRewardsProps {
  tournament: Tournament;
}

export function TournamentRewards({ tournament }: TournamentRewardsProps) {
  const [rewards, setRewards] = useState<TournamentReward[]>([]);
  const { 
    isLoading, 
    error, 
    awardTournamentRewards, 
    getTournamentRewards,
    awardLoyaltyPointsReward 
  } = useTournamentRewards();

  useEffect(() => {
    if (tournament.id) {
      fetchRewards();
    }
  }, [tournament.id]);

  const fetchRewards = async () => {
    try {
      const tournamentRewards = await getTournamentRewards(tournament.id);
      setRewards(tournamentRewards);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  };

  const handleAwardAllRewards = async () => {
    try {
      await awardTournamentRewards(tournament.id);
      await fetchRewards();
    } catch (error) {
      console.error('Failed to award tournament rewards:', error);
    }
  };

  const handleAwardReward = async (rewardId: string) => {
    try {
      await awardLoyaltyPointsReward(rewardId);
      await fetchRewards();
    } catch (error) {
      console.error('Failed to award reward:', error);
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

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '🏆';
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'cash':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'loyalty_points':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'free_sessions':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'merchandise':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getRewardValue = (reward: TournamentReward) => {
    switch (reward.reward_type) {
      case 'cash':
        return `KES ${reward.reward_value}`;
      case 'loyalty_points':
        return `${reward.reward_value} points`;
      case 'free_sessions':
        return `${reward.reward_value} hours`;
      case 'merchandise':
        return reward.reward_description || 'Prize';
      default:
        return `${reward.reward_value}`;
    }
  };

  const totalAwarded = rewards.filter(r => r.is_awarded).length;
  const totalPending = rewards.filter(r => !r.is_awarded).length;

  return (
    <div className="space-y-6">
      {/* Rewards Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rewards.length}</div>
            <p className="text-xs text-muted-foreground">
              Configured for winners
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awarded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAwarded}</div>
            <p className="text-xs text-muted-foreground">
              Successfully given
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prize Pool</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tournament.prize_type === 'cash' ? `KES ${tournament.prize_value}` : 
               tournament.prize_type === 'loyalty_points' ? `${tournament.prize_value} pts` :
               tournament.prize_type === 'free_sessions' ? `${tournament.prize_value}h` : 'Mixed'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rewards Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Tournament Rewards
              </CardTitle>
              <CardDescription>
                Manage and distribute rewards to tournament winners
              </CardDescription>
            </div>
            {tournament.status === 'completed' && totalPending > 0 && (
              <Button onClick={handleAwardAllRewards} disabled={isLoading}>
                Award All Rewards
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No rewards configured</h3>
              <p className="text-sm text-muted-foreground">
                Rewards will be generated when the tournament is completed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Reward Type</TableHead>
                  <TableHead>Reward Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.map((reward) => (
                  <TableRow key={reward.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getPositionIcon(reward.position)}</span>
                        <div>
                          <div className="font-medium">{reward.position_name}</div>
                          <div className="text-xs text-muted-foreground">#{reward.position}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(reward.participant_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium">{reward.participant_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRewardTypeColor(reward.reward_type)}>
                        {reward.reward_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getRewardValue(reward)}
                      </div>
                      {reward.reward_description && (
                        <div className="text-xs text-muted-foreground">
                          {reward.reward_description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {reward.is_awarded ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Awarded
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!reward.is_awarded && reward.reward_type === 'loyalty_points' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAwardReward(reward.id)}
                          disabled={isLoading}
                        >
                          Award Points
                        </Button>
                      )}
                      {!reward.is_awarded && reward.reward_type !== 'loyalty_points' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                        >
                          Manual Award
                        </Button>
                      )}
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