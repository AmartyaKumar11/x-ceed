// Check users in database
import clientPromise from './src/lib/mongodb.js';

async function checkUsers() {
  console.log('🔍 Checking users in database...\n');
  
  try {
    const client = await clientPromise;
    const db = client.db('x-ceed-db');
    
    // Get all users
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, i) => {
      console.log(`\n${i + 1}. ${user.email}`);
      console.log(`   Type: ${user.userType}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Has password: ${!!user.password}`);
      if (user.password) {
        console.log(`   Password hash starts with: ${user.password.substring(0, 10)}...`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUsers().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
