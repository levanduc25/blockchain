const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

// Public route - anyone can view events
router.get('/', eventController.getAllEvents);

// Voter routes
router.use(protect);
router.post('/:id/vote', eventController.voteForEvent);

// Admin only routes
router.use(authorize('admin'));
router.post('/', eventController.createEvent);
router.post('/:id/candidates', eventController.addCandidateToEvent);
router.delete('/:id/candidates/:candidateId', eventController.removeCandidateFromEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;