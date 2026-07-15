const mongoose = require('mongoose');

const FraudLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null, index: true },

    prediction: { type: String, enum: ['Safe', 'Fraud'], required: true, index: true },
    fraudScore: { type: Number, required: true },
    confidence: { type: Number, required: true },
    explanation: { type: String, required: true },
    recommendation: { type: String, default: '' },

    // Track whether the transaction was allowed or blocked
    allow: { type: Boolean, required: true },
    aiReason: { type: String, default: '' },
  },
  { timestamps: true }
);

FraudLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FraudLog', FraudLogSchema);

