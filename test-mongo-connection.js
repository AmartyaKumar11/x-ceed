const { MongoClient } = require('mongodb');

// Test different connection strategies
const connectionStrings = [
    // Original SRV connection
    'mongodb+srv://amartya:amartya@x-ceed.2rfbtj5.mongodb.net/x-ceed-db?retryWrites=true&w=majority',
    
    // Try with different DNS options
    'mongodb+srv://amartya:amartya@x-ceed.2rfbtj5.mongodb.net/x-ceed-db?retryWrites=true&w=majority&family=4',
    
    // Direct connection (we'll resolve the actual hosts)
    // This will be filled in after we get host resolution
];

async function testConnection(uri, name) {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`URI: ${uri.replace(/\/\/.*@/, '//[CREDENTIALS]@')}`);
    
    const client = new MongoClient(uri, {
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        family: 4, // Force IPv4
    });
    
    try {
        await client.connect();
        console.log('✅ Connection successful!');
        await client.db().admin().ping();
        console.log('✅ Ping successful!');
        await client.close();
        return true;
    } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`);
        await client.close().catch(() => {});
        return false;
    }
}

async function main() {
    console.log('🚀 Starting MongoDB Atlas connection tests...\n');
    
    for (let i = 0; i < connectionStrings.length; i++) {
        const success = await testConnection(connectionStrings[i], `Strategy ${i + 1}`);
        if (success) {
            console.log('\n🎉 Found working connection strategy!');
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between attempts
    }
}

main().catch(console.error);
