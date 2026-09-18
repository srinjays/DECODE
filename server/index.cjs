// ============================================================
// HACK THE CHAOS — Game Server (2D RPG Mode)
// Players explore office, find hotspots, solve challenges
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const {
  ROLES, ROUND1_CHALLENGES, SCAM_MESSAGES, ROUND3_CHALLENGES,
  ROUND4_CHALLENGES, FINAL_CHALLENGE, AI_DIALOGUE, MEDIA_TRIGGERS,
  COMM_RESTRICTIONS, SCORING, pickRandom, shuffleArray,
} = require('./gameData.cjs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// ============================================================
// HOTSPOT POSITIONS (must match officeMap.js)
// ============================================================
const HOTSPOT_SEQ = [
  { x: 17, y: 3, room: 'Server Room', emoji: '🔥', round: 1 },
  { x: 4, y: 2, room: 'Office A', emoji: '📱', round: 2 },
  { x: 10, y: 3, room: 'Meeting Room', emoji: '🤡', round: 3 },
  { x: 10, y: 11, room: 'Break Room', emoji: '🙈', round: 4 },
  { x: 17, y: 11, room: 'Filing Room', emoji: '😈', round: 5 },
];

// ============================================================
// GAME STATE
// ============================================================
let gs = freshState();

function freshState() {
  return {
    phase: 'lobby',          // lobby | explore | challenge | result | victory | lesson | gameover
    round: 0,                // 0-4 (index into HOTSPOT_SEQ)
    timer: 300,
    timerRunning: false,
    chaosLevel: 0,
    score: 0,
    aiMood: 'confident',
    players: {
      1: { connected: false, sid: null, x: 9, y: 7, response: null, dir: 'down' },
      2: { connected: false, sid: null, x: 10, y: 7, response: null, dir: 'down' },
      3: { connected: false, sid: null, x: 11, y: 7, response: null, dir: 'down' },
    },
    hostSid: null,
    // Current round challenge data
    challenge: null,
    options: null,
    clues: null,
    correctAnswer: null,
    lastResult: null,
    // Round 2 sub-messages
    r2Msgs: [],
    r2Idx: 0,
    // Chat messages
    chat: [],
    // AI notification queue
    aiNotify: [],
    roundStartTime: null,
  };
}

// ============================================================
// ROUND SETUP
// ============================================================
function setupCurrentRound() {
  const r = gs.round;
  clearResponses();
  gs.lastResult = null;
  gs.roundStartTime = Date.now();

  if (r === 0) {
    // Round 1: Office Fire
    const c = pickRandom(ROUND1_CHALLENGES);
    gs.challenge = c;
    gs.options = c.systems;
    gs.clues = c.playerClues;
    gs.correctAnswer = c.correctAnswer;
    gs.aiMood = 'confident';
    gs.aiNotify = ['🔥 FIRE DETECTED in the Server Room!', 'All agents report there NOW!'];
  } else if (r === 1) {
    // Round 2: Scam messages
    const scams = shuffleArray(SCAM_MESSAGES.filter(m => m.isScam));
    const legits = shuffleArray(SCAM_MESSAGES.filter(m => !m.isScam));
    gs.r2Msgs = shuffleArray([scams[0], legits[0], scams.length > 1 ? scams[1] : legits[1] || scams[0]]);
    gs.r2Idx = 0;
    gs.aiMood = 'annoyed';
    gs.aiNotify = ['📱 Suspicious emails on the Office A computer!', 'Go check them out!'];
    loadR2Msg(0);
  } else if (r === 2) {
    // Round 3: AI manipulation
    const c = pickRandom(ROUND3_CHALLENGES);
    gs.challenge = c;
    gs.options = c.requests;
    gs.clues = c.playerClues;
    gs.correctAnswer = c.correctAnswer;
    gs.aiMood = 'manipulative';
    gs.aiNotify = ['🤡 The AI is acting weird in the Meeting Room...', 'Something doesn\'t feel right.'];
  } else if (r === 3) {
    // Round 4: Communication chaos
    const c = pickRandom(ROUND4_CHALLENGES);
    gs.challenge = c;
    gs.options = c.actions;
    gs.clues = c.playerClues;
    gs.correctAnswer = c.correctAnswer;
    gs.aiMood = 'panicking';
    gs.aiNotify = ['🙈 DATA BREACH in the Break Room!', 'HURRY! Communications are scrambled!'];
  } else if (r === 4) {
    // Final round
    gs.challenge = FINAL_CHALLENGE;
    gs.options = FINAL_CHALLENGE.options;
    gs.clues = FINAL_CHALLENGE.playerClues;
    gs.correctAnswer = FINAL_CHALLENGE.correctAnswer;
    gs.aiMood = 'defeated';
    gs.aiNotify = ['😈 The AI is making one LAST move!', 'Filing Room — go NOW!'];
  }
}

function loadR2Msg(idx) {
  const msg = gs.r2Msgs[idx];
  gs.challenge = msg;
  gs.options = [{ id: 'trust', label: '✅ TRUST' }, { id: 'scam', label: '🚨 SCAM' }];
  gs.clues = msg.playerClues;
  gs.correctAnswer = msg.isScam ? 'scam' : 'trust';
  gs.r2Idx = idx;
}

function clearResponses() {
  gs.players[1].response = null;
  gs.players[2].response = null;
  gs.players[3].response = null;
}

// ============================================================
// EVALUATE TEAM DECISION
// ============================================================
function evaluate() {
  const res = [gs.players[1].response, gs.players[2].response, gs.players[3].response];
  if (res.some(r => r === null)) return;

  const allSame = res.every(r => r === res[0]);
  if (!allSame) {
    // Disagreement — reset and try again
    const msg = '⚠️ TEAM DISAGREED! Try again — you must all choose the same!';
    gs.chat.push({ from: 'AI', text: msg, ts: Date.now() });
    io.emit('chat-new', { from: 'AI', text: msg, ts: Date.now() });
    setTimeout(() => { clearResponses(); broadcast(); }, 2000);
    return;
  }

  const answer = res[0];
  const correct = answer === gs.correctAnswer;
  const elapsed = (Date.now() - gs.roundStartTime) / 1000;
  const fast = elapsed <= SCORING.FAST_THRESHOLD;

  let pts = 0;
  if (correct) {
    pts = SCORING.CORRECT + (fast ? SCORING.FAST_BONUS : 0);
    if (gs.round === 3) pts += SCORING.TEAMWORK_BONUS;
    if (gs.round === 4) pts = SCORING.FINAL_SUCCESS + (fast ? SCORING.FAST_BONUS : 0);
  } else {
    pts = gs.round === 4 ? SCORING.WRONG * 2 : SCORING.WRONG;
  }

  gs.score += pts;
  gs.chaosLevel = Math.max(0, Math.min(100, gs.chaosLevel + (correct ? -10 : 20)));

  gs.lastResult = { correct, teamAnswer: answer, correctAnswer: gs.correctAnswer, points: pts, isFast: fast };
  gs.phase = 'result';

  const resultMsg = correct
    ? `✅ CORRECT! ${fast ? '⚡ Speed bonus!' : ''} +${pts} pts`
    : `❌ WRONG! The answer was ${gs.correctAnswer.toUpperCase()}. ${pts} pts`;
  gs.chat.push({ from: 'AI', text: resultMsg, ts: Date.now() });
  io.emit('chat-new', { from: 'AI', text: resultMsg, ts: Date.now() });

  broadcast();

  // After showing result, advance
  setTimeout(() => {
    // Round 2 has sub-messages
    if (gs.round === 1 && gs.r2Idx < gs.r2Msgs.length - 1) {
      loadR2Msg(gs.r2Idx + 1);
      clearResponses();
      gs.phase = 'challenge';
      gs.lastResult = null;
      gs.roundStartTime = Date.now();
      broadcast();
      return;
    }

    // Advance to next round
    if (gs.round < 4) {
      gs.round++;
      gs.phase = 'explore';
      gs.lastResult = null;
      gs.challenge = null;
      clearResponses();
      setupCurrentRound(); // prepares challenge data but doesn't activate yet
      // Notify about new hotspot
      const hs = HOTSPOT_SEQ[gs.round];
      const notify = `📍 New issue detected in ${hs.room}! Head there now!`;
      gs.chat.push({ from: 'AI', text: notify, ts: Date.now() });
      io.emit('chat-new', { from: 'AI', text: notify, ts: Date.now() });
      broadcast();
    } else {
      // Game complete!
      gs.phase = 'victory';
      gs.timerRunning = false;
      const victoryMsg = '🎉 COMPANY SAVED! The AI has been defeated!';
      gs.chat.push({ from: 'AI', text: victoryMsg, ts: Date.now() });
      io.emit('chat-new', { from: 'AI', text: victoryMsg, ts: Date.now() });
      broadcast();
    }
  }, 4000);
}

// ============================================================
// PROXIMITY CHECK — has any player reached the hotspot?
// ============================================================
function checkHotspot(pid) {
  if (gs.phase !== 'explore') return;
  const hs = HOTSPOT_SEQ[gs.round];
  const p = gs.players[pid];
  const d = Math.sqrt((p.x - hs.x) ** 2 + (p.y - hs.y) ** 2);
  if (d <= 1.5) {
    // Player reached the hotspot — activate challenge for ALL
    gs.phase = 'challenge';
    const msg = `🎯 Player ${pid} reached ${hs.room}! Challenge activated!`;
    gs.chat.push({ from: 'AI', text: msg, ts: Date.now() });
    io.emit('chat-new', { from: 'AI', text: msg, ts: Date.now() });
    broadcast();
  }
}

// ============================================================
// TIMER
// ============================================================
let timerInt = null;

function startTimer() {
  if (timerInt) clearInterval(timerInt);
  gs.timerRunning = true;
  timerInt = setInterval(() => {
    if (!gs.timerRunning) return;
    gs.timer--;
    io.emit('tick', gs.timer);
    if (gs.timer <= 0) {
      gs.timerRunning = false;
      clearInterval(timerInt);
      gs.phase = 'gameover';
      const msg = '💀 TIME\'S UP! The company has been hacked!';
      gs.chat.push({ from: 'AI', text: msg, ts: Date.now() });
      io.emit('chat-new', { from: 'AI', text: msg, ts: Date.now() });
      broadcast();
    }
    if (gs.timer === 60 || gs.timer === 30) {
      const pressureMsg = gs.timer === 60 ? '⏰ ONE MINUTE LEFT!' : '⏰ 30 SECONDS! HURRY!';
      gs.chat.push({ from: 'AI', text: pressureMsg, ts: Date.now() });
      io.emit('chat-new', { from: 'AI', text: pressureMsg, ts: Date.now() });
    }
  }, 1000);
}

// ============================================================
// BROADCAST STATE
// ============================================================
function broadcast() {
  const hs = HOTSPOT_SEQ[gs.round];

  // Host gets everything
  const hostState = {
    phase: gs.phase, round: gs.round, timer: gs.timer,
    chaosLevel: gs.chaosLevel, score: gs.score, aiMood: gs.aiMood,
    players: {
      1: { ...gs.players[1], ...ROLES[1] },
      2: { ...gs.players[2], ...ROLES[2] },
      3: { ...gs.players[3], ...ROLES[3] },
    },
    hotspot: hs,
    challenge: gs.phase === 'challenge' || gs.phase === 'result' ? {
      text: gs.challenge?.text || gs.challenge?.scenario || '',
      alerts: gs.challenge?.alerts || [],
      aiManipulation: gs.challenge?.aiManipulation || [],
    } : null,
    options: gs.phase === 'challenge' || gs.phase === 'result' ? gs.options : null,
    correctAnswer: gs.phase === 'result' ? gs.correctAnswer : null,
    lastResult: gs.lastResult,
    aiNotify: gs.aiNotify,
    r2Progress: gs.round === 1 ? { current: gs.r2Idx + 1, total: gs.r2Msgs.length } : null,
    commRestrictions: gs.round === 3 ? COMM_RESTRICTIONS : null,
  };
  io.emit('host-state', hostState);

  // Each player gets their own view
  for (const pid of [1, 2, 3]) {
    const p = gs.players[pid];
    if (!p.connected || !p.sid) continue;

    const ps = {
      phase: gs.phase, round: gs.round, timer: gs.timer,
      playerId: pid, role: ROLES[pid],
      pos: { x: p.x, y: p.y, dir: p.dir },
      otherPlayers: [1, 2, 3].filter(id => id !== pid).map(id => ({
        id, x: gs.players[id].x, y: gs.players[id].y, dir: gs.players[id].dir,
        emoji: ROLES[id].emoji, name: ROLES[id].name, connected: gs.players[id].connected,
      })),
      hotspot: hs,
      clue: gs.phase === 'challenge' ? (gs.clues ? gs.clues[pid] : null) : null,
      options: gs.phase === 'challenge' || gs.phase === 'result' ? gs.options : null,
      selectedOption: p.response,
      lastResult: gs.lastResult,
      chaosLevel: gs.chaosLevel, score: gs.score,
      commRestriction: gs.round === 3 ? COMM_RESTRICTIONS[pid] : null,
      aiNotify: gs.aiNotify,
    };
    io.to(p.sid).emit('player-state', ps);
  }
}

// ============================================================
// SOCKET HANDLERS
// ============================================================
io.on('connection', (socket) => {
  console.log(`+ ${socket.id}`);

  socket.on('join-host', () => {
    gs.hostSid = socket.id;
    broadcast();
  });

  socket.on('join-player', (pid) => {
    pid = parseInt(pid);
    if (pid >= 1 && pid <= 3) {
      gs.players[pid].connected = true;
      gs.players[pid].sid = socket.id;
      console.log(`P${pid} joined`);
      // Send chat history
      socket.emit('chat-history', gs.chat.slice(-20));
      broadcast();
    }
  });

  socket.on('start-game', () => {
    gs.phase = 'explore';
    gs.round = 0;
    startTimer();
    setupCurrentRound();
    const hs = HOTSPOT_SEQ[0];
    const startMsg = `🤖 SYSTEM BREACH! Head to ${hs.room} immediately!`;
    gs.chat.push({ from: 'AI', text: startMsg, ts: Date.now() });
    io.emit('chat-new', { from: 'AI', text: startMsg, ts: Date.now() });
    broadcast();
    console.log('Game started!');
  });

  // Player movement
  socket.on('move', ({ playerId, x, y, dir }) => {
    const pid = parseInt(playerId);
    if (pid >= 1 && pid <= 3) {
      gs.players[pid].x = x;
      gs.players[pid].y = y;
      gs.players[pid].dir = dir || 'down';
      // Broadcast position to all
      io.emit('pos-update', { pid, x, y, dir });
      // Check if player reached hotspot
      checkHotspot(pid);
    }
  });

  // Player response (during challenge)
  socket.on('player-response', ({ playerId, response }) => {
    const pid = parseInt(playerId);
    if (pid >= 1 && pid <= 3 && gs.phase === 'challenge') {
      gs.players[pid].response = response;
      console.log(`P${pid}: ${response}`);
      broadcast();
      evaluate();
    }
  });

  // Chat message
  socket.on('chat-send', ({ playerId, text }) => {
    const pid = parseInt(playerId);
    const role = ROLES[pid];
    const msg = { from: `P${pid} ${role?.emoji || ''}`, text, ts: Date.now(), pid };
    gs.chat.push(msg);
    io.emit('chat-new', msg);
    console.log(`Chat P${pid}: ${text}`);
  });

  // Reset
  socket.on('reset-game', () => {
    if (timerInt) clearInterval(timerInt);
    gs = freshState();
    io.emit('game-reset');
    console.log('Reset');
  });

  socket.on('disconnect', () => {
    console.log(`- ${socket.id}`);
    if (gs.hostSid === socket.id) gs.hostSid = null;
    for (const pid of [1, 2, 3]) {
      if (gs.players[pid].sid === socket.id) {
        gs.players[pid].connected = false;
        gs.players[pid].sid = null;
      }
    }
    broadcast();
  });
});

// ============================================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🤖 HACK THE CHAOS — RPG Server on :${PORT}\n`);
});
