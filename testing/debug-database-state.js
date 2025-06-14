// Check database state and create test data if needed
import clientPromise from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function checkDatabaseState() {
  console.log('🔍 Checking database state...\n');
  
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📂 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log('');
    
    // Check each collection count
    console.log('📊 Collection counts:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }
    console.log('');
    
    // Check if we have users
    const users = await db.collection('users').find({}).limit(3).toArray();
    console.log(`👥 Users (first 3):`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user._id}, Email: ${user.email}, Role: ${user.role}`);
    });
    console.log('');
    
    // Check if we have jobs
    const jobs = await db.collection('jobs').find({}).limit(3).toArray();
    console.log(`💼 Jobs (first 3):`);
    jobs.forEach((job, index) => {
      console.log(`  ${index + 1}. ID: ${job._id}, Title: ${job.title}, Status: ${job.status}`);
    });
    console.log('');
    
    // Check applications in detail
    console.log('📋 Applications (all):');
    const applications = await db.collection('applications').find({}).toArray();
    if (applications.length > 0) {
      applications.forEach((app, index) => {
        console.log(`  ${index + 1}. ID: ${app._id}`);
        console.log(`     Job ID: ${app.jobId}`);
        console.log(`     Applicant ID: ${app.applicantId}`);
        console.log(`     Status: ${app.status}`);
        console.log(`     Applied At: ${app.appliedAt}`);
        console.log('');
      });
    } else {
      console.log('  No applications found.');
      
      // Let's create a test application if we have users and jobs
      if (users.length > 0 && jobs.length > 0) {
        console.log('🔧 Creating test application...');
        
        const testApp = {
          jobId: jobs[0]._id.toString(),
          applicantId: users.find(u => u.role === 'user')?._id.toString() || users[0]._id.toString(),
          resumePath: '/uploads/test-resume.pdf',
          coverLetter: 'Test cover letter',
          additionalMessage: 'Test additional message',
          status: 'pending',
          appliedAt: new Date(),
          updatedAt: new Date(),
          applicantDetails: {
            name: users[0].firstName + ' ' + users[0].lastName || 'Test User',
            email: users[0].email,
          }
        };
        
        const result = await db.collection('applications').insertOne(testApp);
        console.log(`✅ Test application created with ID: ${result.insertedId}`);
        
        // Now test the status update
        console.log('🔄 Testing status update on new application...');
        const updateResult = await db.collection('applications').updateOne(
          { _id: new ObjectId(result.insertedId) },
          { 
            $set: { 
              status: 'accepted',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   Update result - Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
        
        if (updateResult.modifiedCount > 0) {
          console.log('✅ Status update successful!');
          
          // Test notification creation
          const updatedApp = await db.collection('applications').findOne({
            _id: new ObjectId(result.insertedId)
          });
          
          const applicant = await db.collection('users').findOne({
            _id: new ObjectId(updatedApp.applicantId)
          });
          
          const job = await db.collection('jobs').findOne({
            _id: new ObjectId(updatedApp.jobId)
          });
          
          if (applicant && job) {
            const notification = {
              userId: updatedApp.applicantId,
              type: 'application_status_update',
              title: `Application Accepted`,
              message: `Your application for "${job.title}" has been accepted.`,
              applicationId: result.insertedId.toString(),
              jobId: updatedApp.jobId,
              isRead: false,
              createdAt: new Date()
            };
            
            const notificationResult = await db.collection('notifications').insertOne(notification);
            console.log(`✅ Test notification created with ID: ${notificationResult.insertedId}`);
          }
          
        } else {
          console.log('❌ Status update failed!');
        }
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log(`   - Applications exist: ${applications.length > 0}`);
    console.log(`   - Users exist: ${users.length > 0}`);
    console.log(`   - Jobs exist: ${jobs.length > 0}`);
    
    if (applications.length === 0 && users.length > 0 && jobs.length > 0) {
      console.log('   - Issue: No applications to test with');
      console.log('   - Solution: Applications need to be submitted first');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
    console.error('Stack trace:', error.stack);
  }
}

checkDatabaseState().then(() => {
  console.log('\n🎉 Database check completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Database check failed:', error);
  process.exit(1);
});
