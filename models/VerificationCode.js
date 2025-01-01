const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class VerificationCode {
    static async create(userId, code) {
        const db = getDB();
        const verificationCode = {
            userId: ObjectId(userId),
            code,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            createdAt: new Date()
        };

        const result = await db.collection('verification_codes').insertOne(verificationCode);
        return { ...verificationCode, _id: result.insertedId };
    }

    static async findByCode(code) {
        const db = getDB();
        return db.collection('verification_codes').findOne({ 
            code,
            expiresAt: { $gt: new Date() }
        });
    }

    static async deleteByUserId(userId) {
        const db = getDB();
        return db.collection('verification_codes').deleteMany({ 
            userId: ObjectId(userId)
        });
    }

    static async deleteExpired() {
        const db = getDB();
        return db.collection('verification_codes').deleteMany({
            expiresAt: { $lt: new Date() }
        });
    }
}

module.exports = VerificationCode;
