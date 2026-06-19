const router = require('express').Router();
const Seat = require('../models/Seat');
const Reservation = require('../models/Reservation');
const authenticate = require('../middleware/auth');

const RESERVATION_MINUTES = 10;

router.post('/', authenticate, async (req, res) => {
  try {
    const { eventId, seatNumbers } = req.body;
    if (!eventId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({ error: 'eventId and seatNumbers are required' });
    }

    const updateResults = await Promise.all(
      seatNumbers.map((seatNumber) =>
        Seat.findOneAndUpdate(
          { eventId, seatNumber, status: 'available' },
          { $set: { status: 'reserved', reservedBy: req.userId, reservedAt: new Date() } },
          { new: true }
        )
      )
    );

    const failedSeats = seatNumbers.filter((_, i) => !updateResults[i]);

    if (failedSeats.length > 0) {
      const succeededSeats = seatNumbers.filter((_, i) => updateResults[i]);
      if (succeededSeats.length > 0) {
        await Seat.updateMany(
          { eventId, seatNumber: { $in: succeededSeats }, reservedBy: req.userId },
          { $set: { status: 'available', reservedBy: null, reservedAt: null } }
        );
      }
      return res.status(409).json({ error: 'Some seats are no longer available', unavailableSeats: failedSeats });
    }

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
    const reservation = await Reservation.create({ userId: req.userId, eventId, seatNumbers, expiresAt });

    res.status(201).json({ reservation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/expire', async (req, res) => {
  try {
    const expired = await Reservation.find({
      status: 'active',
      expiresAt: { $lt: new Date() },
    });

    for (const r of expired) {
      await Seat.updateMany(
        { eventId: r.eventId, seatNumber: { $in: r.seatNumbers } },
        { $set: { status: 'available', reservedBy: null, reservedAt: null } }
      );
      await Reservation.updateOne({ _id: r._id }, { $set: { status: 'expired' } });
    }

    res.json({ released: expired.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;