// Seed script to create sample job applications for testing
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';

async function seedApplications() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // First, let's create some sample jobs if they don't exist
    const sampleJobs = [
      {
        _id: new ObjectId(),
        title: 'Senior Frontend Developer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        jobType: 'Full-time',
        salary: '$120,000 - $150,000',
        description: 'Looking for an experienced frontend developer with React expertise...',
        requirements: ['React', 'JavaScript', 'TypeScript', 'Node.js'],
        postedAt: new Date('2025-05-20'),
        status: 'active'
      },
      {
        _id: new ObjectId(),
        title: 'UI/UX Designer',
        company: 'DesignHub',
        location: 'New York, NY',
        jobType: 'Full-time',
        salary: '$90,000 - $110,000',
        description: 'Creative UI/UX designer to join our growing team...',
        requirements: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
        postedAt: new Date('2025-05-18'),
        status: 'active'
      },
      {
        _id: new ObjectId(),
        title: 'React Developer',
        company: 'AppWorks Solutions',
        location: 'Austin, TX',
        jobType: 'Contract',
        salary: '$85,000 - $95,000',
        description: 'React developer for exciting startup projects...',
        requirements: ['React', 'Redux', 'JavaScript', 'CSS'],
        postedAt: new Date('2025-05-15'),
        status: 'active'
      },
      {
        _id: new ObjectId(),
        title: 'Full Stack Developer',
        company: 'InnovateTech',
        location: 'Seattle, WA',
        jobType: 'Full-time',
        salary: '$110,000 - $130,000',
        description: 'Full stack developer with modern tech stack experience...',
        requirements: ['React', 'Node.js', 'MongoDB', 'Express'],
        postedAt: new Date('2025-05-10'),
        status: 'active'
      },
      {
        _id: new ObjectId(),
        title: 'JavaScript Developer',
        company: 'CodeCraft Studios',
        location: 'Remote',
        jobType: 'Full-time',
        salary: '$95,000 - $115,000',
        description: 'JavaScript developer for web applications...',
        requirements: ['JavaScript', 'React', 'Vue.js', 'API Integration'],
        postedAt: new Date('2025-05-05'),
        status: 'active'
      }
    ];

    // Insert jobs first
    console.log('Inserting sample jobs...');
    const jobsResult = await db.collection('jobs').insertMany(sampleJobs);
    console.log(`Inserted ${jobsResult.insertedCount} jobs`);

    // Now create applications for user 'amartya3'
    const sampleApplications = [
      {
        userId: 'amartya3',
        jobId: sampleJobs[0]._id, // Senior Frontend Developer
        status: 'applied',
        appliedAt: new Date('2025-05-28'),
        updatedAt: new Date('2025-05-28'),
        resumeUsed: 'resume_v2.pdf',
        coverLetter: 'Dear Hiring Manager, I am excited to apply for the Senior Frontend Developer position...',
        notes: 'Applied through company website'
      },
      {
        userId: 'amartya3',
        jobId: sampleJobs[1]._id, // UI/UX Designer
        status: 'interview',
        appliedAt: new Date('2025-05-25'),
        updatedAt: new Date('2025-06-10'),
        resumeUsed: 'resume_design_focused.pdf',
        coverLetter: 'I am passionate about creating user-centered designs...',
        notes: 'First round interview completed, waiting for second round'
      },
      {
        userId: 'amartya3',
        jobId: sampleJobs[2]._id, // React Developer
        status: 'reviewing',
        appliedAt: new Date('2025-05-22'),
        updatedAt: new Date('2025-06-01'),
        resumeUsed: 'resume_react.pdf',
        coverLetter: 'My experience with React makes me a perfect fit...',
        notes: 'Technical assessment submitted'
      },
      {
        userId: 'amartya3',
        jobId: sampleJobs[3]._id, // Full Stack Developer
        status: 'rejected',
        appliedAt: new Date('2025-05-15'),
        updatedAt: new Date('2025-06-05'),
        resumeUsed: 'resume_fullstack.pdf',
        coverLetter: 'I have extensive full-stack experience...',
        notes: 'They decided to go with a more senior candidate'
      },
      {
        userId: 'amartya3',
        jobId: sampleJobs[4]._id, // JavaScript Developer
        status: 'applied',
        appliedAt: new Date('2025-05-12'),
        updatedAt: new Date('2025-05-12'),
        resumeUsed: 'resume_js.pdf',
        coverLetter: 'JavaScript has been my primary language for 5+ years...',
        notes: 'Remote position, very interested'
      }
    ];

    console.log('Inserting sample applications...');
    const applicationsResult = await db.collection('applications').insertMany(sampleApplications);
    console.log(`Inserted ${applicationsResult.insertedCount} applications`);

    console.log('✅ Sample data seeding completed successfully!');
    
    // Display the created applications
    console.log('\n📋 Created Applications:');
    for (let i = 0; i < sampleApplications.length; i++) {
      const app = sampleApplications[i];
      const job = sampleJobs[i];
      console.log(`${i + 1}. ${job.title} at ${job.company} - Status: ${app.status} - Applied: ${app.appliedAt.toDateString()}`);
    }

  } catch (error) {
    console.error('Error seeding applications:', error);
  } finally {
    await client.close();
  }
}

// Run the seeding
seedApplications();
