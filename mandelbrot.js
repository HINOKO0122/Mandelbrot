// mandelbrot.js

const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

let w, h;
const realSpan = 3.5;
let zoom    = 1,
    offsetX = -0.5,
    offsetY = 0;
let reFactor, imFactor;

// タッチ用ステート
let touchMode = null,
    startDist = 0,
    startZoom = 1,
    startOffX,
    startOffY,
    startX,
    startY;

// マッピング係数を更新
function updateFactors() {
  const realWidth  = realSpan / zoom;
  const realHeight = realWidth * (h / w);
  reFactor = realWidth  / (w - 1);
  imFactor = realHeight / (h - 1);
}

// 描画ルーチン
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
      const col = iter === maxIter
                ? 0
                : 255 - Math.floor(255 * iter / maxIter);
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

  // CSS サイズ
  canvas.style.width  = cw + 'px';
  canvas.style.height = ch + 'px';
  // 実ピクセル解像度
  canvas.width  = cw * dpr;
  canvas.height = ch * dpr;

  w = canvas.width;
  h = canvas.height;
  draw();
}

window.addEventListener('DOMContentLoaded', resize);
window.addEventListener('resize', resize);

// マウスホイールでズーム
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoom *= e.deltaY < 0 ? 1.2 : 1/1.2;
  draw();
});

// マウスドラッグでパン
canvas.addEventListener('mousedown', e => {
  startX = e.clientX;
  startY = e.clientY;
  startOffX = offsetX;
  startOffY = offsetY;

  function onMove(ev) {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    offsetX = startOffX - dx * reFactor;
    offsetY = startOffY + dy * imFactor;
    draw();
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', onMove);
  }, { once: true });
});

// タッチスタート（パン or ピンチ判定）
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    touchMode  = 'pan';
    startX     = e.touches[0].clientX;
    startY     = e.touches[0].clientY;
    startOffX  = offsetX;
    startOffY  = offsetY;
  } else if (e.touches.length === 2) {
    touchMode  = 'pinch';
    const dx    = e.touches[0].clientX - e.touches[1].clientX;
    const dy    = e.touches[0].clientY - e.touches[1].clientY;
    startDist   = Math.hypot(dx, dy);
    startZoom   = zoom;
  }
});

// タッチムーブ
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (touchMode === 'pan' && e.touches.length === 1) {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    offsetX = startOffX - dx * reFactor;
    offsetY = startOffY + dy * imFactor;
    draw();
  } else if (touchMode === 'pinch' && e.touches.length === 2) {
    const dx   = e.touches[0].clientX - e.touches[1].clientX;
    const dy   = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    zoom = startZoom * dist / startDist;
    draw();
  }
});

// タッチエンド
canvas.addEventListener('touchend', e => {
  if (e.touches.length === 0) touchMode = null;
});
