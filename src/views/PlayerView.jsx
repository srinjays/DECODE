import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';

// ============================================================
// MAP CONFIG — matches office-bg.png layout
// Map image is 1536x1024. We define a virtual grid for collision.
// ============================================================
const IMG_W = 1536;
const IMG_H = 1024;
const GRID_W = 24;  // virtual grid columns
const GRID_H = 16;  // virtual grid rows
const CELL = IMG_W / GRID_W; // 64px per cell

// Walkable area — 1=blocked, 0=walkable
// Matching the office-bg.png layout (walls, furniture, doors)
const COLLISION = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,0,0,0,1,1,1,1,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1],
  [1,0,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Hotspot locations matching HINT labels in the image
const HOTSPOTS = [
  { x: 13, y: 3, label: 'HINT 1', emoji: '🔥' },  // Bookshelf area
  { x: 20, y: 5, label: 'HINT 2', emoji: '📱' },  // Right desk
  { x: 2, y: 6, label: 'HINT 3', emoji: '🤡' },   // Filing cabinet
  { x: 11, y: 7, label: 'HINT 4', emoji: '🙈' },  // Conference table
  { x: 19, y: 11, label: 'HINT 5', emoji: '😈' },  // Whiteboard
];

const SPAWNS = { 1: { x: 8, y: 9 }, 2: { x: 10, y: 9 }, 3: { x: 12, y: 9 } };

// Character sprite positions in characters.png (each char is ~1/3 width)
// Dumb=P3(Mute), Deaf=P1, Blind=P2
const CHAR_SPRITES = {
  1: { sx: 512 * 1, sy: 170, sw: 200, sh: 340, label: 'DEAF' },    // Middle third
  2: { sx: 512 * 2 + 50, sy: 170, sw: 200, sh: 340, label: 'BLIND' },  // Right third
  3: { sx: 60, sy: 170, sw: 200, sh: 340, label: 'DUMB' },         // Left third
};

function isWalkable(gx, gy) {
  if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return false;
  return COLLISION[gy]?.[gx] === 0;
}

function gridDist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// ============================================================
// AUDIO — Proximity beep
// ============================================================
let audioCtx = null;
function beep(freq, dur) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.connect(g); g.connect(audioCtx.destination);
  osc.frequency.value = freq; g.gain.value = 0.12;
  osc.start(); osc.stop(audioCtx.currentTime + dur);
}
function speak(txt) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(txt);
  u.rate = 0.95; window.speechSynthesis.speak(u);
}

// ============================================================
// VIEWPORT — how much of the map is visible on screen
// ============================================================
const VP_W = 640; // viewport width px
const VP_H = 480; // viewport height px
const FOG_RADIUS = 140; // visibility circle radius px

// ============================================================
// D-PAD
// ============================================================
function DPad({ onMove }) {
  const hold = useRef(null);
  const start = (d) => { onMove(d); hold.current = setInterval(() => onMove(d), 200); };
  const stop = () => { if (hold.current) { clearInterval(hold.current); hold.current = null; } };
  return (
    <div className="dpad">
      <button className="dpad-btn dpad-up" onPointerDown={()=>start('up')} onPointerUp={stop} onPointerLeave={stop}>▲</button>
      <div className="dpad-mid">
        <button className="dpad-btn dpad-left" onPointerDown={()=>start('left')} onPointerUp={stop} onPointerLeave={stop}>◀</button>
        <div className="dpad-center" />
        <button className="dpad-btn dpad-right" onPointerDown={()=>start('right')} onPointerUp={stop} onPointerLeave={stop}>▶</button>
      </div>
      <button className="dpad-btn dpad-down" onPointerDown={()=>start('down')} onPointerUp={stop} onPointerLeave={stop}>▼</button>
    </div>
  );
}

// ============================================================
// CHALLENGE POPUP
// ============================================================
function ChallengePopup({ clue, options, selected, onSelect, lastResult, playerId, onSpeak }) {
  const isBlind = parseInt(playerId) === 2;
  return (
    <div className="challenge-popup">
      <div className="challenge-popup-inner pixel-box">
        <div className="challenge-title">⚡ CHALLENGE ⚡</div>
        {clue && (
          <div className="challenge-clue">
            <div className="clue-header-tag">{clue.title || 'YOUR INTEL'}</div>
            <div className="clue-text">{clue.text}</div>
            {clue.hint && <div className="clue-hint-tag">💡 "{clue.hint}"</div>}
            {isBlind && <button className="pixel-btn speak-btn-small" onClick={() => onSpeak(clue)}>🔊 READ</button>}
          </div>
        )}
        {lastResult && (
          <div className={`challenge-result ${lastResult.correct ? 'cr-correct' : 'cr-wrong'}`}>
            {lastResult.correct ? '✅ CORRECT!' : '❌ WRONG!'} {lastResult.points > 0 ? '+' : ''}{lastResult.points} PTS
          </div>
        )}
        {!lastResult && options && (
          <div className="challenge-options-grid">
            {options.map(o => (
              <button key={o.id}
                className={`pixel-btn challenge-opt ${selected === o.id ? 'pixel-btn-selected' : ''}`}
                onClick={() => !selected && onSelect(o.id)} disabled={!!selected}>
                {o.label}
              </button>
            ))}
          </div>
        )}
        {selected && !lastResult && <div className="challenge-waiting">Waiting for team...</div>}
      </div>
    </div>
  );
}

// ============================================================
// CHAT PANEL
// ============================================================
function ChatPanel({ messages, playerId, role, onSend }) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const endRef = useRef(null);
  const isBlind = parseInt(playerId) === 2;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  // Auto-TTS for blind
  useEffect(() => {
    if (isBlind && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.pid !== parseInt(playerId)) speak(`${last.from} says: ${last.text}`);
    }
  }, [messages.length]);

  const send = () => { if (!text.trim()) return; onSend(text.trim()); setText(''); };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR(); rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => { onSend(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="chat-panel pixel-box">
      <div className="chat-header">💬 TEAM CHAT</div>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg ${m.from === 'AI' ? 'chat-ai' : ''}`}>
            <span className="chat-from">{m.from}:</span> {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="chat-input-row">
        {isBlind ? (
          <button className={`pixel-btn chat-mic-btn ${listening ? 'mic-active' : ''}`} onClick={startListening}>
            {listening ? '🔴 LISTENING...' : '🎤 SPEAK'}
          </button>
        ) : (
          <>
            <input className="chat-input" value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type..." maxLength={100} />
            <button className="pixel-btn chat-send-btn" onClick={send}>→</button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// CHARACTER SPRITE using characters.png spritesheet
// ============================================================
function CharSprite({ pid, isMe }) {
  const sp = CHAR_SPRITES[pid];
  if (!sp) return null;
  const size = isMe ? 52 : 40;
  return (
    <div className={`char-sprite ${isMe ? 'char-me' : 'char-other'}`}
      style={{ width: size, height: size, overflow: 'hidden', position: 'relative' }}>
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

// ============================================================
// MAIN PLAYER VIEW
// ============================================================
export default function PlayerView() {
  const { playerId } = useParams();
  const pid = parseInt(playerId);
  const [state, setState] = useState(null);
  const [pos, setPos] = useState(SPAWNS[pid] || { x: 10, y: 9 });
  const [dir, setDir] = useState('down');
  const [others, setOthers] = useState([]);
  const [timer, setTimer] = useState(300);
  const [chatMsgs, setChatMsgs] = useState([]);
  const isBlind = pid === 2;
  const beepRef = useRef(null);

  // Socket
  useEffect(() => {
    socket.emit('join-player', pid);
    socket.on('player-state', (s) => { setState(s); setTimer(s.timer); setOthers(s.otherPlayers || []); });
    socket.on('pos-update', ({ pid: op, x, y, dir: od }) => {
      if (op !== pid) setOthers(prev => prev.map(o => o.id === op ? { ...o, x, y, dir: od } : o));
    });
    socket.on('tick', setTimer);
    socket.on('chat-history', setChatMsgs);
    socket.on('chat-new', (m) => setChatMsgs(prev => [...prev.slice(-50), m]));
    socket.on('game-reset', () => { setState(null); setPos(SPAWNS[pid]); setChatMsgs([]); });
    return () => { socket.off('player-state'); socket.off('pos-update'); socket.off('tick'); socket.off('chat-history'); socket.off('chat-new'); socket.off('game-reset'); };
  }, [pid]);

  // Proximity beep for blind
  useEffect(() => {
    if (!isBlind || !state || state.phase !== 'explore') return;
    const hs = HOTSPOTS[state.round];
    if (!hs) return;
    const d = gridDist(pos.x, pos.y, hs.x, hs.y);
    const interval = d <= 2 ? 300 : d <= 4 ? 700 : d <= 7 ? 1400 : 3000;
    const freq = d <= 2 ? 880 : d <= 4 ? 660 : d <= 7 ? 440 : 220;
    if (beepRef.current) clearInterval(beepRef.current);
    beepRef.current = setInterval(() => beep(freq, 0.08), interval);
    return () => { if (beepRef.current) clearInterval(beepRef.current); };
  }, [pos.x, pos.y, isBlind, state?.phase, state?.round]);

  // Movement
  const move = useCallback((direction) => {
    if (state?.phase !== 'explore') return;
    setPos(prev => {
      let nx = prev.x, ny = prev.y;
      if (direction === 'up') ny--;
      if (direction === 'down') ny++;
      if (direction === 'left') nx--;
      if (direction === 'right') nx++;
      if (isWalkable(nx, ny)) {
        socket.emit('move', { playerId: pid, x: nx, y: ny, dir: direction });
        setDir(direction);
        return { x: nx, y: ny };
      }
      setDir(direction);
      return prev;
    });
  }, [pid, state?.phase]);

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const sendChat = useCallback((t) => socket.emit('chat-send', { playerId: pid, text: t }), [pid]);
  const speakClue = useCallback((c) => speak(`${c.title}. ${c.text}. Hint: ${c.hint}`), []);
  const selectResponse = useCallback((r) => socket.emit('player-response', { playerId: pid, response: r }), [pid]);

  if (!state) return (
    <div className="player-view"><div className="connecting"><span className="connecting-icon">📱</span><p>CONNECTING...</p></div></div>
  );

  // Convert grid position to pixel position on the image
  const pxX = (pos.x + 0.5) * CELL;
  const pxY = (pos.y + 0.5) * CELL;

  // Camera offset — center player in viewport
  const camX = Math.max(0, Math.min(IMG_W - VP_W, pxX - VP_W / 2));
  const camY = Math.max(0, Math.min(IMG_H - VP_H, pxY - VP_H / 2));

  // Fog center position relative to the viewport
  const fogX = pxX - camX;
  const fogY = pxY - camY;

  const isChallenging = state.phase === 'challenge' || state.phase === 'result';

  return (
    <div className="player-view">
      {/* HUD */}
      <div className="game-hud-mobile">
        <span className="hud-role">{state.role?.emoji} {state.role?.name}</span>
        <span className="hud-timer-m">⏱ {String(Math.floor(timer/60)).padStart(2,'0')}:{String(timer%60).padStart(2,'0')}</span>
        <span className="hud-score-m">🏆{state.score}</span>
      </div>

      {/* GAME VIEWPORT — the actual game world */}
      <div className="game-viewport" style={{ width: VP_W, height: VP_H, maxWidth: '100vw', maxHeight: '55vh' }}>
        {/* Map image */}
        <div className="game-map-img" style={{
          width: IMG_W, height: IMG_H,
          transform: `translate(${-camX}px, ${-camY}px)`,
          backgroundImage: 'url(/office-bg.png)',
          backgroundSize: `${IMG_W}px ${IMG_H}px`,
        }}>
          {/* Hotspot indicator */}
          {state.hotspot && (state.phase === 'explore' || isChallenging) && (
            <div className="hotspot-marker" style={{
              left: (HOTSPOTS[state.round]?.x + 0.5) * CELL - 20,
              top: (HOTSPOTS[state.round]?.y + 0.5) * CELL - 20,
            }}>
              <span className="hotspot-emoji">{HOTSPOTS[state.round]?.emoji}</span>
              <div className="hotspot-ring" />
            </div>
          )}

          {/* Other players */}
          {others.filter(o => o.connected).map(o => (
            <div key={o.id} className="map-char" style={{
              left: (o.x + 0.5) * CELL - 20,
              top: (o.y + 0.5) * CELL - 26,
            }}>
              <CharSprite pid={o.id} />
              <span className="map-char-label">{o.name}</span>
            </div>
          ))}

          {/* THIS player */}
          <div className="map-char map-char-me" style={{
            left: pxX - 26,
            top: pxY - 30,
          }}>
            <CharSprite pid={pid} isMe />
            <span className="map-char-label map-char-label-me">YOU</span>
          </div>
        </div>

        {/* FOG OF WAR OVERLAY — dark with circle cutout around player */}
        <div className="fog-overlay" style={{
          '--fog-x': `${fogX}px`,
          '--fog-y': `${fogY}px`,
          '--fog-r': `${FOG_RADIUS}px`,
        }} />
      </div>

      {/* Challenge popup */}
      {isChallenging && (
        <ChallengePopup clue={state.clue} options={state.options}
          selected={state.selectedOption} onSelect={selectResponse}
          lastResult={state.lastResult} playerId={playerId} onSpeak={speakClue} />
      )}

      {/* Lobby / Victory / Gameover overlays */}
      {state.phase === 'lobby' && (
        <div className="overlay-screen">
          <CharSprite pid={pid} isMe />
          <div className="overlay-title">{state.role?.name}</div>
          <div className="overlay-sub">Waiting for game to start...</div>
        </div>
      )}
      {state.phase === 'victory' && (
        <div className="overlay-screen overlay-victory">
          <div className="overlay-text">🎉</div><div className="overlay-title">YOU WON!</div>
          <div className="overlay-sub">Score: {state.score}</div>
        </div>
      )}
      {state.phase === 'gameover' && (
        <div className="overlay-screen overlay-gameover">
          <div className="overlay-text">💀</div><div className="overlay-title">TIME'S UP</div>
        </div>
      )}

      {/* Bottom: D-Pad + Chat */}
      <div className="bottom-area">
        <DPad onMove={move} />
        <ChatPanel messages={chatMsgs} playerId={playerId} role={state.role} onSend={sendChat} />
      </div>

      <div className="access-tag">
        {pid === 1 && '👂 DEAF — All audio shown as text'}
        {pid === 2 && '🔊 BLIND — Beeps guide you. Tap 🎤 to speak.'}
        {pid === 3 && '🤐 MUTE — Type to communicate'}
      </div>
    </div>
  );
}
