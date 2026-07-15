const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['expense', 'income'], required: true },
  },
  { timestamps: true }
);

CategorySchema.index({ userId: 1, name: 1 }, { unique: true });
CategorySchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Category', CategorySchema);

