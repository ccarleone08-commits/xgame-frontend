import React from 'react';
import './LandingPage.css';
import Ranking from './Ranking';


const LandingPage = () => {
    return (
        <div className="container">

            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-grid">
                            <Ranking />
                        {/* <div className="hero-content-1">
                            <div className="hero-text">
                                <h1>{t('home_tagline')}</h1>
                                <p>{t('home_sub')}</p>
                                <div className="hero-features">
                                    <div className="feature-item">
                                        <span>{t('feature_live_matches')}</span>
                                    </div>
                                    <div className="feature-item">
                                        <span>{t('feature_global_rankings')}</span>
                                    </div>
                                </div>
                                <div className="cta-buttons">
                                    <Link to="/games" className="btn btn-primary">Start Playing Now</Link>
                                    <button className="btn btn-secondary">Learn More</button>
                                </div>
                            </div>
                            
                        </div> */}
                        {/* <div className="hero-image">
                            <div className="game-preview">
                                <div className="game-card">
                                    <img src={dominoesImg} alt="Dominoes" className="game-card-img" />
                                </div>
                                <div className="game-card">
                                    <img src={backgammonImg} alt="Backgammon" className="game-card-img" />
                                </div>
                                <div className="game-card">
                                    <img src={chessImg} alt="Chess" className="game-card-img" />
                                </div>
                                <div className="game-card">
                                    <img src={durakImg} alt="Durak" className="game-card-img" />
                                </div>
                            </div>
                        </div> */}
                    </div>
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
