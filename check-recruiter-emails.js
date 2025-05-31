// Check what emails are actually stored for recruiters
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkRecruiterEmails() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get all recruiter users with their details
    const recruiters = await db.collection('users').find({ 
      userType: 'recruiter' 
    }, {
      projection: {
        email: 1,
        userType: 1,
        'recruiter.name': 1,
        'recruiter.recruiterId': 1,
        'recruiter.institutionName': 1,
        createdAt: 1
      }
    }).toArray();
    
    console.log('\nRecruiter accounts found:');
    recruiters.forEach((recruiter, index) => {
      console.log(`${index + 1}. Email: ${recruiter.email}`);
      console.log(`   Name: ${recruiter.recruiter?.name || 'N/A'}`);
      console.log(`   Recruiter ID: ${recruiter.recruiter?.recruiterId || 'N/A'}`);
      console.log(`   Institution: ${recruiter.recruiter?.institutionName || 'N/A'}`);
      console.log(`   Created: ${recruiter.createdAt}`);
      
      // Generate what the password should be based on the pattern
      const expectedPassword = (recruiter.recruiter?.recruiterId || recruiter.email.split('@')[0]) + '123';
      console.log(`   Expected password: ${expectedPassword}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkRecruiterEmails();
