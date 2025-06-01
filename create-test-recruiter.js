// Create a test recruiter with known password
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createTestRecruiter() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('x-ceed-db');
        const usersCollection = db.collection('users');
        
        console.log('=== CREATING TEST RECRUITER ===\n');
        
        const email = 'test.recruiter@example.com';
        const password = 'testpass123';
        
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            console.log('Test recruiter already exists, deleting...');
            await usersCollection.deleteOne({ email });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create the user
        const userData = {
            email,
            password: hashedPassword,
            userType: 'recruiter',
            userData: {
                companyName: 'Test Company',
                position: 'Test Recruiter',
                contactNumber: '1234567890'
            },
            createdAt: new Date()
        };
        
        const result = await usersCollection.insertOne(userData);
        
        console.log('✅ Test recruiter created!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('User ID:', result.insertedId.toString());
        
        return { email, password };
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

createTestRecruiter();
