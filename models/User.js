const bcryptjs = require('bcryptjs');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class User {
    static async findByEmail(email) {
        const db = getDB();
        return db.collection('users').findOne({ email });
    }

    static async findById(id) {
        const db = getDB();
        return db.collection('users').findOne({ _id: new ObjectId(id) });
    }

    static async create(userData) {
        const db = getDB();
        const hashedPassword = await bcryptjs.hash(userData.password, 10);
        
        const user = {
            ...userData,
            password: hashedPassword,
            verified: false,
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(user);
        return { ...user, _id: result.insertedId };
    }

    static async verifyEmail(email) {
        const db = getDB();
        return db.collection('users').updateOne(
            { email },
            { $set: { verified: true } }
        );
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return bcryptjs.compare(plainPassword, hashedPassword);
    }

    static async updatePassword(email, newPassword) {
        const db = getDB();
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        return db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword } }
        );
    }

    static async deleteOne(query) {
        const db = getDB();
        return db.collection('users').deleteOne(query);
    }
}

module.exports = User;
