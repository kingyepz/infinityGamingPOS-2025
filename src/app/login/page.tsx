
"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Gamepad2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from '@/lib/supabase/client';

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (formData: LoginFormValues) => {
    setIsLoading(true);
    setFormError(null);
    
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (signInError) {
      setIsLoading(false);
      // Specific check for network errors
      if (signInError.message.toLowerCase().includes("failed to fetch")) {
        const networkErrorMsg = "Network error: Could not connect to authentication service. Please check your internet connection and try again.";
        setFormError(networkErrorMsg);
        toast({
          title: "Connection Error",
          description: networkErrorMsg,
          variant: "destructive",
        });
      } else if (signInError.message.includes("Email not confirmed")) {
        setFormError("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
        toast({
          title: "Email Not Confirmed",
          description: "Please check your email to confirm your account.",
          variant: "destructive", 
        });
      } else {
        // Handle other auth errors like "Invalid login credentials"
        setFormError(signInError.message || "An unexpected error occurred. Please try again.");
        toast({
          title: "Login Failed",
          description: signInError.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (authData.user) {
      try {
        const { data: userData, error: userDbError } = await supabase
          .from('users') 
          .select('role')
          .eq('id', authData.user.id) 
          .single();

        if (userDbError || !userData) {
          setIsLoading(false);
          const specificError = "Your account is awaiting role assignment. Please contact an administrator.";
          
          if (userDbError) {
            console.error(`DATABASE QUERY FAILED: Could not fetch role for user ${authData.user.id}.`, userDbError);
            console.error("DEBUGGING HELP: This is likely due to a Row Level Security (RLS) policy on the 'public.users' table blocking the SELECT query. Ensure you have a policy that allows authenticated users to read their own record (e.g., USING (auth.uid() = id)).");
          } else {
            console.warn(`DATABASE QUERY SUCCEEDED BUT RETURNED NO DATA: No role found for user with ID '${authData.user.id}' in the 'public.users' table.`);
            console.warn(`DEBUGGING HELP: Go to your Supabase Table Editor for the 'public.users' table and ensure a row exists with the 'id' column matching the User ID above. This row must also have a value in the 'role' column (e.g., 'admin').`);
          }

          setFormError(specificError);
          toast({
            title: "Role Assignment Pending",
            description: "Your account is valid, but role information is missing. Please contact an administrator.",
            variant: "destructive"
          });
          // Sign out the user to prevent them from being in a broken state
          await supabase.auth.signOut();
          return; 
        }

        let redirectPath = '/dashboard'; 
        switch (userData.role) {
          case 'admin':
            redirectPath = '/dashboard/admin';
            break;
          case 'cashier': 
          case 'supervisor':
             redirectPath = '/dashboard/cashier';
             break;
          default:
            console.warn(`User role '${userData.role}' does not have a specific dashboard redirection rule. Defaulting to /dashboard.`);
            redirectPath = '/dashboard'; 
            break;
        }
        
        toast({
          title: "Login Successful",
          description: `Welcome! Redirecting to your dashboard. Role: ${userData.role}`,
        });
        const nextUrl = searchParams.get('next') || redirectPath;
        router.push(nextUrl);
        router.refresh(); 

      } catch (e) {
        setIsLoading(false);
        const unknownError = e instanceof Error ? e.message : "An unknown error occurred during role processing.";
        console.error("Error processing role:", unknownError);
        setFormError("Could not determine user role. Please contact support.");
        toast({
          title: "Role Check Failed",
          description: `Could not determine user role. ${unknownError}`,
          variant: "destructive",
        });
      }
    } else {
      setIsLoading(false);
      setFormError("Login failed. User data not found after successful authentication.");
      toast({
        title: "Login Failed",
        description: "User data not found after successful authentication. This is unexpected.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-primary-foreground">Infinity Gaming Lounge</CardTitle>
          <CardDescription className="text-muted-foreground">Secure Login to POS System</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form method="POST" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        placeholder="e.g., staff@infinitygaming.co.ke" 
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
                        placeholder="Enter your password" 
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
                    Logging In...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pt-4">
           <Link href="/forgot-password" passHref legacyBehavior>
            <a className="text-sm text-primary hover:underline hover:text-accent transition-colors">
              Forgot Password?
            </a>
          </Link>
          <Link href="/signup" passHref legacyBehavior>
            <a className="text-sm text-primary hover:underline hover:text-accent transition-colors">
              Don&apos;t have an account? Sign Up
            </a>
          </Link>
           <p className="text-xs text-muted-foreground mt-4">
            © {new Date().getFullYear()} Infinity Gaming Lounge. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
