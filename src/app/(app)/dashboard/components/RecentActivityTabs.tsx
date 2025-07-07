
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { Gamepad2, Receipt, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// --- Data Fetching ---
const fetchRecentSessions = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, payment_status, customer:customers!customer_id(full_name), game:games(name)')
    .order('start_time', { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);
  return data;
};

const fetchRecentSales = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('id, amount_charged, payment_method, customer:customers!customer_id(full_name)')
    .eq('payment_status', 'paid')
    .order('end_time', { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);
  return data;
};

const fetchNewCustomers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('customers')
      .select('id, full_name, join_date')
      .order('join_date', { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return data;
}

// --- Helper Components ---
const ActivityItemSkeleton = () => (
    <div className="flex items-center space-x-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[100px]" />
        </div>
        <Skeleton className="h-4 w-[50px] ml-auto" />
    </div>
);

const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length > 1) return `${parts[0][0]}${parts[parts.length-1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
}


export function RecentActivityTabs() {
    const { data: recentSessions, isLoading: loadingSessions } = useQuery({ queryKey: ['recentSessions'], queryFn: fetchRecentSessions });
    const { data: recentSales, isLoading: loadingSales } = useQuery({ queryKey: ['recentSales'], queryFn: fetchRecentSales });
    const { data: newCustomers, isLoading: loadingCustomers } = useQuery({ queryKey: ['newCustomers'], queryFn: fetchNewCustomers });

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

          <TabsContent value="sessions" className="mt-4 space-y-4 min-h-[240px]">
            {loadingSessions ? Array.from({length:3}).map((_,i) => <ActivityItemSkeleton key={i} />) 
            : recentSessions && recentSessions.length > 0 ?
             recentSessions?.map((session) => (
              <div key={session.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(session.customer?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{session.customer?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{session.game?.name}</p>
                </div>
                <div className={`ml-auto text-sm font-medium capitalize ${session.payment_status === 'pending' ? 'text-green-500' : 'text-muted-foreground'}`}>
                    {session.payment_status === 'pending' ? 'Active' : session.payment_status}
                </div>
              </div>
            )) : <p className="text-center text-muted-foreground pt-10">No active sessions.</p>}
          </TabsContent>

          <TabsContent value="transactions" className="mt-4 space-y-4 min-h-[240px]">
             {loadingSales ? Array.from({length:3}).map((_,i) => <ActivityItemSkeleton key={i} />) 
             : recentSales && recentSales.length > 0 ?
             recentSales?.map((tx) => (
              <div key={tx.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                   <AvatarFallback>{getInitials(tx.customer?.full_name)}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{tx.customer?.full_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{tx.payment_method}</p>
                </div>
                <div className="ml-auto font-medium">+{CURRENCY_SYMBOL}{tx.amount_charged}</div>
              </div>
            )) : <p className="text-center text-muted-foreground pt-10">No recent sales.</p>}
          </TabsContent>

          <TabsContent value="customers" className="mt-4 space-y-4 min-h-[240px]">
             {loadingCustomers ? Array.from({length:3}).map((_,i) => <ActivityItemSkeleton key={i} />) 
             : newCustomers && newCustomers.length > 0 ?
             newCustomers?.map((customer) => (
                <div key={customer.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback>{getInitials(customer.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{customer.full_name}</p>
                        <p className="text-sm text-muted-foreground">Joined {formatDistanceToNow(new Date(customer.join_date), { addSuffix: true })}</p>
                    </div>
                </div>
            )) : <p className="text-center text-muted-foreground pt-10">No new customers.</p>}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
