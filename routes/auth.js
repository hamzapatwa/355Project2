import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readData, writeData } from '../utils/dataUtils.js';

const router = express.Router();

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
    const users = await readData('UserData');
    const user = await users.find({"username":username,"password":password}).toArray();
    
    if (user[0]!= undefined) {
      // Store user ID in session
      //console.log(user);
      req.session.userId = user[0]._id;
      req.session.username = user[0].username;
      
      // Optional: Set admin status if needed
      req.session.isAdmin = user[0].isAdmin || false;
      // Redirect to quiz setup
      res.redirect('/quiz/setup');
    } else {
      console.log(user);
      res.render('login', {
        error: 'Invalid username or password',
        usernameP: username// Keep the entered username for convenience
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      error: 'An error occurred during login',
      usernameP: username
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
    const users = await readData('UserData');
    const user = await users.find({"username":username,"password":password}).toArray();
    // Check if username is already taken
    if (user[0]!= undefined) {
      return res.render('signup', {
        error: 'Username already exists',
        username
      });
    }
    
    // Create new user
    const newUser = {
      id: uuidv4(),
      username,
      password, // Note: In a real app, this should be hashed
      isAdmin: false, // Default to non-admin
      createdAt: new Date().toISOString()
    };
    
    // Add user to database
    await writeData(newUser,users);
    
    // Log the user in
    req.session.userId = newUser.id;
    req.session.username = newUser.username;
    
    // Redirect to quiz setup
    res.redirect('/quiz/setup');
  } catch (error) {
    console.error('Signup error:', error);
    res.render('signup', {
      error: 'An error occurred during signup',
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
