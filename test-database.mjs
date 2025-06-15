// Test MongoDB connection and check for existing users
import { MongoClient } from 'mongodb';

async function testDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
        const dbName = uri.split('/')[3]?.split('?')[0] || 'x-ceed-db';
        
        console.log('Connecting to:', uri);
        console.log('Database:', dbName);
        
        const client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db(dbName);
        
        // Check if users collection exists
        const collections = await db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Check existing users
        const users = await db.collection('users').find({}).toArray();
        console.log('Existing users:', users.length);
        
        if (users.length > 0) {
            console.log('Sample user (without password):', {
                email: users[0].email,
                userType: users[0].userType,
                _id: users[0]._id
            });
        }
        
        await client.close();
        console.log('✅ Database connection test completed');
    } catch (error) {
        console.error('❌ Database test failed:', error);
    }
}

testDatabase();
