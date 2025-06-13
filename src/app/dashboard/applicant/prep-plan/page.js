'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Target, 
  GraduationCap,
  Loader2,
  FileText,
  Code,
  Brain,
  Zap,
  Building,
  Calendar,
  Settings,
  Check,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PrepPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [jobData, setJobData] = useState(null);
  const [prepPlan, setPrepPlan] = useState(null);
  const [parsedSkills, setParsedSkills] = useState(null);
  const [loading, setLoading] = useState(true);
  const [parsingJD, setParsingJD] = useState(false);
  const [error, setError] = useState(null);
  const [learningDuration, setLearningDuration] = useState('12'); // weeks
  const [completedTopics, setCompletedTopics] = useState(new Set());  useEffect(() => {
    const initializePage = async () => {
      // Get job data from URL params
      const jobParam = searchParams.get('job');
      if (jobParam) {
        try {
          const decodedJob = JSON.parse(decodeURIComponent(jobParam));
          setJobData(decodedJob);
          
          // First parse the job description
          await parseJobDescription(decodedJob);
        } catch (error) {
          console.error('Error parsing job data:', error);
          setError('Invalid job data');
          setLoading(false);
        }
      } else {
        setError('No job data provided');
        setLoading(false);
      }
    };

    initializePage();  }, [searchParams]);

  // Generate prep plan when skills are parsed or duration changes
  useEffect(() => {
    if (jobData && !parsingJD) {
      console.log('Triggering prep plan generation with:', { 
        parsedSkills: !!parsedSkills, 
        jobData: !!jobData,
        parsingCompleted: !parsingJD
      });
      generatePrepPlan(jobData, parseInt(learningDuration));
    }
  }, [parsedSkills, learningDuration, jobData, parsingJD]);

  const parseJobDescription = async (job) => {
    try {
      setParsingJD(true);
      console.log('Parsing job description...');
      
      const response = await fetch('/api/parse-job-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          jobDescription: job.description || '',
          jobTitle: job.title || '',
          companyName: job.companyName || '',
          jobId: job.id || null,
          jobDescriptionFile: job.jobDescriptionFile || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setParsedSkills(result.data);
          console.log('Parsed skills:', result.data);
        } else {
          console.error('Failed to parse JD:', result.error);
        }
      }
    } catch (error) {
      console.error('Error parsing job description:', error);
    } finally {
      setParsingJD(false);
    }
  };  const generatePrepPlan = async (job, durationInWeeks = learningDuration) => {
    try {
      console.log('🔄 generatePrepPlan called with:', { 
        jobTitle: job?.title, 
        durationInWeeks, 
        hasParsedSkills: !!parsedSkills,
        parsedSkillsKeys: parsedSkills ? Object.keys(parsedSkills) : 'none'
      });
      
      setLoading(true);
      
      // Wait for skills to be parsed if not already done
      if (!parsedSkills) {
        console.log('⏳ Waiting for skills to be parsed...');
        // Give some time for parsing to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Generate prep plan based on parsed skills
      console.log('🎯 Generating dynamic prep plan...');
      const dynamicPrepPlan = generateDynamicPrepPlan(job, parsedSkills, durationInWeeks);
      console.log('📚 Generated prep plan with phases:', dynamicPrepPlan.phases?.length || 0);
      
      setTimeout(() => {
        setPrepPlan(dynamicPrepPlan);
        setLoading(false);
        console.log('✅ Prep plan set successfully');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error generating prep plan:', error);
      setError('Failed to generate prep plan');
      setLoading(false);
    }
  };  const generateDynamicPrepPlan = (job, skills, durationInWeeks) => {
    console.log('🔍 generateDynamicPrepPlan called with:', {
      jobTitle: job?.title,
      hasSkills: !!skills,
      skillsKeys: skills ? Object.keys(skills) : 'none',
      durationInWeeks,
      requiredSkillsExists: !!(skills?.requiredSkills),
      criticalSkills: skills?.requiredSkills?.critical || [],
      mustLearnSkills: skills?.learningPath?.mustLearn || []
    });

    // Default fallback if no skills are parsed
    if (!skills || !skills.requiredSkills) {
      console.log('⚠️ No skills found, using fallback prep plan');
      return generateFallbackPrepPlan(job, durationInWeeks);
    }

    console.log('✅ Using dynamic prep plan based on parsed skills');
    const phases = [];
    let topicId = 1;
    
    // Phase 1: Foundation & Critical Skills
    const criticalSkills = skills.requiredSkills.critical || [];
    const mustLearnSkills = skills.learningPath?.mustLearn || [];
    const combinedCritical = [...new Set([...criticalSkills, ...mustLearnSkills])];
    
    if (combinedCritical.length > 0) {
      const foundationTopics = combinedCritical.map(skill => ({
        id: topicId++,
        title: `${skill} Fundamentals`,
        description: `Master the core concepts and fundamentals of ${skill}`,
        estimatedHours: 12,
        resources: generateResourcesForSkill(skill, 'foundation'),
        completed: false
      }));

      phases.push({
        id: 1,
        title: 'Foundation & Critical Skills',
        duration: `${Math.ceil(durationInWeeks * 0.3)} weeks`,
        topics: foundationTopics
      });
    }

    // Phase 2: Technical Skills Development
    const technicalSkills = skills.requiredSkills.technical || [];
    const languages = skills.requiredSkills.languages || [];
    const frameworks = skills.requiredSkills.frameworks || [];
    const databases = skills.requiredSkills.databases || [];
    
    const techTopics = [];
    
    languages.forEach(lang => {
      techTopics.push({
        id: topicId++,
        title: `${lang} Advanced Concepts`,
        description: `Deep dive into ${lang} - advanced features, best practices, and optimization`,
        estimatedHours: 15,
        resources: generateResourcesForSkill(lang, 'advanced'),
        completed: false
      });
    });

    frameworks.forEach(framework => {
      techTopics.push({
        id: topicId++,
        title: `${framework} Development`,
        description: `Build production-ready applications using ${framework}`,
        estimatedHours: 18,
        resources: generateResourcesForSkill(framework, 'framework'),
        completed: false
      });
    });

    databases.forEach(db => {
      techTopics.push({
        id: topicId++,
        title: `${db} Database Management`,
        description: `Design, optimize, and manage ${db} databases`,
        estimatedHours: 12,
        resources: generateResourcesForSkill(db, 'database'),
        completed: false
      });
    });

    if (techTopics.length > 0) {
      phases.push({
        id: 2,
        title: 'Technical Skills Development',
        duration: `${Math.ceil(durationInWeeks * 0.4)} weeks`,
        topics: techTopics
      });
    }

    // Phase 3: Tools & DevOps
    const tools = skills.requiredSkills.tools || [];
    const cloudTech = skills.requiredSkills.cloud || [];
    
    const toolTopics = [];
    
    tools.forEach(tool => {
      toolTopics.push({
        id: topicId++,
        title: `${tool} Proficiency`,
        description: `Master ${tool} for development workflow and productivity`,
        estimatedHours: 8,
        resources: generateResourcesForSkill(tool, 'tool'),
        completed: false
      });
    });

    cloudTech.forEach(cloud => {
      toolTopics.push({
        id: topicId++,
        title: `${cloud} Cloud Services`,
        description: `Deploy and manage applications using ${cloud}`,
        estimatedHours: 15,
        resources: generateResourcesForSkill(cloud, 'cloud'),
        completed: false
      });
    });

    if (toolTopics.length > 0) {
      phases.push({
        id: 3,
        title: 'Tools & DevOps',
        duration: `${Math.ceil(durationInWeeks * 0.2)} weeks`,
        topics: toolTopics
      });
    }

    // Phase 4: Interview Preparation
    const interviewTopics = skills.interviewPrep?.technicalTopics || [];
    const systemDesignTopics = skills.interviewPrep?.systemDesign || [];
    
    const prepTopics = [
      {
        id: topicId++,
        title: 'Technical Interview Practice',
        description: `Focus on: ${interviewTopics.join(', ')}`,
        estimatedHours: 10,
        resources: [
          { type: 'practice', title: 'LeetCode Problems', url: 'https://leetcode.com' },
          { type: 'practice', title: 'HackerRank Challenges', url: 'https://hackerrank.com' },
          { type: 'course', title: 'Cracking the Coding Interview', url: '#' }
        ],
        completed: false
      }
    ];

    if (systemDesignTopics.length > 0) {
      prepTopics.push({
        id: topicId++,
        title: 'System Design Preparation',
        description: `Study: ${systemDesignTopics.join(', ')}`,
        estimatedHours: 12,
        resources: [
          { type: 'course', title: 'System Design Interview Course', url: '#' },
          { type: 'book', title: 'Designing Data-Intensive Applications', url: '#' },
          { type: 'practice', title: 'Design Popular Systems', url: '#' }
        ],
        completed: false
      });
    }

    prepTopics.push({
      id: topicId++,
      title: 'Company-Specific Preparation',
      description: `Research ${job.companyName} culture, recent projects, and interview process`,
      estimatedHours: 6,
      resources: [
        { type: 'research', title: `${job.companyName} Engineering Blog`, url: '#' },
        { type: 'networking', title: 'Connect with current employees', url: '#' },
        { type: 'research', title: 'Glassdoor Interview Experiences', url: '#' }
      ],
      completed: false
    });

    phases.push({
      id: 4,
      title: 'Interview Preparation',
      duration: `${Math.ceil(durationInWeeks * 0.1)} weeks`,
      topics: prepTopics
    });

    const totalTopics = phases.reduce((sum, phase) => sum + phase.topics.length, 0);

    return {
      overview: {
        estimatedTimeWeeks: durationInWeeks,
        difficultyLevel: skills.learningPath?.difficultyLevel || job.level || 'Intermediate',
        totalTopics,
        completedTopics: 0
      },
      phases
    };
  };

  const generateResourcesForSkill = (skill, type) => {
    const skillLower = skill.toLowerCase();
    const resources = [];

    // Default resources based on skill type
    switch (type) {
      case 'foundation':
        resources.push(
          { type: 'course', title: `${skill} Complete Guide`, url: '#' },
          { type: 'documentation', title: `Official ${skill} Documentation`, url: '#' },
          { type: 'practice', title: `${skill} Practice Problems`, url: '#' }
        );
        break;
      
      case 'advanced':
        resources.push(
          { type: 'course', title: `Advanced ${skill} Concepts`, url: '#' },
          { type: 'book', title: `${skill} Best Practices`, url: '#' },
          { type: 'project', title: `Build Advanced ${skill} Project`, url: '#' }
        );
        break;
      
      case 'framework':
        resources.push(
          { type: 'course', title: `${skill} Complete Course`, url: '#' },
          { type: 'project', title: `Build App with ${skill}`, url: '#' },
          { type: 'documentation', title: `${skill} Official Docs`, url: '#' }
        );
        break;
      
      case 'database':
        resources.push(
          { type: 'course', title: `${skill} Database Course`, url: '#' },
          { type: 'practice', title: `${skill} Query Practice`, url: '#' },
          { type: 'project', title: `Design Schema with ${skill}`, url: '#' }
        );
        break;
      
      case 'tool':
        resources.push(
          { type: 'course', title: `${skill} Tutorial`, url: '#' },
          { type: 'documentation', title: `${skill} User Guide`, url: '#' },
          { type: 'hands-on', title: `${skill} Hands-on Practice`, url: '#' }
        );
        break;
      
      case 'cloud':
        resources.push(
          { type: 'course', title: `${skill} Certification Course`, url: '#' },
          { type: 'hands-on', title: `${skill} Hands-on Labs`, url: '#' },
          { type: 'documentation', title: `${skill} Service Documentation`, url: '#' }
        );
        break;
    }

    return resources;
  };

  const generateFallbackPrepPlan = (job, durationInWeeks) => {
    // Fallback plan when skills parsing fails
    return {
      overview: {
        estimatedTimeWeeks: durationInWeeks,
        difficultyLevel: job.level || 'Intermediate',
        totalTopics: 8,
        completedTopics: 0
      },
      phases: [
        {
          id: 1,
          title: 'Foundation Skills',
          duration: '3 weeks',
          topics: [
            {
              id: 1,
              title: 'Core Programming Concepts',
              description: 'Strengthen fundamental programming skills',
              estimatedHours: 15,
              resources: [
                { type: 'course', title: 'Programming Fundamentals', url: '#' },
                { type: 'practice', title: 'Coding Challenges', url: '#' }
              ],
              completed: false
            },
            {
              id: 2,
              title: 'Data Structures & Algorithms',
              description: 'Master essential DSA concepts',
              estimatedHours: 20,
              resources: [
                { type: 'course', title: 'DSA Complete Course', url: '#' },
                { type: 'practice', title: 'Algorithm Practice', url: '#' }
              ],
              completed: false
            }
          ]
        },
        {
          id: 2,
          title: 'Job-Specific Skills',
          duration: '4 weeks',
          topics: [
            {
              id: 3,
              title: `${job.title} Role Preparation`,
              description: `Prepare for ${job.title} position requirements`,
              estimatedHours: 25,
              resources: [
                { type: 'research', title: 'Role Requirements Research', url: '#' },
                { type: 'project', title: 'Relevant Project Building', url: '#' }
              ],
              completed: false
            }
          ]
        },
        {
          id: 3,
          title: 'Interview Preparation',
          duration: '1 week',
          topics: [
            {
              id: 4,
              title: 'Technical Interview Prep',
              description: 'Prepare for technical interviews',
              estimatedHours: 10,
              resources: [
                { type: 'practice', title: 'Mock Interviews', url: '#' },
                { type: 'course', title: 'Interview Techniques', url: '#' }
              ],
              completed: false
            }
          ]
        }
      ]
    };
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'book': return <FileText className="h-4 w-4" />;
      case 'practice': return <Code className="h-4 w-4" />;
      case 'project': return <Target className="h-4 w-4" />;
      case 'documentation': return <FileText className="h-4 w-4" />;
      case 'mock': return <Brain className="h-4 w-4" />;
      case 'research': return <Brain className="h-4 w-4" />;
      case 'networking': return <Brain className="h-4 w-4" />;
      case 'hands-on': return <Zap className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  // Completion tracking functions
  const toggleTopicCompletion = (topicId) => {
    setCompletedTopics(prev => {
      const newCompleted = new Set(prev);
      if (newCompleted.has(topicId)) {
        newCompleted.delete(topicId);
      } else {
        newCompleted.add(topicId);
      }
      return newCompleted;
    });
  };
  const handleDurationChange = (newDuration) => {
    setLearningDuration(newDuration);
    // The useEffect will automatically regenerate the plan when duration changes
  };

  const calculateProgress = () => {
    if (!prepPlan) return 0;
    const totalTopics = prepPlan.phases.reduce((total, phase) => total + phase.topics.length, 0);
    return totalTopics > 0 ? (completedTopics.size / totalTopics) * 100 : 0;  };
  if (loading) {
    return (
      <div className="fixed inset-0 top-16 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {parsingJD ? 'Parsing Job Description with AI...' : 'Generating Your Prep Plan'}
              </h3>
              <p className="text-muted-foreground text-center">
                {parsingJD 
                  ? 'AI is analyzing job requirements and extracting required skills...'
                  : 'AI is analyzing the job requirements and creating a personalized study plan for you...'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }  if (error) {
    return (
      <div className="fixed inset-0 top-16 overflow-y-auto bg-background">
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-destructive mb-4">⚠️</div>
              <h3 className="text-lg font-medium mb-2">Error</h3>
              <p className="text-muted-foreground text-center">{error}</p>
              <Button 
                onClick={() => router.push('/dashboard/applicant/saved-jobs')}
                className="mt-4"
              >
                Go Back to Saved Jobs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );  }
  return (
    <div className="fixed inset-0 top-16 overflow-y-auto bg-background" style={{scrollBehavior: 'smooth'}}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Prep Plan</h1>
            <p className="text-muted-foreground">
              {jobData?.title} at {jobData?.companyName}
            </p>
          </div>
          
          {/* Duration Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Learning Duration:</span>
            </div>
            <Select value={learningDuration} onValueChange={handleDurationChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
                <SelectItem value="12">12 weeks</SelectItem>
                <SelectItem value="16">16 weeks</SelectItem>
                <SelectItem value="20">20 weeks</SelectItem>
                <SelectItem value="24">24 weeks</SelectItem>
                <SelectItem value="36">36 weeks</SelectItem>
                <SelectItem value="52">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Study Plan Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{prepPlan?.overview.estimatedTimeWeeks}</div>
                <div className="text-sm text-muted-foreground">Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{prepPlan?.overview.totalTopics}</div>
                <div className="text-sm text-muted-foreground">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedTopics.size}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-sm">
                  {prepPlan?.overview.difficultyLevel}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">Difficulty</div>
              </div>
              <div className="text-center">
                <Progress value={calculateProgress()} className="w-full" />
                <div className="text-sm text-muted-foreground mt-1">{Math.round(calculateProgress())}% Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>{/* Parsed Skills Section */}
        {parsedSkills && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Powered Job Analysis
                {parsingJD && <Loader2 className="h-4 w-4 animate-spin" />}
                {parsedSkills.source === 'gemini-ai' && (
                  <Badge variant="default" className="ml-2">
                    Gemini AI
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Critical Skills - Most Important */}
              {parsedSkills.requiredSkills?.critical && parsedSkills.requiredSkills.critical.length > 0 && (
                <div className="mb-6 p-4 border-2 border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                    <Target className="h-5 w-5" />
                    🚨 CRITICAL SKILLS - Must Learn First
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedSkills.requiredSkills.critical.map((skill, index) => (
                      <Badge key={index} variant="destructive" className="text-sm font-medium">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                    These skills are absolutely mandatory for this role. Focus on these first!
                  </p>
                </div>
              )}

              {/* Learning Path Priority */}
              {parsedSkills.learningPath && (
                <div className="mb-6">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Prioritized Learning Path
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Must Learn */}
                    {parsedSkills.learningPath.mustLearn && (
                      <div className="p-3 border border-red-300 rounded-lg bg-red-50 dark:bg-red-950/10">
                        <h5 className="font-medium text-red-700 dark:text-red-400 mb-2">Must Learn (Priority 1)</h5>
                        <div className="space-y-1">
                          {parsedSkills.learningPath.mustLearn.slice(0, 5).map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span>{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* High Priority */}
                    {parsedSkills.learningPath.highPriority && (
                      <div className="p-3 border border-orange-300 rounded-lg bg-orange-50 dark:bg-orange-950/10">
                        <h5 className="font-medium text-orange-700 dark:text-orange-400 mb-2">High Priority (Priority 2)</h5>
                        <div className="space-y-1">
                          {parsedSkills.learningPath.highPriority.slice(0, 5).map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span>{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Medium Priority */}
                    {parsedSkills.learningPath.mediumPriority && (
                      <div className="p-3 border border-blue-300 rounded-lg bg-blue-50 dark:bg-blue-950/10">
                        <h5 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Medium Priority (Priority 3)</h5>
                        <div className="space-y-1">
                          {parsedSkills.learningPath.mediumPriority.slice(0, 4).map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span>{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nice to Have */}
                    {parsedSkills.learningPath.niceToHave && (
                      <div className="p-3 border border-green-300 rounded-lg bg-green-50 dark:bg-green-950/10">
                        <h5 className="font-medium text-green-700 dark:text-green-400 mb-2">Nice to Have (Bonus)</h5>
                        <div className="space-y-1">
                          {parsedSkills.learningPath.niceToHave.slice(0, 4).map((skill, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span>{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Learning Timeline */}
                  {(parsedSkills.learningPath.estimatedTimeWeeks || parsedSkills.learningPath.difficultyLevel) && (
                    <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-purple-700 dark:text-purple-400">Learning Timeline</h5>
                          <p className="text-sm text-purple-600 dark:text-purple-300">
                            Estimated: {parsedSkills.learningPath.estimatedTimeWeeks || 8} weeks
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {parsedSkills.learningPath.difficultyLevel || 'Intermediate'} Level
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Technical Skills */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedSkills.requiredSkills?.technical?.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Programming Languages */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Programming Languages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedSkills.requiredSkills?.languages?.map((language, index) => (
                      <Badge key={index} variant="default" className="text-xs">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Frameworks & Tools */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Frameworks & Tools
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {parsedSkills.requiredSkills?.frameworks?.map((framework, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {framework}
                      </Badge>
                    ))}
                    {parsedSkills.requiredSkills?.tools?.map((tool, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Cloud & Databases */}
                {(parsedSkills.requiredSkills?.cloud || parsedSkills.requiredSkills?.databases) && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Cloud & Databases
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.requiredSkills?.cloud?.map((cloud, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          {cloud}
                        </Badge>
                      ))}
                      {parsedSkills.requiredSkills?.databases?.map((db, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                          {db}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience Level */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Experience Required
                  </h4>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {parsedSkills.experience?.level || 'Not specified'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {parsedSkills.experience?.minYears || 0} - {parsedSkills.experience?.maxYears || 0} years
                    </p>
                  </div>
                </div>

                {/* Job Insights */}
                {parsedSkills.jobInsights && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Job Insights
                    </h4>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {parsedSkills.jobInsights.workType || 'Not specified'}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {parsedSkills.jobInsights.companyType || 'Unknown'}
                        </Badge>
                      </div>
                      {parsedSkills.jobInsights.teamSize && (
                        <p className="text-sm text-muted-foreground">
                          Team: {parsedSkills.jobInsights.teamSize}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Responsibilities */}
              {parsedSkills.responsibilities && parsedSkills.responsibilities.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Key Responsibilities
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {parsedSkills.responsibilities.slice(0, 6).map((responsibility, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-muted-foreground">{responsibility}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Prep Insights */}
              {parsedSkills.interviewPrep && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Interview Preparation Insights
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedSkills.interviewPrep.technicalTopics && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Technical Topics</h5>
                        <div className="flex flex-wrap gap-1">
                          {parsedSkills.interviewPrep.technicalTopics.slice(0, 4).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {parsedSkills.interviewPrep.codingChallenges && (
                      <div>
                        <h5 className="text-sm font-medium mb-2">Coding Challenges</h5>
                        <div className="flex flex-wrap gap-1">
                          {parsedSkills.interviewPrep.codingChallenges.slice(0, 4).map((challenge, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {challenge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Analysis Footer */}
              <div className="mt-6 pt-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-3 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 dark:text-blue-400 font-medium">
                      AI-Powered Analysis Complete
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Confidence: {Math.round((parsedSkills.confidence || 0.75) * 100)}%</span>
                    {parsedSkills.source === 'gemini-ai' && (
                      <Badge variant="outline" className="text-xs">Powered by Gemini</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Study Phases */}
        <div className="space-y-6">
          {prepPlan?.phases.map((phase) => (
            <Card key={phase.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {phase.id}
                    </div>
                    {phase.title}
                  </CardTitle>
                  <Badge variant="secondary">{phase.duration}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phase.topics.map((topic) => (
                    <div key={topic.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{topic.title}</h4>
                          <p className="text-sm text-muted-foreground">{topic.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {topic.estimatedHours}h
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Resources:</h5>
                        {topic.resources.map((resource, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {getResourceIcon(resource.type)}
                            <span className="text-muted-foreground capitalize">{resource.type}:</span>
                            <a href={resource.url} className="text-primary hover:underline">
                              {resource.title}
                            </a>
                          </div>
                        ))}
                      </div>
                        <div className="mt-3 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant={completedTopics.has(topic.id) ? "default" : "outline"}
                          className={`flex items-center gap-2 ${
                            completedTopics.has(topic.id) 
                              ? 'bg-green-600 hover:bg-green-700 text-white' 
                              : 'hover:bg-primary hover:text-primary-foreground'
                          }`}
                          onClick={() => toggleTopicCompletion(topic.id)}
                        >
                          {completedTopics.has(topic.id) ? (
                            <>
                              <Check className="h-4 w-4" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Target className="h-4 w-4" />
                              Mark Complete
                            </>
                          )}
                        </Button>
                        
                        {completedTopics.has(topic.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => toggleTopicCompletion(topic.id)}
                          >
                            <X className="h-4 w-4" />
                            Undo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>        {/* AI Enhancement Notice */}
        <Card className="mt-6 border-dashed">
          <CardContent className="text-center py-6">
            <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-medium mb-2">AI-Powered Personalization</h3>
            <p className="text-sm text-muted-foreground">
              This prep plan is powered by Gemini AI analysis of the job description. 
              Track your progress by marking topics as complete!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
