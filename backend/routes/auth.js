
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database');

const router = express.Router();

// USER REGISTRATION
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        // Check that all fields are strings
        if (
            typeof full_name !== 'string' ||
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                message: 'Please provide valid registration information.'
            });
        }

        // Normalize input
        const name = full_name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // Check required fields
        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({
                message: 'All fields are required.'
            });
        }

        // Check name and email length
        if (name.length > 100 || normalizedEmail.length > 150) {
            return res.status(400).json({
                message: 'Name or email is too long.'
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email.'
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters.'
            });
        }

        // bcrypt supports passwords up to 72 bytes
        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                message: 'Password exceeds the maximum supported length.'
            });
        }

        // Check for existing account
        const [existingUsers] = await db.execute(
            'SELECT user_id FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'Email is already registered.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert new account
        await db.execute(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            [name, normalizedEmail, hashedPassword]
        );

        return res.status(201).json({
            message: 'Registration successful!'
        });

    } catch (error) {
        // Handle duplicate email race condition
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Email is already registered.'
            });
        }

        req.log.error({ err: error }, 'Registration error');

        return res.status(500).json({
            message: 'Server error during registration.'
        });
    }
});

// USER LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string'
        ) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (
            !normalizedEmail ||
            normalizedEmail.length > 150 ||
            !password ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                message: 'Invalid login information.'
            });
        }

        // Find account using a parameterized query
        const [users] = await db.execute(
            'SELECT user_id, full_name, email, password_hash FROM users WHERE email = ?',
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = users[0];

        // Verify password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Regenerate session after successful login
        req.session.regenerate((error) => {
            if (error) {
                req.log.error({ err: error }, 'Session error');
                return res.status(500).json({
                    message: 'Unable to create login session.'
                });
            }

            req.session.user = {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email
            };

            req.session.save((saveError) => {
                if (saveError) {
                    req.log.error({ err: saveError }, 'Session save error');

                    return res.status(500).json({
                        message: 'Unable to save login session.'
                    });
                }

                return res.status(200).json({
                    message: 'Login successful!',
                    user: req.session.user
                });
            });
        });

    } catch (error) {
        req.log.error({ err: error }, 'Login error');

        return res.status(500).json({
            message: 'Server error during login.'
        });
    }
});

// USER LOGOUT
router.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: 'Could not log out.'
            });
        }

        res.clearCookie('connect.sid');

        return res.status(200).json({
            message: 'Logout successful!'
        });
    });
});

// CHECK LOGIN STATUS
router.get('/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'You must log in first.'
        });
    }

    return res.status(200).json({
        loggedIn: true,
        user: req.session.user
    });
});

module.exports = router;
