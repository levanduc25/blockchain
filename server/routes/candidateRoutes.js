const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const candidateController = require('../controllers/candidateController');

// Public routes - anyone can view candidates
router.get('/', candidateController.getAllCandidates);
router.get('/results', candidateController.getResults);
router.get('/:id', candidateController.getCandidateById);

// Protected routes - authenticated users can create candidates
router.use(protect);
router.post('/', candidateController.createCandidate);

// Admin only routes
router.use(authorize('admin'));
router.put('/:id', candidateController.updateCandidate);
router.put('/:id/verify', candidateController.verifyCandidate);
router.delete('/:id', candidateController.deleteCandidate);

module.exports = router;
