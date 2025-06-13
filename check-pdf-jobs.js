// Script to check for jobs with PDF job descriptions and parse them
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const DB_NAME = 'x-ceed-db';

async function checkJobsWithPDFs() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    // Find all jobs with PDF job descriptions
    console.log('📋 Looking for jobs with PDF job descriptions...\n');
    
    const jobsWithPDFs = await db.collection('jobs').find({
      jobDescriptionType: 'pdf',
      jobDescriptionFile: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Found ${jobsWithPDFs.length} jobs with PDF job descriptions:`);
    console.log('='.repeat(60));
    
    if (jobsWithPDFs.length === 0) {
      console.log('❌ No jobs with PDF job descriptions found.');
      console.log('   Let me check all jobs to see what we have...\n');
      
      const allJobs = await db.collection('jobs').find({}).limit(10).toArray();
      console.log(`📊 Total jobs in database: ${await db.collection('jobs').countDocuments()}`);
      
      if (allJobs.length > 0) {
        console.log('\n🎯 Sample jobs found:');
        allJobs.forEach((job, index) => {
          console.log(`\n${index + 1}. ${job.title} at ${job.companyName || 'Company'}`);
          console.log(`   ID: ${job._id}`);
          console.log(`   Job Description Type: ${job.jobDescriptionType || 'text'}`);
          console.log(`   PDF File: ${job.jobDescriptionFile || 'None'}`);
          console.log(`   Description Length: ${job.description?.length || 0} characters`);
          console.log(`   Status: ${job.status || 'unknown'}`);
        });
      }
      
      // Let's also check saved jobs
      console.log('\n🔖 Checking saved jobs...');
      const savedJobs = await db.collection('savedJobs').find({}).limit(5).toArray();
      console.log(`Found ${savedJobs.length} saved jobs.`);
      
      if (savedJobs.length > 0) {
        console.log('\n📌 Sample saved jobs:');
        for (const saved of savedJobs) {
          const job = await db.collection('jobs').findOne({ _id: saved.jobId });
          if (job) {
            console.log(`\n- ${job.title} (Saved by applicant: ${saved.applicantId})`);
            console.log(`  Job Description Type: ${job.jobDescriptionType || 'text'}`);
            console.log(`  PDF File: ${job.jobDescriptionFile || 'None'}`);
            console.log(`  Description: ${job.description?.substring(0, 100) || 'No description'}...`);
          }
        }
      }
    } else {
      // Process each job with PDF
      for (let i = 0; i < jobsWithPDFs.length; i++) {
        const job = jobsWithPDFs[i];
        console.log(`\n${i + 1}. ${job.title} at ${job.companyName || 'Company'}`);
        console.log(`   Job ID: ${job._id}`);
        console.log(`   Recruiter ID: ${job.recruiterId}`);
        console.log(`   PDF File: ${job.jobDescriptionFile}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Created: ${job.createdAt}`);
        
        // Check if this job is saved by any applicant
        const savedBy = await db.collection('savedJobs').find({ jobId: job._id.toString() }).toArray();
        if (savedBy.length > 0) {
          console.log(`   📌 Saved by ${savedBy.length} applicant(s)`);
        }
        
        // Try to parse this job's PDF
        console.log('\n   🤖 Parsing job description with AI...');
        try {
          const parseResult = await parseJobWithAI(job);
          if (parseResult.success) {
            console.log('   ✅ Successfully parsed with AI!');
            console.log(`   🎯 Critical Skills: ${parseResult.data.requiredSkills?.critical?.join(', ') || 'None identified'}`);
            console.log(`   💻 Technical Skills: ${parseResult.data.requiredSkills?.technical?.slice(0, 3).join(', ') || 'None identified'}...`);
            console.log(`   📚 Must Learn: ${parseResult.data.learningPath?.mustLearn?.slice(0, 2).join(', ') || 'None identified'}...`);
            console.log(`   ⏱️  Estimated Learning Time: ${parseResult.data.learningPath?.estimatedTimeWeeks || 'N/A'} weeks`);
          } else {
            console.log(`   ❌ Failed to parse: ${parseResult.error}`);
          }
        } catch (error) {
          console.log(`   ❌ Error parsing: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function parseJobWithAI(job) {
  try {
    // Call the parsing API
    const response = await fetch('http://localhost:3000/api/parse-job-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobDescription: job.description || '',
        jobTitle: job.title || '',
        companyName: job.companyName || '',
        jobId: job._id.toString(),
        jobDescriptionFile: job.jobDescriptionFile
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorText = await response.text();
      return { success: false, error: `API Error: ${response.status} - ${errorText}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the check
checkJobsWithPDFs();
