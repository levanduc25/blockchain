const mongoose = require("mongoose");
const voteSchema = new mongoose.Schema({
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Voter",
    required: true,
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  candidateId: {
    type: Number,
    required: [true, "Please add a candidate ID"],
  },
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ElectionState",
    required: true,
  },
  voterWalletAddress: {
    type: String,
    required: [true, "Please add voter wallet address"],
    trim: true,
  },
  transactionHash: {
    type: String,
    required: [true, "Please add transaction hash"],
    trim: true,
    unique: true,
  },
  blockNumber: {
    type: Number,
    required: [true, "Please add block number"],
  },
  gasUsed: {
    type: Number,
    required: [true, "Please add gas used"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  voteStatus: {
    type: String,
    enum: ["success", "pending", "failed"],
    default: "pending",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model("Vote", voteSchema);