/**
 * Debug script to investigate application count mismatch
 * Dashboard shows 13 but jobs page shows 6
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function debugApplicationCounts() {
    console.log('🔍 Debugging Application Count Mismatch');
    console.log('=' * 50);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const dbName = process.env.MONGODB_URI.split('/')[3]?.split('?')[0] || 'x-ceed-db';
        const db = client.db(dbName);
        
        // First, let's get the recruiter ID from a test login
        // For now, let's just check all applications and jobs
        
        console.log('\n📊 JOBS COLLECTION ANALYSIS:');
        console.log('=' * 30);
        
        const allJobs = await db.collection('jobs').find({}).toArray();
        console.log(`Total jobs in database: ${allJobs.length}`);
        
        // Group by recruiter
        const jobsByRecruiter = {};
        allJobs.forEach(job => {
            if (!jobsByRecruiter[job.recruiterId]) {
                jobsByRecruiter[job.recruiterId] = [];
            }
            jobsByRecruiter[job.recruiterId].push(job);
        });
        
        console.log('\nJobs by recruiter:');
        for (const [recruiterId, jobs] of Object.entries(jobsByRecruiter)) {
            console.log(`  Recruiter ${recruiterId}: ${jobs.length} jobs`);
            
            // Get job IDs for this recruiter
            const jobIds = jobs.map(job => job._id.toString());
            
            console.log('    Job IDs:', jobIds);
            
            // Check applications for these jobs
            const applications = await db.collection('applications').find({
                jobId: { $in: jobIds }
            }).toArray();
            
            console.log(`    Total applications: ${applications.length}`);
            
            // Check applications using the same logic as dashboard stats API
            const statsQuery = await db.collection('applications').aggregate([
                {
                    $match: {
                        jobId: { $in: jobIds }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]).toArray();
            
            console.log('    Status breakdown (stats API logic):');
            statsQuery.forEach(stat => {
                console.log(`      ${stat._id || 'null'}: ${stat.count}`);
            });
            
            // Check applications using the same logic as jobs API
            const jobsApiLogic = await Promise.all(jobs.map(async (job) => {
                const count = await db.collection('applications')
                    .countDocuments({ jobId: job._id.toString() });
                return { jobId: job._id.toString(), title: job.title, count };
            }));
            
            console.log('    Applications per job (jobs API logic):');
            jobsApiLogic.forEach(job => {
                console.log(`      ${job.title}: ${job.count} applications`);
            });
            
            console.log('    ---');
        }
        
        console.log('\n📋 APPLICATIONS COLLECTION ANALYSIS:');
        console.log('=' * 35);
        
        const allApplications = await db.collection('applications').find({}).toArray();
        console.log(`Total applications in database: ${allApplications.length}`);
        
        // Check for data type issues
        console.log('\nData type analysis:');
        const jobIdTypes = {};
        allApplications.forEach(app => {
            const type = typeof app.jobId;
            if (!jobIdTypes[type]) jobIdTypes[type] = 0;
            jobIdTypes[type]++;
        });
        
        console.log('JobId data types in applications:');
        for (const [type, count] of Object.entries(jobIdTypes)) {
            console.log(`  ${type}: ${count} applications`);
        }
        
        // Check for potential ObjectId vs string issues
        console.log('\nChecking for ObjectId vs String matching issues:');
        const sampleApplications = allApplications.slice(0, 5);
        for (const app of sampleApplications) {
            console.log(`Application ${app._id}:`);
            console.log(`  jobId: "${app.jobId}" (${typeof app.jobId})`);
            
            // Try to find matching job
            const matchingJob = allJobs.find(job => 
                job._id.toString() === app.jobId || 
                job._id.toString() === app.jobId.toString()
            );
            
            console.log(`  Matching job found: ${matchingJob ? 'YES' : 'NO'}`);
            if (matchingJob) {
                console.log(`  Job title: "${matchingJob.title}"`);
                console.log(`  Job _id: "${matchingJob._id}" (ObjectId)`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    debugApplicationCounts();
}

module.exports = { debugApplicationCounts };
