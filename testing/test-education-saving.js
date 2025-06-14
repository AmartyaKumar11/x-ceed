// Test script to debug education saving issue
const { MongoClient, ObjectId } = require('mongodb');

async function testEducationSaving() {
  console.log('🔍 Testing Education Saving...\n');

  // Connect to MongoDB
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('x-ceed-db');
    console.log('✅ Connected to MongoDB\n');    // Find a test user (use amartya3@gmail.com)
    const user = await db.collection('users').findOne({ 
      email: 'amartya3@gmail.com',
      userType: 'applicant'
    });

    if (!user) {
      console.log('❌ No test user found');
      return;
    }

    console.log('👤 Found user:', user.personal?.name || user.email);
    console.log('📧 User ID:', user._id.toString());
    
    // Check current education data
    console.log('\n📚 Current Education Data:');
    if (user.education && user.education.length > 0) {
      user.education.forEach((edu, index) => {
        console.log(`  ${index + 1}. Institution: ${edu.institution || 'N/A'}`);
        console.log(`      Degree: ${edu.degree || 'N/A'}`);
        console.log(`      Field: ${edu.field || 'N/A'}`);
        console.log(`      Start: ${edu.startDate || 'N/A'}`);
        console.log(`      End: ${edu.endDate || 'N/A'}`);
        console.log(`      GPA: ${edu.gpa || 'N/A'}\n`);
      });
    } else {
      console.log('  No education data found\n');
    }

    // Simulate adding education data
    const testEducation = [
      {
        institution: 'Test University',
        degree: 'Bachelor of Science',
        field: 'Computer Science',
        startDate: '2018-09-01',
        endDate: '2022-05-15',
        gpa: '3.8'
      }
    ];

    console.log('💾 Testing education update...');
    
    const updateResult = await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          education: testEducation,
          updatedAt: new Date()
        } 
      }
    );

    console.log('📊 Update Result:');
    console.log('  Matched:', updateResult.matchedCount);
    console.log('  Modified:', updateResult.modifiedCount);

    if (updateResult.modifiedCount > 0) {
      console.log('✅ Education data updated successfully');
      
      // Verify the update
      const updatedUser = await db.collection('users').findOne({ _id: user._id });
      console.log('\n📚 Updated Education Data:');
      if (updatedUser.education && updatedUser.education.length > 0) {
        updatedUser.education.forEach((edu, index) => {
          console.log(`  ${index + 1}. Institution: ${edu.institution}`);
          console.log(`      Degree: ${edu.degree}`);
          console.log(`      Field: ${edu.field}`);
        });
      }
    } else {
      console.log('❌ Education data was not updated');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

testEducationSaving();
