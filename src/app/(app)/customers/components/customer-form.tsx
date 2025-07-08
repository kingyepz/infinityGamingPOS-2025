
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parse } from "date-fns";
import { cn } from "@/lib/utils";


const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const customerFormSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone_number: z.string().regex(phoneRegex, 'Invalid phone number').min(10, { message: "Phone number must be at least 10 digits."}),
  email: z.string().email({ message: "Invalid email address." }),
  dob: z.date().optional(),
  loyalty_points: z.coerce.number().int().min(0, "Points cannot be negative.").optional(),
  loyalty_tier: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum']).optional(),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  onSubmit: (data: CustomerFormData) => void;
  defaultValues?: Partial<CustomerFormData>;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode: boolean;
}

export default function CustomerForm({ onSubmit, defaultValues, onCancel, isSubmitting, isEditMode }: CustomerFormProps) {
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
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => {
            const [inputValue, setInputValue] = React.useState<string>(
              field.value ? format(field.value, 'yyyy-MM-dd') : ''
            );
            const [popoverOpen, setPopoverOpen] = React.useState(false);

            React.useEffect(() => {
              if (field.value) {
                setInputValue(format(field.value, 'yyyy-MM-dd'));
              } else {
                setInputValue('');
              }
            }, [field.value]);
            
            const handleBlur = () => {
              const parsedDate = parse(inputValue, 'yyyy-MM-dd', new Date());
              if (isValid(parsedDate) && !(parsedDate > new Date() || parsedDate < new Date("1950-01-01"))) {
                  field.onChange(parsedDate);
              } else {
                  field.onChange(undefined);
              }
            };

            return (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth</FormLabel>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <div className="relative">
                    <FormControl>
                      <Input
                        placeholder="yyyy-mm-dd"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleBlur}
                        disabled={isSubmitting}
                        className="pr-10"
                      />
                    </FormControl>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'ghost'}
                        size="icon"
                        className={cn(
                          'absolute right-0 top-0 h-full w-10 rounded-l-none font-normal',
                          isSubmitting && 'opacity-50'
                        )}
                        disabled={isSubmitting}
                        aria-label="Open calendar"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </div>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setPopoverOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1950-01-01')
                      }
                      initialFocus
                      defaultMonth={field.value}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        {isEditMode && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Loyalty Program (Read-Only)</h3>
              <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="loyalty_points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyalty Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={true} onChange={event => field.onChange(+event.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="loyalty_tier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loyalty Tier</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={true}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a tier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Bronze">Bronze</SelectItem>
                          <SelectItem value="Silver">Silver</SelectItem>
                          <SelectItem value="Gold">Gold</SelectItem>
                          <SelectItem value="Platinum">Platinum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Separator />
          </>
        )}

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
