const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const voterController = require('../controllers/voterController');

// Public: verify a vote by txHash
router.get('/verify-vote/:txHash', voterController.verifyVote);

// Protected voter endpoints
router.use(protect);
router.get('/profile', voterController.getProfile);
router.get('/can-vote', voterController.canVote);
router.post('/vote', voterController.castVote);
router.get('/voting-history', voterController.getVotingHistory);

module.exports = router;
