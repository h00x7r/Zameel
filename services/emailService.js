const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (email, code) => {
    const domain = process.env.DOMAIN || 'https://zameel.rf.gd';
    
    try {
        await transporter.sendMail({
            from: `Zameel Platform <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Email Verification - Zameel Platform',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Welcome to Zameel Platform!</h2>
                    <p>Thank you for registering. To complete your registration, please use the following verification code:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4a90e2; letter-spacing: 5px; margin: 0;">${code}</h1>
                    </div>
                    <p>This code will expire in 10 minutes.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">
                        Visit our website: <a href="${domain}" style="color: #4a90e2; text-decoration: none;">${domain}</a>
                    </p>
                    <p style="color: #666; font-size: 12px;">
                        Contact us: <a href="mailto:support@zameel.rf.gd" style="color: #4a90e2; text-decoration: none;">support@zameel.rf.gd</a>
                    </p>
                    <p style="color: #666; font-size: 12px;">
                        This is an automated message, please do not reply.
                    </p>
                </div>
            `
        });
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

module.exports = {
    sendVerificationEmail
};
