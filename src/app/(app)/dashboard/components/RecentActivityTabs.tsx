
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { Gamepad2, Receipt, UserPlus } from "lucide-react";

// Mock data
const recentSessions = [
  { id: '1', customerName: 'Alex Green', game: 'FIFA 24', status: 'Active', avatar: 'AG' },
  { id: '2', customerName: 'Samantha Ray', game: 'Call of Duty', status: 'Ended', avatar: 'SR' },
  { id: '3', customerName: 'Mike Lowery', game: 'Apex Legends', status: 'Active', avatar: 'ML' },
];

const recentTransactions = [
  { id: 't1', customerName: 'Samantha Ray', amount: 500, method: 'M-Pesa', avatar: 'SR' },
  { id: 't2', customerName: 'John Doe', amount: 250, method: 'Cash', avatar: 'JD' },
  { id: 't3', customerName: 'Peter Pan', amount: 1000, method: 'M-Pesa', avatar: 'PP' },
];

const newCustomers = [
    { id: 'c1', name: 'Brenda Miles', phone: '0711223344', avatar: 'BM' },
    { id: 'c2', name: 'Chris Vector', phone: '0755667788', avatar: 'CV' },
];

export function RecentActivityTabs() {
  return (
    <Card className="h-full shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions"><Gamepad2 className="h-4 w-4 mr-1"/> Sessions</TabsTrigger>
            <TabsTrigger value="transactions"><Receipt className="h-4 w-4 mr-1"/> Sales</TabsTrigger>
            <TabsTrigger value="customers"><UserPlus className="h-4 w-4 mr-1"/>Joins</TabsTrigger>
          </TabsList>
          <TabsContent value="sessions" className="mt-4 space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/40x40.png`} alt="Avatar" data-ai-hint="avatar person" />
                  <AvatarFallback>{session.avatar}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{session.customerName}</p>
                  <p className="text-sm text-muted-foreground">{session.game}</p>
                </div>
                <div className={`ml-auto text-sm font-medium ${session.status === 'Active' ? 'text-green-500' : 'text-muted-foreground'}`}>{session.status}</div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="transactions" className="mt-4 space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={`https://placehold.co/40x40.png`} alt="Avatar" data-ai-hint="avatar person"/>
                  <AvatarFallback>{tx.avatar}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{tx.customerName}</p>
                  <p className="text-sm text-muted-foreground">{tx.method}</p>
                </div>
                <div className="ml-auto font-medium">+{CURRENCY_SYMBOL}{tx.amount}</div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="customers" className="mt-4 space-y-4">
            {newCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://placehold.co/40x40.png`} alt="Avatar" data-ai-hint="avatar person"/>
                        <AvatarFallback>{customer.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                    </div>
                </div>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
