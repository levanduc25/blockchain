// controllers/voterController.js
const mongoose = require('mongoose');
const Voter = require('../models/Voter');
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const AadharInfo = require('../models/AadharInfo');
const ElectionState = require('../models/ElectionState');
const User = require('../models/User');

// @desc    Get voter profile
// @route   GET /api/voter/profile
// @access  Private (Voter only)
exports.getProfile = async (req, res) => {
  try {
    const voter = await Voter.findOne({ user: req.user.id })
      .populate('user', 'username email walletAddress')
      .populate('aadharInfo', 'fullName aadharNumber isVerified phoneNumber');

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter profile not found'
      });
    }

    res.json({
      success: true,
      voter
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Register voter on blockchain
// @route   POST /api/voter/register
// @access  Private (Voter only)
exports.registerVoter = async (req, res) => {
  try {
    const { cccd, accountAddress, fullName, gender, address, phoneNumber } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update wallet address if provided
    if (accountAddress) {
      user.walletAddress = accountAddress;
      await user.save();
    }

    if (!user.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required'
      });
    }

    let voter = await Voter.findOne({ user: req.user.id });
    if (!voter) {
      // Create AadharInfo
      const aadharInfo = await AadharInfo.create({
        aadharNumber: cccd,
        fullName: fullName || user.username,
        gender: gender || 'Other',
        address: address || 'Unknown',
        phoneNumber: phoneNumber || '0000000000',
        email: user.email,
      });

      // Create Voter
      voter = await Voter.create({
        user: req.user.id,
        walletAddress: user.walletAddress,
        aadharInfo: aadharInfo._id,
        isVerified: true, // Auto-verify on registration
      });
    }

    if (voter.isRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Already registered on blockchain'
      });
    }

    // Register on blockchain
    const blockchainService = require('../services/blockchainService');
    let result;
    try {
      result = await blockchainService.registerVoterOnBlockchain(user.walletAddress);
    } catch (blockchainError) {
      if (blockchainError.message && blockchainError.message.includes('Voter already registered')) {
        // Voter is already registered on blockchain, update DB
        voter.isRegistered = true;
        voter.registeredAt = voter.registeredAt || new Date();
        voter.isVerified = true; // Ensure verified
        await voter.save();
        return res.json({
          success: true,
          message: 'Người bầu đã đăng ký trên blockchain',
        });
      } else if (blockchainError.message && blockchainError.message.includes('sender account not recognized')) {
        return res.status(400).json({
          success: false,
          message: 'Địa chỉ ví không hợp lệ. Vui lòng sử dụng tài khoản hợp lệ từ blockchain cục bộ của bạn (Ganache).'
        });
      } else {
        throw blockchainError;
      }
    }

    // Update voter status
    voter.isRegistered = true;
    voter.registeredAt = new Date();
    voter.registrationTxHash = result.txHash;
    voter.isVerified = true; // Auto-verify on successful registration
    await voter.save();

    // Verify voter on blockchain
    let verifyResult;
    try {
      verifyResult = await blockchainService.verifyVoterOnBlockchain(user.walletAddress);
      console.log('Voter verified on blockchain:', verifyResult.txHash);
    } catch (verifyError) {
      console.error('Verify voter error:', verifyError);
      // Continue, as registration succeeded
    }

    // Update user as verified
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Đăng ký trên blockchain thành công',
      txHash: result.txHash
    });

  } catch (error) {
    console.error('Register Voter Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Check if voter can vote
// @route   GET /api/voter/can-vote
// @access  Private (Voter only)
exports.canVote = async (req, res) => {
  try {
    const voter = await Voter.findOne({ user: req.user.id })
      .populate('aadharInfo');

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    // Check if registered
    if (!voter.isRegistered) {
      return res.json({
        success: true,
        canVote: false,
        reason: 'You are not registered for voting.'
      });
    }

    // Check Aadhar verification
    if (!voter.isVerified || !voter.aadharInfo.isVerified) {
      return res.json({
        success: true,
        canVote: false,
        reason: 'Your Aadhar is not verified yet. Please wait for admin approval.'
      });
    }

    // Check if already voted
    if (voter.hasVoted) {
      return res.json({
        success: true,
        canVote: false,
        reason: 'You have already cast your vote.',
        votedAt: voter.voteAt
      });
    }

    // Check election state
    const electionState = await ElectionState.findOne({ isActive: true });
    
    if (!electionState) {
      return res.json({
        success: true,
        canVote: false,
        reason: 'No active election found.'
      });
    }

    // Check if voting period is active
    if (electionState.currentState !== 'Voting') {
      return res.json({
        success: true,
        canVote: false,
        reason: `Election is in ${electionState.currentState} phase. Voting has not started yet.`
      });
    }

    // Check voting dates
    const now = new Date();
    if (now < electionState.votingStartDate) {
      return res.json({
        success: true,
        canVote: false,
        reason: `Voting starts on ${electionState.votingStartDate.toLocaleDateString()}`
      });
    }

    if (now > electionState.votingEndDate) {
      return res.json({
        success: true,
        canVote: false,
        reason: 'Voting period has ended.'
      });
    }

    res.json({
      success: true,
      canVote: true,
      reason: 'You are eligible to vote!',
      election: {
        name: electionState.name,
        votingEndDate: electionState.votingEndDate
      }
    });

  } catch (error) {
    console.error('Can Vote Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cast a vote (with blockchain data)
// @route   POST /api/voter/vote
// @access  Private (Voter only)
exports.castVote = async (req, res) => {
  try {
    const { 
      candidateId, 
      transactionHash, 
      blockNumber, 
      gasUsed 
    } = req.body;

    // Validation
    if (!candidateId || !transactionHash || !blockNumber || !gasUsed) {
      return res.status(400).json({
        success: false,
        message: 'Please provide candidateId, transactionHash, blockNumber, and gasUsed'
      });
    }

    // Get voter
    const voter = await Voter.findOne({ user: req.user.id })
      .populate('aadharInfo');

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    // Check registration
    if (!voter.isRegistered) {
      return res.status(403).json({
        success: false,
        message: 'You are not registered'
      });
    }

    // Verify Aadhar
    if (!voter.isVerified || !voter.aadharInfo.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your Aadhar is not verified yet'
      });
    }

    // Check if already voted
    if (voter.hasVoted) {
      return res.status(403).json({
        success: false,
        message: 'You have already voted'
      });
    }

    // Get active election
    const electionState = await ElectionState.findOne({ isActive: true });
    
    if (!electionState) {
      return res.status(403).json({
        success: false,
        message: 'No active election found'
      });
    }

    // Check election state
    if (electionState.currentState !== 'Voting') {
      return res.status(403).json({
        success: false,
        message: `Election is in ${electionState.currentState} phase. Voting is not active.`
      });
    }

    // Check voting period
    const now = new Date();
    if (now < electionState.votingStartDate || now > electionState.votingEndDate) {
      return res.status(403).json({
        success: false,
        message: 'Voting period is not active'
      });
    }

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Check for duplicate transaction hash
    const existingVote = await Vote.findOne({ transactionHash });
    if (existingVote) {
      return res.status(400).json({
        success: false,
        message: 'This transaction hash has already been used'
      });
    }

    // Ensure candidate has a numeric blockchain ID
    if (typeof candidate.candidateId !== 'number') {
      return res.status(400).json({ success: false, message: 'Candidate is not registered on blockchain' });
    }

    // Use transaction to ensure atomicity
    const session = await mongoose.startSession();
    let createdVote;
    await session.withTransaction(async () => {
      createdVote = await Vote.create([
        {
          voter: voter._id,
          candidate: candidate._id,
          candidateId: candidate.candidateId,
          election: electionState._id,
          voterWalletAddress: voter.walletAddress,
          transactionHash,
          blockNumber,
          gasUsed,
          timestamp: new Date(),
          isVerified: true,
          voteStatus: 'success'
        }
      ], { session });

      // createdVote is an array when using create(array)
      createdVote = createdVote[0];

      voter.hasVoted = true;
      voter.voteAt = new Date();
      voter.voteCandidateId = candidate._id;
      voter.voteTxHash = transactionHash;
      await voter.save({ session });

      candidate.voteCount += 1;
      await candidate.save({ session });

      electionState.totalVoterCasts += 1;
      await electionState.save({ session });
    });
    session.endSession();

    res.json({
      success: true,
      message: 'Vote cast successfully!',
      vote: {
        votedFor: candidate.name,
        party: candidate.party,
        transactionHash: vote.transactionHash,
        blockNumber: vote.blockNumber,
        timestamp: vote.timestamp
      }
    });

  } catch (error) {
    console.error('Cast Vote Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while casting vote',
      error: error.message
    });
  }
};

// @desc    Get voting history
// @route   GET /api/voter/voting-history
// @access  Private (Voter only)
exports.getVotingHistory = async (req, res) => {
  try {
    const voter = await Voter.findOne({ user: req.user.id });

    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    // Return voting status without revealing who they voted for
    res.json({
      success: true,
      hasVoted: voter.hasVoted,
      voteAt: voter.voteAt,
      voteTxHash: voter.voteTxHash,
      message: voter.hasVoted 
        ? 'You have successfully voted in this election' 
        : 'You have not voted yet'
    });

  } catch (error) {
    console.error('Get Voting History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify vote on blockchain
// @route   GET /api/voter/verify-vote/:txHash
// @access  Public
exports.verifyVote = async (req, res) => {
  try {
    const { txHash } = req.params;

    const vote = await Vote.findOne({ transactionHash: txHash })
      .populate('candidate', 'name party')
      .populate('election', 'name');

    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found with this transaction hash'
      });
    }

    res.json({
      success: true,
      vote: {
        transactionHash: vote.transactionHash,
        blockNumber: vote.blockNumber,
        timestamp: vote.timestamp,
        voteStatus: vote.voteStatus,
        isVerified: vote.isVerified,
        candidate: vote.candidate.name,
        party: vote.candidate.party,
        election: vote.election.name
      }
    });

  } catch (error) {
    console.error('Verify Vote Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};