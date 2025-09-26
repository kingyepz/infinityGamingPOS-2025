"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Game } from '@/types';

export function useGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (error) throw error;

      const formattedGames: Game[] = data?.map((game: any) => ({
        ...game,
        name: game.title, // Map title to name for compatibility
      })) || [];

      setGames(formattedGames);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    games,
    isLoading,
    error,
    refetch: fetchGames,
  };
}