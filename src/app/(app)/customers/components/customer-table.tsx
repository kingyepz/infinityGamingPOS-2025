
"use client";

import type { Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const getBadgeVariant = (points: number): 'default' | 'secondary' | 'destructive' => {
    if (points > 200) return 'default';
    if (points > 50) return 'secondary';
    return 'destructive';
}

export default function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  if (!customers || customers.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No customers registered yet. Click 'Add Customer' to begin.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Name</TableHead>
            <TableHead className="whitespace-nowrap">Phone</TableHead>
            <TableHead className="whitespace-nowrap">Email</TableHead>
            <TableHead className="text-right whitespace-nowrap">Loyalty Points</TableHead>
            <TableHead className="whitespace-nowrap">Registered On</TableHead>
            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium whitespace-nowrap">{customer.name}</TableCell>
              <TableCell className="whitespace-nowrap">{customer.phone}</TableCell>
              <TableCell className="whitespace-nowrap">{customer.email}</TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Badge variant={getBadgeVariant(customer.loyalty_points)}>
                  {customer.loyalty_points}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {customer.created_at ? format(new Date(customer.created_at), 'PPP') : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-2 whitespace-nowrap">
                <Button variant="outline" size="icon" onClick={() => onEdit(customer)} aria-label={`Edit ${customer.name}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(customer)} aria-label={`Delete ${customer.name}`}>
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
