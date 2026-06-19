const router = require('express').Router();
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      return res.status(400).json({ error: 'reservationId is required' });
    }

    const reservation = await Reservation.findOne({
      _id: reservationId,
      userId: req.userId,
      status: 'active',
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.expiresAt < new Date()) {
      await Seat.updateMany(
        { eventId: reservation.eventId, seatNumber: { $in: reservation.seatNumbers } },
        { $set: { status: 'available', reservedBy: null, reservedAt: null } }
      );
      await Reservation.updateOne({ _id: reservationId }, { $set: { status: 'expired' } });
      return res.status(410).json({ error: 'Reservation has expired. Seats released.' });
    }

    const updateResult = await Seat.updateMany(
      {
        eventId: reservation.eventId,
        seatNumber: { $in: reservation.seatNumbers },
        status: 'reserved',
        reservedBy: req.userId,
      },
      { $set: { status: 'booked' } }
    );

    if (updateResult.modifiedCount !== reservation.seatNumbers.length) {
      return res.status(409).json({ error: 'Booking failed: seat state mismatch. Please try again.' });
    }

    await Reservation.updateOne({ _id: reservationId }, { $set: { status: 'confirmed' } });

    res.status(201).json({
      message: 'Booking confirmed!',
      booking: {
        reservationId: reservation._id,
        eventId: reservation.eventId,
        seatNumbers: reservation.seatNumbers,
        confirmedAt: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;