import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import styles from './Events.module.css';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/events')
      .then(({ data }) => setEvents(data))
      .catch(() => setError('Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.center}>Loading events…</div>;
  if (error) return <div className={styles.center}><div className="error-msg">{error}</div></div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Upcoming Events</h1>
        <p>Select an event to view seats and book your tickets</p>
      </div>

      <div className={styles.grid}>
        {events.map((event) => (
          <EventCard key={event._id} event={event} onClick={() => navigate(`/events/${event._id}`)} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event, onClick }) {
  const date = new Date(event.dateTime);
  const available = event.availableSeats ?? 0;
  const total = event.totalSeats;

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.cardHeader}>
        <div className={styles.dateBox}>
          <span className={styles.day}>{date.toLocaleDateString('en-IN', { day: '2-digit' })}</span>
          <span className={styles.month}>{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
        </div>
        <div className={styles.cardInfo}>
          <h2 className={styles.name}>{event.name}</h2>
          <p className={styles.venue}>📍 {event.venue}</p>
          <p className={styles.time}>🕐 {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>
      {event.description && <p className={styles.desc}>{event.description}</p>}
      <div className={styles.footer}>
        <SeatBar available={available} total={total} />
        <button className="btn-primary">View Seats →</button>
      </div>
    </div>
  );
}

function SeatBar({ available, total }) {
  const pct = Math.round((available / total) * 100);
  const color = pct > 50 ? '#059669' : pct > 20 ? '#d97706' : '#dc2626';
  return (
    <div className={styles.seatBar}>
      <div className={styles.seatBarTrack}>
        <div className={styles.seatBarFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ color }}>{available}/{total} available</span>
    </div>
  );
}
