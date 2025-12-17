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

// @desc    Create new candidate (Off-chain metadata + Link to Blockchain)
// @route   POST /api/candidates
// @access  Private (Admin and Candidate roles)
exports.createCandidate = async (req, res) => {
  try {
    const {
      name,
      party,
      age,
      qualification,
      manifesto,
      photo,
      biography,
      address,
      txHash,        // Optional - provided by admin only
      candidateId    // Optional - provided by admin only
    } = req.body;

    // Validation
    if (!name || !party) {
      return res.status(400).json({
        success: false,
        message: 'Please provide candidate name and party'
      });
    }

    // ===== PHÂN QUYỀN THEO ROLE =====
    const userRole = req.user.role;
    const isAdmin = userRole === 'admin';
    const isCandidate = userRole === 'candidate';

    // Chỉ cho phép admin và candidate
    if (!isAdmin && !isCandidate) {
      return res.status(403).json({
        success: false,
        message: 'Only candidates can register or admin can create candidates'
      });
    }

    // Nếu là candidate, không được phép gửi txHash và candidateId
    if (isCandidate && (txHash || candidateId)) {
      return res.status(403).json({
        success: false,
        message: 'Only admin can link candidates to blockchain directly'
      });
    }

    // Kiểm tra nếu candidate đã đăng ký rồi
    if (isCandidate) {
      const existingCandidateByUser = await Candidate.findOne({ 
        registeredBy: req.user.id 
      });
      
      if (existingCandidateByUser) {
        return res.status(400).json({
          success: false,
          message: 'You have already registered as a candidate'
        });
      }
    }
    // ===== HẾT PHẦN PHÂN QUYỀN =====

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

    // Create candidate in MongoDB
    const candidateData = {
      name,
      party,
      age,
      qualification,
      manifesto,
      photo,
      biography,
      address,
      voteCount: 0,
      isVerified: isAdmin, // Admin tự verify ngay, candidate phải chờ admin duyệt
      addedToBlockchain: !!(txHash && candidateId), // Only true if both txHash and candidateId provided
      election: activeElection ? activeElection._id : undefined,
      registeredBy: req.user.id // Track ai đăng ký
    };

    // Add blockchain fields if provided (admin flow only)
    if (txHash && candidateId && isAdmin) {
      candidateData.blockchainTxHash = txHash;
      candidateData.candidateId = candidateId;
    }

    // Nếu admin verify ngay, set verifiedBy
    if (isAdmin) {
      candidateData.verifiedBy = req.user.id;
      candidateData.verifiedAt = new Date();
    }

    const candidate = await Candidate.create(candidateData);

    // Update active election's totalCandidates (if present)
    if (activeElection) {
      activeElection.totalCandidates += 1;
      await activeElection.save();
    }

    res.status(201).json({
      success: true,
      message: isAdmin ?
        (txHash && candidateId ? 
          'Candidate created & linked to blockchain successfully' : 
          'Candidate created and verified successfully') :
        'Candidate registered successfully. Waiting for admin verification.',
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

    // Check if user has wallet address (required for blockchain operations)
    if (!candidate.address) {
      console.warn(`Candidate ${candidate.name} has no wallet address. Verification may fail on blockchain.`);
    }

    // If candidate is already on blockchain, verify there too
    if (candidate.addedToBlockchain && candidate.candidateId) {
      if (candidate.address) {
        try {
          const blockchainResult = await verifyCandidateOnBlockchain(candidate.candidateId);
          console.log('✅ Candidate verified on blockchain:', blockchainResult.txHash);
        } catch (blockchainError) {
          console.error('Blockchain verification error:', blockchainError);
          console.warn('⚠️ Blockchain verification failed, but database verification continues');
        }
      } else {
        console.warn('⚠️ Candidate has no address, skipping blockchain verification');
      }
    } else {
      // If not on blockchain yet, add to blockchain now (only if has address)
      if (candidate.address) {
        try {
          console.log('Adding candidate to blockchain during verification...');
          const blockchainResult = await addCandidateToBlockchain(candidate.name, candidate.party);
          
          candidate.addedToBlockchain = true;
          candidate.blockchainTxHash = blockchainResult.txHash;
          candidate.candidateId = blockchainResult.candidateId;
          
          console.log('✅ Candidate added to blockchain:', blockchainResult.txHash);
        } catch (blockchainError) {
          console.error('Failed to add candidate to blockchain:', blockchainError);
          return res.status(500).json({
            success: false,
            message: 'Failed to add candidate to blockchain',
            error: blockchainError.message
          });
        }
      } else {
        console.warn('⚠️ Candidate has no address, cannot add to blockchain. Verification only in database.');
      }
    }

    // Update in database
    candidate.isVerified = true;
    candidate.verifiedBy = req.user.id;
    candidate.verifiedAt = new Date();
    await candidate.save();

    res.json({
      success: true,
      message: 'Candidate verified successfully',
      data: candidate
    });

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