const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    amount: { type: Number, required: true },
    status: { type: String, enum: ['allowed', 'blocked'], required: true },

    // Store AI output for transparency.
    riskScore: { type: Number, required: true },
    aiReason: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', TransactionSchema);

