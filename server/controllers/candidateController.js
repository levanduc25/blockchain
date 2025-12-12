const Candidate = require('../models/Candidate');
const ElectionState = require('../models/ElectionState');
const { 
  addCandidateToBlockchain, 
  verifyCandidateOnBlockchain,
  getAllCandidatesFromBlockchain,
  getElectionResults
} = require('../services/blockchainService');

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Public
exports.getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .select('-__v')
      .populate('verifiedBy', 'username')
      .sort({ voteCount: -1 });

    res.json({
      success: true,
      count: candidates.length,
      data: candidates
    });

  } catch (error) {
    console.error('Get All Candidates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single candidate by ID
// @route   GET /api/candidates/:id
// @access  Public
exports.getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('verifiedBy', 'username email');

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    res.json({
      success: true,
      data: candidate
    });

  } catch (error) {
    console.error('Get Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new candidate
// @route   POST /api/candidates
// @access  Private (Admin only)
exports.createCandidate = async (req, res) => {
  try {
    const { 
      name, 
      party, 
      age, 
      qualification, 
      manifesto,
      photo,
      biography
    } = req.body;

    // Validation
    if (!name || !party) {
      return res.status(400).json({
        success: false,
        message: 'Please provide candidate name and party'
      });
    }

    // Check if candidate already exists
    const existingCandidate = await Candidate.findOne({ name, party });
    if (existingCandidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate already exists in this party'
      });
    }

    // Get active election (if any) to associate candidate
    const activeElection = await ElectionState.findOne({ isActive: true });

    // Create candidate in MongoDB first
    const candidate = await Candidate.create({
      name,
      party,
      age,
      qualification,
      manifesto,
      photo,
      biography,
      voteCount: 0,
      isVerified: false,
      addedToBlockchain: false,
      election: activeElection ? activeElection._id : undefined
    });

    // Add to blockchain
    try {
      const blockchainResult = await addCandidateToBlockchain(name, party);
      
      // Update candidate with blockchain info
      candidate.addedToBlockchain = true;
      candidate.blockchainTxHash = blockchainResult.txHash;
      
      // Get candidate count to determine candidateId
      const candidateCount = await Candidate.countDocuments({ addedToBlockchain: true });
      candidate.candidateId = candidateCount;
      
      await candidate.save();

      console.log('✅ Candidate added to blockchain:', blockchainResult.txHash);
    } catch (blockchainError) {
      console.error('⚠️ Blockchain error:', blockchainError.message);
      // Candidate saved in DB but not on blockchain
      // Can be added manually later by admin
    }

    // Update active election's totalCandidates (if present)
    if (activeElection) {
      activeElection.totalCandidates += 1;
      await activeElection.save();
    }

    res.status(201).json({
      success: true,
      message: 'Candidate created successfully',
      data: candidate
    });

  } catch (error) {
    console.error('Create Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update candidate
// @route   PUT /api/candidates/:id
// @access  Private (Admin only)
exports.updateCandidate = async (req, res) => {
  try {
    const { 
      name, 
      party, 
      age, 
      qualification, 
      manifesto,
      photo,
      biography
    } = req.body;

    let candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Cannot update if already on blockchain
    if (candidate.addedToBlockchain) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update candidate already on blockchain. Only off-chain data can be modified.'
      });
    }

    // Update fields
    candidate.name = name || candidate.name;
    candidate.party = party || candidate.party;
    candidate.age = age || candidate.age;
    candidate.qualification = qualification || candidate.qualification;
    candidate.manifesto = manifesto || candidate.manifesto;
    candidate.photo = photo || candidate.photo;
    candidate.biography = biography || candidate.biography;

    await candidate.save();

    res.json({
      success: true,
      message: 'Candidate updated successfully',
      data: candidate
    });

  } catch (error) {
    console.error('Update Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify candidate
// @route   PUT /api/candidates/:id/verify
// @access  Private (Admin only)
exports.verifyCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    if (candidate.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Candidate is already verified'
      });
    }

    // Must be on blockchain before verification
    if (!candidate.addedToBlockchain || !candidate.candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate must be added to blockchain first'
      });
    }

    // Verify on blockchain
    try {
      const blockchainResult = await verifyCandidateOnBlockchain(candidate.candidateId);
      
      // Update in database
      candidate.isVerified = true;
      candidate.verifiedBy = req.user.id;
      candidate.verifiedAt = new Date();
      await candidate.save();

      console.log('✅ Candidate verified on blockchain:', blockchainResult.txHash);

      res.json({
        success: true,
        message: 'Candidate verified successfully',
        data: candidate,
        blockchain: {
          txHash: blockchainResult.txHash,
          blockNumber: blockchainResult.blockNumber,
          gasUsed: blockchainResult.gasUsed
        }
      });

    } catch (blockchainError) {
      console.error('Blockchain verification error:', blockchainError);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify candidate on blockchain',
        error: blockchainError.message
      });
    }

  } catch (error) {
    console.error('Verify Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private (Admin only)
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Cannot delete if on blockchain
    if (candidate.addedToBlockchain) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete candidate already on blockchain'
      });
    }

    // Check if candidate has votes
    if (candidate.voteCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete candidate with existing votes'
      });
    }

    await candidate.deleteOne();

    // Update active election's totalCandidates
    const activeElection = await ElectionState.findOne({ isActive: true });
    if (activeElection && activeElection.totalCandidates > 0) {
      activeElection.totalCandidates -= 1;
      await activeElection.save();
    }

    res.json({
      success: true,
      message: 'Candidate deleted successfully'
    });

  } catch (error) {
    console.error('Delete Candidate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get election results
// @route   GET /api/candidates/results
// @access  Public
exports.getResults = async (req, res) => {
  try {
    // Get results from blockchain (source of truth)
    const blockchainResults = await getElectionResults();

    // Enrich with MongoDB data
    const results = await Promise.all(
      blockchainResults.map(async (bcCandidate) => {
        const dbCandidate = await Candidate.findOne({ 
          candidateId: Number(bcCandidate.id) 
        });
        
        return {
          id: bcCandidate.id,
          name: bcCandidate.name,
          party: bcCandidate.party,
          votes: Number(bcCandidate.voteCount),
          photo: dbCandidate?.photo || null,
          biography: dbCandidate?.biography || null
        };
      })
    );

    // Calculate percentages
    const totalVotes = results.reduce((sum, c) => sum + c.votes, 0);
    
    const enrichedResults = results.map(candidate => ({
      ...candidate,
      percentage: totalVotes > 0 
        ? ((candidate.votes / totalVotes) * 100).toFixed(2) 
        : 0
    })).sort((a, b) => b.votes - a.votes);

    // Get active election info
    const activeElection = await ElectionState.findOne({ isActive: true });

    res.json({
      success: true,
      totalVotes,
      election: activeElection ? {
        name: activeElection.name,
        currentState: activeElection.currentState,
        totalVotesCast: activeElection.totalVotesCast
      } : null,
      results: enrichedResults
    });

  } catch (error) {
    console.error('Get Results Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get verified candidates only
// @route   GET /api/candidates/verified
// @access  Public
exports.getVerifiedCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({ isVerified: true })
      .select('-__v')
      .populate('verifiedBy', 'username')
      .sort({ voteCount: -1 });

    res.json({
      success: true,
      count: candidates.length,
      data: candidates
    });

  } catch (error) {
    console.error('Get Verified Candidates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};