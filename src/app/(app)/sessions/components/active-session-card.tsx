
"use client";

import type { GameSession } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Gamepad2 as GamepadIcon, Clock, Play, MoreHorizontal } from 'lucide-react'; // Renamed Gamepad to GamepadIcon
import { format, formatDistanceToNowStrict } from 'date-fns';
import React, { useState, useEffect } from 'react'; // Explicitly import useState and useEffect
import { CURRENCY_SYMBOL } from '@/lib/constants';


interface ActiveSessionCardProps {
  session: GameSession;
  onEndSession: (session: GameSession) => void;
}

export default function ActiveSessionCard({ session, onEndSession }: ActiveSessionCardProps) {
  const [elapsedTime, setElapsedTime] = useState(formatDistanceToNowStrict(new Date(session.startTime), { addSuffix: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(formatDistanceToNowStrict(new Date(session.startTime), { addSuffix: false }));
    }, 1000 * 30); // Update every 30 seconds
    return () => clearInterval(timer);
  }, [session.startTime]);
  
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-headline truncate text-primary-foreground">{session.gameName}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{session.consoleName}</CardDescription>
            </div>
            {/* Placeholder for potential quick actions icon if needed */}
            {/* <MoreHorizontal className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" /> */}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2.5">
        <div className="flex items-center text-sm text-foreground/90">
          <User className="h-4 w-4 mr-2 text-primary" />
          <span>{session.customerName}</span>
        </div>
        <div className="flex items-center text-sm text-foreground/90">
          <Play className="h-4 w-4 mr-2 text-primary" />
          <span>Billing: {session.billingType === 'per-hour' ? `${CURRENCY_SYMBOL}${session.rate}/hr` : `${CURRENCY_SYMBOL}${session.rate} (Fixed)`}</span>
        </div>
        <div className="flex items-center text-sm text-foreground/90">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          <span>Started: {format(new Date(session.startTime), 'p')} ({elapsedTime})</span>
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button onClick={() => onEndSession(session)} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
          End Session & Bill
        </Button>
      </CardFooter>
    </Card>
  );
}
