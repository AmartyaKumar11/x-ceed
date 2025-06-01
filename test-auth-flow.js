// Test authentication flow to debug "User no longer exists" error
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

async function testAuthFlow() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {        await client.connect();
        const db = client.db('x-ceed-db');
        const usersCollection = db.collection('users');
        
        console.log('=== TESTING AUTH FLOW ===\n');
        
        // 1. Find a recruiter user
        const recruiter = await usersCollection.findOne({ userType: 'recruiter' });
        
        if (!recruiter) {
            console.log('❌ No recruiter found in database');
            return;
        }
        
        console.log('✅ Found recruiter:', {
            id: recruiter._id.toString(),
            email: recruiter.email,
            userType: recruiter.userType
        });
        
        // 2. Create a JWT token like the login API does
        const tokenPayload = {
            userId: recruiter._id.toString(),
            email: recruiter.email,
            userType: recruiter.userType
        };
        
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const token = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });
        
        console.log('\n🔑 Generated JWT Token:');
        console.log('Token:', token);
        console.log('Payload:', tokenPayload);
        
        // 3. Decode the token to verify
        const decoded = jwt.decode(token, { complete: true });
        console.log('\n🔓 Decoded Token:');
        console.log('Header:', decoded.header);
        console.log('Payload:', decoded.payload);
        
        // 4. Test the middleware logic
        console.log('\n🔍 Testing Middleware Logic:');
        const userIdFromToken = decoded.payload.userId;
        console.log('UserId from token:', userIdFromToken);
        console.log('Is valid ObjectId?', ObjectId.isValid(userIdFromToken));
        
        // 5. Try to find user using the token's userId
        const userFromToken = await usersCollection.findOne({ 
            _id: new ObjectId(userIdFromToken) 
        });
        
        if (userFromToken) {
            console.log('✅ User found using token userId:', {
                id: userFromToken._id.toString(),
                email: userFromToken.email,
                userType: userFromToken.userType
            });
        } else {
            console.log('❌ User NOT found using token userId');
        }
        
        // 6. Check all users with similar IDs
        console.log('\n📋 All recruiter users in database:');
        const allRecruiters = await usersCollection.find({ userType: 'recruiter' }).toArray();
        allRecruiters.forEach((user, index) => {
            console.log(`${index + 1}. ID: ${user._id.toString()}, Email: ${user.email}`);
        });
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await client.close();
    }
}

// Run the test
testAuthFlow().catch(console.error);
