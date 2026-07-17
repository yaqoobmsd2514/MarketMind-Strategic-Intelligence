const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Idea = require('../models/Idea');
const User = require('../models/User');

router.get('/', protect, async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;
    const query = { user: req.user._id };
    if (status !== 'all') query.status = status;
    const ideas = await Idea.find(query).sort('-createdAt');
    res.json({ success: true, ideas });
  } catch (err) { next(err); }
});

router.get('/explore', async (req, res, next) => {
  try {
    const { search, industry } = req.query;
    const filter = { isPublic: true, status: 'active' };
    if (industry && industry !== 'All') filter.industry = industry;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { product: { $regex: search, $options: 'i' } },
        { targetCity: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    const ideas = await Idea.find(filter).populate('user', 'name').sort('-createdAt').limit(50);
    res.json({ success: true, ideas });
  } catch (err) { next(err); }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, user: req.user._id });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true, idea });
  } catch (err) { next(err); }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const idea = await Idea.create({ ...req.body, user: req.user._id });
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.ideasAnalyzed': 1 } });
    res.status(201).json({ success: true, idea });
  } catch (err) { next(err); }
});

router.put('/:id', protect, async (req, res, next) => {
  try {
    const idea = await Idea.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: req.body }, { new: true });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    res.json({ success: true, idea });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, async (req, res, next) => {
  try {
    await Idea.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/milestones', protect, async (req, res, next) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, user: req.user._id });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    idea.milestones.push(req.body);
    await idea.save();
    res.json({ success: true, milestones: idea.milestones });
  } catch (err) { next(err); }
});

router.patch('/:id/milestones/:milestoneId', protect, async (req, res, next) => {
  try {
    const idea = await Idea.findOne({ _id: req.params.id, user: req.user._id });
    if (!idea) return res.status(404).json({ error: 'Idea not found' });
    const milestone = idea.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    Object.assign(milestone, req.body);
    if (req.body.completed) milestone.completedAt = new Date();
    await idea.save();
    res.json({ success: true, milestone });
  } catch (err) { next(err); }
});

module.exports = router;
