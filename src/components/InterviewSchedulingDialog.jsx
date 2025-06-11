'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, VideoIcon, MessageSquare, Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SimpleSelect from "@/components/ui/simple-select";

export default function InterviewSchedulingDialog({ 
  isOpen, 
  onClose, 
  candidate, 
  job, 
  onScheduleInterview 
}) {  const [formData, setFormData] = useState({
    day: '',
    month: '',
    year: '',
    hour: '',
    minute: '',
    ampm: '',
    location: '',
    isVirtual: false,
    meetingLink: '',
    additionalNotes: '',
    duration: '60' // Default to 60 minutes
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Debug logging for dialog state
  useEffect(() => {
    if (isOpen) {
      console.log('Interview dialog opened for candidate:', candidate);
      console.log('Job details:', job);
    }
  }, [isOpen, candidate, job]);

  // Get candidate name safely
  const getCandidateName = () => {
    if (candidate?.applicant?.firstName && candidate?.applicant?.lastName) {
      return `${candidate.applicant.firstName} ${candidate.applicant.lastName}`;
    }
    if (candidate?.applicantDetails?.personal?.name) {
      return candidate.applicantDetails.personal.name;
    }
    return 'Candidate';
  };

  // Get candidate email safely
  const getCandidateEmail = () => {
    return candidate?.applicant?.email || candidate?.applicantDetails?.email || 'No email available';
  };
  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value); // Debug logging
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  const validateForm = () => {
    const newErrors = {};

    // Validate date components
    if (!formData.day || !formData.month || !formData.year) {
      newErrors.date = 'Please select day, month, and year';
    } else {
      // Check if date is valid and in the future
      const selectedDate = new Date(
        parseInt(formData.year),
        parseInt(formData.month) - 1,
        parseInt(formData.day)
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (isNaN(selectedDate.getTime())) {
        newErrors.date = 'Please select a valid date';
      } else if (selectedDate < today) {
        newErrors.date = 'Interview date must be in the future';
      }
    }

    // Validate time components
    if (!formData.hour || !formData.minute || !formData.ampm) {
      newErrors.time = 'Please select hour, minute, and AM/PM';
    }

    if (formData.isVirtual) {
      if (!formData.meetingLink || !formData.meetingLink.trim()) {
        newErrors.meetingLink = 'Meeting link is required for virtual interviews';
      } else if (!isValidUrl(formData.meetingLink)) {
        newErrors.meetingLink = 'Please enter a valid meeting link';
      }
    } else {
      if (!formData.location || !formData.location.trim()) {
        newErrors.location = 'Interview location is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
      try {
      // Combine date and time
      const hour24 = formData.ampm === 'PM' && formData.hour !== '12' 
        ? parseInt(formData.hour) + 12 
        : formData.ampm === 'AM' && formData.hour === '12' 
        ? 0 
        : parseInt(formData.hour);

      const interviewDateTime = new Date(
        parseInt(formData.year),
        parseInt(formData.month) - 1,
        parseInt(formData.day),
        hour24,
        parseInt(formData.minute),
        0,
        0
      );      const interviewData = {
        applicationId: candidate._id,
        interviewDate: interviewDateTime.toISOString(),
        location: formData.isVirtual ? formData.meetingLink : formData.location,
        isVirtual: formData.isVirtual,
        duration: parseInt(formData.duration),
        additionalNotes: formData.additionalNotes,
        candidateName: getCandidateName(),
        candidateEmail: getCandidateEmail(),
        jobTitle: job?.title || 'Position',
        companyName: job?.companyName || job?.company || 'Company'
      };

      console.log('🔍 Interview data being sent:', interviewData);
      console.log('🔍 Candidate object:', candidate);
      console.log('🔍 Application ID:', candidate._id);

      await onScheduleInterview(interviewData);
      
      // Reset form
      setFormData({
        day: '',
        month: '',
        year: '',
        hour: '',
        minute: '',
        ampm: '',
        location: '',
        isVirtual: false,
        meetingLink: '',
        additionalNotes: '',
        duration: '60'
      });
      
      onClose();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      setErrors({ submit: error.message || 'Failed to schedule interview. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  // Helper functions for dropdown options
  const getDayOptions = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push({ value: i.toString(), label: i.toString() });
    }
    return days;
  };

  const getMonthOptions = () => [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear + i;
      years.push({ value: year.toString(), label: year.toString() });
    }
    return years;
  };

  const getHourOptions = () => {
    const hours = [];
    for (let i = 1; i <= 12; i++) {
      hours.push({ value: i.toString(), label: i.toString() });
    }
    return hours;
  };

  const getMinuteOptions = () => [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' }
  ];

  const getDurationOptions = () => [
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '180', label: '3 hours' }
  ];

  if (!isOpen) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            Schedule Interview
          </DialogTitle>
          <DialogDescription>
            Schedule an interview with <strong>{getCandidateName()}</strong> for the{' '}
            <strong>{job?.title}</strong> position
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-6">
          {/* Candidate Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Candidate Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">{getCandidateName()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{getCandidateEmail()}</span>
              </div>
            </div>
          </div>          {/* Date Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Interview Date *
            </Label>            <div className="grid grid-cols-3 gap-2">
              {/* Day */}
              <SimpleSelect
                value={formData.day}
                onValueChange={(value) => handleInputChange('day', value)}
                placeholder="Day"
                options={getDayOptions()}
                className="w-full"
              />

              {/* Month */}
              <SimpleSelect
                value={formData.month}
                onValueChange={(value) => handleInputChange('month', value)}
                placeholder="Month"
                options={getMonthOptions()}
                className="w-full"
              />

              {/* Year */}
              <SimpleSelect
                value={formData.year}
                onValueChange={(value) => handleInputChange('year', value)}
                placeholder="Year"
                options={getYearOptions()}
                className="w-full"
              />
            </div>
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Interview Time *
            </Label>            <div className="grid grid-cols-3 gap-2">
              {/* Hour */}
              <SimpleSelect
                value={formData.hour}
                onValueChange={(value) => handleInputChange('hour', value)}
                placeholder="Hour"
                options={getHourOptions()}
                className="w-full"
              />

              {/* Minute */}
              <SimpleSelect
                value={formData.minute}
                onValueChange={(value) => handleInputChange('minute', value)}
                placeholder="Min"
                options={getMinuteOptions()}
                className="w-full"
              />

              {/* AM/PM */}
              <SimpleSelect
                value={formData.ampm}
                onValueChange={(value) => handleInputChange('ampm', value)}
                placeholder="AM/PM"
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' }
                ]}
                className="w-full"
              />
            </div>
            {errors.time && (
              <p className="text-sm text-destructive">{errors.time}</p>
            )}
          </div>          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Expected Duration</Label>
            <SimpleSelect
              value={formData.duration}
              onValueChange={(value) => handleInputChange('duration', value)}
              placeholder="Select duration"
              options={getDurationOptions()}
              className="w-full"
            />
          </div>

          {/* Interview Type */}
          <div className="space-y-3">
            <Label>Interview Type *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="interviewType"
                  checked={!formData.isVirtual}
                  onChange={() => handleInputChange('isVirtual', false)}
                  className="text-primary"
                />
                <MapPin className="h-4 w-4" />
                <span>In-person</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="interviewType"
                  checked={formData.isVirtual}
                  onChange={() => handleInputChange('isVirtual', true)}
                  className="text-primary"
                />
                <VideoIcon className="h-4 w-4" />
                <span>Virtual</span>
              </label>
            </div>
          </div>

          {/* Location/Meeting Link */}
          {formData.isVirtual ? (
            <div className="space-y-2">
              <Label htmlFor="meetingLink" className="flex items-center gap-2">
                <VideoIcon className="h-4 w-4" />
                Meeting Link *
              </Label>
              <Input
                id="meetingLink"
                type="url"
                value={formData.meetingLink}
                onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              />
              {errors.meetingLink && (
                <p className="text-sm text-destructive">{errors.meetingLink}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Interview Location *
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Office address or meeting room"
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location}</p>
              )}
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.additionalNotes}
              onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
              placeholder="Any additional information for the candidate (preparation materials, what to bring, etc.)"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
              {errors.submit}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Schedule Interview
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
