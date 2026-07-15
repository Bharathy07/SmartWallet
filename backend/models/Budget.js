const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    limitAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

BudgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });
BudgetSchema.index({ userId: 1, month: 1, year: 1 });

module.exports = mongoose.model('Budget', BudgetSchema);

