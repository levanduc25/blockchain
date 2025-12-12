const mongoose = require("mongoose");
const AadharInfo = require("./AadharInfo");

const voterSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ElectionState',
  },
  walletAddress: {
    type: String,
    required: [true, "Please add a wallet address"],
    unique: true,
    sparse: true,
  },
  aadharInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AadharInfo",
    required: true,
    unique: true,
  },
  isRegistered: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  hasVoted: {
    type: Boolean,
    default: false,
  },
  voteAt: {
    type: Date,
  },
  voteCandidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
  },
  registrationTxHash: {
    type: String,
    trim: true,
  },
  voteTxHash: {
    type: String,
    trim: true,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  verifiedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Voter", voterSchema);
