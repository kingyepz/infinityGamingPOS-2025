
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Gamepad2, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const supabase = createClient();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`, // URL to your reset password page
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error Sending Reset Link",
        description: error.message || "Could not send password reset email. Please try again.",
        variant: "destructive",
      });
    } else {
      setIsSubmitted(true);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a reset link has been sent.",
        variant: "default" // Or a "success" variant
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-2xl font-headline text-primary-foreground">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-6 py-4">
              <MailCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-primary-foreground">
                Password Reset Email Sent!
              </p>
              <p className="text-muted-foreground text-sm">
                Please check your inbox (and spam folder) for the email address you provided. Click the link in the email to create a new password.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </div>
          ) : (
            <>
            <CardDescription className="text-center pb-6 text-muted-foreground">
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80">Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
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
                      Sending Link...
                    </>
                  ) : (
                    "Send Password Reset Email"
                  )}
                </Button>
              </form>
            </Form>
            </>
          )}
        </CardContent>
        {!isSubmitted && (
          <CardFooter className="flex justify-center pt-4">
            <Button variant="link" onClick={() => router.push('/login')} className="text-sm text-primary hover:underline hover:text-accent transition-colors">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
