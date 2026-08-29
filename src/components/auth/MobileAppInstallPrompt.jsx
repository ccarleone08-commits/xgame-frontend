import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './MobileAppInstallPrompt.css';
import { useAppContext } from '../../context/AppContext';

const APK_DOWNLOAD_URL = '/XGame.apk';
const CLOSE_ANIMATION_MS = 220;

const getDeviceInfo = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { mobile: false, platform: 'ios' };
  }

  const ua = navigator.userAgent || '';
  const android = /Android/i.test(ua);
  const ipadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const ios = /iPhone|iPad|iPod/i.test(ua) || ipadOS;
  const smallViewport = window.matchMedia?.('(max-width: 768px)').matches;
  const touchDevice = window.matchMedia?.('(pointer: coarse)').matches;

  return {
    mobile: Boolean(android || ios || smallViewport || touchDevice),
    platform: android ? 'android' : 'ios',
  };
};

const isInstalledMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

const MobileAppInstallPrompt = () => {
  const { t } = useAppContext();
  const initialDevice = useMemo(getDeviceInfo, []);
  const [device, setDevice] = useState(initialDevice);
  const [activePlatform, setActivePlatform] = useState(initialDevice.platform);
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const canShow = device.mobile && !isInstalledMode();

  const openSheet = () => {
    if (!canShow) return;
    setIsClosing(false);
    setIsMounted(true);
  };

  const closeSheet = useCallback(() => {
    if (!isMounted || isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [isClosing, isMounted]);

  useEffect(() => {
    const syncDevice = () => {
      const nextDevice = getDeviceInfo();
      setDevice(nextDevice);

      if (!nextDevice.mobile) {
        setIsMounted(false);
        setIsClosing(false);
      }
    };

    window.addEventListener('resize', syncDevice);
    window.addEventListener('orientationchange', syncDevice);
    return () => {
      window.removeEventListener('resize', syncDevice);
      window.removeEventListener('orientationchange', syncDevice);
    };
  }, []);

  useEffect(() => {
    if (!isMounted) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeSheet();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeSheet, isMounted]);

  if (!canShow) return null;

  const isIOS = activePlatform === 'ios';

  return (
    <div className="mobile-app-install" aria-live="polite">
      <button
        type="button"
        className="mobile-app-install__trigger"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={isMounted}
      >
        <span className="mobile-app-install__trigger-icon" aria-hidden="true">
          <img src="/icons/icon-192.png" alt="" />
        </span>
        <span>{t('install_app_title')}</span>
      </button>

      {isMounted && (
        <div
          className={`mobile-app-install__overlay${isClosing ? ' is-closing' : ''}`}
          onClick={closeSheet}
        >
          <section
            className={`mobile-modal_holder-nZAZQ mobile-app-install__sheet${isClosing ? ' is-closing' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobileAppInstallTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-app-install__handle" aria-hidden="true" />

            <header className="mobile-app-install__header">
              <h2 id="mobileAppInstallTitle">{t('install_app_title')}</h2>
            </header>

            <div className="mobile-app-install__tabs" role="tablist" aria-label={t('install_app_title')}>
              <button
                type="button"
                className={`mobile-app-install__tab${isIOS ? ' is-active' : ''}`}
                onClick={() => setActivePlatform('ios')}
                role="tab"
                aria-selected={isIOS}
              >
                iOS
              </button>
              <button
                type="button"
                className={`mobile-app-install__tab${!isIOS ? ' is-active' : ''}`}
                onClick={() => setActivePlatform('android')}
                role="tab"
                aria-selected={!isIOS}
              >
                Android
              </button>
            </div>

            <div className="mobile-app-install__preview" aria-hidden="true">
              <div className={`mobile-app-install__phone${isIOS ? ' mobile-app-install__phone--ios' : ''}`}>
                <div className="mobile-app-install__phone-status">
                  <span>9:41</span>
                  <span />
                </div>
                <div className="mobile-app-install__phone-top">
                  <span>{isIOS ? t('install_ios_preview_title') : 'XGame.apk'}</span>
                  <strong>{isIOS ? t('install_ios_preview_add') : t('install_android_open')}</strong>
                </div>
                <div className="mobile-app-install__phone-row">
                  <img src="/icons/icon-192.png" alt="" />
                  <span>XGame</span>
                </div>
                <div className="mobile-app-install__phone-line" />
                <div className="mobile-app-install__phone-line mobile-app-install__phone-line--short" />
              </div>
            </div>

            {isIOS ? (
              <ol className="mobile-app-install__steps">
                <li>{t('install_ios_step_1')}</li>
                <li>{t('install_ios_step_2')}</li>
                <li>{t('install_ios_step_3')}</li>
                <li>{t('install_ios_step_4')}</li>
              </ol>
            ) : (
              <div className="mobile-app-install__android-panel">
                <p>{t('install_android_text')}</p>
                <a className="mobile-app-install__apk-button" href={APK_DOWNLOAD_URL} download>
                  {t('install_android_button')}
                </a>
                <span>{t('install_android_hint')}</span>
              </div>
            )}

            <button type="button" className="mobile-app-install__close" onClick={closeSheet}>
              {t('close')}
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

export default MobileAppInstallPrompt;
