const bcryptjs = require('bcryptjs');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class User {
    static async findByEmail(email) {
        const db = getDB();
        console.log('Finding user by email:', email);
        const user = await db.collection('users').findOne({ email });
        console.log('Found user:', user ? { ...user, password: '[HIDDEN]' } : null);
        return user;
    }

    static async findById(id) {
        const db = getDB();
        console.log('Finding user by ID:', id);
        const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
        console.log('Found user:', user ? { ...user, password: '[HIDDEN]' } : null);
        return user;
    }

    static async create(userData) {
        const db = getDB();
        console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });
        
        const user = {
            name: userData.name || userData.email.split('@')[0],
            email: userData.email,
            password: userData.password, // Already hashed from PendingRegistration
            verified: userData.verified || false,
            createdAt: new Date()
        };

        // Check if user already exists
        const existingUser = await this.findByEmail(user.email);
        if (existingUser) {
            if (existingUser.verified) {
                throw new Error('Email already registered and verified');
            }
            // Update existing unverified user
            console.log('Updating existing unverified user:', user.email);
            const result = await db.collection('users').updateOne(
                { email: user.email },
                { $set: { 
                    verified: user.verified,
                    password: user.password,
                    updatedAt: new Date()
                }}
            );
            console.log('Update result:', result);
            return { ...existingUser, ...user };
        }

        console.log('Inserting new user:', { ...user, password: '[HIDDEN]' });
        const result = await db.collection('users').insertOne(user);
        console.log('Created user with ID:', result.insertedId);
        return { ...user, _id: result.insertedId };
    }

    static async verifyEmail(email) {
        const db = getDB();
        console.log('Verifying email for user:', email);
        const result = await db.collection('users').updateOne(
            { email },
            { 
                $set: { 
                    verified: true,
                    updatedAt: new Date()
                }
            }
        );
        console.log('Verify email result:', result);
        return result;
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return bcryptjs.compare(plainPassword, hashedPassword);
    }

    static async updatePassword(email, newPassword) {
        const db = getDB();
        console.log('Updating password for user:', email);
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        const result = await db.collection('users').updateOne(
            { email },
            { 
                $set: { 
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            }
        );
        console.log('Update password result:', result);
        return result;
    }

    static async deleteOne(query) {
        const db = getDB();
        console.log('Deleting user with query:', query);
        const result = await db.collection('users').deleteOne(query);
        console.log('Delete result:', result);
        return result;
    }
}

module.exports = User;
