
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
import { Gamepad2, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

// TODO: Import your Supabase client

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    // Placeholder for Supabase password reset logic
    try {
      // const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      //   redirectTo: `${window.location.origin}/reset-password`, // URL to your reset password page
      // });

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockError = null; // Simulate error

      if (mockError) {
      // if (error) {
        // toast({
        //   title: "Error Sending Reset Link",
        //   description: error.message || "Could not send password reset email. Please try again.",
        //   variant: "destructive",
        // });
         toast({
          title: "Error Sending Reset Link",
          description: "Mock: Could not send password reset email.",
          variant: "destructive",
        });
      } else {
        setIsSubmitted(true);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast({
        title: "An Unexpected Error Occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="items-center text-center">
          <Gamepad2 className="h-12 w-12 text-primary mb-3" />
          <CardTitle className="text-2xl font-headline">Reset Your Password</CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "Check your email for the password reset link." 
              : "Enter your email address and we'll send you a link to reset your password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p className="text-foreground">
                If an account exists for the email you entered, you will receive a password reset link shortly.
              </p>
              <Button onClick={() => router.push('/login')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="your.email@example.com" 
                          {...field} 
                          className="bg-input text-foreground placeholder:text-muted-foreground"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
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
          )}
        </CardContent>
        {!isSubmitted && (
          <CardFooter className="flex justify-center">
            <Link href="/login" passHref legacyBehavior>
              <a className="text-sm text-primary hover:underline inline-flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
              </a>
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
