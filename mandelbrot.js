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
function draw(cx, cy, scale) {
  const maxIter = 100;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let zx = (x - w/2)/ (w/scale) + cx;
      let zy = (y - h/2)/ (h/scale) + cy;
      let i = 0;
      while (zx*zx + zy*zy < 4 && i < maxIter) {
        const xt = zx*zx - zy*zy + cx;
        zy = 2*zx*zy + cy;
        zx = xt;
        i++;
      }
      const p = (y*w + x)*4;
      const c = i === maxIter ? 0 : 255 - Math.floor(255*i/maxIter);
      img.data[p  ] = c;
      img.data[p+1] = c;
      img.data[p+2] = c;
      img.data[p+3] = 255;
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
