'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import styles from '../register.module.css';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DarkModeToggle from "@/components/DarkModeToggle";

// Define schema for recruiter registration
const recruiterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
  recruiterId: z.string().min(3, { message: "Recruiter ID must be at least 3 characters" }),
  institutionName: z.string().min(2, { message: "Institution name is required" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RecruiterRegistrationPage() {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      recruiterId: "",
      institutionName: "",
      address: "",
    },
  });  const onSubmit = async (data) => {
    try {
      console.log('Recruiter registration data:', data);
      
      // Use the email and password provided by the user
      const email = data.email.trim().toLowerCase();
      const password = data.password;
      
      // Check if email is already registered
      const emailCheckResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const emailCheckResult = await emailCheckResponse.json();
      if (!emailCheckResult.available) {
        form.setError("email", { 
          type: "manual", 
          message: "This email is already registered. Please use a different email address." 
        });
        return;
      }
      
      // Prepare the data for the API
      const registrationData = {
        email,
        password,
        userType: 'recruiter',
        userData: {
          name: data.name,
          recruiterId: data.recruiterId,
          institutionName: data.institutionName,
          address: data.address,
        }
      };
      
      // Submit to the registration API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
        // For compatibility, still store in localStorage
      localStorage.setItem('recruiterProfile', JSON.stringify({
        ...data,
        id: result.user.id,
        registrationComplete: true,
        userRole: 'recruiter',
        email: data.email // Store the user-entered email
      }));
      
      console.log("Registration successful:", result);
      
      // Redirect to recruiter dashboard
      router.push('/dashboard/recruiter');
    } catch (error) {
      console.error("Registration error:", error);
      // Here you would show an error message to the user
      alert("Registration failed: " + error.message);
    }
  };
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" />
      
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <DarkModeToggle />
      </div>
      
      <div className="min-h-screen flex flex-col md:flex-row">      
        {/* Left side - Branding */}
        <div className={styles['typewriter-container']} style={{ flex: 1 }}>
          <div className={styles['typewriter-wrapper']}>
            <div className={`${styles.typewriter} ${styles['typewriter-typing']}`}>
              X-CEED...
            </div>
            <span className={styles['typewriter-cursor']}></span>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="flex flex-1 items-center justify-center p-4 md:p-8 bg-muted/50">
          <Card className={styles['registration-card']}>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold">Recruiter Registration</CardTitle>
              <CardDescription>
                Complete your recruiter profile to start posting jobs and managing candidates
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
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
                        <FormLabel>Email Address*</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@company.com" {...field} />
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
                        <FormLabel>Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
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
                        <FormLabel>Confirm Password*</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recruiterId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recruiter ID*</FormLabel>
                        <FormControl>
                          <Input placeholder="REC001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="institutionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="TechCorp Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institution Address*</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Ave, Tech City, TC 12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full">
                    Complete Registration
                  </Button>
                </form>
              </Form>
            </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                * Required fields
              </p>
              <p className="text-xs text-muted-foreground">
                Step 1 of 1
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
