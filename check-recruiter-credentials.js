const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkRecruiterCredentials() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all recruiter users
    const recruiters = await db.collection('users').find({ 
      userType: 'recruiter' 
    }, {
      projection: {
        email: 1,
        userType: 1,
        createdAt: 1,
        'recruiter.name': 1,
        'recruiter.recruiterId': 1,
        'recruiter.institutionName': 1
      }
    }).toArray();
    
    console.log('\nRecruiter credentials:');
    console.log('======================');
    
    recruiters.forEach((recruiter, index) => {
      const recruiterId = recruiter.recruiter?.recruiterId || 'N/A';
      const institutionName = recruiter.recruiter?.institutionName || 'N/A';
      const generatedPassword = recruiterId !== 'N/A' ? recruiterId + '123' : 'N/A';
      
      console.log(`${index + 1}. Name: ${recruiter.recruiter?.name || 'N/A'}`);
      console.log(`   Email (stored): ${recruiter.email}`);
      console.log(`   Recruiter ID: ${recruiterId}`);
      console.log(`   Institution: ${institutionName}`);
      console.log(`   Generated Password: ${generatedPassword}`);
      console.log(`   Created: ${recruiter.createdAt}`);
      console.log('   ---LOGIN CREDENTIALS---');
      console.log(`   Email: ${recruiter.email}`);
      console.log(`   Password: ${generatedPassword}`);
      console.log('   ----------------------');
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkRecruiterCredentials();
