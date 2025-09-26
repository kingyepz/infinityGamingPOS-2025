"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TournamentReward } from '@/types';

export function useTournamentRewards() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  const awardTournamentRewards = async (tournamentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the secure server endpoint to complete tournament and award rewards
      const response = await fetch(`/api/tournaments/${tournamentId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award tournament rewards');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error awarding tournament rewards:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const awardManualReward = async (
    tournamentId: string,
    participantId: string,
    position: number,
    positionName: string,
    rewardType: 'cash' | 'free_sessions' | 'loyalty_points' | 'merchandise',
    rewardValue: number,
    rewardDescription?: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      // Create the reward record
      const { data: reward, error: rewardError } = await supabase
        .from('tournament_rewards')
        .insert([{
          tournament_id: tournamentId,
          participant_id: participantId,
          position,
          position_name: positionName,
          reward_type: rewardType,
          reward_value: rewardValue,
          reward_description: rewardDescription,
          is_awarded: false,
          awarded_by: user?.id,
        }])
        .select()
        .single();

      if (rewardError) throw rewardError;

      // If it's loyalty points, create the transaction immediately
      if (rewardType === 'loyalty_points') {
        await awardLoyaltyPointsReward(reward.id);
      }

      return reward;
    } catch (err) {
      console.error('Error creating manual reward:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const awardLoyaltyPointsReward = async (rewardId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the secure server endpoint to award the specific reward
      const response = await fetch(`/api/tournaments/rewards/${rewardId}/award`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award reward');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error awarding loyalty points reward:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getTournamentRewards = async (tournamentId: string): Promise<TournamentReward[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('tournament_rewards')
        .select(`
          *,
          tournament_participants:participant_id (
            id,
            customers:customer_id (
              full_name
            )
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('position', { ascending: true });

      if (error) throw error;

      const formattedRewards: TournamentReward[] = data?.map((reward: any) => ({
        ...reward,
        participant_name: reward.tournament_participants?.customers?.full_name || 'Unknown',
        customer_name: reward.tournament_participants?.customers?.full_name || 'Unknown',
      })) || [];

      return formattedRewards;
    } catch (err) {
      console.error('Error fetching tournament rewards:', err);
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    awardTournamentRewards,
    awardManualReward,
    awardLoyaltyPointsReward,
    getTournamentRewards,
  };
}