/* js-trick :: aplicación (vistas, rutas, ejemplos interactivos, ejercicios guiados y retos) */
(function () {
  var JT = window.JT, esc = JT.esc, ic = JT.icon;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view, timers = [], cleanup = [];

  var ORDER_WEB = ['html', 'css', 'js'], ORDER_NG = ['ts', 'html', 'css', 'mod'];
  var MARK = 'tu código aquí';
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }

  /* ============================== utilidades de progreso ============================== */
  function topicStats(t) {
    var done = 0, total = 0;
    (t.examples || []).forEach(function (e) { total++; if (JT.state.done[e.id]) done++; });
    (t.exercises || []).forEach(function (e) { total++; if (JT.state.done[e.id]) done++; });
    if ((t.quiz || []).length) { total++; if (JT.state.done['quiz:' + t.id]) done++; }
    return { done: done, total: total, pct: total ? Math.round(done / total * 100) : 0 };
  }
  function renderXp() {
    var lv = JT.level(JT.state.xp);
    $('#xpchip').innerHTML = ic('award') + '<span>Nivel ' + lv.n + ' <b>' + esc(lv.name) + '</b></span><span class="xpbar"><i style="width:' + lv.pct + '%"></i></span><span>' + JT.state.xp + ' XP</span>';
  }
  JT.onProgress = function () { renderXp(); renderSide(); };

  /* ============================== barra lateral ============================== */
  var curRoute = { t: null, kind: null, i: null, tab: null };
  function renderSide() {
    var h = '<h6>Ruta de estudio</h6>';
    JT.topics.forEach(function (t) {
      var st = topicStats(t), active = curRoute.t === t.id;
      h += '<div class="navtopic' + (active ? ' active' : '') + '"><a class="head" href="#/t/' + t.id + '"><span class="num" style="background:' + t.color + '">' + esc(t.num === 0 ? '0' : t.num) + '</span><span class="tt"><b>' + esc(t.short) + '</b><span>' + st.done + ' de ' + st.total + ' completados</span></span></a><div class="mini"><i style="width:' + st.pct + '%;background:' + t.color + '"></i></div>';
      if (active) {
        h += '<div class="navsub"><a href="#/t/' + t.id + '/conceptos" class="' + (curRoute.kind === 'topic' && curRoute.tab === 'conceptos' ? 'cur' : '') + '"><span class="dot"></span>Conceptos</a>';
        h += '<div class="navgroup">Ejemplos</div>';
        t.examples.forEach(function (e, i) { h += '<a href="#/t/' + t.id + '/e/' + i + '" class="' + (JT.state.done[e.id] ? 'done ' : '') + (curRoute.kind === 'e' && curRoute.i === i ? 'cur' : '') + '"><span class="dot"></span>' + (i + 1) + '. ' + esc(e.title) + '</a>'; });
        h += '<div class="navgroup">Ejercicios</div>';
        t.exercises.forEach(function (e, i) { h += '<a href="#/t/' + t.id + '/x/' + i + '" class="' + (JT.state.done[e.id] ? 'done ' : '') + (curRoute.kind === 'x' && curRoute.i === i ? 'cur' : '') + '"><span class="dot"></span>' + (i + 1) + '. ' + esc(e.title) + '</a>'; });
        if ((t.quiz || []).length) h += '<div class="navgroup">Reto</div><a href="#/t/' + t.id + '/quiz" class="' + (JT.state.done['quiz:' + t.id] ? 'done ' : '') + (curRoute.kind === 'topic' && curRoute.tab === 'quiz' ? 'cur' : '') + '"><span class="dot"></span>Reto rápido</a>';
        h += '</div>';
      }
      h += '</div>';
    });
    $('#side').innerHTML = h;
  }

  /* ============================== router ============================== */
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function route() {
    timers.forEach(clearTimeout); timers = [];
    cleanup.forEach(function (f) { try { f(); } catch (e) { /* ignorar */ } }); cleanup = [];
    JT.help.close();
    if (JT.monitor.el) { JT.monitor.isOpen && JT.monitor.close(); }
    var p = location.hash.replace(/^#\/?/, '').split('/');
    $('#side').classList.remove('open');
    var t = p[0] === 't' ? JT.topic(p[1]) : null;
    if (!t) { curRoute = { t: null, kind: 'home' }; renderSide(); pageHome(); }
    else if (p[2] === 'e' && t.examples[+p[3]]) { curRoute = { t: t.id, kind: 'e', i: +p[3] }; renderSide(); pageExample(t, +p[3]); }
    else if (p[2] === 'x' && t.exercises[+p[3]]) { curRoute = { t: t.id, kind: 'x', i: +p[3] }; renderSide(); pageExercise(t, +p[3]); }
    else { var tab = ['conceptos', 'ejemplos', 'ejercicios', 'quiz'].indexOf(p[2]) >= 0 ? p[2] : 'conceptos'; curRoute = { t: t.id, kind: 'topic', tab: tab }; renderSide(); pageTopic(t, tab); }
    $('#main').scrollTop = 0;
  }

  /* ============================== inicio ============================== */
  function pageHome() {
    document.title = 'js-trick | Aprende practicando';
    var totalEx = 0, totalXs = 0;
    JT.topics.forEach(function (t) { totalEx += t.examples.length; totalXs += t.exercises.length; });
    var feats = [
      ['play', 'Pantalla en vivo', 'Cada ejemplo tiene una computadora que se abre y muestra el resultado de tu código en tiempo real.'],
      ['help', 'Un "?" en todas partes', 'Toca el signo de pregunta junto a cualquier línea, función u objeto para ver una explicación detallada, o escribe tu propia duda.'],
      ['alert', 'Errores que enseñan', 'Si escribes algo incorrecto, un cuadro te explica qué está mal, por qué y qué deberías escribir en su lugar.'],
      ['code', 'Desglose paso a paso', 'El código se explica por partes y luego lo ves completo en un editor donde puedes modificarlo.'],
      ['target', 'Ejercicios guiados', 'El sistema te dicta qué escribir línea por línea, te dice por qué, y corrige tus errores mientras tecleas.'],
      ['award', 'Puntos y niveles', 'Ganas XP al completar ejemplos, ejercicios y retos. Tu progreso se guarda en este navegador.']
    ];
    view.innerHTML =
      '<div class="hero"><div><h1>Aprende <em>JavaScript</em> haciendo,<br>no memorizando</h1><p class="lead">Un laboratorio interactivo para las guías 8 a 12: JSON y almacenamiento web, AJAX, jQuery y Angular. Sin bases previas: empiezas desde lo más simple y avanzas escribiendo código de verdad.</p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px"><a class="btn primary" href="' + nextHash() + '">' + ic('play') + 'Continuar donde me quedé</a><a class="btn" href="#/t/g0">' + ic('book') + 'Repasar lo básico primero</a></div>' +
      '<p style="color:var(--muted);font-size:13.5px;margin-top:16px">' + totalEx + ' ejemplos interactivos &middot; ' + totalXs + ' ejercicios guiados &middot; retos rápidos por tema</p></div>' +
      '<div class="heroart"><div class="bar"><i></i><i></i><i></i></div>' + JT.highlight('const alumno = {\n  nombre: "Ana",\n  guia: 8\n};\n\nconst texto = JSON.stringify(alumno);\nlocalStorage.setItem("alumno", texto);\n\n// ¡y ahora lo lees de vuelta!\nconst otra = JSON.parse(texto);\nconsole.log(otra.nombre);', 'js') + '</div></div>' +
      '<div class="sectiontitle">' + ic('layers') + '<h2 style="margin:0">Temas</h2></div><div class="grid g3">' +
      JT.topics.map(function (t) {
        var st = topicStats(t);
        return '<a class="card tcard" href="#/t/' + t.id + '"><div class="top"><span class="num" style="background:' + t.color + '">' + (t.num === 0 ? '0' : t.num) + '</span><div><h3>' + esc(t.title) + '</h3><div style="color:var(--muted);font-size:12.5px">' + esc(t.guide) + '</div></div></div><p style="color:#b7bdcc;font-size:14px;margin:0">' + t.summary + '</p><div class="meta"><span>' + t.examples.length + ' ejemplos</span><span>' + t.exercises.length + ' ejercicios</span><span>' + (t.quiz || []).length + ' preguntas</span></div><div class="prog"><i style="width:' + st.pct + '%;background:' + t.color + '"></i></div></a>';
      }).join('') + '</div>' +
      '<div class="sectiontitle">' + ic('bolt') + '<h2 style="margin:0">Cómo funciona</h2></div><div class="grid g3">' +
      feats.map(function (f) { return '<div class="card feat"><div class="fi">' + ic(f[0]) + '</div><h3>' + f[1] + '</h3><p style="color:#b7bdcc;font-size:14px">' + f[2] + '</p></div>'; }).join('') + '</div>' +
      '<div class="foot">js-trick &middot; hecho para estudiar las guías 8 a 12 &middot; <a href="#/" id="resetProg">Reiniciar mi progreso</a></div>';
    $('#resetProg').addEventListener('click', function (e) { e.preventDefault(); if (confirm('¿Seguro que quieres borrar todo tu progreso y tus códigos guardados?')) { JT.resetState(); JT.toast('Progreso reiniciado'); route(); renderXp(); } });
  }
  function nextHash() {
    for (var i = 0; i < JT.topics.length; i++) {
      var t = JT.topics[i];
      for (var a = 0; a < t.examples.length; a++) if (!JT.state.done[t.examples[a].id]) return '#/t/' + t.id + '/e/' + a;
      for (var b = 0; b < t.exercises.length; b++) if (!JT.state.done[t.exercises[b].id]) return '#/t/' + t.id + '/x/' + b;
    }
    return '#/t/g0';
  }

  /* ============================== página de un tema ============================== */
  function pageTopic(t, tab) {
    document.title = 'js-trick | ' + t.title;
    var st = topicStats(t);
    var h = '<div class="crumbs"><a href="#/">Inicio</a>' + ic('right') + '<b>' + esc(t.guide) + '</b></div>' +
      '<div class="thead"><span class="num" style="background:' + t.color + '">' + (t.num === 0 ? '0' : t.num) + '</span><div><h1>' + esc(t.title) + '</h1><p>' + esc(t.guide) + ' &middot; ' + st.done + ' de ' + st.total + ' actividades completadas</p></div></div>' +
      '<div class="tabs">' + [['conceptos', 'book', 'Conceptos', t.theory.length], ['ejemplos', 'code', 'Ejemplos', t.examples.length], ['ejercicios', 'target', 'Ejercicios', t.exercises.length], ['quiz', 'flag', 'Reto rápido', (t.quiz || []).length]].map(function (x) { return '<a href="#/t/' + t.id + '/' + x[0] + '" class="' + (tab === x[0] ? 'on' : '') + '">' + ic(x[1]) + x[2] + '<span class="cnt">' + x[3] + '</span></a>'; }).join('') + '</div>';
    if (tab === 'conceptos') {
      h += '<div class="theory">' + t.theory.map(function (c) {
        return '<div class="card"><h3>' + ic(c.icon || 'bulb') + esc(c.h) + '</h3>' + c.html + (c.analogy ? '<div class="analogy"><b>Piensa así:</b> ' + c.analogy + '</div>' : '') + (c.code ? '<pre class="part" style="margin:10px 0 0;border:0"><code style="all:unset;display:block;font:13px/1.65 var(--mono);white-space:pre;overflow-x:auto;padding:12px 14px;background:var(--code-bg);border-radius:9px">' + JT.highlight(c.code, c.lang || 'js', { terms: true, once: true }) + '</code></pre>' : '') + '</div>';
      }).join('') + '</div>' +
        '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn primary" href="#/t/' + t.id + '/e/0">' + ic('play') + 'Empezar con el primer ejemplo</a><a class="btn" href="#/t/' + t.id + '/ejercicios">' + ic('target') + 'Ir a los ejercicios</a></div>';
    } else if (tab === 'ejemplos') {
      h += '<div class="list">' + t.examples.map(function (e, i) {
        var fs = Object.keys(JT.filesFromParts(e.parts));
        return '<a class="item' + (JT.state.done[e.id] ? ' done' : '') + '" href="#/t/' + t.id + '/e/' + i + '"><span class="idx">' + (JT.state.done[e.id] ? ic('check') : i + 1) + '</span><span class="tx"><b>' + esc(e.title) + '</b><span>' + esc(e.short || '') + '</span></span>' + fs.map(function (f) { return '<span class="badge f-' + f + '">' + (f === 'js' ? 'JS' : f === 'ts' ? 'TS' : f.toUpperCase()) + '</span>'; }).join('') + ic('right') + '</a>';
      }).join('') + '</div>';
    } else if (tab === 'ejercicios') {
      h += '<div class="list">' + t.exercises.map(function (e, i) {
        var s = JT.state.drafts['x:' + e.id], prog = s ? Math.min(s.i, e.steps.length) : 0;
        return '<a class="item' + (JT.state.done[e.id] ? ' done' : '') + '" href="#/t/' + t.id + '/x/' + i + '"><span class="idx">' + (JT.state.done[e.id] ? ic('check') : i + 1) + '</span><span class="tx"><b>' + esc(e.title) + '</b><span>' + esc(e.short || '') + '</span></span><span class="badge' + (JT.state.done[e.id] ? ' ok' : '') + '">' + (JT.state.done[e.id] ? 'Completado' : prog + ' / ' + e.steps.length + ' pasos') + '</span>' + ic('right') + '</a>';
      }).join('') + '</div>';
    }
    view.innerHTML = h;
    if (tab === 'quiz') pageQuiz(t);
  }

  /* ============================== helpers de la mesa de trabajo ============================== */
  function orderOf(t, keys) {
    var base = t.kind === 'ng' ? ORDER_NG : ORDER_WEB;
    return base.filter(function (k) { return keys.indexOf(k) >= 0; });
  }
  function filesOrder(t, files) {
    var base = t.kind === 'ng' ? ORDER_NG : ORDER_WEB;
    return base.filter(function (k) { return files[k] != null && (files[k] !== '' || k === 'js' || k === 'ts'); });
  }
  function stripMarks(files) {
    var o = {};
    Object.keys(files).forEach(function (k) { o[k] = String(files[k]).split('\n').filter(function (l) { return l.indexOf(MARK) < 0; }).join('\n'); });
    return o;
  }
  /* cierra automaticamente llaves y paréntesis pendientes (solo para la vista previa de un ejercicio a medias) */
  function autoClose(code) {
    var m = JT.maskJS(code), st = [], close = { '{': '}', '(': ')', '[': ']' };
    for (var i = 0; i < m.length; i++) { var c = m[i]; if (close[c]) st.push(close[c]); else if (c === '}' || c === ')' || c === ']') st.pop(); }
    return code + (st.length ? '\n' + st.reverse().join('\n') : '');
  }
  function issuesHTML(list, extra) {
    var errs = list.filter(function (x) { return x.sev === 'error'; }).length, warns = list.filter(function (x) { return x.sev === 'warn'; }).length;
    var h = '';
    if (!list.length) h = '<div class="status ok">' + ic('check') + 'Todo en orden: no encontré errores en tu código.</div>';
    else h = '<div class="status ' + (errs ? 'bad' : 'warn') + '">' + ic(errs ? 'alert' : 'warn') + (errs ? errs + ' error' + (errs > 1 ? 'es' : '') + ' por corregir' : warns + ' aviso' + (warns > 1 ? 's' : '')) + (errs && warns ? ' y ' + warns + ' aviso' + (warns > 1 ? 's' : '') : '') + '</div>';
    h += list.slice(0, 8).map(function (x) {
      return '<div class="issue ' + x.sev + '"><div class="ih">' + ic(x.sev === 'error' ? 'alert' : x.sev === 'warn' ? 'warn' : 'info') + '<span>' + esc(x.title) + '</span><span class="loc">' + (x.line ? esc(JT.FILE_EXT[x.file] || x.file) + ' : línea ' + x.line : x.file ? esc(JT.FILE_EXT[x.file] || x.file) : '') + '</span></div><div class="ib"><p>' + x.msg + '</p>' + (x.fix ? '<div class="fix"><b>Cómo corregirlo:</b> ' + x.fix + '</div>' : '') + (x.code ? '<pre>' + esc(x.code) + '</pre>' : '') + '</div></div>';
    }).join('');
    if (list.length > 8) h += '<div class="empty-note">y ' + (list.length - 8) + ' más...</div>';
    return h;
  }
  function errorLines(list) {
    var map = {};
    list.forEach(function (x) { if (x.sev === 'error' && x.line) (map[x.file] = map[x.file] || []).push(x.line); });
    return map;
  }
  function mapRuntimeLine(m, spec, info) {
    var file = spec.kind === 'ng' ? 'ts' : 'js', line = m.line || 0;
    if (!m.file || /usuario\.js/.test(m.file) || !m.file.length) {
      if (spec.kind === 'ng' && info && info.tsLines && line > info.tsLines) { file = 'mod'; line = line - info.tsLines - 1; }
    } else line = 0;
    if (m.ng) line = 0;
    return { file: file, line: line };
  }

  /* ============================== EJEMPLO ============================== */
  function pageExample(t, idx) {
    var ex = t.examples[idx], files0 = JT.filesFromParts(ex.parts);
    document.title = 'js-trick | ' + ex.title;
    JT.help.parts = ex.parts; JT.help.history = [];
    var draft = JT.state.drafts['e:' + ex.id];
    var order = filesOrder(t, files0), prev = t.examples[idx - 1], next = t.examples[idx + 1];
    var lib = ex.lib || t.lib, kind = t.kind || 'web';
    var h = '<div class="crumbs"><a href="#/">Inicio</a>' + ic('right') + '<a href="#/t/' + t.id + '/ejemplos">' + esc(t.guide) + '</a>' + ic('right') + '<b>Ejemplo ' + (idx + 1) + ' de ' + t.examples.length + '</b></div>' +
      '<div class="bench"><div class="left">' +
      '<div class="navrow">' + (prev ? '<a class="btn sm" href="#/t/' + t.id + '/e/' + (idx - 1) + '">' + ic('left') + 'Anterior</a>' : '') + (next ? '<a class="btn sm" href="#/t/' + t.id + '/e/' + (idx + 1) + '">Siguiente' + ic('right') + '</a>' : '<a class="btn sm" href="#/t/' + t.id + '/ejercicios">Ir a ejercicios' + ic('right') + '</a>') + '<span class="spacer"></span><button class="btn sm ' + (JT.state.done[ex.id] ? 'ok' : '') + '" id="doneBtn">' + ic('check') + (JT.state.done[ex.id] ? 'Entendido' : 'Marcar como entendido (+3 XP)') + '</button></div>' +
      '<h1 class="title">' + esc(ex.title) + '</h1>' +
      '<div class="context"><h4>El contexto</h4>' + ex.intro + '</div>' +
      '<div class="parts"><h3>' + ic('layers') + 'Desglose del código, pieza por pieza</h3>' +
      ex.parts.map(function (p, i) {
        return '<div class="part"><div class="ph"><span class="no">' + (i + 1) + '</span><span class="badge f-' + p.f + '">' + esc(JT.FILE_NAMES[p.f]) + '</span><span class="spacer"></span><button class="btn sm" data-locate="' + i + '" title="Resalta estas líneas en el código completo">' + ic('eye') + 'Ver en el código completo</button></div><pre>' + JT.highlight(p.code, p.f, { terms: true, once: true }) + '</pre>' + (p.why ? '<div class="why">' + p.why + '</div>' : '') + '</div>';
      }).join('') + '</div>' +
      (ex.notes || []).map(function (n) { return '<div class="callout ' + (n.type || 'tip') + '">' + ic(n.type === 'warn' ? 'warn' : n.type === 'bad' ? 'alert' : n.type === 'info' ? 'info' : 'bulb') + '<div>' + n.html + '</div></div>'; }).join('') +
      (ex.tryit && ex.tryit.length ? '<div class="card" style="margin-top:14px"><h3>' + ic('flask') + 'Experimenta (cambia el código de la derecha)</h3><ul style="margin:6px 0 0;padding-left:20px">' + ex.tryit.map(function (x) { return '<li style="margin-bottom:5px">' + x + '</li>'; }).join('') + '</ul></div>' : '') +
      '</div><div class="right"><div id="edHost"></div><div class="issues" id="issuesHost"></div><div id="monHost"></div></div></div>';
    view.innerHTML = h;

    var issues = [], runtimeIssues = [];
    var spec = function () { return { kind: kind, lib: lib, files: ed.getFiles() }; };
    var ed = new JT.Editor($('#edHost'), {
      order: order, onTerms: true,
      onHelp: function (info) { JT.help.openLine(info); },
      onTerm: function (k) { JT.help.openTerm(k); },
      onChange: function (files) { JT.state.drafts['e:' + ex.id] = files; saveDraft(); lintNow(); }
    });
    var saveDraft = debounce(function () { JT.saveState(); }, 900);
    ed.toolsEl.innerHTML = '<button class="btn sm" id="resetBtn" title="Vuelve al código original del ejemplo">' + ic('undo') + 'Restablecer</button>';
    ed.setFiles(draft && JSON.stringify(Object.keys(draft).sort()) === JSON.stringify(Object.keys(files0).sort()) ? Object.assign({}, files0, draft) : files0, order[0]);
    var M = JT.monitor;
    M.attach($('#monHost'), { storage: !!t.storage, server: !!t.server, onError: onRuntimeError });
    function lintNow() {
      var files = ed.getFiles();
      issues = JT.lint({ files: files, kind: kind, lib: lib, original: files0 });
      ed.setErrors(errorLines(issues.concat(runtimeIssues)));
      renderIssues();
      var errs = issues.filter(function (x) { return x.sev === 'error'; });
      M.setSpec(spec());
      if (M.isOpen) {
        if (errs.length) { M.setBlocked('Hay ' + errs.length + ' error' + (errs.length > 1 ? 'es' : '') + ' en tu código. Corrígelos (mira el cuadro rojo de abajo) y la pantalla se actualizará sola.'); }
        else runSoon();
      }
    }
    var runSoon = debounce(function () { runtimeIssues = []; M.setSpec(spec()); M.run(); }, 550);
    function renderIssues() { $('#issuesHost').innerHTML = issuesHTML(issues.concat(runtimeIssues)); }
    function onRuntimeError(m) {
      var s = spec(), where = mapRuntimeLine(m, s, M.sb.info), ex2 = JT.explainRuntime(m, s);
      runtimeIssues.push({ sev: 'error', file: where.file, line: where.line, title: ex2.title, msg: ex2.msg, fix: ex2.fix });
      ed.setErrors(errorLines(issues.concat(runtimeIssues)));
      renderIssues();
    }
    M.onOpen = function () { var errs = issues.filter(function (x) { return x.sev === 'error'; }); runtimeIssues = []; M.setSpec(spec()); if (errs.length) setTimeout(function () { M.setBlocked('Hay ' + errs.length + ' error(es) en tu código. Corrígelos y la pantalla se actualizará sola.'); }, 300); };
    lintNow();

    view.addEventListener('click', onClick);
    cleanup.push(function () { view.removeEventListener('click', onClick); M.onOpen = null; });
    function onClick(e) {
      var l = e.target.closest('[data-locate]');
      if (l) { locate(ex.parts[+l.getAttribute('data-locate')]); return; }
      if (e.target.closest('#resetBtn')) { delete JT.state.drafts['e:' + ex.id]; JT.saveState(); ed.setFiles(files0); runtimeIssues = []; lintNow(); JT.toast('Código original restaurado'); return; }
      if (e.target.closest('#doneBtn')) { if (JT.markDone(ex.id, 3, 'por entender "' + ex.title + '"')) { e.target.closest('#doneBtn').className = 'btn sm ok'; e.target.closest('#doneBtn').innerHTML = ic('check') + 'Entendido'; } }
    }
    function locate(part) {
      var cur = ed.getFiles()[part.f] || '', ls = cur.split('\n'), pl = part.code.split('\n'), first = pl[0].trim(), at = -1;
      for (var i = 0; i < ls.length; i++) if (ls[i].trim() === first) { at = i; break; }
      if (at < 0) { JT.toast('Esa parte ya no está igual en tu código'); ed.setActive(part.f); return; }
      ed.flash(part.f, at + 1, at + pl.length);
    }
  }

  /* ============================== EJERCICIO GUIADO ============================== */
  function applyStep(files, step, text) {
    var k = step.file || 'js', cur = files[k] == null ? '' : files[k], pad = new Array((step.indent || 0) + 1).join('  ');
    var lines = String(text).replace(/\s+$/, '').split('\n').map(function (l, i) { return l.trim() ? pad + l : l; });
    var ls = cur === '' ? [] : cur.split('\n'), at = -1;
    for (var i = 0; i < ls.length; i++) if (ls[i].indexOf(MARK) >= 0 && (!step.at || ls[i].indexOf(step.at) >= 0)) { at = i; break; }
    var from;
    if (at >= 0) { ls.splice.apply(ls, [at, 0].concat(lines)); from = at + 1; } else { from = ls.length + 1; ls = ls.concat(lines); }
    files[k] = ls.join('\n');
    return { file: k, from: from, to: from + lines.length - 1 };
  }
  function bracketState(raw) {
    var m = JT.maskJS(raw), st = [], pairs = { ')': '(', ']': '[', '}': '{' }, close = { '(': ')', '[': ']', '{': '}' };
    for (var i = 0; i < m.length; i++) {
      var c = m[i];
      if (close[c]) st.push(c);
      else if (pairs[c]) { var top = st.pop(); if (top !== pairs[c]) return { mismatch: top ? 'Cerraste ' + c + ' pero se esperaba ' + close[top] + '.' : 'Sobra un ' + c + ' (no hay nada abierto que cerrar).' }; }
    }
    var oq = (m.match(/(^|[^\\])'/g) || []).length % 2 || (m.match(/(^|[^\\])"/g) || []).length % 2;
    return { open: st.length ? st.map(function (x) { return close[x]; }).reverse().join(' ') : '', quote: !!oq };
  }
  function diagnose(step, raw, n, topic) {
    var solN = JT.norm(step.sol || ''), msg = '';
    if (!solN) return { st: 'bad', msg: 'Todavía no es lo que pide este paso. Lee la instrucción y la pista.' };
    if (solN.indexOf(n) === 0 && n.length < solN.length) return { st: 'part', msg: 'Vas por buen camino. Sigue escribiendo...' };
    if (n.toLowerCase() === solN.toLowerCase()) {
      var a = n.split(/\b/), b = solN.split(/\b/), diff = '';
      for (var i = 0; i < b.length; i++) if (a[i] !== b[i]) { diff = '«g»'.replace('g', a[i] || '') + ' debería escribirse «' + b[i] + '»'; break; }
      return { st: 'bad', msg: '<b>Casi perfecto.</b> JavaScript distingue mayúsculas de minúsculas: ' + esc(diff) + '.' };
    }
    var wordsSol = solN.match(/[A-Za-z_$][\w$]*/g) || [], wordsIn = n.match(/[A-Za-z_$][\w$]*/g) || [];
    var solSet = {}; wordsSol.forEach(function (w) { solSet[w] = 1; });
    var typo = null;
    wordsIn.forEach(function (w) { if (typo || solSet[w] || w.length < 3) return; var c = JT.closest(w, Object.keys(solSet), 2); if (c && c !== w) typo = [w, c]; });
    if (typo) return { st: 'bad', msg: '<b>«' + esc(typo[0]) + '» no es lo correcto aquí.</b> ¿Quisiste escribir <code>' + esc(typo[1]) + '</code>? Revisa la ortografía: cada letra y las mayúsculas importan.' };
    var callsSol = (solN.match(/[A-Za-z_$][\w$.]*(?=\()/g) || []), callsIn = (n.match(/[A-Za-z_$][\w$.]*(?=\()/g) || []);
    var strange = callsIn.filter(function (c) { return callsSol.indexOf(c) < 0 && !solSet[c.split('.').pop()]; })[0];
    if (strange) return { st: 'bad', msg: '<b><code>' + esc(strange) + '()</code> no es la función que se necesita en este paso.</b> Aquí se usa ' + (callsSol.length ? '<code>' + esc(callsSol[0]) + '()</code>' : 'otra instrucción') + '. Lee la instrucción otra vez: ' + (step.why ? 'pista de por qué: ' + step.why.replace(/<[^>]+>/g, '').slice(0, 120) + '...' : '') };
    var missing = wordsSol.filter(function (w, i) { return wordsIn.indexOf(w) < 0 && wordsSol.indexOf(w) === i && !/^(const|let|var)$/.test(w); }).slice(0, 3);
    if (missing.length) return { st: 'bad', msg: 'Te falta usar: ' + missing.map(function (w) { return '<code>' + esc(w) + '</code>'; }).join(', ') + '. Revisa la pista si no recuerdas qué va aquí.' };
    return { st: 'bad', msg: 'Tienes las piezas correctas pero el <b>orden o los símbolos</b> no coinciden (paréntesis, comas, comillas, punto y coma). Compara con la pista.' };
  }
  function lintStep(step, raw, topic, prev) {
    if ((step.file || 'js') !== 'js') return '';
    var plugins = []; String(prev || '').replace(/\$\.fn\.([\w$]+)/g, function (m, n) { plugins.push(n); }); var li = JT.lint({ files: { js: raw }, kind: 'web', lib: topic.lib, plugins: plugins, noSyntax: true });
    var bad = li.filter(function (x) { return x.sev === 'error' && !/^(Falta cerrar|Comillas sin cerrar|El código termina|Sobra|Cierre equivocado|Palabra suelta|Símbolo inesperado|Falta un paréntesis|No existe el id|Declaraste)/.test(x.title); })[0];
    return bad ? '<b>' + esc(bad.title) + '.</b> ' + bad.msg + (bad.fix ? ' <br><b>Mejor así:</b> ' + bad.fix : '') : '';
  }
  function checkWrite(step, raw, topic, prev) {
    if (!raw.trim()) return { st: 'idle' };
    var n = JT.norm(raw), ok = typeof step.ok === 'function' ? step.ok(n, raw) : step.ok.test(n);
    var bs = bracketState(raw);
    if (ok) { var l = lintStep(step, raw, topic, prev); if (l) return { st: 'bad', msg: l }; return { st: 'ok' }; }
    var errs = step.errs || [];
    for (var i = 0; i < errs.length; i++) if (errs[i][0].test(n)) return { st: 'bad', msg: errs[i][1] };
    if (bs.mismatch) return { st: 'bad', msg: '<b>Paréntesis o llaves mal cerrados.</b> ' + bs.mismatch };
    if (step.file === 'js' || !step.file) { var l2 = lintStep(step, raw, topic, prev); if (l2) return { st: 'bad', msg: l2 }; }
    var d = diagnose(step, raw, n, topic);
    if (d.st === 'bad' && (bs.open || bs.quote) && n.length < JT.norm(step.sol || '').length) return { st: 'part', msg: (bs.quote ? 'Falta cerrar unas comillas. ' : '') + (bs.open ? 'Todavía falta cerrar: <code>' + esc(bs.open) + '</code>. ' : '') + 'Sigue escribiendo...' };
    return d;
  }
  function norm1(s) { return String(s).replace(/\s+/g, '').replace(/"/g, "'").replace(/“|”/g, "'"); }
  function parseTpl(tpl) {
    var parts = [], re = /\[\[([\s\S]*?)\]\]/g, last = 0, m;
    while ((m = re.exec(tpl))) { parts.push({ t: tpl.slice(last, m.index) }); parts.push({ a: m[1].split('|').map(function (x) { return x.trim(); }) }); last = re.lastIndex; }
    parts.push({ t: tpl.slice(last) });
    return parts;
  }

  function loadEx(xs) {
    var s = JT.state.drafts['x:' + xs.id];
    if (!s || !s.texts) s = { i: 0, texts: [], helped: [], done: !!JT.state.done[xs.id] };
    return s;
  }

  function pageExercise(t, idx) {
    var xs = t.exercises[idx], kind = t.kind || 'web', lib = xs.lib || t.lib;
    document.title = 'js-trick | ' + xs.title;
    JT.help.parts = []; JT.help.history = [];
    var st = loadEx(xs), N = xs.steps.length, prev = t.exercises[idx - 1], next = t.exercises[idx + 1];
    var base = xs.base || {}, keys = Object.keys(base);
    xs.steps.forEach(function (s) { var k = s.file || 'js'; if (keys.indexOf(k) < 0) keys.push(k); });
    var order = xs.tabs || orderOf(t, keys);

    view.innerHTML = '<div class="crumbs"><a href="#/">Inicio</a>' + ic('right') + '<a href="#/t/' + t.id + '/ejercicios">' + esc(t.guide) + '</a>' + ic('right') + '<b>Ejercicio ' + (idx + 1) + ' de ' + t.exercises.length + '</b></div>' +
      '<div class="bench"><div class="left"><div class="navrow">' + (prev ? '<a class="btn sm" href="#/t/' + t.id + '/x/' + (idx - 1) + '">' + ic('left') + 'Anterior</a>' : '') + (next ? '<a class="btn sm" href="#/t/' + t.id + '/x/' + (idx + 1) + '">Siguiente' + ic('right') + '</a>' : '<a class="btn sm" href="#/t/' + t.id + '/quiz">Ir al reto rápido' + ic('right') + '</a>') + '<span class="spacer"></span><button class="btn sm" id="restartX">' + ic('undo') + 'Reiniciar ejercicio</button></div>' +
      '<h1 class="title">' + esc(xs.title) + '</h1><div class="context"><h4>Lo que vas a construir</h4>' + xs.goal + '</div><div id="stepsBar" class="steps"></div><div id="exLeft"></div></div>' +
      '<div class="right"><div id="edHost"></div><div class="issues" id="issuesHost"></div><div id="monHost"></div></div></div>';

    var ed = new JT.Editor($('#edHost'), { order: order, readOnly: !st.done, onHelp: function (info) { JT.help.openLine(info); }, onTerm: function (k) { JT.help.openTerm(k); }, onTerms: true, onChange: function () { if (st.done) freeLint(); } });
    ed.toolsEl.innerHTML = '<span class="badge" id="modeBadge"></span>';
    var M = JT.monitor, runtimeIssues = [], lastRange = null;
    M.attach($('#monHost'), { storage: !!t.storage, server: !!t.server, onError: onRuntimeError });

    function assemble() {
      var files = {}; Object.keys(base).forEach(function (k) { files[k] = base[k]; });
      order.forEach(function (k) { if (files[k] == null) files[k] = ''; });
      lastRange = null;
      for (var i = 0; i < st.i && i < N; i++) lastRange = applyStep(files, xs.steps[i], st.texts[i]);
      return files;
    }
    function previewFiles(files) {
      var f = stripMarks(files);
      if (!st.done) { ['js', 'ts'].forEach(function (k) { if (f[k]) f[k] = autoClose(f[k]); }); if (f.html && st.i < N) { /* html a medias: el navegador tolera etiquetas abiertas */ } }
      return f;
    }
    var runSoon = debounce(function () { runtimeIssues = []; M.run(); }, 450);
    function sync(flash) {
      var files = assemble(), shown = st.done ? stripMarks(files) : files;
      if (st.done && !ed.__freed) { ed.__freed = true; ed.setFiles(shown, order[0]); ed.setReadOnly(false); }
      else if (!st.done) { ed.setFiles(files, lastRange ? lastRange.file : order[0]); ed.setReadOnly(true); }
      if (flash && lastRange) ed.flash(lastRange.file, lastRange.from, lastRange.to);
      $('#modeBadge').textContent = st.done ? 'Modo libre: ya puedes editar' : 'Se completa paso a paso';
      var pf = previewFiles(st.done ? ed.getFiles() : files), spec = { kind: kind, lib: lib, files: pf };
      var li = JT.lint({ files: pf, kind: kind, lib: lib }), errs = li.filter(function (x) { return x.sev === 'error'; });
      M.setSpec(spec);
      if (!st.done) $('#issuesHost').innerHTML = '';
      if (M.isOpen) { if (errs.length && st.done) M.setBlocked('Hay errores en tu código. Corrígelos y se actualiza sola.'); else runSoon(); }
      if (st.done) { renderFree(li); }
    }
    function freeLint() {
      var pf = ed.getFiles(), li = JT.lint({ files: pf, kind: kind, lib: lib }), errs = li.filter(function (x) { return x.sev === 'error'; });
      renderFree(li); M.setSpec({ kind: kind, lib: lib, files: pf });
      if (M.isOpen) { if (errs.length) M.setBlocked('Hay errores en tu código. Corrígelos y se actualiza sola.'); else runSoon(); }
    }
    function renderFree(li) { ed.setErrors(errorLines(li.concat(runtimeIssues))); $('#issuesHost').innerHTML = issuesHTML(li.concat(runtimeIssues)); }
    function onRuntimeError(m) {
      var s = M.spec, where = mapRuntimeLine(m, s, M.sb.info), e2 = JT.explainRuntime(m, s);
      var item = { sev: st.done ? 'error' : 'warn', file: where.file, line: st.done ? where.line : 0, title: (st.done ? '' : 'Todavía incompleto: ') + e2.title, msg: e2.msg, fix: e2.fix };
      runtimeIssues.push(item);
      if (st.done) freeLint(); else $('#issuesHost').innerHTML = issuesHTML(runtimeIssues);
    }
    M.onOpen = function () { runtimeIssues = []; };

    /* ---------- panel izquierdo ---------- */
    var hintShown = false, solShown = false, curState = { st: 'idle' };
    function renderBar() {
      $('#stepsBar').innerHTML = xs.steps.map(function (s, i) { return '<i class="' + (i < st.i ? (st.helped[i] ? 'help' : 'done') : i === st.i && !st.done ? 'cur' : '') + '" title="Paso ' + (i + 1) + '"></i>'; }).join('');
    }
    function renderLeft() {
      renderBar();
      var h = '', i;
      for (i = 0; i < st.i && i < N; i++) {
        var s = xs.steps[i];
        h += '<div class="stepcard past"><div class="sh"><span class="no">' + ic('check') + '</span><span>' + esc(s.title) + '</span><span class="spacer"></span><span class="badge f-' + (s.file || 'js') + '">' + esc(JT.FILE_EXT[s.file || 'js']) + '</span></div><div class="sb"><pre class="done-code">' + JT.highlight(st.texts[i], s.file || 'js') + '</pre>' + (s.after ? '<div class="why" style="margin-top:8px;font-size:13.5px;color:#c5cad6">' + s.after + '</div>' : '') + '</div></div>';
      }
      if (st.done || st.i >= N) {
        h += '<div class="winbox"><div class="big">' + ic('check') + '</div><h3>¡Ejercicio completado!</h3><p>' + (xs.final || 'Escribiste todo el código tú mismo. Abre la pantalla para ver el resultado y prueba cambiar el código a la derecha: ahora está desbloqueado.') + '</p><div class="btnrow" style="justify-content:center"><button class="btn primary" id="openScreen">' + ic('play') + 'Ver resultado en la pantalla</button>' + (next ? '<a class="btn" href="#/t/' + t.id + '/x/' + (idx + 1) + '">Siguiente ejercicio' + ic('right') + '</a>' : '<a class="btn" href="#/t/' + t.id + '/quiz">Reto rápido' + ic('right') + '</a>') + '</div></div>';
        $('#exLeft').innerHTML = h; return;
      }
      var cs = xs.steps[st.i];
      h += '<div class="stepcard" id="curStep"><div class="sh"><span class="no">' + (st.i + 1) + '</span><span>' + esc(cs.title) + '</span><span class="spacer"></span><span class="badge f-' + (cs.file || 'js') + '">' + esc(JT.FILE_EXT[cs.file || 'js']) + '</span></div><div class="sb"><div class="instr">' + cs.instr + '</div>';
      if (cs.type === 'blank') {
        var bk = 0;
        h += '<div class="blankline" id="blankLine">' + parseTpl(cs.tpl).map(function (p) { return p.a ? '<input class="blank" data-b="' + (bk++) + '" spellcheck="false" autocomplete="off" style="width:' + Math.max(5, p.a[0].length + 2) + 'ch">' : esc(p.t); }).join('') + '</div>';
      } else {
        h += '<textarea class="answer" id="answer" rows="' + (cs.multi ? Math.min(8, (cs.sol || '').split('\n').length + 1) : 1) + '" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Escribe aquí el código..."></textarea>';
      }
      h += '<div class="fb idle" id="fb">' + ic('info') + '<div>Escribe tu respuesta y te diré en tiempo real si va bien.</div></div>';
      h += '<div class="fb idle" style="margin-top:8px;background:#26253a;border-color:#443f7a;color:#d8d0f2">' + ic('bulb') + '<div><b>Por qué se hace así:</b> ' + cs.why + '</div></div>';
      h += '<div id="hintBox"></div><div class="btnrow"><button class="btn primary" id="nextStep" disabled>' + ic('check') + 'Correcto, añadir al código</button><button class="btn" id="hintBtn">' + ic('bulb') + 'Dame una pista</button><button class="btn" id="solBtn">' + ic('eye') + 'Ver solución</button></div></div></div>';
      $('#exLeft').innerHTML = h;
      hintShown = false; solShown = false; curState = { st: 'idle' };
      if (cs.type === 'blank') {
        var inputs = $('#blankLine').querySelectorAll('.blank');
        inputs[0] && inputs[0].focus();
      } else { $('#answer').focus(); }
    }
    function setFb(state, html) {
      var fb = $('#fb'); if (!fb) return;
      var icon = state === 'ok' ? 'check' : state === 'bad' ? 'alert' : state === 'part' ? 'warn' : 'info';
      fb.className = 'fb ' + (state === 'ok' ? 'good' : state === 'bad' ? 'bad' : state === 'part' ? 'warn' : 'idle');
      fb.innerHTML = ic(icon) + '<div>' + html + '</div>';
      $('#nextStep').disabled = state !== 'ok';
    }
    function evalBlank() {
      var cs = xs.steps[st.i], parts = parseTpl(cs.tpl).filter(function (p) { return p.a; }), inputs = $('#blankLine').querySelectorAll('.blank'), allOk = true, empties = 0, msgs = [];
      inputs.forEach(function (el, k) {
        var ans = parts[k].a, val = el.value, hint = (cs.blanks && cs.blanks[k]) || '';
        el.classList.remove('good', 'wrong');
        if (!val.trim()) { allOk = false; empties++; return; }
        var ok = ans.some(function (a) { return norm1(a) === norm1(val); });
        if (ok) el.classList.add('good');
        else {
          allOk = false; el.classList.add('wrong');
          var near = ans.filter(function (a) { return a.toLowerCase().replace(/\s/g, '') === val.toLowerCase().replace(/\s/g, ''); })[0];
          if (near) msgs.push('Hueco ' + (k + 1) + ': casi. JavaScript distingue mayúsculas: se escribe <code>' + esc(near) + '</code>.');
          else if (JT.lev(norm1(val).toLowerCase(), norm1(ans[0]).toLowerCase()) <= 2) msgs.push('Hueco ' + (k + 1) + ': <code>' + esc(val) + '</code> está muy cerca, revisa la ortografía.');
          else msgs.push('Hueco ' + (k + 1) + ': <code>' + esc(val) + '</code> no es lo que va ahí. ' + (hint || 'Relee la instrucción.'));
        }
      });
      if (allOk) setFb('ok', '<p><b>¡Correcto!</b> Completaste todos los huecos.</p>'); else if (msgs.length) setFb('bad', msgs.join('<br>')); else setFb('idle', 'Completa ' + empties + ' hueco' + (empties > 1 ? 's' : '') + ' más.');
    }
    function evalAnswer() {
      var cs = xs.steps[st.i], ta = $('#answer'); if (!ta) return;
      var r = checkWrite(cs, ta.value, t, st.texts.slice(0, st.i).join(' ')); curState = r;
      ta.classList.toggle('good', r.st === 'ok'); ta.classList.toggle('wrong', r.st === 'bad');
      if (r.st === 'idle') setFb('idle', 'Escribe tu respuesta y te diré en tiempo real si va bien.');
      else if (r.st === 'ok') setFb('ok', '<p><b>¡Muy bien!</b> Eso es correcto.</p>' + (cs.okMsg ? '<p>' + cs.okMsg + '</p>' : '') + '<p style="opacity:.85">Pulsa el botón verde' + (cs.multi ? '' : ' (o Enter)') + ' para añadirlo al código.</p>');
      else setFb(r.st, r.msg);
      if (r.st === 'ok') $('#nextStep').disabled = false;
    }
    function accept() {
      var cs = xs.steps[st.i], text;
      if (cs.type === 'blank') {
        var parts = parseTpl(cs.tpl), bi = 0; text = parts.map(function (p) { return p.a ? p.a[0] : p.t; }).join('');
      } else text = $('#answer').value.replace(/\s+$/, '');
      var helped = solShown ? 1 : 0;
      st.texts[st.i] = text; st.helped[st.i] = helped; st.i++;
      var gain = helped ? 2 : 4;
      JT.state.drafts['x:' + xs.id] = st; JT.saveState();
      JT.markDone('s:' + xs.id + ':' + (st.i - 1), gain, 'paso ' + st.i + ' de ' + N);
      if (st.i >= N) {
        st.done = true;
        var anyHelp = st.helped.some(Boolean);
        JT.markDone(xs.id, anyHelp ? 10 : 20, 'ejercicio completado');
        JT.state.drafts['x:' + xs.id] = st; JT.saveState();
      }
      sync(true); renderLeft();
      if (!st.done) { var el = $('#curStep'); el && el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }

    function onClick(e) {
      if (e.target.closest('#nextStep')) { if (!$('#nextStep').disabled) accept(); return; }
      if (e.target.closest('#hintBtn')) {
        var cs = xs.steps[st.i]; hintShown = !hintShown;
        $('#hintBox').innerHTML = hintShown ? '<div class="callout tip">' + ic('bulb') + '<div><b>Pista:</b> ' + cs.hint + '</div></div>' : ''; return;
      }
      if (e.target.closest('#solBtn')) {
        var c2 = xs.steps[st.i];
        if (!solShown && !confirm('Si ves la solución ganarás menos XP en este paso. ¿Quieres verla?')) return;
        solShown = true;
        var box = $('#hintBox');
        if (c2.type === 'blank') {
          var parts2 = parseTpl(c2.tpl).filter(function (p) { return p.a; }), ins = $('#blankLine').querySelectorAll('.blank');
          ins.forEach(function (el, k) { el.value = parts2[k].a[0]; }); evalBlank();
          box.innerHTML = '<div class="callout warn">' + ic('eye') + '<div>Completé los huecos con la respuesta correcta. Lee la explicación de arriba para entender por qué.</div></div>';
        } else {
          box.innerHTML = '<div class="callout warn">' + ic('eye') + '<div><b>Solución:</b><pre style="margin:6px 0 0;background:var(--code-bg);padding:8px 12px;border-radius:7px;white-space:pre-wrap;font:13px/1.6 var(--mono)">' + JT.highlight(c2.sol, c2.file || 'js') + '</pre>Escríbela tú en el cuadro para entenderla mejor (no se copia sola).</div></div>';
        }
        return;
      }
      if (e.target.closest('#openScreen')) { M.open(); return; }
      if (e.target.closest('#restartX')) {
        if (!confirm('¿Reiniciar este ejercicio desde cero?')) return;
        delete JT.state.drafts['x:' + xs.id]; JT.saveState();
        st = loadEx(xs); ed.__freed = false; sync(false); renderLeft(); JT.onProgress(); return;
      }
    }
    function onInput(e) {
      if (e.target.id === 'answer') { e.target.style.height = 'auto'; e.target.style.height = Math.min(220, e.target.scrollHeight) + 'px'; clearTimeout(onInput.t); onInput.t = setTimeout(evalAnswer, 90); }
      else if (e.target.classList.contains('blank')) evalBlank();
    }
    function onKey(e) {
      if (e.target.id === 'answer' && e.key === 'Enter' && !e.shiftKey && !xs.steps[st.i].multi) { e.preventDefault(); if (curState.st === 'ok') accept(); }
      if (e.target.id === 'answer' && e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '  '); }
      if (e.target.classList && e.target.classList.contains('blank') && e.key === 'Enter') { var nb = $('#nextStep'); if (nb && !nb.disabled) accept(); else { var all = Array.prototype.slice.call(document.querySelectorAll('.blank')), k = all.indexOf(e.target); all[k + 1] && all[k + 1].focus(); } }
    }
    view.addEventListener('click', onClick); view.addEventListener('input', onInput); view.addEventListener('keydown', onKey);
    cleanup.push(function () { view.removeEventListener('click', onClick); view.removeEventListener('input', onInput); view.removeEventListener('keydown', onKey); M.onOpen = null; });
    sync(false); renderLeft();
  }

  /* ============================== RETO RAPIDO ============================== */
  function pageQuiz(t) {
    var Q = t.quiz || [], i = 0, score = 0, answered = false, box = document.createElement('div');
    box.className = 'quiz'; view.appendChild(box);
    function head() { return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px"><span class="badge">Pregunta ' + (i + 1) + ' de ' + Q.length + '</span><div class="prog" style="flex:1"><i style="width:' + (i / Q.length * 100) + '%;background:' + t.color + '"></i></div><span class="badge ok">' + score + ' correctas</span></div>'; }
    function show() {
      if (i >= Q.length) {
        var pct = Math.round(score / Q.length * 100);
        if (score >= Math.ceil(Q.length * 0.6)) JT.markDone('quiz:' + t.id, 6, 'reto aprobado');
        box.innerHTML = '<div class="winbox"><div class="big">' + ic(pct >= 60 ? 'award' : 'flag') + '</div><h3>' + score + ' de ' + Q.length + ' correctas (' + pct + '%)</h3><p>' + (pct >= 80 ? '¡Excelente! Dominas este tema.' : pct >= 60 ? 'Bien hecho. Repasa los ejemplos que te costaron para afianzar.' : 'Sigue practicando: revisa los conceptos y los ejemplos y vuelve a intentarlo.') + '</p><div class="btnrow" style="justify-content:center"><button class="btn primary" id="qAgain">' + ic('refresh') + 'Intentar de nuevo</button><a class="btn" href="#/t/' + t.id + '/ejemplos">Repasar ejemplos</a></div></div>';
        return;
      }
      var q = Q[i]; answered = false;
      var h = head() + '<div class="qq">' + q.q + (q.code ? '<pre>' + JT.highlight(q.code, q.lang || 'js') + '</pre>' : '') + '</div>';
      h += q.opts.map(function (o, k) { return '<button class="qopt" data-k="' + k + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + (o.indexOf('\n') >= 0 || /^</.test(o) && false ? '<pre>' + esc(o) + '</pre>' : o) + '</span></button>'; }).join('');
      h += '<div id="qfb"></div>';
      box.innerHTML = h;
    }
    function onClick(e) {
      var a = e.target.closest('.qopt');
      if (a && !answered) {
        answered = true; var k = +a.getAttribute('data-k'), q = Q[i], ok = k === q.a;
        if (ok) score++;
        box.querySelectorAll('.qopt').forEach(function (b, j) { b.disabled = true; if (j === q.a) b.classList.add('right'); else if (j === k) b.classList.add('wrongc'); });
        $('#qfb').innerHTML = '<div class="fb ' + (ok ? 'good' : 'bad') + '">' + ic(ok ? 'check' : 'alert') + '<div><p><b>' + (ok ? '¡Correcto!' : 'No exactamente.') + '</b></p><p>' + q.why + '</p></div></div><div class="btnrow"><button class="btn primary" id="qNext">' + (i + 1 < Q.length ? 'Siguiente pregunta' : 'Ver resultado') + ic('right') + '</button></div>';
        if (ok && JT.markDone('q:' + t.id + ':' + i, 2, 'respuesta correcta')) { /* xp otorgado */ }
        return;
      }
      if (e.target.closest('#qNext')) { i++; show(); return; }
      if (e.target.closest('#qAgain')) { i = 0; score = 0; show(); }
    }
    box.addEventListener('click', onClick);
    show();
  }

  /* ============================== arranque ============================== */
  function init() {
    JT.loadState();
    view = $('#view');
    JT.help.init();
    JT.topics.sort(function (a, b) { return a.num - b.num; });
    $('#helpBtn').addEventListener('click', function () { JT.help.openIntro(); });
    $('#menuBtn').addEventListener('click', function () { $('#side').classList.toggle('open'); });
    view.addEventListener('click', function (e) { var q = e.target.closest('.q'); if (q) JT.help.openTerm(q.getAttribute('data-term')); });
    window.addEventListener('hashchange', route);
    renderXp(); route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
