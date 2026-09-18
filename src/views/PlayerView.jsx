import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../socket';
import { MAP, MAP_W, MAP_H, T, SOLID, TILE_EMOJI, isWalkable, dist, getRoomAt, SPAWNS } from '../game/officeMap';

const TILE = 40; // px per tile
const VIEW_W = 11; // visible tiles X
const VIEW_H = 9;  // visible tiles Y

// ============================================================
// WEB AUDIO — Proximity beep for blind player
// ============================================================
let audioCtx = null;
function beep(freq, duration) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  gain.gain.value = 0.15;
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// TTS
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

// ============================================================
// TILE MAP (memoized — never re-renders)
// ============================================================
const TileGrid = ({ fogCenter, isFog }) => {
  return useMemo(() => (
    <div className="tile-grid">
      {MAP.map((row, y) => row.map((tile, x) => {
        let vis = 1;
        if (isFog) {
          const d = dist(x, y, fogCenter.x, fogCenter.y);
          vis = d <= 2 ? 1 : d <= 3.5 ? 0.3 : 0;
        }
        return (
          <div key={`${x}-${y}`} className={`tile t-${tile}`}
            style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE, opacity: vis }}>
            {TILE_EMOJI[tile] && <span className="tile-icon">{TILE_EMOJI[tile]}</span>}
          </div>
        );
      }))}
    </div>
  ), [fogCenter?.x, fogCenter?.y, isFog]);
};

// ============================================================
// PLAYER SPRITE
// ============================================================
function Sprite({ x, y, emoji, label, isMe, dir }) {
  return (
    <div className={`sprite ${isMe ? 'sprite-me' : 'sprite-other'} dir-${dir || 'down'}`}
      style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}>
      <span className="sprite-char">{emoji}</span>
      {label && <span className="sprite-label">{label}</span>}
    </div>
  );
}

// ============================================================
// HOTSPOT MARKER
// ============================================================
function Hotspot({ x, y, emoji }) {
  return (
    <div className="hotspot-marker" style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}>
      <span className="hotspot-emoji">{emoji}</span>
      <div className="hotspot-ring" />
    </div>
  );
}

// ============================================================
// D-PAD (mobile controls)
// ============================================================
function DPad({ onMove }) {
  const hold = useRef(null);
  const start = (dir) => {
    onMove(dir);
    hold.current = setInterval(() => onMove(dir), 180);
  };
  const stop = () => { if (hold.current) { clearInterval(hold.current); hold.current = null; } };

  return (
    <div className="dpad">
      <button className="dpad-btn dpad-up" onPointerDown={() => start('up')} onPointerUp={stop} onPointerLeave={stop}>▲</button>
      <div className="dpad-mid">
        <button className="dpad-btn dpad-left" onPointerDown={() => start('left')} onPointerUp={stop} onPointerLeave={stop}>◀</button>
        <div className="dpad-center" />
        <button className="dpad-btn dpad-right" onPointerDown={() => start('right')} onPointerUp={stop} onPointerLeave={stop}>▶</button>
      </div>
      <button className="dpad-btn dpad-down" onPointerDown={() => start('down')} onPointerUp={stop} onPointerLeave={stop}>▼</button>
    </div>
  );
}

// ============================================================
// CHALLENGE POPUP
// ============================================================
function ChallengePopup({ clue, options, selected, onSelect, lastResult, playerId, onSpeak }) {
  return (
    <div className="challenge-popup">
      <div className="challenge-popup-inner pixel-box">
        <div className="challenge-title">⚡ CHALLENGE ⚡</div>

        {/* Clue */}
        {clue && (
          <div className="challenge-clue">
            <div className="clue-header-tag">{clue.title || 'YOUR INTEL'}</div>
            <div className="clue-text">{clue.text}</div>
            {clue.hint && <div className="clue-hint-tag">💡 "{clue.hint}"</div>}
            {parseInt(playerId) === 2 && (
              <button className="pixel-btn speak-btn-small" onClick={() => onSpeak(clue)}>🔊 READ</button>
            )}
          </div>
        )}

        {/* Result */}
        {lastResult && (
          <div className={`challenge-result ${lastResult.correct ? 'cr-correct' : 'cr-wrong'}`}>
            {lastResult.correct ? '✅ CORRECT!' : '❌ WRONG!'} {lastResult.points > 0 ? '+' : ''}{lastResult.points} PTS
          </div>
        )}

        {/* Options */}
        {!lastResult && options && (
          <div className="challenge-options-grid">
            {options.map(o => (
              <button key={o.id}
                className={`pixel-btn challenge-opt ${selected === o.id ? 'pixel-btn-selected' : ''}`}
                onClick={() => !selected && onSelect(o.id)}
                disabled={!!selected}>
                {o.label}
              </button>
            ))}
          </div>
        )}
        {selected && !lastResult && (
          <div className="challenge-waiting">Waiting for team...</div>
        )}
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
  const isMute = role?.accessibility === 'mute';
  const isBlind = parseInt(playerId) === 2;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Auto-TTS for blind player
  useEffect(() => {
    if (isBlind && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last.from !== `P${playerId} ${role?.emoji || ''}`) {
        speak(`${last.from} says: ${last.text}`);
      }
    }
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  // Speech-to-text for blind player
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech not supported'); return; }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      onSend(t);
      setListening(false);
    };
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
        {/* Blind player: mic button. Others: text input */}
        {isBlind ? (
          <button className={`pixel-btn chat-mic-btn ${listening ? 'mic-active' : ''}`} onClick={startListening}>
            {listening ? '🔴 LISTENING...' : '🎤 SPEAK'}
          </button>
        ) : (
          <>
            <input
              className="chat-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={isMute ? 'Type to communicate...' : 'Type message...'}
              maxLength={100}
            />
            <button className="pixel-btn chat-send-btn" onClick={send}>→</button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ROOM INDICATOR
// ============================================================
function RoomIndicator({ x, y }) {
  const room = getRoomAt(x, y);
  return <div className="room-indicator">📍 {room}</div>;
}

// ============================================================
// PLAYER VIEW — MAIN
// ============================================================
export default function PlayerView() {
  const { playerId } = useParams();
  const pid = parseInt(playerId);
  const [state, setState] = useState(null);
  const [pos, setPos] = useState(SPAWNS[pid] || { x: 10, y: 7 });
  const [dir, setDir] = useState('down');
  const [others, setOthers] = useState([]);
  const [timer, setTimer] = useState(300);
  const [chatMsgs, setChatMsgs] = useState([]);
  const isBlind = pid === 2;
  const beepRef = useRef(null);

  // Connect
  useEffect(() => {
    socket.emit('join-player', pid);

    socket.on('player-state', (s) => {
      setState(s);
      setTimer(s.timer);
      setOthers(s.otherPlayers || []);
    });

    socket.on('pos-update', ({ pid: oPid, x, y, dir: oDir }) => {
      if (oPid !== pid) {
        setOthers(prev => prev.map(o => o.id === oPid ? { ...o, x, y, dir: oDir } : o));
      }
    });

    socket.on('tick', setTimer);
    socket.on('chat-history', (msgs) => setChatMsgs(msgs));
    socket.on('chat-new', (msg) => setChatMsgs(prev => [...prev.slice(-50), msg]));
    socket.on('game-reset', () => {
      setState(null);
      setPos(SPAWNS[pid] || { x: 10, y: 7 });
      setChatMsgs([]);
    });

    return () => {
      socket.off('player-state'); socket.off('pos-update');
      socket.off('tick'); socket.off('chat-history');
      socket.off('chat-new'); socket.off('game-reset');
    };
  }, [pid]);

  // Proximity beep for blind player
  useEffect(() => {
    if (!isBlind || !state || state.phase !== 'explore') return;
    const hs = state.hotspot;
    if (!hs) return;

    const d = dist(pos.x, pos.y, hs.x, hs.y);
    const interval = d <= 2 ? 300 : d <= 5 ? 800 : d <= 8 ? 1500 : 3000;
    const freq = d <= 2 ? 880 : d <= 5 ? 660 : d <= 8 ? 440 : 220;

    if (beepRef.current) clearInterval(beepRef.current);
    beepRef.current = setInterval(() => beep(freq, 0.1), interval);

    // Speak room name when entering new room
    return () => { if (beepRef.current) clearInterval(beepRef.current); };
  }, [pos.x, pos.y, isBlind, state?.phase, state?.hotspot]);

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

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                     w: 'up', s: 'down', a: 'left', d: 'right' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  // Chat send
  const sendChat = useCallback((text) => {
    socket.emit('chat-send', { playerId: pid, text });
  }, [pid]);

  // Speak clue
  const speakClue = useCallback((clue) => {
    speak(`${clue.title}. ${clue.text}. Hint: ${clue.hint}`);
  }, []);

  // Select response
  const selectResponse = useCallback((r) => {
    socket.emit('player-response', { playerId: pid, response: r });
  }, [pid]);

  if (!state) return (
    <div className="player-view"><div className="connecting"><span className="connecting-icon">📱</span><p>CONNECTING...</p></div></div>
  );

  // Camera
  const camX = Math.max(0, Math.min(MAP_W - VIEW_W, pos.x - Math.floor(VIEW_W / 2)));
  const camY = Math.max(0, Math.min(MAP_H - VIEW_H, pos.y - Math.floor(VIEW_H / 2)));

  const isExploring = state.phase === 'explore';
  const isChallenging = state.phase === 'challenge' || state.phase === 'result';

  return (
    <div className="player-view">
      {/* HUD */}
      <div className="game-hud-mobile">
        <span className="hud-role">{state.role?.emoji} {state.role?.name}</span>
        <RoomIndicator x={pos.x} y={pos.y} />
        <span className="hud-timer-m">
          ⏱ {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
        </span>
        <span className="hud-score-m">🏆{state.score}</span>
      </div>

      {/* GAME VIEWPORT */}
      <div className="game-viewport" style={{ width: VIEW_W * TILE, height: VIEW_H * TILE }}>
        <div className="game-map" style={{
          width: MAP_W * TILE, height: MAP_H * TILE,
          transform: `translate(${-camX * TILE}px, ${-camY * TILE}px)`,
        }}>
          <TileGrid fogCenter={pos} isFog={isBlind} />

          {/* Hotspot */}
          {state.hotspot && (isExploring || isChallenging) && (
            <Hotspot x={state.hotspot.x} y={state.hotspot.y} emoji={state.hotspot.emoji} />
          )}

          {/* Other players */}
          {others.filter(o => o.connected).map(o => (
            <Sprite key={o.id} x={o.x} y={o.y} emoji={o.emoji} label={o.name} dir={o.dir} />
          ))}

          {/* This player */}
          <Sprite x={pos.x} y={pos.y} emoji={state.role?.emoji} isMe dir={dir} />
        </div>
      </div>

      {/* Challenge popup overlay */}
      {isChallenging && (
        <ChallengePopup
          clue={state.clue} options={state.options}
          selected={state.selectedOption} onSelect={selectResponse}
          lastResult={state.lastResult} playerId={playerId}
          onSpeak={speakClue}
        />
      )}

      {/* Lobby / Victory / Gameover */}
      {state.phase === 'lobby' && (
        <div className="overlay-screen">
          <div className="overlay-text">{state.role?.emoji}</div>
          <div className="overlay-title">{state.role?.name}</div>
          <div className="overlay-sub">Waiting for game...</div>
        </div>
      )}
      {state.phase === 'victory' && (
        <div className="overlay-screen overlay-victory">
          <div className="overlay-text">🎉</div>
          <div className="overlay-title">YOU WON!</div>
          <div className="overlay-sub">Score: {state.score}</div>
        </div>
      )}
      {state.phase === 'gameover' && (
        <div className="overlay-screen overlay-gameover">
          <div className="overlay-text">💀</div>
          <div className="overlay-title">TIME'S UP</div>
        </div>
      )}

      {/* D-pad + Chat — bottom area */}
      <div className="bottom-area">
        <DPad onMove={move} />
        <ChatPanel messages={chatMsgs} playerId={playerId} role={state.role} onSend={sendChat} />
      </div>

      {/* Accessibility */}
      <div className="access-tag">
        {pid === 1 && '👂 DEAF — All audio shown as text'}
        {pid === 2 && '🔊 BLIND — Beeps guide you. Tap 🎤 to speak.'}
        {pid === 3 && '🤐 MUTE — Type to communicate'}
      </div>
    </div>
  );
}
