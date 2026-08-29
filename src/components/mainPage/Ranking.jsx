import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import axios from 'axios';
import './Ranking.css';
import { API_BASE_URL, buildApiAbsoluteUrl } from '../../config/api';

// API config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

const GAME_TABS = [
  { id: 'okey', label: 'game_okey' },
  { id: 'seka', label: 'game_seka' },
  { id: 'poker', label: 'game_poker' },
  { id: 'backgammon', label: 'game_backgammon' },
  { id: 'loto', label: 'game_loto' },
  { id: 'domino', label: 'game_domino' },
  { id: 'durak', label: 'game_durak' },
];

const Ranking = () => {
  const { t } = useAppContext();
  const [activeGame, setActiveGame] = useState(GAME_TABS[0].id);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const hasMeaningfulStats = (player) => {
    const wins = Number(player?.totalWins ?? player?.wins ?? 0);
    const earnings = Number(player?.totalEarnings ?? player?.earnings ?? 0);
    return !(wins === 0 && earnings === 0);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // console.log('🎯 [RANKING] Fetching leaderboard...');

        const [weeklyResponse, monthlyResponse] = await Promise.all([
          api.get(`/api/leaderboard/${activeGame}/weekly`),
          api.get(`/api/leaderboard/${activeGame}/monthly`)
        ]);

        const weeklyList = Array.isArray(weeklyResponse.data) ? weeklyResponse.data : [];
        const monthlyList = Array.isArray(monthlyResponse.data) ? monthlyResponse.data : [];

        const filteredWeekly = weeklyList.filter(hasMeaningfulStats);
        const filteredMonthly = monthlyList.filter(hasMeaningfulStats);

        setWeeklyData(filteredWeekly.slice(0, 5));
        setMonthlyData(filteredMonthly.slice(0, 100));
      } catch {
        // console.error('❌ [RANKING] Error fetching leaderboard:', error);
        setWeeklyData([]);
        setMonthlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeGame]);

  const getRankLabel = (index) => {
    if (index < 5) return String(index + 1);
    return `#${index + 1}`;
  };

  const RankingItem = ({ player, index }) => {
    const [avatarError, setAvatarError] = useState(false);
    const isTopRank = index < 5;
    const avatarUrl = player.image
      ? buildApiAbsoluteUrl(player.image)
      : null;
    const showFallback = !avatarUrl || avatarError;
    const totalWins = player.totalWins ?? player.wins ?? 0;
    const totalEarnings = player.totalEarnings ?? player.earnings ?? 0;

    return (
      <div className={`ranking-item rank-${index + 1} ${isTopRank ? '' : 'rank-plain'}`}>
        <div className={`rank-badge ${isTopRank ? '' : 'rank-badge--plain'}`} aria-label={`Rank ${index + 1}`}>
          <span className="rank-label">{getRankLabel(index)}</span>
        </div>

        <div className="player-cell">
          <div className="player-avatar">
            {showFallback ? (
              player.username ? player.username.charAt(0).toUpperCase() : '?'
            ) : (
              <img
                src={avatarUrl}
                alt={player.username || 'User avatar'}
                onError={() => setAvatarError(true)}
                loading="lazy"
              />
            )}
          </div>
          <div className="player-name">{player.username || t('anonymous')}</div>
        </div>

        <div className="stat-cell" data-label={t('label_wins')}>
          <span className="cell-value wins">{totalWins}</span>
        </div>

        <div className="stat-cell" data-label={t('label_earnings')}>
          <span className="cell-value earnings">{Number(totalEarnings).toFixed(2)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-hero">
        <div className="header-wrapper">
          <img src="/assets/siteImages/trophy.png" className='title-icon' alt="Leaderboard Icon" />
          <h2 className="leaderboard-title">{t('leaderboard_title')}</h2>
        </div>
        <div className="game-tabs">
          {GAME_TABS.map((game) => (
            <button
              key={game.id}
              className={`game-tab game-tab--${game.id} ${activeGame === game.id ? 'game-tab--active' : ''}`}
              onClick={() => setActiveGame(game.id)}
            >
              {t(game.label)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{t('loading')}</p>
        </div>
      ) : weeklyData.length === 0 && monthlyData.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎮</span>
          <p>{t('no_data')}</p>
        </div>
      ) : (
        <div className="leaderboard-panels">
          {weeklyData.length > 0 && (
            <section className="rank-panel">
              <div className="panel-head">
                <h3>{t('tab_weekly')}</h3>
                <span className="panel-sub">{t('weekly_top5')}</span>
              </div>
              <div className="ranking-list">
                <div className="ranking-header">
                  <span> </span>
                  <span>{t('username_label')}</span>
                  <span>{t('label_wins')}</span>
                  <span>{t('label_earnings')}</span>
                </div>
                {weeklyData.map((player, index) => (
                  <RankingItem key={player.id || `w-${index}`} player={player} index={index} />
                ))}
              </div>
            </section>
          )}

          {monthlyData.length > 0 && (
            <section className="rank-panel">
              <div className="panel-head">
                <h3>{t('tab_monthly')}</h3>
                <span className="panel-sub">{t('monthly_top100')}</span>
              </div>
              <div className="ranking-list">
                <div className="ranking-header">
                  <span> </span>
                  <span>{t('username_label')}</span>
                  <span>{t('label_wins')}</span>
                  <span>{t('label_earnings')}</span>
                </div>
                {monthlyData.map((player, index) => (
                  <RankingItem key={player.id || `m-${index}`} player={player} index={index} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Ranking;
