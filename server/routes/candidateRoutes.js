const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const candidateController = require('../controllers/candidateController');

router.get('/', candidateController.getAllCandidates);
router.get('/results', candidateController.getResults);
router.get('/:id', candidateController.getCandidateById);

router.use(protect, authorize('admin'));
router.post('/', candidateController.createCandidate);
router.put('/:id', candidateController.updateCandidate);
router.put('/:id/verify', candidateController.verifyCandidate);
router.delete('/:id', candidateController.deleteCandidate);

module.exports = router;
