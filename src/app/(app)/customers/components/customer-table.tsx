
"use client";

import type { Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CustomerTableProps {
  customers: Customer[];
  onDelete: (customer: Customer) => void;
}

const getBadgeVariant = (points: number): 'default' | 'secondary' | 'destructive' => {
    if (points > 200) return 'default';
    if (points > 50) return 'secondary';
    return 'destructive';
}

const getTierClassName = (tier: string = 'Bronze'): string => {
    switch (tier.toLowerCase()) {
      case 'platinum':
        return 'bg-sky-200 text-sky-800 border-sky-400 hover:bg-sky-200/80';
      case 'gold':
        return 'bg-yellow-400 text-yellow-900 border-yellow-500 hover:bg-yellow-400/80';
      case 'silver':
        return 'bg-slate-300 text-slate-800 border-slate-400 hover:bg-slate-300/80';
      case 'bronze':
        return 'bg-amber-600 text-white border-amber-700 hover:bg-amber-600/80';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
}


export default function CustomerTable({ customers, onDelete }: CustomerTableProps) {
  if (!customers || customers.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No customers registered yet. Click 'Add Customer' to begin.</p>;
  }

  return (
    <div className="rounded-lg border shadow-sm overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Name</TableHead>
            <TableHead className="whitespace-nowrap">Status</TableHead>
            <TableHead className="whitespace-nowrap">Phone</TableHead>
            <TableHead className="whitespace-nowrap">Email</TableHead>
            <TableHead className="whitespace-nowrap">Birthday</TableHead>
            <TableHead className="whitespace-nowrap">Loyalty Tier</TableHead>
            <TableHead className="text-right whitespace-nowrap">Loyalty Points</TableHead>
            <TableHead className="whitespace-nowrap">Registered On</TableHead>
            <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium whitespace-nowrap">{customer.full_name}</TableCell>
              <TableCell>
                {customer.isActive ? (
                  <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/10">Active</Badge>
                ) : (
                  <Badge variant="secondary">Idle</Badge>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">{customer.phone_number}</TableCell>
              <TableCell className="whitespace-nowrap">{customer.email}</TableCell>
              <TableCell className="whitespace-nowrap">
                {customer.dob ? format(new Date(`${customer.dob}T00:00:00`), 'dd/MM/yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant="outline" className={cn("capitalize", getTierClassName(customer.loyalty_tier))}>
                    {customer.loyalty_tier}
                </Badge>
              </TableCell>
              <TableCell className="text-right whitespace-nowrap">
                <Badge variant={getBadgeVariant(customer.loyalty_points)}>
                  {customer.loyalty_points}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {customer.join_date ? format(new Date(customer.join_date), 'dd/MM/yyyy') : 'N/A'}
              </TableCell>
              <TableCell className="text-right space-x-2 whitespace-nowrap">
                <Button asChild variant="outline" size="icon" aria-label={`View details for ${customer.full_name}`}>
                  <Link href={`/customers/${customer.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(customer)} aria-label={`Delete ${customer.full_name}`}>
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
