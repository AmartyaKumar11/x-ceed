'use client';

import { useState } from 'react';

export default function DebugSkillsTest() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const handleAddSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
      setNewSkill('');
    }
  };
  
  const handleRemoveSkill = (skill) => {
    setSkills(skills.filter(s => s !== skill));
  };
  
  const handleSaveSkills = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    
    try {
      // Create minimal profile data
      const profileData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        skills: skills
      };
      
      // Get token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('Sending profile data:', JSON.stringify(profileData, null, 2));
      console.log('Auth token:', token.slice(0, 20) + '...');
      
      // Make direct fetch request
      const response = await fetch('/api/applicant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      // Get response as text first to debug any non-JSON responses
      const responseText = await response.text();
      let parsedResponse;
      
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        setError(`Invalid JSON response: ${responseText}`);
        return;
      }
      
      setResponse({
        status: response.status,
        body: parsedResponse
      });
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}: ${parsedResponse.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error saving skills:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-4">Skills Update Debug Tool</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Add Skill:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
          />
          <button 
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Current Skills:</label>
        <div className="flex flex-wrap gap-2 border p-3 rounded min-h-[60px]">
          {skills.map(skill => (
            <div key={skill} className="bg-gray-200 px-3 py-1 rounded-full flex items-center">
              {skill}
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="ml-2 text-red-500 font-bold"
              >
                &times;
              </button>
            </div>
          ))}
          {skills.length === 0 && <span className="text-gray-400">No skills added</span>}
        </div>
      </div>
      
      <button
        onClick={handleSaveSkills}
        disabled={loading}
        className="w-full py-2 bg-green-600 text-white rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Skills'}
      </button>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {response && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-2">Response:</h2>
          <div className="bg-gray-100 p-3 rounded overflow-auto max-h-[200px]">
            <p><strong>Status:</strong> {response.status}</p>
            <pre className="text-xs mt-2">{JSON.stringify(response.body, null, 2)}</pre>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p className="font-semibold">Debugging Tips:</p>
        <ul className="list-disc pl-5">
          <li>Make sure you're logged in with a valid token</li>
          <li>Check browser console for detailed error information</li>
          <li>Verify that the API endpoint is working correctly</li>
          <li>Check that all required fields are being sent</li>
        </ul>
      </div>
    </div>
  );
}
