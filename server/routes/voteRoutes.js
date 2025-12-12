const express = require('express');
const router = express.Router();

// Placeholder routes for votes. No controller implemented yet.
router.get('/', (req, res) => {
  res.status(501).json({ success: false, message: 'Vote routes not implemented' });
});

module.exports = router;
