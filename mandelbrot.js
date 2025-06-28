// mandelbrot.js
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// 初期設定
let width, height, dpr;
const BASE_WIDTH = 3.5; // ズーム1.0時の実軸範囲
let zoom = 1;
let offsetX = -0.5, offsetY = 0;

// 描画パラメータ
let realFactor, imagFactor;
function updateFactors() {
  const realW = BASE_WIDTH / zoom;
  const realH = realW * (height/width);
  realFactor = realW/(width-1);
  imagFactor = realH/(height-1);
}

// 初期リサイズ＆描画
function resize() {
  const rect = canvas.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  canvas.style.width = rect.width+'px';
  canvas.style.height = rect.height+'px';
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  width = canvas.width; height = canvas.height;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  draw();
}
window.addEventListener('DOMContentLoaded', resize);
window.addEventListener('resize', resize);

// マウス／タッチ座標→内部ピクセル
function toCanvasPos(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (canvas.width/rect.width);
  const y = (clientY - rect.top)  * (canvas.height/rect.height);
  return { x, y };
}

// 描画
function draw() {
  updateFactors();
  const img = ctx.createImageData(width, height);
  const maxIter=100;
  for(let py=0; py<height; py++){
    const c_im = offsetY + (height/2 - py)*imagFactor;
    for(let px=0; px<width; px++){
      const c_re = offsetX + (px - width/2)*realFactor;
      let x=0, y=0, iter=0;
      while(x*x+y*y<=4 && iter<maxIter){
        const x2 = x*x - y*y + c_re;
        y = 2*x*y + c_im;
        x = x2;
        iter++;
      }
      const p=(py*width+px)*4;
      const col = iter===maxIter?0:255 - Math.floor(255*iter/maxIter);
      img.data[p]  = col;
      img.data[p+1]= col;
      img.data[p+2]= col;
      img.data[p+3]= 255;
    }
  }
  ctx.putImageData(img, 0,0);
}

// ホイールズーム：操作点を焦点に
canvas.addEventListener('wheel', e=>{
  e.preventDefault();
  const {x, y} = toCanvasPos(e.clientX, e.clientY);
  updateFactors();
  const re0 = offsetX + (x - width/2)*realFactor;
  const im0 = offsetY + (height/2 - y)*imagFactor;
  zoom *= e.deltaY<0?1.2:1/1.2;
  updateFactors();
  offsetX = re0 - (x - width/2)*realFactor;
  offsetY = im0 - (height/2 - y)*imagFactor;
  draw();
});

// マウスパン
canvas.addEventListener('mousedown', e=>{
  e.preventDefault();
  const start = toCanvasPos(e.clientX, e.clientY);
  const oX = offsetX, oY = offsetY;
  function onMove(ev) {
    const cur = toCanvasPos(ev.clientX, ev.clientY);
    offsetX = oX - (cur.x - start.x)*realFactor;
    offsetY = oY + (cur.y - start.y)*imagFactor;
    draw();
  }
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', ()=>window.removeEventListener('mousemove', onMove), {once:true});
});

// タッチ対応（パン／ピンチ）
let touchMode, touchStart, startDist, startZoom, startOX, startOY;
canvas.addEventListener('touchstart', e=>{
  e.preventDefault();
  if(e.touches.length===1){
    touchMode='pan';
    touchStart = toCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    startOX = offsetX; startOY = offsetY;
  } else if(e.touches.length===2){
    touchMode='pinch';
    const p0 = toCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    const p1 = toCanvasPos(e.touches[1].clientX, e.touches[1].clientY);
    touchStart = {x:(p0.x+p1.x)/2, y:(p0.y+p1.y)/2};
    startDist = Math.hypot(p0.x-p1.x, p0.y-p1.y);
    startZoom = zoom;
    startOX = offsetX; startOY = offsetY;
  }
});
canvas.addEventListener('touchmove', e=>{
  e.preventDefault();
  if(touchMode==='pan' && e.touches.length===1){
    const cur = toCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    offsetX = startOX - (cur.x - touchStart.x)*realFactor;
    offsetY = startOY + (cur.y - touchStart.y)*imagFactor;
    draw();
  }
  else if(touchMode==='pinch' && e.touches.length===2){
    const p0 = toCanvasPos(e.touches[0].clientX, e.touches[0].clientY);
    const p1 = toCanvasPos(e.touches[1].clientX, e.touches[1].clientY);
    const dist = Math.hypot(p0.x-p1.x, p0.y-p1.y);
    updateFactors();
    const re0 = offsetX + (touchStart.x - width/2)*realFactor;
    const im0 = offsetY + (height/2 - touchStart.y)*imagFactor;
    zoom = startZoom * dist / startDist;
    updateFactors();
    offsetX = re0 - (touchStart.x - width/2)*realFactor;
    offsetY = im0 - (height/2 - touchStart.y)*imagFactor;
    draw();
  }
});
canvas.addEventListener('touchend', e=>{
  if(e.touches.length===0) touchMode=null;
});
