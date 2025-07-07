
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Station } from '@/types';
import { cn } from '@/lib/utils';

// Fetches station data directly from Supabase
const fetchStations = async (): Promise<Station[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('stations').select('*').order('name');
    if (error) {
        console.error("Error fetching stations for dashboard:", error);
        throw new Error(`Could not fetch stations: ${error.message}`);
    }
    return data;
};

export function ConsoleUtilization() {
  const { data: stations, isLoading, isError, error } = useQuery<Station[]>({
      queryKey: ['stations-utilization'],
      queryFn: fetchStations
  });

  const getStatusVariant = (status: 'available' | 'in-use' | 'maintenance'): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'in-use': return 'destructive'; // More visible
      case 'available': return 'default'; // Using primary color for positive status
      case 'maintenance': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusClassName = (status: 'available' | 'in-use' | 'maintenance'): string => {
    switch(status) {
        case 'available': return "bg-green-500/80 text-white";
        case 'in-use': return "bg-yellow-500/80 text-black";
        case 'maintenance': return "bg-slate-500/80 text-white";
        default: return "";
    }
  }

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Console Status</CardTitle>
        <CardDescription>Real-time availability of game stations.</CardDescription>
      </CardHeader>
      <CardContent>
        {isError && <p className="text-center text-destructive py-4">Error: {error.message}</p>}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Station</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                stations && stations.map((station) => (
                  <TableRow key={station.id}>
                    <TableCell className="font-medium">{station.name}</TableCell>
                    <TableCell>{station.type}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant={getStatusVariant(station.status)} className={cn("capitalize", getStatusClassName(station.status))}>
                          {station.status.replace('-', ' ')}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
               {!isLoading && stations?.length === 0 && (
                 <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No stations have been registered yet.
                    </TableCell>
                 </TableRow>
               )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
