
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

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const customerFormSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone_number: z.string().regex(phoneRegex, 'Invalid phone number').min(10, { message: "Phone number must be at least 10 digits."}),
  email: z.string().email({ message: "Invalid email address." }),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  defaultValues?: Partial<CustomerFormData>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CustomerForm({ onSubmit, defaultValues, onCancel, isSubmitting }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      full_name: "",
      phone_number: "",
      email: "",
      ...defaultValues
    },
  });

  React.useEffect(() => {
    form.reset(defaultValues || { full_name: "", phone_number: "", email: "" });
  }, [defaultValues, form]);


  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 0712345678" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. john.doe@example.com" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Customer
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
