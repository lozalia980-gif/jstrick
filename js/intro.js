/* Xidecode :: animación de entrada de la landing.
   1) pantalla negra y cuatro haces de luz que viajan al centro, 2) se juntan y forman el logo,
   3) el logo gira hacia la izquierda mientras aparece el nombre a su derecha, 4) el conjunto vuela hasta su sitio en el menú
   y la pantalla negra se abre desde el centro. Se muestra una vez por sesión; se puede saltar con clic, Esc o el botón. */
(function () {
  var doc = document, root = doc.documentElement, ov = doc.getElementById('intro');
  if (!ov || !root.classList.contains('intro-on')) return;
  var cv = ov.querySelector('canvas'), ctx = cv.getContext('2d'), bg = ov.querySelector('.in-bg'), lock = ov.querySelector('.in-lock'),
    logo = ov.querySelector('.in-logo'), txt = ov.querySelector('.in-text'), skip = ov.querySelector('.in-skip');
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = 0, done = false, anims = [], timers = [];
  var PINK = [255, 126, 182], CYAN = [79, 216, 255];
  var ms = /[?&]introslow(?:=(\d+))?/.exec(location.search), K = ms ? (+ms[1] || 6) : 1;   /* ?introslow=N la hace N veces más lenta (para revisarla) */

  function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size();
  var L = Math.max(96, Math.min(190, Math.min(W, H) * 0.22));
  lock.style.setProperty('--L', L + 'px');
  var GAP = L * (10 / 34);
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')'; }

  function finish(fast) {
    if (done) return; done = true;
    cancelAnimationFrame(raf); timers.forEach(clearTimeout); anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* nada */ } });
    try { sessionStorage.setItem('xide:intro', '1'); } catch (e) { /* sin almacenamiento */ }
    ov.remove(); root.classList.remove('intro-on');
    doc.dispatchEvent(new Event('xidecode:intro-done'));
  }
  skip.addEventListener('click', function (e) { e.stopPropagation(); finish(true); });
  ov.addEventListener('click', function () { finish(true); });
  doc.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { finish(true); doc.removeEventListener('keydown', onKey); } });
  timers.push(setTimeout(function () { finish(true); }, 9000 * K));   /* red de seguridad */
  function later(fn, ms) { timers.push(setTimeout(fn, ms * K)); }
  function anim(el, kf, opt) { opt.duration *= K; if (opt.delay) opt.delay *= K; var a = el.animate(kf, opt); anims.push(a); return a.finished.catch(function () { /* cancelada */ }); }

  /* ---- 1 y 2: haces de luz ---- */
  var corners = [[-.08, -.08, PINK], [1.08, -.08, CYAN], [-.08, 1.08, PINK], [1.08, 1.08, CYAN]];
  var T = 800 * K, t0 = 0, flash = -1;
  function frame(now) {
    if (done) return;
    if (!t0) t0 = now;
    var t = now - t0, p = Math.min(1, t / T), e = p * p * (3 - 2 * p) * 0.4 + Math.pow(p, 2.4) * 0.6;
    var cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    if (p < 1) {
      corners.forEach(function (c) {
        var sx = c[0] * W, sy = c[1] * H, hx = sx + (cx - sx) * e, hy = sy + (cy - sy) * e, tl = Math.min(e, 0.32), tx = hx - (cx - sx) * tl, ty = hy - (cy - sy) * tl;
        var g = ctx.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, rgba(c[2], 0)); g.addColorStop(1, rgba(c[2], 0.95));
        ctx.strokeStyle = g; ctx.lineWidth = 3.2; ctx.shadowColor = rgba(c[2], 1); ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(hx, hy, 2.6, 0, 6.283); ctx.fill();
      });
    } else {
      if (flash < 0) { flash = t; showLogo(); }
      var f = Math.min(1, (t - flash) / (520 * K)), r = (1 - Math.pow(1 - f, 3)) * Math.max(W, H) * 0.35;
      var gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, r)); gr.addColorStop(0, 'rgba(255,255,255,' + (0.55 * (1 - f)).toFixed(3) + ')'); gr.addColorStop(0.35, rgba(PINK, 0.25 * (1 - f))); gr.addColorStop(0.7, rgba(CYAN, 0.18 * (1 - f))); gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
      ctx.shadowBlur = 0; ctx.strokeStyle = rgba(CYAN, 0.5 * (1 - f)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.stroke();
      if (f >= 1) { ctx.clearRect(0, 0, W, H); return; }
    }
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }

  /* ---- 2: aparece el logo ---- */
  function showLogo() {
    lock.style.opacity = '1';
    anim(logo, [{ transform: 'scale(.55)', opacity: 0, filter: 'brightness(2.4)' }, { transform: 'scale(1.06)', opacity: 1, filter: 'brightness(1.5)', offset: .55 }, { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
    later(nameStep, 560);
  }

  /* ---- 3: el logo gira hacia la izquierda y salen las letras a su derecha ---- */
  function nameStep() {
    var span = txt.firstElementChild; txt.style.width = 'auto'; var full = Math.ceil(span.getBoundingClientRect().width) + 2; txt.style.width = '0px';
    var d = 1000, ease = 'cubic-bezier(.22,.8,.18,1)';
    anim(logo, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], { duration: d, easing: ease });
    anim(txt, [{ width: '0px', marginLeft: '0px' }, { width: full + 'px', marginLeft: GAP + 'px' }], { duration: d, easing: ease, fill: 'forwards' });
    anim(span, [{ transform: 'translateX(-40%)', opacity: 0, filter: 'blur(6px)' }, { transform: 'translateX(0)', opacity: 1, filter: 'blur(0)' }], { duration: d, easing: ease, fill: 'backwards' });
    later(flyStep, d + 380);
  }

  /* ---- 4: el conjunto vuela a su lugar en el menú y la pantalla se abre ---- */
  function flyStep() {
    var brand = doc.querySelector('.brand'), r = lock.getBoundingClientRect(), b = brand ? brand.getBoundingClientRect() : null, bl = brand && brand.querySelector('img');
    var lr = logo.getBoundingClientRect(), tr = bl ? bl.getBoundingClientRect() : null;
    var s = tr ? tr.width / lr.width : 0.25, dx = (tr ? tr.left : (b ? b.left : 20)) - lr.left, dy = (tr ? tr.top : 20) - lr.top;
    var d = 800, ease = 'cubic-bezier(.65,0,.2,1)';
    lock.style.transformOrigin = lr.left - r.left + 'px ' + (lr.top - r.top) + 'px';
    var fly = anim(lock, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }], { duration: d, easing: ease, fill: 'forwards' });
    var R = Math.hypot(W, H) / 2 + 40;
    anim(bg, [{ '--r': '0px' }, { '--r': R + 'px' }], { duration: 1000, delay: 250, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    fly.then(function () { root.classList.add('intro-landed'); });
    later(function () { finish(false); }, 1300);
  }

    raf = requestAnimationFrame(frame);
})();
