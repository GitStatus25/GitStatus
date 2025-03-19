const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const Plan = require('../models/Plan');

// Get all plans (admin only)
router.get('/', isAdmin, async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plans', error: error.message });
  }
});

// Create a new plan (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error creating plan', error: error.message });
  }
});

// Update a plan (admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Error updating plan', error: error.message });
  }
});

// Delete a plan (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting plan', error: error.message });
  }
});

module.exports = router; 