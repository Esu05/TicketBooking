require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const reservationRoutes = require('./routes/reservations');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reserve', reservationRoutes);
app.use('/api/bookings', bookingRoutes);

// Auto-release expired reservations every minute
const Seat = require('./models/Seat');
const Reservation = require('./models/Reservation');

setInterval(async () => {
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

    if (expired.length > 0) {
      console.log(`Released ${expired.length} expired reservation(s)`);
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
}, 60 * 1000); // runs every 60 seconds

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sortmyscene')
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
