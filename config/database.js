const { Sequelize } = require('sequelize');
require('dotenv').config();

// For Render.com deployment
const useSSL = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(process.env.DATABASE_URL || {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    dialectOptions: useSSL ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    logging: false
});

// Test the connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

module.exports = sequelize;
