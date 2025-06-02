const { MongoClient } = require('mongodb');

async function checkDatabases() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    // List all databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    console.log('📊 Available databases:');
    for (const db of dbs.databases) {
      console.log(`  - ${db.name} (${db.sizeOnDisk} bytes)`);
      
      // Check collections in each database
      const database = client.db(db.name);
      const collections = await database.listCollections().toArray();
      
      if (collections.length > 0) {
        console.log(`    Collections: ${collections.map(c => c.name).join(', ')}`);
        
        // Check for users collection
        if (collections.some(c => c.name === 'users')) {
          const usersCount = await database.collection('users').countDocuments();
          console.log(`    Users count: ${usersCount}`);
          
          if (usersCount > 0) {
            const sampleUser = await database.collection('users').findOne({});
            console.log(`    Sample user: ${sampleUser?.email} (${sampleUser?.userType})`);
          }
        }
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabases();
