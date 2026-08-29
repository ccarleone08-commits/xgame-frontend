import { useEffect, useRef } from 'react';
import { useAppContext } from '../../../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import './DominoReact.css';

function DominoGame() {
  const { user, balance, isAuthenticated, token, language, profileImage } = useAppContext();
  const iframeRef = useRef(null);
  const initialLanguageRef = useRef(language || 'en');
  const latestLanguageRef = useRef(language || 'en');
  const navigate = useNavigate();
  const gameSrc = `/Games/Domino/Domino.html?lang=${encodeURIComponent(initialLanguageRef.current)}`;

  // 🔒 Autentifikasiya yoxlaması
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    latestLanguageRef.current = language || 'en';
  }, [language]);

  // 📨 iframe ilə kommunikasiya
  useEffect(() => {
    console.log('🎯 DominoGame mounted');
    console.log('User:', user);
    console.log('Token:', token ? 'EXISTS' : 'MISSING');

    if (!user || !token) {
      console.log('⏳ Waiting for user data...');
      return;
    }

    const handleLoad = () => {
      console.log('📺 Domino iframe loaded');

      const iframe = iframeRef.current;

      if (!iframe || !iframe.contentWindow) {
        console.error('❌ iframe or contentWindow is null');
        return;
      }

      const userData = {
        type: 'INIT_USER',
        payload: {
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          language: latestLanguageRef.current,
          balance: balance,
          token: token,
          image: user.image || profileImage || user.profileImage || null,
          profileImage: user.profileImage || user.image || profileImage || null,
          profileImageUrl: user.profileImageUrl || user.imageUrl || null,
          avatar: user.avatar || user.avatarUrl || null,
          avatarUrl: user.avatarUrl || null
        }
      };

      console.log('📤 Sending user data to Domino:', userData);
      iframe.contentWindow.postMessage(userData, '*');
      console.log('✅ User data sent to Domino');
    };
    const handleMessage = (event) => {

      if (event.data?.type === 'BACK_TO_GAMES') {
        console.log(`🎮 Returning to lobby`);
        navigate(`/games`);
      }
    };
    const iframe = iframeRef.current;

    if (iframe) {
      console.log('✅ iframe exists, adding listener');
      iframe.addEventListener('load', handleLoad);
      window.addEventListener('message', handleMessage);

      if (iframe.contentDocument?.readyState === 'complete') {
        console.log('⚡ iframe already loaded');
        handleLoad();
      }
    } else {
      console.error('❌ iframe ref is null on mount');
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [user, token, balance, navigate]);

  useEffect(() => {
    const iframe = iframeRef.current;

    if (!iframe || !iframe.contentWindow || !language) {
      return;
    }

    iframe.contentWindow.postMessage({
      type: 'SET_LANGUAGE',
      payload: { language }
    }, '*');
  }, [language]);

  return (
    <div className="domino-game-container">
      <iframe
        ref={iframeRef}
        src={gameSrc}
        className="domino-game-iframe"
        title="Domino Oyunu"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}

export default DominoGame;
