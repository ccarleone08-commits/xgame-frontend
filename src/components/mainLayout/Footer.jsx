import './Footer.css';
import { useAppContext } from '../../context/AppContext';

function Footer() {
  const { t } = useAppContext();
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-section">
          <h3>GameZone</h3>
          <p>{t('home_sub')}</p>
        </div>
        <div className="footer-section">
          <h4>{t('games')}</h4>
          <ul>
            <li>Backgammon</li>
            <li>Dominoes</li>
            <li>Turkish Okey</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>{t('support') || 'Support'}</h4>
          <ul>
            <li>{t('how_to_play') || 'How to Play'}</li>
            <li>{t('rules') || 'Rules'}</li>
            <li>{t('contact_us') || 'Contact Us'}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2025 GameZone. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;