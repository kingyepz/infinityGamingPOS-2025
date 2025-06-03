
"use client";

import React, { useState } from 'react';
import SupportTicketForm from './components/support-ticket-form';
import type { SupportTicket } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle2, Tag } from 'lucide-react';
import { format } from 'date-fns';

export default function SupportPage() {
  const [categorizedTickets, setCategorizedTickets] = useState<SupportTicket[]>([]);

  const handleTicketCategorized = (ticket: SupportTicket) => {
    setCategorizedTickets(prevTickets => [ticket, ...prevTickets].slice(0, 5)); // Keep last 5
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-headline font-semibold">Customer Support Ticket Categorizer</h2>
        <p className="text-muted-foreground">
          Use our AI-powered tool to automatically categorize customer support tickets.
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Submit a New Ticket Query</CardTitle>
          <CardDescription>Enter the customer's query below to get its category.</CardDescription>
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
              <Card key={ticket.id} className="shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        <Tag className="h-5 w-5 mr-2 text-primary" /> Category: {ticket.category || 'N/A'}
                      </CardTitle>
                      <CardDescription>
                        Query submitted at {format(ticket.createdAt, 'PPpp')}
                      </CardDescription>
                    </div>
                    <Badge variant={ticket.confidence && ticket.confidence > 0.7 ? "default" : "secondary"}>
                       Confidence: {ticket.confidence ? (ticket.confidence * 100).toFixed(0) + '%' : 'N/A'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Original Query:</p>
                  <blockquote className="border-l-4 border-muted pl-4 italic text-sm">
                    {ticket.query}
                  </blockquote>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
