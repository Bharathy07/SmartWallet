const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currency: { type: String, default: 'INR' },
    balance: { type: Number, required: true, default: 0 },
    // Optional: keep a computed/cached balance updated by backend logic
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', WalletSchema);

