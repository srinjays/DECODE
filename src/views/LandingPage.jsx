import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-title">HACK THE<br/>CHAOS</div>
      <div className="landing-subtitle">THREE PLAYERS. ONE CHAOTIC AI. ZERO TRUST.</div>
      <div className="landing-tagline">EXPLORE THE OFFICE. FIND THE ISSUES. SAVE THE COMPANY.</div>

      <div className="landing-boxes">
        <div className="pixel-box landing-info-box">
          <div className="pixel-box-title">THEME</div>
          AI &amp; CYBERSECURITY
        </div>
        <div className="pixel-box landing-info-box">
          <div className="pixel-box-title">STYLE</div>
          2D OFFICE RPG
        </div>
        <div className="pixel-box landing-info-box">
          <div className="pixel-box-title">GOAL</div>
          STOP. VERIFY.<br/>PROTECT.
        </div>
      </div>

      <div className="landing-start-section">
        <button className="pixel-btn pixel-btn-primary start-game-btn" onClick={() => navigate('/host')}>
          📺 HOST SCREEN
        </button>
      </div>

      <div className="landing-subtitle" style={{ marginBottom: 12 }}>PLAYERS JOIN ON PHONES:</div>

      <div className="landing-players-grid">
        <div className="pixel-box landing-player-card" onClick={() => navigate('/player/1')}>
          <span className="player-card-emoji">🔎</span>
          <span className="player-card-name">PLAYER 1</span>
          SCOUT (DEAF)
        </div>
        <div className="pixel-box landing-player-card" onClick={() => navigate('/player/2')}>
          <span className="player-card-emoji">🧩</span>
          <span className="player-card-name">PLAYER 2</span>
          DETECTOR (BLIND)
        </div>
        <div className="pixel-box landing-player-card" onClick={() => navigate('/player/3')}>
          <span className="player-card-emoji">🛡️</span>
          <span className="player-card-name">PLAYER 3</span>
          SECURITY (MUTE)
        </div>
      </div>
    </div>
  );
}
