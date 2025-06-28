// mandelbrot.js
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// 初期表示の実部幅（ズーム=1.0）
const BASE_REAL_WIDTH = 3.5;
let zoom     = 1;
let offsetX  = -0.5; // 初期オフセット（中心寄せ）
let offsetY  = 0;

let width, height, dpr;
let realFactor, imagFactor;

// デバイスによって描画負荷を変更
const isMobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
const MAX_ITER = isMobile ? 80 : 120;

// 非同期描画制御
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

// キャンバスサイズと倍率計算
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  canvas.style.width  = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  canvas.width  = Math.floor(rect.width  * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  width  = canvas.width;
  height = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); // リセット
  ctx.scale(dpr, dpr);
  updateFactors();
  requestDraw();
}

function updateFactors() {
  const realW  = BASE_REAL_WIDTH / zoom;
  const realH  = realW * (height / width);
  realFactor   = realW / (width - 1);
  imagFactor   = realH / (height - 1);
}

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
      img.data[idx]     = col;
      img.data[idx + 1] = col;
      img.data[idx + 2] = col;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ポインタ座標 → ピクセル座標
function getCanvasPos(ev) {
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const y = (ev.clientY - rect.top)  * (canvas.height / rect.height);
  return { x, y };
}

// wheelズーム（カーソル位置を焦点に）
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const { x, y } = getCanvasPos(e);
  const re0 = offsetX + (x - width/2) * realFactor;
  const im0 = offsetY + (height/2 - y) * imagFactor;
  zoom *= e.deltaY < 0 ? 1.2 : 1 / 1.2;
  updateFactors();
  offsetX = re0 - (x - width/2) * realFactor;
  offsetY = im0 - (height/2 - y) * imagFactor;
  requestDraw();
});

// パン操作（マウス）
canvas.addEventListener('mousedown', e => {
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
let touchMode = null;
let pinchStart, pinchZoom0, offset0X, offset0Y, pinchMid;

canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    touchMode = 'pan';
    pinchStart = getCanvasPos(e.touches[0]);
    offset0X = offsetX; offset0Y = offsetY;
  } else if (e.touches.length === 2) {
    touchMode = 'pinch';
    const p0 = getCanvasPos(e.touches[0]);
    const p1 = getCanvasPos(e.touches[1]);
    pinchMid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    pinchStart = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    pinchZoom0 = zoom;
    offset0X = offsetX; offset0Y = offsetY;
  }
});

canvas.addEventListener('touchmove', e => {
  if (touchMode === 'pan' && e.touches.length === 1) {
    const cur = getCanvasPos(e.touches[0]);
    offsetX = offset0X - (cur.x - pinchStart.x) * realFactor;
    offsetY = offset0Y + (cur.y - pinchStart.y) * imagFactor;
    requestDraw();
  } else if (touchMode === 'pinch' && e.touches.length === 2) {
    const p0 = getCanvasPos(e.touches[0]);
    const p1 = getCanvasPos(e.touches[1]);
    const curDist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    const re0 = offset0X + (pinchMid.x - width/2) * realFactor;
    const im0 = offset0Y + (height/2 - pinchMid.y) * imagFactor;
    zoom = pinchZoom0 * (curDist / pinchStart);
    updateFactors();
    offsetX = re0 - (pinchMid.x - width/2) * realFactor;
    offsetY = im0 - (height/2 - pinchMid.y) * imagFactor;
    requestDraw();
  }
});

canvas.addEventListener('touchend', e => {
  if (e.touches.length === 0) touchMode = null;
});

// 初回表示
window.addEventListener('resize', resize);
