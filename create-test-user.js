const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('x-ceed-db');  // Use the correct database
    const users = db.collection('users');
    
    // Check if test user already exists
    const existingUser = await users.findOne({ email: 'test-applicant@example.com' });
    
    if (existingUser) {
      console.log('🗑️ Test user already exists, deleting...');
      await users.deleteOne({ email: 'test-applicant@example.com' });
      console.log('✅ Deleted existing test user');
    }
    
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    console.log('🔐 Password hashed successfully');
    
    const testUser = {
      email: 'test-applicant@example.com',
      password: hashedPassword,
      userType: 'applicant',
      firstName: 'Test',
      lastName: 'Applicant',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 Creating user with data:', {
      email: testUser.email,
      userType: testUser.userType,
      firstName: testUser.firstName,
      lastName: testUser.lastName
    });
    
    const result = await users.insertOne(testUser);
    console.log('✅ Test user created with ID:', result.insertedId);
    console.log('📧 Email: test-applicant@example.com');
    console.log('🔑 Password: testpassword123');
    
    // Verify creation
    const verifyUser = await users.findOne({ _id: result.insertedId });
    console.log('✅ Verification - User exists:', !!verifyUser);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createTestUser();
