/* js-trick :: panel de usuario, catálogo de lenguajes, barra lateral y estadísticas */
(function () {
  var JT = window.JT, esc = JT.esc, ic = JT.icon;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  JT.pages = {};

  /* ============================== utilidades ============================== */
  function topicsOf(trackId) { return JT.topics.filter(function (t) { return (t.track || 'js') === trackId; }); }
  JT.topicsOf = topicsOf;
  /* ejercicio que acompaña al ejemplo i */
  JT.pair = function (t, i) {
    var E = t.examples.length, X = t.exercises.length;
    if (!X) return -1;
    return E === X ? i : Math.min(X - 1, Math.floor(i * X / E));
  };
  function topicStats(t) {
    var done = 0, total = 0, ex = 0, xs = 0;
    (t.examples || []).forEach(function (e) { total++; if (JT.state.done[e.id]) { done++; ex++; } });
    (t.exercises || []).forEach(function (e) { total++; if (JT.state.done[e.id]) { done++; xs++; } });
    if ((t.quiz || []).length) { total++; if (JT.state.done['quiz:' + t.id]) done++; }
    return { done: done, total: total, ex: ex, xs: xs, pct: total ? Math.round(done / total * 100) : 0 };
  }
  function trackStats(id) {
    var o = { done: 0, total: 0, ex: 0, xs: 0, exTotal: 0, xsTotal: 0, topics: 0 };
    topicsOf(id).forEach(function (t) { var s = topicStats(t); o.done += s.done; o.total += s.total; o.ex += s.ex; o.xs += s.xs; o.exTotal += t.examples.length; o.xsTotal += t.exercises.length; o.topics++; });
    o.pct = o.total ? Math.round(o.done / o.total * 100) : 0;
    return o;
  }
  function totals() {
    var o = { ex: 0, xs: 0, exTotal: 0, xsTotal: 0, quiz: 0, tracksStarted: 0 };
    JT.tracks.forEach(function (tr) { var s = trackStats(tr.id); o.ex += s.ex; o.xs += s.xs; o.exTotal += s.exTotal; o.xsTotal += s.xsTotal; if (s.done) o.tracksStarted++; });
    Object.keys(JT.state.done).forEach(function (k) { if (/^quiz:/.test(k)) o.quiz++; });
    return o;
  }
  /* siguiente actividad de un tema: primero el ejemplo, luego su práctica */
  function nextInTopic(t) {
    for (var i = 0; i < t.examples.length; i++) {
      if (!JT.state.done[t.examples[i].id]) return { hash: '#/t/' + t.id + '/e/' + i, title: 'Ejemplo ' + (i + 1) + ': ' + t.examples[i].title, t: t };
      var p = JT.pair(t, i);
      if (p >= 0 && !JT.state.done[t.exercises[p].id]) return { hash: '#/t/' + t.id + '/x/' + p, title: 'Práctica ' + (p + 1) + ': ' + t.exercises[p].title, t: t };
    }
    for (var k = 0; k < t.exercises.length; k++) if (!JT.state.done[t.exercises[k].id]) return { hash: '#/t/' + t.id + '/x/' + k, title: 'Práctica ' + (k + 1) + ': ' + t.exercises[k].title, t: t };
    if ((t.quiz || []).length && !JT.state.done['quiz:' + t.id]) return { hash: '#/t/' + t.id + '/quiz', title: 'Reto rápido de ' + t.short, t: t };
    return null;
  }
  function nextInTrack(id) { var ts = topicsOf(id); for (var i = 0; i < ts.length; i++) { var n = nextInTopic(ts[i]); if (n) return n; } return null; }
  function next() {
    var order = [];
    if (JT.state.lastTrack) order.push(JT.state.lastTrack);
    ['html', 'js', 'python'].forEach(function (id) { order.push(id); });
    JT.tracks.forEach(function (tr) { order.push(tr.id); });
    for (var i = 0; i < order.length; i++) { if (!topicsOf(order[i]).length) continue; var n = nextInTrack(order[i]); if (n) return n; }
    var f = JT.topics[0]; return { hash: '#/t/' + f.id + '/conceptos', title: 'Repasar ' + f.short, t: f };
  }
  JT.stats = { topic: topicStats, track: trackStats, totals: totals, next: next, nextInTrack: nextInTrack, nextInTopic: nextInTopic };
  JT.nextHash = function () { return next().hash; };

  /* ============================== logros ============================== */
  function drafts(fn) { var r = false; Object.keys(JT.state.drafts).forEach(function (k) { if (/^x:/.test(k) && fn(JT.state.drafts[k])) r = true; }); return r; }
  JT.badges = [
    { id: 'first', name: 'Primer paso', desc: 'Completa tu primera actividad.', icon: 'flag', test: function (T) { return T.ex + T.xs >= 1; } },
    { id: 'curious', name: 'Curioso', desc: 'Entiende 10 ejemplos.', icon: 'eye', test: function (T) { return T.ex >= 10; } },
    { id: 'explorer', name: 'Explorador', desc: 'Entiende 40 ejemplos.', icon: 'globe', test: function (T) { return T.ex >= 40; } },
    { id: 'hands', name: 'Manos a la obra', desc: 'Completa 5 ejercicios guiados.', icon: 'edit', test: function (T) { return T.xs >= 5; } },
    { id: 'practitioner', name: 'Practicante', desc: 'Completa 25 ejercicios guiados.', icon: 'target', test: function (T) { return T.xs >= 25; } },
    { id: 'streak3', name: 'Constancia', desc: 'Estudia 3 días seguidos.', icon: 'bolt', test: function () { return JT.streak() >= 3; } },
    { id: 'streak7', name: 'Imparable', desc: 'Estudia 7 días seguidos.', icon: 'bolt', test: function () { return JT.streak() >= 7; } },
    { id: 'poly', name: 'Políglota', desc: 'Empieza 3 cursos distintos.', icon: 'layers', test: function (T) { return T.tracksStarted >= 3; } },
    { id: 'master', name: 'Maestro de un lenguaje', desc: 'Completa al 100% un lenguaje.', icon: 'award', test: function () { return JT.tracks.some(function (tr) { var s = trackStats(tr.id); return s.total && s.done >= s.total; }); } },
    { id: 'nohelp', name: 'Sin muletas', desc: 'Termina un ejercicio sin ver la solución.', icon: 'lock', test: function () { return drafts(function (d) { return d.done && !(d.helped || []).some(Boolean); }); } },
    { id: 'perfect', name: 'Reto perfecto', desc: 'Contesta bien todo un reto rápido.', icon: 'star', test: function () { return JT.topics.some(function (t) { return (t.quiz || []).length && (JT.state.quiz[t.id] || 0) >= t.quiz.length; }); } },
    { id: 'lvl5', name: 'Nivel 5', desc: 'Llega al nivel 5.', icon: 'award', test: function () { return JT.level(JT.state.xp).n >= 5; } }
  ];
  JT.checkBadges = function () {
    var T = totals(), fresh = [];
    JT.badges.forEach(function (b) { if (!JT.state.badges[b.id] && b.test(T)) { JT.state.badges[b.id] = JT.today(); fresh.push(b); } });
    if (fresh.length) { JT.saveState(); fresh.forEach(function (b) { JT.toast('Logro desbloqueado: <b>' + esc(b.name) + '</b>', 'ok'); }); }
  };

  /* ============================== barra lateral ============================== */
  var openGroups = {};
  JT.pages.side = function (cur) {
    var h = '<a class="navlink' + (cur.kind === 'panel' ? ' cur' : '') + '" href="#/panel">' + ic('home') + 'Mi panel</a><a class="navlink' + (cur.kind === 'cursos' ? ' cur' : '') + '" href="#/cursos">' + ic('grid') + 'Todos los lenguajes</a>';
    JT.tracks.forEach(function (tr) {
      var ts = topicsOf(tr.id); if (!ts.length) return;
      var s = trackStats(tr.id), active = cur.track === tr.id, open = openGroups[tr.id] != null ? openGroups[tr.id] : active;
      h += '<div class="trackgrp' + (open ? ' open' : '') + '"><button class="trackhead" data-track="' + tr.id + '"><span class="tdot" style="background:' + tr.color + '"></span><b>' + esc(tr.name) + '</b><span class="tpct">' + s.pct + '%</span>' + ic('down') + '</button>';
      if (open) {
        ts.forEach(function (t) {
          var st = topicStats(t), act = cur.t === t.id;
          h += '<div class="navtopic' + (act ? ' active' : '') + '"><a class="head" href="#/t/' + t.id + '"><span class="num" style="background:' + t.color + '">' + esc(t.badge != null ? t.badge : t.num) + '</span><span class="tt"><b>' + esc(t.short) + '</b><span>' + st.done + ' de ' + st.total + ' completados</span></span></a><div class="mini"><i style="width:' + st.pct + '%;background:' + t.color + '"></i></div>';
          if (act) {
            h += '<div class="navsub"><a href="#/t/' + t.id + '/conceptos" class="' + (cur.kind === 'topic' && cur.tab === 'conceptos' ? 'cur' : '') + '"><span class="dot"></span>Conceptos</a>';
            h += '<div class="navgroup">Ejemplos y práctica</div>';
            t.examples.forEach(function (e, i) {
              var p = JT.pair(t, i), pe = p >= 0 ? t.exercises[p] : null;
              h += '<a href="#/t/' + t.id + '/e/' + i + '" class="' + (JT.state.done[e.id] ? 'done ' : '') + (cur.kind === 'e' && cur.i === i ? 'cur' : '') + '"><span class="dot"></span>' + (i + 1) + '. ' + esc(e.title) + '</a>';
              if (pe && (t.exercises.length === t.examples.length)) h += '<a href="#/t/' + t.id + '/x/' + p + '" class="sub ' + (JT.state.done[pe.id] ? 'done ' : '') + (cur.kind === 'x' && cur.i === p ? 'cur' : '') + '"><span class="dot sq"></span>Practicar: ' + esc(pe.title) + '</a>';
            });
            if (t.exercises.length !== t.examples.length) {
              h += '<div class="navgroup">Ejercicios</div>';
              t.exercises.forEach(function (e, i) { h += '<a href="#/t/' + t.id + '/x/' + i + '" class="' + (JT.state.done[e.id] ? 'done ' : '') + (cur.kind === 'x' && cur.i === i ? 'cur' : '') + '"><span class="dot"></span>' + (i + 1) + '. ' + esc(e.title) + '</a>'; });
            }
            if ((t.quiz || []).length) h += '<div class="navgroup">Reto</div><a href="#/t/' + t.id + '/quiz" class="' + (JT.state.done['quiz:' + t.id] ? 'done ' : '') + (cur.kind === 'topic' && cur.tab === 'quiz' ? 'cur' : '') + '"><span class="dot"></span>Reto rápido</a>';
            h += '</div>';
          }
          h += '</div>';
        });
      }
      h += '</div>';
    });
    var side = $('#side'); side.innerHTML = h;
    side.onclick = function (e) {
      var b = e.target.closest('.trackhead'); if (!b) return;
      var id = b.getAttribute('data-track'); openGroups[id] = !(openGroups[id] != null ? openGroups[id] : cur.track === id);
      JT.pages.side(cur);
    };
  };

  /* ============================== piezas visuales ============================== */
  function ring(pct, color, size, label) {
    var r = size / 2 - 6, c = 2 * Math.PI * r;
    return '<span class="ring" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#2c3140" stroke-width="6"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - pct / 100)).toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg><b>' + (label != null ? label : pct + '%') + '</b></span>';
  }
  function heatmap() {
    var weeks = 18, days = [], d = new Date(); d.setHours(0, 0, 0, 0);
    var start = new Date(d); start.setDate(start.getDate() - (weeks * 7 - 1) - 0);
    start.setDate(start.getDate() - start.getDay());
    var cells = '', cur = new Date(start), a = JT.state.activity || {};
    function key(x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
    while (cur <= d) {
      var n = a[key(cur)] || 0, lv = n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 7 ? 3 : 4;
      cells += '<i class="hm l' + lv + '" title="' + key(cur) + ': ' + n + ' actividad(es)"></i>';
      cur.setDate(cur.getDate() + 1);
    }
    return '<div class="heat">' + cells + '</div>';
  }
  function daily() {
    var all = [];
    JT.topics.forEach(function (t) { (t.quiz || []).forEach(function (q, i) { all.push({ t: t, q: q, i: i }); }); });
    if (!all.length) return '';
    var key = JT.today(), seed = 0; for (var i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    var pick = all[seed % all.length], dl = JT.state.daily || {}, done = dl.date === key;
    return { pick: pick, done: done, ok: done && dl.ok };
  }

  /* ============================== PANEL ============================== */
  JT.pages.panel = function (view) {
    document.title = 'js-trick | Mi panel';
    var P = JT.state.profile || { name: '', color: '#61afef' }, lv = JT.level(JT.state.xp), T = totals(), nx = next(), sk = JT.streak();
    var today = (JT.state.activity || {})[JT.today()] || 0, goal = 3;
    var dc = daily(), earned = JT.badges.filter(function (b) { return JT.state.badges[b.id]; }).length;
    var h = '<div class="dash-hero"><div class="avatar" style="background:' + P.color + '">' + esc((P.name || 'T').charAt(0).toUpperCase()) + '</div><div class="dh-main"><h1>' + (P.name ? 'Hola, ' + esc(P.name) : '¡Bienvenido a js-trick!') + '</h1><p>' + (T.ex + T.xs === 0 ? 'Elige un lenguaje y empieza con tu primer ejemplo. Cada ejemplo va seguido de un ejercicio para practicarlo.' : 'Llevas <b>' + (T.ex + T.xs) + '</b> actividades completadas. ¡Sigue así!') + '</p>' +
      (P.name ? '' : '<div class="namebox"><input id="pname" type="text" maxlength="24" placeholder="¿Cómo te llamas?"><button class="btn primary sm" id="psave">Guardar</button></div>') +
      '<div class="dh-xp"><span class="badge">Nivel ' + lv.n + ' · ' + esc(lv.name) + '</span><span class="xpbar big"><i style="width:' + lv.pct + '%"></i></span><span class="badge">' + JT.state.xp + ' XP</span></div></div>' +
      '<div class="dh-stats"><div class="stat">' + ic('bolt') + '<b>' + sk + '</b><span>día' + (sk === 1 ? '' : 's') + ' de racha</span></div><div class="stat">' + ic('award') + '<b>' + earned + '/' + JT.badges.length + '</b><span>logros</span></div><div class="stat">' + ic('check') + '<b>' + (T.ex + T.xs) + '</b><span>actividades</span></div></div></div>';

    h += '<div class="dash-grid"><div class="card continue"><h3>' + ic('play') + 'Continuar aprendiendo</h3><p class="nx-title">' + esc(nx.title) + '</p><p class="muted">' + esc(JT.trackOf(nx.t).name) + ' · ' + esc(nx.t.title) + '</p><a class="btn primary" href="' + nx.hash + '">' + ic('arrow') + 'Seguir ahora</a></div>' +
      '<div class="card goalcard"><h3>' + ic('target') + 'Meta de hoy</h3><div class="goalrow">' + ring(Math.min(100, Math.round(today / goal * 100)), '#98c379', 84, Math.min(today, goal) + '/' + goal) + '<p>' + (today >= goal ? '¡Meta cumplida! Todo lo que hagas hoy suma a tu racha.' : 'Haz ' + goal + ' actividades hoy (ejemplos, pasos de ejercicios o retos) para mantener tu racha.') + '</p></div></div>';
    if (dc) {
      h += '<div class="card dailycard"><h3>' + ic('flask') + 'Reto del día</h3>';
      if (dc.done) h += '<p class="' + (dc.ok ? 'okmsg' : 'badmsg') + '">' + (dc.ok ? '¡Correcto! Ganaste XP. Vuelve mañana por otro.' : 'Hoy no salió. Vuelve mañana por otro reto.') + '</p>';
      else h += '<p class="dq">' + dc.pick.q.q + '</p>' + (dc.pick.q.code ? '<pre class="dcode">' + JT.highlight(dc.pick.q.code, dc.pick.q.lang || 'js') + '</pre>' : '') + '<div class="dopts">' + dc.pick.q.opts.map(function (o, k) { return '<button class="qopt" data-dk="' + k + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + o + '</span></button>'; }).join('') + '</div><div id="dfb"></div>';
      h += '</div>';
    }
    h += '</div>';

    h += '<div class="sectiontitle">' + ic('layers') + '<h2 style="margin:0">Mis cursos</h2><a class="btn sm" style="margin-left:auto" href="#/cursos">Ver todos</a></div><div class="grid g3">' +
      JT.tracks.map(function (tr) {
        var s = trackStats(tr.id), has = topicsOf(tr.id).length, n = has ? nextInTrack(tr.id) : null;
        return '<a class="card trackcard" href="' + (has ? '#/curso/' + tr.id : '#/cursos') + '" style="--c:' + tr.color + '">' + ring(s.pct, tr.color, 64) + '<div><h3>' + esc(tr.name) + '</h3><div class="muted sm">' + s.ex + '/' + s.exTotal + ' ejemplos · ' + s.xs + '/' + s.xsTotal + ' ejercicios</div><div class="muted sm">' + (n ? 'Sigue: ' + esc(n.title.slice(0, 38)) : s.total ? '¡Completado!' : 'Próximamente') + '</div></div></a>';
      }).join('') + '</div>';

    h += '<div class="two"><div class="card"><h3>' + ic('calendar') + 'Tu actividad (últimas 18 semanas)</h3>' + heatmap() + '<div class="muted sm" style="margin-top:6px">Menos <i class="hm l0"></i><i class="hm l1"></i><i class="hm l2"></i><i class="hm l3"></i><i class="hm l4"></i> Más</div></div>' +
      '<div class="card"><h3>' + ic('award') + 'Logros</h3><div class="badges">' + JT.badges.map(function (b) { var got = JT.state.badges[b.id]; return '<div class="bdg' + (got ? ' on' : '') + '" title="' + esc(b.desc) + '">' + ic(got ? b.icon : 'lock') + '<b>' + esc(b.name) + '</b><span>' + esc(b.desc) + '</span></div>'; }).join('') + '</div></div></div>';
    h += '<div class="foot">js-trick · tu progreso vive en este navegador · <a href="#" id="resetProg">Reiniciar mi progreso</a> · <a href="index.html">Volver al inicio</a></div>';
    view.innerHTML = h;

    var sv = $('#psave');
    if (sv) { var save = function () { var v = $('#pname').value.trim(); if (!v) return; JT.state.profile.name = v; JT.saveState(); JT.pages.panel(view); }; sv.onclick = save; $('#pname').onkeydown = function (e) { if (e.key === 'Enter') save(); }; }
    var dopts = view.querySelectorAll('[data-dk]');
    dopts.forEach(function (b) {
      b.onclick = function () {
        var k = +b.getAttribute('data-dk'), ok = k === dc.pick.q.a;
        JT.state.daily = { date: JT.today(), ok: ok }; JT.saveState();
        dopts.forEach(function (x, j) { x.disabled = true; if (j === dc.pick.q.a) x.classList.add('right'); else if (j === k) x.classList.add('wrongc'); });
        $('#dfb').innerHTML = '<div class="fb ' + (ok ? 'good' : 'bad') + '">' + ic(ok ? 'check' : 'alert') + '<div>' + dc.pick.q.why + '</div></div>';
        if (ok) JT.markDone('daily:' + JT.today(), 5, 'reto del día'); else { JT.touch(1); JT.saveState(); }
        JT.checkBadges();
      };
    });
    $('#resetProg').onclick = function (e) { e.preventDefault(); if (confirm('¿Seguro que quieres borrar todo tu progreso y tus códigos guardados?')) { JT.resetState(); JT.toast('Progreso reiniciado'); JT.pages.panel(view); if (JT.onProgress) JT.onProgress(); } };
  };

  /* ============================== CATÁLOGO ============================== */
  JT.pages.cursos = function (view) {
    document.title = 'js-trick | Cursos';
    var h = '<div class="crumbs"><a href="#/panel">Mi panel</a>' + ic('right') + '<b>Cursos</b></div><div class="thead"><div><h1>Elige tu curso</h1><p>Cada curso tiene conceptos, lecciones (ejemplo con su desglose) con un ejercicio guiado después de cada una y un reto rápido.</p></div></div><div class="grid g3">' +
      JT.tracks.map(function (tr) {
        var ts = topicsOf(tr.id), s = trackStats(tr.id), has = ts.length;
        return '<a class="card catcard" href="' + (has ? '#/curso/' + tr.id : '#/cursos') + '" style="--c:' + tr.color + '"><div class="cc-top"><span class="cc-ic" style="background:' + tr.color + '">' + ic(tr.icon) + '</span><div><h3>' + esc(tr.name) + '</h3><span class="badge">' + (has ? ts.length + ' módulo' + (ts.length > 1 ? 's' : '') : 'Próximamente') + '</span></div></div><p>' + esc(tr.tagline) + '</p><p class="muted sm">' + esc(tr.why) + '</p><div class="meta"><span>' + s.exTotal + ' ejemplos</span><span>' + s.xsTotal + ' ejercicios</span></div><div class="prog"><i style="width:' + s.pct + '%;background:' + tr.color + '"></i></div></a>';
      }).join('') + '</div>' +
      (JT.soon.length ? '<div class="sectiontitle">' + ic('flag') + '<h2 style="margin:0">En camino</h2></div><div class="grid g4">' + JT.soon.map(function (x) { return '<div class="card soon" style="--c:' + x.color + '"><span class="soon-dot" style="background:' + x.color + '"></span><h3>' + esc(x.name) + '</h3><p class="muted sm">' + esc(x.tagline) + '</p><span class="badge">Próximamente</span></div>'; }).join('') + '</div>' : '');
    view.innerHTML = h;
  };

  /* ============================== PÁGINA DE UN LENGUAJE ============================== */
  JT.pages.curso = function (view, id) {
    var tr = JT.track(id), ts = topicsOf(id), s = trackStats(id), nx = nextInTrack(id);
    document.title = 'js-trick | ' + tr.name;
    var h = '<div class="crumbs"><a href="#/panel">Mi panel</a>' + ic('right') + '<a href="#/cursos">Cursos</a>' + ic('right') + '<b>' + esc(tr.name) + '</b></div>' +
      '<div class="track-hero" style="--c:' + tr.color + '"><span class="cc-ic big" style="background:' + tr.color + '">' + ic(tr.icon) + '</span><div><h1>' + esc(tr.name) + '</h1><p>' + esc(tr.tagline) + '</p><p class="muted">' + esc(tr.why) + '</p></div>' + ring(s.pct, tr.color, 84) + '</div>' +
      (nx ? '<div style="margin:14px 0"><a class="btn primary" href="' + nx.hash + '">' + ic('play') + (s.done ? 'Continuar: ' : 'Empezar: ') + esc(nx.title) + '</a></div>' : '') +
      '<div class="sectiontitle">' + ic('layers') + '<h2 style="margin:0">Módulos</h2></div><div class="list">' +
      ts.map(function (t) {
        var st = topicStats(t);
        return '<a class="item" href="#/t/' + t.id + '"><span class="idx" style="background:' + t.color + ';color:#10131a">' + esc(t.badge != null ? t.badge : t.num) + '</span><span class="tx"><b>' + esc(t.title) + '</b><span>' + esc(t.summary) + '</span></span><span class="badge">' + t.examples.length + ' ejemplos</span><span class="badge">' + st.pct + '%</span>' + ic('right') + '</a>';
      }).join('') + '</div>';
    view.innerHTML = h;
  };
})();
