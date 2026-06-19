const router = require('express').Router();
const Event = require('../models/Event');
const Seat = require('../models/Seat');

router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ dateTime: 1 });

    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const counts = await Seat.aggregate([
          { $match: { eventId: event._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const statusMap = counts.reduce((acc, c) => {
          acc[c._id] = c.count;
          return acc;
        }, {});
        return {
          ...event.toObject(),
          availableSeats: statusMap.available || 0,
          reservedSeats: statusMap.reserved || 0,
          bookedSeats: statusMap.booked || 0,
        };
      })
    );

    res.json(eventsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const seats = await Seat.find({ eventId: event._id }).sort({ seatNumber: 1 });
    res.json({ ...event.toObject(), seats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;