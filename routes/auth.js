const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const PendingRegistration = require('../models/PendingRegistration');
const { sendVerificationEmail } = require('../services/emailService');
const router = express.Router();

// Generate a random 6-digit code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Step 1: Initial registration
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Registration request for email:', email);

        // Check if user already exists and is verified
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.verified) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check for existing pending registration
        const existingPending = await PendingRegistration.findByEmail(email);
        if (existingPending) {
            await PendingRegistration.delete(email); // Delete old pending registration
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        console.log('Generated verification code for:', email);

        // Hash password
        const hashedPassword = await bcryptjs.hash(password, 10);
        console.log('Hashed password for:', email);

        // Create pending registration
        await PendingRegistration.create(
            { email, password: hashedPassword },
            verificationCode
        );

        // Send verification email
        await sendVerificationEmail(email, verificationCode);
        console.log('Sent verification email to:', email);

        res.status(201).json({ 
            message: 'Please check your email for verification code',
            email 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user: ' + error.message });
    }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists and is already verified
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.verified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();

        // Check for existing pending registration
        const existingPending = await PendingRegistration.findByEmail(email);
        
        if (existingPending) {
            // Update existing pending registration with new code
            const updated = await PendingRegistration.update(email, verificationCode);
            if (!updated) {
                // If update fails, create new registration
                await PendingRegistration.create({ email }, verificationCode);
            }
        } else {
            // If no pending registration exists, create a new one
            await PendingRegistration.create({ email }, verificationCode);
        }

        // Send new verification email
        await sendVerificationEmail(email, verificationCode);

        res.json({ 
            message: 'New verification code sent to your email',
            email 
        });
    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ message: 'Error resending verification code' });
    }
});

// Step 2: Verify email and complete registration
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;
        console.log('Verifying email:', email, 'with code:', code);

        // Find pending registration
        const pendingUser = await PendingRegistration.findByEmailAndCode(email, code);
        console.log('Found pending user:', pendingUser);

        if (!pendingUser) {
            console.log('No pending registration found or code expired');
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Check if user already exists
        let user = await User.findByEmail(email);
        
        if (user) {
            // Update existing user
            console.log('Updating existing user:', email);
            await User.verifyEmail(email);
            user = await User.findByEmail(email);
        } else {
            // Create new verified user
            console.log('Creating new verified user:', email);
            user = await User.create({
                name: email.split('@')[0],
                email: pendingUser.email,
                password: pendingUser.password,
                verified: true
            });
        }

        console.log('User after verification:', { ...user, password: '[HIDDEN]' });

        // Delete pending registration
        await PendingRegistration.delete(email);
        console.log('Deleted pending registration');

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Generated token');

        res.json({ 
            message: 'Email verified and registration completed successfully',
            token,
            verified: true
        });
    } catch (error) {
        console.error('Verification error details:', error);
        res.status(500).json({ message: 'Error verifying email: ' + error.message });
    }
});

// Remove unverified email
router.delete('/remove-unverified/:email', async (req, res) => {
    try {
        const { email } = req.params;
        
        // Remove from users collection if unverified
        await User.deleteOne({ email, verified: false });
        
        // Remove any pending registrations
        await PendingRegistration.delete(email);
        
        res.json({ message: 'Unverified email removed successfully' });
    } catch (error) {
        console.error('Remove unverified error:', error);
        res.status(500).json({ message: 'Error removing unverified email' });
    }
});

// Force cleanup unverified email
router.post('/force-cleanup', async (req, res) => {
    try {
        const { email } = req.body;
        const db = getDB();
        
        // Remove from users collection
        const userResult = await db.collection('users').deleteOne({ 
            email,
            verified: false 
        });
        
        // Remove from pending registrations
        const pendingResult = await db.collection('pending_registrations').deleteOne({ 
            email 
        });

        console.log(`Cleaned up: Users=${userResult.deletedCount}, Pending=${pendingResult.deletedCount}`);
        
        res.json({ 
            message: 'Cleanup successful',
            userRemoved: userResult.deletedCount > 0,
            pendingRemoved: pendingResult.deletedCount > 0
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({ message: 'Error during cleanup' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Find user
        const user = await User.findByEmail(email);
        console.log('Found user:', user ? { ...user, password: '[HIDDEN]' } : null);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password first
        const isValidPassword = await bcryptjs.compare(password, user.password);
        console.log('Password check result:', isValidPassword);

        if (!isValidPassword) {
            // Log failed attempt
            await LoginHistory.create({
                userId: user._id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                status: 'failed'
            });

            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Now check if email is verified
        if (!user.verified) {
            // Generate new verification code
            const verificationCode = generateVerificationCode();
            console.log('Generated new verification code for unverified user:', email);

            // Create pending registration
            await PendingRegistration.create(
                { email, password: user.password },
                verificationCode
            );

            // Send verification email
            await sendVerificationEmail(email, verificationCode);
            console.log('Sent new verification email to:', email);

            // Log failed attempt due to unverified email
            await LoginHistory.create({
                userId: user._id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                status: 'unverified'
            });

            return res.status(401).json({ 
                message: 'Please verify your email first',
                requiresVerification: true 
            });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log successful login
        await LoginHistory.create({
            userId: user._id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'success'
        });

        console.log('Login successful for:', email);
        res.json({ 
            token,
            message: 'Login successful',
            verified: true
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error during login: ' + error.message });
    }
});

// Clean up expired pending registrations periodically
setInterval(async () => {
    try {
        await PendingRegistration.cleanupExpired();
    } catch (error) {
        console.error('Error cleaning up pending registrations:', error);
    }
}, 15 * 60 * 1000); // Run every 15 minutes

module.exports = router;
