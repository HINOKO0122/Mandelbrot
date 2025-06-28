// mandelbrot.js
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// 基本設定
const BASE_REAL_WIDTH = 3.5;    // ズーム =1.0 時の実軸幅
let zoom    = 1;
let offsetX = -0.5;             // 初期オフセット（中心寄せ）
let offsetY = 0;

let width, height, dpr;
let realFactor, imagFactor;

// スマホなら描画重めを抑制
const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const MAX_ITER = isMobile ? 80 : 120;

// requestAnimationFrame 制御用
let drawPending = false;
function requestDraw() {
  if (!drawPending) {
    drawPending = true;
    requestAnimationFrame(() => {
      drawPending = false;
      draw();
    });
  }
}

// サイズ計算と初回描画
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  canvas.style.width  = rect.width  + 'px';
  canvas.style.height = rect.height + 'px';
  canvas.width  = Math.floor(rect.width  * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  width  = canvas.width;
  height = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  updateFactors();
  requestDraw();
}

// 複素平面 → ピクセル係数再計算
function updateFactors() {
  const realW = BASE_REAL_WIDTH / zoom;
  const realH = realW * (height / width);
  realFactor = realW / (width - 1);
  imagFactor = realH / (height - 1);
}

// 実際の描画ルーチン
function draw() {
  updateFactors();
  const img = ctx.createImageData(width, height);
  for (let py = 0; py < height; py++) {
    const c_im = offsetY + (height/2 - py) * imagFactor;
    for (let px = 0; px < width; px++) {
      const c_re = offsetX + (px - width/2) * realFactor;
      let x = 0, y = 0, iter = 0;
      while (x*x + y*y <= 4 && iter < MAX_ITER) {
        const x2 = x*x - y*y + c_re;
        y = 2*x*y + c_im;
        x = x2;
        iter++;
      }
      const idx = 4 * (py * width + px);
      const col = iter === MAX_ITER ? 0 : 255 - Math.floor(255 * iter / MAX_ITER);
      img.data[idx    ] = col;
      img.data[idx + 1] = col;
      img.data[idx + 2] = col;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// クライアント座標 → キャンバス内ピクセル
function getCanvasPos(ev) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - r.left) * (canvas.width  / r.width),
    y: (ev.clientY - r.top ) * (canvas.height / r.height)
  };
}

// ホイールズーム：操作地点を焦点に
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const { x, y } = getCanvasPos(e);
  const re0 = offsetX + (x - width/2)  * realFactor;
  const im0 = offsetY + (height/2 - y) * imagFactor;
  zoom *= e.deltaY < 0 ? 1.2 : 1/1.2;
  updateFactors();
  offsetX = re0 - (x - width/2)  * realFactor;
  offsetY = im0 - (height/2 - y) * imagFactor;
  requestDraw();
});

// マウスパン
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  const start = getCanvasPos(e);
  const oX = offsetX, oY = offsetY;
  function onMove(ev) {
    const cur = getCanvasPos(ev);
    offsetX = oX - (cur.x - start.x) * realFactor;
    offsetY = oY + (cur.y - start.y) * imagFactor;
    requestDraw();
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', onMove);
  }, { once: true });
});

// タッチ（パン／ピンチ）
let touchMode, pinchStartDist, pinchStartZoom, pinchMid, panStart;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    touchMode = 'pan';
    panStart = getCanvasPos(e.touches[0]);
    pinchStartZoom = zoom;
    pinchMid = { x: panStart.x, y: panStart.y };
  } else if (e.touches.length === 2) {
    touchMode = 'pinch';
    const p0 = getCanvasPos(e.touches[0]);
    const p1 = getCanvasPos(e.touches[1]);
    pinchMid = { x:(p0.x+p1.x)/2, y:(p0.y+p1.y)/2 };
    pinchStartDist = Math.hypot(p1.x-p0.x, p1.y-p0.y);
    pinchStartZoom = zoom;
  }
});

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (touchMode === 'pan' && e.touches.length === 1) {
    const cur = getCanvasPos(e.touches[0]);
    offsetX = offsetX - (cur.x - panStart.x) * realFactor;
    offsetY = offsetY + (cur.y - panStart.y) * imagFactor;
    panStart = cur;
    requestDraw();
  }
  else if (touchMode === 'pinch' && e.touches.length === 2) {
    const p0 = getCanvasPos(e.touches[0]);
    const p1 = getCanvasPos(e.touches[1]);
    const dist = Math.hypot(p1.x-p0.x, p1.y-p0.y);
    // 焦点複素数
    updateFactors();
    const re0 = offsetX + (pinchMid.x - width/2)  * realFactor;
    const im0 = offsetY + (height/2 - pinchMid.y) * imagFactor;
    // 新ズーム
    zoom = pinchStartZoom * (dist / pinchStartDist);
    updateFactors();
    // オフセット調整
    offsetX = re0 - (pinchMid.x - width/2)  * realFactor;
    offsetY = im0 - (height/2 - pinchMid.y) * imagFactor;
    requestDraw();
  }
});

canvas.addEventListener('touchend', e => {
  if (e.touches.length === 0) touchMode = null;
});

// 初期描画＆イベント登録
window.addEventListener('resize', resize);
window.addEventListener('DOMContentLoaded', resize);
