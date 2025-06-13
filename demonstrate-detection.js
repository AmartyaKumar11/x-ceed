// Test script to demonstrate PDF vs Text detection and parsing
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
const DB_NAME = 'x-ceed-db';

async function demonstrateDetectionLogic() {
  let client;
  
  try {
    console.log('🔍 Connecting to MongoDB to demonstrate detection logic...\n');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    
    // Get saved job
    const savedJobs = await db.collection('savedJobs').find({}).toArray();
    const savedJob = savedJobs[0];
    
    // Get job details
    let jobQuery;
    if (typeof savedJob.jobId === 'string') {
      try {
        jobQuery = { _id: new ObjectId(savedJob.jobId) };
      } catch (e) {
        jobQuery = { _id: savedJob.jobId };
      }
    } else {
      jobQuery = { _id: savedJob.jobId };
    }
    
    const job = await db.collection('jobs').findOne(jobQuery);
    
    console.log('=' * 80);
    console.log('📋 JOB DESCRIPTION DETECTION DEMO');
    console.log('=' * 80);
    
    // Simulate the detection logic
    console.log('🔍 STEP 1: Checking job description format...\n');
    
    console.log(`Job Title: ${job.title}`);
    console.log(`Description Type: ${job.jobDescriptionType || 'text'}`);
    console.log(`Text Description: "${job.description}"`);
    console.log(`PDF File Path: ${job.jobDescriptionFile || 'None'}`);
    
    // Detection logic
    const hasTextDescription = job.description && job.description.trim().length > 0;
    const hasPDFFile = job.jobDescriptionFile && job.jobDescriptionFile.trim().length > 0;
    
    console.log('\n🔍 STEP 2: Detection Results...\n');
    console.log(`Has Text Description: ${hasTextDescription ? '✅ YES' : '❌ NO'} (${job.description?.length || 0} characters)`);
    console.log(`Has PDF File: ${hasPDFFile ? '✅ YES' : '❌ NO'} ${hasPDFFile ? `(${job.jobDescriptionFile})` : ''}`);
    
    console.log('\n🤖 STEP 3: Parsing Decision...\n');
    
    if (hasPDFFile) {
      console.log('📄 DECISION: PDF file detected!');
      console.log('   → Will extract PDF content first');
      console.log('   → PDF content will be sent to Gemini AI');
      console.log('   → Text description (if any) will be ignored');
      console.log(`   → PDF Path: ${job.jobDescriptionFile}`);
      
      // Simulate API call structure
      console.log('\n📡 SIMULATED API CALL:');
      console.log('POST /api/parse-job-description');
      console.log(JSON.stringify({
        jobDescription: job.description,
        jobTitle: job.title,
        companyName: job.companyName || 'Not specified',
        jobId: job._id.toString(),
        jobDescriptionFile: job.jobDescriptionFile  // ← This triggers PDF extraction
      }, null, 2));
      
    } else if (hasTextDescription) {
      console.log('📝 DECISION: Text description only');
      console.log('   → Will send text directly to Gemini AI');
      console.log('   → No PDF extraction needed');
      console.log(`   → Text content: "${job.description.substring(0, 100)}..."`);
      
    } else {
      console.log('❌ DECISION: No content available');
      console.log('   → Cannot parse job description');
      console.log('   → Will return error to user');
    }
    
    console.log('\n🧠 STEP 4: What happens in the parsing API...\n');
    
    if (hasPDFFile) {
      console.log('1. 📄 PDF Detection: jobDescriptionFile exists');
      console.log('2. 🔧 PDF Extraction: Call /api/extract-pdf');
      console.log('3. 📝 Text Extraction: Convert PDF to text');
      console.log('4. 🤖 AI Processing: Send extracted text to Gemini');
      console.log('5. 📊 Skill Parsing: Extract structured skills data');
      console.log('6. ✅ Return: Parsed skills to prep plan page');
    } else {
      console.log('1. 📝 Text Detection: Use jobDescription directly');
      console.log('2. 🤖 AI Processing: Send text to Gemini');
      console.log('3. 📊 Skill Parsing: Extract structured skills data');
      console.log('4. ✅ Return: Parsed skills to prep plan page');
    }
    
    console.log('\n' + '=' * 80);
    console.log('✅ DETECTION LOGIC DEMONSTRATED!');
    console.log('=' * 80);
    console.log('The system automatically detects and handles both:');
    console.log('📄 PDF job descriptions (recruiter uploaded)');
    console.log('📝 Text job descriptions (typed in form)');
    console.log('🤖 Both formats get parsed by your Gemini API key!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the demonstration
demonstrateDetectionLogic();
