const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const user = await User.create({ name, email, password });
    const { accessToken, refreshToken } = generateTokens(user._id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ success: true, accessToken, user: user.toPublicJSON() });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    user.stats.lastActive = new Date();
    await user.save();
    const { accessToken, refreshToken } = generateTokens(user._id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, accessToken, user: user.toPublicJSON() });
  } catch (err) { next(err); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const { accessToken, refreshToken } = generateTokens(user._id);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ accessToken, user: user.toPublicJSON() });
  } catch (err) { res.status(401).json({ error: 'Invalid refresh token' }); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ user: user.toPublicJSON() });
  } catch (err) { next(err); }
});

module.exports = router;
