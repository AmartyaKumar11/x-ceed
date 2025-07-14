// Debug MongoDB Atlas connection and user data
import { connectDB } from './src/lib/mongodb.js';

async function debugMongoDBAtlas() {
  console.log('🔍 Debugging MongoDB Atlas connection and user data...\n');
  
  try {
    // Connect to the actual database
    const db = await connectDB();
    console.log('✅ Connected to MongoDB Atlas successfully!\n');
    
    // Get all users from the database
    const users = await db.collection('users').find({}).toArray();
    console.log(`📊 Total users in database: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 Users found in database:');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Role: ${user.role || 'N/A'}`);
        console.log(`   UserType: ${user.userType || 'N/A'}`);
        console.log(`   Email Verified: ${user.isEmailVerified || false}`);
        console.log(`   Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'N/A'}`);
        console.log(`   Created: ${user.createdAt || 'N/A'}`);
        console.log(`   ID: ${user._id}`);
      });
      
      // Test password comparison for the first user
      if (users.length > 0 && users[0].password) {
        console.log('\n🔐 Testing password comparison...');
        const bcrypt = await import('bcryptjs');
        
        // Test with common passwords
        const testPasswords = ['password123', 'password', '123456', 'admin'];
        
        for (const testPassword of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPassword, users[0].password);
            console.log(`   "${testPassword}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
          } catch (error) {
            console.log(`   "${testPassword}": ❌ Error - ${error.message}`);
          }
        }
      }
      
    } else {
      console.log('⚠️ No users found in the database');
      console.log('💡 This might indicate:');
      console.log('   - Users were registered in a different collection');
      console.log('   - Database connection is pointing to wrong database');
      console.log('   - Registration process is not working correctly');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting suggestions:');
    console.log('1. Check MONGODB_URI environment variable');
    console.log('2. Verify MongoDB Atlas cluster is running');
    console.log('3. Check network access and IP whitelist');
    console.log('4. Verify database user permissions');
  }
}

debugMongoDBAtlas().then(() => {
  console.log('\n🎯 Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
