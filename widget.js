// widget.js
(function(){
  // ① <div id="gh-widget"></div> があればそこに、なければ script タグの親に挿入
  var target = document.getElementById('gh-widget') || document.currentScript.parentNode;
  // ② iframe を生成して設定
  var ifr = document.createElement('iframe');
  ifr.src    = 'https://hinoko0122.github.io/Mandelbrot/';
  ifr.style  = 'width:100%; height:600px; border:0;';
  ifr.loading = 'lazy';
  // ③ 埋め込み
  target.appendChild(ifr);
})();
