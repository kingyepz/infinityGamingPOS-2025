
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
// No type import needed for Customer as it's not directly used here.

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
import { DialogFooter } from "@/components/ui/dialog"; // Removed DialogClose as it's not used.

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const customerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').min(10, { message: "Phone number must be at least 10 digits."}),
  email: z.string().email({ message: "Invalid email address." }),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  defaultValues?: Partial<CustomerFormData>;
  onCancel: () => void;
}

export default function CustomerForm({ onSubmit, defaultValues, onCancel }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues || {
      name: "",
      phone: "",
      email: "",
    },
  });

  // Reset form if defaultValues change (e.g., when switching between add/edit)
  React.useEffect(() => {
    form.reset(defaultValues || { name: "", phone: "", email: "" });
  }, [defaultValues, form]);


  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data);
    // form.reset(); // onSubmit in parent now handles closing and state reset
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 0712345678" {...field} />
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
                <Input type="email" placeholder="e.g. john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Customer</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
