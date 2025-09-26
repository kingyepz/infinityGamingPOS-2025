"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tournament } from '@/types';

export function useTournaments() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTournaments: Tournament[] = data?.map((tournament: any) => ({
        ...tournament,
        game_name: tournament.games?.title || null,
        game_title: tournament.games?.title || null,
        creator_name: tournament.users?.full_name || null,
      })) || [];

      setTournaments(formattedTournaments);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTournament = async (tournamentData: Partial<Tournament>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          ...tournamentData,
          created_by: user?.id,
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchTournaments(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating tournament:', err);
      throw err;
    }
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchTournaments(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating tournament:', err);
      throw err;
    }
  };

  const deleteTournament = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchTournaments(); // Refresh the list
    } catch (err) {
      console.error('Error deleting tournament:', err);
      throw err;
    }
  };

  return {
    tournaments,
    isLoading,
    error,
    refetch: fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
  };
}