
"use client";

import type { Session } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Play, Clock, Loader2, Gamepad2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import React, { useState, useEffect } from 'react';
import { CURRENCY_SYMBOL } from '@/lib/constants';


interface ActiveSessionCardProps {
  session: Session;
  onEndSession: (session: Session) => void;
  isEnding?: boolean; // To show loading state
}

export default function ActiveSessionCard({ session, onEndSession, isEnding }: ActiveSessionCardProps) {
  const [elapsedTime, setElapsedTime] = useState('');

  useEffect(() => {
    // Ensure start_time is valid before processing
    if (session.start_time) {
      setElapsedTime(formatDistanceToNowStrict(new Date(session.start_time), { addSuffix: false }));
      const timer = setInterval(() => {
        setElapsedTime(formatDistanceToNowStrict(new Date(session.start_time), { addSuffix: false }));
      }, 1000 * 30); // Update every 30 seconds
      return () => clearInterval(timer);
    }
  }, [session.start_time]);
  
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-headline truncate text-primary">{session.stationName}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{session.customerName}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2.5">
         <div className="flex items-center text-sm text-foreground/90">
          <Gamepad2 className="h-4 w-4 mr-2 text-primary" />
          <span>{session.game_name || 'No Game Specified'}</span>
        </div>
        <div className="flex items-center text-sm text-foreground/90">
          <Play className="h-4 w-4 mr-2 text-primary" />
          <span>Billing: {session.session_type === 'per-hour' ? `${CURRENCY_SYMBOL}${session.rate}/hr` : `${CURRENCY_SYMBOL}${session.rate} (Fixed)`}</span>
        </div>
        <div className="flex items-center text-sm text-foreground/90">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          <span>Started: {elapsedTime} ago</span>
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Button onClick={() => onEndSession(session)} className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={isEnding}>
          {isEnding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          End Session & Bill
        </Button>
      </CardFooter>
    </Card>
  );
}
