# Contact Email Implementation Summary

## Overview
This document explains how the recruiter system knows the applicant's email address and how the new contact email feature works.

## How Recruiters Get Applicant Email Addresses

### Before Contact Email Feature
Previously, recruiters could only send notifications to the applicant's **account email** (the email they used to register on the platform). This email was automatically stored when applications were submitted.

### After Contact Email Feature (Current Implementation)
Now applicants can optionally provide a **separate contact email** for job-related notifications, giving them more control over where they receive updates.

## Email Address Priority System

The system now uses the following priority order for sending notifications:

1. **Contact Email** (if provided by applicant) - HIGHEST PRIORITY
2. **Account Email** (from user registration) - FALLBACK
3. **Error handling** (if neither email is available)

## Implementation Details

### Frontend Changes
- **File**: `src/components/JobApplicationDialog.jsx`
- Added optional "Contact Email" field to job application form
- Field is clearly labeled as optional for status updates
- Form validation ensures proper email format if provided
- Contact email is included in form submission to backend

### Backend Changes

#### 1. Application Submission API
- **File**: `src/pages/api/applications/submit.js`
- Now extracts `contactEmail` from form data
- Stores contact email in `applicantDetails.contactEmail` field
- Database structure:
  ```javascript
  applicantDetails: {
    name: "John Doe",
    email: "john@gmail.com",           // Account email (required)
    contactEmail: "john.work@company.com", // Contact email (optional)
    phone: "+1234567890"
  }
  ```

#### 2. Email Notification Systems
Updated all email sending locations to use contact email when available:

**A. Recruiter Dashboard Email Notifications**
- **File**: `src/app/dashboard/recruiter/jobs/page.js`
- Updated `handleSendEmailNotification` function
- Uses: `applicantData?.contactEmail || applicantData?.email`

**B. Interview Scheduling Notifications**
- **File**: `src/pages/api/applications/schedule-interview.js`
- Updated to use: `application.applicantDetails?.contactEmail || applicant.email`

**C. General Application Notifications**
- **File**: `src/pages/api/applications/notify.js`
- Updated to use: `application.applicantDetails?.contactEmail || applicant.email`

### Email Sending Flow

```
1. Applicant submits job application
   ├── Provides account email (required for login)
   └── Optionally provides contact email (for notifications)

2. Application stored in database with both emails

3. When recruiter sends notification:
   ├── System checks for contact email first
   ├── If contact email exists → use contact email
   ├── If no contact email → use account email
   └── If neither exists → error handling

4. Email sent to selected address
```

## Benefits of This System

### For Applicants
- **Privacy Control**: Can use work email for applications while keeping personal email private
- **Organization**: Job-related emails go to preferred inbox
- **Flexibility**: Can use different emails for different purposes
- **Professional Image**: Can use professional email for communications

### For Recruiters
- **Better Deliverability**: Emails go to applicant's preferred address
- **Professional Communication**: Applicants choose their professional contact method
- **Reduced Bounce Rates**: Applicants provide emails they actively monitor
- **Improved Response Rates**: Notifications reach the right inbox

## Database Schema

### Before
```javascript
applicantDetails: {
  name: "John Doe",
  email: "john@gmail.com",    // Only account email
  phone: "+1234567890"
}
```

### After
```javascript
applicantDetails: {
  name: "John Doe",
  email: "john@gmail.com",           // Account email (always present)
  contactEmail: "john.work@company.com", // Contact email (optional)
  phone: "+1234567890"
}
```

## Testing

### Test File
- **File**: `test-contact-email-functionality.js`
- Tests database structure
- Verifies email selection logic
- Confirms fallback behavior

### Test Results
- ✅ Backend stores contactEmail in applicantDetails
- ✅ Frontend includes contactEmail in form submission  
- ✅ Email notification logic uses contactEmail when available
- ✅ Falls back to account email if contactEmail not provided

## User Experience

### Application Form
```
Job Application Form
├── Resume Upload (required)
├── Cover Letter (required)
├── Additional Message (optional)
└── Contact Email (optional)
    └── "Email address for status updates (optional)"
```

### Email Selection Logic
```javascript
// Code used across all notification systems
const applicantData = selectedCandidate.applicant || selectedCandidate.applicantDetails;
const applicantEmail = applicantData?.contactEmail || applicantData?.email || 'no-email@example.com';
```

## Security & Privacy

### Data Protection
- Contact email is stored securely in MongoDB
- Only authorized recruiters can access applicant emails
- Authentication required for all email sending operations
- Email addresses validated for proper format

### Privacy Features
- Contact email is completely optional
- Applicants control which email receives notifications
- Account email remains private if contact email is provided
- No email addresses are exposed in public APIs

## Future Considerations

### Potential Enhancements
1. **Email Preferences**: Allow applicants to choose notification types per email
2. **Multiple Contact Methods**: Support for multiple contact emails
3. **Email Verification**: Verify contact email addresses before use
4. **Communication History**: Track which emails were sent to which addresses
5. **Unsubscribe Options**: Allow opting out of specific notification types

### Backward Compatibility
- All existing applications continue to work with account email
- No breaking changes to existing functionality
- Gradual adoption as new applications include contact emails

## Summary

The contact email feature solves the question "How does the recruiter know the applicant's email?" by giving applicants control over their notification preferences while maintaining backward compatibility. The system intelligently uses the most appropriate email address for each notification, ensuring effective communication between recruiters and applicants.
