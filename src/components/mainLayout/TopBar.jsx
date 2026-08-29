import React, { useEffect, useRef, useState } from 'react';
import './TopBar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAppContext } from '../../context/AppContext';

const LANGUAGE_OPTIONS = [
  { value: 'en', code: 'EN', label: 'English', flag: '/assets/flags/en.png' },
  { value: 'tr', code: 'TR', label: 'Türkçe', flag: '/assets/flags/tr.png' },
  { value: 'hi', code: 'HI', label: 'हिन्दी', flag: '/assets/flags/hi.png' },
  { value: 'ar', code: 'AR', label: 'العربية', flag: '/assets/flags/ar.png' },
  { value: 'ru', code: 'RU', label: 'Русский', flag: '/assets/flags/ru.png' },
  { value: 'uz', code: 'UZ', label: 'O‘zbek', flag: '/assets/flags/uz.png' },
];

const TopBar = () => {
  const { isAuthenticated, balance, logout, language, setAppLanguage, t } = useAppContext();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const languageSelectRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isProfileRoute = location.pathname.startsWith('/profile');
  const activeLanguage = LANGUAGE_OPTIONS.find((item) => item.value === language) || LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (!isLanguageMenuOpen) return undefined;

    const handleDocumentClick = (event) => {
      if (!languageSelectRef.current?.contains(event.target)) {
        setIsLanguageMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isLanguageMenuOpen]);

  const handleLanguageSelect = (nextLanguage) => {
    setAppLanguage(nextLanguage);
    setIsLanguageMenuOpen(false);
  };

  return (
    <div className="top-bar">
      <div className="top-bar-container">
        <div className="top-bar-left">
          {isProfileRoute ? (
            <div className="language-select" ref={languageSelectRef}>
              <button
                type="button"
                className="lang-select-trigger"
                aria-label="Select language"
                aria-haspopup="listbox"
                aria-expanded={isLanguageMenuOpen}
                onClick={() => setIsLanguageMenuOpen((isOpen) => !isOpen)}
              >
                <img className="language-flag" src={activeLanguage.flag} alt="" aria-hidden="true" />
                <span className="language-current-code">{activeLanguage.code}</span>
                <span className="language-chevron" aria-hidden="true" />
              </button>

              {isLanguageMenuOpen && (
                <div className="language-menu" role="listbox" aria-label="Select language">
                  {LANGUAGE_OPTIONS.map((option) => {
                    const isSelected = option.value === activeLanguage.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`language-option${isSelected ? ' is-selected' : ''}`}
                        onClick={() => handleLanguageSelect(option.value)}
                      >
                        <img className="language-flag" src={option.flag} alt="" aria-hidden="true" />
                        <span className="language-option-label">{option.label}</span>
                        <span className="language-option-code">{option.code}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <Link to="/" className="top-bar-logo-link" aria-label="Home">
              <img
                src="/assets/siteImages/siteLogo.png"
                alt="Site logo"
                className="top-bar-logo"
              />
            </Link>
          )}
        </div>

        <div className="top-bar-right">
          {isAuthenticated ? (
            <>
              <div className="balance-display" title={`${t('balance')}: ${balance}`}>
                <div className="coin-icon" aria-hidden>
                  <img
                    src="/assets/siteImages/xGameCoin.png"
                    alt=""
                    className="coin-icon-image"
                  />
                </div>
                <span className="balance-amount">{balance}</span>
                <button className="add-balance-btn-top" onClick={() => navigate('/deposit')} aria-label={t('add_balance')}>+</button>

              </div>
              {/* <Link to="/profile" className="top-bar-btn profile-btn">{user?.username || 'Profile'}</Link> */}
              {isProfileRoute && (
                <button className="top-bar-btn logout-btn" onClick={logout}>{t('logout')}</button>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="top-bar-btn login-btn-t">{t('login')}</Link>
              <Link to="/register" className="top-bar-btn register-btn-t">{t('register')}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
