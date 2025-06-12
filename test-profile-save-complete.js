const { MongoClient } = require('mongodb');

async function testCompleteSaveFlow() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/job-portal');
  
  try {
    await client.connect();
    console.log('🔌 Connected to MongoDB');
    
    const db = client.db('job-portal');
    const users = db.collection('users');
    
    // Create test user
    const testUser = {
      email: 'test-complete-save@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '123-456-7890',
      city: 'Test City',
      address: '123 Test St',
      state: 'Test State',
      zipCode: '12345',
      gender: 'male',
      dateOfBirth: '1990-01-01',
      education: [
        {
          institution: 'Test University',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2010-09-01',
          endDate: '2014-05-31',
          gpa: '3.8'
        }
      ],
      workExperience: [
        {
          company: 'Test Company',
          position: 'Software Developer',
          startDate: '2014-06-01',
          endDate: '2020-12-31',
          current: false,
          description: 'Developed web applications'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js'],
      certifications: [
        {
          name: 'AWS Certified Developer',
          issuer: 'Amazon',
          dateIssued: '2020-01-01',
          credentialId: 'TEST123'
        }
      ],
      role: 'applicant'
    };
    
    // Insert test user
    const insertResult = await users.insertOne(testUser);
    console.log('✨ Created test user:', insertResult.insertedId);
    
    // Test individual section updates
    console.log('\n🧪 Testing Education Update...');
    const educationUpdate = {
      ...testUser,
      education: [
        ...testUser.education,
        {
          institution: 'Graduate School',
          degree: 'Master of Science',
          field: 'Data Science',
          startDate: '2020-09-01',
          endDate: '2022-05-31',
          gpa: '4.0'
        }
      ]
    };
    
    await users.updateOne(
      { _id: insertResult.insertedId },
      { $set: educationUpdate }
    );
    
    // Verify all data is preserved
    const afterEducationUpdate = await users.findOne({ _id: insertResult.insertedId });
    console.log('📊 After education update:');
    console.log('  - Phone:', afterEducationUpdate.phone);
    console.log('  - Skills count:', afterEducationUpdate.skills?.length || 0);
    console.log('  - Education count:', afterEducationUpdate.education?.length || 0);
    console.log('  - Experience count:', afterEducationUpdate.workExperience?.length || 0);
    
    // Test Skills Update
    console.log('\n🧪 Testing Skills Update...');
    const skillsUpdate = {
      ...afterEducationUpdate,
      skills: [...afterEducationUpdate.skills, 'Python', 'Machine Learning']
    };
    
    await users.updateOne(
      { _id: insertResult.insertedId },
      { $set: skillsUpdate }
    );
    
    const afterSkillsUpdate = await users.findOne({ _id: insertResult.insertedId });
    console.log('📊 After skills update:');
    console.log('  - Phone:', afterSkillsUpdate.phone);
    console.log('  - Skills count:', afterSkillsUpdate.skills?.length || 0);
    console.log('  - Education count:', afterSkillsUpdate.education?.length || 0);
    console.log('  - Experience count:', afterSkillsUpdate.workExperience?.length || 0);
    
    // Test Experience Update
    console.log('\n🧪 Testing Experience Update...');
    const experienceUpdate = {
      ...afterSkillsUpdate,
      workExperience: [
        ...afterSkillsUpdate.workExperience,
        {
          company: 'New Company',
          position: 'Senior Developer',
          startDate: '2021-01-01',
          current: true,
          description: 'Leading development team'
        }
      ]
    };
    
    await users.updateOne(
      { _id: insertResult.insertedId },
      { $set: experienceUpdate }
    );
    
    const final = await users.findOne({ _id: insertResult.insertedId });
    console.log('📊 Final state:');
    console.log('  - Phone:', final.phone);
    console.log('  - Skills count:', final.skills?.length || 0);
    console.log('  - Education count:', final.education?.length || 0);
    console.log('  - Experience count:', final.workExperience?.length || 0);
    console.log('  - Certifications count:', final.certifications?.length || 0);
    
    // Calculate completion percentage
    const completionFields = {
      hasPhone: !!final.phone,
      hasEducation: final.education && final.education.length > 0,
      hasExperience: final.workExperience && final.workExperience.length > 0,
      hasSkills: final.skills && final.skills.length > 0
    };
    
    const completedCount = Object.values(completionFields).filter(Boolean).length;
    const completionPercentage = Math.round((completedCount / 4) * 100);
    
    console.log('\n📈 Profile Completion Analysis:');
    console.log('  - Has Phone:', completionFields.hasPhone);
    console.log('  - Has Education:', completionFields.hasEducation);
    console.log('  - Has Experience:', completionFields.hasExperience);
    console.log('  - Has Skills:', completionFields.hasSkills);
    console.log('  - Completion:', completionPercentage + '%');
    
    // Cleanup
    await users.deleteOne({ _id: insertResult.insertedId });
    console.log('🧹 Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await client.close();
  }
}

// Run the test
testCompleteSaveFlow().catch(console.error);
