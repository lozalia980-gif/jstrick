/* Xidecode :: portal inmersivo de cada curso (landing): la tarjeta se expande, todo se vuelve negro y aparece un espacio 3D sin fondo
   con scroll: presentación, qué aprenderás, código, qué puedes crear, galería y una pregunta final.
   JT.portal.open(idCurso, elementoTarjeta). Respeta "reducir movimiento" y se detiene al cerrarse. */
(function () {
  var JT = window.JT, doc = document, $ = function (s, r) { return (r || doc).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esc = JT.esc || function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ICON = { code: 'i-code', layers: 'i-layers', bolt: 'i-bolt', term: 'i-term', db: 'i-db', globe: 'i-globe', cube: 'i-cube' };
  function icon(id) { return '<svg class="i" aria-hidden="true"><use href="#' + (ICON[id] || id) + '"/></svg>'; }
  var cur = null, KEY = (JT.STATE_KEY || 'xidecode:estado:v1');

  function rgb(h) { h = String(h || '#61afef').replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function track(id) { for (var i = 0; i < JT.tracks.length; i++) if (JT.tracks[i].id === id) return JT.tracks[i]; return null; }
  function langOf(t) { return t.kind === 'web' ? (t.id === 'js' ? 'js' : t.id) : t.lang; }

  /* contenido: el de portalData o, si no existe, uno armado con el catálogo */
  function dataFor(t) {
    var d = (JT.portalData || {})[t.id], c = JT.catalog[t.id] || { topics: [], code: '', out: '', file: '', lang: 'js', ex: 0, xs: 0, q: 0 };
    var lang = c.lang || langOf(t);
    if (d) {
      d.lang = d.lang || lang;
      return d;
    }
    return {
      lang: lang, hero: t.tagline, intro: t.why, uses: null,
      snippets: c.code ? [[c.file, lang, c.code]] : [],
      slides: [].concat(c.code ? [{ k: 'term', title: c.file, code: c.code, out: c.out }] : [], c.topics.length ? [{ k: 'flow', title: 'Tu ruta en ' + t.name, nodes: c.topics, note: 'Básico, intermedio y avanzado' }] : [])
    };
  }

  /* ---------- plantillas ---------- */
  function windowCode(file, lang, code, extra) {
    return '<div class="pt-win' + (extra ? ' ' + extra : '') + '"><div class="pt-wbar"><i></i><i></i><i></i><span>' + esc(file) + '</span></div><pre class="pt-code">' + JT.highlight(code, lang) + '</pre></div>';
  }
  function slideHtml(s, lang) {
    if (s.k === 'term') return '<div class="pt-win"><div class="pt-wbar"><i></i><i></i><i></i><span>' + esc(s.title) + '</span></div><pre class="pt-code">' + JT.highlight(s.code, lang) + '</pre><div class="pt-out' + (s.err ? ' err' : '') + '"><span>' + (s.err ? 'compilador' : 'salida') + '</span><pre>' + esc(s.out) + '</pre></div></div>';
    if (s.k === 'chart') { var mx = Math.max.apply(null, s.bars.map(function (b) { return b[1]; })); return '<div class="pt-win"><div class="pt-wbar"><i></i><i></i><i></i><span>' + esc(s.title) + '</span></div><div class="pt-chart">' + s.bars.map(function (b, i) { return '<div class="pt-bar" style="--h:' + Math.round(b[1] / mx * 100) + '%;--i:' + i + '"><b>' + b[1] + '</b><i></i><span>' + esc(b[0]) + '</span></div>'; }).join('') + '</div><p class="pt-note">' + esc(s.note || '') + '</p></div>'; }
    if (s.k === 'flow') return '<div class="pt-win"><div class="pt-wbar"><i></i><i></i><i></i><span>' + esc(s.title) + '</span></div><ol class="pt-flow">' + s.nodes.map(function (n, i) { return '<li style="--i:' + i + '"><em>' + (i + 1) + '</em><span>' + esc(n) + '</span></li>'; }).join('') + '</ol><p class="pt-note">' + esc(s.note || '') + '</p></div>';
    if (s.k === 'browser') return '<div class="pt-win"><div class="pt-wbar"><i></i><i></i><i></i><span>' + esc(s.title) + '</span></div><div class="pt-url">' + esc(s.url || '') + '</div><div class="pt-page">' + s.html + '</div></div>';
    if (s.k === 'phone') return '<div class="pt-phone"><div class="pt-notch"></div><h5>' + esc(s.title) + '</h5>' + s.items.map(function (x, i) { return '<div class="pt-item" style="--i:' + i + '"><i></i><span>' + esc(x) + '</span></div>'; }).join('') + '</div>';
    return '';
  }

  function build(t) {
    var d = dataFor(t), c = JT.catalog[t.id] || { topics: [], ex: 0, xs: 0, q: 0 }, lang = d.lang;
    var h = '';
    /* 1. presentación */
    h += '<section class="pt-sec pt-hero"><div class="pt-fx pt-center"><span class="pt-logo"><img src="assets/logos/' + t.id + '.svg" alt="Logo de ' + esc(t.name) + '" width="64" height="64"></span><br><span class="pt-kick">' + icon(t.icon) + ' Curso · 3 niveles</span><h1 class="pt-title">' + esc(t.name) + '</h1><p class="pt-hl">' + esc(d.hero) + '</p><p class="pt-intro">' + esc(d.intro) + '</p>' +
      '<div class="pt-stats"><div><b>' + (c.ex || '—') + '</b><span>ejemplos</span></div><div><b>' + (c.xs || '—') + '</b><span>ejercicios guiados</span></div><div><b>' + (c.q || '—') + '</b><span>preguntas de reto</span></div></div></div><a class="pt-scrollhint" href="#pt-learn" aria-label="Bajar"><span></span></a></section>';
    /* 2. qué aprenderás */
    if (c.topics && c.topics.length) h += '<section class="pt-sec" id="pt-learn"><div class="pt-fx"><span class="pt-eye">Qué vas a aprender</span><h2>Un camino, paso a paso</h2><p class="pt-sub">Cada bloque trae ejemplos explicados pieza por pieza y un ejercicio donde el sistema te corrige mientras escribes.</p><div class="pt-topics">' +
      c.topics.map(function (x, i) { return '<div class="pt-card" data-tilt style="--i:' + i + '"><em>' + String(i + 1).padStart(2, '0') + '</em><span>' + esc(x) + '</span></div>'; }).join('') + '</div></div></section>';
    /* 3. código */
    if (d.snippets && d.snippets.length) h += '<section class="pt-sec"><div class="pt-fx"><span class="pt-eye">Así se ve</span><h2>Código real, explicado línea a línea</h2><p class="pt-sub">En la plataforma cada línea tiene su <b class="pt-q">?</b> que te dice qué hace.</p><div class="pt-wins">' +
      d.snippets.map(function (s, i) { return windowCode(s[0], s[1] || lang, s[2], 'pt-w' + (i % 3)); }).join('') + '</div></div></section>';
    /* 4. qué puedes crear */
    if (d.uses && d.uses.length) h += '<section class="pt-sec"><div class="pt-fx"><span class="pt-eye">Qué puedes crear</span><h2>Lo que este conocimiento te permite hacer</h2><div class="pt-uses">' +
      d.uses.map(function (u, i) { return '<div class="pt-card use" data-tilt style="--i:' + i + '"><span class="pt-ic">' + icon(u[2]) + '</span><b>' + esc(u[0]) + '</b><p>' + esc(u[1]) + '</p></div>'; }).join('') + '</div></div></section>';
    /* 5. galería */
    if (d.slides && d.slides.length) h += '<section class="pt-sec"><div class="pt-fx"><span class="pt-eye">Galería</span><h2>Mira cómo se ve en acción</h2><div class="pt-cf" tabindex="0" aria-roledescription="carrusel" aria-label="Galería de ejemplos"><div class="pt-stage">' +
      d.slides.map(function (s, i) { return '<div class="pt-slide" data-i="' + i + '">' + slideHtml(s, lang) + '</div>'; }).join('') + '</div><button class="pt-nav prev" aria-label="Anterior">' + icon('i-arrow') + '</button><button class="pt-nav next" aria-label="Siguiente">' + icon('i-arrow') + '</button><div class="pt-dots">' +
      d.slides.map(function (s, i) { return '<button aria-label="Ir a la diapositiva ' + (i + 1) + '" data-i="' + i + '"></button>'; }).join('') + '</div></div></div></section>';
    /* 6. final */
    h += '<section class="pt-sec pt-end"><div class="pt-fx pt-center"><span class="pt-eye">Tu decisión</span><h2>¿Te interesa <span class="pt-name">' + esc(t.name) + '</span>?</h2><p class="pt-sub">Entra directo al curso en tu panel, vuelve a mirar los demás o arma tu propia ruta con varios cursos.</p>' +
      '<div class="pt-cta"><a class="pt-btn main" data-act="go" href="app.html#/curso/' + t.id + '">Sí, llévame al curso ' + icon('i-arrow') + '</a><button class="pt-btn" data-act="back" type="button">Volver a la landing</button><button class="pt-btn" data-act="multi" type="button">Quiero elegir varios cursos</button></div>' +
      '<div class="pt-multi" hidden><p>Marca los cursos que quieres aprender; los dejo juntos en tu panel como tu ruta.</p><div class="pt-chips">' +
      JT.tracks.map(function (x) { return '<button type="button" class="pt-chip' + (x.id === t.id ? ' on' : '') + '" data-id="' + x.id + '" style="--c:' + x.color + '" aria-pressed="' + (x.id === t.id) + '"><i></i>' + esc(x.name) + '</button>'; }).join('') + '</div><div class="pt-mfoot"><span class="pt-count"></span><a class="pt-btn main" data-act="route" href="app.html#/panel">Armar mi ruta ' + icon('i-arrow') + '</a></div></div></div></section>';
    return h;
  }

  /* ---------- escena 3D (canvas) ---------- */
  function scene(cv, color, getProg) {
    var ctx = cv.getContext('2d'), W = 0, H = 0, cx = 0, cy = 0, F = 600, dpr = Math.min(window.devicePixelRatio || 1, 1.5), raf = 0, alive = true, t0 = performance.now();
    var C = rgb(color), P = [198, 120, 221];
    var small = innerWidth < 700, NS = small ? 110 : 230, NR = 14, NC = small ? 4 : 7, DEPTH = 3200, RS = 230;
    var stars = [], cubes = [], camZ = 0, last = 0, mx = 0, my = 0, tx = 0, ty = 0, warp = reduce ? 0 : 1;
    function R(a, b) { return a + Math.random() * (b - a); }
    for (var i = 0; i < NS; i++) stars.push({ x: R(-1700, 1700), y: R(-1100, 1100), z: R(0, DEPTH), k: Math.random() });
    for (i = 0; i < NC; i++) cubes.push({ x: (Math.random() < .5 ? -1 : 1) * R(380, 1100), y: R(-500, 500), z: R(0, DEPTH), s: R(50, 110), a: R(0, 6.28), v: R(.2, .7) });
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); cx = W / 2; cy = H / 2; F = Math.min(W, H) * .95; }
    size();
    function onMove(e) { tx = (e.clientX / W - .5) * 2; ty = (e.clientY / H - .5) * 2; }
    window.addEventListener('pointermove', onMove, { passive: true }); window.addEventListener('resize', size);
    function rel(z) { return ((z - camZ) % DEPTH + DEPTH) % DEPTH; }
    function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')'; }
    function frame(now) {
      if (!alive) return;
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
      var t = (now - t0) / 1000, prog = getProg();
      var target = prog * 7000 + t * 26, prev = camZ;
      camZ += (target - camZ) * .08 + warp * 70;
      warp *= .94; if (warp < .01) warp = 0;
      var vel = Math.max(0, camZ - prev);
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      var camX = mx * 160, camY = my * 100;
      ctx.clearRect(0, 0, W, H);
      /* resplandor en el punto de fuga */
      var g = ctx.createRadialGradient(cx - camX * .4, cy - camY * .4, 0, cx, cy, Math.max(W, H) * .6);
      g.addColorStop(0, rgba(C, .16)); g.addColorStop(.5, rgba(C, .04)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      /* túnel de anillos hexagonales */
      ctx.lineWidth = 1.2;
      for (var r = 0; r < NR; r++) {
        var z1 = rel(r * RS * (DEPTH / (NR * RS))), z2 = rel((r + 1) * RS * (DEPTH / (NR * RS)));
        if (z1 < 60) continue;
        var s1 = F / z1, rad = 560, a1 = Math.max(0, 1 - z1 / DEPTH) * .55, rot = r * .22 + t * .08;
        ctx.strokeStyle = rgba(r % 3 === 0 ? P : C, a1); ctx.beginPath();
        for (var v = 0; v <= 6; v++) { var an = rot + v * 1.0472, px = cx + (Math.cos(an) * rad - camX) * s1, py = cy + (Math.sin(an) * rad - camY) * s1; if (v) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
        ctx.stroke();
        if (z2 > z1) {
          var s2 = F / z2, rot2 = (r + 1) * .22 + t * .08;
          ctx.strokeStyle = rgba(C, a1 * .55); ctx.beginPath();
          for (v = 0; v < 6; v++) { var b1 = rot + v * 1.0472, b2 = rot2 + v * 1.0472; ctx.moveTo(cx + (Math.cos(b1) * rad - camX) * s1, cy + (Math.sin(b1) * rad - camY) * s1); ctx.lineTo(cx + (Math.cos(b2) * rad - camX) * s2, cy + (Math.sin(b2) * rad - camY) * s2); }
          ctx.stroke();
        }
      }
      /* estrellas con estela según la velocidad */
      var len = Math.min(260, vel * 1.6);
      for (i = 0; i < stars.length; i++) {
        var s = stars[i], z = rel(s.z); if (z < 40) continue;
        var sc = F / z, sx = cx + (s.x - camX) * sc, sy = cy + (s.y - camY) * sc;
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
        var al = Math.min(1, (1 - z / DEPTH) * 1.4);
        ctx.strokeStyle = rgba(s.k > .75 ? P : C, al); ctx.fillStyle = ctx.strokeStyle;
        if (len > 2) { var sc2 = F / (z + len); ctx.lineWidth = Math.max(.6, sc * 1.8); ctx.beginPath(); ctx.moveTo(cx + (s.x - camX) * sc2, cy + (s.y - camY) * sc2); ctx.lineTo(sx, sy); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(sx, sy, Math.max(.5, sc * 1.6), 0, 6.283); ctx.fill(); }
      }
      /* cubos de alambre flotando */
      ctx.lineWidth = 1.1;
      for (i = 0; i < cubes.length; i++) {
        var cb = cubes[i], zc = rel(cb.z); if (zc < 120) continue;
        var ang = cb.a + t * cb.v, ca = Math.cos(ang), sa = Math.sin(ang), pts = [], sz = cb.s;
        for (var k = 0; k < 8; k++) {
          var X = (k & 1 ? 1 : -1) * sz, Y = (k & 2 ? 1 : -1) * sz, Zq = (k & 4 ? 1 : -1) * sz;
          var x1 = X * ca - Zq * sa, z1c = X * sa + Zq * ca, y1 = Y * Math.cos(ang * .7) - z1c * Math.sin(ang * .7), z2c = Y * Math.sin(ang * .7) + z1c * Math.cos(ang * .7);
          var zz = zc + z2c; if (zz < 30) zz = 30; var q = F / zz;
          pts.push([cx + (cb.x + x1 - camX) * q, cy + (cb.y + y1 - camY) * q]);
        }
        ctx.strokeStyle = rgba(i % 2 ? P : C, Math.max(0, 1 - zc / DEPTH) * .6); ctx.beginPath();
        [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(function (e) { ctx.moveTo(pts[e[0]][0], pts[e[0]][1]); ctx.lineTo(pts[e[1]][0], pts[e[1]][1]); });
        ctx.stroke();
      }
      if (reduce) { alive = false; return; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return { stop: function () { alive = false; cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove); window.removeEventListener('resize', size); } };
  }

  /* ---------- carrusel coverflow ---------- */
  function coverflow(root) {
    var slides = $$('.pt-slide', root), dots = $$('.pt-dots button', root), n = slides.length, idx = 0, sx = null;
    if (!n) return;
    function set(i) {
      idx = (i + n) % n;
      slides.forEach(function (s, k) {
        var d = k - idx; if (d > n / 2) d -= n; if (d < -n / 2) d += n;
        var a = Math.abs(d);
        s.style.transform = 'translate(-50%,-50%) translateX(' + (d * 58) + '%) translateZ(' + (-a * 150) + 'px) rotateY(' + (-d * 40) + 'deg) scale(' + (1 - a * .06) + ')';
        s.style.opacity = a > 2 ? 0 : 1 - a * .28; s.style.zIndex = 10 - a; s.style.pointerEvents = a > 2 ? 'none' : 'auto';
        s.classList.toggle('on', d === 0); s.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      });
      dots.forEach(function (b, k) { b.classList.toggle('on', k === idx); });
    }
    set(0);
    root.addEventListener('click', function (e) {
      if (e.target.closest('.pt-nav.next')) set(idx + 1);
      else if (e.target.closest('.pt-nav.prev')) set(idx - 1);
      else { var dt = e.target.closest('.pt-dots button'); if (dt) set(+dt.dataset.i); else { var sl = e.target.closest('.pt-slide'); if (sl && !sl.classList.contains('on')) set(+sl.dataset.i); } }
    });
    root.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { set(idx + 1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { set(idx - 1); e.preventDefault(); } });
    root.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    root.addEventListener('pointerup', function (e) { if (sx != null && Math.abs(e.clientX - sx) > 50) set(idx + (e.clientX < sx ? 1 : -1)); sx = null; });
  }

  /* ---------- ruta elegida ---------- */
  /* ids: reemplaza la ruta; add: suma un curso a la ruta si ya existía una (si no, no se filtra nada) */
  function saveRoute(ids, add) {
    try {
      var o = {}; try { o = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { o = {}; }
      if (ids && ids.length) { o.ruta = ids; o.lastTrack = ids[0]; }
      if (add) { if (o.ruta && o.ruta.length && o.ruta.indexOf(add) < 0) o.ruta.push(add); o.lastTrack = add; }
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- abrir y cerrar ---------- */
  function open(id, card) {
    if (cur) return;
    var t = track(id); if (!t) { location.href = 'app.html#/curso/' + id; return; }
    var rect = card ? card.getBoundingClientRect() : { left: innerWidth / 2 - 80, top: innerHeight / 2 - 60, width: 160, height: 120 };
    var grow = doc.createElement('div'); grow.className = 'pt-grow'; grow.setAttribute('aria-hidden', 'true');
    grow.style.cssText = '--c:' + t.color + ';left:' + rect.left + 'px;top:' + rect.top + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px';
    var root = doc.createElement('div'); root.className = 'portal'; root.id = 'portal'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Presentación del curso ' + t.name);
    root.style.setProperty('--c', t.color); root.style.setProperty('--rgb', rgb(t.color).join(','));
    root.innerHTML = '<canvas class="pt-canvas" aria-hidden="true"></canvas><div class="pt-prog" aria-hidden="true"><i></i></div><button class="pt-close" type="button" aria-label="Cerrar y volver">' + '&times;' + '</button><div class="pt-scroll" tabindex="-1">' + build(t) + '</div>';
    cur = { t: t, root: root, grow: grow, card: card, rect: rect, sel: [t.id], stop: null };
    doc.body.appendChild(grow); doc.body.appendChild(root);
    var prevOv = doc.documentElement.style.overflow; doc.documentElement.style.overflow = 'hidden'; cur.prevOv = prevOv;
    var sc = $('.pt-scroll', root), bar = $('.pt-prog i', root);
    function prog() { var m = sc.scrollHeight - sc.clientHeight; return m > 0 ? sc.scrollTop / m : 0; }
    /* efecto 3D por posición en pantalla */
    var fx = $$('.pt-fx', root), ticking = false;
    function upd() {
      ticking = false; var vh = sc.clientHeight; bar.style.transform = 'scaleX(' + prog().toFixed(4) + ')';
      if (reduce) return;
      fx.forEach(function (el) {
        var r = el.getBoundingClientRect(), p = (r.top + r.height / 2 - vh / 2) / (vh * .8); p = Math.max(-1.6, Math.min(1.6, p));
        var a = Math.abs(p);
        el.style.transform = 'translate3d(0,0,' + (-a * 170).toFixed(0) + 'px) rotateX(' + (p * -9).toFixed(2) + 'deg)';
        el.style.opacity = Math.max(0, Math.min(1, 1.25 - a * .9)).toFixed(2);
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }
    sc.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', onScroll);
    cur.onScroll = onScroll; cur.sc = sc;
    /* inclinación de las tarjetas */
    root.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('[data-tilt]'); if (!el || reduce) return;
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = 'perspective(700px) rotateY(' + (x * 14).toFixed(1) + 'deg) rotateX(' + (-y * 14).toFixed(1) + 'deg) translateZ(14px)';
    });
    root.addEventListener('pointerout', function (e) { var el = e.target.closest && e.target.closest('[data-tilt]'); if (el) el.style.transform = ''; });
    coverflow($('.pt-cf', root) || root);
    /* acciones */
    function count() { var n = $$('.pt-chip.on', root).length, el = $('.pt-count', root); if (el) el.textContent = n + (n === 1 ? ' curso elegido' : ' cursos elegidos'); }
    root.addEventListener('click', function (e) {
      if (e.target.closest('.pt-close') || e.target.closest('[data-act="back"]')) { close(); return; }
      var hint = e.target.closest('.pt-scrollhint'); if (hint) { e.preventDefault(); var nx = $('#pt-learn', root) || $$('.pt-sec', root)[1]; nx && nx.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); return; }
      if (e.target.closest('[data-act="multi"]')) { var m = $('.pt-multi', root); m.hidden = !m.hidden; count(); if (!m.hidden) m.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); return; }
      var chip = e.target.closest('.pt-chip'); if (chip) { var on = chip.classList.toggle('on'); chip.setAttribute('aria-pressed', on); count(); return; }
      var go = e.target.closest('[data-act="go"]'); if (go) { saveRoute(null, t.id); return; }
      var rt = e.target.closest('[data-act="route"]'); if (rt) { var ids = $$('.pt-chip.on', root).map(function (c) { return c.dataset.id; }); if (!ids.length) { e.preventDefault(); return; } saveRoute(ids); }
    });
    cur.onKey = function (e) { if (e.key === 'Escape') close(); };
    doc.addEventListener('keydown', cur.onKey);
    /* secuencia de entrada */
    if (reduce) { grow.remove(); root.classList.add('show'); cur.stop = scene($('.pt-canvas', root), t.color, prog); upd(); $('.pt-close', root).focus(); return; }
    var me = cur;
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      if (cur !== me) return;
      grow.classList.add('go');
      setTimeout(function () { grow.classList.add('black'); }, 520);
      setTimeout(function () {
        if (cur !== me) return;
        root.classList.add('show'); cur.stop = scene($('.pt-canvas', root), t.color, prog); upd();
        setTimeout(function () { grow.remove(); if (cur === me) $('.pt-close', root).focus({ preventScroll: true }); }, 700);
      }, 780);
    }); });
  }

  function close() {
    if (!cur) return; var c = cur; cur = null;
    doc.removeEventListener('keydown', c.onKey);
    var back = function () {
      if (c.stop) c.stop.stop(); c.root.remove(); c.grow.remove(); doc.documentElement.style.overflow = c.prevOv || '';
      if (c.card && c.card.focus) { var a = $('a', c.card); a && a.focus({ preventScroll: true }); }
    };
    if (reduce) { back(); return; }
    /* la tarjeta vuelve a su sitio */
    var r = c.card ? c.card.getBoundingClientRect() : c.rect;
    c.grow.className = 'pt-grow go black'; c.grow.style.transition = 'none'; doc.body.appendChild(c.grow);
    c.root.classList.remove('show'); c.root.classList.add('leave');
    requestAnimationFrame(function () {
      c.grow.style.transition = ''; c.grow.className = 'pt-grow shrink';
      c.grow.style.left = r.left + 'px'; c.grow.style.top = r.top + 'px'; c.grow.style.width = r.width + 'px'; c.grow.style.height = r.height + 'px';
      setTimeout(function () { c.grow.style.opacity = '0'; }, 520);
      setTimeout(back, 760);
    });
  }

  JT.portal = { open: open, close: close };
})();
