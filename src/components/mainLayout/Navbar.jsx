import { Link, NavLink } from 'react-router-dom';
import './Navbar.css';
import { useAppContext } from '../../context/AppContext';
// import { useSound } from '../../context/SoundContext';



function Navbar() {
  const { t } = useAppContext();

  // const { playSound } = useSound();

  // const mainPage = () =>{
  //   playSound("mainPage")
  // }
  // const walletPage = () =>{
  //   playSound("walletPage")
  // }
  // const profilePage = () =>{
  //   playSound("profilePage")
  // }
  // const gamePage = () =>{
  //   playSound("gamePage")
  // }
  // const chatPage = () =>{
  //   playSound("chatPage")
  // }

  // const handleClick = () => {
  //   play("click");
  // }

  // let click = new Audio("./Sounds/clickPageSwitch.mp3")

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/stats" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label={t('games')}>
          <div className="nav-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="4" y="14" width="3" height="6" rx="0.5" fill="currentColor" />
              <rect x="10.5" y="8" width="3" height="12" rx="0.5" fill="currentColor" />
              <rect x="17" y="4" width="3" height="16" rx="0.5" fill="currentColor" />
              
            </svg>
          </div>
          <span>{t('stats')}</span>
        </NavLink>

        <NavLink to="/chat" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label={t('chat')}>
          <div className="nav-icon" aria-hidden>
            <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 1H4c-1.1 0-2 .9-2 2v14l3.5-3.5h12.5c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2z" fill="var(--text-primary)" />
              
            </svg>
          </div>
          <span>{t('chat')}</span>
        </NavLink>

        <NavLink to="/games" className={({ isActive }) => `nav-logo${isActive ? ' active' : ''}`} aria-label="Home">
          <div className="logo-container">
            <div className="scene">
              <div className="cube">
                <div className="cube__face cube__face--front">
                  <span className="dot dot1"></span>
                  <span className="dot dot2"></span>
                  <span className="dot dot3"></span>
                  <span className="dot dot4"></span>
                  <span className="dot dot5"></span>
                </div>
                <div className="cube__face cube__face--back">
                  <span className="dot dot1"></span>
                  <span className="dot dot2"></span>
                </div>
                <div className="cube__face cube__face--right">
                  <span className="dot dot1"></span>
                  <span className="dot dot2"></span>
                  <span className="dot dot3"></span>
                  <span className="dot dot4"></span>
                </div>
                <div className="cube__face cube__face--left">
                  <span className="dot dot1"></span>
                  <span className="dot dot2"></span>
                  <span className="dot dot3"></span>
                </div>
                <div className="cube__face cube__face--top">
                  <span className="dot dot1"></span>
                  <span className="dot dot2"></span>
                  <span className="dot dot3"></span>
                  <span className="dot dot4"></span>
                  <span className="dot dot5"></span>
                  <span className="dot dot6"></span>
                </div>
                <div className="cube__face cube__face--bottom">
                  <span className="dot dot1"></span>
                </div>
              </div>
            </div>
          </div>
        </NavLink>

        <NavLink to="/wallet" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label={t('wallet')}>
          <div className="nav-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor" />
            </svg>
          </div>
          <span>{t('wallet')}</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label={t('profile')}>
          <div className="nav-icon" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" />
            </svg>
          </div>
          <span>{t('profile')}</span>
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
