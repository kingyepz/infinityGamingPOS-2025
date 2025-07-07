
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
import { CalendarIcon, Loader2, Wand2 } from "lucide-react";
import { generateGameGenre } from "@/ai/flows/generate-game-genre";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const gameFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  genre: z.string().min(2, { message: "Genre must be at least 2 characters." }),
  description: z.string().optional(),
  cover_image_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  release_date: z.date().optional(),
  developer: z.string().optional(),
  publisher: z.string().optional(),
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
      description: "",
      cover_image_url: "",
      developer: "",
      publisher: "",
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
    const description = form.getValues("description");

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
      const result = await generateGameGenre({ name: gameName, description });
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
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Game Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Elden Ring" {...field} disabled={isBusy} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the game..." {...field} disabled={isBusy} className="min-h-[80px]" />
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
                  <Input placeholder="e.g. Action RPG" {...field} disabled={isBusy} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleGenerateGenre} disabled={isBusy} aria-label="Generate genre with AI">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Separator />
        
        <div className="space-y-2">
           <h3 className="text-sm font-medium text-muted-foreground">Optional Details</h3>
           <div className="space-y-4">
              <FormField
                control={form.control}
                name="cover_image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/image.png" {...field} disabled={isBusy} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="developer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Developer</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. FromSoftware" {...field} disabled={isBusy} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publisher</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Bandai Namco" {...field} disabled={isBusy} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
              <FormField
                control={form.control}
                name="release_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col pt-1">
                    <FormLabel>Release Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isBusy}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1980-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
           </div>
        </div>

        <DialogFooter className="pt-4">
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
