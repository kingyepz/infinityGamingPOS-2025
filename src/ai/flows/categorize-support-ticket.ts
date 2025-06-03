// use server'

/**
 * @fileOverview This file defines a Genkit flow for categorizing customer support tickets.
 *
 * - categorizeSupportTicket - A function that categorizes a support ticket.
 * - CategorizeSupportTicketInput - The input type for the categorizeSupportTicket function.
 * - CategorizeSupportTicketOutput - The output type for the categorizeSupportTicket function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeSupportTicketInputSchema = z.object({
  ticketText: z.string().describe('The text content of the customer support ticket.'),
});
export type CategorizeSupportTicketInput = z.infer<typeof CategorizeSupportTicketInputSchema>;

const CategorizeSupportTicketOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The category of the support ticket.  Examples: "Billing", "Technical Support", "Account Management", "Gameplay Support", "Refund Request", "Suggestion", "Complaint", "MPesa Payment Issue", "Other".'
    ),
  confidence: z
    .number()
    .describe('A number between 0 and 1 indicating the confidence in the categorization.'),
});
export type CategorizeSupportTicketOutput = z.infer<typeof CategorizeSupportTicketOutputSchema>;

export async function categorizeSupportTicket(input: CategorizeSupportTicketInput): Promise<CategorizeSupportTicketOutput> {
  return categorizeSupportTicketFlow(input);
}

const categorizeSupportTicketPrompt = ai.definePrompt({
  name: 'categorizeSupportTicketPrompt',
  input: {schema: CategorizeSupportTicketInputSchema},
  output: {schema: CategorizeSupportTicketOutputSchema},
  prompt: `You are an expert support ticket categorizer.  You will be provided with the text of a customer support ticket, and you will categorize it into one of the following categories:

"Billing", "Technical Support", "Account Management", "Gameplay Support", "Refund Request", "Suggestion", "Complaint", "MPesa Payment Issue", "Other".

You must also provide a confidence score between 0 and 1 indicating your confidence in the categorization.

Here is the text of the support ticket:

{{ticketText}}`,
});

const categorizeSupportTicketFlow = ai.defineFlow(
  {
    name: 'categorizeSupportTicketFlow',
    inputSchema: CategorizeSupportTicketInputSchema,
    outputSchema: CategorizeSupportTicketOutputSchema,
  },
  async input => {
    const {output} = await categorizeSupportTicketPrompt(input);
    return output!;
  }
);
