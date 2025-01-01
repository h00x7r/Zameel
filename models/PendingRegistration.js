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

        await this.delete(userData.email); // Delete any existing pending registration
        const result = await db.collection('pending_registrations').insertOne(pendingUser);
        return { ...pendingUser, _id: result.insertedId };
    }

    static async update(email, verificationCode) {
        const db = getDB();
        const result = await db.collection('pending_registrations').updateOne(
            { email },
            { 
                $set: {
                    verificationCode,
                    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // Reset expiry
                }
            }
        );
        return result.modifiedCount > 0;
    }

    static async findByEmail(email) {
        const db = getDB();
        return db.collection('pending_registrations').findOne({ email });
    }

    static async findByEmailAndCode(email, code) {
        const db = getDB();
        const pendingUser = await db.collection('pending_registrations').findOne({
            email,
            verificationCode: code,
            expiresAt: { $gt: new Date() }
        });
        console.log('Found pending user:', pendingUser); // Add logging
        return pendingUser;
    }

    static async delete(email) {
        const db = getDB();
        return db.collection('pending_registrations').deleteOne({ email });
    }

    // Clean up expired registrations
    static async cleanupExpired() {
        const db = getDB();
        return db.collection('pending_registrations').deleteMany({
            expiresAt: { $lt: new Date() }
        });
    }
}

module.exports = PendingRegistration;
