
"use client";

import React, { useState } from 'react';
import SupportTicketForm from './components/support-ticket-form';
import type { SupportTicket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Lightbulb, CheckCircle2, Bot } from 'lucide-react';
import { format } from 'date-fns';

export default function SupportPage() {
  const [categorizedTickets, setCategorizedTickets] = useState<SupportTicket[]>([]);

  const handleTicketCategorized = (ticket: SupportTicket) => {
    setCategorizedTickets(prevTickets => [ticket, ...prevTickets].slice(0, 5)); // Keep last 5
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center space-x-3 mb-2">
            <Bot className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-headline font-semibold">AI Support Ticket Categorizer</h2>
        </div>
        <p className="text-muted-foreground">
          Leverage AI to automatically categorize customer support tickets for faster routing and resolution.
        </p>
      </div>

      <Card className="shadow-lg bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Submit New Customer Query</CardTitle>
          <CardDescription>Enter the customer's full query below. The AI will analyze it and suggest a category.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupportTicketForm onTicketCategorized={handleTicketCategorized} />
        </CardContent>
      </Card>

      {categorizedTickets.length > 0 && (
        <div>
          <h3 className="text-xl font-headline font-semibold mb-4">Recent Categorizations</h3>
          <div className="space-y-4">
            {categorizedTickets.map(ticket => (
              <Card key={ticket.id} className="shadow-md bg-card/70">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-primary" /> Category: <span className="ml-1 font-bold text-primary">{ticket.category || 'N/A'}</span>
                      </CardTitle>
                      <CardDescription>
                        Query submitted on {format(new Date(ticket.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
                      </CardDescription>
                    </div>
                    <Badge 
                        variant={ticket.confidence && ticket.confidence > 0.7 ? "default" : (ticket.confidence && ticket.confidence > 0.4 ? "secondary" : "outline")}
                        className={ticket.confidence && ticket.confidence > 0.7 ? "bg-green-500/80 text-white" : (ticket.confidence && ticket.confidence > 0.4 ? "bg-yellow-500/80 text-black" : "border-red-500/80 text-red-400")}
                    >
                       Confidence: {ticket.confidence ? (ticket.confidence * 100).toFixed(0) + '%' : 'N/A'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Original Query:</p>
                  <blockquote className="border-l-4 border-primary/50 pl-4 italic text-sm bg-muted/20 p-3 rounded-r-md">
                    {ticket.query}
                  </blockquote>
                  {ticket.status === 'categorized' && (
                    <div className="mt-3 flex items-center text-xs text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Successfully categorized.
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
       {categorizedTickets.length === 0 && (
         <Card className="shadow-md bg-card/70 border-2 border-dashed border-border">
            <CardContent className="pt-6">
                <div className="text-center py-6 text-muted-foreground">
                    <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-70" />
                    <p className="font-semibold">No queries categorized yet.</p>
                    <p className="text-sm">Submit a query above to see the AI in action!</p>
                </div>
            </CardContent>
         </Card>
       )}
    </div>
  );
}
