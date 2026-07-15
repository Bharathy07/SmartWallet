const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, default: 'info', index: true },
    message: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, readAt: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);

