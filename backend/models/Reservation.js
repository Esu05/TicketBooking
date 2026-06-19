const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    seatNumbers: [{ type: String, required: true }],
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'confirmed', 'expired'],
      default: 'active',
    },
  },
  { timestamps: true }
);

reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Reservation', reservationSchema);
