import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout, isAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.logo} onClick={() => navigate('/')}>
          <span className={styles.logoMark}>●</span> SortMyScene
        </span>
        <div className={styles.right}>
          {isAuth ? (
            <>
              <span className={styles.username}>Hi, {user.name.split(' ')[0]}</span>
              <button className="btn-outline" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="btn-outline" onClick={() => navigate('/login')}>Login</button>
              <button className="btn-primary" onClick={() => navigate('/register')}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
