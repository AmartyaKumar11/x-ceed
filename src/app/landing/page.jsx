'use client';
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, User, Award, CheckCircle, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/blocks/hero-section-dark";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col relative font-sans">
      {/* Auth Button */}
      <div className="absolute top-6 right-8 z-10">
        <Button onClick={() => router.push('/auth')} variant="outline" size="lg" className="shadow-md">
          Sign In / Register
        </Button>
      </div>

      {/* Hero Section - using Claude theme and Orbitron font */}
      <HeroSection
        title="X-CEED"
        subtitle={{
          regular: "Unlock your career potential with ",
          gradient: "AI-powered job matching",
        }}
        description="AI-driven resume analysis, job matching, and interview prep for applicants and recruiters."
        ctaText="Get Started"
        ctaHref="/auth"
        bottomImage={{
          light: "/app-light.png", // Replace with your actual image or remove if not needed
          dark: "/app-dark.png",
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
          lightLineColor: "#e0e7ef", // Claude theme color
          darkLineColor: "#23272f",  // Claude theme color
        }}
        className="font-[Orbitron,sans-serif] text-primary"
      />

      {/* Features Section */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 py-12 px-4">
        {/* Recruiter Features */}
        <div className="bg-card rounded-xl shadow-lg p-8 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="text-primary w-6 h-6" />
            <h2 className="text-2xl font-bold">For Recruiters</h2>
          </div>
          <ul className="mt-2 space-y-3 text-base">
            <li className="flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5" /> AI-powered candidate shortlisting</li>
            <li className="flex items-center gap-2"><Lightbulb className="text-yellow-500 w-5 h-5" /> Instant resume-job fit analysis</li>
            <li className="flex items-center gap-2"><Award className="text-blue-500 w-5 h-5" /> Smart interview scheduling</li>
            <li className="flex items-center gap-2"><User className="text-accent w-5 h-5" /> Manage applicants with ease</li>
          </ul>
        </div>
        {/* Applicant Features */}
        <div className="bg-card rounded-xl shadow-lg p-8 flex flex-col items-start">
          <div className="flex items-center gap-2 mb-2">
            <User className="text-accent w-6 h-6" />
            <h2 className="text-2xl font-bold">For Applicants</h2>
          </div>
          <ul className="mt-2 space-y-3 text-base">
            <li className="flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5" /> Personalized job recommendations</li>
            <li className="flex items-center gap-2"><Lightbulb className="text-yellow-500 w-5 h-5" /> AI resume feedback & improvement tips</li>
            <li className="flex items-center gap-2"><Award className="text-blue-500 w-5 h-5" /> Interview preparation plans</li>
            <li className="flex items-center gap-2"><Briefcase className="text-primary w-5 h-5" /> Track applications & progress</li>
          </ul>
        </div>
      </section>
    </div>
  );
} 