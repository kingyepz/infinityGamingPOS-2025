
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
      if (signInError.message.includes("Email not confirmed")) {
        setFormError("Please confirm your email address before logging in. Check your inbox for a confirmation link.");
        toast({
          title: "Email Not Confirmed",
          description: "Please check your email to confirm your account.",
          variant: "destructive", 
        });
      } else {
        setFormError(signInError.message || "Invalid credentials. Please try again.");
        toast({
          title: "Login Failed",
          description: signInError.message || "Invalid credentials. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (authData.user) {
      try {
        // Query 'public.users' table for the role, linking on 'id'
        const { data: userData, error: userDbError } = await supabase
          .from('users') 
          .select('role')
          .eq('id', authData.user.id) 
          .single();

        if (userDbError || !userData) {
          setIsLoading(false);
          if (userDbError) {
            console.error("Error fetching user role from database:", userDbError);
          } else {
            // This branch is hit if no record is found, and userDbError is null
            console.warn(`User role query for ID '${authData.user.id}' in 'public.users' returned no data. 
            TROUBLESHOOTING:
            1. Verify a row exists in 'public.users' where the 'id' column matches '${authData.user.id}'.
            2. Ensure 'public.users' has a 'role' column with a valid role (e.g., 'admin', 'cashier', 'supervisor').
            3. Check Row Level Security (RLS) policies on 'public.users' to ensure the authenticated user has SELECT permission for their own record. See RLS policy examples in documentation or previous messages.
            Current user (auth.uid()): ${authData.user.id}`);
          }
          setFormError("User role not configured. Please contact an administrator.");
          toast({
            title: "Login Issue",
            description: "Your account is valid, but role information is missing. Please contact an administrator.",
            variant: "destructive"
          });
          return; 
        }

        let redirectPath = '/dashboard'; 
        switch (userData.role) {
          case 'admin':
            redirectPath = '/dashboard/admin';
            break;
          case 'cashier': 
            redirectPath = '/dashboard/cashier';
            break;
          case 'supervisor': 
             redirectPath = '/dashboard/cashier'; // Supervisors use cashier dashboard as per spec
             break;
          // case 'floor_staff': // Example, if 'floor_staff' has a general dashboard
          //   redirectPath = '/dashboard';
          //   break;
          default:
            // If role is something else or not explicitly handled, go to general dashboard
            // Or, you might want to show an error if the role is unexpected.
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
      // This case should ideally not be reached if signInError is null and authData.user is also null.
      // Added for completeness.
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
