const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Idea = require('../models/Idea');

router.get('/summary', protect, async (req, res, next) => {
  try {
    const ideas = await Idea.find({ user: req.user._id, status: 'active' });
    const analyzed = ideas.filter(i => i.analysis?.viabilityScore);
    const avgViability = analyzed.length ? Math.round(analyzed.reduce((s, i) => s + i.analysis.viabilityScore, 0) / analyzed.length) : 0;
    res.json({ success: true, summary: { totalIdeas: ideas.length, analyzedIdeas: analyzed.length, avgViability } });
  } catch (err) { next(err); }
});

module.exports = router;
