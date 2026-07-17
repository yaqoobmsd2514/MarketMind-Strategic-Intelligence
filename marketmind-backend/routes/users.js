const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, profile } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (profile) updates.profile = profile;
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) { next(err); }
});

router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
