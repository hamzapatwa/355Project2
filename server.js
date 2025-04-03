#!/usr/bin/env node
import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid'; // For session secret

// Replicate __dirname functionality for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS)
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies (form data)
app.use(session({
    secret: 'quiz-app-fixed-secret', // Using a fixed secret to maintain sessions across server restarts
    resave: false,
    saveUninitialized: true, // Save session even if not modified (needed for tracking quiz state)
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // Session expires after 24 hours of inactivity
    }
}));

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quiz.js';

// Root route - redirect to login page
app.get('/', (req, res) => {
    // Redirect to login or quiz setup based on session
    if (req.session && req.session.userId) {
        res.redirect('/quiz/setup');
    } else {
        res.redirect('/auth/login');
    }
});

// Register routes
app.use('/auth', authRoutes);
app.use('/quiz', quizRoutes);

// Error handler for 404
app.use((req, res, next) => {
    res.status(404).render('error', {
        username: req.session && req.session.username ? req.session.username : undefined,
        message: 'Page not found',
        error: { status: 404 }
    });
});

// Error handler for other errors
app.use((err, req, res, next) => {
    res.status(err.status || 500).render('error', {
        username: req.session && req.session.username ? req.session.username : undefined,
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
