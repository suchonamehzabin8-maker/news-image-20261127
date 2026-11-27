// The World Today — Friday 27 November 2026.
// A deterministic newspaper front page, drawn pixel by pixel with Node 22
// standard library only. No network, no randomness, no timestamps: running
// this program twice writes byte-identical entry.png.
//
// The lead story is real news of 27 November 2026: President Donald Trump
// said he told Vladimir Putin to pull back Russia's military aggression
// across Europe. Secondary stories: the Thanksgiving storm that cut power
// to 724,000 on the US East Coast, the Houthi claim of a strike on Saudi
// Arabia's largest refinery (Brent near $97), Spain's Pablo Hernandez de
// Cos chosen as the next ECB president, and President Zelensky warning of
// a new Russian mass strike.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 bits, most significant bit left.
// ---------------------------------------------------------------------------
const FONT: Record<string, number[]> = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30],
  C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30],
  E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17],
  I: [14, 4, 4, 4, 4, 4, 14],       J: [7, 2, 2, 2, 2, 18, 12],
  K: [17, 18, 20, 24, 20, 18, 17],  L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17],  N: [17, 25, 21, 19, 17, 17, 17],
  O: [14, 17, 17, 17, 17, 17, 14],  P: [30, 17, 17, 30, 16, 16, 16],
  Q: [14, 17, 17, 17, 21, 18, 13],  R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30],    T: [31, 4, 4, 4, 4, 4, 4],
  U: [17, 17, 17, 17, 17, 17, 14],  V: [17, 17, 17, 17, 17, 10, 4],
  W: [17, 17, 17, 21, 21, 21, 10],  X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4],      Z: [31, 1, 2, 4, 8, 16, 31],
  a: [0, 0, 14, 1, 15, 17, 15],     b: [16, 16, 30, 17, 17, 17, 30],
  c: [0, 0, 14, 17, 16, 17, 14],    d: [1, 1, 15, 17, 17, 17, 15],
  e: [0, 0, 14, 17, 31, 16, 14],    f: [6, 9, 8, 30, 8, 8, 8],
  g: [0, 0, 15, 17, 17, 15, 1],     h: [16, 16, 30, 17, 17, 17, 17],
  i: [4, 0, 12, 4, 4, 4, 14],       j: [2, 0, 6, 2, 2, 18, 12],
  k: [16, 16, 18, 20, 24, 20, 18],  l: [12, 4, 4, 4, 4, 4, 14],
  m: [0, 0, 26, 21, 21, 21, 21],    n: [0, 0, 30, 17, 17, 17, 17],
  o: [0, 0, 14, 17, 17, 17, 14],    p: [0, 0, 30, 17, 17, 30, 16],
  q: [0, 0, 15, 17, 17, 15, 1],     r: [0, 0, 22, 25, 16, 16, 16],
  s: [0, 0, 15, 16, 14, 1, 30],     t: [8, 8, 30, 8, 8, 8, 6],
  u: [0, 0, 17, 17, 17, 17, 15],    v: [0, 0, 17, 17, 17, 10, 4],
  w: [0, 0, 17, 17, 21, 21, 10],    x: [0, 0, 17, 10, 4, 10, 17],
  y: [0, 0, 17, 17, 10, 4, 4],     z: [0, 0, 31, 2, 4, 8, 31],
  '0': [14, 17, 19, 21, 25, 17, 14], '1': [4, 12, 4, 4, 4, 4, 14],
  '2': [14, 17, 1, 6, 8, 16, 31],    '3': [30, 1, 1, 14, 1, 1, 30],
  '4': [2, 6, 10, 18, 31, 2, 2],     '5': [31, 16, 30, 1, 1, 17, 14],
  '6': [6, 8, 16, 30, 17, 17, 14],   '7': [31, 1, 2, 4, 8, 8, 8],
  '8': [14, 17, 17, 14, 17, 17, 14], '9': [14, 17, 17, 15, 1, 2, 12],
  ' ': [0, 0, 0, 0, 0, 0, 0],        '.': [0, 0, 0, 0, 0, 12, 12],
  ',': [0, 0, 0, 0, 12, 4, 8],       "'": [4, 4, 8, 0, 0, 0, 0],
  '"': [10, 10, 0, 0, 0, 0, 0],      '!': [4, 4, 4, 4, 4, 0, 4],
  '?': [14, 17, 1, 6, 4, 0, 4],      '-': [0, 0, 0, 14, 0, 0, 0],
  '(': [2, 4, 8, 8, 8, 4, 2],        ')': [8, 4, 2, 2, 2, 4, 8],
  '%': [25, 26, 2, 4, 8, 11, 19],    '$': [4, 15, 20, 14, 5, 30, 4],
  '&': [12, 18, 20, 8, 21, 18, 13],  '/': [1, 2, 2, 4, 8, 8, 16],
  '+': [0, 4, 4, 31, 4, 4, 0],       '=': [0, 0, 31, 0, 31, 0, 0],
  ':': [0, 12, 0, 0, 12, 0, 0],      ';': [0, 12, 0, 0, 12, 4, 8],
  '_': [0, 0, 0, 0, 0, 0, 31],       '*': [0, 4, 21, 14, 21, 4, 0],
  '|': [4, 4, 4, 4, 4, 4, 4],
};

// ---------------------------------------------------------------------------
// PNG encoding (RGB, filter 0, zlib level 9) — fully deterministic.
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG(w: number, h: number, rgb: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const rows: Buffer[] = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3);
    rgb.copy(row, 1, y * w * 3, (y + 1) * w * 3);
    rows.push(row);
  }
  const idat = deflateSync(Buffer.concat(rows), { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Canvas: a 1024x1024 RGB buffer with simple drawing primitives.
// ---------------------------------------------------------------------------
type RGB = [number, number, number];
const PAPER: RGB = [248, 244, 232];
const INK: RGB = [20, 20, 20];
const RED: RGB = [163, 22, 33];
const BLUE: RGB = [29, 78, 137];
const GREY: RGB = [110, 108, 100];
const SKY: RGB = [214, 231, 245];
const SEA: RGB = [47, 111, 178];
const LAND: RGB = [96, 150, 92];

class Canvas {
  w: number;
  h: number;
  px: Buffer;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.px = Buffer.alloc(w * h * 3);
    for (let i = 0; i < w * h; i++) {
      this.px[i * 3] = bg[0];
      this.px[i * 3 + 1] = bg[1];
      this.px[i * 3 + 2] = bg[2];
    }
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1): void {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, c: RGB, t = 1): void {
    this.rect(x, y, t, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (let guard = 0; guard < 4000; guard++) {
      this.rect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB, fill: boolean): void {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d = Math.sqrt(x * x + y * y);
        if (fill ? d <= r : Math.abs(d - r) < 1.2) this.set(cx + x, cy + y, c);
      }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.set(cx + x, cy + y, c);
      }
    }
  }
  text(s: string, x: number, y: number, scale: number, c: RGB): number {
    let cx = x;
    for (const ch of s) {
      const g = FONT[ch] ?? FONT['?'];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r] & (16 >> col)) this.rect(cx + col * scale, y + r * scale, scale, scale, c);
        }
      }
      cx += 6 * scale;
    }
    return cx;
  }
  textW(s: string, scale: number): number {
    return s.length * 6 * scale;
  }
  // Word-wrap text to maxWidth px; returns the y after the last line.
  para(s: string, x: number, y: number, maxW: number, scale: number, c: RGB, lh?: number): number {
    const lineH = lh ?? Math.round(7 * scale * 1.35);
    const words = s.split(' ');
    let line = '';
    let cy = y;
    for (const w of words) {
      const trial = line ? line + ' ' + w : w;
      if (this.textW(trial, scale) <= maxW || !line) {
        line = trial;
      } else {
        this.text(line, x, cy, scale, c);
        cy += lineH;
        line = w;
      }
    }
    if (line) this.text(line, x, cy, scale, c);
    return cy + lineH;
  }
  center(s: string, y: number, scale: number, c: RGB, x0 = 0, x1 = 1024): number {
    const x = x0 + Math.floor((x1 - x0 - this.textW(s, scale)) / 2);
    return this.text(s, x, y, scale, c);
  }
}

// ---------------------------------------------------------------------------
// Drawn illustrations (all fixed geometry — no randomness).
// ---------------------------------------------------------------------------

// A stylised globe: ocean, abstract continents, meridians.
// (All coordinates rounded to integers: the canvas silently drops
// fractional pixel writes.)
function drawGlobe(cv: Canvas, cx: number, cy: number, r: number): void {
  cv.circle(cx, cy, r, SEA, true);
  // abstract land masses
  cv.ellipse(Math.round(cx - r * 0.38), Math.round(cy - r * 0.28), Math.round(r * 0.30), Math.round(r * 0.20), LAND);
  cv.ellipse(Math.round(cx + r * 0.34), Math.round(cy - r * 0.05), Math.round(r * 0.26), Math.round(r * 0.30), LAND);
  cv.ellipse(Math.round(cx - r * 0.05), Math.round(cy + r * 0.42), Math.round(r * 0.30), Math.round(r * 0.16), LAND);
  cv.ellipse(Math.round(cx + r * 0.55), Math.round(cy + r * 0.38), Math.round(r * 0.16), Math.round(r * 0.12), LAND);
  // meridians and parallels, clipped to the circle's chords
  for (let k = -2; k <= 2; k++) {
    const off = Math.round((k * r) / 2.4);
    const chord = Math.floor(Math.sqrt(r * r - off * off)) - 2;
    cv.vline(cx + off, cy - chord, 2 * chord, [255, 255, 255], 1);
    cv.hline(cx - chord, cy + off, 2 * chord, [255, 255, 255], 1);
  }
  cv.circle(cx, cy, r, INK, false);
  cv.circle(cx, cy, r - 2, [255, 255, 255], false);
}

// Small flag on a pole. kind: 'us' | 'ru'.
function drawFlag(cv: Canvas, x: number, y: number, w: number, h: number, kind: 'us' | 'ru'): void {
  cv.rect(x - 3, y - 26, 3, h + 26, INK); // pole
  cv.circle(x - 1, y - 28, 3, [212, 175, 55], true);
  if (kind === 'us') {
    for (let s = 0; s < 7; s++) {
      cv.rect(x, y + Math.floor((s * h) / 7), w, Math.max(1, Math.floor(h / 7)), s % 2 === 0 ? RED : [255, 255, 255]);
    }
    cv.rect(x, y, Math.floor(w * 0.42), Math.floor(h * 0.54), BLUE);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        cv.rect(x + 4 + c * 9, y + 4 + r * 9, 2, 2, [255, 255, 255]);
      }
    }
  } else {
    cv.rect(x, y, w, Math.floor(h / 3), [255, 255, 255]);
    cv.rect(x, y + Math.floor(h / 3), w, Math.floor(h / 3), BLUE);
    cv.rect(x, y + Math.floor((2 * h) / 3), w, h - Math.floor((2 * h) / 3), RED);
  }
  cv.rect(x, y, w, 1, INK);
  cv.rect(x, y + h - 1, w, 1, INK);
  cv.rect(x, y, 1, h, INK);
  cv.rect(x + w - 1, y, 1, h, INK);
}

// Storm: dark cloud blobs, rain, one lightning bolt.
function drawStorm(cv: Canvas, x: number, y: number, w: number, h: number): void {
  const grey: RGB = [84, 88, 96];
  const dark: RGB = [58, 62, 70];
  cv.ellipse(x + Math.floor(w * 0.30), y + Math.floor(h * 0.42), Math.floor(w * 0.24), Math.floor(h * 0.22), grey);
  cv.ellipse(x + Math.floor(w * 0.58), y + Math.floor(h * 0.36), Math.floor(w * 0.26), Math.floor(h * 0.24), dark);
  cv.ellipse(x + Math.floor(w * 0.78), y + Math.floor(h * 0.46), Math.floor(w * 0.18), Math.floor(h * 0.18), grey);
  // rain
  for (let i = 0; i < 9; i++) {
    const rx = x + 12 + i * Math.floor((w - 24) / 9);
    cv.line(rx, y + Math.floor(h * 0.62), rx - 6, y + h - 4, [90, 130, 170], 2);
  }
  // lightning bolt
  const bx = x + Math.floor(w * 0.52);
  const by = y + Math.floor(h * 0.55);
  const yel: RGB = [240, 200, 40];
  cv.line(bx, by, bx - 8, by + 14, yel, 3);
  cv.line(bx - 8, by + 14, bx + 2, by + 16, yel, 3);
  cv.line(bx + 2, by + 16, bx - 6, by + 30, yel, 3);
}

// Small column icons (52 px tall zone).
function drawFlame(cv: Canvas, cx: number, y: number): void {
  const o: RGB = [226, 88, 34];
  const yy: RGB = [240, 200, 40];
  cv.ellipse(cx, y + 34, 16, 18, o);
  cv.ellipse(cx, y + 22, 10, 14, o);
  cv.ellipse(cx, y + 38, 8, 10, yy);
  cv.line(cx, y + 2, cx - 6, y + 22, o, 3);
  cv.line(cx, y + 2, cx + 6, y + 22, o, 3);
}
function drawBank(cv: Canvas, cx: number, y: number): void {
  const b: RGB = [29, 78, 137];
  cv.line(cx - 26, y + 16, cx, y + 2, b, 3);
  cv.line(cx, y + 2, cx + 26, y + 16, b, 3);
  cv.hline(cx - 26, y + 16, 53, b, 3);
  for (const dx of [-20, -7, 6, 19]) cv.vline(cx + dx, y + 22, 20, b, 4);
  cv.hline(cx - 28, y + 44, 57, b, 3);
  cv.hline(cx - 24, y + 48, 49, b, 2);
}
function drawShield(cv: Canvas, cx: number, y: number): void {
  const r: RGB = [163, 22, 33];
  cv.line(cx - 20, y + 4, cx + 20, y + 4, r, 3);
  cv.line(cx - 20, y + 4, cx - 20, y + 26, r, 3);
  cv.line(cx + 20, y + 4, cx + 20, y + 26, r, 3);
  cv.line(cx - 20, y + 26, cx, y + 48, r, 3);
  cv.line(cx + 20, y + 26, cx, y + 48, r, 3);
  // star
  cv.text('*', cx - 6, y + 14, 2, r);
}

// ---------------------------------------------------------------------------
// Layout — one newspaper front page, 1024 x 1024.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;
const MX = 36; // side margin
const RX = W - MX; // right edge of content

function drawPage(): Buffer {
  const cv = new Canvas(W, H, PAPER);

  // Top date line
  cv.text('FRIDAY, 27 NOVEMBER 2026', MX, 26, 2, INK);
  const we = 'WORLD EDITION';
  cv.text(we, RX - cv.textW(we, 2), 26, 2, INK);
  cv.hline(MX, 52, RX - MX, INK, 2);

  // Masthead
  cv.center('The World Today', 64, 8, INK);
  cv.hline(MX, 132, RX - MX, INK, 3);
  cv.hline(MX, 138, RX - MX, INK, 1);

  // ---- Lead story ----
  const leadX = MX;
  const leadW = 624;
  const colX = 676;
  const colW = RX - colX; // 312
  cv.text('DIPLOMACY', leadX, 154, 2, RED);
  cv.text('| UKRAINE WAR', leadX + cv.textW('DIPLOMACY ', 2), 154, 2, INK);
  cv.text("TRUMP URGES PUTIN TO END", leadX, 178, 4, INK);
  cv.text("'MILITARY AGGRESSION'", leadX, 212, 4, INK);
  cv.text('IN EUROPE', leadX, 246, 4, INK);

  // Lead art panel: sky, globe, two flags, a red arrow pulling back.
  const artX = leadX;
  const artY = 288;
  const artW = leadW;
  const artH = 212;
  cv.rect(artX, artY, artW, artH, SKY);
  cv.rect(artX, artY, artW, 2, INK);
  cv.rect(artX, artY + artH - 2, artW, 2, INK);
  cv.rect(artX, artY, 2, artH, INK);
  cv.rect(artX + artW - 2, artY, 2, artH, INK);
  drawGlobe(cv, artX + 165, artY + 106, 82);
  drawFlag(cv, artX + 400, artY + 118, 92, 58, 'us');
  drawFlag(cv, artX + 512, artY + 118, 92, 58, 'ru');
  // red arrow curving away from the Russian flag, back toward the globe
  cv.line(artX + 512, artY + 96, artX + 452, artY + 62, RED, 4);
  cv.line(artX + 452, artY + 62, artX + 400, artY + 66, RED, 4);
  cv.line(artX + 400, artY + 66, artX + 414, artY + 52, RED, 4);
  cv.line(artX + 400, artY + 66, artX + 414, artY + 80, RED, 4);
  cv.text('WASHINGTON - MOSCOW', artX + 12, artY + artH - 22, 2, [70, 70, 70]);

  // Lead body
  cv.para(
    "President Donald Trump said on Thursday he told Vladimir Putin last week to pull back Russia's military aggression across Europe, in the hope it could lead to a quick settlement of the war in Ukraine.",
    leadX, 516, leadW, 2, INK,
  );
  cv.para(
    'Mr Zelensky warned separately that Russia is preparing a new mass strike in the coming days.',
    leadX, 612, leadW, 2, INK,
  );

  // ---- Right column: Thanksgiving storm ----
  cv.text('WEATHER', colX, 154, 2, RED);
  cv.text('THANKSGIVING', colX, 178, 3, INK);
  cv.text('STORM CUTS', colX, 202, 3, INK);
  cv.text('POWER TO 724,000', colX, 226, 3, INK);
  cv.rect(colX, 258, colW, 120, [196, 208, 220]);
  cv.rect(colX, 258, colW, 2, INK);
  cv.rect(colX, 376, colW, 2, INK);
  drawStorm(cv, colX, 258, colW, 120);
  cv.para(
    'Nearly 400 flights were cancelled and more than 2,000 delayed on the US East Coast as a storm hit Thanksgiving travel. About 724,000 homes and businesses lost power.',
    colX, 392, colW, 2, INK,
  );

  // ---- Rule, then three columns ----
  cv.hline(MX, 652, RX - MX, INK, 2);

  const cols: { x: number; kicker: string; head: string[]; body: string; icon: (cv: Canvas, cx: number, y: number) => void }[] = [
    {
      x: MX, kicker: 'MIDDLE EAST', head: ['HOUTHI CLAIM', 'SAUDI REFINERY', 'STRIKE; OIL $97'],
      body: "Houthi rebels claimed a strike on Saudi Arabia's largest refinery, lifting Brent crude to near $97 a barrel.",
      icon: drawFlame,
    },
    {
      x: 364, kicker: 'EUROPE', head: ["SPAIN'S DE COS", 'TO LEAD THE ECB'],
      body: "Spain's Pablo Hernandez de Cos has been selected as the next president of the European Central Bank.",
      icon: drawBank,
    },
    {
      x: 692, kicker: 'UKRAINE', head: ['ZELENSKY WARNS', 'OF NEW MASS', 'STRIKE'],
      body: 'President Zelensky said Ukraine has information that Russia is planning a new mass strike in the coming days.',
      icon: drawShield,
    },
  ];
  for (const c of cols) {
    const cw = 296;
    cv.text(c.kicker, c.x, 664, 2, RED);
    let hy = 686;
    for (const ln of c.head) {
      cv.text(ln, c.x, hy, 3, INK);
      hy += 24;
    }
    c.icon(cv, c.x + Math.floor(cw / 2), hy + 6);
    cv.para(c.body, c.x, hy + 56, cw, 2, INK);
  }

  // ---- Ticker band: also today ----
  const bandY = 928;
  cv.rect(MX, bandY, RX - MX, 82, INK);
  cv.text('ALSO TODAY', MX + 12, bandY + 10, 2, [240, 200, 40]);
  cv.text('SEOUL REPATRIATES SIX NORTH KOREANS  |  NZ COALITION SHORT OF MAJORITY', MX + 12, bandY + 30, 2, [255, 255, 255]);
  cv.text('UK NET MIGRATION LOWEST SINCE 1997  |  TOKYO INFLATION 2.9%', MX + 12, bandY + 48, 2, [255, 255, 255]);
  cv.text('GUKESH-SINDAROV LEVEL  |  NZ 246/5  |  TWO ITALIANS KILLED IN KUWAIT', MX + 12, bandY + 66, 2, [255, 255, 255]);

  return encodePNG(W, H, cv.px);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), drawPage());
