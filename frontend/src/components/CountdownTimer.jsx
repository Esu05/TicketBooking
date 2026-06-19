import { useCountdown } from '../hooks/useCountdown';
import styles from './CountdownTimer.module.css';

export default function CountdownTimer({ expiresAt, onExpire }) {
  const { minutes, seconds, expired } = useCountdown(expiresAt);

  if (expired && onExpire) {
    setTimeout(onExpire, 0);
  }

  if (minutes === null) return null;

  const urgent = !expired && minutes === 0 && seconds <= 60;

  return (
    <div className={`${styles.timer} ${expired ? styles.expired : urgent ? styles.urgent : ''}`}>
      {expired ? (
        <span>⏰ Reservation expired</span>
      ) : (
        <span>
          ⏱ Reserved for{' '}
          <strong>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </strong>
        </span>
      )}
    </div>
  );
}
