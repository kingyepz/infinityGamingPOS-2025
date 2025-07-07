
"use client";

import type { Game } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface GameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
}

export default function GameTable({ games, onEdit, onDelete }: GameTableProps) {
  if (!games || games.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No games registered yet. Click 'Add Game' to begin.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Name</TableHead>
            <TableHead className="whitespace-nowrap">Genre</TableHead>
            <TableHead className="whitespace-nowrap">Developer</TableHead>
            <TableHead className="whitespace-nowrap">Publisher</TableHead>
            <TableHead className="whitespace-nowrap">Release Date</TableHead>
            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => (
            <TableRow key={game.id}>
              <TableCell className="font-medium whitespace-nowrap">{game.name}</TableCell>
              <TableCell className="whitespace-nowrap">{game.genre || 'N/A'}</TableCell>
              <TableCell className="whitespace-nowrap">{game.developer || 'N/A'}</TableCell>
              <TableCell className="whitespace-nowrap">{game.publisher || 'N/A'}</TableCell>
              <TableCell className="whitespace-nowrap">
                {game.release_date ? format(new Date(game.release_date), 'PPP') : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-2 whitespace-nowrap">
                <Button variant="outline" size="icon" onClick={() => onEdit(game)} aria-label={`Edit ${game.name}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(game)} aria-label={`Delete ${game.name}`}>
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
