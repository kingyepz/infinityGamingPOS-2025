
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
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
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const stationFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  console_type: z.string().min(3, { message: "Please select a console type." }),
});

export type StationFormData = z.infer<typeof stationFormSchema>;

interface StationFormProps {
  onSubmit: (data: StationFormData) => void;
  defaultValues?: Partial<StationFormData>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const consoleTypes = [
    "PlayStation 5",
    "PlayStation 4",
    "Xbox Series X",
    "Xbox One",
    "Nintendo Switch",
    "Gaming PC",
    "VR Headset"
];

export default function StationForm({ onSubmit, defaultValues, onCancel, isSubmitting }: StationFormProps) {
  const form = useForm<StationFormData>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      name: "",
      console_type: "",
      ...defaultValues
    },
  });

  React.useEffect(() => {
    form.reset(defaultValues || { name: "", console_type: "" });
  }, [defaultValues, form]);


  const handleSubmit = (data: StationFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Station Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. PS5 - TV 1" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="console_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Console Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a console type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {consoleTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Station
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
