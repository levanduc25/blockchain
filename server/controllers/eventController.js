const Event = require('../models/Event');
const mongoose = require('mongoose');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ isActive: true })
      .populate('createdBy', 'username')
      .populate('candidates', 'name party')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get All Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Admin only)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, type } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description and date'
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      type,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
exports.updateEvent = async (req, res) => {
  try {
    const { title, description, date, location, type, isActive } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.location = location || event.location;
    event.type = type || event.type;
    event.isActive = isActive !== undefined ? isActive : event.isActive;

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add candidate to event
// @route   POST /api/events/:id/candidates
// @access  Private (Admin only)
exports.addCandidateToEvent = async (req, res) => {
  try {
    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide candidateId'
      });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const candidate = await require('../models/Candidate').findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    const candidateIdObj = new mongoose.Types.ObjectId(candidateId);
    if (event.candidates.some(id => id.equals(candidateIdObj))) {
      return res.status(400).json({
        success: false,
        message: 'Candidate already added to this event'
      });
    }

    event.candidates.push(candidateIdObj);
    await event.save();

    res.json({
      success: true,
      message: 'Candidate added to event successfully',
      data: event
    });
  } catch (error) {
    console.error('Add Candidate to Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove candidate from event
// @route   DELETE /api/events/:id/candidates/:candidateId
// @access  Private (Admin only)
exports.removeCandidateFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const candidateIdObj = new mongoose.Types.ObjectId(req.params.candidateId);
    if (!event.candidates.some(id => id.equals(candidateIdObj))) {
      return res.status(400).json({
        success: false,
        message: 'Candidate not in this event'
      });
    }

    event.candidates.pull(candidateIdObj);
    await event.save();

    res.json({
      success: true,
      message: 'Candidate removed from event successfully',
      data: event
    });
  } catch (error) {
    console.error('Remove Candidate from Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
// @desc    Vote for candidate in event
// @route   POST /api/events/:id/vote
// @access  Private (Voter only)
exports.voteForEvent = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const eventId = req.params.id;

    if (!candidateId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide candidateId'
      });
    }

    // Get event
    const event = await Event.findById(eventId).populate('candidates');
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.type !== 'election') {
      return res.status(400).json({
        success: false,
        message: 'This event is not an election'
      });
    }

    // Check if candidate is in event
    const candidate = event.candidates.find(c => c._id.toString() === candidateId);
    if (!candidate) {
      return res.status(400).json({
        success: false,
        message: 'Candidate not found in this event'
      });
    }

    // Get voter
    const Voter = require('../models/Voter');
    const voter = await Voter.findOne({ user: req.user.id });
    if (!voter) {
      return res.status(404).json({
        success: false,
        message: 'Voter not found'
      });
    }

    if (!voter.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'You are not verified'
      });
    }

    // Check if already voted for this event
    const Vote = require('../models/Vote');
    const existingVote = await Vote.findOne({ voter: voter._id, event: eventId });
    if (existingVote) {
      return res.status(403).json({
        success: false,
        message: 'You have already voted in this event'
      });
    }

    // Create vote record
    const vote = await Vote.create({
      voter: voter._id,
      candidate: candidateId,
      candidateId: candidate.candidateId, // Assuming candidate has candidateId
      event: eventId,
      voterWalletAddress: voter.walletAddress,
      transactionHash: 'mock-tx-hash', // For now, since no blockchain
    });

    res.json({
      success: true,
      message: 'Vote cast successfully',
      vote
    });

  } catch (error) {
    console.error('Vote For Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};