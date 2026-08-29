
import React, { useState } from 'react';
import './Profile.css';
import profilePhoto from '../../assets/game-images/profilePhoto.png';
import { useAppContext } from '../../context/AppContext';

import EditProfile from "./EditProfile"

const GAME_TRANSLATION_KEYS = {
    okey: 'game_okey',
    seka: 'game_seka',
    poker: 'game_poker',
    backgammon: 'game_backgammon',
    'back gammon': 'game_backgammon',
    loto: 'game_loto',
    domino: 'game_domino',
    dominoes: 'game_domino',
    durak: 'game_durak',
};

const GAME_ICON_CLASSES = {
    okey: 'okey',
    seka: 'seka',
    poker: 'poker',
    backgammon: 'backgammon',
    'back gammon': 'backgammon',
    loto: 'loto',
    domino: 'domino',
    dominoes: 'domino',
    durak: 'durak',
};

const normalizeGameName = (gameName) => String(gameName || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const getGameIconClass = (gameName) => {
    const normalized = normalizeGameName(gameName);
    return GAME_ICON_CLASSES[normalized] || 'default';
};

const getTranslatedGameName = (gameName, t) => {
    const normalized = normalizeGameName(gameName);
    const translationKey = GAME_TRANSLATION_KEYS[normalized];
    if (!translationKey) return gameName || '';

    const translated = t(translationKey);
    return translated === translationKey ? gameName : translated;
};

const fallbackRecentGames = [];

const Profile = () => {
    // // Mock data - replace with real data from your context/API
    // const profileData = {
    //     username: "fUCKERtOFIQ31",
    //     // level: 31,
    //     coins: 316972,
    //     gamesPlayed: 69,
    //     // achievements: [
    //     //     { id: 1, name: "First Win", icon: "🏆", description: "Won your first game" },
    //     //     { id: 2, name: "High Roller", icon: "💰", description: "Won 1000 coins in a single game" },
    //     //     { id: 3, name: "Streak Master", icon: "🔥", description: "Won 5 games in a row" }
    //     // ],
    //     recentGames: [
    //         { id: 1, game: "Poker", result: "Win", coins: "+500", date: "2h ago" },
    //         { id: 2, game: "Blackjack", result: "Win", coins: "+300", date: "5h ago" },
    //         { id: 3, game: "Dominoes", result: "Loss", coins: "-200", date: "8h ago" }
    //     ]
    // };
    const { balance, user, saveProfileSelection, t, profileImage, recentGames } = useAppContext();
    const allGames = (recentGames && recentGames.length) ? recentGames : fallbackRecentGames;
    const gamesPlayed = allGames.length;
    const [showEdit, setShowEdit] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const previewGames = allGames.slice(0, 3);
    const getResultLabel = (result) => {
        const normalized = String(result || '').trim().toLowerCase();
        if (normalized === 'win') return t('win');
        if (normalized === 'loss') return t('loss');
        return result;
    };
    const getCoinsClass = (coins) => (
        String(coins || '').startsWith('+') ? 'positive' : 'negative'
    );

    return (
        <div className="container">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="profile-avatar">
                        <div className="avatar-frame">
                            {/* <span className="level-badge">{profileData.level}</span> */}
                            <div className="avatar-image">
                                <img
                                    src={profileImage || profilePhoto}
                                    alt="Profile"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = profilePhoto; }}
                                />
                            </div>
                        </div>
                        <h1 className="profile-mobile-username">{user?.username || t('loading')}</h1>
                    </div>
                    <div className="profile-info">
                        <h1>{user?.username || t('loading')}</h1>
                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-icon">🎲</span>
                                <span className="stat-value">{gamesPlayed}</span>
                                <span className="stat-label">{t('games')}</span>
                            </div>
                            {/* <div className="stat-item">
                                <span className="stat-icon">⚡</span>
                                <span className="stat-value">{profileData.winRate}</span>
                                <span className="stat-label">Win Rate</span>
                            </div> */}
                            <div className="stat-item">
                                <span className="stat-icon" aria-hidden="true">
                                    <img
                                        src="/assets/siteImages/xGameCoin.png"
                                        alt=""
                                        className="stat-coin-image"
                                    />
                                </span>
                                <span className="stat-value">{balance}</span>
                                <span className="stat-label">{t('coins')}</span>
                            </div>
                        </div>
                        <button className="profile-action-btn edit-btn" onClick={() => setShowEdit(true)}>
                            {t('edit_profile')}
                        </button>
                    </div>
                </div>

                {/* <div className="profile-content"> */}
                {/* <div className="profile-section achievements-section">
                        <h2>Achievements</h2>
                        <div className="achievements-grid">
                            {profileData.achievements.map(achievement => (
                                <div key={achievement.id} className="achievement-card">
                                    <span className="achievement-icon">{achievement.icon}</span>
                                    <h3>{achievement.name}</h3>
                                    <p>{achievement.description}</p>
                                </div>
                            ))}
                        </div>
                    </div> */}

                <div className="profile-section recent-games-section">
                    <h2>{t('recent_games')}</h2>
                    <div className="games-history">
                        {previewGames.map(game => {
                            const gameName = getTranslatedGameName(game.game, t);

                            return (
                                <div key={game.id} className="game-history-item">
                                    <div className="game-main">
                                        <span className={`game-icon game-icon--${getGameIconClass(game.game)}`} aria-hidden="true" />
                                        <div className="game-info">
                                            <span className="game-name">{gameName}</span>
                                            <span className="game-date">{game.date}</span>
                                        </div>
                                    </div>
                                    <div className="game-result">
                                        <span className={`result-badge ${String(game.result || '').toLowerCase()}`}>
                                            {/* {getResultLabel(game.result)} */}
                                            {game.coins}
                                        </span>
                                        {/* <span className={`coins ${getCoinsClass(game.coins)}`}>
                                        </span> */}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* </div> */}

                <div className="profile-actions">

                    <button className="profile-action-btn history-btn" onClick={() => setShowHistory(true)}>
                        {t('full_history')}
                    </button>
                </div>

                {/* <button className="modal-close" onClick={() => setShowEdit(false)}>×</button> */}
                {showEdit && (
                    <div className="modal-overlay" onClick={() => setShowEdit(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <EditProfile onSave={({ profileNo, imageSrc }) => {
                                // persist selection in context and close modal
                                saveProfileSelection(profileNo, imageSrc);
                                setShowEdit(false);
                            }} onCancel={() => setShowEdit(false)} />
                        </div>
                    </div>
                )}

                {showHistory && (
                    <div className="modal-overlay" onClick={() => setShowHistory(false)}>
                        <div className="history-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setShowHistory(false)}>×</button>
                            <h2 className="history-title">{t('full_history')}</h2>
                            <div className="games-history history-list">
                                {allGames.map(game => {
                                    const gameName = getTranslatedGameName(game.game, t);

                                    return (
                                        <div key={`history-${game.id}`} className="game-history-item">
                                            <div className="game-main">
                                                <span className={`game-icon game-icon--${getGameIconClass(game.game)}`} aria-hidden="true" />
                                                <div className="game-info">
                                                    <span className="game-name">{gameName}</span>
                                                    <span className="game-date">{game.date}</span>
                                                </div>
                                            </div>
                                            <div className="game-result">
                                                <span className={`result-badge ${String(game.result || '').toLowerCase()}`}>
                                                    {getResultLabel(game.result)}
                                                </span>
                                                <span className={`coins ${getCoinsClass(game.coins)}`}>
                                                    {game.coins}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
