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
      await apiClient.put('/api/applicant/profile', profileData);
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
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
  };
  const handleSkillsChange = (value) => {
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill);
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-gray-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-white">
          <h2 className="text-3xl font-bold text-black">Profile Settings</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-300 hover:border-black"
          >
            <X size={24} className="text-black" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b-2 border-gray-200 bg-white">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'text-black border-black bg-gray-50'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50 border-transparent hover:border-gray-300'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-black' : 'text-gray-600'}>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[65vh] bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
            </div>
          ) : (
            <>
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">
                        <User size={16} className="inline mr-2" />
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                  </div>                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">
                        <Mail size={16} className="inline mr-2" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">
                        <Phone size={16} className="inline mr-2" />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      <MapPin size={16} className="inline mr-2" />
                      Address
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">City</label>
                      <input
                        type="text"
                        value={profileData.city}                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">State</label>
                      <input
                        type="text"
                        value={profileData.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-3">Zip Code</label>
                      <input
                        type="text"
                        value={profileData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      <Calendar size={16} className="inline mr-2" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                    />                </div>
                </div>
              )}{/* Education Tab */}
              {activeTab === 'education' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-black">Education</h3>
                    <button
                      onClick={() => addArrayItem('education', {
                        institution: '',
                        degree: '',
                        field: '',
                        startDate: '',
                        endDate: '',
                        gpa: ''
                      })}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
                    >
                      <Plus size={16} />
                      Add Education
                    </button>
                  </div>                  {profileData.education.map((edu, index) => (
                    <div key={index} className="border-2 border-gray-300 rounded-lg p-6 space-y-6 bg-white">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-black text-lg">Education {index + 1}</h4>
                        <button
                          onClick={() => removeArrayItem('education', index)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Institution</label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) => handleArrayFieldChange('education', index, 'institution', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Degree</label>
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Field of Study</label>
                          <input
                            type="text"
                            value={edu.field}
                            onChange={(e) => handleArrayFieldChange('education', index, 'field', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Start Date</label>
                          <input
                            type="date"
                            value={edu.startDate}
                            onChange={(e) => handleArrayFieldChange('education', index, 'startDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">End Date</label>
                          <input
                            type="date"
                            value={edu.endDate}
                            onChange={(e) => handleArrayFieldChange('education', index, 'endDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-black mb-3">GPA (Optional)</label>
                        <input
                          type="text"
                          value={edu.gpa}
                          onChange={(e) => handleArrayFieldChange('education', index, 'gpa', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          placeholder="e.g., 3.8/4.0"
                        />
                      </div>
                    </div>
                  ))}                  {profileData.education.length === 0 && (
                    <div className="text-center py-12 text-gray-600 bg-white rounded-lg border-2 border-gray-200">
                      <p className="text-lg">No education records added yet.</p>
                      <p className="text-sm mt-2">Click "Add Education" to get started.</p>
                    </div>
                  )}
                </div>
              )}              {/* Work Experience Tab */}
              {activeTab === 'experience' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-black">Work Experience</h3>
                    <button
                      onClick={() => addArrayItem('workExperience', {
                        company: '',
                        position: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        description: ''
                      })}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
                    >
                      <Plus size={16} />
                      Add Experience
                    </button>
                  </div>                  {profileData.workExperience.map((exp, index) => (
                    <div key={index} className="border-2 border-gray-300 rounded-lg p-6 space-y-6 bg-white">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-black text-lg">Experience {index + 1}</h4>
                        <button
                          onClick={() => removeArrayItem('workExperience', index)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Company</label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'company', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Position</label>
                          <input
                            type="text"
                            value={exp.position}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'position', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Start Date</label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'startDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">End Date</label>
                          <input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) => handleArrayFieldChange('workExperience', index, 'endDate', e.target.value)}
                            disabled={exp.current}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all disabled:bg-gray-100 disabled:text-gray-500"
                          />
                          <label className="flex items-center mt-3">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => handleArrayFieldChange('workExperience', index, 'current', e.target.checked)}
                              className="mr-3 h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-black">Currently working here</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-black mb-3">Description</label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => handleArrayFieldChange('workExperience', index, 'description', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          placeholder="Describe your responsibilities and achievements..."
                        />
                      </div>
                    </div>
                  ))}                  {profileData.workExperience.length === 0 && (
                    <div className="text-center py-12 text-gray-600 bg-white rounded-lg border-2 border-gray-200">
                      <p className="text-lg">No work experience added yet.</p>
                      <p className="text-sm mt-2">Click "Add Experience" to get started.</p>
                    </div>
                  )}
                </div>
              )}              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-black">Skills</h3>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-3">
                      Skills (comma-separated)
                    </label>
                    <textarea
                      value={profileData.skills.join(', ')}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                      placeholder="e.g., JavaScript, React, Node.js, Python, SQL..."
                    />
                    <p className="text-sm text-gray-600 mt-3 font-medium">
                      Separate each skill with a comma. These will help match you with relevant job opportunities.
                    </p>
                  </div>

                  {profileData.skills.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-black mb-4">Current Skills:</h4>
                      <div className="flex flex-wrap gap-3">
                        {profileData.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-black text-white rounded-full text-sm font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}              {/* Certifications Tab */}
              {activeTab === 'certifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-black">Certifications</h3>
                    <button
                      onClick={() => addArrayItem('certifications', {
                        name: '',
                        issuer: '',
                        dateIssued: '',
                        expiryDate: '',
                        credentialId: '',
                        url: ''
                      })}
                      className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors font-semibold"
                    >
                      <Plus size={16} />
                      Add Certification
                    </button>
                  </div>                  {profileData.certifications.map((cert, index) => (
                    <div key={index} className="border-2 border-gray-300 rounded-lg p-6 space-y-6 bg-white">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-black text-lg">Certification {index + 1}</h4>
                        <button
                          onClick={() => removeArrayItem('certifications', index)}
                          className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Certification Name</label>
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'name', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Issuing Organization</label>
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'issuer', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Date Issued</label>
                          <input
                            type="date"
                            value={cert.dateIssued}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'dateIssued', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Expiry Date (Optional)</label>
                          <input
                            type="date"
                            value={cert.expiryDate}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'expiryDate', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Credential ID (Optional)</label>
                          <input
                            type="text"
                            value={cert.credentialId}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'credentialId', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-3">Credential URL (Optional)</label>
                          <input
                            type="url"
                            value={cert.url}
                            onChange={(e) => handleArrayFieldChange('certifications', index, 'url', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}                  {profileData.certifications.length === 0 && (
                    <div className="text-center py-12 text-gray-600 bg-white rounded-lg border-2 border-gray-200">
                      <p className="text-lg">No certifications added yet.</p>
                      <p className="text-sm mt-2">Click "Add Certification" to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t-2 border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-3 text-black border-2 border-gray-300 rounded-md hover:bg-gray-100 hover:border-black transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
