// Script to fetch and display job details by ID
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function showJobDetails(jobId) {
    console.log('🔍 Fetching Job Details');
    console.log('=' .repeat(50));

    let client;
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
        let dbName;
        
        if (mongoUri.includes('/') && !mongoUri.endsWith('/')) {
            const uriParts = mongoUri.split('/');
            dbName = uriParts[uriParts.length - 1];
        } else {
            dbName = 'x-ceed-db';
        }
        
        console.log(`🔗 Connecting to database: ${dbName}`);
        
        client = new MongoClient(mongoUri);
        await client.connect();
        const db = client.db(dbName);
        
        // If no jobId provided, use the one from the console logs
        const targetJobId = jobId || '684fae408e5bec96d0e3a04e';
        console.log(`📋 Looking for job ID: ${targetJobId}`);
        
        // Fetch the specific job
        const job = await db.collection('jobs').findOne({ 
            _id: new ObjectId(targetJobId) 
        });
        
        if (!job) {
            console.log('❌ Job not found!');
            
            // Show similar jobs
            console.log('\n🔍 Available jobs:');
            const allJobs = await db.collection('jobs').find({ status: 'active' }).limit(5).toArray();
            allJobs.forEach((j, index) => {
                console.log(`${index + 1}. ${j.title || 'Untitled'} (ID: ${j._id})`);
            });
            return;
        }
        
        console.log('✅ Job found!');
        console.log('\n📄 JOB DETAILS:');
        console.log('=' .repeat(40));
        console.log(`Title: ${job.title || 'N/A'}`);
        console.log(`Company: ${job.company || 'N/A'}`);
        console.log(`Department: ${job.department || 'N/A'}`);
        console.log(`Level: ${job.level || 'N/A'}`);
        console.log(`Status: ${job.status || 'N/A'}`);
        console.log(`Job Type: ${job.jobType || 'N/A'}`);
        console.log(`Work Mode: ${job.workMode || 'N/A'}`);
        console.log(`Salary: ${job.salaryMin || 'N/A'} - ${job.salaryMax || 'N/A'}`);
        console.log(`Created: ${job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}`);
        console.log(`Application Deadline: ${job.applicationEnd ? new Date(job.applicationEnd).toLocaleDateString() : 'N/A'}`);
        
        console.log('\n📝 JOB DESCRIPTION:');
        console.log('=' .repeat(40));
        if (job.description) {
            console.log(job.description);
        } else {
            console.log('❌ No job description available');
        }
        
        console.log('\n🎯 JOB REQUIREMENTS:');
        console.log('=' .repeat(40));
        if (job.requirements && job.requirements.length > 0) {
            job.requirements.forEach((req, index) => {
                console.log(`${index + 1}. ${req}`);
            });
        } else {
            console.log('❌ No requirements listed');
        }
        
        console.log('\n🔧 TECHNICAL DETAILS:');
        console.log('=' .repeat(40));
        console.log(`Job ID: ${job._id}`);
        console.log(`Recruiter ID: ${job.recruiterId || 'N/A'}`);
        console.log(`Created by: ${job.createdBy || 'N/A'}`);
        console.log(`Number of openings: ${job.numberOfOpenings || 'N/A'}`);
        console.log(`Duration: ${job.duration || 'N/A'}`);
        console.log(`Priority: ${job.priority || 'N/A'}`);
        
        // Test the API endpoint
        console.log('\n🧪 TESTING API ENDPOINT:');
        console.log('=' .repeat(40));
        
        try {
            const apiResponse = await fetch(`http://localhost:3002/api/jobs/${targetJobId}`);
            console.log(`API Response Status: ${apiResponse.status}`);
            
            if (apiResponse.ok) {
                const apiJob = await apiResponse.json();
                console.log('✅ API returned job data successfully');
                console.log(`API Job Title: ${apiJob.title || 'N/A'}`);
                console.log(`API Description Length: ${apiJob.description?.length || 0} characters`);
                console.log(`API Requirements Count: ${apiJob.requirements?.length || 0}`);
            } else {
                const errorText = await apiResponse.text();
                console.log('❌ API Error:', errorText);
            }
        } catch (apiError) {
            console.log('❌ API Test Failed:', apiError.message);
        }
        
        // Check if this job has any applications
        console.log('\n📊 APPLICATION STATISTICS:');
        console.log('=' .repeat(40));
        const applicationCount = await db.collection('applications').countDocuments({ 
            jobId: targetJobId 
        });
        console.log(`Total applications: ${applicationCount}`);
        
        if (applicationCount > 0) {
            const recentApps = await db.collection('applications')
                .find({ jobId: targetJobId })
                .sort({ createdAt: -1 })
                .limit(3)
                .toArray();
            
            console.log('Recent applications:');
            recentApps.forEach((app, index) => {
                console.log(`${index + 1}. Applied on: ${new Date(app.createdAt).toLocaleDateString()}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Get jobId from command line args or use default
const jobId = process.argv[2];
showJobDetails(jobId);
