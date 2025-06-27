const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let w, h, img;

// 初期化＆リサイズ対応
function resize() {
  w = canvas.width  = innerWidth;
  h = canvas.height = innerHeight;
  img = ctx.createImageData(w, h);
  draw(0, 0, 3);  // 中心(0,0), スケール3
}
window.addEventListener('resize', resize);
resize();

// マンデルブロマップを計算して描画
function draw(offsetX, offsetY, scale) {
  const maxIter = 100;
  // 画面全体を走査
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      // 1) このピクセルの「複素平面での座標 c」
      const c_re = (px - w/2) / (w/scale) + offsetX;
      const c_im = (py - h/2) / (h/scale) + offsetY;

      // 2) z を 0 で初期化
      let x = 0,
          y = 0,
          iter = 0;

      // 3) 反復計算
      while (x*x + y*y <= 4 && iter < maxIter) {
        const x2 = x*x - y*y + c_re;
        y = 2*x*y + c_im;
        x = x2;
        iter++;
      }

      // 4) 色決め
      const pix = (py * w + px) * 4;
      if (iter === maxIter) {
        // 黒
        img.data[pix]   = 0;
        img.data[pix+1] = 0;
        img.data[pix+2] = 0;
      } else {
        // 発散までのイテレーション数でグレースケール
        const c = 255 - Math.floor(255 * iter / maxIter);
        img.data[pix]   = c;
        img.data[pix+1] = c;
        img.data[pix+2] = c;
      }
      img.data[pix+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ズーム＆ドラッグ操作（超シンプル版）
let scale = 3, cx = 0, cy = 0;
canvas.addEventListener('wheel', e => {
  scale *= e.deltaY < 0 ? 0.8 : 1.25;
  draw(cx, cy, scale);
});
canvas.addEventListener('mousedown', e => {
  const sx = e.clientX, sy = e.clientY;
  function onmove(ev) {
    const dx = (ev.clientX - sx)/ (w/scale);
    const dy = (ev.clientY - sy)/ (h/scale);
    draw(cx=-dx, cy=-dy, scale);
  }
  window.addEventListener('mousemove', onmove);
  window.addEventListener('mouseup', _ => {
    window.removeEventListener('mousemove', onmove);
  }, { once: true });
});
