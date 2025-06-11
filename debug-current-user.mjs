import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

async function debugCurrentUser() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    
    console.log('🔍 Debug: Current User Authentication Status\n');
    
    // Check if there's a token in browser storage (simulate what frontend would have)
    // You'll need to provide your current token manually
    const testTokens = [
      // Add your current JWT token here if you have it
      // You can get this from browser DevTools -> Application -> Local Storage -> token
    ];
    
    if (testTokens.length === 0) {
      console.log('❌ No test tokens provided. Please add your current JWT token to debug.');
      console.log('📋 To get your token:');
      console.log('   1. Open browser DevTools (F12)');
      console.log('   2. Go to Application tab');
      console.log('   3. Click Local Storage -> localhost:3000');
      console.log('   4. Copy the "token" value');
      console.log('   5. Add it to testTokens array in this script\n');
    }
    
    for (const token of testTokens) {
      try {
        console.log(`🔍 Testing token: ${token.substring(0, 20)}...`);
        
        const secret = new TextEncoder().encode('your-secret-key-for-jwt-tokens');
        const { payload } = await jwtVerify(token, secret);
        
        console.log('✅ Token decoded successfully:');
        console.log('   - User ID:', payload.userId);
        console.log('   - Email:', payload.email);
        console.log('   - User Type:', payload.userType);
        console.log('   - Name:', payload.name);
        
        // Fetch user details from database        const user = await db.collection('users').findOne({ 
          _id: new ObjectId(payload.userId) 
        });
        
        if (user) {
          console.log('✅ User found in database:');
          console.log('   - Database ID:', user._id.toString());
          console.log('   - Email:', user.email);
          console.log('   - User Type:', user.userType);
          console.log('   - Created:', user.createdAt);
        }
        
        // Check jobs created by this user
        const jobs = await db.collection('jobs').find({ 
          recruiterId: payload.userId 
        }).toArray();
        
        console.log(`✅ Jobs created by this user: ${jobs.length}`);
        jobs.forEach(job => {
          console.log(`   - ${job.title} (${job.status}) - Created: ${job.createdAt}`);
        });
        
        // Check for potential ID mismatches
        const jobsWithStringId = await db.collection('jobs').find({ 
          recruiterId: payload.userId.toString() 
        }).toArray();
        
        if (jobsWithStringId.length !== jobs.length) {
          console.log(`⚠️  ID type mismatch detected!`);
          console.log(`   - Jobs with ObjectId recruiterId: ${jobs.length}`);
          console.log(`   - Jobs with string recruiterId: ${jobsWithStringId.length}`);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
      } catch (error) {
        console.log('❌ Token verification failed:', error.message);
      }
    }
    
    // Show all recruiters and their job counts for comparison
    console.log('📊 All recruiters and their job counts:');
    const allRecruiters = await db.collection('users').find({ 
      userType: 'recruiter' 
    }).toArray();
    
    for (const recruiter of allRecruiters) {
      const jobCount = await db.collection('jobs').countDocuments({ 
        recruiterId: recruiter._id.toString() 
      });
      console.log(`   - ${recruiter.email}: ${jobCount} jobs`);
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
  } finally {
    await client.close();
  }
}

debugCurrentUser();
