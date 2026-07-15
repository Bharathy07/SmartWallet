const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    // For simplicity in this student project we store balances directly.
    balance: { type: Number, required: true, default: 1000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);

