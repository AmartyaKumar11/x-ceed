// This file defines the user schema that will be used across the application
// for both applicants and recruiters

const userSchema = {
  // Common fields for all user types
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['applicant', 'recruiter'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Applicant specific fields
  personal: {
    name: String,
    address: String,
    sex: String,
    dob: Date,
    profileImage: String,
  },
  education: [{
    degree: String,
    institution: String,
    address: String,
    startDate: Date,
    endDate: Date,
    grade: String,
  }],
  contact: {
    phone: String,
    alternatePhone: String,
    email: String,
  },
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String,
  }],
  resume: String, // Path to resume file
  
  // Recruiter specific fields
  recruiter: {
    name: String,
    recruiterId: String,
    institutionName: String,
    address: String,
  }
};

export default userSchema;
