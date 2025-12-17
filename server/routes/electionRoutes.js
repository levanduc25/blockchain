const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

router.get('/state', protect, async (req, res) => {
  try {
    const state = await blockchainService.getElectionStateFromBlockchain();
    res.json({ success: true, currentState: state });
  } catch (error) {
    console.error('Get Election State Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
