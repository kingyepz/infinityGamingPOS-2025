
"use client";

import type { Station } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface StationTableProps {
  stations: Station[];
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
}

const getStatusVariant = (status: 'available' | 'in-use' | 'maintenance'): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'in-use': return 'destructive';
      case 'available': return 'default';
      case 'maintenance': return 'secondary';
      default: return 'secondary';
    }
}

export default function StationTable({ stations, onEdit, onDelete }: StationTableProps) {
  if (!stations || stations.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No stations registered yet. Click 'Add Station' to begin.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Name</TableHead>
            <TableHead className="whitespace-nowrap">Console Type</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Date Added</TableHead>
            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((station) => (
            <TableRow key={station.id}>
              <TableCell className="font-medium whitespace-nowrap">{station.name}</TableCell>
              <TableCell className="whitespace-nowrap">{station.console_type}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(station.status)} className={cn(
                    "capitalize", 
                    station.status === 'available' && "bg-green-500/80",
                    station.status === 'in-use' && "bg-yellow-500/80",
                    station.status === 'maintenance' && "bg-slate-500/80",
                )}>
                  {station.status.replace('-', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {station.created_at ? format(new Date(station.created_at), 'PPP') : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-2 whitespace-nowrap">
                <Button variant="outline" size="icon" onClick={() => onEdit(station)} aria-label={`Edit ${station.name}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(station)} aria-label={`Delete ${station.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
