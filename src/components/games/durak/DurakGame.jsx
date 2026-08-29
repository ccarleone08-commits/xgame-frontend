import { useEffect, useRef } from 'react';
import { useAppContext } from '../../../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';
import './DurakReact.css';

function DurakGame() {
  const { user, balance, isAuthenticated, token,language } = useAppContext();
  const iframeRef = useRef(null);
  const initialLanguageRef = useRef(language || 'en');
  const latestLanguageRef = useRef(language || 'en');
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const gameSrc = `/Games/Durak/Durak.html?lang=${encodeURIComponent(initialLanguageRef.current)}`;

  // 🔒 Autentifikasiya yoxlaması
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    latestLanguageRef.current = language || 'en';
  }, [language]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let frameId = 0;

    const syncViewportShell = () => {
      frameId = 0;

      const viewport = window.visualViewport;
      const height = Math.round(
        viewport?.height ||
        window.innerHeight ||
        document.documentElement.clientHeight ||
        0
      );
      const top = Math.max(0, Math.round(viewport?.offsetTop || 0));

      container.style.setProperty('--durak-viewport-height', `${height}px`);
      container.style.setProperty('--durak-viewport-top', `${top}px`);
    };

    const scheduleViewportShellSync = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(syncViewportShell);
    };

    scheduleViewportShellSync();

    window.addEventListener('resize', scheduleViewportShellSync, { passive: true });
    window.addEventListener('orientationchange', scheduleViewportShellSync, { passive: true });
    window.addEventListener('scroll', scheduleViewportShellSync, { passive: true });

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleViewportShellSync, { passive: true });
      window.visualViewport.addEventListener('scroll', scheduleViewportShellSync, { passive: true });
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      window.removeEventListener('resize', scheduleViewportShellSync);
      window.removeEventListener('orientationchange', scheduleViewportShellSync);
      window.removeEventListener('scroll', scheduleViewportShellSync);

      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', scheduleViewportShellSync);
        window.visualViewport.removeEventListener('scroll', scheduleViewportShellSync);
      }
    };
  }, []);

  // 📨 iframe ilə kommunikasiya
  useEffect(() => {
    console.log('🃏 DurakGame mounted');
    console.log('User:', user);
    console.log('Token:', token ? 'EXISTS' : 'MISSING');

    if (!user || !token) {
      console.log('⏳ Waiting for user data...');
      return;
    }

    const handleLoad = () => {
      console.log('📺 Durak iframe loaded');

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
          image: user.image || user.profileImage || null,
          profileImage: user.profileImage || user.image || null,
          language: latestLanguageRef.current,
          balance: balance,
          token: token
        }
      };

      console.log('📤 Sending user data to Durak:', userData);
      iframe.contentWindow.postMessage(userData, '*');
      console.log('✅ User data sent to Durak');
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
    <div ref={containerRef} className="durak-game-container">
      <iframe
        ref={iframeRef}
        src={gameSrc}
        className="durak-game-iframe"
        title="Durak - Kart Oyunu"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}

export default DurakGame;
