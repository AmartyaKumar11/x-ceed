// Test database connection and job data
const { MongoClient } = require('mongodb');

async function testDatabase() {
  console.log('🧪 Testing database connection...');
  
  try {
    // Try both database names to see which one has data
    const databases = ['xceed-db', 'x-ceed-db', 'x-ceed', 'xceed'];
    
    for (const dbName of databases) {
      console.log(`\n📋 Checking database: ${dbName}`);
      const client = new MongoClient('mongodb://localhost:27017');
      await client.connect();
      
      const db = client.db(dbName);
      
      try {
        // Check collections
        const collections = await db.listCollections().toArray();
        console.log(`Collections in ${dbName}:`, collections.map(c => c.name));
        
        // Check for jobs
        if (collections.some(c => c.name === 'jobs')) {
          const jobCount = await db.collection('jobs').countDocuments();
          console.log(`Total jobs in ${dbName}:`, jobCount);
          
          if (jobCount > 0) {
            const activeJobs = await db.collection('jobs').countDocuments({ status: 'active' });
            console.log(`Active jobs in ${dbName}:`, activeJobs);
            
            // Get a sample job
            const sampleJob = await db.collection('jobs').findOne({ status: 'active' });
            if (sampleJob) {
              console.log(`Sample job in ${dbName}:`, {
                id: sampleJob._id,
                title: sampleJob.title,
                company: sampleJob.companyName,
                hasDescription: !!sampleJob.description,
                status: sampleJob.status
              });
            }
          }
        }
        
        // Check for users
        if (collections.some(c => c.name === 'users')) {
          const userCount = await db.collection('users').countDocuments();
          console.log(`Total users in ${dbName}:`, userCount);
        }
        
      } catch (error) {
        console.log(`Error accessing ${dbName}:`, error.message);
      }
      
      await client.close();
    }
    
  } catch (error) {
    console.error('❌ Database test error:', error);
  }
}

testDatabase();
