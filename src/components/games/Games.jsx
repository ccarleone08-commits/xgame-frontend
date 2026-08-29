import React from 'react';
import { Link } from 'react-router-dom';
import './Games.css';

import { useAppContext } from '../../context/AppContext';





const gameCardBg = '/assets/siteImages/gameCardBG.svg';

function GameCard({ game, t }) {
  
  return (
    <Link to={`/games/${game.id}`} className="game-card" aria-labelledby={`game-${game.id}`}>
      <h3 id={`game-${game.id}`}>{t(game.name)}</h3>
      <img className="game-card-bg" src={gameCardBg} alt="Game Card Background" aria-hidden="true" />
    </Link>
  );
}

function PlayersBadge({ text }) {
  return (
    <div className="game-players">
      <span className="player-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M8.5 11.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5Zm9 0a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm-9 2c-3.04 0-5.5 1.87-5.5 4.17V20h11v-2.33c0-2.3-2.46-4.17-5.5-4.17Zm9 0c-1 0-1.94.16-2.76.44 1.35.93 2.26 2.22 2.26 3.73V20h6v-2.33c0-2.3-2.46-4.17-5.5-4.17Z"
          />
        </svg>
      </span>
      <span className="player-count">{text}</span>
    </div>
  );
}

export default function Games() {
  const { t, language } = useAppContext();
  const isEn = (language || 'en') === 'en';
  return (
    <div className="container">
      <section className="games-page">
        {/* {GAMES.map(game => (
          <GameCard key={game.id} game={game} />
        ))} */}
        <Link to={`/games/okey`} className="game-card okey-card" aria-labelledby={`game-okey`}>
          <h3 id={`game-okey`}>{t('game_okey')}</h3>
          <PlayersBadge text={t('players_count_2_4')} />
          <div className="okey-tiles" aria-hidden="true">
            <div className="okey-tile green">
              <span className="tile-number">7</span>
              <span className="tile-color-dot-container">
                <span className="tile-color-dot"></span>
              </span>
            </div>
            <div className="okey-tile joker">
              <span className="tile-joker-star">★</span>
              <span className="tile-color-dot-container">
                <span className="tile-color-dot"></span>
              </span>
            </div>
          </div>
          <img className="game-card-bg" src={gameCardBg} alt="" aria-hidden="true" />
        </Link>
        <Link to={`/games/seka`} className="game-card seka-card" aria-labelledby={`game-seka`}>
          
          <h3 id={`game-seka`}>{t('game_seka')}</h3>
          <PlayersBadge text={t('players_count_2_6')} />
          <div className="seka-cards" aria-hidden="true">
            <div className="seka-hand-card seka-hand-card--left seka-hand-card--flip">
              <div className="seka-card-inner">
                <img className="seka-face seka-front" src="/assets/siteImages/Cards/cardFlipped.png" alt="Flipped Card" />
                <img className="seka-face seka-back" src="/assets/siteImages/Cards/aceCardRedS.svg" alt="Card" />
              </div>
            </div>
            <div className="seka-hand-card seka-hand-card--center">
              <img className="seka-face seka-face--static" src="/assets/siteImages/Cards/aceCardRedH.svg" alt="Card" />
            </div>
            <div className="seka-hand-card seka-hand-card--right seka-hand-card--flip">
              <div className="seka-card-inner">
                <img className="seka-face seka-front" src="/assets/siteImages/Cards/cardFlipped.png" alt="Flipped Card" />
                <img className="seka-face seka-back" src="/assets/siteImages/Cards/aceCardBlackY.svg" alt="Card" />
              </div>
            </div>
          </div>
          <img className="game-card-bg" src={gameCardBg} alt="Game Card Bg" aria-hidden="true" />
        </Link>
        <Link to={`/games/poker`} className="game-card poker-card" aria-labelledby={`game-poker`}>
          
          <h3 id={`game-poker`}>{t('game_poker')}</h3>
          <PlayersBadge text={t('players_count_2_5')} />
          <div className="poker-hand" aria-hidden="true">
            <div className="poker-card poker-card--left poker-card--flip">
              <div className="poker-card-inner">
                <img className="poker-face poker-front" src="/assets/siteImages/Cards/cardFlippedGreen.png" alt="Flipped Card" />
                <img className="poker-face poker-back" src="/assets/siteImages/Cards/aceCardRedH.svg" alt="Card" />
              </div>
            </div>
            <div className="poker-card poker-card--right poker-card--flip">
              <div className="poker-card-inner">
                <img className="poker-face poker-front" src="/assets/siteImages/Cards/cardFlippedGreen.png" alt="Flipped Card" />
                <img className="poker-face poker-back" src="/assets/siteImages/Cards/aceCardRedS.svg" alt="Card" />
              </div>
            </div>
            <img className="poker-chip poker-chip--center" src="/assets/siteImages/pokerChip.png" alt="Chip" />
            <img className="poker-chip poker-chip--left" src="/assets/siteImages/pokerChip.png" alt="Chip" />
            <img className="poker-chip poker-chip--right" src="/assets/siteImages/pokerChip.png" alt="Chip" />
          </div>
          <img className="game-card-bg" src={gameCardBg} alt="Card Bg" aria-hidden="true" />
        </Link>
        <Link to={`/games/backgammon`} className="game-card backgammon-card" aria-labelledby={`game-backgammon`}>
          <h3
            id={`game-backgammon`}
            className={`game-title backgammon-title${isEn ? ' backgammon-title--en' : ''}`}
          >
            {t('game_backgammon')}
          </h3>
          <PlayersBadge text={t('players_count_2')} />
          <div className="backgammon-dice" aria-hidden="true">
            <div className="diceWrap dice-wrap--left">
              <div className="dice rolling dice--ivory">
                <div className="diceFace front"></div>
                <div className="diceFace up"></div>
                <div className="diceFace left"></div>
                <div className="diceFace right"></div>
                <div className="diceFace bottom"></div>
                <div className="diceFace back"></div>
              </div>
            </div>
            <div className="diceWrap dice-wrap--right">
              <div className="dice rolling dice--ivory">
                <div className="diceFace front"></div>
                <div className="diceFace up"></div>
                <div className="diceFace left"></div>
                <div className="diceFace right"></div>
                <div className="diceFace bottom"></div>
                <div className="diceFace back"></div>
              </div>
            </div>
          </div>
          <img className="backgammon-bg" src="/assets/siteImages/backgammonBackground.png" alt="Backgammon Board" aria-hidden="true" />
          <img className="game-card-bg" src={gameCardBg} alt="Game Card Bg" aria-hidden="true" />
        </Link>
        
        <Link to={`/games/loto`} className="game-card loto-card" aria-labelledby={`game-loto`}>
          <h3 id={`game-loto`}>{t('game_loto')}</h3>
          <PlayersBadge text={t('players_count_unlimited')} />
          <div className="loto-layout" aria-hidden="true">
            <div className="loto-cards">
              <img className="loto-card-img loto-card-img--back" src="/assets/siteImages/lotoCardTemporary.png" alt="Loto Card" />
              <img className="loto-card-img loto-card-img--front" src="/assets/siteImages/lotoCardTemporary.png" alt="Loto Card" />
            </div>
            <div className="loto-tiles">
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">7</span></div>
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">12</span></div>
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">17</span></div>
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">25</span></div>
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">37</span></div>
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">41</span></div>
              <div className="loto-tile"><img src="/assets/siteImages/lotoTileTemporary.png" alt="Loto Tile" /><span className="loto-tile-number">57</span></div>
            </div>
            <img className="loto-sack" src="/assets/siteImages/lotoSack.png" alt="LotoSack" />
          </div>
          <img className="game-card-bg" src={gameCardBg} alt="" aria-hidden="true" />
        </Link>
        <Link to={`/games/domino`} className="game-card domino-card" aria-labelledby={`game-domino`}>
          <h3 id={`game-domino`}>{t('game_domino')}</h3>
          <PlayersBadge text={t('players_count_2_4')} />
          <div className="domino-tiles" aria-hidden="true">
            <img className="domino-tile domino-tile--primary" src="/Games/Domino/images/headerTiles/domino11.svg" alt="" />
            <img className="domino-tile domino-tile--secondary" src="/Games/Domino/images/headerTiles/domino66.svg" alt="" />
          </div>
          <img className="game-card-bg" src={gameCardBg} alt="" aria-hidden="true" />
        </Link>
        <Link to={`/games/durak`} className="game-card durak-card" aria-labelledby={`game-durak`}>
          <h3 id={`game-durak`}>{t('game_durak')}</h3>
          <PlayersBadge text={t('players_count_2_6')} />
          <div className="durak-stacks" aria-hidden="true">
            <div className="durak-stack durak-stack--left">
              <div className="durak-stack-card">
                <div className="durak-card-inner">
                  <img className="durak-face durak-front" src="/assets/siteImages/Cards/kingCardBlackPika.png" alt="Durak Card" />
                  <img className="durak-face durak-back" src="/assets/siteImages/Cards/cardFlippedBlue.png" alt="Durak Card" />
                </div>
              </div>
              <div className="durak-stack-card">
                <div className="durak-card-inner">
                  <img className="durak-face durak-front" src="/assets/siteImages/Cards/aceCardBlackM.svg" alt="Durak Card" />
                  <img className="durak-face durak-back" src="/assets/siteImages/Cards/cardFlippedBlue.png" alt="Durak Card" />
                </div>
              </div>
            </div>
            <div className="durak-stack durak-stack--right">
              <div className="durak-stack-card">
                <div className="durak-card-inner">
                  <img className="durak-face durak-front" src="/assets/siteImages/Cards/kingCardRedH.png" alt="Durak Card" />
                  <img className="durak-face durak-back" src="/assets/siteImages/Cards/cardFlippedBlue.png" alt="Durak Card" />
                </div>
              </div>
              <div className="durak-stack-card">
                <div className="durak-card-inner">
                  <img className="durak-face durak-front" src="/assets/siteImages/Cards/aceCardRedH.svg" alt="Durak Card" />
                  <img className="durak-face durak-back" src="/assets/siteImages/Cards/cardFlippedBlue.png" alt="Durak Card" />
                </div>
              </div>
            </div>
          </div>
          <img className="game-card-bg" src={gameCardBg} alt="Game Card Bg" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
