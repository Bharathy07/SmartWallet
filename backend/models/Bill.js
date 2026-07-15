const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },

    dueDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },

    status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending', index: true },
  },
  { timestamps: true }
);

BillSchema.index({ userId: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('Bill', BillSchema);

