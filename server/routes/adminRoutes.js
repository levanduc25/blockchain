const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/pending-verifications', adminController.getPendingVerifications);
router.put('/verify-aadhar/:aadharId', adminController.verifyAadhar);
router.delete('/reject-aadhar/:aadharId', adminController.rejectAadhar);
router.get('/voters', adminController.getAllVoters);
router.post('/create-election', adminController.createElection);
router.put('/change-election-state/:electionId', adminController.changeElectionState);
router.post('/declare-result/:electionId', adminController.declareResult);
router.get('/election/:electionId', adminController.getElectionDetails);
router.post('/reset-election/:electionId', adminController.resetElection);

router.get('/users', adminController.getAllUsers);
router.put('/users/:id/role', adminController.updateUserRole);

module.exports = router;
