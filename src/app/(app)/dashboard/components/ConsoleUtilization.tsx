
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MOCK_GAME_CONSOLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

// Mock utilization data
const consoleUtilizationData = MOCK_GAME_CONSOLES.map(c => ({
  ...c,
  utilization: c.status === 'in-use' ? Math.floor(Math.random() * (90 - 50 + 1)) + 50 : Math.floor(Math.random() * 20),
  customer: c.status === 'in-use' ? ['Alex Green', 'Samantha Ray', 'Mike Lowery'][Math.floor(Math.random()*3)] : 'N/A',
}));

export function ConsoleUtilization() {
  const getStatusVariant = (status: 'available' | 'in-use' | 'maintenance'): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'in-use': return 'default';
      case 'available': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'secondary';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Console Utilization</CardTitle>
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
                {consoleUtilizationData.map((console) => (
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
                ))}
            </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
