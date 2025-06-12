// Direct database connection test
import { MongoClient } from 'mongodb';

async function directDbTest() {
  console.log('🔍 Testing direct database connection...\n');
  
  let client;
  try {
    // Try multiple possible connection strings
    const possibleUris = [
      'mongodb://localhost:27017',
      'mongodb://127.0.0.1:27017',
      'mongodb://localhost:27017/x-ceed-db',
      'mongodb://127.0.0.1:27017/x-ceed-db'
    ];
    
    const possibleDbNames = ['x-ceed-db', 'xceed', 'test', 'x_ceed'];
    
    for (const uri of possibleUris) {
      console.log(`🔗 Trying connection: ${uri}`);
      try {
        client = new MongoClient(uri);
        await client.connect();
        console.log('✅ Connected successfully!');
        
        // List all databases
        const adminDb = client.db().admin();
        const dbList = await adminDb.listDatabases();
        console.log('📚 Available databases:');
        dbList.databases.forEach(db => {
          console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });
        
        // Try each possible database name
        for (const dbName of possibleDbNames) {
          console.log(`\n🎯 Checking database: ${dbName}`);
          const db = client.db(dbName);
          
          try {
            const collections = await db.listCollections().toArray();
            if (collections.length > 0) {
              console.log(`  📂 Collections in ${dbName}:`);
              for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`    - ${col.name}: ${count} documents`);
                
                // If this is applications, show some samples
                if (col.name === 'applications' && count > 0) {
                  const samples = await db.collection('applications').find({}).limit(3).toArray();
                  console.log(`    📋 Sample applications:`);
                  samples.forEach((app, i) => {
                    console.log(`      ${i+1}. ID: ${app._id}, Status: ${app.status}, Job: ${app.jobId}`);
                  });
                }
                
                // If this is users, show some samples
                if (col.name === 'users' && count > 0) {
                  const samples = await db.collection('users').find({}).limit(3).toArray();
                  console.log(`    👥 Sample users:`);
                  samples.forEach((user, i) => {
                    console.log(`      ${i+1}. ID: ${user._id}, Email: ${user.email}, Role: ${user.role || 'user'}`);
                  });
                }
                
                // If this is jobs, show some samples
                if (col.name === 'jobs' && count > 0) {
                  const samples = await db.collection('jobs').find({}).limit(3).toArray();
                  console.log(`    💼 Sample jobs:`);
                  samples.forEach((job, i) => {
                    console.log(`      ${i+1}. ID: ${job._id}, Title: ${job.title}, Status: ${job.status || 'active'}`);
                  });
                }
              }
            } else {
              console.log(`  (No collections found)`);
            }
          } catch (error) {
            console.log(`  ❌ Error accessing ${dbName}: ${error.message}`);
          }
        }
        
        await client.close();
        break; // Exit the loop if we found a working connection
        
      } catch (error) {
        console.log(`❌ Failed to connect: ${error.message}`);
        if (client) {
          try {
            await client.close();
          } catch (closeError) {
            // Ignore close errors
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Overall error:', error);
  }
}

// Also test the project's mongodb.js file
async function testProjectConnection() {
  console.log('\n🔧 Testing project MongoDB connection...\n');
  
  try {
    // Import the project's connection
    const clientPromise = await import('./src/lib/mongodb.js');
    const client = await clientPromise.default;
    const db = client.db();
    
    console.log('✅ Project connection successful!');
    
    // Get database name
    const dbName = db.databaseName;
    console.log(`📊 Using database: ${dbName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`📂 Collections (${collections.length}):`);
    
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
      
      // Show samples for key collections
      if (count > 0 && ['applications', 'users', 'jobs'].includes(col.name)) {
        const samples = await db.collection(col.name).find({}).limit(2).toArray();
        console.log(`    Samples:`);
        samples.forEach((doc, i) => {
          const preview = { ...doc };
          // Truncate long fields
          Object.keys(preview).forEach(key => {
            if (typeof preview[key] === 'string' && preview[key].length > 50) {
              preview[key] = preview[key].substring(0, 50) + '...';
            }
          });
          console.log(`      ${i+1}.`, JSON.stringify(preview, null, 2));
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Project connection failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run both tests
directDbTest().then(() => {
  return testProjectConnection();
}).then(() => {
  console.log('\n🎉 Database investigation completed!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Investigation failed:', error);
  process.exit(1);
});
