
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) {
      setFormError(error.message);
      toast({
        title: "Google Sign-In Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

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
        const networkErrorMsg = "Network error: Could not connect to authentication service. Please check your internet connection and Supabase URL/keys.";
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
            console.error("--- LOGIN ROLE CHECK FAILED ---");
            console.error(`DATABASE QUERY FAILED for user ${authData.user.id}:`, userDbError.message);
            console.error(">>> FIX: This is ALMOST ALWAYS a Row Level Security (RLS) issue.");
            console.error(">>> Go to Supabase -> Database -> Policies -> 'users' table.");
            console.error(">>> Ensure you have a policy like: CREATE POLICY \"Allow authenticated users to read their own user record\" ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);");
            console.error("-----------------------------");
          } else {
            console.warn("--- LOGIN ROLE CHECK FAILED ---");
            console.warn(`DATABASE QUERY SUCCEEDED BUT RETURNED NO DATA for user ID: '${authData.user.id}'.`);
            console.warn(">>> FIX: The user exists in Supabase Auth, but NOT in your 'public.users' table.");
            console.warn(">>> Go to Supabase -> Table Editor -> 'users' table.");
            console.warn(`>>> Manually INSERT a row with the 'id' column matching the User ID above, and set the 'role' column (e.g., to 'admin').`);
            console.warn("-----------------------------");
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
          <CardTitle className="text-3xl font-headline text-foreground">Infinity Gaming Lounge</CardTitle>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.55 1.9-3.47 0-6.3-2.89-6.3-6.4s2.83-6.4 6.3-6.4c1.93 0 3.26.77 4.27 1.74l2.54-2.54C18.14 2.1 15.47 1 12.48 1 7.02 1 3 5.02 3 10.5s4.02 9.5 9.48 9.5c2.76 0 5.1-1 6.87-2.85 1.9-1.9 2.54-4.55 2.54-6.87 0-.6-.05-1.18-.15-1.72H12.48z" fill="currentColor"/>
            </svg>
            Sign in with Google
          </Button>

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
