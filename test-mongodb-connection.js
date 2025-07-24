const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env.local' });

console.log('🧪 Testing MongoDB Atlas Connection...');

// Force disable SSL rejection
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('📍 Connection URI:', uri.replace(/\/\/[^:]+:[^@]+@/, '//[CREDENTIALS]@'));

async function testConnection() {
  const strategies = [
    {
      name: 'No TLS/SSL',
      options: {}
    },
    {
      name: 'TLS with bypass',
      options: {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true
      }
    },
    {
      name: 'SSL with no validation',
      options: {
        ssl: true,
        sslValidate: false
      }
    },
    {
      name: 'Standard connection',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    }
  ];

  for (const strategy of strategies) {
    let client;
    try {
      console.log(`\n🔄 Testing strategy: ${strategy.name}`);
      console.log('   Options:', JSON.stringify(strategy.options, null, 2));
      
      client = new MongoClient(uri, {
        ...strategy.options,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000
      });
      
      console.log('   Connecting...');
      await client.connect();
      
      console.log('   Testing ping...');
      await client.db('admin').command({ ping: 1 });
      
      console.log('   Testing database access...');
      const db = client.db('x-ceed-db'); // Use correct database name
      const collections = await db.listCollections().toArray();
      
      console.log(`✅ SUCCESS with strategy: ${strategy.name}`);
      console.log(`   Collections found: ${collections.length}`);
      console.log(`   Collection names: ${collections.map(c => c.name).join(', ')}`);
      
      // Test a query
      const users = db.collection('users');
      const userCount = await users.countDocuments();
      console.log(`   User count: ${userCount}`);
      
      await client.close();
      console.log('🎉 Connection test completed successfully!');
      return;
      
    } catch (error) {
      console.error(`❌ Strategy "${strategy.name}" failed:`);
      console.error('   Error:', error.message);
      console.error('   Code:', error.code);
      
      if (client) {
        try {
          await client.close();
        } catch (closeError) {
          // Ignore
        }
      }
    }
  }
  
  console.error('\n💥 All connection strategies failed!');
  process.exit(1);
}

testConnection().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
