import express from 'express';
import bcrypt from 'bcrypt';
import { getDB } from '../utils/db.js';
import { ObjectId } from 'mongodb'; // For fetching user by _id
import { requireLogin } from '../utils/authMiddleware.js'; // For protecting profile route

const router = express.Router();
const SALT_ROUNDS = 10; // For bcrypt

// GET login page
router.get('/login', (req, res) => {
  // If already logged in, redirect to quiz setup
  if (req.session && req.session.userId) {
    return res.redirect('/quiz/setup');
  }
  res.render('login', { error: null });
});

// POST login form
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.render('login', {
      error: 'Username and password are required'
    });
  }

  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ username });

    if (user && await bcrypt.compare(password, user.password)) {
      // Store user ID in session
      req.session.userId = user._id.toString(); // Convert ObjectId to string
      req.session.username = user.username;

      // Redirect to quiz setup
      res.redirect('/quiz/setup');
    } else {
      console.log(user);
      res.render('login', {
        error: 'Invalid username or password',
        username // Keep the entered username for convenience
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).render('login', { // Send 500 status for server errors
      error: 'An error occurred during login. Please try again.',
      username
    });
  }
});

// GET signup page
router.get('/signup', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/quiz/setup');
  }
  res.render('signup', { error: null });
});

// POST signup form
router.post('/signup', async (req, res) => {
  const { username, password, confirmPassword } = req.body;

  // Validate input
  if (!username || !password) {
    return res.render('signup', {
      error: 'Username and password are required',
      username
    });
  }

  if (password !== confirmPassword) {
    return res.render('signup', {
      error: 'Passwords do not match',
      username
    });
  }

  try {
    const db = getDB();
    const existingUser = await db.collection('users').findOne({ username });

    if (existingUser) {
      return res.render('signup', {
        error: 'Username already exists',
        username
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = {
      username,
      password: hashedPassword,
      totalAccumulatedScore: 0,
      quizHistory: [],
      createdAt: new Date() // MongoDB will store as ISODate
    };

    const result = await db.collection('users').insertOne(newUser);

    // Log the user in
    req.session.userId = result.insertedId.toString(); // Get the new user's _id
    req.session.username = newUser.username;

    // Redirect to quiz setup
    res.redirect('/quiz/setup');
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).render('signup', { // Send 500 status for server errors
      error: 'An error occurred during signup. Please try again.',
      username
    });
  }
});

// GET logout
router.get('/logout', (req, res) => {
  // Destroy session
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/auth/login');
  });
});

export default router;

// GET user profile page
router.get('/profile', requireLogin, async (req, res) => {
  try {
    const db = getDB();
    const userId = req.session.userId;

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

    if (!user) {
      // This should not happen if requireLogin and session are working
      console.error(`User not found for profile: ${userId}`);
      return res.redirect('/auth/login');
    }

    // Sort quiz history by date, most recent first
    const sortedQuizHistory = user.quizHistory ? user.quizHistory.sort((a, b) => new Date(b.datePlayed) - new Date(a.datePlayed)) : [];

    res.render('profile', {
      username: user.username,
      email: user.email,
      totalAccumulatedScore: user.totalAccumulatedScore || 0,
      quizHistory: sortedQuizHistory,
      memberSince: user.createdAt,
      error: null
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).render('error', { // Generic error page
        username: req.session.username,
        message: 'Could not load your profile. Please try again later.',
        error
    });
  }
});
