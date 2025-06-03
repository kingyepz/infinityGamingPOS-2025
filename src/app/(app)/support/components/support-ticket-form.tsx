
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
import { categorizeSupportTicket, CategorizeSupportTicketOutput } from '@/ai/flows/categorize-support-ticket'; // Ensure this path is correct
import { Loader2, Wand2 } from 'lucide-react'; // Added Wand2 for AI magic

const ticketFormSchema = z.object({
  query: z.string().min(10, { message: "Query must be at least 10 characters." }).max(1000, { message: "Query must not exceed 1000 characters."}),
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
      const result: CategorizeSupportTicketOutput = await categorizeSupportTicket({ ticketText: data.query });
      const categorizedTicket: SupportTicket = {
        id: `ticket-${Date.now()}`,
        query: data.query,
        category: result.category,
        confidence: result.confidence,
        createdAt: new Date(),
        status: 'categorized', // Updated status
      };
      onTicketCategorized(categorizedTicket);
      toast({ 
        title: "AI Categorization Complete", 
        description: (
          <div>
            <p>Category: <strong>{result.category}</strong></p>
            <p>Confidence: <strong>{(result.confidence * 100).toFixed(0)}%</strong></p>
          </div>
        ),
        variant: "default", // Consider a "success" variant if you have one
      });
      form.reset();
    } catch (error) {
      console.error("Error categorizing ticket:", error);
      // Attempt to get a more specific error message if possible
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ 
        title: "Categorization Failed", 
        description: `Could not categorize ticket. ${errorMessage}`, 
        variant: "destructive" 
      });
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
              <FormLabel htmlFor="customerQuery">Customer's Full Query</FormLabel>
              <FormControl>
                <Textarea
                  id="customerQuery"
                  placeholder="Enter the full text of the customer's support query here... e.g., 'I cannot log into my account after the update.' or 'My M-Pesa payment for order #123 has not reflected.'"
                  className="min-h-[120px] resize-y bg-input/70 placeholder:text-muted-foreground/80"
                  {...field}
                  disabled={isLoading}
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
              AI is Thinking...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Categorize with AI
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
