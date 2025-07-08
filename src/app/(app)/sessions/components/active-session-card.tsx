
"use client";

import type { Session } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Clock, Loader2, Gamepad2, Play, Timer, MoreHorizontal, ShieldX } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import React, { useState, useEffect, useRef } from 'react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ActiveSessionCardProps {
  session: Session;
  onEndSession: (session: Session) => void;
  onCancelSession: (session: Session) => void;
  isEnding?: boolean; // To show loading state
  userRole: string | null;
}

const formatTime = (ms: number): string => {
  if (ms < 0) ms = 0;
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function ActiveSessionCard({ session, onEndSession, onCancelSession, isEnding, userRole }: ActiveSessionCardProps) {
  const { toast } = useToast();
  const [timeDisplay, setTimeDisplay] = useState('');
  const [progress, setProgress] = useState(100);
  const [timerState, setTimerState] = useState<'normal' | 'warning' | 'expired'>('normal');

  const warningSentRef = useRef(false);
  const expiredSentRef = useRef(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (session.session_type === 'per-hour') {
      const startTime = new Date(session.start_time).getTime();
      const sessionDuration = 60 * 60 * 1000; // 60 minutes
      const expectedEndTime = startTime + sessionDuration;

      const updateTimer = () => {
        const now = Date.now();
        const timeLeft = expectedEndTime - now;

        setTimeDisplay(formatTime(timeLeft));
        setProgress((timeLeft / sessionDuration) * 100);

        if (timeLeft <= 0) {
          setTimerState('expired');
          if (!expiredSentRef.current) {
            toast({
                title: "⏰ Time's Up!",
                description: `The hourly session for ${session.stationName} has ended.`,
                variant: 'destructive',
                duration: 10000,
            });
            expiredSentRef.current = true;
          }
        } else if (timeLeft <= 5 * 60 * 1000) {
          setTimerState('warning');
          if (!warningSentRef.current) {
            toast({
                title: "⏳ 5 Minute Warning",
                description: `Session on ${session.stationName} is ending soon.`,
                duration: 10000,
            });
            warningSentRef.current = true;
          }
        } else {
          setTimerState('normal');
        }
      };
      
      updateTimer(); // Initial call
      timer = setInterval(updateTimer, 1000);

    } else { // 'per-game' session type
      setTimeDisplay(formatDistanceToNowStrict(new Date(session.start_time), { addSuffix: false }));
      timer = setInterval(() => {
        setTimeDisplay(formatDistanceToNowStrict(new Date(session.start_time), { addSuffix: false }));
      }, 1000 * 30);
    }
    
    // Reset refs on session change
    warningSentRef.current = false;
    expiredSentRef.current = false;

    return () => clearInterval(timer);
  }, [session.id, session.start_time, session.session_type, session.stationName, toast]);

  const hasTwoPlayers = !!session.secondaryCustomerName;
  const isHourly = session.session_type === 'per-hour';

  const cardBorderColor = {
      normal: 'border-transparent',
      warning: 'border-yellow-500',
      expired: 'border-destructive'
  }[timerState];

  return (
    <Card className={cn(
        "flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur-sm border-2",
        isHourly ? cardBorderColor : 'border-transparent'
    )}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg font-headline truncate text-primary">{session.stationName}</CardTitle>
                <CardDescription className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="truncate">{session.customerName}{hasTwoPlayers ? ` & ${session.secondaryCustomerName}` : ''}</span>
                </CardDescription>
            </div>
             {userRole === 'admin' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onCancelSession(session)} className="text-destructive focus:text-destructive cursor-pointer">
                            <ShieldX className="mr-2 h-4 w-4" />
                            <span>Force End Session</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
         <div className="flex items-center text-sm text-foreground/90">
          <Gamepad2 className="h-4 w-4 mr-2 text-primary" />
          <span>{session.game_name || 'No Game Specified'}</span>
        </div>
        <div className="flex items-center text-sm text-foreground/90">
          <Play className="h-4 w-4 mr-2 text-primary" />
          <span>Billing: {session.session_type === 'per-hour' ? `${CURRENCY_SYMBOL}${session.rate}/hr` : `${CURRENCY_SYMBOL}${session.rate} (Fixed)`}</span>
        </div>
        <div className="flex items-center text-sm text-foreground/90 font-medium">
          {isHourly ? <Timer className="h-4 w-4 mr-2 text-primary" /> : <Clock className="h-4 w-4 mr-2 text-primary" />}
          <span>
            {isHourly ? `Time Remaining: ${timeDisplay}` : `Time Elapsed: ${timeDisplay}`}
          </span>
        </div>
        {isHourly && (
            <div className="pt-1">
                <Progress value={progress} className="h-2" indicatorClassName={cn(
                    timerState === 'warning' && 'bg-yellow-500',
                    timerState === 'expired' && 'bg-destructive'
                )} />
            </div>
        )}
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
