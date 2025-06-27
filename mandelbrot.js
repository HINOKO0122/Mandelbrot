// === グローバル変数 ===
const canvas   = document.getElementById('c');
const ctx      = canvas.getContext('2d');
let w, h;                       // キャンバス幅・高さ (px)
const realSpan = 3.5;           // 初期の複素平面横幅
let zoom    = 1,                // ズーム倍率
    offsetX = -0.5,             // 実数軸中心
    offsetY =  0;               // 虚数軸中心
let reFactor, imFactor;         // 画素→複素平面マッピング係数

// 縦横比を考慮して reFactor/imFactor を計算
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
      const p = (py * w + px) * 4;
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

// リサイズ対応
function resize() {
  w = canvas.width  = window.innerWidth;
  h = canvas.height = window.innerHeight;
  draw();
}
window.addEventListener('resize', resize);
window.addEventListener('DOMContentLoaded', resize);

// マウスホイールでズーム
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  zoom *= e.deltaY < 0 ? 1.2 : 1/1.2;
  draw();
});

// ドラッグでパン
canvas.addEventListener('mousedown', e => {
  const startX = e.clientX, startY = e.clientY;
  const ox = offsetX, oy = offsetY;

  function onmove(ev) {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    offsetX = ox - dx * reFactor;
    offsetY = oy + dy * imFactor;
    draw();
  }

  window.addEventListener('mousemove', onmove);
  window.addEventListener('mouseup', () => {
    window.removeEventListener('mousemove', onmove);
  }, { once: true });
});
