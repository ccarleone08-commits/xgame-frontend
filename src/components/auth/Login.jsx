import React, { useState } from "react";
import "./AuthForms.css";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { buildApiAbsoluteUrl } from "../../config/api";
import MobileAppInstallPrompt from "./MobileAppInstallPrompt";



const Login = () => {
    const { login, t } = useAppContext();
    const [formData, setFormData] = useState({
        userNameOrEmail: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isForgotOpen, setIsForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotFeedback, setForgotFeedback] = useState({ error: "", success: "" });
    const [sendingReset, setSendingReset] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const result = await login(formData);
        if (!result.success) {
            setError(result.error || "Login failed");
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        const trimmedEmail = forgotEmail.trim().toLowerCase();
        setForgotFeedback({ error: "", success: "" });

        if (!/^[^@\s]+@gmail\.com$/i.test(trimmedEmail)) {
            setForgotFeedback({ error: t('forgot_password_gmail_only'), success: "" });
            return;
        }

        setSendingReset(true);
        try {
            const response = await fetch(buildApiAbsoluteUrl("/api/Auths/ForgetPassword/forget-password"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: trimmedEmail }),
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || t('reset_link_failed'));
            }

            setForgotFeedback({ error: "", success: t('reset_link_sent') });
        } catch (err) {
            setForgotFeedback({ error: err.message || t('reset_link_failed'), success: "" });
        } finally {
            setSendingReset(false);
        }
    };

    const closeForgotModal = () => {
        setIsForgotOpen(false);
        setForgotEmail("");
        setForgotFeedback({ error: "", success: "" });
        setSendingReset(false);
    };

    return (
        <div className="auth-container">
            <MobileAppInstallPrompt />
            <div className="auth-layout auth-layout--with-sides">
            <aside className="auth-sidecards auth-sidecards--left" aria-hidden="true">
                <div className="stat-card stat-card--loto">
                    <div className="stat-card-header">
                        <span className="stat-card-title">{t('game_loto')}</span>
                        <span className="stat-card-chip">{''}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-value">12,487</span>
                        <span className="stat-label">{t('auth_games_played')}</span>
                    </div>
                    <div className="stat-art stat-art--loto">
                        <img src="/assets/siteImages/lotoTileTemporary.png" alt="" />
                        <span className="stat-art-number">17</span>
                    </div>
                </div>

                <div className="stat-card stat-card--backgammon">
                    <div className="stat-card-header">
                        <span className="stat-card-title">{t('game_backgammon')}</span>
                        <span className="stat-card-chip">{''}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-value">8,932</span>
                        <span className="stat-label">{t('auth_games_played')}</span>
                    </div>

                    <div className="stat-art stat-art--backgammon">
                        <img src="/assets/siteImages/backgammonBackground.png" alt="" />
                        {/* <div className="stat-dice">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div> */}
                    </div>
                </div>

                <div className="stat-card stat-card--seka">
                    <div className="stat-card-header">
                        <span className="stat-card-title">{t('game_seka')}</span>
                        <span className="stat-card-chip">{''}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-value">6,114</span>
                        <span className="stat-label">{t('auth_games_played')}</span>
                    </div>
                    <div className="stat-art stat-art--seka">
                        <img className="mini-card mini-card--back" src="/assets/siteImages/Cards/cardFlipped.png" alt="Flipped Card" />
                        <img className="mini-card mini-card--front" src="/assets/siteImages/Cards/aceCardRedH.svg" alt="Card" />
                        <img className="mini-card mini-card--top" src="/assets/siteImages/Cards/aceCardBlackY.svg" alt="Card" />
                    </div>
                </div>
            </aside>

            <div className="auth-card">
                <div className="auth-header">
                    <h2>{t('welcome_back')}</h2>
                    <p>{t('enter_credentials')}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="userNameOrEmail">{t('username_or_email')}</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
                                    fill="currentColor" />
                            </svg>
                            <input
                                type="text"
                                id="userNameOrEmail"
                                name="userNameOrEmail"
                                value={formData.userNameOrEmail}
                                onChange={handleChange}
                                placeholder={t('placeholder_username_email')}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('password')}</label>
                        <div className="input-wrapper">
                            <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                                    fill="currentColor" />
                            </svg>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={t('placeholder_password')}
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="auth-submit">
                        {t('login')}
                    </button>
                </form>

                <p className="auth-switch">
                    {t('no_account')} <Link to="/register">{t('register_here')}</Link>
                </p>
                <p className="auth-switch">
                    {t('forgot_password_question')} <button type="button" className="forgot-password" onClick={() => setIsForgotOpen(true)}>{t('reset_here')}</button>
                </p>
            </div>
            <aside className="auth-sidecards auth-sidecards--right" aria-hidden="true">
                <div className="stat-card stat-card--poker">
                    <div className="stat-card-header">
                        <span className="stat-card-title">{t('game_poker')}</span>
                        <span className="stat-card-chip">{''}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-value">9,410</span>
                        <span className="stat-label">{t('auth_games_played')}</span>
                    </div>
                  
                    <div className="stat-art stat-art--poker">
                        <img className="mini-card mini-card--back" src="/assets/siteImages/Cards/cardFlippedGreen.png" alt="Flipped Card" />
                        <img className="mini-card mini-card--front" src="/assets/siteImages/Cards/aceCardRedS.svg" alt="Ace of Spades" />
                    </div>
                </div>

                <div className="stat-card stat-card--deposit">
                    <div className="stat-card-header">
                        <span className="stat-card-title">{t('auth_deposit_balance')}</span>
                        <span className="stat-card-chip">{''}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-value">3,820,500</span>
                        <span className="stat-label">{t('auth_deposit_volume')}</span>
                    </div>
   
                    <div className="stat-art stat-art--deposit">
                        <img src="/assets/siteImages/pokerChip.png" alt="Poker Chip" />
                    </div>
                </div>

                <div className="stat-card stat-card--users">
                    <div className="stat-card-header">
                        <span className="stat-card-title">{t('auth_active_users')}</span>
                        <span className="stat-card-chip">{''}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-value">58,240</span>
                        <span className="stat-label">{t('auth_total_players')}</span>
                    </div>
                    <div className="stat-art stat-art--users">
                        <svg className="user-icon" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5Zm0 2c-4.42 0-8 2.24-8 5v3h16v-3c0-2.76-3.58-5-8-5Z" />
                        </svg>
                    </div>
                </div>
            </aside>
            </div>

            {isForgotOpen && (
                <div className="modal-backdrop" onClick={closeForgotModal}>
                    <div className="modal-content" style={{ maxWidth: '480px', padding: '20px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="auth-header" style={{ marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.5rem' }}>{t('forgot_password_title')}</h2>
                            <p>{t('forgot_password_subtitle')}</p>
                        </div>

                        <form className="auth-form" onSubmit={handleForgotSubmit}>
                            <div className="form-group">
                                <label htmlFor="forgotEmail">{t('email_label')}</label>
                                <div className="input-wrapper">
                                    <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z" fill="currentColor" />
                                    </svg>
                                    <input
                                        type="email"
                                        id="forgotEmail"
                                        name="forgotEmail"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        placeholder={t('forgot_email_placeholder')}
                                        required
                                    />
                                </div>
                            </div>

                            {forgotFeedback.error && <p className="error-message">{forgotFeedback.error}</p>}
                            {forgotFeedback.success && <p className="auth-switch" style={{ color: 'var(--accent)' }}>{forgotFeedback.success}</p>}

                            <div className="form-footer">
                                <button type="button" className="auth-submit" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--white)' }} onClick={closeForgotModal}>
                                    {t('close')}
                                </button>
                                <button type="submit" className="auth-submit" disabled={sendingReset}>
                                    {sendingReset ? t('sending') : t('send_reset_link')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
