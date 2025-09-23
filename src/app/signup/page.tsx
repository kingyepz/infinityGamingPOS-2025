
"use client";

import React, { useState, useEffect } from 'react';
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

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check if the page is running inside an iframe
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsInIframe(true);
    }
  }, []);

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

  const onSubmit = async (formData: SignUpFormValues) => {
    setIsLoading(true);
    setFormError(null);
    
    // This flow creates a user in Supabase Auth but does NOT assign a role.
    // Role assignment must be done by an Admin through a secure interface/function.
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        // emailRedirectTo: `${window.location.origin}/welcome`, // Optional welcome page
      }
    });

    setIsLoading(false);

    if (signUpError) {
      setFormError(signUpError.message || "Could not sign up. Please try again.");
      toast({
        title: "Sign Up Failed",
        description: signUpError.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      return;
    }
    
    // The user has been created in auth.users, but they have no entry in public.users yet.
    // They must verify their email and then be assigned a role by an admin.
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
       setFormError("This email is already in use. Please try logging in or use a different email.");
       toast({
        title: "Sign Up Failed",
        description: "This email is already in use. Please try logging in.",
        variant: "destructive"
       });
       return;
    }

    setIsSubmitted(true);
    toast({
      title: "Sign Up Initiated!",
      description: "Please check your email to confirm your account. An administrator must assign you a role before you can fully access the system.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline text-foreground">Create Account</CardTitle>
          <CardDescription className="text-muted-foreground">Join Infinity Gaming Lounge</CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-6 py-4">
              <MailCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">
                Verification Email Sent!
              </p>
              <p className="text-muted-foreground text-sm">
                Please check your inbox (and spam folder) for the email address you provided. Click the link in the email to confirm your account. After confirmation, an administrator will need to assign you a role to grant system access.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </div>
          ) : (
            <>
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
                    "Sign Up with Email"
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
                  Or sign up with
                </span>
              </div>
            </div>

            {isInIframe ? (
              <div className="text-center p-2 border border-dashed rounded-md">
                <p className="text-sm text-muted-foreground">
                  Google Sign-In cannot be used in this embedded view.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Please open the app in a new browser tab to test this feature.
                </p>
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-4.55 1.9-3.47 0-6.3-2.89-6.3-6.4s2.83-6.4 6.3-6.4c1.93 0 3.26.77 4.27 1.74l2.54-2.54C18.14 2.1 15.47 1 12.48 1 7.02 1 3 5.02 3 10.5s4.02 9.5 9.48 9.5c2.76 0 5.1-1 6.87-2.85 1.9-1.9 2.54-4.55 2.54-6.87 0-.6-.05-1.18-.15-1.72H12.48z" fill="currentColor"/>
                </svg>
                Sign up with Google
              </Button>
            )}
            </>
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
