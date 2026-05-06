const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ensure this path to your User model is correct
const authMiddleware = require('../middleware/authMiddleware');
const { queueWelcomeEmail, sendPasswordResetEmail } = require('../utils/mailer');

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body || {};

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save user
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Create JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        queueWelcomeEmail({ to: email, name });

        res.status(201).json({ token, user: { id: user._id, name, email } });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: err.message || 'Server error during registration' });
    }
});

// 2. LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

        // Create JWT Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user._id, name: user.name, email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// 3. CHANGE PASSWORD ROUTE
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must be different from current password' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.json({ message: 'Password changed successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error while changing password' });
    }
});

// 4. FORGOT PASSWORD ROUTE
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const genericMessage = 'If an account exists for this email, a reset link has been sent.';
        const user = await User.findOne({ email: String(email).toLowerCase().trim() });

        if (!user) {
            return res.json({ message: genericMessage });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        user.resetPasswordTokenHash = tokenHash;
        user.resetPasswordExpires = expiresAt;
        await user.save();

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

        try {
            await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
        } catch (mailErr) {
            console.error('Password reset email failed:', mailErr.message);
        }

        return res.json({ message: genericMessage });
    } catch (err) {
        return res.status(500).json({ message: 'Server error while processing forgot password' });
    }
});

// 5. RESET PASSWORD ROUTE
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body || {};

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (String(newPassword).length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

        const user = await User.findOne({
            resetPasswordTokenHash: tokenHash,
            resetPasswordExpires: { $gt: new Date() }
        }).select('+password +resetPasswordTokenHash +resetPasswordExpires');

        if (!user) {
            return res.status(400).json({ message: 'Reset token is invalid or expired' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordTokenHash = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error while resetting password' });
    }
});

module.exports = router;