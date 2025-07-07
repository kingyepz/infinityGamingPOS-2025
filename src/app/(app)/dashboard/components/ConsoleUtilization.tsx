
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MOCK_GAME_CONSOLES } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Define the type for the utilization data
type ConsoleUtilizationData = {
    id: string;
    name: string;
    status: "available" | "in-use" | "maintenance";
    utilization: number;
    customer: string;
};

export function ConsoleUtilization() {
  const [utilizationData, setUtilizationData] = useState<ConsoleUtilizationData[]>([]);

  useEffect(() => {
    // Generate mock data on the client side to prevent hydration mismatch
    const generatedData = MOCK_GAME_CONSOLES.map(c => ({
      ...c,
      utilization: c.status === 'in-use' ? Math.floor(Math.random() * (90 - 50 + 1)) + 50 : Math.floor(Math.random() * 20),
      customer: c.status === 'in-use' ? ['Alex Green', 'Samantha Ray', 'Mike Lowery'][Math.floor(Math.random() * 3)] : 'N/A',
    }));
    setUtilizationData(generatedData);
  }, []); // Empty dependency array ensures this runs only once on mount

  const getStatusVariant = (status: 'available' | 'in-use' | 'maintenance'): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'in-use': return 'default';
      case 'available': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'secondary';
    }
  }
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Console Utilization</CardTitle>
        <CardDescription>Real-time status and usage of game consoles.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Console</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Player</TableHead>
                <TableHead className="text-right">Utilization (Today)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {utilizationData.length === 0 ? (
                    Array.from({length: 4}).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                        </TableRow>
                    ))
                ) : (
                    utilizationData.map((console) => (
                    <TableRow key={console.id}>
                        <TableCell className="font-medium">{console.name}</TableCell>
                        <TableCell>
                        <Badge variant={getStatusVariant(console.status)} className="capitalize">{console.status.replace('-', ' ')}</Badge>
                        </TableCell>
                        <TableCell>{console.customer}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                                <span className="text-sm font-medium w-10">{console.utilization}%</span>
                                <Progress value={console.utilization} className="w-24 h-2" />
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
