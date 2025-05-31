import nodemailer from 'nodemailer';

// Create a transporter object using SMTP
// In production, use environment variables for credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email body
 * @param {string} options.html - HTML email body
 * @returns {Promise<Object>} - Nodemailer info object
 */
export async function sendEmail({ to, subject, text, html }) {
  // Skip sending emails in development mode if no credentials are provided
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('Email would be sent in production:');
    console.log({ to, subject, text });
    return { messageId: 'dev-mode-' + Date.now() };
  }

  // Send the email
  const info = await transporter.sendMail({
    from: `"X-CEED Recruitment" <${process.env.EMAIL_USER || 'recruitment@x-ceed.com'}>`,
    to,
    subject,
    text,
    html,
  });

  return info;
}

/**
 * Sends an interview invitation email
 * @param {Object} options - Email options
 * @param {string} options.to - Applicant email address
 * @param {string} options.name - Applicant name
 * @param {string} options.position - Position applied for
 * @param {string} options.company - Company name
 * @param {Date} options.interviewDate - Interview date and time
 * @param {string} options.location - Interview location or meeting link
 * @param {boolean} options.isVirtual - Whether the interview is virtual or in-person
 * @param {string} options.recruiterName - Recruiter name
 * @param {string} options.recruiterEmail - Recruiter email address
 * @param {string} options.recruiterPhone - Recruiter phone number
 * @param {string} options.additionalNotes - Additional notes or instructions
 * @returns {Promise<Object>} - Nodemailer info object
 */
export async function sendInterviewInvitation({
  to,
  name,
  position,
  company,
  interviewDate,
  location,
  isVirtual = false,
  recruiterName,
  recruiterEmail,
  recruiterPhone,
  additionalNotes,
}) {
  const date = new Date(interviewDate);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Interview Invitation for ${position} at ${company}`;

  const text = `
Dear ${name},

We are pleased to inform you that your application for the position of ${position} at ${company} has been successful! We would like to invite you for an interview.

Interview Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- ${isVirtual ? 'Meeting Link' : 'Location'}: ${location}
${additionalNotes ? `\nAdditional Notes:\n${additionalNotes}` : ''}

Please confirm your attendance by replying to this email or contacting ${recruiterName} at ${recruiterEmail} or ${recruiterPhone}.

We look forward to speaking with you!

Best regards,
${recruiterName}
${company} Recruitment Team
  `;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .header {
      background-color: #000;
      color: #fff;
      padding: 15px 20px;
      border-radius: 5px 5px 0 0;
      margin: -20px -20px 20px;
    }
    .interview-details {
      background-color: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #000;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
    }
    .button {
      display: inline-block;
      background-color: #000;
      color: #fff;
      padding: 10px 20px;
      margin: 15px 0;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Interview Invitation</h2>
    </div>
    
    <p>Dear ${name},</p>
    
    <p>We are pleased to inform you that your application for the position of <strong>${position}</strong> at <strong>${company}</strong> has been successful! We would like to invite you for an interview.</p>
    
    <div class="interview-details">
      <h3>Interview Details:</h3>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime}</p>
      <p><strong>${isVirtual ? 'Meeting Link' : 'Location'}:</strong> ${location}</p>
      ${additionalNotes ? `<p><strong>Additional Notes:</strong><br>${additionalNotes}</p>` : ''}
    </div>
    
    <p>Please confirm your attendance by replying to this email or contacting ${recruiterName} at <a href="mailto:${recruiterEmail}">${recruiterEmail}</a> or <a href="tel:${recruiterPhone}">${recruiterPhone}</a>.</p>
    
    ${isVirtual ? `<a href="${location}" class="button">Join Interview</a>` : ''}
    
    <p>We look forward to speaking with you!</p>
    
    <p>Best regards,<br>
    ${recruiterName}<br>
    ${company} Recruitment Team</p>
    
    <div class="footer">
      <p>This email was sent by X-CEED Recruitment Platform.</p>
    </div>
  </div>
</body>
</html>
  `;

  return await sendEmail({ to, subject, text, html });
}
