const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function checkApplicantAccounts() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('=== APPLICANT ACCOUNTS ===');
    const applicants = await db.collection('users').find({ userType: 'applicant' }).toArray();
    
    console.log(`Found ${applicants.length} applicant accounts:`);
    
    for (const applicant of applicants) {
      console.log(`\nEmail: ${applicant.email}`);
      console.log(`Name: ${applicant.firstName} ${applicant.lastName}`);
      console.log(`Created: ${applicant.createdAt}`);
      console.log(`Password hash exists: ${!!applicant.password}`);
      
      // Test common passwords
      if (applicant.password) {
        const commonPasswords = ['password', 'password123', '123456', 'test', 'testpassword'];
        for (const pwd of commonPasswords) {
          const isMatch = await bcrypt.compare(pwd, applicant.password);
          if (isMatch) {
            console.log(`✅ Password match found: "${pwd}"`);
            break;
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

checkApplicantAccounts();
