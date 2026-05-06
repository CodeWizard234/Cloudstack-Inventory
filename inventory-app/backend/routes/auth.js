const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { queueWelcomeEmail } = require('../utils/mailer');

// 1. REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body; // Added name here

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash and Save
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Create token so they are logged in immediately
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Queue welcome email in background so signup stays fast
    queueWelcomeEmail({ to: newUser.email, name: newUser.name });
    
    res.status(201).json({ 
      token, 
      user: { id: newUser._id, name: newUser.name, email: newUser.email } 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 2. LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
      res.json({ 
        token, 
        user: { id: user._id, name: user.name, email: user.email } 
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;