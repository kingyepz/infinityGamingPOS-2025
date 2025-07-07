
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Wand2 } from "lucide-react";
import { generateGameGenre } from "@/ai/flows/generate-game-genre";
import { useToast } from "@/hooks/use-toast";

const gameFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  genre: z.string().min(2, { message: "Genre must be at least 2 characters." }),
});

export type GameFormData = z.infer<typeof gameFormSchema>;

interface GameFormProps {
  onSubmit: (data: GameFormData) => void;
  defaultValues?: Partial<GameFormData>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function GameForm({ onSubmit, defaultValues, onCancel, isSubmitting }: GameFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      name: "",
      genre: "",
      ...defaultValues
    },
  });

  React.useEffect(() => {
    form.reset(defaultValues || { name: "", genre: "" });
  }, [defaultValues, form]);


  const handleSubmit = (data: GameFormData) => {
    onSubmit(data);
  };
  
  const handleGenerateGenre = async () => {
    const gameName = form.getValues("name");
    if (!gameName) {
      toast({
        title: "Game Name Required",
        description: "Please enter a game name before generating a genre.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateGameGenre({ name: gameName });
      if (result.genre) {
        form.setValue("genre", result.genre, { shouldValidate: true });
        toast({
          title: "Genre Generated!",
          description: `Suggested genre: ${result.genre}`,
        });
      }
    } catch (error) {
      console.error("Failed to generate genre:", error);
      toast({
        title: "AI Failed",
        description: "Could not generate a genre. Please enter one manually.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const isBusy = isSubmitting || isGenerating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. FIFA 24" {...field} disabled={isBusy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Genre</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input placeholder="e.g. Sports" {...field} disabled={isBusy} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateGenre} disabled={isBusy} aria-label="Generate genre with AI">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>Cancel</Button>
          <Button type="submit" disabled={isBusy}>
             {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Game
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
