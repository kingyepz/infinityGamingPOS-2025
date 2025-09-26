"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tournament, TournamentParticipant, TournamentMatch, TournamentStanding } from '@/types';

export function useTournamentDetail(tournamentId: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentDetail();
    }
  }, [tournamentId]);

  const fetchTournamentDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch tournament with related data
      const [
        tournamentResult,
        participantsResult,
        matchesResult,
        standingsResult
      ] = await Promise.all([
        // Tournament
        supabase
          .from('tournaments')
          .select(`
            *,
            games:game_id (
              id,
              title
            ),
            users:created_by (
              id,
              full_name
            )
          `)
          .eq('id', tournamentId)
          .single(),

        // Participants
        supabase
          .from('tournament_participants')
          .select(`
            *,
            customers:customer_id (
              id,
              full_name,
              phone_number
            )
          `)
          .eq('tournament_id', tournamentId)
          .order('registration_date', { ascending: true }),

        // Matches
        supabase
          .from('tournament_matches')
          .select(`
            *,
            participant1:participant1_id (
              id,
              customers:customer_id (
                full_name
              )
            ),
            participant2:participant2_id (
              id,
              customers:customer_id (
                full_name
              )
            ),
            winner:winner_id (
              id,
              customers:customer_id (
                full_name
              )
            ),
            stations:station_id (
              id,
              name
            )
          `)
          .eq('tournament_id', tournamentId)
          .order('round', { ascending: true })
          .order('match_number', { ascending: true }),

        // Standings (for round robin and group knockout)
        supabase
          .from('tournament_standings')
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
          .order('points', { ascending: false })
          .order('goal_difference', { ascending: false })
          .order('goals_for', { ascending: false })
      ]);

      // Handle tournament data
      if (tournamentResult.error) throw tournamentResult.error;
      
      const tournamentData: Tournament = {
        ...tournamentResult.data,
        game_name: tournamentResult.data.games?.title || null,
        game_title: tournamentResult.data.games?.title || null,
        creator_name: tournamentResult.data.users?.full_name || null,
      };
      setTournament(tournamentData);

      // Handle participants data
      if (participantsResult.error) throw participantsResult.error;
      
      const participantsData: TournamentParticipant[] = participantsResult.data?.map((participant: any) => ({
        ...participant,
        customer_name: participant.customers?.full_name || 'Unknown',
        customer_phone: participant.customers?.phone_number || '',
      })) || [];
      setParticipants(participantsData);

      // Handle matches data
      if (matchesResult.error) throw matchesResult.error;
      
      const matchesData: TournamentMatch[] = matchesResult.data?.map((match: any) => ({
        ...match,
        participant1_name: match.participant1?.customers?.full_name || 'TBD',
        participant2_name: match.participant2?.customers?.full_name || 'TBD',
        winner_name: match.winner?.customers?.full_name || null,
        station_name: match.stations?.name || null,
      })) || [];
      setMatches(matchesData);

      // Handle standings data
      if (standingsResult.error) throw standingsResult.error;
      
      const standingsData: TournamentStanding[] = standingsResult.data?.map((standing: any) => ({
        ...standing,
        participant_name: standing.tournament_participants?.customers?.full_name || 'Unknown',
        customer_name: standing.tournament_participants?.customers?.full_name || 'Unknown',
      })) || [];
      setStandings(standingsData);

    } catch (err) {
      console.error('Error fetching tournament detail:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const addParticipant = async (customerId: string, teamName?: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_participants')
        .insert([{
          tournament_id: tournamentId,
          customer_id: customerId,
          team_name: teamName,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchTournamentDetail(); // Refresh data
      return data;
    } catch (err) {
      console.error('Error adding participant:', err);
      throw err;
    }
  };

  const updateMatchResult = async (matchId: string, participant1Score: number, participant2Score: number, winnerId: string) => {
    try {
      const { data, error } = await supabase
        .from('tournament_matches')
        .update({
          participant1_score: participant1Score,
          participant2_score: participant2Score,
          winner_id: winnerId,
          status: 'completed',
          actual_end_time: new Date().toISOString(),
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) throw error;

      await fetchTournamentDetail(); // Refresh data
      return data;
    } catch (err) {
      console.error('Error updating match result:', err);
      throw err;
    }
  };

  const startTournament = async () => {
    try {
      // Call the database function to generate bracket
      const { error: bracketError } = await supabase
        .rpc('generate_knockout_bracket', { tournament_uuid: tournamentId });

      if (bracketError) throw bracketError;

      // Update tournament status
      const { data, error } = await supabase
        .from('tournaments')
        .update({
          status: 'ongoing',
        })
        .eq('id', tournamentId)
        .select()
        .single();

      if (error) throw error;

      await fetchTournamentDetail(); // Refresh data
      return data;
    } catch (err) {
      console.error('Error starting tournament:', err);
      throw err;
    }
  };

  const advanceRound = async () => {
    try {
      const { error } = await supabase
        .rpc('advance_tournament_round', { tournament_uuid: tournamentId });

      if (error) throw error;

      await fetchTournamentDetail(); // Refresh data
    } catch (err) {
      console.error('Error advancing round:', err);
      throw err;
    }
  };

  return {
    tournament,
    participants,
    matches,
    standings,
    isLoading,
    error,
    refetch: fetchTournamentDetail,
    addParticipant,
    updateMatchResult,
    startTournament,
    advanceRound,
  };
}