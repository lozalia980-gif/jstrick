/* js-trick :: landing (efectos ligeros: se pausan fuera de pantalla y respetan "reducir movimiento") */
(function () {
  var JT = window.JT, doc = document, $ = function (s, r) { return (r || doc).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || doc).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var esc = JT.esc || function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CAT = JT.catalog, ICON = { code: 'i-code', layers: 'i-layers', bolt: 'i-bolt', term: 'i-term', db: 'i-db', globe: 'i-globe', cube: 'i-cube' };
  var cssOn = true;

  function icon(id) { return '<svg class="i" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function onVisible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { rootMargin: '80px' }).observe(el);
  }

  /* ---------- año, navegación ---------- */
  $('#year').textContent = new Date().getFullYear();
  var nav = $('#nav'), links = $('.nav-links'), tog = $('.nav-toggle');
  function onScroll() { nav.classList.toggle('solid', window.scrollY > 20); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  tog.addEventListener('click', function () { var o = links.classList.toggle('open'); tog.setAttribute('aria-expanded', o); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) { links.classList.remove('open'); tog.setAttribute('aria-expanded', 'false'); } });

  /* ---------- títulos palabra por palabra ---------- */
  $$('[data-split]').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'), s = doc.createElement('span');
            w.className = 'w'; s.textContent = p; s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
  });

  /* ---------- aparecer al hacer scroll ---------- */
  var seen = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); if (e.target.hasAttribute('data-count')) countUp(e.target); } });
  }, { threshold: .15 }) : null;
  $$('.reveal,[data-split],[data-count]').forEach(function (el) { if (seen) seen.observe(el); else el.classList.add('in'); });

  /* ---------- números ---------- */
  var totals = { ex: 0, xs: 0, q: 0 };
  Object.keys(CAT).forEach(function (k) { totals.ex += CAT[k].ex; totals.xs += CAT[k].xs; totals.q += CAT[k].q; });
  $('#n-lang').dataset.to = JT.tracks.length;
  $('#n-ex').dataset.to = totals.ex; $('#n-xs').dataset.to = totals.xs; $('#n-q').dataset.to = totals.q;
  $$('[data-count]').forEach(function (el) { if (el.dataset.to != null) el.textContent = reduce ? el.dataset.to : '0'; });
  function countUp(el) {
    var to = +el.dataset.to || 0, t0 = performance.now(), dur = 1400;
    if (reduce || !to) { el.textContent = to; return; }
    (function step(t) { var p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }

  /* ---------- marquee ---------- */
  var mq = JT.tracks.concat(JT.soon.map(function (s) { return { name: s.name, color: s.color }; }));
  var mh = mq.map(function (t) { return '<span><i style="--c:' + t.color + '"></i>' + esc(t.name) + '</span>'; }).join('');
  $('#marq').innerHTML = mh + mh;

  /* ---------- tarjetas de lenguajes ---------- */
  $('#lang-grid').innerHTML = JT.tracks.map(function (t, i) {
    var c = CAT[t.id], ready = c.ex > 0;
    return '<article class="lcard reveal" data-tilt="7" style="--c:' + t.color + ';--d:' + (i % 3) + '">' +
      '<div class="lc-head"><span class="lc-ic">' + icon(ICON[t.icon] || 'i-code') + '</span><div><h3>' + esc(t.name) + '</h3><small>' + esc(c.file) + '</small></div></div>' +
      '<p>' + esc(t.tagline) + '</p>' +
      '<pre class="lc-code" aria-hidden="true">' + JT.highlight(c.code, c.lang) + '</pre>' +
      '<div class="lc-topics">' + c.topics.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</div>' +
      '<div class="lc-foot"><span>' + (ready ? c.ex + ' ejemplos · ' + c.xs + ' ejercicios' : esc(c.run)) + '</span><a href="app.html#/curso/' + t.id + '">Ver curso ' + icon('i-arrow') + '</a></div></article>';
  }).join('');
  $('#soon-row').innerHTML = JT.soon.map(function (s) { return '<span style="--c:' + s.color + '"><i></i>' + esc(s.name) + '</span>'; }).join('');
  $$('.lcard').forEach(function (c) { if (seen) seen.observe(c); else c.classList.add('in'); });

  /* ---------- inclinación 3D y botones magnéticos (solo ratón) ---------- */
  if (fine && !reduce) {
    doc.addEventListener('pointermove', function (e) {
      doc.body.classList.add('has-glow');
      glowX = e.clientX; glowY = e.clientY; if (!glowRaf) glowRaf = requestAnimationFrame(moveGlow);
    }, { passive: true });
    var glow = $('.cursor-glow'), glowX = 0, glowY = 0, glowRaf = 0;
    function moveGlow() { glowRaf = 0; glow.style.transform = 'translate(' + glowX + 'px,' + glowY + 'px)'; }
    doc.addEventListener('pointerover', function (e) {
      var el = e.target.closest && e.target.closest('[data-tilt]'); if (el && !el._tilt) bindTilt(el);
      var m = e.target.closest && e.target.closest('[data-magnetic]'); if (m && !m._mag) bindMag(m);
    });
  }
  function bindTilt(el) {
    el._tilt = 1; var max = +el.dataset.tilt || 6, raf = 0, rx = 0, ry = 0;
    function apply() { raf = 0; el.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(0)'; }
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry = (x - .5) * 2 * max; rx = -(y - .5) * 2 * max;
      el.style.setProperty('--mx', (x * 100) + '%'); el.style.setProperty('--my', (y * 100) + '%');
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener('pointerleave', function () { rx = ry = 0; if (!raf) raf = requestAnimationFrame(apply); });
  }
  function bindMag(el) {
    el._mag = 1;
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(); el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28) + 'px)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  }

  /* ---------- fondo de red de puntos (canvas) ---------- */
  (function () {
    var cv = $('#net'), ctx = cv.getContext('2d'), pts = [], W = 0, H = 0, run = false, vis = true, mouse = { x: -999, y: -999 };
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(70, Math.max(22, W * H / 22000)));
      pts = []; for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1 + Math.random() * 1.6, c: ['#61afef', '#c678dd', '#56b6c2', '#e5c07b'][i % 4] });
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        if (run) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14000) { ctx.strokeStyle = 'rgba(97,175,239,' + (.2 * (1 - d / 14000)) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
        if (md < 19000) { ctx.strokeStyle = 'rgba(198,120,221,' + (.4 * (1 - md / 19000)) + ')'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        ctx.fillStyle = p.c; ctx.globalAlpha = .75; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    function loop() { if (!run) return; draw(); requestAnimationFrame(loop); }
    function sync() { var go = vis && !doc.hidden && !reduce; if (go && !run) { run = true; requestAnimationFrame(loop); } else if (!go) run = false; }
    size(); var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 200); });
    onVisible(cv, function (v) { vis = v; sync(); });
    doc.addEventListener('visibilitychange', sync);
    if (fine) cv.parentNode.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
    sync();
  })();

  /* ---------- ventana 3D del hero ---------- */
  (function () {
    var stage = $('#stage'), wrap = stage.parentNode;
    if (fine && !reduce) {
      var raf = 0, rx = 0, ry = 0;
      function apply() { raf = 0; stage.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)'; }
      wrap.addEventListener('pointermove', function (e) { var r = wrap.getBoundingClientRect(); ry = ((e.clientX - r.left) / r.width - .5) * 18; rx = -((e.clientY - r.top) / r.height - .5) * 14; if (!raf) raf = requestAnimationFrame(apply); });
      wrap.addEventListener('pointerleave', function () { rx = ry = 0; if (!raf) raf = requestAnimationFrame(apply); });
    } else stage.style.transform = 'rotateY(-8deg) rotateX(3deg)';
    var order = ['python', 'sql', 'js', 'cpp', 'php'], idx = 0, codeEl = $('#win-code'), outEl = $('#win-out'), fileEl = $('#win-file'), langEl = $('#win-lang');
    var vis = true, timer = 0;
    function show(id, full) {
      var c = CAT[id], t = JT.track(id);
      fileEl.textContent = c.file; langEl.textContent = t.name; langEl.style.color = t.color; langEl.style.background = 'rgba(255,255,255,.07)';
      codeEl.innerHTML = JT.highlight(c.code, c.lang); outEl.textContent = full ? c.out : '';
    }
    function type(id, done) {
      var c = CAT[id], t = JT.track(id), n = 0, code = c.code;
      fileEl.textContent = c.file; langEl.textContent = t.name; langEl.style.color = t.color; outEl.textContent = '';
      (function step() {
        if (!vis || doc.hidden) { timer = setTimeout(step, 400); return; }
        n += 2; codeEl.innerHTML = JT.highlight(code.slice(0, n), c.lang) + '<i class="cur"></i>';
        if (n < code.length) timer = setTimeout(step, 34);
        else { codeEl.innerHTML = JT.highlight(code, c.lang); timer = setTimeout(function () { outEl.textContent = c.out; timer = setTimeout(done, 2600); }, 450); }
      })();
    }
    function next() { type(order[idx++ % order.length], next); }
    show('python', true);
    if (!reduce) { onVisible(stage, function (v) { vis = v; }); timer = setTimeout(next, 1800); }
  })();

  /* ---------- método: pasos con tarjetas ---------- */
  (function () {
    var steps = $$('.step'), cards = $$('.vis-card'), cur = 0, timer = 0, vis = false;
    function go(i) { cur = i; steps.forEach(function (s, k) { s.classList.toggle('on', k === i); }); cards.forEach(function (c, k) { c.classList.toggle('on', k === i); }); }
    function auto() { clearInterval(timer); if (reduce) return; timer = setInterval(function () { if (vis && !doc.hidden) go((cur + 1) % steps.length); }, 4200); }
    steps.forEach(function (s, i) { s.addEventListener('click', function () { go(i); auto(); }); s.addEventListener('mouseenter', function () { if (fine) { go(i); auto(); } }); });
    onVisible($('#steps'), function (v) { vis = v; }); auto();
  })();

  /* ---------- mini mapa de actividad ---------- */
  (function () {
    var h = '', seed = 7; function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 26 * 5; i++) { var r = rnd(); h += '<i class="' + (r > .86 ? 'l4' : r > .7 ? 'l3' : r > .5 ? 'l2' : r > .35 ? 'l1' : '') + '"></i>'; }
    $('#heat-mini').innerHTML = h;
  })();

  /* ---------- zona de pruebas ---------- */
  (function () {
    var EX = [
      { id: 'js', label: 'JavaScript', file: 'js', code: 'const alumno = { nombre: "Ana", edad: 20 };\nconst texto = JSON.stringify(alumno);\nconsole.log(texto);\n\nconst copia = JSON.parse(texto);\nconsole.log("Hola, " + copia.nombre);' },
      { id: 'dom', label: 'JS + pantalla', file: 'html', code: '<h2 id="saludo">Hola</h2>\n<button id="b">Cambiar</button>\n\n<script>\n  var b = document.getElementById("b");\n  b.addEventListener("click", function () {\n    document.getElementById("saludo").textContent = "¡Funciona!";\n    console.log("clic recibido");\n  });\n<\/script>' },
      { id: 'rompe', label: 'Rómpelo', file: 'js', code: 'var precio = 100;\nvar total = precio * 1.19\nconsole.log("Total: " + total;\n' }
    ];
    var cur = 0, files = EX.map(function (e) { return e.code; });
    var tabs = $('#play-tabs'), ed = $('#play-ed'), frame = $('#play-frame'), cons = $('#play-console'), iss = $('#play-issues');
    tabs.innerHTML = EX.map(function (e, i) { return '<button class="ptab' + (i ? '' : ' on') + '" type="button" data-i="' + i + '">' + esc(e.label) + '</button>'; }).join('');
    ed.innerHTML = '<div class="pe-wrap"><div class="pe-gut"></div><div class="pe-main"><pre class="pe-hl" aria-hidden="true"></pre><textarea class="pe-ta" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off" aria-label="Editor de código"></textarea></div></div>';
    var gut = $('.pe-gut', ed), hl = $('.pe-hl', ed), ta = $('.pe-ta', ed), main = $('.pe-main', ed), bad = {};
    function lint() {
      var f = EX[cur].file, code = ta.value, out = [];
      try { out = JT.lint({ kind: 'web', files: f === 'html' ? { html: code } : { js: code } }) || []; } catch (e) { out = []; }
      bad = {}; out.forEach(function (x) { if (x.sev === 'error' && x.line) bad[x.line] = 1; });
      iss.innerHTML = out.filter(function (x) { return x.sev !== 'info'; }).slice(0, 3).map(function (x) {
        return '<div class="issue ' + (x.sev === 'warn' ? 'warn' : '') + '">' + (x.line ? '<span class="ln">línea ' + x.line + '</span>' : '') + '<b>' + x.title + '</b>' + x.msg + (x.fix ? '<i>' + x.fix + '</i>' : '') + '</div>';
      }).join('');
      return out.some(function (x) { return x.sev === 'error'; });
    }
    function paint() {
      var code = ta.value, lines = JT.highlightLines(code, EX[cur].file);
      hl.innerHTML = lines.map(function (h, i) { return '<div class="l' + (bad[i + 1] ? ' bad' : '') + '">' + (h || ' ') + '</div>'; }).join('');
      var g = ''; for (var i = 1; i <= lines.length; i++) g += '<div' + (bad[i] ? ' class="bad"' : '') + '>' + i + '</div>'; gut.innerHTML = g;
      ta.style.height = Math.max(330, lines.length * 23 + 28) + 'px';
    }
    function load(i) {
      cur = i; ta.value = files[i]; $$('.ptab', tabs).forEach(function (b, k) { b.classList.toggle('on', k === i); });
      cons.textContent = ''; iss.innerHTML = ''; frame.srcdoc = ''; lint(); paint();
    }
    var lt; ta.addEventListener('input', function () { files[cur] = ta.value; paint(); clearTimeout(lt); lt = setTimeout(function () { lint(); paint(); }, 350); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); doc.execCommand('insertText', false, '  '); } });
    tabs.addEventListener('click', function (e) { var b = e.target.closest('.ptab'); if (b) load(+b.dataset.i); });
    var PRE = '<script>(function(){function s(t,a){parent.postMessage({jt:1,t:t,m:[].slice.call(a).map(function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}console.log=function(){s("l",arguments)};console.error=function(){s("e",arguments)};window.onerror=function(m,u,l){s("e",["Error: "+m+(l?" (línea "+l+")":"")])}})();<\/script>';
    $('#play-run').addEventListener('click', function () {
      cons.textContent = '';
      var hasErr = lint(); paint();
      if (hasErr) { cons.innerHTML = '<span class="e">No se ejecutó: corrige primero el error marcado.</span>'; return; }
      var code = ta.value, f = EX[cur].file;
      frame.srcdoc = '<!doctype html><meta charset="utf-8"><body style="font:16px Segoe UI,sans-serif;padding:14px;color:#222">' + PRE + (f === 'html' ? code : '<script>' + code.replace(/<\/script/gi, '<\\/script') + '<\/script>');
    });
    window.addEventListener('message', function (e) {
      if (e.source !== frame.contentWindow || !e.data || !e.data.jt) return;
      var d = doc.createElement('div'); if (e.data.t === 'e') d.className = 'e'; d.textContent = (e.data.t === 'e' ? '' : '> ') + e.data.m; cons.appendChild(d);
    });
    load(0);
  })();
})();
