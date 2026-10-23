/* js-trick :: nucleo (utilidades, estado, progreso, ayudantes para escribir contenido) */
(function () {
  var JT = (window.JT = window.JT || {});
  JT.topics = JT.topics || [];
  JT.glossary = JT.glossary || {};
  JT.libs = JT.libs || {};

  JT.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  JT.icon = function (n, cls) {
    return '<svg class="ic ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>';
  };
  /* texto sin acentos y en minúsculas (para buscar) */
  JT.plain = function (s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  /* ---------- ayudantes para escribir contenido ---------- */
  var mk = function (f) {
    return function (code, why) { return { f: f, code: code.replace(/^\n/, '').replace(/\s+$/, ''), why: why || '' }; };
  };
  JT.H = mk('html'); JT.C = mk('css'); JT.J = mk('js'); JT.T = mk('ts'); JT.M = mk('mod');
  JT.PY = mk('py'); JT.SQL = mk('sql'); JT.PHP = mk('php'); JT.CC = mk('c'); JT.CPP = mk('cpp'); JT.CS = mk('cs');
  JT.FILE_NAMES = { html: 'HTML', css: 'CSS', js: 'JavaScript', ts: 'Componente (.ts)', mod: 'app.module.ts', py: 'Python', sql: 'SQL', php: 'PHP', c: 'C', cpp: 'C++', cs: 'C#' };
  JT.FILE_EXT = { html: 'index.html', css: 'estilos.css', js: 'script.js', ts: 'app.component.ts', mod: 'app.module.ts', py: 'main.py', sql: 'consulta.sql', php: 'index.php', c: 'main.c', cpp: 'main.cpp', cs: 'Program.cs' };
  JT.FILE_COLOR = { html: '#e06c75', css: '#56b6c2', js: '#e5c07b', ts: '#61afef', mod: '#c678dd', py: '#61afef', sql: '#c678dd', php: '#8892bf', c: '#7f8ea3', cpp: '#d19a66', cs: '#98c379' };

  /* arma los archivos completos a partir de las partes de un ejemplo */
  JT.filesFromParts = function (parts) {
    var out = {};
    parts.forEach(function (p) { out[p.f] = (out[p.f] ? out[p.f] + (p.tight ? '\n' : '\n\n') : '') + p.code; });
    return out;
  };

  /* ---------- normalizacion de lo que escribe el alumno ---------- */
  JT.norm = function (s) {
    s = String(s || '');
    s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
    s = s.replace(/\u201c|\u201d/g, '"').replace(/\u2018|\u2019/g, "'");
    s = s.replace(/"/g, "'").replace(/\s+/g, ' ').trim();
    s = s.replace(/ ?([(){}\[\];,.:=+\-*\/<>!&|?]) ?/g, '$1');
    s = s.replace(/;+$/, '').replace(/;(?=\})/g, '');
    return s;
  };

  /* patron flexible: JT.eq("var @=JSON.parse(§)") -> @ = identificador, § = cualquier cosa; const/let/var intercambiables */
  JT.eq = function (str, opts) {
    var n = JT.norm(str), r = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    r = r.replace(/§/g, '.*?').replace(/@/g, '[A-Za-z_$][\\w$]*');
    if (!(opts && opts.exact)) r = r.replace(/^(?:const|let|var)(?= )/, '(?:const|let|var)');
    return new RegExp('^' + r + '$');
  };
  /* todas las expresiones deben cumplirse (sobre el texto normalizado) */
  JT.all = function () {
    var rs = Array.prototype.slice.call(arguments);
    return function (n) { return rs.every(function (r) { return r.test(n); }); };
  };

  /* ---------- estado persistente ---------- */
  var KEY = 'jstrick:estado:v1';
  JT.state = { done: {}, xp: 0, drafts: {}, quiz: {}, helped: {}, profile: { name: '', color: '#61afef' }, activity: {}, badges: {}, daily: {} };
  JT.loadState = function () {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var o = JSON.parse(raw); for (var k in o) JT.state[k] = o[k]; }
    } catch (e) { /* sin almacenamiento: se trabaja en memoria */ }
  };
  JT.saveState = function () {
    try { localStorage.setItem(KEY, JSON.stringify(JT.state)); } catch (e) { /* ignorar */ }
  };
  JT.resetState = function () {
    JT.state = { done: {}, xp: 0, drafts: {}, quiz: {}, helped: {}, profile: { name: '', color: '#61afef' }, activity: {}, badges: {}, daily: {} };
    JT.saveState();
  };

  JT.LEVELS = [
    [0, 'Novato'], [80, 'Aprendiz'], [220, 'Explorador'], [450, 'Dev Junior'],
    [800, 'Dev'], [1250, 'Maestro del código'], [1800, 'Leyenda']
  ];
  JT.level = function (xp) {
    var lv = 0;
    for (var i = 0; i < JT.LEVELS.length; i++) if (xp >= JT.LEVELS[i][0]) lv = i;
    var cur = JT.LEVELS[lv][0], nxt = JT.LEVELS[lv + 1] ? JT.LEVELS[lv + 1][0] : cur + 1;
    return { n: lv + 1, name: JT.LEVELS[lv][1], pct: lv + 1 >= JT.LEVELS.length ? 100 : Math.round(((xp - cur) / (nxt - cur)) * 100), next: nxt };
  };
  /* actividad diaria (para la racha y el mapa de calor) */
  JT.today = function () { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  JT.touch = function (n) { var k = JT.today(); JT.state.activity = JT.state.activity || {}; JT.state.activity[k] = (JT.state.activity[k] || 0) + (n || 1); };
  JT.streak = function () {
    var a = JT.state.activity || {}, d = new Date(), n = 0;
    function key(x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
    if (!a[key(d)]) d.setDate(d.getDate() - 1);
    while (a[key(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  JT.addXp = function (n, why) {
    if (!n) return;
    JT.touch(1);
    var before = JT.level(JT.state.xp).n;
    JT.state.xp += n;
    JT.saveState();
    JT.toast('<b>+' + n + ' XP</b> ' + JT.esc(why || ''), 'ok');
    var after = JT.level(JT.state.xp);
    if (after.n > before) JT.toast('Subiste a nivel ' + after.n + ': <b>' + after.name + '</b>', 'ok');
    if (JT.onProgress) JT.onProgress();
    if (JT.checkBadges) JT.checkBadges();
  };
  /* marca un elemento como hecho una sola vez y da XP */
  JT.markDone = function (id, xp, why) {
    if (JT.state.done[id]) return false;
    JT.state.done[id] = 1;
    JT.saveState();
    JT.addXp(xp, why);
    return true;
  };

  JT.toast = function (html, kind) {
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = html;
    box.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .4s'; t.style.opacity = 0; }, 2600);
    setTimeout(function () { t.remove(); }, 3100);
  };

  /* distancia de edicion (para sugerir "quisiste decir...") */
  JT.lev = function (a, b) {
    a = String(a); b = String(b);
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++)
      for (j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  };
  JT.closest = function (word, list, maxDist) {
    var best = null, bd = 99, w = String(word).toLowerCase();
    list.forEach(function (c) {
      var dd = JT.lev(w, String(c).toLowerCase());
      if (dd < bd) { bd = dd; best = c; }
    });
    var lim = maxDist == null ? Math.max(2, Math.floor(w.length / 3)) : maxDist;
    return bd <= lim ? best : null;
  };

  JT.topic = function (id) {
    for (var i = 0; i < JT.topics.length; i++) if (JT.topics[i].id === id) return JT.topics[i];
    return null;
  };
})();
