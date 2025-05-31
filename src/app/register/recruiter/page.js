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

// Define schema for recruiter registration
const recruiterSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  recruiterId: z.string().min(3, { message: "Recruiter ID must be at least 3 characters" }),
  institutionName: z.string().min(2, { message: "Institution name is required" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
});

export default function RecruiterRegistrationPage() {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(recruiterSchema),
    defaultValues: {
      name: "",
      recruiterId: "",
      institutionName: "",
      address: "",
    },
  });
  const onSubmit = async (data) => {
    try {
      console.log('Recruiter registration data:', data);
      
      // Create a password from the recruiter ID
      const tempPassword = data.recruiterId + '123';
      
      // For now let's use a default email pattern
      const email = `${data.recruiterId.toLowerCase().replace(/\s+/g, '.')}@${data.institutionName.toLowerCase().replace(/\s+/g, '')}.com`;
      
      // Prepare the data for the API
      const registrationData = {
        email,
        password: tempPassword, // In production, you'd want a proper password flow
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
        email // Store the generated email for reference
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
    <div className="min-h-screen bg-white overflow-x-hidden">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&display=swap" />
      
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
        <div className="flex flex-1 items-center justify-center p-4 md:p-8 bg-gray-50">
          <Card className={styles['registration-card']}>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl font-bold">Recruiter Registration</CardTitle>
              <CardDescription>
                Complete your recruiter profile to start posting jobs and managing candidates
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
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
              <p className="text-xs text-gray-500">
                * Required fields
              </p>
              <p className="text-xs text-gray-500">
                Step 1 of 1
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
