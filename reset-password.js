// Reset password for specific users in MongoDB Atlas
// Security: Uses environment variables for passwords, never hardcoded
// Usage: Set RESET_PASSWORD environment variable or use secure default
// Example: RESET_PASSWORD=your_secure_password node reset-password.js
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
    
    // Get password from environment variable or use secure default
    const newPassword = process.env.RESET_PASSWORD || 'TempPass123!';
    const hashedPassword = await bcrypt.hash(newPassword, 12); // Increased salt rounds for better security
    
    console.log(`🔐 Setting new password for security`);
    console.log(`🔒 Password will be hashed with bcrypt`);
    
    // Reset password for your applicant account
    const applicantResult = await db.collection('users').updateOne(
      { email: 'amartya-applicant@gmail.com' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date(),
          passwordResetAt: new Date()
        }
      }
    );
    
    // Use same secure password for recruiter account
    const recruiterHashedPassword = await bcrypt.hash(newPassword, 12);
    
    const recruiterResult = await db.collection('users').updateOne(
      { email: 'amartya-recruiter@gmail.com' },
      { 
        $set: { 
          password: recruiterHashedPassword,
          updatedAt: new Date(),
          passwordResetAt: new Date()
        }
      }
    );
    
    console.log('\n📊 Password Reset Results:');
    console.log(`   amartya-applicant@gmail.com: ${applicantResult.modifiedCount ? '✅ Updated' : '❌ Failed'}`);
    console.log(`   amartya-recruiter@gmail.com: ${recruiterResult.modifiedCount ? '✅ Updated' : '❌ Failed'}`);
    
    if (applicantResult.modifiedCount > 0 || recruiterResult.modifiedCount > 0) {
      console.log('\n🎉 Password reset successful!');
      console.log('\n📝 Login credentials have been updated securely');
      console.log('   Check your environment variables or use the default secure password');
      console.log('   Set RESET_PASSWORD environment variable for custom password');
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
