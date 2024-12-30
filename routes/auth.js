const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendVerificationEmail } = require('../services/emailService');
const router = express.Router();

// Generate a random 6-digit code
const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store temporary user data
const pendingRegistrations = new Map();

// Step 1: Initial registration
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Generate verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store user data temporarily
        pendingRegistrations.set(email, {
            fullName,
            email,
            password,
            verificationCode,
            verificationCodeExpires
        });

        // Send verification email
        const emailSent = await sendVerificationEmail(email, verificationCode);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.status(200).json({ 
            message: 'Verification code sent to your email',
            email: email
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Step 2: Verify email and complete registration
router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        const pendingUser = pendingRegistrations.get(email);

        if (!pendingUser) {
            return res.status(400).json({ message: 'Invalid or expired verification attempt' });
        }

        if (Date.now() > new Date(pendingUser.verificationCodeExpires).getTime()) {
            pendingRegistrations.delete(email);
            return res.status(400).json({ message: 'Verification code expired' });
        }

        if (code !== pendingUser.verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Create the user
        const hashedPassword = await bcrypt.hash(pendingUser.password, 10);
        const user = await User.create({
            fullName: pendingUser.fullName,
            email: pendingUser.email,
            password: hashedPassword,
            isVerified: true
        });

        // Clean up
        pendingRegistrations.delete(email);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Verification failed' });
    }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
    try {
        const { email } = req.body;
        const pendingUser = pendingRegistrations.get(email);

        if (!pendingUser) {
            return res.status(400).json({ message: 'No pending registration found' });
        }

        // Generate new verification code
        const verificationCode = generateVerificationCode();
        const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

        // Update pending registration
        pendingUser.verificationCode = verificationCode;
        pendingUser.verificationCodeExpires = verificationCodeExpires;
        pendingRegistrations.set(email, pendingUser);

        // Send new verification email
        const emailSent = await sendVerificationEmail(email, verificationCode);
        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send verification email' });
        }

        res.status(200).json({ 
            message: 'New verification code sent to your email',
            email: email
        });
    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ message: 'Failed to resend verification code' });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if user is verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please verify your email first' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        await user.update({ lastLogin: new Date() });

        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed' });
    }
});

module.exports = router;
