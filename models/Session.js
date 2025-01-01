const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Session {
    static async create(sessionData) {
        const db = getDB();
        const session = {
            ...sessionData,
            userId: new ObjectId(sessionData.userId),
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
        };

        const result = await db.collection('sessions').insertOne(session);
        return { ...session, _id: result.insertedId };
    }

    static async findById(sessionId) {
        const db = getDB();
        return db.collection('sessions').findOne({ _id: new ObjectId(sessionId) });
    }

    static async findByUserId(userId) {
        const db = getDB();
        return db.collection('sessions').find({ 
            userId: new ObjectId(userId),
            expiresAt: { $gt: new Date() }
        }).toArray();
    }

    static async deleteById(sessionId) {
        const db = getDB();
        return db.collection('sessions').deleteOne({ _id: new ObjectId(sessionId) });
    }

    static async deleteExpired() {
        const db = getDB();
        return db.collection('sessions').deleteMany({
            expiresAt: { $lt: new Date() }
        });
    }

    static async deleteAllUserSessions(userId) {
        const db = getDB();
        return db.collection('sessions').deleteMany({ 
            userId: new ObjectId(userId)
        });
    }
}

module.exports = Session;
