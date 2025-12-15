const User = require('../models/User');
const AadharInfo = require('../models/AadharInfo');
const Voter = require('../models/Voter');
const Candidate = require('../models/Candidate');
const ElectionState = require('../models/ElectionState');
const Vote = require('../models/Vote');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVoters = await Voter.countDocuments();
    const verifiedVoters = await Voter.countDocuments({ isVerified: true });
    const pendingVerifications = await AadharInfo.countDocuments({ isVerified: false });
    const totalCandidates = await Candidate.countDocuments();
    const totalVotes = await Vote.countDocuments();

    const activeElection = await ElectionState.findOne({ isActive: true });

    res.json({
      success: true,
      statistics: {
        totalUsers,
        totalVoters,
        verifiedVoters,
        pendingVerifications,
        totalCandidates,
        totalVotes,
        activeElection: activeElection ? {
          name: activeElection.name,
          currentState: activeElection.currentState,
          totalVoterCasts: activeElection.totalVoterCasts
        } : null
      }
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all pending Aadhar verifications
// @route   GET /api/admin/pending-verifications
// @access  Private (Admin only)
exports.getPendingVerifications = async (req, res) => {
  try {
    const pending = await AadharInfo.find({ isVerified: false })
      .sort({ createdAt: -1 });

    // Get associated user info
    const pendingWithUsers = await Promise.all(
      pending.map(async (aadhar) => {
        const user = await User.findOne({ aadharInfo: aadhar._id })
          .select('username email createdAt');
        return {
          ...aadhar.toObject(),
          user
        };
      })
    );

    res.json({
      success: true,
      count: pendingWithUsers.length,
      verifications: pendingWithUsers
    });

  } catch (error) {
    console.error('Get Pending Verifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify Aadhar
// @route   PUT /api/admin/verify-aadhar/:aadharId
// @access  Private (Admin only)
exports.verifyAadhar = async (req, res) => {
  try {
    const aadharInfo = await AadharInfo.findById(req.params.aadharId);

    if (!aadharInfo) {
      return res.status(404).json({
        success: false,
        message: 'Aadhar info not found'
      });
    }

    if (aadharInfo.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar is already verified'
      });
    }

    // Update Aadhar verification
    aadharInfo.isVerified = true;
    aadharInfo.verifiedBy = req.user.id;
    aadharInfo.verifiedAt = new Date();
    await aadharInfo.save();

    // Update associated Voter
    await Voter.updateOne(
      { aadharInfo: aadharInfo._id },
      {
        isVerified: true,
        verifiedBy: req.user.id,
        verifiedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'Aadhar verified successfully',
      aadharInfo
    });

  } catch (error) {
    console.error('Verify Aadhar Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reject Aadhar verification
// @route   DELETE /api/admin/reject-aadhar/:aadharId
// @access  Private (Admin only)
exports.rejectAadhar = async (req, res) => {
  try {
    const aadharInfo = await AadharInfo.findById(req.params.aadharId);

    if (!aadharInfo) {
      return res.status(404).json({
        success: false,
        message: 'Aadhar info not found'
      });
    }

    // Find and delete associated voter and user
    const user = await User.findOne({ aadharInfo: aadharInfo._id });
    if (user) {
      await Voter.deleteOne({ user: user._id });
      await user.deleteOne();
    }

    await aadharInfo.deleteOne();

    res.json({
      success: true,
      message: 'Aadhar verification rejected and user removed'
    });

  } catch (error) {
    console.error('Reject Aadhar Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all voters
// @route   GET /api/admin/voters
// @access  Private (Admin only)
exports.getAllVoters = async (req, res) => {
  try {
    const voters = await Voter.find()
      .populate('user', 'username email walletAddress')
      .populate('aadharInfo', 'fullName aadharNumber isVerified phoneNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: voters.length,
      voters
    });

  } catch (error) {
    console.error('Get All Voters Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new election
// @route   POST /api/admin/create-election
// @access  Private (Admin only)
exports.createElection = async (req, res) => {
  try {
    const {
      name,
      description,
      registrationStartDate,
      registrationEndDate,
      votingStartDate,
      votingEndDate,
      contractAddress
    } = req.body;

    // Validation
    if (!name || !registrationStartDate || !registrationEndDate || !votingStartDate || !votingEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required election details'
      });
    }

    // Check if there's already an active election
    const activeElection = await ElectionState.findOne({ isActive: true });
    if (activeElection) {
      return res.status(400).json({
        success: false,
        message: 'An election is already active. Please end it before creating a new one.'
      });
    }

    // Create election
    const election = await ElectionState.create({
      name,
      description,
      currentState: 'Registration',
      registrationStartDate: new Date(registrationStartDate),
      registrationEndDate: new Date(registrationEndDate),
      votingStartDate: new Date(votingStartDate),
      votingEndDate: new Date(votingEndDate),
      totalVoters: 0,
      totalCandidates: 0,
      totalVoterCasts: 0,
      isActive: true,
      contractAddress,
      stateChangeLogs: [{
        previousState: null,
        newState: 'Registration',
        changeBy: req.user.id,
        changeAt: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Election created successfully',
      election
    });

  } catch (error) {
    console.error('Create Election Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Change election state
// @route   PUT /api/admin/change-election-state/:electionId
// @access  Private (Admin only)
exports.changeElectionState = async (req, res) => {
  try {
    const { newState, txHash } = req.body;

    if (!newState || !['Registration', 'Voting', 'Ended'].includes(newState)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid state: Registration, Voting, or Ended'
      });
    }

    const election = await ElectionState.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    const previousState = election.currentState;

    if (previousState === newState) {
      return res.status(400).json({
        success: false,
        message: 'Election is already in this state'
      });
    }

    // Update state
    election.currentState = newState;

    // Add to state change logs
    election.stateChangeLogs.push({
      previousState,
      newState,
      changeBy: req.user.id,
      changeAt: new Date(),
      txHash
    });

    // If ending election, mark as inactive
    if (newState === 'Ended') {
      election.isActive = false;
    }

    await election.save();

    res.json({
      success: true,
      message: `Election state changed to ${newState}`,
      election
    });

  } catch (error) {
    console.error('Change Election State Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Declare election result
// @route   POST /api/admin/declare-result/:electionId
// @access  Private (Admin only)
exports.declareResult = async (req, res) => {
  try {
    const { winnerId } = req.body;

    const election = await ElectionState.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    if (election.currentState !== 'Ended') {
      return res.status(400).json({
        success: false,
        message: 'Election must be ended before declaring results'
      });
    }

    const winner = await Candidate.findById(winnerId);
    if (!winner) {
      return res.status(404).json({
        success: false,
        message: 'Winner candidate not found'
      });
    }

    // Add result
    election.result.push({
      winner: winnerId,
      declaredAt: new Date(),
      declaredBy: req.user.id
    });

    await election.save();

    res.json({
      success: true,
      message: 'Election result declared successfully',
      winner: {
        name: winner.name,
        party: winner.party,
        voteCount: winner.voteCount
      }
    });

  } catch (error) {
    console.error('Declare Result Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get election details
// @route   GET /api/admin/election/:electionId
// @access  Private (Admin only)
exports.getElectionDetails = async (req, res) => {
  try {
    const election = await ElectionState.findById(req.params.electionId)
      .populate('stateChangeLogs.changeBy', 'username')
      .populate('result.winner', 'name party voteCount')
      .populate('result.declaredBy', 'username');

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    res.json({
      success: true,
      election
    });

  } catch (error) {
    console.error('Get Election Details Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reset election (DANGEROUS)
// @route   POST /api/admin/reset-election/:electionId
// @access  Private (Admin only)
exports.resetElection = async (req, res) => {
  try {
    const { confirmReset } = req.body;

    if (confirmReset !== 'RESET_ALL_VOTES') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm reset with "RESET_ALL_VOTES"'
      });
    }

    const election = await ElectionState.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    // Delete all votes for this election
    await Vote.deleteMany({ election: election._id });

    // Reset all voter statuses
    await Voter.updateMany({}, {
      hasVoted: false,
      voteAt: null,
      voteCandidateId: null,
      voteTxHash: null
    });

    // Reset all candidate vote counts
    await Candidate.updateMany({}, { voteCount: 0 });

    // Reset election state
    election.currentState = 'Registration';
    election.totalVoterCasts = 0;
    election.stateChangeLogs = [{
      previousState: 'Ended',
      newState: 'Registration',
      changeBy: req.user.id,
      changeAt: new Date()
    }];
    election.result = [];
    await election.save();

    res.json({
      success: true,
      message: 'Election reset successfully. All votes cleared.'
    });

  } catch (error) {
    console.error('Reset Election Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update User Role Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};