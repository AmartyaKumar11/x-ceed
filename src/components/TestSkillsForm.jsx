// Simple form to test profile skills update
import { useState, useEffect } from 'react';
import { apiClient } from './lib/api';

export default function TestSkillsForm() {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch current skills
  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await apiClient.get('/api/applicant/profile');
        if (response.success && response.data) {
          setSkills(response.data.skills || []);
        }
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    }
    
    fetchSkills();
  }, []);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Only send minimal data required
      const profileData = {
        firstName: 'Test', // These fields are required by the API validation
        lastName: 'User',
        email: 'test@example.com',
        skills: skills
      };
      
      console.log('Saving skills:', skills);
      const response = await apiClient.put('/api/applicant/profile', profileData);
      
      setMessage('Skills saved successfully!');
      console.log('Save response:', response);
    } catch (error) {
      console.error('Error saving skills:', error);
      setMessage(`Error: ${error.message || 'Failed to save skills'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border-2 border-border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Test Skills Update</h2>
      
      <div className="mb-4">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          placeholder="Add a skill"
          className="px-4 py-2 border-2 border-border rounded-md mr-2"
          onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
        />
        <button 
          onClick={handleAddSkill}
          className="px-4 py-2 bg-black text-white rounded-md"
        >
          Add
        </button>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Current Skills:</h3>
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <div key={skill} className="bg-black text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {skill}
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="ml-2 text-white hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
          {skills.length === 0 && <p className="text-muted-foreground">No skills added</p>}
        </div>
      </div>
      
      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-4 py-2 bg-black text-white rounded-md disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Skills'}
      </button>
      
      {message && (
        <div className={`mt-4 p-3 rounded-md ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
}
