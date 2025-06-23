/**
 * Test the fixed dashboard stats to verify it excludes closed jobs
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testFixedStats() {
    console.log('🔍 Testing Fixed Dashboard Stats');
    console.log('=' * 40);
    
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        await client.connect();
        const dbName = process.env.MONGODB_URI.split('/')[3]?.split('?')[0] || 'x-ceed-db';
        const db = client.db(dbName);
        
        // Test for the recruiter with ID: 683b42ead5ddd166187f15cf (the one with 15 jobs)
        const recruiterId = '683b42ead5ddd166187f15cf';
        
        console.log(`\n🔍 Testing for recruiter: ${recruiterId}`);
        
        // Get ALL jobs (old way)
        const allJobs = await db.collection('jobs').find({
            recruiterId: recruiterId
        }).toArray();
        
        console.log(`📊 ALL jobs by recruiter: ${allJobs.length}`);
        allJobs.forEach(job => {
            console.log(`  - ${job.title} (status: ${job.status || 'no status'})`);
        });
        
        // Get ACTIVE jobs only (new way)
        const activeJobs = await db.collection('jobs').find({
            recruiterId: recruiterId,
            status: { $ne: 'closed' },
            $and: [
                { status: { $ne: 'deleted' } },
                { status: { $ne: 'inactive' } }
            ]
        }).toArray();
        
        console.log(`\n📊 ACTIVE jobs by recruiter: ${activeJobs.length}`);
        activeJobs.forEach(job => {
            console.log(`  - ${job.title} (status: ${job.status || 'active'})`);
        });
        
        // Get applications for all jobs
        const allJobIds = allJobs.map(job => job._id.toString());
        const allApplications = await db.collection('applications').find({
            jobId: { $in: allJobIds }
        }).toArray();
        
        console.log(`\n📋 Applications for ALL jobs: ${allApplications.length}`);
        
        // Get applications for active jobs only
        const activeJobIds = activeJobs.map(job => job._id.toString());
        const activeApplications = await db.collection('applications').find({
            jobId: { $in: activeJobIds }
        }).toArray();
        
        console.log(`📋 Applications for ACTIVE jobs only: ${activeApplications.length}`);
        
        // Show the difference
        console.log(`\n💡 DIFFERENCE: ${allApplications.length - activeApplications.length} applications from closed/inactive jobs will be excluded`);
        
        // Show status breakdown for active applications
        const statusStats = {};
        activeApplications.forEach(app => {
            const status = app.status || 'pending';
            statusStats[status] = (statusStats[status] || 0) + 1;
        });
        
        console.log('\n📊 Status breakdown for ACTIVE jobs:');
        Object.entries(statusStats).forEach(([status, count]) => {
            console.log(`  ${status}: ${count}`);
        });
        
        console.log(`\n✅ New dashboard total should show: ${activeApplications.length} (instead of ${allApplications.length})`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    testFixedStats();
}

module.exports = { testFixedStats };
