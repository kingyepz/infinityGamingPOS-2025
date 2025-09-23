
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Gamepad2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createClient } from '@/lib/supabase/client';

const updatePasswordSchema = z.object({
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

function UpdatePasswordPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Check for session and access token on mount (from Supabase redirect)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Supabase client handles the session automatically from the URL hash.
        // If session is present, user can update password.
        // No explicit call to supabase.auth.verifyOtp needed here for password recovery flow.
        if (!session) {
           setError("Invalid or expired password reset link. Please try again.");
           toast({ title: "Error", description: "Invalid or expired password reset link.", variant: "destructive"});
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, toast, router]);


  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formData: UpdatePasswordFormValues) => {
    setIsLoading(true);
    setError(null);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: formData.password,
    });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message || "Could not update password. Please try again.");
      toast({
        title: "Password Update Failed",
        description: updateError.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } else {
      setIsSuccessful(true);
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been changed. You can now log in with your new password.",
      });
      // Optionally sign out the user if they were "logged in" by the recovery link
      // await supabase.auth.signOut(); 
      // router.push('/login'); // Redirect after a short delay or on button click
    }
  };
  
  if (isSuccessful) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-headline text-foreground">Password Updated!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Your password has been successfully updated. You can now log in using your new password.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/login')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-2xl font-headline text-foreground">Set New Password</CardTitle>
          <CardDescription className="text-muted-foreground">Enter and confirm your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  {error}
                </div>
              )}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your new password" 
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
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Confirm New Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Confirm your new password" 
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
                    Updating Password...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
         <CardFooter className="flex justify-center pt-4">
            <Button variant="link" onClick={() => router.push('/login')} className="text-sm text-primary hover:underline hover:text-accent transition-colors">
                Back to Login
            </Button>
          </CardFooter>
      </Card>
    </div>
  );
}

export const dynamic = 'force-dynamic';

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <UpdatePasswordPageComponent />
    </Suspense>
  )
}
