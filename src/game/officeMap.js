// ============================================================
// OFFICE MAP — Tile-based 2D office layout
// ============================================================

// Tile types
export const T = {
  FLOOR: 0,
  WALL: 1,
  DESK: 2,
  CHAIR: 3,
  SERVER: 4,
  PLANT: 5,
  DOOR: 6,
  BOARD: 7,
  COFFEE: 8,
  FILING: 9,
};

// Solid (non-walkable) tiles
export const SOLID = new Set([T.WALL, T.DESK, T.SERVER, T.BOARD, T.COFFEE, T.FILING]);

export const MAP_W = 20;
export const MAP_H = 14;

// 0=floor 1=wall 2=desk 3=chair 4=server 5=plant 6=door 7=whiteboard 8=coffee 9=filing
export const MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,2,3,0,0,1,0,0,7,7,0,0,1,0,4,4,0,0,1],
  [1,0,2,3,0,0,6,0,0,0,0,0,0,6,0,4,4,0,0,1],
  [1,0,0,0,0,0,1,0,0,3,3,0,0,1,0,0,0,0,0,1],
  [1,1,1,6,1,1,1,0,5,0,0,5,0,1,1,1,6,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,6,1,1,1,0,0,0,0,0,0,1,1,1,6,1,1,1],
  [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
  [1,0,2,3,0,0,1,0,0,8,0,5,0,1,0,9,9,0,0,1],
  [1,0,2,3,0,0,6,0,0,0,0,0,0,6,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Room labels (for display on host map)
export const ROOMS = [
  { x: 3, y: 0.5, label: 'OFFICE A' },
  { x: 10, y: 0.5, label: 'MEETING ROOM' },
  { x: 17, y: 0.5, label: 'SERVER ROOM' },
  { x: 10, y: 6.5, label: 'CORRIDOR' },
  { x: 3, y: 13.5, label: 'OFFICE B' },
  { x: 10, y: 13.5, label: 'BREAK ROOM' },
  { x: 17, y: 13.5, label: 'FILING ROOM' },
];

// Starting positions (center corridor)
export const SPAWNS = {
  1: { x: 9, y: 7 },
  2: { x: 10, y: 7 },
  3: { x: 11, y: 7 },
};

// Hotspot sequence — where each round's issue is located
export const HOTSPOTS = [
  // Round 1: Fire in Server Room
  { x: 17, y: 3, room: 'Server Room', emoji: '🔥', round: 1 },
  // Round 2: Scam email at Office A desk
  { x: 4, y: 2, room: 'Office A', emoji: '📱', round: 2 },
  // Round 3: AI request at Meeting Room
  { x: 10, y: 3, room: 'Meeting Room', emoji: '🤡', round: 3 },
  // Round 4: Data leak in Break Room
  { x: 10, y: 11, room: 'Break Room', emoji: '🙈', round: 4 },
  // Final: Filing Room
  { x: 17, y: 11, room: 'Filing Room', emoji: '😈', round: 5 },
];

// Tile visual data (for CSS rendering)
export const TILE_EMOJI = {
  [T.DESK]: '🖥️',
  [T.CHAIR]: '',
  [T.SERVER]: '🖲️',
  [T.PLANT]: '🌿',
  [T.BOARD]: '📋',
  [T.COFFEE]: '☕',
  [T.FILING]: '🗄️',
};

// Check if a position is walkable
export function isWalkable(x, y) {
  if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
  return !SOLID.has(MAP[y][x]);
}

// Get distance between two points
export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Get room name for a position
export function getRoomAt(x, y) {
  if (x <= 6 && y <= 5) return 'Office A';
  if (x >= 7 && x <= 13 && y <= 5) return 'Meeting Room';
  if (x >= 14 && y <= 5) return 'Server Room';
  if (y >= 6 && y <= 8) return 'Corridor';
  if (x <= 6 && y >= 9) return 'Office B';
  if (x >= 7 && x <= 13 && y >= 9) return 'Break Room';
  if (x >= 14 && y >= 9) return 'Filing Room';
  return 'Office';
}
