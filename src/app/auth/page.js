'use client';

import { useState } from 'react';
import Link from "next/link";
import styles from './auth.module.css';

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle authentication
    console.log(activeTab === "login" ? 'Logging in' : 'Signing up', { email, password, name });
  };
  return (
    <div className={styles.authContainer}>
      <div className="flex w-full items-center justify-center">
        <div className="w-full max-w-md p-4">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-2xl font-bold">X-CEED</div>
            <div className="text-sm text-muted-foreground">
              <Link href="#" className="underline underline-offset-4 hover:text-primary">
                Need help?
              </Link>
            </div>
          </div>
            <Card className={styles.authCard}>
            <CardHeader className="space-y-1 py-4">
              <CardTitle className="text-xl">Authentication</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="py-2">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <div className="space-y-0.5">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          placeholder="name@example.com" 
                          required 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="space-y-0.5">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          required 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)} 
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-9">Sign In</Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <div className="space-y-0.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          required 
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="space-y-0.5">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          placeholder="name@example.com" 
                          required 
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="space-y-0.5">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                          id="password" 
                          required 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)} 
                          className="h-9"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-9">Create Account</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>            <CardFooter className="py-3">
              <div className="text-xs text-muted-foreground text-center w-full">
                By continuing, you agree to our{" "}
                <Link href="#" className="underline underline-offset-4 hover:text-primary">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="#" className="underline underline-offset-4 hover:text-primary">
                  Privacy Policy
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}