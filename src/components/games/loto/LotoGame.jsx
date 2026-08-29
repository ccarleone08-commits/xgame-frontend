import { useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../../../context/AppContext.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import './LotoReact.css';

const speechLangMap = {
  en: 'en-US',
  tr: 'tr-TR',
  hi: 'hi-IN',
  ru: 'ru-RU',
  ar: 'ar-SA',
  uz: 'uz-UZ',
  az: 'az-AZ'
};

const speechFallbackLangMap = {
  az: ['tr-TR', 'en-US'],
  uz: ['tr-TR', 'en-US'],
  en: ['en-US', 'en-GB'],
  tr: ['tr-TR', 'en-US'],
  hi: ['hi-IN', 'en-US'],
  ru: ['ru-RU', 'en-US'],
  ar: ['ar-SA', 'ar-AE', 'en-US']
};

const normalizeSpeechLanguage = (lang) => {
  const key = (lang || 'en').toString().trim().toLowerCase();
  if (['az', 'aze', 'azerbaijani', 'az-az'].includes(key)) return 'az';
  if (['uz', 'uzb', 'uzbek', 'uz-uz'].includes(key)) return 'uz';
  if (['tr', 'tur', 'turkish', 'tr-tr'].includes(key)) return 'tr';
  if (['hi', 'hin', 'hindi', 'hi-in'].includes(key)) return 'hi';
  if (['ru', 'rus', 'russian', 'ru-ru'].includes(key)) return 'ru';
  if (['ar', 'ara', 'arabic', 'ar-sa', 'ar-ae'].includes(key)) return 'ar';
  return 'en';
};

function LotoGame() {
  const { user, balance, isAuthenticated, refreshBalance, token,language } = useAppContext();
  const iframeRef = useRef(null);
  const initialLanguageRef = useRef(language || 'en');
  const latestLanguageRef = useRef(language || 'en');
  const refreshBalanceRef = useRef(refreshBalance);
  const speechVoicesRef = useRef([]);
  const activeSpeechUtteranceRef = useRef(null);
  const isSpeechUnlockedRef = useRef(false);
  const navigate = useNavigate();
  const { roomId } = useParams(); // URL-dən roomId götür
  const gameSrc = `/Games/Loto/Loto.html?lang=${encodeURIComponent(initialLanguageRef.current)}`;

  const refreshSpeechVoices = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    speechVoicesRef.current = window.speechSynthesis.getVoices() || [];
  }, []);

  const pickSpeechVoice = useCallback((lang) => {
    if (!('speechSynthesis' in window)) return null;
    if (!speechVoicesRef.current.length) {
      refreshSpeechVoices();
    }

    const voices = speechVoicesRef.current;
    const normalizedLang = lang.toLowerCase();
    const exact = voices.find((voice) => voice.lang?.toLowerCase() === normalizedLang);
    if (exact) return exact;

    const prefix = normalizedLang.split('-')[0];
    const partial = voices.find((voice) => voice.lang?.toLowerCase().startsWith(prefix));
    if (partial) return partial;

    return voices.find((voice) => voice.default) || voices[0] || null;
  }, [refreshSpeechVoices]);

  const getSpeechConfig = useCallback((lang) => {
    const languageKey = normalizeSpeechLanguage(lang);
    const requestedLang = speechLangMap[languageKey] || 'en-US';
    const candidates = [requestedLang, ...(speechFallbackLangMap[languageKey] || ['en-US'])];

    for (const candidate of candidates) {
      const voice = pickSpeechVoice(candidate);
      if (!voice) continue;

      const voiceLang = voice.lang || candidate;
      const prefix = candidate.split('-')[0].toLowerCase();

      return {
        lang: voiceLang.toLowerCase().startsWith(prefix) ? candidate : voiceLang,
        voice
      };
    }

    return { lang: requestedLang, voice: null };
  }, [pickSpeechVoice]);

  const unlockSpeechSynthesis = useCallback(() => {
    if (!('speechSynthesis' in window) || isSpeechUnlockedRef.current) return;

    try {
      const config = getSpeechConfig(latestLanguageRef.current);
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.lang = config.lang;
      utterance.volume = 0.01;
      utterance.rate = 1;
      utterance.pitch = 1;
      if (config.voice) {
        utterance.voice = config.voice;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      isSpeechUnlockedRef.current = true;
      setTimeout(() => window.speechSynthesis.resume(), 120);
    } catch {
      isSpeechUnlockedRef.current = false;
    }
  }, [getSpeechConfig]);

  const speakDrawnNumberFromParent = useCallback((number, lang, onStarted) => {
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) {
      return false;
    }
    if (!isSpeechUnlockedRef.current) {
      return false;
    }

    const normalizedNumber = Number(number);
    if (!Number.isFinite(normalizedNumber)) {
      return false;
    }

    let didStart = false;
    const config = getSpeechConfig(lang);
    const utterance = new SpeechSynthesisUtterance(String(normalizedNumber));
    utterance.lang = config.lang;
    if (config.voice) {
      utterance.voice = config.voice;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => {
      didStart = true;
      if (typeof onStarted === 'function') {
        onStarted();
      }
    };
    utterance.onend = () => {
      activeSpeechUtteranceRef.current = null;
    };
    utterance.onerror = () => {
      activeSpeechUtteranceRef.current = null;
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    activeSpeechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setTimeout(() => window.speechSynthesis.resume(), 120);

    setTimeout(() => {
      if (!didStart && activeSpeechUtteranceRef.current === utterance) {
        activeSpeechUtteranceRef.current = null;
      }
    }, 900);

    return true;
  }, [getSpeechConfig]);

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
    refreshBalanceRef.current = refreshBalance;
  }, [refreshBalance]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;

    refreshSpeechVoices();
    const refreshTimers = [120, 450, 1000, 1800].map((delay) => (
      setTimeout(refreshSpeechVoices, delay)
    ));

    window.speechSynthesis.onvoiceschanged = refreshSpeechVoices;
    document.addEventListener('pointerdown', unlockSpeechSynthesis, { passive: true });
    document.addEventListener('touchstart', unlockSpeechSynthesis, { passive: true });
    document.addEventListener('click', unlockSpeechSynthesis);

    return () => {
      refreshTimers.forEach(clearTimeout);
      if (window.speechSynthesis.onvoiceschanged === refreshSpeechVoices) {
        window.speechSynthesis.onvoiceschanged = null;
      }
      document.removeEventListener('pointerdown', unlockSpeechSynthesis);
      document.removeEventListener('touchstart', unlockSpeechSynthesis);
      document.removeEventListener('click', unlockSpeechSynthesis);
    };
  }, [refreshSpeechVoices, unlockSpeechSynthesis]);

  // 📨 iframe ilə kommunikasiya
  useEffect(() => {
    console.log('🎮 LotoGame mounted');
    console.log('Room ID:', roomId);
    console.log('User:', user);
    console.log('Token:', token ? 'EXISTS' : 'MISSING');

    // User yoxdursa gözlə
    if (!user || !token) {
      console.log('⏳ Waiting for user data...');
      return;
    }

    // roomId yoxdursa lobby-ə qayıt
    if (!roomId) {
      console.error('❌ No roomId in URL');
      navigate('/games/loto');
      return;
    }

    // iframe yüklənəndə user data və roomId göndər
    const handleLoad = () => {
      console.log('📺 Game iframe loaded');

      const iframe = iframeRef.current;

      if (!iframe) {
        console.error('❌ iframe ref is null');
        return;
      }

      if (!iframe.contentWindow) {
        console.error('❌ iframe.contentWindow is null');
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
          roomId: roomId // ← roomId də göndər
        }
      };

      console.log('📤 Sending user data to game:', userData);
      iframe.contentWindow.postMessage(userData, '*');
      console.log('✅ User data sent to game');
    };

    // iframe-dən mesajları qəbul et
    const handleMessage = (event) => {
      console.log('📩 Message from game iframe:', event.data);

      // BALANCE update
      if (event.data?.type === 'BALANCE_UPDATED') {
        refreshBalanceRef.current();
      }

      // BACK_TO_LOBBY mesajı gəldikdə lobby-ə qayıt
      if (event.data?.type === 'BACK_TO_LOBBY') {
        console.log('🔙 Returning to lobby');
        navigate('/games/loto');
      }

      if (event.data?.type === 'SPEAK_DRAWN_NUMBER') {
        speakDrawnNumberFromParent(
          event.data.payload?.number,
          event.data.payload?.language || latestLanguageRef.current,
          () => {
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage({
                type: 'SPEAK_DRAWN_NUMBER_ACK',
                payload: { requestId: event.data.payload?.requestId }
              }, '*');
            }
          }
        );
      }

      // Oyun bitdikdə lobby-ə avtomatik qayıt
      if (event.data?.type === 'GAME_ENDED') {
        console.log('🏁 Game ended, returning to lobby...');
        setTimeout(() => {
          navigate('/games/loto');
        }, 8000);
      }
    };

    const iframe = iframeRef.current;
    
    if (iframe) {
      console.log('✅ iframe exists, adding listeners');
      iframe.addEventListener('load', handleLoad);
      window.addEventListener('message', handleMessage);

      // Əgər artıq yüklənibsə
      if (iframe.contentDocument?.readyState === 'complete') {
        console.log('⚡ iframe already loaded');
        handleLoad();
      }
    } else {
      console.error('❌ iframe ref is null on mount');
    }

    // Cleanup
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [user, token, balance, roomId, navigate, speakDrawnNumberFromParent]);

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
    <div className="loto-game-container">
      <iframe
        ref={iframeRef}
        src={gameSrc}
        className="loto-game-iframe"
        title="10 Line Loto"
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}

export default LotoGame;
