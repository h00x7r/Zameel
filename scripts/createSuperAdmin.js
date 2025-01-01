require('dotenv').config();
const { connectDB } = require('../config/database');
const Admin = require('../models/Admin');

const createSuperAdmin = async () => {
    try {
        await connectDB();
        
        const email = 'h00x7r@gmail.com';
        
        // Check if superadmin already exists
        const existingAdmin = await Admin.findByEmail(email);
        if (existingAdmin) {
            console.log('Superadmin already exists');
            process.exit(0);
        }

        // Create superadmin
        const admin = await Admin.create({
            email,
            role: 'superadmin',
            permissions: {
                manageAdmins: true,
                manageContent: true,
                manageUsers: true,
                viewAnalytics: true
            }
        });

        console.log('Superadmin created successfully:', admin);
        process.exit(0);
    } catch (error) {
        console.error('Error creating superadmin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
