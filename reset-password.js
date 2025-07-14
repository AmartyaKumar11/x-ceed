// Reset password for specific users in MongoDB Atlas
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function resetUserPassword() {
  console.log('🔧 Password Reset Utility for MongoDB Atlas\n');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('❌ MONGODB_URI not found');
    return;
  }
  
  try {
    const client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db('x-ceed-db');
    
    // New password to set
    const newPassword = 'applicant'; // Use this as your new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    console.log(`🔐 Setting new password: "${newPassword}"`);
    console.log(`🔒 Hashed password: ${hashedPassword.substring(0, 20)}...`);
    
    // Reset password for your applicant account
    const applicantResult = await db.collection('users').updateOne(
      { email: 'amartya-applicant@gmail.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    // Also set recruiter password to 'recruiter' for consistency
    const recruiterPassword = 'recruiter';
    const recruiterHashedPassword = await bcrypt.hash(recruiterPassword, 10);
    
    const recruiterResult = await db.collection('users').updateOne(
      { email: 'amartya-recruiter@gmail.com' },
      { 
        $set: { 
          password: recruiterHashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('\n📊 Password Reset Results:');
    console.log(`   amartya-applicant@gmail.com: ${applicantResult.modifiedCount ? '✅ Updated' : '❌ Failed'}`);
    console.log(`   amartya-recruiter@gmail.com: ${recruiterResult.modifiedCount ? '✅ Updated' : '❌ Failed'}`);
    
    if (applicantResult.modifiedCount > 0 || recruiterResult.modifiedCount > 0) {
      console.log('\n🎉 Password reset successful!');
      console.log('\n📝 You can now login with:');
      console.log('   Email: amartya-applicant@gmail.com');
      console.log('   Password: amartya123');
      console.log('   OR');
      console.log('   Email: amartya-recruiter@gmail.com');
      console.log('   Password: amartya123');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Password reset failed:', error.message);
  }
}

resetUserPassword().then(() => {
  console.log('\n🎯 Password reset completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Reset failed:', error);
  process.exit(1);
});
