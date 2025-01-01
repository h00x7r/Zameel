const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, LoginHistory } = require('../models');
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
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Check for existing pending registration
        const existingPending = await PendingRegistration.findByEmail(email);
        if (existingPending) {
            await PendingRegistration.delete(email); // Delete old pending registration
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();

        // Create pending registration
        const hashedPassword = await bcryptjs.hash(password, 10);
        await PendingRegistration.create(
            { name, email, password: hashedPassword },
            verificationCode
        );

        // Send verification email
        await sendVerificationEmail(email, verificationCode);

        res.status(201).json({ 
            message: 'Please check your email for verification code',
            email 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Step 2: Verify email and complete registration
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find pending registration
        const pendingUser = await PendingRegistration.findByEmailAndCode(email, code);
        if (!pendingUser) {
            return res.status(400).json({ message: 'Invalid or expired verification code' });
        }

        // Create verified user
        const user = await User.create({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            verified: true
        });

        // Delete pending registration
        await PendingRegistration.delete(email);

        // Generate token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Email verified and registration completed successfully',
            token
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Error verifying email' });
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
        
        res.json({ message: 'Email removed successfully' });
    } catch (error) {
        console.error('Error removing email:', error);
        res.status(500).json({ message: 'Error removing email' });
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

// Clean up expired pending registrations periodically
setInterval(async () => {
    try {
        await PendingRegistration.cleanupExpired();
    } catch (error) {
        console.error('Error cleaning up pending registrations:', error);
    }
}, 15 * 60 * 1000); // Run every 15 minutes

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if email is verified
        if (!user.verified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }

        // Check password
        const validPassword = await bcryptjs.compare(password, user.password);
        if (!validPassword) {
            // Log failed attempt
            await LoginHistory.create({
                userId: user._id,
                status: 'failed',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check for too many failed attempts
        const failedAttempts = await LoginHistory.countDocuments({ userId: user._id, status: 'failed' });
        if (failedAttempts >= 5) {
            return res.status(400).json({ message: 'Too many failed attempts. Please try again later.' });
        }

        // Log successful login
        await LoginHistory.create({
            userId: user._id,
            status: 'success',
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
});

module.exports = router;
