const { MongoClient } = require('mongodb');

async function checkPassword() {
  console.log('🔍 Checking password for amartya3@gmail.com...');
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed');
    await client.connect();
    
    const db = client.db();
    const users = db.collection('users');
    
    // Find the user
    const user = await users.findOne({ email: 'amartya3@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User found:', {
      email: user.email,
      name: user.name,
      hasPassword: !!user.password,
      passwordPreview: user.password ? user.password.substring(0, 20) + '...' : 'None'
    });    
    // Test common passwords
    console.log('⚠️  Cannot test passwords without bcrypt, showing stored hash for manual comparison');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPassword();
