import React, { useState } from "react";
import "./AuthForms.css";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import EditProfile from "../profile/EditProfile";
import MobileAppInstallPrompt from "./MobileAppInstallPrompt";
const Register = () => {
  const { register, saveProfileSelection, t } = useAppContext();
  const DEFAULT_PROFILE_IMAGE_NAME = "profilePhoto.png";
  const [formData, setFormData] = useState({
    username: "",
    image: "",
    name: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setError(t('passwords_not_match'));
      return;
    }

    const imageValue = formData.image && String(formData.image).trim()
      ? formData.image
      : DEFAULT_PROFILE_IMAGE_NAME;

    const result = await register({
      username: formData.username,
      image: imageValue,
      name: formData.name,
      surname: formData.surname,
      password: formData.password,
      email: formData.email,
      phone: formData.phone,
      isMale: true,
    });

    if (!result.success) {
      setError(result.error || t('registration_failed'));
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setFormData(prev => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileModalSave = ({ profileNo, imageSrc }) => {
    // set image data (could be data-uri or URL)
    setFormData(prev => ({ ...prev, image: imageSrc }));
    // save selection in context (non-blocking)
    if (saveProfileSelection) saveProfileSelection(profileNo, imageSrc);
    setShowEditProfile(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
              <img className="mini-card mini-card--back" src="/assets/siteImages/Cards/cardFlipped.png" alt="Card" />
              <img className="mini-card mini-card--front" src="/assets/siteImages/Cards/aceCardRedH.svg" alt="Card" />
              <img className="mini-card mini-card--top" src="/assets/siteImages/Cards/aceCardBlackY.svg" alt="Card" />
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-header">
            <h2>{t('create_account')}</h2>
            <p>{t('join_excited')}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('name')}</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM6 10H8V12H6V10ZM6 14H8V16H6V14ZM18 14H10V16H18V14ZM18 10H10V12H18V10Z"
                    fill="currentColor" />
                </svg>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="username">{t('username_label')}</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="currentColor" />
                </svg>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>



            {/* <div className="form-group">
              <label htmlFor="surname">{t('surname')}</label>
              <div className="input-wrapper">

                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z"
                    fill="currentColor" />
                </svg>
                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                />
              </div>
            </div> */}

            <div className="form-group">
              <label htmlFor="email">{t('email_label')}</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
                    fill="currentColor" />
                </svg>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('phone_label')}</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.85 21 3 13.15 3 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.2 2.2Z" fill="currentColor" />
                </svg>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group image-group">
              <label htmlFor="image">{t('profile_photo')}</label>
              <div className="image-preview-row">
                <div className="preview-box-small">
                  {formData.image ? (
                    <img src={formData.image} alt="preview" className="preview-img-small" />
                  ) : (
                    <div className="preview-placeholder">{t('no_image')}</div>
                  )}
                </div>

                <div className="image-actions">
                  <input type="file" accept="image/*" id="imageFile" style={{ display: 'none' }} onChange={handleFileInput} />
                  {/* <button type="button" className="btn" onClick={() => document.getElementById('imageFile').click()}>{t('upload')}</button> */}
                  <button type="button" className="btn" onClick={() => setShowEditProfile(true)}>{t('edit_profile_pic')}</button>
                </div>
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('confirm_password')}</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z"
                    fill="currentColor" />
                </svg>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="auth-submit">
              {t('create_account_btn')}
            </button>
          </form>

          <p className="auth-switch">
            {t('already_have_account')} <Link to="/login">{t('login_here')}</Link>
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
              <img className="mini-card mini-card--back" src="/assets/siteImages/Cards/cardFlippedGreen.png" alt="" />
              <img className="mini-card mini-card--front" src="/assets/siteImages/Cards/aceCardRedS.svg" alt="" />
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
      {showEditProfile && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <EditProfile onSave={handleProfileModalSave} onCancel={() => setShowEditProfile(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
