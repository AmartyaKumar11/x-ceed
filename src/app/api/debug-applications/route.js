import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    console.log('🔍 Testing database connection...');
    console.log('🔍 Database name:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('🔍 Available collections:', collections.map(c => c.name));
    
    // Get all applications for debugging
    const allApplications = await db.collection('applications').find().toArray();
    console.log('🔍 Total applications in DB:', allApplications.length);
    
    // Get applications for amartya3
    const userApplications = await db.collection('applications').find({ userId: 'amartya3' }).toArray();
    console.log('🔍 Applications for amartya3:', userApplications.length);
    
    // Get all jobs for debugging
    const allJobs = await db.collection('jobs').find().toArray();
    console.log('🔍 Total jobs in DB:', allJobs.length);
    
    // Try the aggregation manually
    const aggregationResult = await db.collection('applications')
      .aggregate([
        { 
          $match: { 
            userId: 'amartya3'
          } 
        },
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'jobDetails'
          }
        },
        {
          $unwind: {
            path: '$jobDetails',
            preserveNullAndEmptyArrays: true
          }
        }
      ])
      .toArray();
    
    console.log('🔍 Aggregation result count:', aggregationResult.length);
    
    return NextResponse.json({
      success: true,
      debug: {
        totalApplications: allApplications.length,
        userApplications: userApplications.length,
        totalJobs: allJobs.length,
        aggregationResults: aggregationResult.length,
        sampleUserApplication: userApplications[0] || null,
        sampleJob: allJobs[0] || null,
        aggregationSample: aggregationResult[0] || null
      }
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
