const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { isAdmin } = require('../middleware/auth');

// All routes require admin privileges
router.use(isAdmin);

// Get all plans
router.get('/', planController.getPlans);

// Update plan limits
router.put('/:planId/limits', planController.updatePlanLimits);

module.exports = router; 