const mongoose  = require("mongoose");

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  party: {
    type: String,
    required: true,
    trim: true,
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionState',
  },
  age: {
    type: Number,
  },
  qualification: {
    type: String,
    trim: true,
  },
  manifesto: {
    type: String,
    trim: true,
  },
  voteCount: {
    type: Number,
    default: 0,
  },

  candidateId: {
    type: Number,
    unique: true,
    sparse: true
  },

  addedToBlockchain: {
    type: Boolean,
    default: false
  },

  // Optional fields
  photo: { type: String },
  biography: { type: String },

  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  verifiedAt: {
    type: Date,
  },

  // Blockchain support
  blockchainTxHash: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Candidate", candidateSchema);
