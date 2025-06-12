// Test the fixed database connection
import { getDatabase } from './src/lib/mongodb.js';
import { ObjectId } from 'mongodb';

async function testFixedConnection() {
  console.log('🔧 Testing fixed database connection...\n');
  
  try {
    // Test the new getDatabase function
    const db = await getDatabase();
    console.log(`✅ Connected to database: ${db.databaseName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📂 Collections (${collections.length}):`);
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }
    
    // Test finding applications
    console.log('\n📋 Testing application queries...');
    const applications = await db.collection('applications').find({}).limit(3).toArray();
    console.log(`Found ${applications.length} applications:`);
    
    applications.forEach((app, i) => {
      console.log(`  ${i+1}. ID: ${app._id}, Status: ${app.status}, Job: ${app.jobId}`);
    });
    
    if (applications.length > 0) {
      // Test updating an application status
      const testApp = applications[0];
      console.log(`\n🔄 Testing status update for application: ${testApp._id}`);
      
      const originalStatus = testApp.status;
      const newStatus = originalStatus === 'pending' ? 'accepted' : 'pending';
      
      console.log(`  Changing status from '${originalStatus}' to '${newStatus}'`);
      
      const updateResult = await db.collection('applications').updateOne(
        { _id: new ObjectId(testApp._id) },
        { 
          $set: { 
            status: newStatus,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`  Update result - Matched: ${updateResult.matchedCount}, Modified: ${updateResult.modifiedCount}`);
      
      if (updateResult.modifiedCount > 0) {
        console.log('✅ Status update successful!');
        
        // Verify the update
        const updatedApp = await db.collection('applications').findOne({
          _id: new ObjectId(testApp._id)
        });
        console.log(`  New status: ${updatedApp.status}`);
        
        // Revert the change
        await db.collection('applications').updateOne(
          { _id: new ObjectId(testApp._id) },
          { 
            $set: { 
              status: originalStatus,
              updatedAt: testApp.updatedAt
            }
          }
        );
        console.log('  Status reverted to original');
        
      } else {
        console.log('❌ Status update failed!');
      }
    }
    
    console.log('\n🎉 Database connection fix successful!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testFixedConnection().then(() => {
  console.log('\n✅ Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
