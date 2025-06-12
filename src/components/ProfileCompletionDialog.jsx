'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  GraduationCap, 
  Briefcase,
  Save,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfileCompletionDialog({ isOpen, onClose, missingFields, currentProfile }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    city: '',
    address: '',
    education: [],
    workExperience: []
  });

  useEffect(() => {
    if (isOpen && currentProfile) {
      setFormData({
        phone: currentProfile.phone || '',
        city: currentProfile.city || '',
        address: currentProfile.address || '',
        education: currentProfile.education || [],
        workExperience: currentProfile.workExperience || []
      });
    }
  }, [isOpen, currentProfile]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (arrayName, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName, defaultItem) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      // Combine current profile with new form data
      const updatedProfile = {
        ...currentProfile,
        ...formData
      };

      console.log('Saving profile completion:', updatedProfile);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch('/api/applicant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile)
      });

      const result = await response.json();
      console.log('Profile completion save response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || `Error: ${response.status}`);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving profile completion:', error);
      alert(`Error saving profile: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const needsContact = missingFields.some(field => field.key === 'contact');
  const needsEducation = missingFields.some(field => field.key === 'education');
  const needsExperience = missingFields.some(field => field.key === 'experience');

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-sm text-muted-foreground">
            Let's finish setting up your profile with the information you skipped during registration.
          </p>

          {/* Contact Information */}
          {needsContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter your city"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter your full address"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Education */}
          {needsEducation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Education</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('education', {
                    institution: '',
                    degree: '',
                    field: '',
                    startDate: '',
                    endDate: ''
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Education
                </Button>
              </div>

              {formData.education.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No education added yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Education" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Education {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('education', index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Institution *</Label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => handleArrayFieldChange('education', index, 'institution', e.target.value)}
                            placeholder="University/School name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Degree *</Label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                            placeholder="Bachelor's, Master's, etc."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Field of Study</Label>
                          <Input
                            value={edu.field}
                            onChange={(e) => handleArrayFieldChange('education', index, 'field', e.target.value)}
                            placeholder="Computer Science, etc."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Graduation Year</Label>
                          <Input
                            type="date"
                            value={edu.endDate}
                            onChange={(e) => handleArrayFieldChange('education', index, 'endDate', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Work Experience */}
          {needsExperience && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Work Experience</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('workExperience', {
                    company: '',
                    position: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: ''
                  })}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Experience
                </Button>
              </div>

              {formData.workExperience.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No work experience added yet</p>
                  <p className="text-sm text-muted-foreground">Click "Add Experience" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.workExperience.map((exp, index) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Experience {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeArrayItem('workExperience', index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Company *</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'company', e.target.value)}
                            placeholder="Company name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Position *</Label>
                          <Input
                            value={exp.position}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'position', e.target.value)}
                            placeholder="Job title"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'startDate', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'endDate', e.target.value)}
                            disabled={exp.current}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'current', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm">Currently working here</span>
                        </label>
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleArrayFieldChange('workExperience', index, 'description', e.target.value)}
                          placeholder="Describe your responsibilities and achievements..."
                          className="mt-1 w-full h-20 px-3 py-2 border border-input bg-background text-foreground rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
