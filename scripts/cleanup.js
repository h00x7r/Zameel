const { connectDB, getDB } = require('../config/database');

async function removeUnverifiedUsers() {
    try {
        // Connect to database
        await connectDB();
        const db = getDB();
        
        // Remove unverified users
        const result = await db.collection('users').deleteMany({ verified: false });
        console.log(`Removed ${result.deletedCount} unverified users`);
        
        // Remove all pending registrations
        const pendingResult = await db.collection('pending_registrations').deleteMany({});
        console.log(`Removed ${pendingResult.deletedCount} pending registrations`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up:', error);
        process.exit(1);
    }
}

// Run the cleanup
removeUnverifiedUsers();
