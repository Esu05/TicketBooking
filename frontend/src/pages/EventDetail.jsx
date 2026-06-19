import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import SeatGrid from '../components/SeatGrid';
import CountdownTimer from '../components/CountdownTimer';
import styles from './EventDetail.module.css';

const PHASE = { SELECT: 'select', RESERVED: 'reserved', BOOKED: 'booked' };

export default function EventDetail() {
  const { id } = useParams();
  const { isAuth } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [reservation, setReservation] = useState(null);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = useCallback(() => {
    api.get(`/events/${id}`)
      .then(({ data }) => {
        setEvent(data);
        setSeats(data.seats || []);
      })
      .catch(() => setError('Event not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchEvent(); }, [fetchEvent]);

  const toggleSeat = (seatNumber) => {
    setSelected((prev) =>
      prev.includes(seatNumber)
        ? prev.filter((s) => s !== seatNumber)
        : [...prev, seatNumber]
    );
    setError('');
  };

  const handleReserve = async () => {
    if (!isAuth) { navigate('/login'); return; }
    if (selected.length === 0) { setError('Please select at least one seat'); return; }
    setError('');
    setActionLoading(true);
    try {
      const { data } = await api.post('/reserve', { eventId: id, seatNumbers: selected });
      setReservation(data.reservation);
      setPhase(PHASE.RESERVED);
      // Optimistically update seat statuses locally
      setSeats((prev) =>
        prev.map((s) =>
          selected.includes(s.seatNumber) ? { ...s, status: 'reserved' } : s
        )
      );
    } catch (err) {
      const msg = err.response?.data?.error || 'Reservation failed';
      const bad = err.response?.data?.unavailableSeats || [];
      setError(msg);
      setUnavailable(bad);
      // Refresh seat data to reflect real state
      fetchEvent();
      setSelected((prev) => prev.filter((s) => !bad.includes(s)));
    } finally {
      setActionLoading(false);
    }
  };

  const handleBook = async () => {
    setError('');
    setActionLoading(true);
    try {
      const { data } = await api.post('/bookings', { reservationId: reservation._id });
      setBooking(data.booking);
      setPhase(PHASE.BOOKED);
      setSeats((prev) =>
        prev.map((s) =>
          reservation.seatNumbers.includes(s.seatNumber) ? { ...s, status: 'booked' } : s
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
      if (err.response?.status === 410) {
        // Reservation expired
        setPhase(PHASE.SELECT);
        setReservation(null);
        setSelected([]);
        fetchEvent();
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpire = () => {
    setError('Your reservation expired. Please select seats again.');
    setPhase(PHASE.SELECT);
    setReservation(null);
    setSelected([]);
    fetchEvent();
  };

  if (loading) return <div className={styles.center}>Loading…</div>;
  if (!event) return <div className={styles.center}><div className="error-msg">Event not found</div></div>;

  const date = new Date(event.dateTime);

  return (
    <div className={styles.page}>
      {/* Back */}
      <button className={`btn-outline ${styles.back}`} onClick={() => navigate('/')}>← Events</button>

      {/* Event info */}
      <div className={styles.eventHeader}>
        <div>
          <h1 className={styles.title}>{event.name}</h1>
          <p className={styles.meta}>
            📍 {event.venue} &nbsp;·&nbsp;
            📅 {date.toLocaleDateString('en-IN', { dateStyle: 'long' })} &nbsp;·&nbsp;
            🕐 {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {event.description && <p className={styles.desc}>{event.description}</p>}
        </div>
      </div>

      {/* Booking success */}
      {phase === PHASE.BOOKED && booking && (
        <div className={styles.successBox}>
          <div className={styles.successIcon}>🎉</div>
          <h2>Booking Confirmed!</h2>
          <p>Your seats <strong>{booking.seatNumbers.join(', ')}</strong> are booked.</p>
          <p className={styles.confId}>Confirmation: <code>{booking.reservationId}</code></p>
          <button className="btn-primary" onClick={() => navigate('/')}>Browse more events</button>
        </div>
      )}

      {phase !== PHASE.BOOKED && (
        <div className={styles.layout}>
          {/* Seat grid */}
          <div className={styles.seatSection}>
            <h2 className={styles.sectionTitle}>Select Your Seats</h2>
            <SeatGrid
              seats={seats}
              selectedSeats={phase === PHASE.RESERVED ? reservation.seatNumbers : selected}
              onToggle={phase === PHASE.SELECT ? toggleSeat : () => {}}
              disabledSeats={unavailable}
            />
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            <div className="card">
              <h3 className={styles.sideTitle}>
                {phase === PHASE.SELECT ? 'Your Selection' : 'Reservation Active'}
              </h3>

              {phase === PHASE.RESERVED && reservation && (
                <CountdownTimer expiresAt={reservation.expiresAt} onExpire={handleExpire} />
              )}

              {error && <div className="error-msg" style={{ marginTop: '.75rem' }}>{error}</div>}

              {unavailable.length > 0 && (
                <div className="error-msg" style={{ marginTop: '.5rem' }}>
                  Seats no longer available: <strong>{unavailable.join(', ')}</strong>
                </div>
              )}

              {phase === PHASE.SELECT && (
                <>
                  <div className={styles.selectedList}>
                    {selected.length === 0
                      ? <p className={styles.empty}>No seats selected yet</p>
                      : selected.map((s) => (
                          <span key={s} className={styles.seatTag}>
                            {s}
                            <button onClick={() => toggleSeat(s)}>×</button>
                          </span>
                        ))
                    }
                  </div>
                  <p className={styles.count}>{selected.length} seat{selected.length !== 1 ? 's' : ''} selected</p>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '.75rem' }}
                    onClick={handleReserve}
                    disabled={actionLoading || selected.length === 0}
                  >
                    {actionLoading ? 'Reserving…' : 'Reserve Seats →'}
                  </button>
                  {!isAuth && (
                    <p className={styles.loginHint}>You'll be asked to log in before reserving.</p>
                  )}
                </>
              )}

              {phase === PHASE.RESERVED && reservation && (
                <>
                  <div className={styles.selectedList} style={{ marginTop: '.75rem' }}>
                    {reservation.seatNumbers.map((s) => (
                      <span key={s} className={`${styles.seatTag} ${styles.reservedTag}`}>{s}</span>
                    ))}
                  </div>
                  <p className={styles.count}>{reservation.seatNumbers.length} seat{reservation.seatNumbers.length !== 1 ? 's' : ''} reserved</p>
                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '.75rem' }}
                    onClick={handleBook}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Confirming…' : '✓ Confirm Booking'}
                  </button>
                  <button
                    className="btn-outline"
                    style={{ width: '100%', marginTop: '.5rem' }}
                    onClick={() => { setPhase(PHASE.SELECT); setReservation(null); setSelected([]); fetchEvent(); }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
