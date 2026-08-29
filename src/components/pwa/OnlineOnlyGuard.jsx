import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HEALTHCHECK_URL,
  isHealthcheckConfigured,
} from '../../config/api';
import OfflineScreen from './OfflineScreen';

const CHECK_TIMEOUT_MS = 5000;

function OnlineOnlyGuard({ children }) {
  const [connectionState, setConnectionState] = useState(() =>
    navigator.onLine ? (isHealthcheckConfigured ? 'checking' : 'online') : 'offline'
  );
  const [isChecking, setIsChecking] = useState(() => navigator.onLine && isHealthcheckConfigured);
  const abortRef = useRef(null);
  const checkIdRef = useRef(0);

  const checkConnection = useCallback(async () => {
    if (!navigator.onLine) {
      abortRef.current?.abort();
      setConnectionState('offline');
      setIsChecking(false);
      return false;
    }

    if (!isHealthcheckConfigured) {
      abortRef.current?.abort();
      setConnectionState('online');
      setIsChecking(false);
      return true;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const checkId = checkIdRef.current + 1;
    checkIdRef.current = checkId;
    const timeoutId = window.setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

    setIsChecking(true);
    setConnectionState((current) => (current === 'online' ? current : 'checking'));

    try {
      const response = await fetch(HEALTHCHECK_URL, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        mode: 'cors',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Health check failed with ${response.status}`);
      }

      const health = await response.json();
      if (health?.status !== 'Healthy') {
        throw new Error('Health check status is not Healthy');
      }

      if (checkIdRef.current === checkId) {
        setConnectionState('online');
      }
      return true;
    } catch {
      if (checkIdRef.current === checkId) {
        setConnectionState(navigator.onLine ? 'unavailable' : 'offline');
      }
      return false;
    } finally {
      window.clearTimeout(timeoutId);
      if (checkIdRef.current === checkId) {
        setIsChecking(false);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const handleOnline = () => {
      if (isHealthcheckConfigured) {
        checkConnection();
        return;
      }

      setConnectionState('online');
      setIsChecking(false);
    };

    const handleOffline = () => {
      abortRef.current?.abort();
      setConnectionState('offline');
      setIsChecking(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (navigator.onLine) {
          if (isHealthcheckConfigured) {
            checkConnection();
          } else {
            setConnectionState('online');
            setIsChecking(false);
          }
        } else {
          setConnectionState('offline');
          setIsChecking(false);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      abortRef.current?.abort();
    };
  }, [checkConnection]);

  if (connectionState !== 'online') {
    return (
      <OfflineScreen
        isChecking={isChecking || connectionState === 'checking'}
        reason={connectionState}
        onRetry={checkConnection}
      />
    );
  }

  return children;
}

export default OnlineOnlyGuard;
