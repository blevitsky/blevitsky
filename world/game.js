/* Ben's Studio — a walkable portfolio.
 *
 * Drop this folder into your site (e.g. /world/) and link to world/index.html.
 * It is dependency-free: one canvas, plain DOM for content, no build step.
 *
 * Starting values to tune by playtest (Numbers Policy: these are guesses, not standards):
 *   SPEED 90 px/s      test: crossing the room takes 6-9 s. Too slow -> raise 15%.
 *   REACH 24 px        test: can a new player line up with an object 9/10 tries? If not, +4.
 *   DOG_SPEED 72 px/s  test: dogs keep up without teleporting. If they lag, +10.
 *   Idle-to-nap 14 s   test: dogs nap only when you really stopped. Adjust +/-4 s.
 */
(() => {
'use strict';

/* ------------------------------------------------------------------ config */
const CFG = {
  SITE: '../',                       // where the main portfolio lives, relative to this folder
  RESUME: 'images/Ben-Levitsky-Resume.pdf',
  EMAIL: 'bglevitsky@icloud.com',
  LINKEDIN: 'https://www.linkedin.com/in/benjamin-levitsky-3704362a4/',
  INSTAGRAM: 'https://www.instagram.com/ben.levitsky/',
};
const site = p => CFG.SITE + p;

/* ------------------------------------------------------------------ helpers */
const $ = s => document.querySelector(s);
const canvas = $('#c');
const ctx = canvas.getContext('2d', { alpha: false });
let g = ctx;                                   // current drawing target (main or static layer)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w, h); };
function disc(cx, cy, r, c) { g.fillStyle = c; for (let dy = -r; dy <= r; dy++) { const dx = Math.floor(Math.sqrt(r * r - dy * dy + .25)); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } }
function ell(cx, cy, rx, ry, c) { g.fillStyle = c; for (let dy = -ry; dy <= ry; dy++) { const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + .0001)))); g.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1); } }
const rectDist = (px, py, r) => Math.hypot(Math.max(r.x - px, 0, px - (r.x + r.w)), Math.max(r.y - py, 0, py - (r.y + r.h)));
const isTouch = matchMedia('(pointer: coarse)').matches;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (isTouch) document.body.classList.add('touch');

/* ------------------------------------------------------------------ world (room-based) */
const SPEED = 90, DOG_SPEED = 72, REACH = 24;
const FEET = { hw: 5, h: 5 };
let W, H, B, SOLIDS, OBJ, DECOR, staticLayer, sctx, staticImg;
let CELL = 8, GW, GH, grid;
let ROOM = 'main';

function feetBlocked(x, y, hw = FEET.hw, h = FEET.h) {
  if (x < B.minX || x > B.maxX || y < B.minY || y > B.maxY) return true;
  const rx = x - hw, ry = y - h, rw = hw * 2;
  for (let i = 0; i < SOLIDS.length; i++) { const s = SOLIDS[i]; if (rx < s.x + s.w && rx + rw > s.x && ry < s.y + s.h && ry + h > s.y) return true; }
  return false;
}
function buildGrid() {
  GW = Math.ceil(W / CELL); GH = Math.ceil(H / CELL);
  grid = new Uint8Array(GW * GH);
  for (let cy = 0; cy < GH; cy++) for (let cx = 0; cx < GW; cx++) grid[cy * GW + cx] = feetBlocked(cx * CELL + CELL / 2, cy * CELL + CELL / 2, 7, 7) ? 1 : 0;
}

/* ------------------------------------------------------------------ pathfinding (grid A*) */
function nearestFree(x, y) {
  const cx0 = clamp(Math.floor(x / CELL), 0, GW - 1), cy0 = clamp(Math.floor(y / CELL), 0, GH - 1);
  if (!grid[cy0 * GW + cx0]) return [cx0, cy0];
  for (let r = 1; r < 12; r++) {
    let best = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const cx = cx0 + dx, cy = cy0 + dy;
      if (cx < 0 || cy < 0 || cx >= GW || cy >= GH || grid[cy * GW + cx]) continue;
      const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = [cx, cy]; }
    }
    if (best) return best;
  }
  return null;
}
function lineClear(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 3));
  for (let i = 0; i <= n; i++) { const t = i / n; if (feetBlocked(ax + (bx - ax) * t, ay + (by - ay) * t, 6, 6)) return false; }
  return true;
}
function findPath(sx, sy, gx, gy) {
  const s = nearestFree(sx, sy), e = nearestFree(gx, gy);
  if (!s || !e) return null;
  const start = s[1] * GW + s[0], goal = e[1] * GW + e[0];
  const gs = new Float32Array(GW * GH).fill(1e9), from = new Int32Array(GW * GH).fill(-1), closed = new Uint8Array(GW * GH);
  const open = [[0, start]]; gs[start] = 0;
  const push = it => { open.push(it); let i = open.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (open[p][0] <= open[i][0]) break; [open[p], open[i]] = [open[i], open[p]]; i = p; } };
  const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let i = 0; for (;;) { let l = i * 2 + 1, r = l + 1, m = i; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === i) break; [open[m], open[i]] = [open[i], open[m]]; i = m; } } return top; };
  const hx = i => { const ax = (i % GW) - e[0], ay = ((i / GW) | 0) - e[1]; const dx = Math.abs(ax), dy = Math.abs(ay); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
  let found = false;
  while (open.length) {
    const [, cur] = pop();
    if (closed[cur]) continue; closed[cur] = 1;
    if (cur === goal) { found = true; break; }
    const cx = cur % GW, cy = (cur / GW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const ni = ny * GW + nx; if (grid[ni] || closed[ni]) continue;
      if (dx && dy && (grid[cy * GW + nx] || grid[ny * GW + cx])) continue;   // no corner cutting
      const ng = gs[cur] + (dx && dy ? 1.414 : 1);
      if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; push([ng + hx(ni), ni]); }
    }
  }
  if (!found) return null;
  let pts = [], c = goal; while (c !== -1) { pts.push([(c % GW) * CELL + CELL / 2, ((c / GW) | 0) * CELL + CELL / 2]); c = from[c]; }
  pts.reverse();
  pts[0] = [sx, sy]; pts.push([gx, gy]);
  // string-pulling: skip waypoints we can see past
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !lineClear(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--; out.push(pts[j]); i = j; }
  out.shift();
  return out;
}

/* ------------------------------------------------------------------ room definitions */
const T = () => S.t;
const ROOMS = {
  main: {
    W: 640, H: 448,
    B: { minX: 22, maxX: 618, minY: 66, maxY: 432 },
    // Solid furniture (absolute world rects). Wall furniture is solid from the wall down so nobody can slip behind it.
    SOLIDS: [
      { x: 44,  y: 56,  w: 120, h: 42 },   // desk
      { x: 212, y: 56,  w: 60,  h: 16 },   // console table (about)
      { x: 298, y: 56,  w: 76,  h: 36 },   // tv
      { x: 292, y: 140, w: 88,  h: 28 },   // couch
      { x: 488, y: 56,  w: 128, h: 38 },   // record player + speakers
      { x: 18,  y: 148, w: 30,  h: 32 },   // filing cabinet
      { x: 22,  y: 318, w: 70,  h: 34 },   // printer table
      { x: 490, y: 412, w: 16,  h: 12 },   // mailbox post
      { x: 30,  y: 416, w: 18,  h: 14 },   // plant (bottom left)
      { x: 598, y: 410, w: 10,  h: 8  },   // floor lamp base
    ],
    OBJ: [
      { id: 'work',      label: 'Work',      x: 44,  y: 42,  w: 120, h: 56, sortY: 98,  draw: drawDesk, labelBelow: true },
      { id: 'about',     label: 'About',     x: 212, y: 10,  w: 60,  h: 62, sortY: 72,  draw: drawAbout, labelBelow: true },
      { id: 'movies',    label: 'Movies',    x: 298, y: 40,  w: 76,  h: 52, sortY: 92,  draw: drawTV, labelBelow: true },
      { id: 'music',     label: 'Music',     x: 488, y: 40,  w: 128, h: 54, sortY: 94,  draw: drawMusic, labelBelow: true },
      { id: 'resume',    label: 'Résumé',    x: 18,  y: 128, w: 30,  h: 52, sortY: 180, draw: drawCabinet },
      { id: 'mistmates', label: 'MistMates', x: 22,  y: 300, w: 70,  h: 52, sortY: 352, draw: drawPrinter },
      { id: 'dogs',      label: 'Dogs',      x: 540, y: 284, w: 76,  h: 44, sortY: 298, draw: drawBed },
      { id: 'contact',   label: 'Contact',   x: 486, y: 384, w: 24,  h: 40, sortY: 424, draw: drawMailbox },
      { id: 'drumdoor',  label: 'Drum Studio', x: 18, y: 214, w: 26, h: 44, sortY: 258, draw: drawDrumDoor, toRoom: 'drums', enterAt: [70, 250] },
      { id: 'door',      label: 'Exit to portfolio', x: 294, y: 414, w: 52, h: 34, sortY: -1, draw: null, door: true },
    ],
    DECOR: [
      { x: 292, y: 134, w: 88, h: 34, sortY: 168, draw: drawCouch },
      { x: 28,  y: 392, w: 22, h: 40, sortY: 432, draw: o => drawPlant(o, 1) },
      { x: 596, y: 372, w: 14, h: 44, sortY: 418, draw: drawLamp },
    ],
    build: buildMainStatic,
    dogs: true,
  },
  drums: {
    W: 640, H: 448,
    B: { minX: 22, maxX: 618, minY: 66, maxY: 432 },
    SOLIDS: [
      { x: 250, y: 268, w: 140, h: 40 },   // drum riser (kit sits on it, visually — collision keeps you at a playing distance)
      { x: 40,  y: 56,  w: 110, h: 40 },   // mixing desk
      { x: 494, y: 76,  w: 66,  h: 26 },   // boombox base only — panel behind it is decorative, not solid
      { x: 560, y: 300, w: 30,  h: 60 },   // amp stack
      { x: 60,  y: 340, w: 40,  h: 60 },   // amp stack 2
    ],
    OBJ: [
      { id: 'drumkit', label: 'Play the drums', x: 250, y: 236, w: 140, h: 74, sortY: 330, draw: drawDrumKit, labelBelow: false, drumZone: true },
      { id: 'boombox', label: 'On Repeat', x: 486, y: 40,  w: 96,  h: 60, sortY: 96, draw: drawBoombox, labelBelow: true, panelId: 'music' },
      { id: 'backdoor', label: 'Back to the studio', x: 18, y: 214, w: 26, h: 44, sortY: 258, draw: drawDrumDoor, toRoom: 'main', enterAt: [90, 250] },
    ],
    DECOR: [
      { x: 20,  y: 60,  w: 14, h: 44, sortY: 100, draw: drawLamp },
    ],
    build: buildDrumStatic,
    dogs: false,
  },
};
function loadRoom(id) {
  const r = ROOMS[id];
  ROOM = id; W = r.W; H = r.H; B = r.B; SOLIDS = r.SOLIDS; OBJ = r.OBJ; DECOR = r.DECOR;
  buildGrid();
  if (!r._img) {
    staticLayer = document.createElement('canvas'); staticLayer.width = W; staticLayer.height = H;
    sctx = staticLayer.getContext('2d');
    r._layer = staticLayer; r._sctx = sctx;
    r.build();
  } else { staticLayer = r._layer; sctx = r._sctx; }
  staticImg = r._img || null;
}
const OBJ_BY_ID = Object.fromEntries(Object.values(ROOMS).flatMap(r => r.OBJ).map(o => [o.id, o]));
Object.entries(ROOMS).forEach(([rid, r]) => r.OBJ.forEach(o => o._room = rid));
const ALL_OBJ = Object.values(ROOMS).flatMap(r => r.OBJ);
const COUNTABLE = ROOMS.main.OBJ.filter(o => !o.door && !o.toRoom);

/* ------------------------------------------------------------------ art: static layer */
const portrait = document.createElement('canvas'); portrait.width = 32; portrait.height = 28;
let portraitReady = false, portraitImg = null;
{ const im = new Image(); im.onload = () => { const p = portrait.getContext('2d'); p.imageSmoothingQuality = 'high'; p.drawImage(im, 0, 0, im.width, im.width * 28 / 32, 0, 0, 32, 28);
    const baked = new Image(); baked.onload = () => { portraitImg = baked; portraitReady = true; }; baked.src = portrait.toDataURL('image/png'); }; im.src = 'assets/ben.jpg'; }

function buildMainStatic() {
  g = sctx;
  // floor: planks
  const FL = ['#c8925f', '#c08a58', '#cf9b68', '#bb8552'];
  for (let y = 58, row = 0; y < H; y += 16, row++) {
    const off = (row % 2) * 24;
    for (let x = -off; x < W; x += 48) {
      const h = Math.abs((x * 73856093) ^ (y * 19349663)) % 4;
      R(x, y, 48, 16, FL[h]); R(x, y, 1, 16, '#a67447'); R(x, y + 15, 48, 1, '#a67447');
      R(x + 5 + (h * 7) % 20, y + 6, 6, 1, 'rgba(120,70,30,.18)');
    }
  }
  // rugs
  ell(320, 262, 150, 62, '#0b6b55'); ell(320, 262, 144, 56, '#0FA37F'); ell(320, 262, 130, 44, '#eadfcb'); ell(320, 262, 124, 39, '#0d8a6c');
  for (let i = -5; i <= 5; i++) { R(320 + i * 20 - 2, 259, 4, 4, '#eadfcb'); if (i % 2 === 0) { R(320 + i * 20 - 1, 250, 2, 2, '#f2b544'); R(320 + i * 20 - 1, 274, 2, 2, '#f2b544'); } }
  R(290, 98, 92, 34, '#7d3a2c'); R(292, 100, 88, 30, '#b45a45'); R(298, 106, 76, 18, '#c96b52');
  for (let x = 292; x < 380; x += 6) { R(x, 100, 3, 1, '#eadfcb'); R(x, 129, 3, 1, '#eadfcb'); }
  // doormat
  R(288, 398, 64, 14, '#4a3a2c'); R(290, 400, 60, 10, '#6b5642'); for (let x = 292; x < 348; x += 4) R(x, 402, 2, 6, '#8a7458');
  // walls
  R(0, 0, W, 52, '#e9dfcf'); R(0, 0, W, 6, '#dccfb9'); R(0, 34, W, 18, '#e2d6c2'); R(0, 34, W, 1, '#cbbda4');
  R(0, 52, W, 6, '#c9b591'); R(0, 52, W, 1, '#b39f78');
  R(0, 0, 12, H, '#d2c4ab'); R(12, 0, 2, H, '#bfae8f'); R(W - 12, 0, 12, H, '#d2c4ab'); R(W - 14, 0, 2, H, '#bfae8f');
  R(0, H - 12, W, 12, '#8f7b5a'); R(0, H - 14, W, 2, '#b39f78');
  R(294, H - 12, 52, 12, '#e6f2f8'); R(292, H - 14, 2, 14, '#5b4632'); R(346, H - 14, 2, 14, '#5b4632');
  // windows + light on the floor
  [[178, 8, 28, 34], [452, 8, 28, 34]].forEach(([x, y, w, h]) => {
    for (let j = 0; j < 70; j++) R(x - 6 + (j * .55) | 0, 58 + j, w - 6, 1, 'rgba(255,248,220,.07)');
    R(x - 2, y - 2, w + 4, h + 4, '#f4f1ea'); R(x, y, w, h, '#a8d8ee'); R(x, y + h * .6 | 0, w, h * .4, '#c8e6f4');
    R(x + 4, y + 7, 9, 3, '#fff'); R(x + 8, y + 5, 7, 3, '#fff');
    R(x + (w >> 1) - 1, y, 2, h, '#f4f1ea'); R(x, y + (h >> 1) - 1, w, 2, '#f4f1ea'); R(x - 3, y + h + 1, w + 6, 3, '#d8cbb5');
  });
  // wall art
  R(272, 16, 16, 22, '#2a2018'); R(274, 18, 12, 18, '#f2b544'); R(274, 28, 12, 8, '#0FA37F'); R(279, 22, 3, 3, '#fff');
  R(392, 12, 22, 28, '#2a2018'); R(394, 14, 18, 24, '#e9dfcf'); R(396, 26, 14, 10, '#c1554b'); R(400, 20, 6, 6, '#3a6ea5');
  R(420, 12, 22, 28, '#2a2018'); R(422, 14, 18, 24, '#3a6ea5'); R(422, 28, 18, 10, '#e0a93b'); disc(431, 22, 4, '#fff');
  disc(552, 22, 13, '#1a1a1a'); disc(552, 22, 12, '#2b2b2b'); disc(552, 22, 5, '#c1554b'); disc(552, 22, 1, '#eee');
  R(56, 22, 52, 3, '#8a5a34'); R(58, 14, 4, 8, '#c1554b'); R(63, 12, 4, 10, '#3a6ea5'); R(68, 15, 4, 7, '#e0a93b'); R(92, 15, 8, 7, '#c26d4b'); R(93, 9, 6, 6, '#3f9b5a'); R(95, 6, 2, 4, '#4fb36c');
  g = ctx;
  finishStatic('main');
}
function finishStatic(id) {
  const r = ROOMS[id], baked = new Image();
  baked.onload = () => { r._img = baked; if (ROOM === id) staticImg = baked; };
  baked.src = staticLayer.toDataURL('image/png');
}
function buildDrumStatic() {
  g = sctx;
  // floor: dark rehearsal-room boards
  const FL = ['#5a4634', '#55402f', '#5f4a37', '#503b2a'];
  for (let y = 58, row = 0; y < H; y += 16, row++) {
    const off = (row % 2) * 24;
    for (let x = -off; x < W; x += 48) {
      const h = Math.abs((x * 73856093) ^ (y * 19349663)) % 4;
      R(x, y, 48, 16, FL[h]); R(x, y, 1, 16, '#3f2e20'); R(x, y + 15, 48, 1, '#3f2e20');
    }
  }
  // rug under the kit
  ell(320, 300, 130, 46, '#1a1512'); ell(320, 300, 122, 40, '#3a2a1c'); ell(320, 300, 100, 30, '#4a3626');
  // walls with acoustic foam panels
  R(0, 0, W, 52, '#2c2620'); R(0, 0, W, 6, '#241f1a'); R(0, 34, W, 18, '#282219');
  R(0, 52, W, 6, '#1c1712'); R(0, 0, 12, H, '#221d18'); R(W - 12, 0, 12, H, '#221d18');
  R(0, H - 12, W, 12, '#221d18'); R(0, H - 14, W, 2, '#332a1f');
  R(294, H - 12, 52, 12, '#4a3a2c'); R(292, H - 14, 2, 14, '#1c1712'); R(346, H - 14, 2, 14, '#1c1712');
  const foam = (x, y) => { R(x, y, 34, 34, '#403626'); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R(x + 2 + i * 8, y + 2 + j * 8, 6, 6, (i + j) % 2 ? '#4d4130' : '#443923'); };
  [[70, 8], [140, 8], [420, 8], [490, 8], [560, 8]].forEach(([x, y]) => foam(x, y));
  // a couple of wall-hung guitars for texture
  R(230, 10, 4, 30, '#caa15a'); ell(232, 42, 9, 13, '#8a5a2e'); ell(232, 42, 6, 9, '#c98f52');
  R(360, 10, 4, 30, '#3a2a1c'); ell(362, 42, 9, 13, '#241a10'); ell(362, 42, 6, 9, '#4a3626');
  g = ctx;
  finishStatic('drums');
}

/* ------------------------------------------------------------------ art: objects */
function shadowRect(o, inset = 2) { R(o.x + inset, o.y + o.h - 2, o.w - inset * 2, 3, 'rgba(60,35,10,.22)'); }

function drawDesk(o) {
  const x = o.x, y = o.y, t = T();
  shadowRect(o);
  R(x + 38, y, 44, 30, '#23272d'); R(x + 40, y + 2, 40, 24, '#0c1a17');
  const scroll = Math.floor(t * 2.2);
  for (let i = 0; i < 5; i++) {
    const w = 8 + ((i * 7 + scroll * 3) % 20), ind = ((i + scroll) % 3) * 3;
    R(x + 43 + ind, y + 4 + i * 4, w, 2, i % 2 ? '#e9e9e9' : '#0FA37F');
  }
  if (Math.floor(t * 2) % 2) R(x + 70, y + 22, 3, 3, '#0FA37F');
  R(x + 57, y + 30, 6, 3, '#23272d');
  R(x, y + 32, 120, 6, '#b07a45'); R(x, y + 32, 120, 1, '#c78f58'); R(x, y + 38, 120, 5, '#8a5a34');
  R(x + 4, y + 43, 6, 13, '#6f4526'); R(x + 110, y + 43, 6, 13, '#6f4526');
  R(x + 78, y + 43, 32, 11, '#7d4f2b'); R(x + 80, y + 45, 28, 4, '#8a5a34'); R(x + 92, y + 46, 5, 2, '#d9c7a3'); R(x + 80, y + 50, 28, 3, '#8a5a34');
  R(x + 44, y + 33, 30, 3, '#cfd3d6'); R(x + 44, y + 35, 30, 1, '#9aa0a6'); R(x + 80, y + 33, 5, 3, '#eee');
  R(x + 100, y + 25, 8, 8, '#fff'); R(x + 100, y + 28, 8, 2, '#0FA37F'); R(x + 108, y + 27, 2, 4, '#fff');
  R(x + 8, y + 30, 22, 3, '#fff'); R(x + 10, y + 27, 18, 3, '#f2f2f2'); R(x + 12, y + 24, 14, 3, '#fafafa');
}

function drawAbout(o) {
  const x = o.x, y = o.y;
  shadowRect({ x, y: o.y + 38, w: o.w, h: 24 });
  R(x + 10, y, 40, 36, '#2a2018'); R(x + 12, y + 2, 36, 32, '#f7f1e5');
  if (portraitReady) g.drawImage(portraitImg, x + 14, y + 4); else R(x + 14, y + 4, 32, 28, '#d9c7a3');
  R(x + 12, y + 2, 36, 1, 'rgba(255,255,255,.35)');
  R(x, y + 38, 60, 6, '#8a5a34'); R(x, y + 38, 60, 1, '#a4703f'); R(x + 3, y + 44, 54, 4, '#6f4526');
  R(x + 4, y + 48, 5, 14, '#6f4526'); R(x + 51, y + 48, 5, 14, '#6f4526');
  R(x + 8, y + 32, 9, 7, '#c26d4b'); R(x + 9, y + 26, 7, 6, '#3f9b5a'); R(x + 11, y + 23, 3, 4, '#4fb36c');
  R(x + 38, y + 34, 12, 4, '#3a6ea5'); R(x + 39, y + 31, 10, 3, '#e0a93b');
}

function drawTV(o) {
  const x = o.x, y = o.y, t = T();
  shadowRect(o, 6);
  R(x, y, 76, 42, '#1b1d20'); R(x + 3, y + 3, 70, 34, '#0d0f11');
  const pal = ['#f4a259', '#5b8e7d', '#bc4b51'], k = Math.floor(t / 1.6) % 3;
  R(x + 4, y + 4, 68, 32, pal[k]); R(x + 4, y + 4, 68, 12, pal[(k + 1) % 3]);
  R(x + 4, y + 26, 68, 10, 'rgba(0,0,0,.25)');
  R(x + 4, y + 4, 68, 3, '#000'); R(x + 4, y + 33, 68, 3, '#000');
  const px = (t * 22) % 90 - 12; if (px > -8 && px < 66) { R(x + 4 + px, y + 17, 8, 2, '#fff'); R(x + 6 + px, y + 15, 3, 2, '#fff'); R(x + 4 + px, y + 19, 2, 1, '#d33'); }
  for (let i = 0; i < 34; i += 4) R(x + 4, y + 4 + i, 68, 1, 'rgba(255,255,255,.06)');
  R(x + 66, y + 39, 4, 2, '#0FA37F');
  R(x + 28, y + 42, 20, 4, '#2a2d31'); R(x + 20, y + 46, 36, 4, '#3a3d42');
}

function drawCouch(o) {
  const x = o.x, y = o.y;
  shadowRect(o, 3);
  R(x, y + 6, 10, 28, '#28535a'); R(x + 78, y + 6, 10, 28, '#28535a');
  R(x + 10, y + 6, 68, 12, '#4b8d94'); R(x + 10, y + 6, 68, 2, '#66a9b0');
  R(x, y + 18, 88, 16, '#3a7178'); R(x, y + 18, 88, 2, '#58939a'); R(x + 44, y + 20, 1, 12, '#2f5d62');
  R(x + 16, y + 8, 12, 9, '#f2b544'); R(x + 18, y + 10, 8, 2, '#f7ce7c'); R(x + 60, y + 9, 10, 8, '#c1554b');
}

function drawMusic(o) {
  const x = o.x, y = o.y, t = T();
  shadowRect(o, 3);
  [[x, 0], [x + 110, 0]].forEach(([sx]) => {
    R(sx, y + 2, 18, 52, '#2a2a2e'); R(sx + 1, y + 3, 16, 50, '#3a3a40');
    const beat = REDUCED ? 0 : Math.floor((t * 4) % 2);
    disc(sx + 9, y + 20, 5 + beat, '#15151a'); disc(sx + 9, y + 20, 2, '#555'); disc(sx + 9, y + 38, 3, '#15151a'); disc(sx + 9, y + 38, 1, '#555');
  });
  R(x + 20, y + 22, 88, 32, '#6b4a2f'); R(x + 20, y + 22, 88, 2, '#8a6a45'); R(x + 24, y + 32, 80, 20, '#5a3d26');
  for (let i = 0; i < 9; i++) R(x + 26 + i * 9, y + 38, 6, 12, '#7d5a3a');
  R(x + 22, y + 10, 84, 14, '#2c2c30'); R(x + 22, y + 10, 84, 2, '#3f3f45');
  disc(x + 52, y + 16, 9, '#111'); disc(x + 52, y + 16, 3, '#c1554b');
  const a = t * 5; for (let r = 4; r <= 8; r += 2) { R(x + 52 + Math.round(Math.cos(a) * r), y + 16 + Math.round(Math.sin(a) * r), 1, 1, '#777'); }
  R(x + 52 + Math.round(Math.cos(a) * 8), y + 16 + Math.round(Math.sin(a) * 8), 2, 2, '#e9e9e9');
  R(x + 74, y + 12, 2, 12, '#bbb'); R(x + 66, y + 12, 9, 2, '#bbb'); R(x + 62, y + 14, 5, 2, '#ddd');
  R(x + 88, y + 14, 5, 5, '#0FA37F'); R(x + 96, y + 14, 5, 5, '#f2b544');
  if (!REDUCED && Math.floor(t * 1.5) % 2 === 0 && (S.noteT || 0) < t - .55) { S.noteT = t; spawn({ x: x + 9 + (Math.random() > .5 ? 110 : 0), y: y - 2, vx: (Math.random() - .5) * 8, vy: -16, life: 1.6, type: 'note', c: '#0FA37F' }); }
}

function drawCabinet(o) {
  const x = o.x, y = o.y;
  shadowRect(o, 2);
  R(x, y, 30, 52, '#6d7882'); R(x, y, 30, 2, '#8a95a0');
  for (let i = 0; i < 3; i++) { R(x + 2, y + 4 + i * 16, 26, 13, '#9aa5af'); R(x + 2, y + 4 + i * 16, 26, 1, '#b8c2cb'); R(x + 11, y + 10 + i * 16, 8, 2, '#3f484f'); R(x + 9, y + 5 + i * 16, 12, 3, '#f5f5f5'); }
  R(x + 5, y - 4, 20, 4, '#fff'); R(x + 7, y - 7, 16, 3, '#f2f2f2'); R(x + 20, y - 9, 6, 9, '#0FA37F');
}

function drawPrinter(o) {
  const x = o.x, y = o.y, t = T();
  shadowRect(o, 2);
  R(x, y + 34, 70, 6, '#b07a45'); R(x, y + 34, 70, 1, '#c78f58'); R(x + 3, y + 40, 64, 3, '#8a5a34');
  R(x + 4, y + 43, 5, 9, '#6f4526'); R(x + 61, y + 43, 5, 9, '#6f4526');
  R(x + 6, y + 4, 42, 30, '#2f343a'); R(x + 9, y + 8, 36, 22, '#1a242b'); R(x + 9, y + 8, 36, 2, 'rgba(255,190,90,.6)');
  R(x + 9, y + 12, 36, 1, '#888');
  const nx = 8 + Math.round((Math.sin(t * 1.7) + 1) * 12); R(x + 9 + nx, y + 10, 5, 4, '#ddd'); R(x + 11 + nx, y + 14, 1, 2, '#f2b544');
  R(x + 9, y + 27, 36, 2, '#555');
  const hgt = Math.floor(((t % 9) / 9) * 13) + 1; R(x + 21, y + 27 - hgt, 10, hgt, '#0FA37F'); R(x + 21, y + 27 - hgt, 10, 1, '#5ce0b8');
  R(x + 42, y + 6, 4, 2, '#f2b544');
  R(x + 54, y + 22, 10, 12, '#4fc3d9'); R(x + 54, y + 22, 10, 2, '#8ee0ee'); R(x + 57, y + 17, 4, 5, '#fff'); R(x + 58, y + 14, 2, 3, '#ddd');
  R(x + 52, y + 30, 4, 4, '#e9e9e9');
}

function drawBed(o) {
  const x = o.x, y = o.y, cx = x + 38, cy = y + 24;
  ell(cx, cy + 2, 37, 19, 'rgba(60,35,10,.22)');
  ell(cx, cy, 36, 18, '#7d4f2b'); ell(cx, cy - 1, 33, 15, '#c9855a'); ell(cx, cy - 1, 25, 10, '#f2d9b8'); ell(cx, cy, 20, 7, '#e9c9a0');
  for (let i = -3; i <= 3; i++) R(cx + i * 8, cy - 15, 2, 2, '#f2b544');
}

function drawMailbox(o) {
  const x = o.x, y = o.y, t = T();
  R(x + 4, y + 36, 16, 3, 'rgba(60,35,10,.22)');
  R(x + 10, y + 22, 4, 17, '#6b4a2f'); R(x + 6, y + 36, 12, 3, '#5a3d26');
  R(x + 2, y + 6, 20, 16, '#2b6cb0'); R(x + 2, y + 6, 20, 2, '#4a8bd0'); R(x + 4, y + 4, 16, 3, '#2b6cb0'); R(x + 6, y + 13, 12, 2, '#12305a');
  R(x + 20, y + 8, 2, 12, '#d94f3d'); R(x + 20, y + 8, 6, 4, '#d94f3d');
  const bob = Math.round(Math.sin(t * 3) * 1); R(x + 8, y - 1 + bob, 9, 6, '#fff'); R(x + 9, y + 1 + bob, 7, 1, '#ccc'); R(x + 9, y + 3 + bob, 5, 1, '#ccc');
}

function drawPlant(o, k) {
  const x = o.x, y = o.y, sway = Math.round(Math.sin(T() * 1.3 + k) * 1);
  R(x + 3, y + 40, 18, 3, 'rgba(60,35,10,.2)');
  R(x + 4, y + 30, 16, 12, '#c26d4b'); R(x + 3, y + 30, 18, 3, '#d9825e'); R(x + 5, y + 40, 14, 2, '#a4573a');
  R(x + 11, y + 18, 2, 12, '#2f7a45');
  R(x + 2 + sway, y + 10, 8, 10, '#3f9b5a'); R(x + 13 + sway, y + 8, 8, 12, '#4fb36c'); R(x + 8 + sway, y + 2, 8, 14, '#3f9b5a'); R(x + 9 + sway, y + 4, 2, 8, '#66c58a');
}

function drawLamp(o) {
  const x = o.x, y = o.y;
  ell(x + 7, y + 40, 8, 3, 'rgba(60,35,10,.2)');
  R(x + 6, y + 12, 2, 28, '#3a3a3e'); R(x + 1, y + 38, 12, 3, '#3a3a3e');
  R(x, y, 14, 12, '#f3d58a'); R(x + 2, y + 2, 10, 8, '#fbe8b0'); R(x, y, 14, 1, '#fff2c8');
  ell(x + 7, y + 6, 34, 28, 'rgba(255,220,140,.08)');
}

function drawDrumDoor(o) {
  const x = o.x, y = o.y;
  R(x, y, 26, 44, '#3a2a1c'); R(x + 2, y + 2, 22, 40, '#5a3d26'); R(x + 2, y + 2, 22, 2, '#6f4a2e');
  R(x + 20, y + 22, 2, 3, '#e0a93b');
  R(x + 5, y - 10, 16, 10, '#1a1a1a'); R(x + 6, y - 9, 14, 8, '#2b2b2b');
  R(x + 9, y - 6, 1, 3, '#fff'); R(x + 11, y - 7, 1, 4, '#fff'); R(x + 13, y - 5, 1, 2, '#fff'); R(x + 15, y - 7, 1, 4, '#fff');
}

function drawBoombox(o) {
  const x = o.x, y = o.y, t = T();
  shadowRect(o, 4);
  R(x, y + 6, 96, 44, '#2a2a2e'); R(x, y + 6, 96, 3, '#3a3a40'); R(x + 4, y + 42, 88, 6, '#1c1c1f');
  disc(x + 20, y + 26, 13, '#111'); disc(x + 20, y + 26, 9, '#2b2b2e'); disc(x + 20, y + 26, 3, '#555');
  disc(x + 76, y + 26, 13, '#111'); disc(x + 76, y + 26, 9, '#2b2b2e'); disc(x + 76, y + 26, 3, '#555');
  R(x + 38, y + 12, 20, 28, '#1c1c1f'); R(x + 39, y + 13, 18, 26, '#0d0f11');
  const bars = [.4, .8, .55, 1, .3, .7];
  bars.forEach((base, i) => {
    const amp = REDUCED ? base : base * (0.5 + 0.5 * Math.abs(Math.sin(t * (4 + i) + i)));
    const h = Math.max(2, Math.round(amp * 20));
    R(x + 41 + i * 3, y + 37 - h, 2, h, i % 2 ? '#0FA37F' : '#5ce0b8');
  });
  R(x + 34, y - 4, 2, 12, '#111'); R(x + 60, y - 4, 2, 12, '#111'); R(x + 30, y - 6, 10, 3, '#111'); R(x + 56, y - 6, 10, 3, '#111');
}

const KIT_ZONES = {
  kick:   { dx: 62,  dy: 18, r: 22, label: 'kick' },
  snare:  { dx: 22,  dy: -2, r: 15, label: 'snare' },
  hihat:  { dx: -6,  dy: -22, r: 12, label: 'hi-hat' },
  tom:    { dx: 100, dy: -8, r: 13, label: 'tom' },
  crash:  { dx: 128, dy: -30, r: 13, label: 'crash' },
};
function drawDrumKit(o) {
  const x = o.x, y = o.y, hit = S.drumHit || {};
  ell(x + 70, y + 66, 74, 14, 'rgba(40,25,10,.28)');
  // hi-hat, stage left
  R(x - 7, y - 20, 2, 42, '#8a8a8a');
  ell(x - 6, y - 22 - (hit.hihat > 0 ? 2 : 0), 15, 4, '#c9a227'); ell(x - 6, y - 25 - (hit.hihat > 0 ? 2 : 0), 14, 3.5, '#d4af37');
  // crash, stage right
  R(x + 127, y - 34, 2, 46, '#8a8a8a');
  ell(x + 128, y - 32 + (hit.crash > 0 ? -3 : 0), 17, 4.5, hit.crash > 0 ? '#f7e08a' : '#d4af37');
  // floor tom
  disc(x + 100, y - 6 + (hit.tom > 0 ? 2 : 0), 14, '#5c3a21'); disc(x + 100, y - 6 + (hit.tom > 0 ? 2 : 0), 10, '#f0f0ee');
  // snare on its stand
  R(x + 20, y + 24, 2, 18, '#6b6b6b'); R(x + 26, y + 24, 2, 18, '#6b6b6b');
  disc(x + 22, y - 2 + (hit.snare > 0 ? 3 : 0), 15, '#c7c7c7'); disc(x + 22, y - 2 + (hit.snare > 0 ? 3 : 0), 11, '#f0f0ee');
  // kick, center
  disc(x + 62, y + 18, 26, '#5c3a21'); disc(x + 62, y + 18, 20, '#f0f0ee'); disc(x + 62, y + 18, 4, 'rgba(139,90,43,.5)');
  if (hit.kick > 0) { g.globalAlpha = hit.kick; disc(x + 62, y + 18, 22, '#0FA37F'); g.globalAlpha = 1; }
  // drum throne — round stool, directly in front of the kick where the player stands to play
  const sx = x + 62, sy = y + 58;
  ell(sx, sy + 15, 20, 5, 'rgba(40,25,10,.25)');
  R(sx - 9, sy - 2, 2, 15, '#3a2c1e'); R(sx + 7, sy - 2, 2, 15, '#3a2c1e');
  R(sx - 6, sy + 4, 2, 11, '#3a2c1e'); R(sx + 4, sy + 4, 2, 11, '#3a2c1e');
  R(sx - 9, sy + 8, 18, 2, '#4a3826');
  ell(sx, sy - 4, 15, 7, '#4d2f1a'); ell(sx, sy - 5, 14, 6.5, '#7a4a2a'); ell(sx, sy - 6, 11, 5, '#8f5a34');
}

/* ------------------------------------------------------------------ drum studio audio */
let musicOn = false, musicIv = null, musicStep = 0;
function drumSound(kind) {
  if (muted || !actx) return;
  try {
    const c = actx, t = c.currentTime;
    if (kind === 'kick') {
      const o1 = c.createOscillator(), gn = c.createGain();
      o1.type = 'sine'; o1.frequency.setValueAtTime(150, t); o1.frequency.exponentialRampToValueAtTime(42, t + .15);
      gn.gain.setValueAtTime(.55, t); gn.gain.exponentialRampToValueAtTime(.001, t + .22);
      o1.connect(gn).connect(c.destination); o1.start(t); o1.stop(t + .23);
    } else {
      const isCrash = kind === 'crash', len = c.sampleRate * (isCrash ? .5 : kind === 'hihat' ? .1 : .16);
      const buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const noise = c.createBufferSource(); noise.buffer = buf;
      const f = c.createBiquadFilter();
      if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .7; }
      else if (kind === 'hihat') { f.type = 'highpass'; f.frequency.value = 8000; }
      else if (kind === 'crash') { f.type = 'highpass'; f.frequency.value = 6000; }
      else { f.type = 'bandpass'; f.frequency.value = 320; f.Q.value = 1; }   // tom
      const gn = c.createGain();
      gn.gain.setValueAtTime(kind === 'crash' ? .22 : kind === 'hihat' ? .16 : .42, t);
      gn.gain.exponentialRampToValueAtTime(.001, t + (isCrash ? .45 : kind === 'hihat' ? .09 : .18));
      noise.connect(f).connect(gn).connect(c.destination); noise.start(t);
    }
  } catch (e) {}
}
function hitDrum(kind) {
  S.drumHit = S.drumHit || {}; S.drumHit[kind] = 1;
  drumSound(kind);
}
const DRUM_KEYS = { Digit1: 'hihat', Digit2: 'snare', Digit3: 'kick', Digit4: 'tom', Digit5: 'crash' };
function enterDrumPlay() {
  if (S.mode === 'drumplay') return;
  S.mode = 'drumplay'; S.path = null; S.pending = null; keys.clear();
  stopMusic();
  drumPlayEl.hidden = false; requestAnimationFrame(() => drumPlayEl.classList.add('show'));
  liveEl.textContent = 'Playing the drums. Press 1 through 5 to hit each piece, or click one. Escape to stop.';
}
function exitDrumPlay() {
  if (S.mode !== 'drumplay') return;
  S.mode = 'play'; S.lastMove = performance.now();
  drumPlayEl.classList.remove('show'); setTimeout(() => { if (!drumPlayEl.classList.contains('show')) drumPlayEl.hidden = true; }, 260);
  if (ROOM === 'drums') startMusic();
  canvas.focus({ preventScroll: true });
  liveEl.textContent = 'Back in the studio.';
}
// A short, original drum pattern built from the game's own kick/snare/hihat/crash synths —
// not a recording or transcription of any song. Fast alternating kick-snare with a driving
// hi-hat and a crash on the downbeat, in the spirit of a blast beat. Starts automatically on
// entering the room, stops on leaving.
const MUSIC_STEP_MS = 130;
function startMusic() {
  if (musicOn) return; musicOn = true; musicStep = 0;
  musicIv = setInterval(() => {
    const s = musicStep % 16;
    if (s % 2 === 0) drumSound('kick'); else drumSound('snare');
    if (s % 4 === 2) drumSound('hihat');
    if (s === 0) drumSound('crash');
    musicStep++;
  }, MUSIC_STEP_MS);
}
function stopMusic() { musicOn = false; clearInterval(musicIv); musicIv = null; }

/* ------------------------------------------------------------------ art: characters */
const SKIN = '#e8b58f', SKIN_D = '#c98f68', HAIR = '#3a2418', JEANS = '#3b5a86', JEANS_D = '#2f4a70', TEE = '#8a8f98', TEE_L = '#a3a8b0';
function drawBen(p) {
  g.save(); g.translate(Math.round(p.x), Math.round(p.y));
  ell(0, 0, 8, 2, 'rgba(50,30,10,.28)');
  const st = p.moving ? p.step % 4 : 0, bob = p.moving && (st === 1 || st === 3) ? -1 : 0, sw = p.moving ? [0, 2, 0, -2][st] : 0;
  if (p.dir === 'left' || p.dir === 'right') {
    if (p.dir === 'left') g.scale(-1, 1);
    R(-3 + sw, -7, 3, 6, JEANS_D); R(-3 + sw, -1, 4, 1, '#222');
    R(0 - sw, -7, 3, 6, JEANS); R(0 - sw, -1, 4, 1, '#222');
    R(-3, -15 + bob, 7, 9, TEE);
    R(-1 - (sw >> 1), -14 + bob, 3, 7, TEE_L); R(-1 - (sw >> 1), -8 + bob, 3, 2, SKIN);
    R(-3, -24 + bob, 8, 9, SKIN); R(-1, -21 + bob, 2, 3, SKIN_D);
    R(-5, -27 + bob, 11, 5, HAIR); R(-6, -24 + bob, 3, 6, HAIR); R(3, -26 + bob, 3, 3, HAIR); R(-3, -29 + bob, 3, 2, HAIR); R(1, -29 + bob, 3, 2, HAIR);
    R(2, -20 + bob, 1, 2, '#1b1b1b'); R(5, -19 + bob, 1, 2, SKIN_D); R(3, -16 + bob, 2, 1, '#a8553d');
  } else {
    const back = p.dir === 'up';
    R(-4, -7 - (sw > 0 ? 1 : 0), 3, 6 + (sw > 0 ? 1 : 0), JEANS); R(-4, -1, 3, 1, '#222');
    R(1, -7 - (sw < 0 ? 1 : 0), 3, 6 + (sw < 0 ? 1 : 0), JEANS); R(1, -1, 3, 1, '#222');
    R(-5, -15 + bob, 10, 9, TEE); R(-5, -15 + bob, 10, 1, TEE_L);
    R(-7, -14 + bob + (sw > 0 ? 1 : 0), 2, 6, TEE_L); R(-7, -8 + bob + (sw > 0 ? 1 : 0), 2, 2, SKIN);
    R(5, -14 + bob + (sw < 0 ? 1 : 0), 2, 6, TEE_L); R(5, -8 + bob + (sw < 0 ? 1 : 0), 2, 2, SKIN);
    R(-5, -24 + bob, 10, 9, back ? HAIR : SKIN);
    R(-6, -27 + bob, 12, 5, HAIR); R(-7, -25 + bob, 2, 5, HAIR); R(5, -25 + bob, 2, 5, HAIR);
    R(-5, -29 + bob, 3, 2, HAIR); R(-1, -30 + bob, 3, 2, HAIR); R(3, -29 + bob, 3, 2, HAIR);
    if (!back) { R(-3, -20 + bob, 2, 2, '#1b1b1b'); R(1, -20 + bob, 2, 2, '#1b1b1b'); R(-1, -17 + bob, 2, 1, '#a8553d'); }
  }
  g.restore();
}

const DOGCOL = {
  frankie: { b: '#7a3f21', l: '#a8622f', d: '#4d2412', n: '#1a0f0a', snout: '#a8622f' },
  coby:    { b: '#f4f0e8', l: '#ffffff', d: '#d6cfc0', n: '#1a1a1a', snout: '#efe6d4' },
};
function drawDog(d) {
  const c = DOGCOL[d.kind];
  g.save(); g.translate(Math.round(d.x), Math.round(d.y)); g.scale(d.dir, 1);
  ell(0, 0, 8, 2, 'rgba(50,30,10,.25)');
  if (d.state === 'sleep') {
    R(-7, -6, 14, 6, c.b); R(-5, -8, 10, 3, c.b); R(3, -7, 6, 5, c.b); R(2, -8, 3, 4, c.d); R(9, -5, 1, 1, c.n); R(-9, -5, 3, 3, c.d);
    R(-3, -7, 2, 1, c.l); R(1, -5, 2, 1, c.l); R(-6, -3, 2, 1, c.l);
  } else {
    const st = d.moving ? d.step % 4 : 0, sw = [0, 1, 0, -1][st], bob = d.moving && st % 2 ? -1 : 0;
    const wag = Math.round(Math.sin(S.t * (d.moving ? 14 : 7) + (d.kind === 'coby' ? 1 : 0)) * 1.5);
    R(-6 + sw, -3, 2, 3, c.d); R(-3 - sw, -3, 2, 3, c.d); R(2 - sw, -3, 2, 3, c.d); R(5 + sw, -3, 2, 3, c.d);
    R(-8, -12 + bob + wag, 2, 5, c.d);
    R(-7, -9 + bob, 14, 7, c.b); R(-7, -9 + bob, 14, 1, c.l);
    R(-4, -7 + bob, 2, 1, c.l); R(0, -5 + bob, 2, 1, c.l); R(3, -8 + bob, 2, 1, c.l); R(-5, -4 + bob, 2, 1, c.d);
    R(5, -14 + bob, 7, 7, c.b); R(4, -14 + bob, 3, 6, c.d); R(11, -11 + bob, 3, 3, c.snout); R(13, -11 + bob, 1, 1, c.n); R(9, -12 + bob, 1, 1, c.n);
    if (d.kind === 'frankie') { R(6, -16 + bob, 5, 2, c.l); R(8, -17 + bob, 3, 1, c.l); } else { R(6, -15 + bob, 5, 1, c.l); }
    if (d.happy > 0) R(12, -8 + bob, 1, 2, '#e0708a');
  }
  g.restore();
}

/* ------------------------------------------------------------------ state */
const S = {
  mode: 'intro', t: 0, started: 0,
  player: { x: 320, y: 430, dir: 'up', step: 0, stepT: 0, moving: false },
  path: null, pending: null, marker: null,
  active: null, dogActive: null,
  visited: new Set(), lastMove: 0, hintShown: false,
  noteT: 0,
};
const dogs = [
  { kind: 'frankie', name: 'Frankie', x: 566, y: 312, dir: -1, state: 'sleep', step: 0, stepT: 0, moving: false, path: null, pathT: 0, off: [-16, 14], happy: 0, bark: 0 },
  { kind: 'coby',    name: 'Coby',    x: 588, y: 318, dir: -1, state: 'sleep', step: 0, stepT: 0, moving: false, path: null, pathT: 0, off: [16, 16],  happy: 0, bark: 0 },
];
try { JSON.parse(localStorage.getItem('benStudioVisited') || '[]').forEach(i => OBJ_BY_ID[i] && !OBJ_BY_ID[i].door && S.visited.add(i)); } catch (e) {}
const saveVisited = () => { try { localStorage.setItem('benStudioVisited', JSON.stringify([...S.visited])); } catch (e) {} };

/* ------------------------------------------------------------------ view / camera */
let scale = 3, viewW = 320, viewH = 200, camX = 0, camY = 0, camFX = 0, camFY = 0, camZoom = 1;
const DRUM_ZOOM = 2.15;
function resize() {
  const iw = innerWidth, ih = innerHeight;
  scale = Math.max(2, Math.round(Math.min(iw / 620, ih / 380)));
  viewW = Math.ceil(iw / scale); viewH = Math.ceil(ih / scale);
  canvas.width = viewW; canvas.height = viewH;
  canvas.style.width = viewW * scale + 'px'; canvas.style.height = viewH * scale + 'px';
  ctx.imageSmoothingEnabled = false;
  updateCamera(1, true);
}
function updateCamera(dt, snap) {
  const k = snap ? 1 : 1 - Math.exp(-7 * dt);
  if (S.mode === 'drumplay') {
    const kit = OBJ_BY_ID.drumkit;
    const kcx = kit.x + kit.w / 2, kcy = kit.y + 14;
    camZoom += (DRUM_ZOOM - camZoom) * (snap ? 1 : 1 - Math.exp(-8 * dt));
    const effW = viewW / camZoom, effH = viewH / camZoom;
    const tx = kcx - effW / 2, ty = kcy - effH / 2;
    camFX += (tx - camFX) * k; camFY += (ty - camFY) * k;
    camX = camFX; camY = camFY;
    return;
  }
  camZoom += (1 - camZoom) * (snap ? 1 : 1 - Math.exp(-8 * dt));
  const p = S.player;
  const tx = p.x - viewW / 2, ty = p.y - 12 - viewH / 2;
  const minX = viewW >= W ? (W - viewW) / 2 : 0, maxX = viewW >= W ? minX : W - viewW;
  const minY = viewH >= H ? (H - viewH) / 2 : -22, maxY = viewH >= H ? minY : H - viewH;
  camFX += (clamp(tx, minX, maxX) - camFX) * k; camFY += (clamp(ty, minY, maxY) - camFY) * k;
  camX = Math.round(camFX); camY = Math.round(camFY);
}
const toScreen = (wx, wy) => [(wx - camX) * scale * camZoom, (wy - camY) * scale * camZoom];

/* ------------------------------------------------------------------ audio (tiny synth, muted by toggle) */
let actx = null, muted = false;
function tone(f, d = .08, type = 'square', v = .035, slide = 0, delay = 0) {
  if (muted) return; if (!actx) return;
  try {
    const t0 = actx.currentTime + delay, o = actx.createOscillator(), gn = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t0 + d);
    gn.gain.setValueAtTime(v, t0); gn.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(gn); gn.connect(actx.destination); o.start(t0); o.stop(t0 + d + .02);
  } catch (e) {}
}
const sfx = {
  open() { tone(520, .07); tone(780, .1, 'square', .035, 0, .07); },
  close() { tone(620, .07, 'square', .03, -240); },
  step() { tone(110, .03, 'triangle', .018); },
  bark() { tone(340, .09, 'sawtooth', .04, -140); tone(300, .08, 'sawtooth', .035, -120, .11); },
  found() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .13, 'square', .035, 0, i * .09)); },
  tick() { tone(440, .04, 'square', .025); },
};

/* ------------------------------------------------------------------ particles + bubbles */
const parts = [];
function spawn(p) { if (REDUCED && p.type !== 'heart') return; p.t = 0; parts.push(p); }
function burst(x, y, n, colors, spread = 40) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = 10 + Math.random() * spread; spawn({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 14, life: .5 + Math.random() * .5, type: 'spark', c: colors[i % colors.length], g: 60 }); } }
function drawParts(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.t += dt; if (p.t > p.life) { parts.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt;
    const a = 1 - p.t / p.life; g.globalAlpha = Math.min(1, a * 1.6);
    const x = Math.round(p.x), y = Math.round(p.y);
    if (p.type === 'heart') { R(x, y, 2, 1, '#e0506a'); R(x + 3, y, 2, 1, '#e0506a'); R(x - 1, y + 1, 7, 2, '#e0506a'); R(x, y + 3, 5, 1, '#e0506a'); R(x + 1, y + 4, 3, 1, '#e0506a'); R(x + 2, y + 5, 1, 1, '#e0506a'); }
    else if (p.type === 'note') { R(x + 2, y, 1, 5, p.c); R(x, y + 4, 3, 2, p.c); R(x + 2, y, 3, 1, p.c); }
    else if (p.type === 'z') { R(x, y, 4, 1, '#fff'); R(x + 2, y + 1, 1, 1, '#fff'); R(x + 1, y + 2, 1, 1, '#fff'); R(x, y + 3, 4, 1, '#fff'); }
    else R(x, y, 2, 2, p.c);
    g.globalAlpha = 1;
  }
}
const bubbles = [];
function bubble(text, wx, wy, ms = 1100) {
  const el = document.createElement('div'); el.className = 'bubble'; el.textContent = text; document.body.appendChild(el);
  const b = { el, wx, wy, until: performance.now() + ms }; bubbles.push(b); return b;
}
function updateBubbles(now) {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i]; if (now > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; }
    const [sx, sy] = toScreen(b.wx, b.wy); b.el.style.left = sx + 'px'; b.el.style.top = sy + 'px';
  }
}

/* ------------------------------------------------------------------ DOM: labels, places, hint, toast */
const labelsEl = $('#labels'), hintEl = $('#hint'), toastEl = $('#toast'), liveEl = $('#live');
const KEYTXT = isTouch ? 'Tap' : 'E';
ALL_OBJ.forEach(o => {
  const c = document.createElement('div'); c.className = 'chip'; c.dataset.id = o.id;
  c.innerHTML = `<span class="dot"></span><span>${o.label}</span><span class="key">${KEYTXT}</span>`;
  if (o.drumZone) { c.style.pointerEvents = 'none'; }   // sits over the kit; clicks must reach the canvas, not this label
  else c.addEventListener('pointerdown', e => { e.stopPropagation(); if (S.mode === 'play' && o._room === ROOM) goTo(o); });
  labelsEl.appendChild(c); o.chip = c;
});
function refreshChips() { ALL_OBJ.forEach(o => o.chip.classList.toggle('done', S.visited.has(o.id))); $('#found').textContent = S.visited.size; $('#total').textContent = COUNTABLE.length; refreshPlaces(); }
function placeChips() {
  const show = S.mode !== 'intro' && S.mode !== 'drumplay';
  ALL_OBJ.forEach(o => {
    const here = o._room === ROOM;
    o.chip.style.display = here ? '' : 'none';
    if (!here) return;
    const [sx, sy] = toScreen(o.x + o.w / 2, o.labelBelow ? o.y + o.h + 3 : o.y - (o.door ? -2 : 3));
    o.chip.style.opacity = show ? '' : 0;
    o.chip.style.transform = `translate(${Math.round(sx)}px,${Math.round(sy)}px) translate(-50%,${o.labelBelow ? '0' : '-100%'})`;
    o.chip.classList.toggle('active', S.active === o);
  });
}
let toastT = 0;
function toast(msg, ms = 2600) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms); }
function showHint() {
  hintEl.hidden = false; hintEl.classList.remove('fade');
  hintEl.innerHTML = isTouch ? 'Tap anywhere to walk · tap a label to open it' : 'Walk with <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows · press <kbd>E</kbd> near a label · or just click';
  clearTimeout(showHint.t); showHint.t = setTimeout(() => { hintEl.classList.add('fade'); setTimeout(() => hintEl.hidden = true, 700); }, 8000);
}
function dismissHint() { if (!hintEl.hidden && !hintEl.classList.contains('fade')) { clearTimeout(showHint.t); showHint.t = setTimeout(() => { hintEl.classList.add('fade'); setTimeout(() => hintEl.hidden = true, 700); }, 2200); } }

const placesBtn = $('#placesBtn'), placesList = $('#placesList');
function refreshPlaces() {
  placesList.innerHTML = '';
  OBJ.forEach(o => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.innerHTML = `<span>${o.label}</span>${S.visited.has(o.id) ? '<span class="ok">✓ seen</span>' : ''}`;
    b.addEventListener('click', () => { closePlaces(); if (S.mode === 'play') goTo(o); });
    li.appendChild(b); placesList.appendChild(li);
  });
}
function closePlaces() { placesList.hidden = true; placesBtn.setAttribute('aria-expanded', 'false'); }
placesBtn.addEventListener('click', e => { e.stopPropagation(); const open = placesList.hidden; placesList.hidden = !open; placesBtn.setAttribute('aria-expanded', String(open)); if (open) placesList.querySelector('button')?.focus(); });
document.addEventListener('pointerdown', e => { if (!e.target.closest('.places')) closePlaces(); });

/* ------------------------------------------------------------------ panels (real content, visual first) */
const PROJECTS = [
  { id: 'premier',  tag: 'Internship · PREMIER · 2026', title: 'PREMIER Design + Build Group', d: 'Full site redesign & rebrand, live in production.' },
  { id: 'safeplay', tag: 'School project · 2025',       title: 'Safeplay',                    d: 'Mobile app for vetting playdate families, iOS.' },
  { id: 'denmark',  tag: 'Study abroad · 2026',         title: 'Danmarks Tekniske Museum',    d: 'Museum app concept, coded prototype.' },
  { id: 'youtube',  tag: 'School project · 2025',       title: 'YouTube Watch',               d: 'watchOS concept for the Apple Watch.' },
  { id: 'still',    tag: 'Vibe-coded · 2026',           title: 'Still',                       d: 'Anxiety companion, vibe-coded in a weekend.' },
];
const TRACKS = [
  ['blurry', '6lSr3iZTC144PKhvbPFzMp', 'Blurry', 'Puddle of Mudd'], ['fine-again', '3d0kFlQbmNvQCukTHU72N9', 'Fine Again', 'Seether'],
  ['hemorrhage', '1sjrDQXqAa9V07FjKIlAQ4', 'Hemorrhage (In My Hands)', 'Fuel'], ['adams-song', '6xpDh0dXrkVp0Po1qrHUd8', "Adam's Song", 'blink-182'],
  ['if-you-could-only-see', '4KoNBTm9a55KgLMtEaf3n6', 'If You Could Only See', 'Tonic'], ['here-without-you', '3NLrRZoMF0Lx6zTlYqeIo4', 'Here Without You', '3 Doors Down'],
  ['spin', '6iOPGPuPhlU1fBgPgZe34z', 'Spin', 'Lifehouse'], ['45', '420JGkyLfLUZcgBHKiIK9v', '45', 'Shinedown'],
  ['dont-go-away', '5d3GTM2ynSLRHgDIdKVZ6Z', "Don't Go Away", 'Oasis'], ['stairway', '5CQ30WqJwcep0pYcV4AMNc', 'Stairway to Heaven', 'Led Zeppelin'],
  ['waste', '6dKntZwVJx0QLX6IM19gC7', 'Waste', 'Phish'],
];
const MOVIES = [
  ['anchorman', 'Anchorman', '2004', 'Anchorman: The Legend of Ron Burgundy'], ['airplane', 'Airplane!', '1980', 'Airplane!'], ['cuckoos-nest', "One Flew Over the Cuckoo's Nest", '1975', "One Flew Over the Cuckoo's Nest"],
];
const ext = 'target="_blank" rel="noopener"';
const PANELS = {
  work: { title: 'Work', html: () => `
    <p class="sub">Five projects. Tap one to open its full case study.</p>
    <div class="grid">${PROJECTS.map(p => `<a class="proj" ${ext} href="${site('index.html?case=' + p.id)}"><img loading="lazy" src="assets/projects/${p.id}.jpg" alt=""><span class="meta"><span class="tag">${p.tag}</span><b>${p.title}</b><span class="d">${p.d}</span></span></a>`).join('')}</div>
    <div class="links"><a class="btn solid" ${ext} href="${site('index.html')}">All work</a><a class="btn" ${ext} href="${site('design-system.html')}">My design system</a></div>` },
  about: { title: 'About', html: () => `
    <div class="about"><img src="assets/ben.jpg" alt="Ben Levitsky"><div>
      <p>I'm Ben. I make things: apps, websites, prototypes. I write my own code instead of stopping at Figma, because building the interaction teaches you something a mockup can't.</p>
      <div class="chips"><span>B.A. Design &amp; UX Design, Michigan</span><span>Ogilvy</span><span>PREMIER</span><span>Remira</span><span>MistMates</span></div>
      <a class="btn solid" ${ext} href="${site('about.html')}">Full About page</a></div></div>` },
  music: { title: 'On Repeat', html: () => `
    <p class="sub">What's spinning lately. Tap a track to preview it.</p>
    <div class="tracks">${TRACKS.map((t, i) => `<div><button class="trk" data-i="${i}" aria-expanded="false"><img src="assets/music/${t[0]}.jpg" alt=""><span><b>${t[2]}</b><small>${t[3]}</small></span><span class="p">▶</span></button><div class="emb" id="emb${i}"></div></div>`).join('')}</div>`,
    onOpen(root) { root.querySelectorAll('.trk').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i, box = root.querySelector('#emb' + i), was = box.classList.contains('open');
      root.querySelectorAll('.emb.open').forEach(e => { e.classList.remove('open'); e.innerHTML = ''; }); root.querySelectorAll('.trk').forEach(x => x.setAttribute('aria-expanded', 'false'));
      if (was) return;
      box.innerHTML = `<iframe title="${TRACKS[i][2]} preview" src="https://open.spotify.com/embed/track/${TRACKS[i][1]}?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
      box.classList.add('open'); b.setAttribute('aria-expanded', 'true'); sfx.tick();
    })); } },
  movies: { title: 'Movies', html: () => `
    <p class="sub">Three I can quote too much.</p>
    <div class="posters">${MOVIES.map(m => `<a ${ext} href="https://www.imdb.com/find/?q=${encodeURIComponent(m[3])}"><img src="assets/movies/${m[0]}.jpg" alt="${m[3]} poster"><b>${m[1]}</b><small>${m[2]}</small></a>`).join('')}</div>` },
  contact: { title: 'Say hi', html: () => `
    <a class="bigmail" href="mailto:${CFG.EMAIL}">${CFG.EMAIL}</a>
    <p class="sub">Looking for UX and product design roles where I can do research, build systems, and ship real product.</p>
    <div class="links"><a class="btn solid" ${ext} href="${CFG.LINKEDIN}">LinkedIn</a><a class="btn" ${ext} href="${CFG.INSTAGRAM}">Instagram</a><a class="btn" ${ext} href="${site(CFG.RESUME)}">Résumé (PDF)</a></div>` },
  resume: { title: 'Résumé', html: () => `
    <ul class="list">
      <li><b>Web Design &amp; Development Intern</b> · PREMIER Design + Build<small>Component-based design system for a national contractor, 390px phone to 3300px monitor.</small></li>
      <li><b>Product Design Contractor</b> · Remira<small>Diabetes-tracking app concepts in Figma and AI-assisted design-to-code.</small></li>
      <li><b>Design Intern</b> · Ogilvy<small>Creative, copy, and account teams; 6+ enterprise clients.</small></li>
      <li><b>B.A. Design and UX Design</b> · University of Michigan<small>Minors: Product Design, Software Engineering, Graphic Design, Industrial Design.</small></li>
    </ul>
    <div class="links"><a class="btn solid" ${ext} href="${site(CFG.RESUME)}">Open the PDF</a></div>` },
  mistmates: { title: 'MistMates', html: () => `
    <img class="hero-img" src="assets/mistmates.jpg" alt="Ben with a 3D-printed MistMates prototype in the studio">
    <p class="sub">A self-initiated product design project, ongoing since January 2025. I designed and CAD-prototyped a squeeze bottle in Autodesk Fusion 360, iterated on ergonomics and usability across multiple versions, then tested resin-fabricated prototypes for durability and how people actually hold them.</p>
    <div class="chips"><span>Autodesk Fusion 360</span><span>Resin prototyping</span><span>Hands-on testing</span></div>` },
  dogs: { title: 'Dogs', html: () => `
    <p class="sub">I grew up with dogs and I'm pretty sure I'll never not have one. I also worked at Dogtopia, which is exactly what it sounds like.</p>
    <div class="pets">
      <div class="pet"><img src="assets/frankie.jpg" alt="Frankie"><span style="background:#9C5419">Frankie</span></div>
      <div class="pet"><img src="assets/coby.jpg" alt="Coby"><span style="background:#4A4A4A">Coby</span></div>
      <div class="pet"><img src="assets/dogtopia.jpg" alt="Ben holding a dog at Dogtopia"><span style="background:#0A6E57">On shift</span></div>
    </div>
    <p class="foot">Yes, the two in the room follow you around. Try petting them.</p>` },
};

const panelEl = $('#panel'), cardEl = $('#card'), bodyEl = $('#panelBody'), titleEl = $('#panelTitle'), closeBtn = $('#panelClose');
let lastFocus = null;
function openPanel(id) {
  const P = PANELS[id]; if (!P) return;
  S.mode = 'panel'; S.path = null; S.pending = null; keys.clear();
  titleEl.textContent = P.title; bodyEl.innerHTML = P.html(); if (P.onOpen) P.onOpen(bodyEl);
  panelEl.hidden = false; requestAnimationFrame(() => panelEl.classList.add('open'));
  cardEl.scrollTop = 0; lastFocus = document.activeElement; closeBtn.focus({ preventScroll: true });
  sfx.open(); burst(S.player.x, S.player.y - 14, 10, ['#0FA37F', '#f2b544', '#fff']);
  if (!S.visited.has(id)) { S.visited.add(id); saveVisited(); refreshChips(); checkAllFound(); }
  liveEl.textContent = P.title + ' opened. Press Escape to close.';
}
function closePanel() {
  if (S.mode !== 'panel') return;
  panelEl.classList.remove('open'); bodyEl.querySelectorAll('.emb').forEach(e => e.innerHTML = '');
  setTimeout(() => { if (!panelEl.classList.contains('open')) panelEl.hidden = true; }, 220);
  S.mode = 'play'; S.lastMove = performance.now(); sfx.close(); canvas.focus({ preventScroll: true });
}
closeBtn.addEventListener('click', closePanel);
panelEl.addEventListener('pointerdown', e => { if (e.target === panelEl) closePanel(); });
let doneShown = false;
function checkAllFound() {
  if (S.visited.size >= COUNTABLE.length && !doneShown) {
    doneShown = true; sfx.found(); burst(S.player.x, S.player.y - 14, 40, ['#0FA37F', '#f2b544', '#c1554b', '#3a6ea5', '#fff'], 70);
    try { localStorage.setItem('benStudioAll', '1'); } catch (e) {}
    setTimeout(() => toast('You found everything. Now go say hi at the mailbox. 🙂', 4200), 700);
  }
}

/* ------------------------------------------------------------------ input */
const keys = new Set();
addEventListener('keydown', e => {
  if (!walkEl.hidden) { if (e.key === 'Escape') closeWalkthrough(); return; }
  if (S.mode === 'panel') {
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key === 'Tab') {
      const f = [...cardEl.querySelectorAll('a[href],button,iframe')].filter(x => !x.disabled); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    return;
  }
  if (S.mode === 'drumplay') {
    if (e.key === 'Escape') { e.preventDefault(); exitDrumPlay(); return; }
    if (DRUM_KEYS[e.code] && !e.repeat) { e.preventDefault(); hitDrum(DRUM_KEYS[e.code]); }
    return;
  }
  if (S.mode !== 'play') return;
  const inMenu = e.target.closest && e.target.closest('#placesList');
  if (inMenu) { if (e.key === 'Escape') { closePlaces(); placesBtn.focus(); } return; }
  const onHudBtn = e.target.closest && e.target.closest('#hud button, #hud a');
  if (onHudBtn && (e.code === 'Enter' || e.code === 'Space')) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') { if (!e.repeat) interact(); return; }
  if (e.key === 'Escape') { closePlaces(); return; }
  keys.add(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

canvas.addEventListener('pointerdown', e => {
  if (S.mode !== 'play' && S.mode !== 'drumplay') return;
  if (S.mode === 'play') { closePlaces(); canvas.focus({ preventScroll: true }); }
  const r = canvas.getBoundingClientRect(), wx = (e.clientX - r.left) / (scale * camZoom) + camX, wy = (e.clientY - r.top) / (scale * camZoom) + camY;
  if (ROOM === 'drums') {
    const kit = OBJ_BY_ID.drumkit;
    if (S.mode === 'drumplay') {
      for (const [key, z] of Object.entries(KIT_ZONES)) {
        const zx = kit.x + z.dx, zy = kit.y + z.dy;
        if (Math.hypot(wx - zx, wy - zy) > z.r) continue;
        hitDrum(key); return;
      }
      return;   // clicks elsewhere while zoomed in do nothing but shouldn't fall through to walking
    }
    for (const [, z] of Object.entries(KIT_ZONES)) {
      const zx = kit.x + z.dx, zy = kit.y + z.dy;
      if (Math.hypot(wx - zx, wy - zy) > z.r) continue;
      if (rectDistPt(S.player, { x: kit.x + kit.w / 2, y: kit.y + kit.h }) < 90) { enterDrumPlay(); }
      else { walkToPoint(kit.x + kit.w / 2 - 30, kit.y + kit.h + 6, () => enterDrumPlay()); }
      return;
    }
  }
  for (const d of dogs) if (ROOM === 'main' && Math.abs(wx - d.x) < 12 && wy > d.y - 18 && wy < d.y + 4) { const hit = () => petDog(d); if (rectDistPt(S.player, d) < 26) hit(); else { walkToPoint(d.x - d.dir * 16, d.y + 2, () => { d.dir = S.player.x < d.x ? -1 : 1; petDog(d); }); } return; }
  const cand = OBJ.filter(o => wx > o.x - 6 && wx < o.x + o.w + 6 && wy > o.y - 8 && wy < o.y + o.h + 6);
  if (cand.length) { goTo(cand[0]); return; }
  walkToPoint(wx, wy); S.marker = { x: wx, y: wy, t: 0 }; sfx.tick();
});
const rectDistPt = (p, d) => Math.hypot(p.x - d.x, p.y - d.y);

/* ------------------------------------------------------------------ player logic */
function walkToPoint(x, y, then) {
  const p = S.player, path = findPath(p.x, p.y, clamp(x, B.minX, B.maxX), clamp(y, B.minY, B.maxY));
  if (!path) { toast("Can't get there from here."); return false; }
  S.path = path; S.after = then || null; S.pending = null; S.stuck = 0; return true;
}
function goTo(o) {
  if (S.mode !== 'play') return;
  const p = S.player;
  if (rectDist(p.x, p.y, o) <= REACH - 4) { activate(o); return; }
  const c = [], off = 10;
  for (let x = o.x + 2; x <= o.x + o.w - 2; x += 6) { c.push([x, o.y + o.h + off]); c.push([x, o.y - off]); }
  for (let y = o.y + 2; y <= o.y + o.h - 2; y += 6) { c.push([o.x - off, y]); c.push([o.x + o.w + off, y]); }
  c.push([o.x + o.w / 2, o.y + o.h + off]);
  const ok = c.filter(([x, y]) => !feetBlocked(x, y)).sort((a, b) => Math.hypot(a[0] - p.x, a[1] - p.y) - Math.hypot(b[0] - p.x, b[1] - p.y));
  for (const [x, y] of ok.slice(0, 14)) { const path = findPath(p.x, p.y, x, y); if (path) { S.path = path; S.pending = o.id; S.after = null; S.stuck = 0; S.marker = { x, y, t: 0 }; sfx.tick(); return; } }
  toast("Couldn't find a way to " + o.label + '.');
}
function activate(o) {
  S.path = null; S.pending = null;
  if (o.door) { const url = site('index.html'); sfx.open(); if (window.top !== window) window.open(url, '_blank', 'noopener'); else location.href = url; return; }
  if (o.toRoom) { switchRoom(o.toRoom); return; }
  if (o.drumZone) { enterDrumPlay(); return; }
  openPanel(o.panelId || o.id);
}
function switchRoom(id) {
  const entry = ROOMS[id].OBJ.find(o => o.toRoom && ROOMS[o.toRoom] === ROOMS[ROOM]) || ROOMS[id].OBJ.find(o => o.enterAt);
  sfx.open();
  loadRoom(id);
  const [ex, ey] = (entry && entry.enterAt) || [W / 2, H - 40];
  S.player.x = ex; S.player.y = ey; S.player.dir = 'down'; S.path = null; S.pending = null;
  updateCamera(1, true); refreshPlaces();
  if (id === 'drums') startMusic(); else stopMusic();
  liveEl.textContent = id === 'drums' ? 'Drum studio. Music is playing — click a drum to play it.' : 'Back in the studio.';
  toast(id === 'drums' ? "Drum studio — click the kit to play it." : 'Back in the studio.', 2400);
}
function interact() {
  if (S.active) activate(S.active); else if (S.dogActive) petDog(S.dogActive);
}
function petDog(d) {
  d.bark = 1.1; d.happy = 2.2; sfx.bark();
  bubble(d.kind === 'frankie' ? 'woof!' : 'arf!', d.x, d.y - 26);
  for (let i = 0; i < 3; i++) spawn({ x: d.x - 3 + i * 4, y: d.y - 20, vx: (i - 1) * 8, vy: -20 - i * 4, life: .9 + i * .15, type: 'heart' });
}

function updatePlayer(dt, now) {
  const p = S.player;
  let ix = 0, iy = 0;
  if (keys.has('ArrowLeft') || keys.has('KeyA')) ix--; if (keys.has('ArrowRight') || keys.has('KeyD')) ix++;
  if (keys.has('ArrowUp') || keys.has('KeyW')) iy--; if (keys.has('ArrowDown') || keys.has('KeyS')) iy++;
  let vx = 0, vy = 0;
  if (ix || iy) { S.path = null; S.pending = null; S.after = null; const l = Math.hypot(ix, iy); vx = ix / l * SPEED; vy = iy / l * SPEED; }
  else if (S.path && S.path.length) {
    const [tx, ty] = S.path[0], dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d < 2.5) { S.path.shift(); if (!S.path.length) { S.path = null; const pend = S.pending, aft = S.after; S.pending = null; S.after = null; if (pend) { const o = OBJ_BY_ID[pend]; if (o) activate(o); } else if (aft) aft(); } }
    else { const sp = Math.min(SPEED, d / dt); vx = dx / d * sp; vy = dy / d * sp; }
  }
  const ox = p.x, oy = p.y;
  if (vx || vy) {
    const nx = p.x + vx * dt; if (!feetBlocked(nx, p.y)) p.x = nx;
    const ny = p.y + vy * dt; if (!feetBlocked(p.x, ny)) p.y = ny;
    p.moving = Math.hypot(p.x - ox, p.y - oy) > .01;
    if (Math.abs(vx) > Math.abs(vy) + .01) p.dir = vx > 0 ? 'right' : 'left'; else if (Math.abs(vy) > 0) p.dir = vy > 0 ? 'down' : 'up';
    S.lastMove = now; dismissHint();
    if (S.path) { S.stuck = p.moving ? 0 : (S.stuck || 0) + dt; if (S.stuck > .5) { S.path = null; S.pending = null; S.stuck = 0; } }
  } else p.moving = false;
  if (p.moving) { p.stepT += dt; if (p.stepT > .13) { p.stepT = 0; p.step++; if (p.step % 2 === 0) sfx.step(); } } else { p.step = 0; p.stepT = 0; }
  if (S.marker) { S.marker.t += dt; if (S.marker.t > .7) S.marker = null; }
}

/* ------------------------------------------------------------------ dogs */
const BED = { x: 578, y: 312 };
function stepDog(d, tx, ty, sp, dt) {
  const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
  if (dist < 1.5) { d.moving = false; return true; }
  const s = Math.min(sp, dist / dt), vx = dx / dist * s, vy = dy / dist * s, ox = d.x, oy = d.y;
  const nx = d.x + vx * dt; if (!feetBlocked(nx, d.y, 5, 4)) d.x = nx;
  const ny = d.y + vy * dt; if (!feetBlocked(d.x, ny, 5, 4)) d.y = ny;
  d.moving = Math.hypot(d.x - ox, d.y - oy) > .01;
  if (Math.abs(vx) > 4) d.dir = vx > 0 ? 1 : -1;
  return false;
}
function updateDogs(dt, now) {
  if (ROOM !== 'main') { dogs.forEach(d => d.moving = false); return; }
  const p = S.player, idle = (now - S.lastMove) / 1000;
  dogs.forEach((d, i) => {
    d.bark = Math.max(0, d.bark - dt); d.happy = Math.max(0, d.happy - dt);
    d.pathT -= dt;
    if (S.mode === 'intro') { d.moving = false; return; }
    if (d.state === 'sleep') {
      if (!REDUCED && Math.random() < dt * .5) spawn({ x: d.x + d.dir * 8, y: d.y - 12, vx: 4, vy: -9, life: 1.6, type: 'z' });
      if (now - S.started > 900 + i * 350 && (now - S.lastMove < 4000 || rectDistPt(p, d) < 80)) { d.state = 'follow'; d.wakeBounce = .4; }
      d.moving = false; return;
    }
    if (idle > 14 && S.mode === 'play') {
      if (d.state !== 'bed') { d.state = 'bed'; d.path = null; d.pathT = 0; }
      const tx = BED.x + (i ? 14 : -6), ty = BED.y + 4 + i * 2;
      if (d.pathT <= 0 && !d.path) { d.path = findPath(d.x, d.y, tx, ty); d.pathT = .6; }
      if (d.path && d.path.length) { const [wx, wy] = d.path[0]; if (stepDog(d, wx, wy, DOG_SPEED * .7, dt)) d.path.shift(); }
      else if (stepDog(d, tx, ty, DOG_SPEED * .6, dt)) { d.state = 'sleep'; d.moving = false; d.dir = -1; }
      return;
    }
    d.state = 'follow';
    const tx = p.x + d.off[0], ty = p.y + d.off[1], dist = Math.hypot(tx - d.x, ty - d.y);
    if (dist > 34) {
      if (d.pathT <= 0 || !d.path || !d.path.length) { d.path = lineClear(d.x, d.y, tx, ty) ? [[tx, ty]] : findPath(d.x, d.y, tx, ty); d.pathT = .45; }
      if (d.path && d.path.length) { const [wx, wy] = d.path[0]; if (stepDog(d, wx, wy, DOG_SPEED * (dist > 120 ? 1.35 : 1), dt)) d.path.shift(); }
      if (dist > 340) { d.x = p.x + d.off[0]; d.y = p.y + d.off[1]; d.path = null; }
    } else { d.moving = false; d.path = null; if (Math.abs(p.x - d.x) > 6) d.dir = p.x > d.x ? 1 : -1; }
    if (d.moving) { d.stepT = (d.stepT || 0) + dt; if (d.stepT > .11) { d.stepT = 0; d.step++; } }
  });
}

/* ------------------------------------------------------------------ active target + frame */
function updateActive() {
  if (S.mode !== 'play') { S.active = null; S.dogActive = null; return; }
  const p = S.player; let best = null, bd = REACH;
  OBJ.forEach(o => { const d = rectDist(p.x, p.y, o); if (d <= bd) { bd = d; best = o; } });
  if (best !== S.active) { S.active = best; if (best) liveEl.textContent = `${best.label}. Press E to open.`; }
  S.dogActive = null;
  if (!best && ROOM === 'main') for (const d of dogs) if (rectDistPt(p, d) < 20) S.dogActive = d;
}

function render(dt) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#1b1612'; ctx.fillRect(0, 0, viewW, viewH);
  ctx.setTransform(camZoom, 0, 0, camZoom, -camX * camZoom, -camY * camZoom);
  ctx.drawImage(staticImg || staticLayer, 0, 0);
  g = ctx;
  const ents = [];
  OBJ.forEach(o => { if (o.draw) ents.push({ y: o.sortY, f: () => o.draw(o) }); });
  DECOR.forEach(o => ents.push({ y: o.sortY, f: () => o.draw(o) }));
  ents.push({ y: S.player.y, f: () => drawBen(S.player) });
  if (ROOM === 'main') dogs.forEach(d => ents.push({ y: d.y, f: () => drawDog(d) }));
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  drawParts(dt);
  if (S.marker) { const m = S.marker, r = 3 + m.t * 14, a = 1 - m.t / .7; g.globalAlpha = a; for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283; R(Math.round(m.x + Math.cos(an) * r), Math.round(m.y + Math.sin(an) * r * .55), 1, 1, '#fff'); } g.globalAlpha = 1; }
}

let last = performance.now();
function frame(now) {
  if (S.paused) { last = now; requestAnimationFrame(frame); return; }      // debug-only: lets a test harness step time by hand
  const dt = Math.min(.05, (now - last) / 1000); last = now; S.t += dt;
  if (S.mode === 'play') updatePlayer(dt, now); else S.player.moving = false;
  updateDogs(dt, now);
  if (S.drumHit) for (const k in S.drumHit) S.drumHit[k] = Math.max(0, S.drumHit[k] - dt * 5);
  updateCamera(dt); updateActive();
  render(dt); placeChips(); updateBubbles(now);
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------------ boot */
function start() {
  const withSound = $('#soundOpt').checked;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); actx.resume && actx.resume(); } catch (e) { actx = null; }
  setMuted(!withSound || !actx);
  $('#intro').classList.add('gone'); setTimeout(() => $('#intro').hidden = true, 380);
  $('#hud').hidden = false;
  S.mode = 'play'; S.started = performance.now(); S.lastMove = S.started;
  S.path = [[320, 376]]; canvas.focus({ preventScroll: true });
  liveEl.textContent = 'Studio entered. Use the Places menu or arrow keys to explore.';
  let seenWalk = false; try { seenWalk = localStorage.getItem('benStudioWalkSeen') === '1'; } catch (e) {}
  if (seenWalk) { showHint(); } else { openWalkthrough(); }
}
const walkEl = $('#walk'), walkSteps = [...document.querySelectorAll('.walk-step')], walkDots = [...document.querySelectorAll('.walk-dots span')];
const drumPlayEl = $('#drumPlay');
let walkI = 0;
function renderWalk() {
  walkSteps.forEach((s, i) => s.hidden = i !== walkI);
  walkDots.forEach((d, i) => d.classList.toggle('on', i === walkI));
  $('#walkNext').textContent = walkI === walkSteps.length - 1 ? "Let's go" : 'Next';
}
function openWalkthrough() { walkI = 0; renderWalk(); walkEl.hidden = false; requestAnimationFrame(() => walkEl.classList.add('show')); }
function closeWalkthrough() {
  walkEl.classList.remove('show'); setTimeout(() => { walkEl.hidden = true; }, 260);
  try { localStorage.setItem('benStudioWalkSeen', '1'); } catch (e) {}
  showHint(); canvas.focus({ preventScroll: true });
}
$('#walkNext').addEventListener('click', () => { if (walkI < walkSteps.length - 1) { walkI++; renderWalk(); } else closeWalkthrough(); });
$('#walkSkip').addEventListener('click', closeWalkthrough);
$('#drumPlayExit').addEventListener('click', exitDrumPlay);
function setMuted(m) {
  muted = m; const b = $('#muteBtn'); b.setAttribute('aria-pressed', String(!m)); b.setAttribute('aria-label', m ? 'Sound off' : 'Sound on');
  $('#icoOn').hidden = m; $('#icoOff').hidden = !m;
}
$('#muteBtn').addEventListener('click', () => { if (!actx) { try { actx = new AudioContext(); } catch (e) {} } setMuted(!muted); if (!muted) sfx.tick(); });
$('#enter').addEventListener('click', start);
addEventListener('resize', () => { resize(); });
document.addEventListener('visibilitychange', () => { last = performance.now(); });
$('#skipLink').href = site('index.html'); $('#introSkip').href = site('index.html');

loadRoom('main'); refreshChips(); resize();
if (/[?&]debug/.test(location.search)) window.__studio = { S, dogs, get OBJ() { return OBJ; }, get ROOM() { return ROOM; }, OBJ_BY_ID, ROOMS, KIT_ZONES, DRUM_KEYS, goTo, openPanel, closePanel, findPath, feetBlocked, start, walkToPoint, switchRoom, hitDrum, enterDrumPlay, exitDrumPlay, get musicOn() { return musicOn; }, render, updateDogs, updateCamera, canvas, ctx, staticLayer, get staticImg() { return staticImg; }, getView: () => ({ scale, camX, camY, viewW, viewH, camZoom }), keys, step(dt, now) { S.t += dt; if (S.mode === 'play') updatePlayer(dt, now); updateDogs(dt, now); if (S.drumHit) for (const k in S.drumHit) S.drumHit[k] = Math.max(0, S.drumHit[k] - dt * 5); updateCamera(dt); updateActive(); render(dt); placeChips(); updateBubbles(now); } };
requestAnimationFrame(frame);
})();
