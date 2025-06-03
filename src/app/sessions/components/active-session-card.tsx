
"use client";

import type { GameSession } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Gamepad, Clock, Play } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';

interface ActiveSessionCardProps {
  session: GameSession;
  onEndSession: (session: GameSession) => void;
}

export default function ActiveSessionCard({ session, onEndSession }: ActiveSessionCardProps) {
  const [elapsedTime, setElapsedTime] = React.useState(formatDistanceToNowStrict(session.startTime, { addSuffix: false }));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(formatDistanceToNowStrict(session.startTime, { addSuffix: false }));
    }, 1000 * 30); // Update every 30 seconds
    return () => clearInterval(timer);
  }, [session.startTime]);
  
  return (
    <Card className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="text-lg font-headline truncate">{session.gameName}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{session.consoleName}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className="flex items-center text-sm">
          <User className="h-4 w-4 mr-2 text-primary" />
          <span>{session.customerName}</span>
        </div>
        <div className="flex items-center text-sm">
          <Play className="h-4 w-4 mr-2 text-primary" />
          <span>Billing: {session.billingType === 'per-hour' ? `${session.rate}/hr` : `Fixed ${session.rate}`}</span>
        </div>
        <div className="flex items-center text-sm">
          <Clock className="h-4 w-4 mr-2 text-primary" />
          <span>Started: {format(session.startTime, 'p')} ({elapsedTime})</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onEndSession(session)} className="w-full bg-destructive hover:bg-destructive/90">
          End Session & Bill
        </Button>
      </CardFooter>
    </Card>
  );
}
