// mandelbrot.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.24.0/firebase-app.js"; // もし要らなければ消してください

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

let w, h;
const realSpan0 = 3.5;  // 初期の横幅（ズーム1.0時の実数レンジ）
let zoom    = 1;
let offsetX = -0.5;     // 真ん中に来るように初期オフセット
let offsetY =  0;
let reFactor, imFactor;

// タッチ用ステート（ピンチ焦点対応）
let touchMode = null,
    startDist = 0,
    startZoom = 1,
    startOffX = 0,
    startOffY = 0,
    midX = 0,
    midY = 0;

// 再計算用
function updateFactors() {
  // 拡大倍率を反映した実数範囲
  const realWidth  = realSpan0 / zoom;
  const realHeight = realWidth * (h / w);
  reFactor = realWidth  / (w - 1);
  imFactor = realHeight / (h - 1);
}

// 描画
function draw() {
  updateFactors();
  const img     = ctx.createImageData(w, h);
  const maxIter = 100;
  for (let py = 0; py < h; py++) {
    const c_im = offsetY + (h/2 - py) * imFactor;
    for (let px = 0; px < w; px++) {
      const c_re = offsetX + (px - w/2) * reFactor;
      let x = 0, y = 0, iter = 0;
      while (x*x + y*y <= 4 && iter < maxIter) {
        const x2 = x*x - y*y + c_re;
        y = 2*x*y + c_im;
        x = x2;
        iter++;
      }
      const p   = (py * w + px) * 4;
      const col = iter === maxIter ? 0 : 255 - Math.floor(255 * iter / maxIter);
      img.data[p  ] = col;
      img.data[p+1] = col;
      img.data[p+2] = col;
      img.data[p+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// リサイズ＆Retina対応
function resize() {
  const cw  = window.innerWidth;
  const ch  = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width  = cw + 'px';
  canvas.style.height = ch + 'px';
  canvas.width  = cw * dpr;
  canvas.height = ch * dpr;
  w = canvas.width;
  h = canvas.height;
  draw();
}

window.addEventListener('DOMContentLoaded', resize);
window.addEventListener('resize', resize);

// ホイールズーム（キャンバス中心でズーム）
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  // キャンバス中心座標
  const cx = w/2;
  const cy = h/2;
  // 現在中心点の実軸／虚軸値
  updateFactors();
  const real0 = offsetX + (cx - w/2) * reFactor;
  const imag0 = offsetY + (h/2 - cy) * imFactor;
  // ズーム適用
  zoom *= e.deltaY < 0 ? 1.2 : 1/1.2;
  // 再計算後に中心点を real0/imag0に固定
  updateFactors();
  offsetX = real0 - (cx - w/2) * reFactor;
  offsetY = imag0 - (h/2 - cy) * imFactor;
  draw();
});

// マウスドラッグでパン
canvas.addEventListener('mousedown', e => {
  const sx = e.clientX, sy = e.clientY;
  const oX = offsetX, oY = offsetY;
  function onMove(ev) {
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    offsetX = oX - dx * reFactor;
    offsetY = oY + dy * imFactor;
    draw();
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', onMove);
  }, { once: true });
});

// タッチスタート（パン or ピンチ／焦点記録）
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    touchMode = 'pan';
    startOffX = offsetX;
    startOffY = offsetY;
    midX = e.touches[0].clientX * (canvas.width / canvas.clientWidth);
    midY = e.touches[0].clientY * (canvas.height / canvas.clientHeight);
  }
  else if (e.touches.length === 2) {
    touchMode = 'pinch';
    // ピンチの焦点
    const x0 = e.touches[0].clientX * (canvas.width / canvas.clientWidth);
    const y0 = e.touches[0].clientY * (canvas.height / canvas.clientHeight);
    const x1 = e.touches[1].clientX * (canvas.width / canvas.clientWidth);
    const y1 = e.touches[1].clientY * (canvas.height / canvas.clientHeight);
    midX = (x0 + x1) / 2;
    midY = (y0 + y1) / 2;
    // 初期距離とズーム・オフセット記録
    const dx = x0 - x1, dy = y0 - y1;
    startDist = Math.hypot(dx, dy);
    startZoom = zoom;
    startOffX = offsetX;
    startOffY = offsetY;
  }
});

// タッチムーブ
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (touchMode === 'pan' && e.touches.length === 1) {
    const nx = e.touches[0].clientX * (canvas.width / canvas.clientWidth);
    const ny = e.touches[0].clientY * (canvas.height / canvas.clientHeight);
    const dx = nx - midX;
    const dy = ny - midY;
    offsetX = startOffX - dx * reFactor;
    offsetY = startOffY + dy * imFactor;
    draw();
  }
  else if (touchMode === 'pinch' && e.touches.length === 2) {
    // 距離変化からズーム
    const dx = e.touches[0].clientX * (canvas.width / canvas.clientWidth)
             - e.touches[1].clientX * (canvas.width / canvas.clientWidth);
    const dy = e.touches[0].clientY * (canvas.height / canvas.clientHeight)
             - e.touches[1].clientY * (canvas.height / canvas.clientHeight);
    const dist = Math.hypot(dx, dy);
    // 焦点 real0/imag0
    updateFactors();
    const real0 = offsetX + (midX - w/2) * reFactor;
    const imag0 = offsetY + (h/2 - midY) * imFactor;
    // 新ズーム
    zoom = startZoom * dist / startDist;
    // 新オフセット
    updateFactors();
    offsetX = real0 - (midX - w/2) * reFactor;
    offsetY = imag0 - (h/2 - midY) * imFactor;
    draw();
  }
});

// タッチエンド
canvas.addEventListener('touchend', e => {
  if (e.touches.length === 0) touchMode = null;
});
