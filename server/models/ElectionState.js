const mongoose = require("mongoose");

const electionStateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please add the election name"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  currentState: {
    type: String,
    enum: ["Registration", "Voting", "Ended"],
    default: "Registration",
  },
  registrationStartDate: {
    type: Date,
    required: [true, "Please add registration start date"],
  },
  registrationEndDate: {
    type: Date,
    required: [true, "Please add registration end date"],
  },
  votingStartDate: {
    type: Date,
    required: [true, "Please add voting start date"],
  },
  votingEndDate: {
    type: Date,
    required: [true, "Please add voting end date"],
  },
  totalVoters: {
    type: Number,
    default: 0,
  },
  totalCandidates: {
    type: Number,
    default: 0,
  },
  totalVoterCasts: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  contractAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  stateChangeLogs: [
    {
      previousState: {
        type: String,
        enum: ["Registration", "Voting", "Ended"],
      },
      newState: {
        type: String,
            enum: ["Registration", "Voting", "Ended"],
      },
      changeBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      changeAt: {
        type: Date,
        default: Date.now,
      },
      txHash: {
        type: String,
        trim: true,
      },
    },
  ],
  result: [
    {
      winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Candidate",
      },
      declaredAt: {
        type: Date,
      },
      declaredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual to support older controller field name
electionStateSchema.virtual('totalVotesCast').get(function() {
  return this.totalVoterCasts;
});

module.exports = mongoose.model("ElectionState", electionStateSchema);