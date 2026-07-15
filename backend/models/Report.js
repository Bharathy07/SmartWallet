const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['monthly', 'weekly', 'yearly', 'category', 'fraud', 'budget'],
      required: true,
      index: true,
    },
    // Optional parameters for report generation
    month: { type: Number, min: 1, max: 12, default: null },
    year: { type: Number, required: false, default: null },
    weekOfYear: { type: Number, default: null },

    // Store generated summary (not the source data) so UI can list reports.
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },

    generatedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);




ReportSchema.index({ userId: 1, type: 1, generatedAt: -1 });


module.exports = mongoose.model('Report', ReportSchema);


