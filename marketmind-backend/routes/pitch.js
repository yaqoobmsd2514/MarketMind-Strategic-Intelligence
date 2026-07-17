const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Idea = require('../models/Idea');

router.post('/save/:ideaId', protect, async (req, res, next) => {
  try {
    const idea = await Idea.findOneAndUpdate(
      { _id: req.params.ideaId, user: req.user._id },
      { savedPitch: req.body.pitch }, { new: true }
    );
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:ideaId', protect, async (req, res, next) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.ideaId, user: req.user._id });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true, pitch: idea.savedPitch || null });
  } catch (err) { next(err); }
});

module.exports = router;
