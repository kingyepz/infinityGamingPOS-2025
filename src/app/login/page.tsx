
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Gamepad2, Loader2 } from "lucide-react"; // Using Gamepad2 as a placeholder logo
import { useToast } from "@/hooks/use-toast";

// TODO: Import your Supabase client (e.g., import { supabase } from '@/lib/supabase';)

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    // Placeholder for Supabase authentication
    try {
      // const { data: authData, error } = await supabase.auth.signInWithPassword({
      //   email: data.email,
      //   password: data.password,
      // });

      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockAuthSuccess = true; // Simulate success/failure
      const mockError = null; // Simulate error

      if (mockError) {
      // if (error) {
        // toast({
        //   title: "Login Failed",
        //   description: error.message || "Invalid credentials. Please try again.",
        //   variant: "destructive",
        // });
        toast({
          title: "Login Failed",
          description: "Mock: Invalid credentials. Please try again.",
          variant: "destructive",
        });
      } else if (mockAuthSuccess) {
      // } else if (authData?.user) {
        toast({
          title: "Login Successful",
          description: "Mock: Welcome back!",
        });
        
        // Placeholder for RBAC: Fetch role and redirect
        // const userId = authData.user.id;
        // const { data: userData, error: userError } = await supabase
        //   .from('your_user_roles_table') // Replace with your actual table name
        //   .select('role')
        //   .eq('user_id', userId)
        //   .single();

        // if (userError) {
        //   toast({ title: "Error fetching user role", description: userError.message, variant: "destructive" });
        //   setIsLoading(false);
        //   // Optionally log out the user if role cannot be fetched
        //   // await supabase.auth.signOut();
        //   return;
        // }
        
        // const role = userData?.role;
        const mockRole = 'admin'; // Simulate role fetching

        // if (role === 'admin') {
        //   router.push('/admin/dashboard'); // Adjust to your admin dashboard route
        // } else if (role === 'staff') {
        //   router.push('/staff/dashboard'); // Adjust to your staff dashboard route
        // } else {
        //   router.push('/'); // Default redirect
        // }
        if (mockRole === 'admin') {
           router.push('/'); // For now, redirect to main dashboard
        } else {
           router.push('/');
        }

      }
    } catch (err) {
      console.error("Login error:", err);
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
          <Gamepad2 className="h-16 w-16 text-primary mb-4" />
          <CardTitle className="text-3xl font-headline">Infinity Gaming Lounge</CardTitle>
          <CardDescription>Secure Login to POS System</CardDescription>
        </CardHeader>
        <CardContent>
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
                        placeholder="e.g., staff@infinitygaming.co.ke" 
                        {...field} 
                        className="bg-input text-foreground placeholder:text-muted-foreground"
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password" 
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
                    Logging In...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
           <Link href="/forgot-password" passHref legacyBehavior>
            <a className="text-sm text-primary hover:underline">
              Forgot Password?
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
