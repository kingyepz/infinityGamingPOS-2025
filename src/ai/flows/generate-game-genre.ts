'use server';
/**
 * @fileOverview An AI flow for generating a video game genre.
 *
 * - generateGameGenre - A function that suggests a genre for a video game.
 * - GenerateGameGenreInput - The input type for the generateGameGenre function.
 * - GenerateGameGenreOutput - The return type for the generateGameGenre function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGameGenreInputSchema = z.object({
  name: z.string().describe('The name of the video game.'),
  description: z.string().optional().describe('An optional description of the video game.'),
});
export type GenerateGameGenreInput = z.infer<typeof GenerateGameGenreInputSchema>;

const GenerateGameGenreOutputSchema = z.object({
  genre: z.string().describe('The suggested genre for the video game. Examples: "Sports", "First-Person Shooter", "RPG", "Action-Adventure", "Platformer".'),
});
export type GenerateGameGenreOutput = z.infer<typeof GenerateGameGenreOutputSchema>;

export async function generateGameGenre(input: GenerateGameGenreInput): Promise<GenerateGameGenreOutput> {
  return generateGameGenreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGameGenrePrompt',
  input: {schema: GenerateGameGenreInputSchema},
  output: {schema: GenerateGameGenreOutputSchema},
  prompt: `You are a video game expert. Based on the game's name and optional description, provide a single, concise genre for it.

Game Name: {{{name}}}
{{#if description}}
Description: {{{description}}}
{{/if}}

Provide only the most common and accurate genre.`,
});

const generateGameGenreFlow = ai.defineFlow(
  {
    name: 'generateGameGenreFlow',
    inputSchema: GenerateGameGenreInputSchema,
    outputSchema: GenerateGameGenreOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
