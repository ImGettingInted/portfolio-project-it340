
const helmet = require('helmet');

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(helmet());

// Parse JSON requests
app.use(express.json());

// Allow frontend requests
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));

// Configure login sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60
    }
}));

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const projectRoot = path.join(__dirname, '..');
app.use('/css', express.static(path.join(projectRoot, 'css')));
app.use('/js', express.static(path.join(projectRoot, 'js')));

app.get(['/', '/homepage.html'], (req, res) => {
    res.sendFile(path.join(projectRoot, 'homepage.html'));
});
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(projectRoot, 'login.html'));
});
app.get('/Register.html', (req, res) => {
    res.sendFile(path.join(projectRoot, 'Register.html'));
});

const PORT = process.env.PORT || 3000;
const db = require('./database');

async function startServer() {
    const placeholderValues = ['YOUR_DATABASE_VM_PRIVATE_IP', 'YOUR_MYSQL_USERNAME', 'YOUR_MYSQL_PASSWORD', 'YOUR_DATABASE_NAME', 'YOUR_RANDOM_SECRET'];
    const secret = process.env.SESSION_SECRET;

    if (
        !secret ||
        secret.startsWith('YOUR_') ||
        !process.env.DB_HOST ||
        !process.env.DB_USER ||
        !process.env.DB_PASSWORD ||
        !process.env.DB_NAME ||
        placeholderValues.some((value) =>
            [process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME, secret].includes(value)
        )
    ) {
        console.error('Authentication cannot start: configure real database credentials and SESSION_SECRET in backend/.env.');
        process.exit(1);
    }

    await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
            user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
            full_name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            PRIMARY KEY (user_id),
            UNIQUE KEY users_email_unique (email)
        )
    `);

    app.listen(PORT, () => {
        console.log(`Portfolio Hub backend running on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
});
