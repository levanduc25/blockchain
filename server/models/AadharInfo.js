const mongoose = require("mongoose");

const aadharInfoSchema = new mongoose.Schema({
  aadharNumber: {
  type: String,
  required: true,
  unique: true,
  match: [/^\d{10,12}$/, "Please add a valid 10-12 digit number"],
},

  fullName: {
    type: String,
    required: [true, "Please add the full name as per Aadhar"],
    trim: true,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  address: {
    type: String,
    required: [true, "Please add the address as per Aadhar"],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, "Please add a phone number"],
    match: [/^\d{10}$/, "Please add a valid 10-digit phone number"],
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  photoUrl: {
    type: String,
    trim: true,
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("AadharInfo", aadharInfoSchema);
