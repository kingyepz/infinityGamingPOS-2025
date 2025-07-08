
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Game } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GameForm, { type GameFormData } from './components/game-form';
import GameTable from './components/game-table';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

// Define functions to interact with Supabase
const fetchGames = async (): Promise<Game[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('games').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const addGame = async (formData: GameFormData) => {
  const supabase = createClient();
  const payload = {
    ...formData,
    platforms: formData.platforms && formData.platforms.length > 0 ? formData.platforms : null,
    cover_image_url: formData.cover_image_url || null,
    release_date: formData.release_date ? formData.release_date.toISOString().split('T')[0] : null,
  };
  const { data, error } = await supabase.from('games').insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

const updateGame = async (payload: {id: string} & GameFormData) => {
  const supabase = createClient();
  const { id, ...formData } = payload;
  const updateData = {
      ...formData,
      platforms: formData.platforms && formData.platforms.length > 0 ? formData.platforms : null,
      cover_image_url: formData.cover_image_url || null,
      release_date: formData.release_date ? formData.release_date.toISOString().split('T')[0] : null,
  }
  const { data, error } = await supabase.from('games').update(updateData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

const deleteGame = async (gameId: string) => {
  const supabase = createClient();
  const { error } = await supabase.from('games').delete().eq('id', gameId);
  if (error) throw new Error(error.message);
};

export default function GamesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  const { data: games, isLoading, isError, error } = useQuery<Game[]>({
    queryKey: ['games'],
    queryFn: fetchGames,
  });

  const addMutation = useMutation({
    mutationFn: addGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast({ title: "Game Added", description: "The new game has been added to the catalog." });
      setIsFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateGame,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      toast({ title: "Game Updated", description: "The game's details have been updated." });
      setIsFormOpen(false);
      setSelectedGame(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['games'] });
        toast({ title: "Game Deleted", description: `${gameToDelete?.name} has been removed.` });
        setGameToDelete(null);
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setGameToDelete(null);
    }
  });


  const handleAddGame = () => {
    setSelectedGame(null);
    setIsFormOpen(true);
  };

  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setIsFormOpen(true);
  };

  const handleDeleteGame = (game: Game) => {
    setGameToDelete(game);
  };
  
  const confirmDelete = () => {
    if (gameToDelete) {
      deleteMutation.mutate(gameToDelete.id);
    }
  };

  const handleFormSubmit = (formData: GameFormData) => {
    if (selectedGame) {
      updateMutation.mutate({
        id: selectedGame.id,
        ...formData
      });
    } else {
      addMutation.mutate(formData);
    }
  };

  const isMutating = addMutation.isPending || updateMutation.isPending;
  
  const getFormDefaultValues = () => {
    if (!selectedGame) return undefined;
    
    // Ensure platforms is always an array for the form
    const platforms = Array.isArray(selectedGame.platforms) ? selectedGame.platforms : [];

    return {
      name: selectedGame.name,
      genre: selectedGame.genre ?? '',
      description: selectedGame.description ?? '',
      platforms: platforms,
      cover_image_url: selectedGame.cover_image_url ?? '',
      release_date: selectedGame.release_date ? new Date(`${selectedGame.release_date}T00:00:00`) : undefined,
      developer: selectedGame.developer ?? '',
      publisher: selectedGame.publisher ?? '',
    }
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Manage Games Catalog</h2>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (isMutating) return;
          setIsFormOpen(open);
          if (!open) setSelectedGame(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddGame}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Game
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
            </DialogHeader>
            <GameForm 
              onSubmit={handleFormSubmit} 
              defaultValues={getFormDefaultValues()} 
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedGame(null);
              }}
              isSubmitting={isMutating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
         <div className="rounded-lg border shadow-sm bg-card p-4 space-y-3">
             <div className="flex justify-between">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
                <Skeleton className="h-5 w-1/6" />
             </div>
             {Array.from({length: 4}).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-full" />
                </div>
             ))}
         </div>
      )}

      {isError && <p className="text-center text-destructive py-8">Error loading games: {error.message}</p>}

      {!isLoading && !isError && (
        <GameTable 
          games={games || []} 
          onEdit={handleEditGame} 
          onDelete={handleDeleteGame} 
        />
      )}

      {gameToDelete && (
        <AlertDialog open={!!gameToDelete} onOpenChange={() => setGameToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete {gameToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the game from your catalog.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setGameToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
