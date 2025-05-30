'use client';

import { 
  Briefcase, 
  Users, 
  FileCheck, 
  PieChart,
  LineChart,
  CheckCheck,
  Edit
} from 'lucide-react';

export default function RecruiterDashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-6">Recruitment Overview</h2>
      
      {/* Stats Cards */}      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-indigo-50 mr-4">
            <Briefcase className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Jobs</p>
            <h3 className="text-2xl font-bold">8</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-purple-50 mr-4">
            <FileCheck className="h-6 w-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Applications</p>
            <h3 className="text-2xl font-bold">42</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-cyan-50 mr-4">
            <Users className="h-6 w-6 text-cyan-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Candidates</p>
            <h3 className="text-2xl font-bold">16</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 flex items-start shadow-md hover:shadow-lg transition-shadow">
          <div className="p-3 rounded-full bg-rose-50 mr-4">
            <PieChart className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Interviews</p>
            <h3 className="text-2xl font-bold">12</h3>
          </div>
        </div>
      </div>
      
      {/* Main Content Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Job Postings */}        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-gray-600" />
            Current Job Postings
          </h3>
          <div className="space-y-4">            <div className="p-4 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Job clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium">Senior Frontend Developer</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Full-time • Remote • $120K - $150K</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">Posted on May 15, 2025 • 12 applicants</p>
                <button className="text-xs text-blue-600 flex items-center">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </button>
              </div>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Job clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium">UI/UX Designer</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Full-time • On-site • $90K - $110K</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">Posted on May 18, 2025 • 8 applicants</p>
                <button className="text-xs text-blue-600 flex items-center">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </button>
              </div>
            </div>
            
            <div className="p-4 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Job clicked')}>
              <div className="flex justify-between">
                <h4 className="font-medium">Product Manager</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Full-time • Hybrid • $130K - $160K</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-400">Posted on May 20, 2025 • 5 applicants</p>
                <button className="text-xs text-blue-600 flex items-center">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Interviews */}        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-md">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <LineChart className="h-5 w-5 mr-2 text-gray-600" />
            Upcoming Interviews
          </h3>
            <div className="space-y-3">
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">John Smith</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Frontend Developer • Today, 2:00 PM</p>
            </div>
            
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">Sarah Johnson</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">UI Designer • Today, 4:30 PM</p>
            </div>
            
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">David Lee</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Product Manager • Tomorrow, 10:00 AM</p>
            </div>
            
            <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => console.log('Interview clicked')}>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <h4 className="font-medium text-sm">Emily Chen</h4>
              </div>
              <p className="text-xs text-gray-500 mt-1">Backend Developer • Tomorrow, 1:30 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
