const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

class Admin {
    static async findByEmail(email) {
        const db = getDB();
        console.log('Finding admin by email:', email);
        const admin = await db.collection('admins').findOne({ email });
        console.log('Found admin:', admin ? { ...admin, password: '[HIDDEN]' } : null);
        return admin;
    }

    static async findById(id) {
        const db = getDB();
        console.log('Finding admin by ID:', id);
        const admin = await db.collection('admins').findOne({ _id: new ObjectId(id) });
        console.log('Found admin:', admin ? { ...admin, password: '[HIDDEN]' } : null);
        return admin;
    }

    static async create(adminData) {
        const db = getDB();
        console.log('Creating admin:', { ...adminData, password: '[HIDDEN]' });

        const admin = {
            email: adminData.email,
            role: adminData.role || 'editor', // 'superadmin', 'admin', 'editor'
            permissions: adminData.permissions || {
                manageAdmins: false,
                manageContent: true,
                manageUsers: false,
                viewAnalytics: true
            },
            createdAt: new Date(),
            createdBy: adminData.createdBy // ID of admin who created this admin
        };

        const result = await db.collection('admins').insertOne(admin);
        return { ...admin, _id: result.insertedId };
    }

    static async update(id, updateData) {
        const db = getDB();
        console.log('Updating admin:', id, updateData);

        const allowedUpdates = ['role', 'permissions'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field];
            }
        });

        updates.updatedAt = new Date();

        const result = await db.collection('admins').updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        return result;
    }

    static async delete(id) {
        const db = getDB();
        console.log('Deleting admin:', id);

        // Don't allow deleting the last superadmin
        const superadminCount = await db.collection('admins').countDocuments({ role: 'superadmin' });
        const adminToDelete = await this.findById(id);

        if (superadminCount <= 1 && adminToDelete.role === 'superadmin') {
            throw new Error('Cannot delete the last superadmin');
        }

        return db.collection('admins').deleteOne({ _id: new ObjectId(id) });
    }

    static async list(filter = {}) {
        const db = getDB();
        return db.collection('admins')
            .find(filter)
            .project({ password: 0 }) // Don't send passwords
            .sort({ createdAt: -1 })
            .toArray();
    }

    static async hasPermission(adminId, permission) {
        const admin = await this.findById(adminId);
        if (!admin) return false;

        // Superadmin has all permissions
        if (admin.role === 'superadmin') return true;

        // Admin has all permissions except managing other admins
        if (admin.role === 'admin' && permission !== 'manageAdmins') return true;

        // Check specific permissions for editors
        return admin.permissions && admin.permissions[permission] === true;
    }
}

module.exports = Admin;
