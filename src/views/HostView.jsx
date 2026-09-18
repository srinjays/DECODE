import { useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { MAP, MAP_W, MAP_H, T, TILE_EMOJI, ROOMS } from '../game/officeMap';

const TL = 28; // tile size for overview

// ============================================================
// OVERVIEW MAP — shows full office with all players
// ============================================================
function OverviewMap({ players, hotspot }) {
  return (
    <div className="overview-map" style={{ width: MAP_W * TL, height: MAP_H * TL }}>
      {/* Tiles */}
      {MAP.map((row, y) => row.map((tile, x) => (
        <div key={`${x}-${y}`} className={`tile t-${tile} tile-sm`}
          style={{ left: x * TL, top: y * TL, width: TL, height: TL }}>
          {TILE_EMOJI[tile] && <span className="tile-icon-sm">{TILE_EMOJI[tile]}</span>}
        </div>
      )))}

      {/* Room labels */}
      {ROOMS.map((r, i) => (
        <div key={i} className="room-label" style={{ left: r.x * TL, top: r.y * TL }}>
          {r.label}
        </div>
      ))}

      {/* Hotspot */}
      {hotspot && (
        <div className="hotspot-marker hs-sm" style={{ left: hotspot.x * TL, top: hotspot.y * TL, width: TL, height: TL }}>
          <span className="hotspot-emoji">{hotspot.emoji}</span>
          <div className="hotspot-ring" />
        </div>
      )}

      {/* Players */}
      {players && [1, 2, 3].map(pid => {
        const p = players[pid];
        if (!p || !p.connected) return null;
        return (
          <div key={pid} className="sprite sprite-overview" style={{
            left: p.x * TL, top: p.y * TL, width: TL, height: TL,
          }}>
            <span className="sprite-char-sm">{p.emoji}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// AI CHAT LOG
// ============================================================
function AIChatLog({ messages }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  return (
    <div className="host-chat-log pixel-box">
      <div className="chat-header">💬 GAME LOG</div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from === 'AI' ? 'chat-ai' : ''}`}>
            <span className="chat-from">{m.from}:</span> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ============================================================
// HOST VIEW
// ============================================================
export default function HostView() {
  const [state, setState] = useState(null);
  const [timer, setTimer] = useState(300);
  const [chatMsgs, setChatMsgs] = useState([]);

  useEffect(() => {
    socket.emit('join-host');
    socket.on('host-state', (s) => { setState(s); setTimer(s.timer); });
    socket.on('tick', setTimer);
    socket.on('chat-history', setChatMsgs);
    socket.on('chat-new', (m) => setChatMsgs(prev => [...prev.slice(-30), m]));
    socket.on('game-reset', () => { setState(null); setChatMsgs([]); });
    return () => { socket.off('host-state'); socket.off('tick'); socket.off('chat-history'); socket.off('chat-new'); socket.off('game-reset'); };
  }, []);

  if (!state) return (
    <div className="host-view"><div className="connecting"><span className="connecting-icon">🤖</span><p>CONNECTING...</p></div></div>
  );

  const { phase, round, players, hotspot, score, chaosLevel, lastResult } = state;
  const m = Math.floor(timer / 60), s = timer % 60;
  const roundNames = ['🔥 OFFICE FIRE', '📱 SCAM ALERT', '🤡 AI MANIPULATION', '🙈 COMM CHAOS', '😈 FINAL TRAP'];
  const allConnected = players[1]?.connected && players[2]?.connected && players[3]?.connected;

  return (
    <div className="host-view">
      {/* HUD */}
      <div className="game-hud">
        <div className="hud-item"><span>HACK THE CHAOS</span></div>
        <div className="hud-item">
          <span>ROUND {round + 1}</span>
          <span style={{ marginLeft: 8 }}>{roundNames[round] || ''}</span>
        </div>
        <div className="hud-item">
          <span>⏱</span>
          <span className={`hud-timer ${timer <= 30 ? 'timer-critical' : timer <= 60 ? 'timer-low' : ''}`}>
            {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        </div>
        <div className="hud-item">
          <span>CHAOS</span>
          <div className="hud-chaos-bar">
            <div className={`hud-chaos-fill ${chaosLevel > 60 ? 'chaos-high' : chaosLevel > 30 ? 'chaos-mid' : ''}`}
              style={{ width: `${chaosLevel}%` }} />
          </div>
        </div>
        <div className="hud-item"><span>🏆</span><span className="hud-score">{score}</span></div>
      </div>

      {/* Main area */}
      <div className="host-main">
        {/* LOBBY */}
        {phase === 'lobby' && (
          <div className="lobby-screen">
            <div className="lobby-title">HACK THE CHAOS</div>
            <div className="lobby-subtitle">WAITING FOR PLAYERS...</div>
            <div className="lobby-players-row">
              {[1, 2, 3].map(pid => {
                const p = players[pid];
                return (
                  <div key={pid} className={`pixel-box lobby-player-slot ${p?.connected ? 'slot-ready' : ''}`}>
                    <span className="lobby-player-emoji">{p?.emoji || '❓'}</span>
                    <div>{p?.name || '???'}</div>
                    <div>{p?.connected ? '🟢 READY' : '🔴 WAITING'}</div>
                  </div>
                );
              })}
            </div>
            <button className={`pixel-btn ${allConnected ? 'pixel-btn-primary' : 'pixel-btn-disabled'} start-game-btn`}
              onClick={() => socket.emit('start-game')} disabled={!allConnected}>
              {allConnected ? '▶ START GAME' : '⏳ WAITING...'}
            </button>
          </div>
        )}

        {/* GAME ACTIVE */}
        {['explore', 'challenge', 'result'].includes(phase) && (
          <div className="host-game-area">
            <div className="host-map-section">
              <OverviewMap players={players} hotspot={hotspot} />
              {/* Player legend */}
              <div className="player-legend">
                {[1, 2, 3].map(pid => {
                  const p = players[pid];
                  return (
                    <div key={pid} className={`legend-item ${p?.response ? 'legend-responded' : ''}`}>
                      <span>{p?.emoji}</span> {p?.name}
                      {p?.response && <span className="legend-check"> ✅</span>}
                    </div>
                  );
                })}
              </div>
              {/* Phase indicator */}
              <div className={`phase-badge phase-${phase}`}>
                {phase === 'explore' && '🔍 EXPLORING'}
                {phase === 'challenge' && '⚡ CHALLENGE ACTIVE'}
                {phase === 'result' && (lastResult?.correct ? '✅ CORRECT' : '❌ WRONG')}
              </div>
            </div>
            <AIChatLog messages={chatMsgs} />
          </div>
        )}

        {/* VICTORY */}
        {phase === 'victory' && (
          <div className="victory-screen">
            <div className="victory-stars">⭐ ⭐ ⭐</div>
            <div className="victory-title">COMPANY SAVED!</div>
            <div className="victory-subtitle">SCORE: {score}</div>
            <button className="pixel-btn pixel-btn-primary" onClick={() => socket.emit('reset-game')}>🔄 PLAY AGAIN</button>
          </div>
        )}

        {/* GAMEOVER */}
        {phase === 'gameover' && (
          <div className="gameover-screen">
            <div className="gameover-title">💀 TIME'S UP</div>
            <div style={{ fontSize: 10, color: '#888' }}>Score: {score}</div>
            <button className="pixel-btn pixel-btn-primary" onClick={() => socket.emit('reset-game')}>🔄 TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}
