'use client';

import { 
  Briefcase, 
  FileText, 
  User, 
  Star, 
  Bell, 
  CheckCircle 
} from 'lucide-react';
import JobCountBadge from '@/components/JobCountBadge';

export default function ApplicantDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Welcome back</h2>
      
      {/* Stats Cards */}      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = '/dashboard/applicant/jobs'}>
          <div className="p-3 rounded-full bg-blue-50 mr-4">
            <Briefcase className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Available Jobs</p>
            <JobCountBadge />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-green-50 mr-4">
            <FileText className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Applications</p>
            <h3 className="text-2xl font-bold">3</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-amber-50 mr-4">
            <Star className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saved Jobs</p>
            <h3 className="text-2xl font-bold">12</h3>
          </div>
        </div>
      </div>
      
      {/* Main Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Applications */}        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-gray-600" />
            Recent Applications
          </h3>
          <div className="space-y-4">            <div className="p-4 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Application clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium">Senior Frontend Developer</h4>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Applied</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">TechCorp Inc.</p>
              <p className="text-xs text-gray-400 mt-2">Applied on May 28, 2025</p>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Application clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium">UI/UX Designer</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Interview</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">DesignHub</p>
              <p className="text-xs text-gray-400 mt-2">Applied on May 25, 2025</p>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Application clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium">React Developer</h4>
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Reviewing</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">AppWorks Solutions</p>
              <p className="text-xs text-gray-400 mt-2">Applied on May 22, 2025</p>
            </div>
          </div>
        </div>
        
        {/* Profile Completion */}        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-600" />
            Profile Completion
          </h3><div className="mb-4 bg-gray-100 rounded-full h-2.5">
            <div className="bg-black h-2.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
          <p className="text-sm text-gray-500 mb-4">Your profile is 70% complete</p>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Personal information</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Education</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Work experience</span>
            </div>
            <div className="flex items-center opacity-50">
              <Bell className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm">Add your skills</span>
            </div>            <div className="flex items-center opacity-50">
              <Bell className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm">Upload your resume</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
