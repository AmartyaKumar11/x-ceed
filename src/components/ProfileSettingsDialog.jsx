'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap,
  Award,
  Save,
  Trash2,
  Plus
} from 'lucide-react';
import { apiClient } from '../lib/api';
import SkillsEditor from './SkillsEditor';

export default function ProfileSettingsDialog({ isOpen, onClose, userRole = 'applicant' }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    dateOfBirth: '',
    
    // Education
    education: [],
    
    // Work Experience
    workExperience: [],
      // Skills
    skills: [],
    
    // Certifications
    certifications: []
  });

  // Define fetchProfileData function
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/applicant/profile');
      if (response && response.success && response.data) {
        setProfileData({
          firstName: response.data.firstName || '',
          lastName: response.data.lastName || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          city: response.data.city || '',
          state: response.data.state || '',
          zipCode: response.data.zipCode || '',
          dateOfBirth: response.data.dateOfBirth || '',          education: response.data.education || [],
          workExperience: response.data.workExperience || [],
          skills: response.data.skills || [],
          certifications: response.data.certifications || []
        });
      } else {
        // If no profile data exists yet, keep default empty state
        console.log('No profile data found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // For now, just log the error and continue with empty profile data
      // In a real app, you might want to show a user-friendly error message
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile data when dialog opens
  useEffect(() => {
    if (isOpen && userRole === 'applicant') {
      fetchProfileData();
    }
  }, [isOpen, userRole]);
  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving profile data:', JSON.stringify(profileData, null, 2));
      console.log('Auth token exists:', localStorage.getItem('token') ? 'Yes' : 'No');
      
      const response = await apiClient.put('/api/applicant/profile', profileData);
      console.log('Profile save response:', response);
      
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      alert(`Error saving profile: ${error.message || 'Please try again.'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (arrayName, index, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName, defaultItem) => {
    setProfileData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], defaultItem]
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setProfileData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };  const handleSkillsChange = (skillsArray) => {
    setProfileData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User size={16} /> },
    { id: 'education', label: 'Education', icon: <GraduationCap size={16} /> },
    { id: 'experience', label: 'Experience', icon: <Briefcase size={16} /> },
    { id: 'skills', label: 'Skills', icon: <Award size={16} /> },
    { id: 'certifications', label: 'Certifications', icon: <Award size={16} /> },
  ];
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">      <div className="bg-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-border shadow-2xl">        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-border bg-card">
          <h2 className="text-3xl font-bold text-foreground">Profile Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors border border-border hover:border-foreground"
          >
            <X size={24} className="text-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-border bg-card">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}                className={`flex items-center gap-3 px-8 py-5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-foreground border-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent hover:border-border'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[65vh] bg-muted">          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        <User size={16} className="inline mr-2" />
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        <Mail size={16} className="inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">
                        <Phone size={16} className="inline mr-2" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      <MapPin size={16} className="inline mr-2" />
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">City</label>
                      <input
                        type="text"
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">State</label>
                      <input
                        type="text"
                        value={profileData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-3">Zip Code</label>
                      <input
                        type="text"
                        value={profileData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                  </div>                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-3">
                      <Calendar size={16} className="inline mr-2" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}{/* Education Tab */}
              {activeTab === 'education' && (
                <div className="space-y-6">                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Education</h3>
                    <button
                      onClick={() => addArrayItem('education', {
                        institution: '',
                        degree: '',
                        field: '',
                        startDate: '',
                        endDate: '',
                        gpa: ''
                      })}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
                    >
                      <Plus size={16} />
                      Add Education
                    </button>
                  </div>{profileData.education.map((edu, index) => (                    <div key={index} className="border-2 border-border rounded-lg p-6 space-y-6 bg-card">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground text-lg">Education {index + 1}</h4>
                        <button
                          onClick={() => removeArrayItem('education', index)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleArrayFieldChange('education', index, 'institution', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Field of Study</label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) => handleArrayFieldChange('education', index, 'field', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Start Date</label>
                          <input
                            type="date"
                            value={edu.startDate}
                            onChange={(e) => handleArrayFieldChange('education', index, 'startDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">End Date</label>
                          <input
                            type="date"
                            value={edu.endDate}
                            onChange={(e) => handleArrayFieldChange('education', index, 'endDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3">GPA (Optional)</label>
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) => handleArrayFieldChange('education', index, 'gpa', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          placeholder="e.g., 3.8/4.0"
                        />
                      </div>
                    </div>
                  ))}                  {profileData.education.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border-2 border-border">
                      <p className="text-lg">No education records added yet.</p>
                      <p className="text-sm mt-2">Click "Add Education" to get started.</p>
                    </div>
                  )}
                </div>
              )}              {/* Work Experience Tab */}
              {activeTab === 'experience' && (
                <div className="space-y-6">                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Work Experience</h3>
                    <button
                      onClick={() => addArrayItem('workExperience', {
                        company: '',
                        position: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        description: ''
                      })}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
                    >
                      <Plus size={16} />
                      Add Experience
                    </button>
                  </div>{profileData.workExperience.map((exp, index) => (                    <div key={index} className="border-2 border-border rounded-lg p-6 space-y-6 bg-card">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground text-lg">Experience {index + 1}</h4>
                        <button
                          onClick={() => removeArrayItem('workExperience', index)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'company', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Position</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'position', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Start Date</label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'startDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">End Date</label>
                          <input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'endDate', e.target.value)}
                            disabled={exp.current}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all disabled:bg-muted disabled:text-muted-foreground"
                          />
                          <label className="flex items-center mt-3">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => handleArrayFieldChange('workExperience', index, 'current', e.target.checked)}
                              className="mr-3 h-4 w-4 text-primary focus:ring-primary border-border rounded"
                            />
                            <span className="text-sm font-medium text-foreground">Currently working here</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-3">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleArrayFieldChange('workExperience', index, 'description', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          placeholder="Describe your responsibilities and achievements..."
                        />
                      </div>
                    </div>
                  ))}                  {profileData.workExperience.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border-2 border-border">
                      <p className="text-lg">No work experience added yet.</p>
                      <p className="text-sm mt-2">Click "Add Experience" to get started.</p>
                    </div>
                  )}
                </div>
              )}              {/* Skills Tab */}
              {activeTab === 'skills' && (                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-foreground">Skills</h3>
                  <div className="bg-card p-6 rounded-lg border-2 border-border">
                    <SkillsEditor
                      skills={profileData.skills}
                      onChange={handleSkillsChange}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground mt-4 font-medium">
                      Select skills from the suggestions or type to search. These will help match you with relevant job opportunities.
                    </p>
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={async () => {
                          try {
                            // Store button reference so we can update it
                            const btn = document.getElementById('skills-confirm-btn');
                            
                            // Update button state to loading
                            if (btn) {
                              btn.disabled = true;
                              btn.innerHTML = 'Saving...';
                              btn.classList.add('opacity-75');
                            }
                            
                            // Only send required fields to minimize data
                            const minimalData = {
                              firstName: profileData.firstName || 'User',
                              lastName: profileData.lastName || 'Name',
                              email: profileData.email || 'email@example.com',
                              skills: profileData.skills
                            };
                            
                            console.log('Saving minimal profile data:', minimalData);
                            
                            // Use a direct fetch instead of the apiClient to bypass potential issues
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
                              body: JSON.stringify(minimalData)
                            });
                            
                            const result = await response.json();
                            console.log('Skills save result:', result);
                            
                            if (!response.ok) {
                              throw new Error(result.message || `Error: ${response.status}`);
                            }
                            
                            // Show success state
                            if (btn) {
                              btn.innerHTML = 'Skills Saved!';
                              btn.classList.remove('opacity-75');
                              btn.classList.add('bg-green-700');
                              
                              // Reset button after delay
                              setTimeout(() => {
                                if (btn) {
                                  btn.disabled = false;
                                  btn.innerHTML = 'Confirm Skills';
                                  btn.classList.remove('bg-green-700');
                                }
                              }, 2000);
                            }
                          } catch (error) {
                            console.error('Failed to save skills:', error);
                            alert(`Error saving skills: ${error.message}`);
                            
                            // Reset button state on error
                            const btn = document.getElementById('skills-confirm-btn');
                            if (btn) {
                              btn.disabled = false;
                              btn.innerHTML = 'Confirm Skills';
                              btn.classList.remove('opacity-75');
                            }
                          }
                        }}                        id="skills-confirm-btn"
                        className="flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
                      >
                        Confirm Skills
                      </button>
                    </div>
                  </div>
                </div>
              )}{/* Certifications Tab */}
              {activeTab === 'certifications' && (
                <div className="space-y-6">                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Certifications</h3>
                    <button
                      onClick={() => addArrayItem('certifications', {
                        name: '',
                        issuer: '',
                        dateIssued: '',
                        expiryDate: '',
                        credentialId: '',
                        url: ''
                      })}
                      className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
                    >
                      <Plus size={16} />
                      Add Certification
                    </button>
                  </div>{profileData.certifications.map((cert, index) => (                    <div key={index} className="border-2 border-border rounded-lg p-6 space-y-6 bg-card">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-foreground text-lg">Certification {index + 1}</h4>
                        <button
                          onClick={() => removeArrayItem('certifications', index)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Certification Name</label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'name', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Issuing Organization</label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'issuer', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Date Issued</label>
                          <input
                            type="date"
                            value={cert.dateIssued}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'dateIssued', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Expiry Date (Optional)</label>
                          <input
                            type="date"
                            value={cert.expiryDate}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'expiryDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Credential ID (Optional)</label>
                          <input
                            type="text"
                            value={cert.credentialId}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'credentialId', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-3">Credential URL (Optional)</label>
                          <input
                            type="url"
                            value={cert.url}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'url', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}                  {profileData.certifications.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border-2 border-border">
                      <p className="text-lg">No certifications added yet.</p>
                      <p className="text-sm mt-2">Click "Add Certification" to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t-2 border-border bg-card">
          <button
            onClick={onClose}
            className="px-6 py-3 text-foreground border-2 border-border rounded-md hover:bg-muted hover:border-foreground transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
