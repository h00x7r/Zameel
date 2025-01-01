const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class LoginHistory {
    static async create(data) {
        const db = getDB();
        const loginRecord = {
            userId: ObjectId(data.userId),
            loginTime: new Date(),
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
            status: data.status || 'success',
            createdAt: new Date()
        };

        const result = await db.collection('login_history').insertOne(loginRecord);
        return { ...loginRecord, _id: result.insertedId };
    }

    static async findByUserId(userId) {
        const db = getDB();
        return db.collection('login_history')
            .find({ userId: ObjectId(userId) })
            .sort({ loginTime: -1 })
            .toArray();
    }

    static async findFailedAttempts(userId, minutes = 30) {
        const db = getDB();
        const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
        
        return db.collection('login_history').countDocuments({
            userId: ObjectId(userId),
            status: 'failed',
            loginTime: { $gt: cutoffTime }
        });
    }
}

module.exports = LoginHistory;
