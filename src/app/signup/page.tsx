
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Gamepad2, Loader2, AlertCircle, MailCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from '@/lib/supabase/client';

const signUpFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const supabase = createClient();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData: SignUpFormValues) => { // Renamed data to formData
    setIsLoading(true);
    setFormError(null);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // emailRedirectTo: `${window.location.origin}/welcome`, // Optional: redirect after email confirmation
      }
    });

    if (signUpError) {
      setIsLoading(false);
      setFormError(signUpError.message || "Could not sign up. Please try again.");
      toast({
        title: "Sign Up Failed",
        description: signUpError.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return;
    }

    if (signUpData.user) {
      // User created in auth.users, now add to staff table with a default role
      const userId = signUpData.user.id;
      const defaultRole = 'floor_staff'; // More secure default role

      // Attempt to get full_name from email (basic split)
      const emailParts = formData.email.split('@');
      const fullNameGuess = emailParts[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());


      const { error: staffInsertError } = await supabase
        .from('staff') // Using 'staff' table as per our existing setup
        .insert([
          { user_id: userId, role: defaultRole, full_name: fullNameGuess } // Assigning 'floor_staff'
        ]);

      if (staffInsertError) {
        // Log this error, but don't block the user from seeing the "confirm email" message
        // as their auth account is already created.
        console.error('Error inserting default role into staff table:', staffInsertError);
        toast({
          title: "Account Created (Role Issue)",
          description: "Your account was created, but there was an issue setting the default role. Please contact support if problems persist after email verification.",
          variant: "destructive", // Or "warning"
        });
      } else {
        console.log(`Default role '${defaultRole}' assigned successfully to user ${userId}`);
      }
    } else if (!signUpData.session && !signUpData.user) {
      // This case means email confirmation is required.
      // If user is null and session is null, sign up initiated, email sent.
      // This is the expected flow for Supabase Auth with email confirmation.
    }


    setIsLoading(false);
    setIsSubmitted(true); // Show "check email" message
    toast({
      title: "Sign Up Successful!",
      description: "Please check your email to confirm your account.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary-foreground">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">Join Infinity Gaming Lounge</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-6 py-4">
              <MailCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-primary-foreground">
                Verification Email Sent!
              </p>
              <p className="text-muted-foreground text-sm">
                Please check your inbox (and spam folder) for the email address you provided. Click the link in the email to confirm your account.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {formError && (
                  <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {formError}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="e.g., player@example.com" 
                          {...field} 
                          className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 border-border/50"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Create a strong password" 
                          {...field} 
                          className="bg-input/70 text-foreground placeholder:text-muted-foreground/70 border-border/50"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pt-4">
          {!isSubmitted && (
            <Link href="/login" passHref legacyBehavior>
              <a className="text-sm text-primary hover:underline hover:text-accent transition-colors">
                Already have an account? Login
              </a>
            </Link>
          )}
           <p className="text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} Infinity Gaming Lounge. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

    