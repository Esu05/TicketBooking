require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const Seat = require('../models/Seat');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sortmyscene';

const events = [
  {
    name: 'Neon Nights Music Festival',
    dateTime: new Date('2025-08-15T19:00:00'),
    venue: 'Bengaluru Palace Grounds',
    totalSeats: 30,
    description: 'An electrifying night of indie and electronic music under the stars.',
  },
  {
    name: 'TechTalks Summit 2025',
    dateTime: new Date('2025-09-10T10:00:00'),
    venue: 'HICC, Hyderabad',
    totalSeats: 24,
    description: 'Annual tech conference featuring speakers from top global startups.',
  },
  {
    name: 'Monsoon Comedy Carnival',
    dateTime: new Date('2025-07-28T20:30:00'),
    venue: 'Habitat Centre, Delhi',
    totalSeats: 20,
    description: 'Stand-up comedy show featuring 6 headline comedians.',
  },
];

function generateSeats(eventId, totalSeats) {
  const seats = [];
  const rows = 'ABCDEFGHIJ'.split('');
  const cols = 10;
  let count = 0;
  for (const row of rows) {
    for (let col = 1; col <= cols; col++) {
      if (count >= totalSeats) break;
      seats.push({ eventId, seatNumber: `${row}${col}`, status: 'available' });
      count++;
    }
    if (count >= totalSeats) break;
  }
  return seats;
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await Event.deleteMany({});
  await Seat.deleteMany({});
  console.log('Cleared existing data');

  for (const eventData of events) {
    const event = await Event.create(eventData);
    const seats = generateSeats(event._id, event.totalSeats);
    await Seat.insertMany(seats);
    console.log(`Created event "${event.name}" with ${seats.length} seats`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
