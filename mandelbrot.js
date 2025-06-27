// mandelbrot.js
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');

// 実部の幅（ズーム=1 時の範囲）
const BASE_REAL_WIDTH = 3.5;

// 描画ステート
let width, height, dpr;
let zoom = 1;
let offsetX = -0.5, offsetY = 0;

// 図形再計算用
let realFactor, imagFactor;
function updateFactors() {
  const realWidth  = BASE_REAL_WIDTH / zoom;
  const realHeight = realWidth * (height / width);
  realFactor = realWidth  / (width - 1);
  imagFactor = realHeight / (height - 1);
}

// 描画ルーチン
function draw() {
  updateFactors();
  const img = ctx.createImageData(width, height);
  const maxIter = 100;
  for (let py = 0; py < height; py++) {
    const c_im = offsetY + (height/2 - py) * imagFactor;
    for (let px = 0; px < width; px++) {
      const c_re = offsetX + (px - width/2) * realFactor;
      let x = 0, y = 0, iter = 0;
      while (x*x + y*y <= 4 && iter < maxIter) {
        const x2 = x*x - y*y + c_re;
        y = 2*x*y + c_im;
        x = x2;
        iter++;
      }
      const p = 4*(py*width + px);
      const col = iter === maxIter ? 0 : 255 - Math.floor(255 * iter / maxIter);
      img.data[p  ] = col;
      img.data[p+1] = col;
      img.data[p+2] = col;
      img.data[p+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// サイズ調整＆初期描画
function resize() {
  // CSS 上のサイズ
  const box = canvas.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  canvas.style.width  = `${box.width}px`;
  canvas.style.height = `${box.height}px`;
  canvas.width  = Math.floor(box.width  * dpr);
  canvas.height = Math.floor(box.height * dpr);
  width  = canvas.width;
  height = canvas.height;
  ctx.scale(dpr, dpr);
  draw();
}

window.addEventListener('resize', resize);
window.addEventListener('DOMContentLoaded', resize);

// ズームの焦点を「操作座標」に合わせる
function getEventPos(e) {
  const r = canvas.getBoundingClientRect();
  const sx = (e.clientX - r.left)  * (canvas.width  / r.width);
  const sy = (e.clientY - r.top)   * (canvas.height / r.height);
  return { x: sx, y: sy };
}

// ホイールズーム（操作位置を焦点に）
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const { x, y } = getEventPos(e);
  updateFactors();
  const re0 = offsetX + (x - width/2) * realFactor;
  const im0 = offsetY + (height/2 - y) * imagFactor;
  // ズーム係数
  zoom *= e.deltaY < 0 ? 1.2 : 1/1.2;
  updateFactors();
  // 焦点位置を維持
  offsetX = re0 - (x - width/2) * realFactor;
  offsetY = im0 - (height/2 - y) * imagFactor;
  draw();
});

// マウスドラッグでパン
canvas.addEventListener('mousedown', e => {
  e.preventDefault();
  const start = getEventPos(e);
  const oX = offsetX, oY = offsetY;
  function onMove(ev) {
    const cur = getEventPos(ev);
    offsetX = oX - (cur.x - start.x) * realFactor;
    offsetY = oY + (cur.y - start.y) * imagFactor;
    draw();
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', ()=>window.removeEventListener('mousemove', onMove), { once:true });
});

// タッチ（パン／ピンチ）対応
let touchMode, startDist, startZoom, touchStart, startOffX, startOffY;
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length === 1) {
    touchMode = 'pan';
    const p = getEventPos(e.touches[0]);
    touchStart = p;
    startOffX = offsetX; startOffY = offsetY;
  }
  else if (e.touches.length === 2) {
    touchMode = 'pinch';
    const p0 = getEventPos(e.touches[0]);
    const p1 = getEventPos(e.touches[1]);
    touchStart = { x:(p0.x+p1.x)/2, y:(p0.y+p1.y)/2 };
    startDist = Math.hypot(p0.x-p1.x, p0.y-p1.y);
    startZoom = zoom;
    startOffX = offsetX; startOffY = offsetY;
  }
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (touchMode === 'pan' && e.touches.length===1) {
    const cur = getEventPos(e.touches[0]);
    offsetX = startOffX - (cur.x - touchStart.x) * realFactor;
    offsetY = startOffY + (cur.y - touchStart.y) * imagFactor;
    draw();
  }
  else if (touchMode === 'pinch' && e.touches.length===2) {
    const p0 = getEventPos(e.touches[0]);
    const p1 = getEventPos(e.touches[1]);
    const dist = Math.hypot(p0.x-p1.x, p0.y-p1.y);
    updateFactors();
    const re0 = offsetX + (touchStart.x - width/2) * realFactor;
    const im0 = offsetY + (height/2 - touchStart.y) * imagFactor;
    zoom = startZoom * dist / startDist;
    updateFactors();
    offsetX = re0 - (touchStart.x - width/2) * realFactor;
    offsetY = im0 - (height/2 - touchStart.y) * imagFactor;
    draw();
  }
});
canvas.addEventListener('touchend', e => { if(e.touches.length===0) touchMode=null; });
