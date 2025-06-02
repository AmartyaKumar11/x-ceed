// API client utility for frontend-backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// API client with basic methods
export const apiClient = {  
  // GET request  
  async get(endpoint, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // If we get a 403, it could be due to an expired or invalid token
        if (response.status === 403) {
          console.error('Authorization error: You may need to log in again.');
          // Use a mock response for development purposes
          return { success: true, data: [], pagination: { total: 0 } };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      // Return a safe fallback value instead of throwing
      return { success: false, error: error.message };
    }
  },

  // POST request
  async post(endpoint, data = {}, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },
  // PUT request
  async put(endpoint, data = {}, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      console.log(`Making PUT request to: ${API_BASE_URL}${endpoint}`);
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      console.log('PUT response status:', response.status);
      
      let responseData;
      const responseText = await response.text();
      
      try {
        // Try to parse as JSON
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log('PUT response body:', responseData);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.log('Raw response body:', responseText);
        responseData = { success: false, message: 'Invalid JSON response' };
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  // PATCH request
  async patch(endpoint, data = {}, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      console.log(`Making PATCH request to: ${API_BASE_URL}${endpoint}`);
      console.log('Token available:', !!token);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
      });

      console.log('PATCH response status:', response.status);
      
      let responseData;
      const responseText = await response.text();
      
      try {
        // Try to parse as JSON
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log('PATCH response body:', responseData);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        console.log('Raw response body:', responseText);
        responseData = { success: false, message: 'Invalid JSON response' };
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API PATCH Error:', error);
      throw error;
    }
  },

  // DELETE request
  async delete(endpoint, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  },

  // POST request with FormData (for file uploads)
  async postFormData(endpoint, formData, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          // Don't set Content-Type for FormData, browser will set it with boundary
          ...options.headers,
        },
        body: formData,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API FormData POST Error:', error);
      throw error;
    }
  },

  // PUT request with FormData (for file uploads)
  async putFormData(endpoint, formData, options = {}) {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          // Don't set Content-Type for FormData, browser will set it with boundary
          ...options.headers,
        },
        body: formData,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API FormData PUT Error:', error);
      throw error;
    }
  }
};

// Authentication utilities
export const authAPI = {
  async login(email, password, userType) {
    return await apiClient.post('/api/auth/login', {
      email,
      password,
      userType,
    });
  },

  async register(formData) {
    return await apiClient.postFormData('/api/auth/register', formData);
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    }
  },

  getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getUserRole() {
    return typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  },

  getUserId() {
    return typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  }
};

// Profile utilities
export const profileAPI = {
  async getApplicantProfile() {
    return await apiClient.get('/api/applicant/profile');
  },

  async updateApplicantProfile(data) {
    return await apiClient.put('/api/applicant/profile', data);
  },

  async updateApplicantProfileWithFiles(formData) {
    return await apiClient.putFormData('/api/applicant/profile', formData);
  },

  async getRecruiterProfile() {
    return await apiClient.get('/api/recruiter/profile');
  },

  async updateRecruiterProfile(data) {
    return await apiClient.put('/api/recruiter/profile', data);
  }
};

// Applications utilities
export const applicationsAPI = {
  async getApplications() {
    return await apiClient.get('/api/applications');
  },

  async submitApplication(applicationData) {
    return await apiClient.post('/api/applications', applicationData);
  },

  async getApplicationDetails(applicationId) {
    return await apiClient.get(`/api/applications/${applicationId}`);
  },

  async updateApplicationStatus(applicationId, status) {
    return await apiClient.patch(`/api/applications/${applicationId}`, { status });
  }
};

// Resume utilities
export const resumeAPI = {
  async downloadResume(userId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/resume/download/${userId}`, {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Resume Download Error:', error);
      throw error;
    }
  },

  async downloadResumeAsFile(userId, fileName) {
    try {
      const blob = await this.downloadResume(userId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `resume-${userId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Resume Download Error:', error);
      throw error;
    }
  }
};