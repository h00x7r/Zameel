const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class PendingRegistration {
    static async create(userData, verificationCode) {
        const db = getDB();
        const pendingUser = {
            ...userData,
            verificationCode,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry
        };

        console.log('Creating pending registration:', pendingUser);
        await this.delete(userData.email); // Delete any existing pending registration
        const result = await db.collection('pending_registrations').insertOne(pendingUser);
        console.log('Created pending registration with ID:', result.insertedId);
        return { ...pendingUser, _id: result.insertedId };
    }

    static async update(email, verificationCode) {
        const db = getDB();
        console.log('Updating verification code for email:', email);
        const result = await db.collection('pending_registrations').updateOne(
            { email },
            { 
                $set: {
                    verificationCode,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // Reset expiry
                }
            }
        );
        console.log('Update result:', result);
        return result.modifiedCount > 0;
    }

    static async findByEmail(email) {
        const db = getDB();
        console.log('Finding pending registration by email:', email);
        const result = await db.collection('pending_registrations').findOne({ email });
        console.log('Found pending registration:', result);
        return result;
    }

    static async findByEmailAndCode(email, code) {
        const db = getDB();
        console.log('Finding pending registration by email and code:', { email, code });
        
        const now = new Date();
        console.log('Current time:', now);
        
        const pendingUser = await db.collection('pending_registrations').findOne({
            email,
            verificationCode: code,
            expiresAt: { $gt: now }
        });
        
        if (!pendingUser) {
            console.log('No valid pending registration found');
            // Check if there's an expired one
            const expired = await db.collection('pending_registrations').findOne({
                email,
                verificationCode: code,
                expiresAt: { $lte: now }
            });
            if (expired) {
                console.log('Found expired registration:', expired);
            }
        } else {
            console.log('Found valid pending registration:', pendingUser);
        }
        
        return pendingUser;
    }

    static async delete(email) {
        const db = getDB();
        console.log('Deleting pending registration for email:', email);
        const result = await db.collection('pending_registrations').deleteOne({ email });
        console.log('Delete result:', result);
        return result;
    }

    // Clean up expired registrations
    static async cleanupExpired() {
        const db = getDB();
        console.log('Cleaning up expired registrations');
        const result = await db.collection('pending_registrations').deleteMany({
            expiresAt: { $lt: new Date() }
        });
        console.log('Cleanup result:', result);
        return result;
    }
}

module.exports = PendingRegistration;
