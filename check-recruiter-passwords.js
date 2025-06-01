// Check what passwords are stored for recruiters
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function checkRecruiterPasswords() {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('x-ceed-db');
        const usersCollection = db.collection('users');
        
        console.log('=== CHECKING RECRUITER PASSWORDS ===\n');
        
        const recruiters = await usersCollection.find({ userType: 'recruiter' }).toArray();
        
        for (const recruiter of recruiters) {
            console.log(`Recruiter: ${recruiter.email}`);
            console.log(`ID: ${recruiter._id.toString()}`);
            console.log(`Password hash: ${recruiter.password ? recruiter.password.substring(0, 20) + '...' : 'No password'}`);
            
            // Try to verify with common passwords
            if (recruiter.password) {
                const commonPasswords = ['password123', 'password', '123456', 'admin'];
                for (const pwd of commonPasswords) {
                    const isMatch = await bcrypt.compare(pwd, recruiter.password);
                    if (isMatch) {
                        console.log(`✅ Password found: "${pwd}"`);
                        break;
                    }
                }
            }
            console.log('---\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
    }
}

checkRecruiterPasswords();
