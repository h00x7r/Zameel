const { MongoClient } = require('mongodb');

async function removeEmail(email) {
    // Use the direct MongoDB Atlas connection string
    const uri = 'mongodb://battle-fuschia-caution.glitch.me:27017/zameel';
    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
    });

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('zameel');
        
        // Remove from users collection
        const userResult = await db.collection('users').deleteOne({ email });
        console.log(`Removed ${userResult.deletedCount} user with email ${email}`);
        
        // Remove from pending registrations
        const pendingResult = await db.collection('pending_registrations').deleteOne({ email });
        console.log(`Removed ${pendingResult.deletedCount} pending registration with email ${email}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

removeEmail(email);
