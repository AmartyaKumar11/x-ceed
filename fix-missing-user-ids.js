// Migration script to fix missing userId field in existing applications
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixMissingUserIds() {
  console.log('🔧 Fixing missing userId fields in applications...\n');

  let client;
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/x-ceed-db';
    let dbName;
    
    // Extract database name from URI
    if (mongoUri.includes('/') && !mongoUri.endsWith('/')) {
      const uriParts = mongoUri.split('/');
      dbName = uriParts[uriParts.length - 1].split('?')[0];
    } else {
      dbName = process.env.DB_NAME || 'x-ceed-db';
    }
    
    console.log(`🔗 Connecting to: ${mongoUri}`);
    console.log(`📋 Using database: ${dbName}`);
    
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(dbName);

    // Find applications with missing userId but existing applicantId
    const applicationsToFix = await db.collection('applications').find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: undefined }
      ],
      applicantId: { $exists: true }
    }).toArray();

    console.log(`📊 Found ${applicationsToFix.length} applications with missing userId field`);

    if (applicationsToFix.length === 0) {
      console.log('✅ No applications need fixing!');
      return;
    }

    // Show what will be fixed
    console.log('\n🔍 Applications to fix:');
    applicationsToFix.slice(0, 5).forEach((app, index) => {
      console.log(`${index + 1}. Job: ${app.jobId}, ApplicantId: ${app.applicantId}, Status: ${app.status}`);
    });

    if (applicationsToFix.length > 5) {
      console.log(`... and ${applicationsToFix.length - 5} more`);
    }

    // Fix each application by copying applicantId to userId
    let fixedCount = 0;
    for (const app of applicationsToFix) {
      try {
        await db.collection('applications').updateOne(
          { _id: app._id },
          { 
            $set: { 
              userId: app.applicantId,
              updatedAt: new Date()
            } 
          }
        );
        fixedCount++;
      } catch (error) {
        console.error(`❌ Failed to fix application ${app._id}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully fixed ${fixedCount} applications`);

    // Verify the fix
    const verifyFixed = await db.collection('applications').find({
      $or: [
        { userId: { $exists: false } },
        { userId: null },
        { userId: undefined }
      ]
    }).toArray();

    console.log(`\n🔍 Verification: ${verifyFixed.length} applications still have missing userId`);

    if (verifyFixed.length === 0) {
      console.log('🎉 All applications now have proper userId field!');
    } else {
      console.log('⚠️  Some applications still need manual review:');
      verifyFixed.slice(0, 3).forEach((app, index) => {
        console.log(`${index + 1}. ID: ${app._id}, Job: ${app.jobId}, ApplicantId: ${app.applicantId}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the migration
fixMissingUserIds()
  .then(() => console.log('\n✅ Migration completed!'))
  .catch(console.error);
