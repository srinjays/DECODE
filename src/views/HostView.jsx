import { useState, useEffect, useRef } from 'react';
import socket from '../socket';

const IMG_W = 1536;
const IMG_H = 1024;
const GRID_W = 24;
const CELL = IMG_W / GRID_W;
const SCALE = 0.5; // scale down for host overview

const HOTSPOTS = [
  { x: 13, y: 3, label: 'HINT 1', emoji: '🔥' },
  { x: 20, y: 5, label: 'HINT 2', emoji: '📱' },
  { x: 2, y: 6, label: 'HINT 3', emoji: '🤡' },
  { x: 11, y: 7, label: 'HINT 4', emoji: '🙈' },
  { x: 19, y: 11, label: 'HINT 5', emoji: '😈' },
];

const CHAR_SPRITES = {
  1: { sx: 512, sy: 170, sw: 200, sh: 340, label: 'DEAF' },
  2: { sx: 1074, sy: 170, sw: 200, sh: 340, label: 'BLIND' },
  3: { sx: 60, sy: 170, sw: 200, sh: 340, label: 'DUMB' },
};

function HostCharSprite({ pid }) {
  const sp = CHAR_SPRITES[pid];
  if (!sp) return null;
  const size = 30;
  return (
    <div style={{ width: size, height: size, overflow: 'hidden', position: 'relative' }}>
      <img src="/characters.png" alt={sp.label}
        style={{
          position: 'absolute',
          left: -(sp.sx) * (size / sp.sw),
          top: -(sp.sy) * (size / sp.sh),
          width: 1536 * (size / sp.sw),
          height: 1024 * (size / sp.sh),
        }} />
    </div>
  );
}

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

  const { phase, round, players, score, chaosLevel, lastResult } = state;
  const m = Math.floor(timer / 60), s = timer % 60;
  const roundNames = ['🔥 OFFICE FIRE', '📱 SCAM ALERT', '🤡 AI MANIPULATION', '🙈 COMM CHAOS', '😈 FINAL TRAP'];
  const allConnected = players[1]?.connected && players[2]?.connected && players[3]?.connected;

  return (
    <div className="host-view">
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

      <div className="host-main">
        {phase === 'lobby' && (
          <div className="lobby-screen">
            <div className="lobby-title">HACK THE CHAOS</div>
            <div className="lobby-subtitle">WAITING FOR PLAYERS...</div>
            <div className="lobby-players-row">
              {[1, 2, 3].map(pid => {
                const p = players[pid];
                return (
                  <div key={pid} className={`pixel-box lobby-player-slot ${p?.connected ? 'slot-ready' : ''}`}>
                    <HostCharSprite pid={pid} />
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

        {['explore', 'challenge', 'result'].includes(phase) && (
          <div className="host-game-area">
            <div className="host-map-section">
              {/* Overview map using actual office image */}
              <div className="overview-map" style={{
                width: IMG_W * SCALE, height: IMG_H * SCALE,
                backgroundImage: 'url(/office-bg.png)',
                backgroundSize: `${IMG_W * SCALE}px ${IMG_H * SCALE}px`,
              }}>
                {/* Hotspot */}
                {HOTSPOTS[round] && (
                  <div className="hotspot-marker hs-sm" style={{
                    left: (HOTSPOTS[round].x + 0.5) * CELL * SCALE - 12,
                    top: (HOTSPOTS[round].y + 0.5) * CELL * SCALE - 12,
                  }}>
                    <span className="hotspot-emoji">{HOTSPOTS[round].emoji}</span>
                    <div className="hotspot-ring" />
                  </div>
                )}

                {/* Player positions */}
                {[1, 2, 3].map(pid => {
                  const p = players[pid];
                  if (!p?.connected) return null;
                  return (
                    <div key={pid} className="host-player-dot" style={{
                      left: (p.x + 0.5) * CELL * SCALE - 15,
                      top: (p.y + 0.5) * CELL * SCALE - 18,
                    }}>
                      <HostCharSprite pid={pid} />
                      <span className="host-dot-label">{p.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="player-legend">
                {[1, 2, 3].map(pid => {
                  const p = players[pid];
                  return (
                    <div key={pid} className={`legend-item ${p?.response ? 'legend-responded' : ''}`}>
                      {p?.emoji} {p?.name} {p?.response && '✅'}
                    </div>
                  );
                })}
              </div>
              <div className={`phase-badge phase-${phase}`}>
                {phase === 'explore' && '🔍 EXPLORING'}
                {phase === 'challenge' && '⚡ CHALLENGE ACTIVE'}
                {phase === 'result' && (lastResult?.correct ? '✅ CORRECT' : '❌ WRONG')}
              </div>
            </div>
            <AIChatLog messages={chatMsgs} />
          </div>
        )}

        {phase === 'victory' && (
          <div className="victory-screen">
            <div className="victory-stars">⭐⭐⭐</div>
            <div className="victory-title">COMPANY SAVED!</div>
            <div className="victory-subtitle">SCORE: {score}</div>
            <button className="pixel-btn pixel-btn-primary" onClick={() => socket.emit('reset-game')}>🔄 PLAY AGAIN</button>
          </div>
        )}
        {phase === 'gameover' && (
          <div className="gameover-screen">
            <div className="gameover-title">💀 TIME'S UP</div>
            <button className="pixel-btn pixel-btn-primary" onClick={() => socket.emit('reset-game')}>🔄 TRY AGAIN</button>
          </div>
        )}
      </div>
    </div>
  );
}
