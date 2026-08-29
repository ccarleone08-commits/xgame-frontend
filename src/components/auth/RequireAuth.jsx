import React from 'react';
import { Link } from 'react-router-dom';
import './RequireAuth.css';
import { useAppContext } from '../../context/AppContext';
import MobileAppInstallPrompt from './MobileAppInstallPrompt';

const RequireAuth = () => {
    const { t } = useAppContext();

    return (
        <div className="require-auth-container">
            <MobileAppInstallPrompt />
            <div className="require-auth-card">
                <div className="card-content">
                    <h2>🎲 {t('access_required')}</h2>
                    <p>{t('access_prompt')}</p>

                    <div className="features-list">
                        <div className="feature-item">
                            <span className="feature-icon">🎮</span>
                            <span className="future-text">{t('feature_play_premium')}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">💬</span>
                            <span className="future-text">{t('feature_chat_players')}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🏆</span>
                            <span className="future-text">{t('feature_play_earn')}</span>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">💰</span>
                            <span className="future-text">{t('feature_manage_wallet')}</span>
                        </div>
                    </div>

                    <div className="auth-buttons">
                        <Link to="/login" className="auth-btn login-btn">
                            {t('login')}
                        </Link>
                        <Link to="/register" className="auth-btn register-btn">
                            {t('register_now')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequireAuth;
