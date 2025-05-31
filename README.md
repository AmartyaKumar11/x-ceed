# X-CEED Recruitment Platform

X-CEED is a comprehensive online recruitment platform designed to streamline the hiring process for both recruiters and applicants. This README provides instructions for setting up and using the platform.

## Features

### For Applicants
- User registration and authentication
- Profile creation with personal info, education, work experience
- Resume upload functionality
- Job search and application
- Application status tracking
- Interview scheduling

### For Recruiters
- Recruiter registration and authentication
- Job posting management
- Candidate application review
- Resume download
- Interview scheduling and notifications
- Applicant acceptance/rejection functionality

## Getting Started

### Prerequisites
- Node.js 16.x or later
- MongoDB instance (local or cloud-based)
- Email service credentials (for production)

### Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3002

# Email (for production)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# File Upload
UPLOAD_DIR=./public/uploads
```

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Visit `http://localhost:3002` in your browser

## Project Structure

- `/src/app`: Next.js application pages and layouts
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and services
- `/src/pages/api`: API endpoints
- `/public`: Static assets and uploaded files

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate user
- `POST /api/auth/logout`: End user session
- `GET /api/auth/me`: Get current user details
- `POST /api/auth/request-password-reset`: Request password reset
- `POST /api/auth/reset-password`: Reset password

### File Uploads
- `POST /api/upload`: Generic file upload endpoint
- `POST /api/upload/resume`: Resume upload for applicants
- `POST /api/upload/profile-image`: Profile image upload

### Jobs
- `GET /api/jobs`: List all jobs with filters
- `POST /api/jobs`: Create a new job posting (recruiter only)
- `GET /api/jobs/[id]`: Get job details
- `PUT /api/jobs/[id]`: Update job posting (recruiter only)
- `DELETE /api/jobs/[id]`: Delete job posting (recruiter only)

### Applications
- `GET /api/applications`: Get applications (filtered by user type)
- `POST /api/applications`: Submit a new application (applicant only)
- `GET /api/applications/[id]`: Get application details
- `PATCH /api/applications/[id]`: Update application status (recruiter only)
- `DELETE /api/applications/[id]`: Delete application (under certain conditions)
- `POST /api/applications/send-interview-invite`: Send interview invitation

## User Interface

### Recruiter Interface
- Dashboard with job posting metrics
- Candidate management with application details
- Interview scheduling capabilities
- Resume downloads

### Applicant Interface
- User profile management
- Job search and application
- Application status tracking
- Interview scheduling and notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License
