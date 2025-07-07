
"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Station } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import StationForm, { type StationFormData } from './components/station-form';
import StationTable from './components/station-table';
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
const fetchStations = async (): Promise<Station[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.from('stations').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const addStation = async (station: Omit<Station, 'id' | 'created_at' | 'status'>) => {
  const supabase = createClient();
  const { data, error } = await supabase.from('stations').insert([station]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

const updateStation = async (station: Pick<Station, 'id' | 'name' | 'console_type'>) => {
  const supabase = createClient();
  const { id, ...updateData } = station;
  const { data, error } = await supabase.from('stations').update(updateData).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

const deleteStation = async (stationId: string) => {
  const supabase = createClient();
  const { error } = await supabase.from('stations').delete().eq('id', stationId);
  if (error) throw new Error(error.message);
};

export default function StationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationToDelete, setStationToDelete] = useState<Station | null>(null);

  const { data: stations, isLoading, isError, error } = useQuery<Station[]>({
    queryKey: ['stations'],
    queryFn: fetchStations,
  });

  const addMutation = useMutation({
    mutationFn: addStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast({ title: "Station Added", description: "The new station has been registered successfully." });
      setIsFormOpen(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast({ title: "Station Updated", description: "The station's details have been updated." });
      setIsFormOpen(false);
      setSelectedStation(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: deleteStation,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['stations'] });
        toast({ title: "Station Deleted", description: `${stationToDelete?.name} has been removed.` });
        setStationToDelete(null);
    },
    onError: (err: Error) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setStationToDelete(null);
    }
  });


  const handleAddStation = () => {
    setSelectedStation(null);
    setIsFormOpen(true);
  };

  const handleEditStation = (station: Station) => {
    setSelectedStation(station);
    setIsFormOpen(true);
  };

  const handleDeleteStation = (station: Station) => {
    if (station.status === 'in-use') {
        toast({ title: "Cannot Delete Station", description: "This station is currently in use and cannot be deleted.", variant: "destructive" });
        return;
    }
    setStationToDelete(station);
  };
  
  const confirmDelete = () => {
    if (stationToDelete) {
      deleteMutation.mutate(stationToDelete.id);
    }
  };

  const handleFormSubmit = (formData: StationFormData) => {
    if (selectedStation) {
      updateMutation.mutate({
        id: selectedStation.id,
        ...formData
      });
    } else {
      addMutation.mutate(formData);
    }
  };

  const isMutating = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-headline font-semibold">Manage Game Stations</h2>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          if (isMutating) return;
          setIsFormOpen(open);
          if (!open) setSelectedStation(null);
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleAddStation}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Station
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedStation ? 'Edit Station' : 'Add New Station'}</DialogTitle>
            </DialogHeader>
            <StationForm 
              onSubmit={handleFormSubmit} 
              defaultValues={selectedStation ? { 
                  name: selectedStation.name, 
                  console_type: selectedStation.console_type,
              } : undefined} 
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedStation(null);
              }}
              isSubmitting={isMutating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && (
         <div className="rounded-lg border shadow-sm bg-card p-4 space-y-3">
             <div className="flex justify-between">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
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

      {isError && <p className="text-center text-destructive py-8">Error loading stations: {error.message}</p>}

      {!isLoading && !isError && (
        <StationTable 
          stations={stations || []} 
          onEdit={handleEditStation} 
          onDelete={handleDeleteStation} 
        />
      )}

      {stationToDelete && (
        <AlertDialog open={!!stationToDelete} onOpenChange={() => setStationToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete {stationToDelete.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the station record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStationToDelete(null)}>Cancel</AlertDialogCancel>
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
