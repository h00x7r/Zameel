const { MongoClient } = require('mongodb');
require('dotenv').config();

let db = null;

const connectDB = async () => {
    try {
        const client = await MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zameel', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        db = client.db('zameel');
        console.log('MongoDB Connected Successfully');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};

module.exports = { connectDB, getDB };
