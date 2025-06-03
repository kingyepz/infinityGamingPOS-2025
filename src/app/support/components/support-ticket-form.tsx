
"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { SupportTicket } from '@/types';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { categorizeSupportTicket } from '@/ai/flows/categorize-support-ticket'; // Ensure this path is correct
import { Loader2 } from 'lucide-react';

const ticketFormSchema = z.object({
  query: z.string().min(10, { message: "Query must be at least 10 characters." }).max(500, { message: "Query must not exceed 500 characters."}),
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface SupportTicketFormProps {
  onTicketCategorized: (ticket: SupportTicket) => void;
}

export default function SupportTicketForm({ onTicketCategorized }: SupportTicketFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      query: "",
    },
  });

  const handleSubmit = async (data: TicketFormData) => {
    setIsLoading(true);
    try {
      const result = await categorizeSupportTicket({ ticketText: data.query });
      const categorizedTicket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        query: data.query,
        category: result.category,
        confidence: result.confidence,
        createdAt: new Date(),
        status: 'categorized',
      };
      onTicketCategorized(categorizedTicket);
      toast({ title: "Ticket Categorized", description: `Category: ${result.category} (Confidence: ${(result.confidence * 100).toFixed(0)}%)` });
      form.reset();
    } catch (error) {
      console.error("Error categorizing ticket:", error);
      toast({ title: "Categorization Error", description: "Failed to categorize ticket. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer Query</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the full text of the customer's support query here..."
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Categorizing...
            </>
          ) : (
            "Categorize Ticket"
          )}
        </Button>
      </form>
    </Form>
  );
}
