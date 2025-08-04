'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, User, Award, CheckCircle, Lightbulb, ChevronRight, Brain, Target, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ScrollVideoBackground from '@/components/ScrollVideoBackground';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function LandingPageWithVideo() {
  const router = useRouter();
  // Use a relative path that matches the public directory structure
  const videoSrc = '/videos/Video_Ready_Resume_Error.mp4';

  return (
    <ScrollVideoBackground videoSrc={videoSrc}>
      <div className="flex flex-col relative font-sans">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4 text-white">
              <span className="text-[#2260FF]">X-</span>CEED
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90">
              Land Your Dream Job with <span className="text-[#2260FF] font-semibold">AI-Powered Resume Analysis</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push('/auth')} 
                size="lg" 
                className="bg-[#2260FF] hover:bg-[#1a4cd1] text-white px-8"
              >
                Sign Up
              </Button>
              <Button 
                onClick={() => router.push('/auth')} 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white/10"
              >
                Login
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-black/80 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Powerful Features</h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Our AI-powered platform helps you stand out in the job market with cutting-edge tools
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {/* Feature Card 1 */}
              <motion.div 
                className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 hover:border-[#2260FF]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,96,255,0.3)]"
                variants={fadeIn}
              >
                <div className="bg-[#2260FF]/10 p-3 rounded-lg w-fit mb-4">
                  <Brain className="text-[#2260FF] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">AI Resume Analysis</h3>
                <p className="text-white/70">
                  Get instant feedback on your resume with our advanced AI analysis
                </p>
              </motion.div>

              {/* Feature Card 2 */}
              <motion.div 
                className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 hover:border-[#2260FF]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,96,255,0.3)]"
                variants={fadeIn}
              >
                <div className="bg-[#2260FF]/10 p-3 rounded-lg w-fit mb-4">
                  <Target className="text-[#2260FF] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Skill Gap Detection</h3>
                <p className="text-white/70">
                  Identify missing skills needed for your target roles
                </p>
              </motion.div>

              {/* Feature Card 3 */}
              <motion.div 
                className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 hover:border-[#2260FF]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,96,255,0.3)]"
                variants={fadeIn}
              >
                <div className="bg-[#2260FF]/10 p-3 rounded-lg w-fit mb-4">
                  <CheckCircle className="text-[#2260FF] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Personalized Prep Plan</h3>
                <p className="text-white/70">
                  Get customized preparation plans to improve your chances
                </p>
              </motion.div>

              {/* Feature Card 4 */}
              <motion.div 
                className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 hover:border-[#2260FF]/50 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,96,255,0.3)]"
                variants={fadeIn}
              >
                <div className="bg-[#2260FF]/10 p-3 rounded-lg w-fit mb-4">
                  <Sparkles className="text-[#2260FF] w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">AI Career Assistant</h3>
                <p className="text-white/70">
                  Get guidance from our AI assistant for your career journey
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black/80 to-navy-900/80 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">How It Works</h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Four simple steps to transform your job search
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {/* Step 1 */}
              <motion.div 
                className="relative"
                variants={fadeIn}
              >
                <div className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 h-full">
                  <div className="absolute -top-3 -left-3 bg-[#2260FF] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                  <h3 className="text-xl font-bold mb-2 text-white mt-4">Upload Resume</h3>
                  <p className="text-white/70">
                    Upload your resume in any format for AI analysis
                  </p>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div 
                className="relative"
                variants={fadeIn}
              >
                <div className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 h-full">
                  <div className="absolute -top-3 -left-3 bg-[#2260FF] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                  <h3 className="text-xl font-bold mb-2 text-white mt-4">Paste Job Description</h3>
                  <p className="text-white/70">
                    Add the job description you're interested in
                  </p>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div 
                className="relative"
                variants={fadeIn}
              >
                <div className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 h-full">
                  <div className="absolute -top-3 -left-3 bg-[#2260FF] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                  <h3 className="text-xl font-bold mb-2 text-white mt-4">Get AI Feedback</h3>
                  <p className="text-white/70">
                    Receive instant analysis and match score
                  </p>
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div 
                className="relative"
                variants={fadeIn}
              >
                <div className="bg-navy-900/50 backdrop-blur-md p-6 rounded-xl border border-indigo-500/20 h-full">
                  <div className="absolute -top-3 -left-3 bg-[#2260FF] text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">4</div>
                  <h3 className="text-xl font-bold mb-2 text-white mt-4">Receive Action Plan</h3>
                  <p className="text-white/70">
                    Get a personalized plan to improve your chances
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 bg-black/80 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeIn}>
                <h3 className="text-4xl md:text-5xl font-bold text-[#2260FF] mb-2">1,000+</h3>
                <p className="text-white/70">Resumes Analyzed</p>
              </motion.div>
              <motion.div variants={fadeIn}>
                <h3 className="text-4xl md:text-5xl font-bold text-[#2260FF] mb-2">85%</h3>
                <p className="text-white/70">Success Rate</p>
              </motion.div>
              <motion.div variants={fadeIn}>
                <h3 className="text-4xl md:text-5xl font-bold text-[#2260FF] mb-2">24/7</h3>
                <p className="text-white/70">AI Support</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-black/80 to-navy-900/80 backdrop-blur-lg">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
              <p className="text-lg text-white/70">
                Find answers to common questions about our platform
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="border-b border-indigo-500/20">
                  <AccordionTrigger className="text-white hover:text-[#2260FF] transition-colors">
                    How accurate is the AI resume analysis?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    Our AI resume analysis is highly accurate, trained on thousands of successful resumes and job descriptions. It provides detailed feedback on content, formatting, and keyword optimization with over 90% accuracy compared to human recruiters.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b border-indigo-500/20">
                  <AccordionTrigger className="text-white hover:text-[#2260FF] transition-colors">
                    Is my data secure on the platform?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    Yes, we take data security seriously. All uploaded resumes and personal information are encrypted and stored securely. We never share your data with third parties without your explicit consent.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b border-indigo-500/20">
                  <AccordionTrigger className="text-white hover:text-[#2260FF] transition-colors">
                    How does the skill gap detection work?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    Our AI compares your resume against the job description and identifies skills mentioned in the job posting that are missing from your resume. It also suggests ways to acquire or highlight these skills to improve your chances.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-b border-indigo-500/20">
                  <AccordionTrigger className="text-white hover:text-[#2260FF] transition-colors">
                    Can I use X-Ceed for free?
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70">
                    Yes, X-Ceed offers a free tier that includes basic resume analysis and job matching. Premium features like personalized prep plans and AI career coaching are available with our paid subscription plans.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-black/90 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 text-white">X-CEED</h3>
                <p className="text-white/70 mb-4">AI-powered recruitment platform helping job seekers land their dream jobs.</p>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Features</h4>
                <ul className="space-y-2 text-white/70">
                  <li>Resume Analysis</li>
                  <li>Skill Gap Detection</li>
                  <li>Prep Plans</li>
                  <li>AI Career Assistant</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Company</h4>
                <ul className="space-y-2 text-white/70">
                  <li>About Us</li>
                  <li>Careers</li>
                  <li>Blog</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4 text-white">Legal</h4>
                <ul className="space-y-2 text-white/70">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                  <li>Cookie Policy</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-indigo-500/20 mt-8 pt-8 text-center text-white/50">
              <p>© {new Date().getFullYear()} X-Ceed. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </ScrollVideoBackground>
  );
}