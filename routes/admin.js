const express = require('express');
const Admin = require('../models/Admin');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Middleware to check admin permissions
const checkPermission = (permission) => {
    return async (req, res, next) => {
        try {
            const hasPermission = await Admin.hasPermission(req.admin._id, permission);
            if (!hasPermission) {
                return res.status(403).json({ message: 'Permission denied' });
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Error checking permissions' });
        }
    };
};

// List all admins
router.get('/admins', authenticateAdmin, checkPermission('manageAdmins'), async (req, res) => {
    try {
        const admins = await Admin.list();
        res.json(admins);
    } catch (error) {
        console.error('Error listing admins:', error);
        res.status(500).json({ message: 'Error listing admins' });
    }
});

// Create new admin
router.post('/admins', authenticateAdmin, checkPermission('manageAdmins'), async (req, res) => {
    try {
        const { email, role, permissions } = req.body;

        // Check if admin already exists
        const existingAdmin = await Admin.findByEmail(email);
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create admin
        const admin = await Admin.create({
            email,
            role,
            permissions,
            createdBy: req.admin._id
        });

        res.status(201).json(admin);
    } catch (error) {
        console.error('Error creating admin:', error);
        res.status(500).json({ message: 'Error creating admin' });
    }
});

// Update admin
router.put('/admins/:id', authenticateAdmin, checkPermission('manageAdmins'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role, permissions } = req.body;

        // Don't allow changing own role (prevent lockout)
        if (id === req.admin._id.toString() && role) {
            return res.status(400).json({ message: 'Cannot change own role' });
        }

        const result = await Admin.update(id, { role, permissions });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.json({ message: 'Admin updated successfully' });
    } catch (error) {
        console.error('Error updating admin:', error);
        res.status(500).json({ message: 'Error updating admin' });
    }
});

// Delete admin
router.delete('/admins/:id', authenticateAdmin, checkPermission('manageAdmins'), async (req, res) => {
    try {
        const { id } = req.params;

        // Don't allow self-deletion
        if (id === req.admin._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete own account' });
        }

        await Admin.delete(id);
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ 
            message: error.message === 'Cannot delete the last superadmin' 
                ? error.message 
                : 'Error deleting admin' 
        });
    }
});

// Get current admin's profile
router.get('/profile', authenticateAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin._id);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Don't send sensitive info
        const { password, ...adminData } = admin;
        res.json(adminData);
    } catch (error) {
        console.error('Error getting admin profile:', error);
        res.status(500).json({ message: 'Error getting admin profile' });
    }
});

module.exports = router;
