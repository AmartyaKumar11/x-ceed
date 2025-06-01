'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Import the old SimpleDatePicker in case it's used elsewhere
import { SimpleDatePicker } from "@/components/ui/simple-date-picker";
import { SelectDirect } from "@/components/ui/select-direct";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TextDateInput } from "@/components/ui/text-date-input";

// Define schemas for each step
const personalInfoSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
  dob: z.date({
    required_error: "Date of birth is required",
    invalid_type_error: "Please enter a valid date in DD-MM-YY format",
  }).refine(date => {
    return date instanceof Date && !isNaN(date.getTime());
  }, {
    message: "Please enter a valid date in DD-MM-YY format",
  }),
  sex: z.string({
    required_error: "Please select your gender",
  }),
});

const educationSchema = z.object({
  degree: z.string().min(2, { message: "Degree is required" }),
  institution: z.string().min(2, { message: "Institution name is required" }),
  address: z.string().min(5, { message: "Institution address is required" }),
  startDate: z.date().nullable().refine(date => {
    return !date || (date instanceof Date && !isNaN(date.getTime()));
  }, {
    message: "Please select a valid date",
  }),
  endDate: z.date().nullable().refine((date, ctx) => {
    if (!date) return true;
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    // Safely access parent property - check if it exists first
    if (!ctx.parent || !ctx.parent.startDate) return true;
    const startDate = ctx.parent.startDate;
    return date >= startDate;
  }, {
    message: "End date must be after start date",
  }),
  grade: z.string().optional(),
});

const contactSchema = z.object({
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
  alternatePhone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).refine(
    (email) => email.trim().length > 0,
    { message: "Email cannot be empty" }
  ),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Please confirm your password" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const workExperienceSchema = z.object({
  company: z.string().optional().default(""),
  position: z.string().optional().default(""),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional().refine((date, ctx) => {
    if (!date) return true;
    if (!(date instanceof Date) || isNaN(date.getTime())) return false;
    // Safely access parent property - check if it exists first
    if (!ctx.parent || !ctx.parent.startDate) return true;
    const startDate = ctx.parent.startDate;
    return date >= startDate;
  }, {
    message: "End date must be after start date",
  }),
  description: z.string().optional().default(""),
});

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female", "Prefer not to say", "Other"];

export default function RegistrationPage() {
  const router = useRouter();  const [step, setStep] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);  const [formData, setFormData] = useState({
    personal: null,
    education: null,
    contact: null,
    workExperience: null,
  });  // Configure form states
  const formDefaultValues = {
    personal: {
      name: "",
      address: "",
      sex: "",
      dob: null, // Use null for date fields to match TextDateInput expectations
    },
    education: {
      degree: "",
      institution: "",
      address: "",
      startDate: null, // Use null for date fields
      endDate: null, // Use null for date fields
      grade: "",
    },    contact: {
      phone: "",
      alternatePhone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    workExperience: {
      company: "",
      position: "",
      description: "",
      startDate: null, // Use null for date fields
      endDate: null, // Use null for date fields
    },
  };

  // Initialize forms for each step
  const personalForm = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: formData.personal || formDefaultValues.personal,
    mode: "onChange", // Add immediate validation
  });

  const educationForm = useForm({
    resolver: zodResolver(educationSchema),
    defaultValues: formData.education || formDefaultValues.education,
    mode: "onChange", // Add immediate validation
  });

  const contactForm = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: formData.contact || formDefaultValues.contact,
    mode: "onChange", // Add immediate validation
  });

  const workExperienceForm = useForm({
    resolver: zodResolver(workExperienceSchema),
    defaultValues: formData.workExperience || formDefaultValues.workExperience,
    mode: "onChange", // Add immediate validation
  });

  // Effect to reset the forms on step change
  useEffect(() => {
    // Reset the appropriate form when step changes
    if (step === 0) {
      personalForm.reset(formData.personal || formDefaultValues.personal);
    } else if (step === 1) {
      educationForm.reset(formData.education || formDefaultValues.education);
    } else if (step === 2) {
      contactForm.reset(formData.contact || formDefaultValues.contact);
    } else if (step === 3) {
      workExperienceForm.reset(formData.workExperience || formDefaultValues.workExperience);
    }
  }, [step]);

  const [typing, setTyping] = useState(true);
  const typingTimeout = useRef(null);
  // Effect for typewriter animation
  useEffect(() => {
    typingTimeout.current = setTimeout(() => {
      setTyping(!typing);
    }, typing ? 3000 : 2000); // 3s for typing, 2s for erasing

    return () => clearTimeout(typingTimeout.current);
  }, [typing]);

  // Effect to handle step changes and form resets
  useEffect(() => {
    // Reset the appropriate form when switching steps
    switch(step) {
      case 0:
        personalForm.reset(formData.personal || {
          name: "",
          address: "",
          sex: "",
          dob: null,
        });
        break;
      case 1:
        educationForm.reset(formData.education || {
          degree: "",
          institution: "",
          address: "",
          startDate: null,
          endDate: null,
          grade: "",
        });
        break;
      case 2:
        contactForm.reset(formData.contact || {
          phone: "",
          alternatePhone: "",
          email: "",
        });
        break;
      case 3:
        workExperienceForm.reset(formData.workExperience || {
          company: "",
          position: "",
          description: "",
          startDate: null,
          endDate: null,
        });
        break;
    }
  }, [step]);

  // Handle form submission for each step
  const onSubmitPersonal = (data) => {
    setFormData(prev => ({ ...prev, personal: data }));
    setStep(1);
    // Clear education form to prevent state issues
    educationForm.reset({
      degree: "",
      institution: "",
      address: "",
      startDate: null,
      endDate: null,
      grade: "",
    });
  };

  const onSubmitEducation = (data) => {
    setFormData(prev => ({ ...prev, education: data }));
    setStep(2);    // Clear contact form
    contactForm.reset({
      phone: "",
      alternatePhone: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };
  const onSubmitContact = async (data) => {
    try {
      // Check if email is already registered before proceeding
      const emailToCheck = data.email.trim().toLowerCase();
      setIsLoading(true);
      
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });
      
      const result = await response.json();
      
      if (!result.available) {
        // Email is already registered - show error
        contactForm.setError("email", { 
          type: "manual", 
          message: "This email is already registered. Please use a different email address." 
        });
        setIsLoading(false);
        return;
      }
      
      // If email is available, proceed
      console.log("Email is available, proceeding with registration");
      setFormData(prev => ({ ...prev, contact: { ...data, email: emailToCheck } }));
      setStep(3);
    } catch (error) {
      console.error("Error checking email availability:", error);
      contactForm.setError("email", { 
        type: "manual", 
        message: "Unable to verify email. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitWorkExperience = (data) => {
    setFormData(prev => ({ ...prev, workExperience: data }));
    setStep(4);
  };  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file); // Store the actual file
      setProfileImage(URL.createObjectURL(file)); // Store the preview URL
    }
  };
  const handleResumeChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResumeFile(file);
    }
  };const handleFinish = async () => {
    try {
      // Set loading state
      setIsLoading(true);
      
      // Ensure we have a valid email
      if (!formData.contact?.email || formData.contact.email.trim() === '') {
        alert("Email is required. Please go back to the contact step and provide an email address.");
        setIsLoading(false);
        return;
      }
        // Normalize the email address
      const email = formData.contact.email.trim().toLowerCase();
      const password = formData.contact.password; // Use the user-entered password
      
      // Verify one more time that the email is still available before final submission
      const emailCheckResponse = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const emailCheckResult = await emailCheckResponse.json();
      
      if (!emailCheckResult.available) {
        alert(`The email address ${email} is already registered. Please go back to the contact step and use a different email address.`);
        setIsLoading(false);
        return;
      }
      
      // Prepare the data for the API
      const registrationData = {
        email: email,
        password: password, // Use the user-provided password
        userType: 'applicant',
        userData: {
          personal: formData.personal,
          education: [formData.education], // Convert to array for the schema
          contact: { ...formData.contact, email: email }, // Ensure email consistency
          workExperience: [formData.workExperience], // Convert to array for the schema
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
      
      const result = await response.json();        if (!response.ok) {
        // Show a user-friendly error message
        const errorMessage = result.message || 'Registration failed';
        
        if (errorMessage.includes('email already exists')) {
          alert(`The email address ${registrationData.email} is already registered. Please use a different email.`);
          // Go back to contact step to change email
          setStep(2);
        } else {
          alert(`Registration failed: ${errorMessage}`);
        }
        
        throw new Error(errorMessage);
      }
      
      // Registration successful, now login to get auth token
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },        body: JSON.stringify({
          email: email,
          password: password // Use the user-provided password
        }),
      });
      
      const loginResult = await loginResponse.json();
      
      if (!loginResponse.ok) {
        // Continue even if auto-login fails - user can login manually later
      } else {
        // Store token in localStorage for successful login
        localStorage.setItem('token', loginResult.token);
      }

      // Upload files if they were selected (regardless of auto-login success)
      const token = loginResult?.token; // Use token if available

      // If resume file was uploaded, send it to the backend
      if (resumeFile) {
        if (!token) {
          alert("Your profile was created successfully! However, you'll need to log in and upload your resume and profile image from your dashboard.");
        } else {
          try {
          // Create FormData object for file upload
          const formData = new FormData();
          formData.append('file', resumeFile, resumeFile.name); // Append with filename
          
          // Upload the resume file to the resume upload endpoint
          const uploadResponse = await fetch('/api/upload/resume', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // Don't manually set Content-Type for FormData
              // The browser will set it automatically with the correct boundary
            },
            body: formData,
            // Ensure credentials are included
            credentials: 'include',
          });
          
          if (!uploadResponse.ok) {
            // Try to get more details from the error response
            try {
              const errorData = await uploadResponse.json();
              
              // Show a notification to the user but continue registration
              alert(`Note: Your profile was created but the resume upload failed. You can upload your resume later from your dashboard. (Error: ${errorData.message || 'Unknown error'})`);
            } catch (parseError) {              alert("Note: Your profile was created but the resume upload failed. You can upload your resume later from your dashboard.");
            }
            // Continue with registration even if resume upload fails
          } else {
            const uploadResult = await uploadResponse.json();
          }        } catch (uploadError) {
          alert("Your profile was created successfully, but we couldn't upload your resume. You can upload it later from your dashboard.");
          // Continue with registration even if resume upload fails
        }
        } // Close the else block for token check
      }

      // If profile image was uploaded, send it to the backend
      if (profileImageFile && token) {
        try {
          // Create FormData object for profile image upload
          const imageFormData = new FormData();
          imageFormData.append('file', profileImageFile, profileImageFile.name);
          
          // Upload the profile image
          const imageUploadResponse = await fetch('/api/upload/profile-image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: imageFormData,
            credentials: 'include',
          });
          
          if (!imageUploadResponse.ok) {
            try {
              const errorData = await imageUploadResponse.json();
              alert(`Note: Your profile was created but the profile image upload failed. You can upload it later from your dashboard. (Error: ${errorData.message || 'Unknown error'})`);
            } catch (parseError) {
              alert("Note: Your profile was created but the profile image upload failed. You can upload it later from your dashboard.");
            }
          } else {
            const imageUploadResult = await imageUploadResponse.json();
          }
        } catch (imageUploadError) {
          alert("Your profile was created successfully, but we couldn't upload your profile image. You can upload it later from your dashboard.");
        }
      }
      
      setIsLoading(false);
      
      // For now, still store in localStorage for compatibility
      localStorage.setItem('applicantProfile', JSON.stringify({
        name: formData.personal?.name,
        email: formData.contact?.email,
        id: result.user.id,
        registrationComplete: true,
        userType: 'applicant'
      }));      
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/applicant');
      }, 1000);
    } catch (error) {
      console.error("Registration error:", error);
      // Here you would show an error message to the user
      alert("Registration failed: " + error.message);
      setIsLoading(false);
    }
  };

  // Handle form navigation
  const goBack = () => {
    // Save current step's data before going back
    const forms = {
      0: personalForm,
      1: educationForm,
      2: contactForm,
      3: workExperienceForm
    };
    
    const currentForm = forms[step];
    if (currentForm) {
      const currentData = currentForm.getValues();
      setFormData(prev => ({
        ...prev,
        [getStepKey(step)]: currentData
      }));
    }
    
    // Reset next form's data to prevent state sharing
    const prevStep = step - 1;
    const prevForm = forms[prevStep];
    if (prevForm) {
      const prevStepKey = getStepKey(prevStep);
      prevForm.reset(formData[prevStepKey] || {});
    }
    
    setStep(prevStep);
  };

  const getStepKey = (stepNumber) => {
    switch (stepNumber) {
      case 0: return 'personal';
      case 1: return 'education';
      case 2: return 'contact';
      case 3: return 'workExperience';
      default: return '';
    }
  };

  // Handle skipping optional steps
  const handleSkip = () => {
    if (step < 2) {
      // Can't skip required steps (personal and education)
      return;
    }
    
    // Save current form data even when skipping
    const forms = {
      2: contactForm,
      3: workExperienceForm
    };
    
    const currentForm = forms[step];
    if (currentForm) {
      const currentData = currentForm.getValues();
      setFormData(prev => ({
        ...prev,
        [getStepKey(step)]: currentData
      }));
    }
    
    setStep(step + 1);
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return (
          <Form {...personalForm}>
            <form onSubmit={personalForm.handleSubmit(onSubmitPersonal)} className="space-y-4">
              <FormField
                control={personalForm.control}
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
                control={personalForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address*</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />              <FormField
                control={personalForm.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth* (DD-MM-YY)</FormLabel>
                    <TextDateInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="DD-MM-YY"
                    />
                    <FormDescription>
                      Enter your birth date in DD-MM-YY format (e.g., 25-06-95)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                control={personalForm.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender*</FormLabel>
                    <FormControl>
                      <SelectDirect
                        options={genders}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select gender"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
  
              
              <Button type="submit" className="w-full">Continue</Button>
            </form>          </Form>
        );
          case 1:
        return (
          <div className="space-y-4">
            <form onSubmit={educationForm.handleSubmit(onSubmitEducation)} className="space-y-4">
              <div>
                <label htmlFor="degree" className="text-sm font-medium block mb-1">
                  Degree/Qualification*
                </label>
                <input
                  id="degree"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Bachelor's in Computer Science"
                  {...educationForm.register("degree")}
                />
                {educationForm.formState.errors.degree && (
                  <p className="text-sm text-destructive mt-1">
                    {educationForm.formState.errors.degree.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="institution" className="text-sm font-medium block mb-1">
                  Institution*
                </label>
                <input
                  id="institution"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="University/School Name"
                  {...educationForm.register("institution")}
                />
                {educationForm.formState.errors.institution && (
                  <p className="text-sm text-destructive mt-1">
                    {educationForm.formState.errors.institution.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="institutionAddress" className="text-sm font-medium block mb-1">
                  Institution Address*
                </label>
                <input
                  id="institutionAddress"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Institution Address"
                  {...educationForm.register("address")}
                />
                {educationForm.formState.errors.address && (
                  <p className="text-sm text-destructive mt-1">
                    {educationForm.formState.errors.address.message}
                  </p>
                )}
              </div>                <div>
                <label htmlFor="startDate" className="text-sm font-medium block mb-1">
                  Start Date* (DD-MM-YY)
                </label>
                <TextDateInput
                  value={educationForm.watch("startDate")}
                  onChange={(date) => {
                    educationForm.setValue("startDate", date, { shouldValidate: true });
                    // Clear end date if it's before new start date
                    const endDate = educationForm.getValues('endDate');
                    if (endDate && date && endDate < date) {
                      educationForm.setValue('endDate', null, { shouldValidate: true });
                    }
                    // Trigger validation of both fields
                    educationForm.trigger(["startDate", "endDate"]);
                  }}
                  placeholder="DD-MM-YY"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter start date in DD-MM-YY format (e.g., 01-09-19)
                </p>
                {educationForm.formState.errors.startDate && (
                  <p className="text-sm text-destructive mt-1">
                    {educationForm.formState.errors.startDate.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="endDate" className="text-sm font-medium block mb-1">
                  End Date (DD-MM-YY) - Leave empty if ongoing
                </label>
                <TextDateInput
                  value={educationForm.watch("endDate")}
                  onChange={(date) => {
                    educationForm.setValue("endDate", date, { shouldValidate: true });
                    // Trigger validation
                    educationForm.trigger("endDate");
                  }}
                  placeholder="DD-MM-YY"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter end date in DD-MM-YY format (e.g., 30-05-23)
                </p>
                {educationForm.formState.errors.endDate && (
                  <p className="text-sm text-destructive mt-1">
                    {educationForm.formState.errors.endDate.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="grade" className="text-sm font-medium block mb-1">
                  Grade/CGPA (optional)
                </label>
                <input
                  id="grade"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="3.8 GPA / 85%"
                  {...educationForm.register("grade")}
                />
                {educationForm.formState.errors.grade && (
                  <p className="text-sm text-destructive mt-1">
                    {educationForm.formState.errors.grade.message}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setStep(0)} className="flex-1">
                  Back
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1">
                  Skip
                </Button>
                <Button type="submit" className="flex-1">Continue</Button>
              </div>
            </form>
          </div>
        );
      
      case 2:
        return (
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number*</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="alternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />                <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="example@email.com" 
                          {...field} 
                          disabled={isLoading}
                          onChange={(e) => {
                            field.onChange(e);
                            // Clear any manual errors when the user types
                            if (contactForm.formState.errors.email?.type === "manual") {
                              contactForm.clearErrors("email");
                            }
                          }}
                        />
                        {isLoading && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      This email will be used for your account login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password*</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password*</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={isLoading}>Back</Button>
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Checking...
                    </>
                  ) : "Continue"}
                </Button>
                <Button type="button" variant="secondary" onClick={handleSkip}>Skip</Button>
              </div>
            </form>
          </Form>
        );      case 3:
        return (
          <Form {...workExperienceForm}>
            <form onSubmit={workExperienceForm.handleSubmit(onSubmitWorkExperience)} className="space-y-4">              
              <div>
                <label htmlFor="company" className="text-sm font-medium block mb-1">
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Company Name"
                  value={workExperienceForm.watch("company") || ""}
                  onChange={(e) => workExperienceForm.setValue("company", e.target.value)}
                />
                {workExperienceForm.formState.errors.company && (
                  <p className="text-sm text-destructive mt-1">
                    {workExperienceForm.formState.errors.company.message}
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="position" className="text-sm font-medium block mb-1">
                  Position
                </label>
                <input
                  id="position"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g. Software Developer"
                  value={workExperienceForm.watch("position") || ""}
                  onChange={(e) => workExperienceForm.setValue("position", e.target.value)}
                />
                {workExperienceForm.formState.errors.position && (
                  <p className="text-sm text-destructive mt-1">
                    {workExperienceForm.formState.errors.position.message}
                  </p>
                )}
              </div>
              
              <FormField
                control={workExperienceForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date (DD-MM-YY)</FormLabel>
                    <TextDateInput
                      value={workExperienceForm.watch("startDate")}
                      onChange={(date) => {
                        workExperienceForm.setValue("startDate", date, { shouldValidate: true });
                        // Clear end date if it's before new start date
                        const endDate = workExperienceForm.getValues('endDate');
                        if (endDate && date && endDate < date) {
                          workExperienceForm.setValue('endDate', null, { shouldValidate: true });
                        }
                        // Trigger validation of both fields
                        workExperienceForm.trigger(["startDate", "endDate"]);
                      }}
                      placeholder="DD-MM-YY"
                    />
                    <FormDescription>
                      Enter start date in DD-MM-YY format (e.g., 15-03-21)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={workExperienceForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (DD-MM-YY) - Leave empty if current job</FormLabel>
                    <TextDateInput
                      value={workExperienceForm.watch("endDate")}
                      onChange={(date) => {
                        workExperienceForm.setValue("endDate", date, { shouldValidate: true });
                        // Trigger validation
                        workExperienceForm.trigger("endDate");
                      }}
                      placeholder="DD-MM-YY"
                    />
                    <FormDescription>
                      Enter end date in DD-MM-YY format (e.g., 20-01-23)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <label htmlFor="description" className="text-sm font-medium block mb-1">
                  Description
                </label>
                <input
                  id="description"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Brief description of your role"
                  value={workExperienceForm.watch("description") || ""}
                  onChange={(e) => workExperienceForm.setValue("description", e.target.value)}
                />
                {workExperienceForm.formState.errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {workExperienceForm.formState.errors.description.message}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button type="submit" className="flex-1">Continue</Button>
                <Button type="button" variant="secondary" onClick={handleSkip}>Skip</Button>
              </div>
            </form>
          </Form>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium">Upload Profile Picture</h3>
                <p className="text-sm text-gray-500">Choose a profile picture to personalize your account</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarFallback>
                      <span className="text-2xl">
                        {formData.personal?.name?.substring(0, 2)?.toUpperCase() || "?"}
                      </span>
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <Input
                  type="file"
                  accept="image/*"
                  id="profile-picture"
                  className="max-w-xs"
                  onChange={handleProfileImageChange}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-lg font-medium">Upload Resume</h3>
                <p className="text-sm text-gray-500">Upload your latest resume (PDF or DOC)</p>
              </div>
              
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                id="resume-upload"
                className="max-w-xs mx-auto"
                onChange={handleResumeChange}
              />
              
              {resumeFile && (
                <p className="text-sm text-center text-green-600">
                  {resumeFile.name} uploaded successfully!
                </p>
              )}
            </div>
              <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(3)} disabled={isLoading}>Back</Button>
              <Button type="button" className="flex-1" onClick={handleFinish} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Processing...
                  </>
                ) : "Complete Registration"}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen flex flex-col md:flex-row">      
      {/* Left side - Typewriter animation */}
      <div className={styles['typewriter-container']} style={{ flex: 1 }}>
        <div className={styles['typewriter-wrapper']}>
          <div 
            className={`${styles.typewriter} ${typing ? styles['typewriter-typing'] : styles['typewriter-erasing']}`}
          >
            X-CEED...
          </div>
          <span className={styles['typewriter-cursor']}></span>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="flex flex-1 items-center justify-center p-4 md:p-8 bg-gray-50">
        <Card className={styles['registration-card']}>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl font-bold">Complete Your Profile</CardTitle>
            <CardDescription>
              Please provide the following details to complete your registration
            </CardDescription>
            
            {/* Step indicators */}
            <div className={styles['registration-step-indicator']}>
              {['Personal Information', 'Education', 'Contact', 'Work Experience', 'Upload Files'].map((stepName, index) => (
                <div 
                  key={index}
                  title={stepName} 
                  className={`${styles['step-dot']} ${index === step ? styles.active : ''} ${index < step ? styles.completed : ''}`}
                />
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className={styles['registration-form']}>
              {getStepContent()}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t pt-4">
            <p className="text-xs text-gray-500">
              {step === 0 || step === 1 ? '* Required fields' : ''}
            </p>
            <p className="text-xs text-gray-500">
              Step {step + 1} of 5
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
