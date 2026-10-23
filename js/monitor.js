/* js-trick :: la "computadora" donde se ve el resultado (tapa que se abre) + consola + almacenamiento */
(function () {
  var JT = window.JT;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  var M = JT.monitor = {
    el: null, sb: null, spec: null, isOpen: false, logs: [], storage: { local: {}, session: {} }, tab: 'console', onError: null, full: false, errCount: 0
  };

  M.build = function () {
    if (M.el) return M.el;
    var el = document.createElement('div');
    el.className = 'monitor';
    el.innerHTML =
      '<div class="mon-head"><b>' + JT.icon('monitor') + 'Pantalla del resultado</b><span class="spacer"></span><span class="mon-state badge">Apagada</span></div>' +
      '<div class="lap" id="lap"><div class="lid"><div class="screen"><iframe title="Resultado del código" sandbox="allow-scripts allow-same-origin allow-forms allow-modals"></iframe><div class="ovl"><div></div></div></div></div><div class="lap-base"></div></div>' +
      '<div class="mon-tools">' +
      '<button class="btn primary sm" data-a="toggle">' + JT.icon('play') + '<span>Ver resultado</span></button>' +
      '<button class="btn sm" data-a="reload" title="Vuelve a ejecutar el código">' + JT.icon('refresh') + 'Recargar</button>' +
      '<button class="btn sm" data-a="full" title="Pantalla completa">' + JT.icon('max') + 'Ampliar</button>' +
      '<span class="storage-tools" style="display:none;gap:6px"><button class="btn sm" data-a="newsession" title="Simula cerrar la pestaña: sessionStorage se borra, localStorage se queda">' + JT.icon('x') + 'Cerrar pestaña</button><button class="btn sm" data-a="clearstore">' + JT.icon('trash') + 'Borrar datos</button></span>' +
      '<span class="server-tools" style="display:none"><button class="btn sm" data-a="resetserver" title="Restaura los datos del servidor de práctica">' + JT.icon('db') + 'Reiniciar servidor</button></span>' +
      '</div>' +
      '<div class="mon-panel"><div class="mon-tabs"><button data-t="console" class="on">Consola<span class="cnt">0</span></button><button data-t="storage">Almacenamiento<span class="cnt">0</span></button></div><div class="mon-body"></div></div>';
    M.el = el;
    M.iframe = $('iframe', el); M.lap = $('.lap', el); M.screen = $('.screen', el);
    M.sb = new JT.Sandbox(M.iframe, M.onMsg);
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'), t = e.target.closest('[data-t]');
      if (t) { M.tab = t.getAttribute('data-t'); M.renderPanel(); return; }
      if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'toggle') M.isOpen ? M.close() : M.open();
      else if (a === 'reload') { if (!M.isOpen) M.open(); else M.run(); }
      else if (a === 'full') M.toggleFull();
      else if (a === 'newsession') { try { clearPrefix(sessionStorage, 'jt-ss:'); } catch (er) { /* ignorar */ } M.storage.session = {}; if (M.isOpen) M.run(); else M.renderPanel(); JT.toast('Pestaña "cerrada": sessionStorage vacío. localStorage sigue ahi.'); }
      else if (a === 'clearstore') { try { clearPrefix(localStorage, 'jt-ls:'); clearPrefix(sessionStorage, 'jt-ss:'); } catch (er) { /* ignorar */ } M.storage = { local: {}, session: {} }; if (M.isOpen) M.run(); else M.renderPanel(); }
      else if (a === 'resetserver') { try { window.__jtMockDB = undefined; } catch (er) { /* ignorar */ } JT.toast('Servidor de práctica restaurado'); if (M.isOpen) M.run(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && M.full) M.toggleFull(); });
    M.renderPanel();
    return el;
  };
  function clearPrefix(store, pre) {
    var del = []; for (var i = 0; i < store.length; i++) { var k = store.key(i); if (k && k.indexOf(pre) === 0) del.push(k); }
    del.forEach(function (k) { store.removeItem(k); });
  }

  M.attach = function (container, cfg) {
    M.build();
    cfg = cfg || {};
    container.appendChild(M.el);
    $('.storage-tools', M.el).style.display = cfg.storage ? 'inline-flex' : 'none';
    $('.server-tools', M.el).style.display = cfg.server ? 'inline-flex' : 'none';
    M.onError = cfg.onError || null;
    M.spec = null; M.logs = []; M.errCount = 0; M.setBlocked(null); M.syncStorage();
    if (M.isOpen) { M.sb.blank(); }
    M.renderPanel();
  };
  M.syncStorage = function () {
    var l = {}, s = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('jt-ls:') === 0) l[k.slice(6)] = localStorage.getItem(k); } } catch (e) { /* ignorar */ }
    try { for (var j = 0; j < sessionStorage.length; j++) { var k2 = sessionStorage.key(j); if (k2.indexOf('jt-ss:') === 0) s[k2.slice(6)] = sessionStorage.getItem(k2); } } catch (e) { /* ignorar */ }
    M.storage = { local: l, session: s };
  };

  M.setState = function (txt, ok) {
    var b = $('.mon-state', M.el); b.textContent = txt; b.className = 'mon-state badge' + (ok ? ' ok' : '');
    var btn = $('[data-a=toggle]', M.el);
    btn.innerHTML = JT.icon(M.isOpen ? 'x' : 'play') + '<span>' + (M.isOpen ? 'Cerrar pantalla' : 'Ver resultado') + '</span>';
  };
  M.open = function () {
    M.isOpen = true; M.lap.classList.add('open'); M.setState('Encendida', true);
    setTimeout(function () { M.run(); }, 250);
    if (M.onOpen) M.onOpen();
  };
  M.close = function () {
    M.isOpen = false; M.lap.classList.remove('open'); M.setState('Apagada', false);
    setTimeout(function () { if (!M.isOpen) M.sb.blank(); }, 900);
  };
  M.setSpec = function (spec) { M.spec = spec; };
  M.run = function () {
    if (!M.spec || !M.isOpen) return;
    M.logs = []; M.errCount = 0;
    M.setBlocked(null);
    M.sb.run(M.spec);
    M.renderPanel();
  };
  M.setBlocked = function (txt) {
    M.screen.classList.toggle('blocked', !!txt);
    $('.ovl > div', M.el).innerHTML = txt ? '<div>' + JT.icon('alert') + '<br><b>No se ejecuta todavía</b><br>' + txt + '</div>' : '';
  };
  M.toggleFull = function () {
    M.full = !M.full;
    M.el.classList.toggle('fullmon', M.full);
    var bar = $('.mon-tools [data-a=full]', M.el); bar.lastChild.nodeValue = M.full ? 'Reducir' : 'Ampliar';
  };

  M.onMsg = function (m) {
    if (m.type === 'log') { M.logs.push({ level: m.level, text: m.text }); if (M.logs.length > 200) M.logs.shift(); }
    else if (m.type === 'clear') M.logs = [];
    else if (m.type === 'storage') M.storage = { local: m.local || {}, session: m.session || {} };
    else if (m.type === 'error') {
      M.errCount++;
      var txt = String(m.message || '').replace(/^Uncaught /, ''); if (m.name && txt.indexOf(m.name) !== 0) txt = m.name + ': ' + txt; M.logs.push({ level: 'error', text: txt });
      if (M.onError) M.onError(m);
    }
    M.renderPanel();
  };

  M.renderPanel = function () {
    if (!M.el) return;
    var body = $('.mon-body', M.el), tabs = M.el.querySelectorAll('.mon-tabs button');
    var nL = Object.keys(M.storage.local).length + Object.keys(M.storage.session).length;
    tabs.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === M.tab); });
    tabs[0].querySelector('.cnt').textContent = M.logs.length; tabs[1].querySelector('.cnt').textContent = nL;
    var keep = body.scrollTop, atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 12;
    if (M.tab === 'console') {
      body.innerHTML = M.logs.length ? M.logs.map(function (l) { return '<div class="row ' + (l.level === 'error' ? 'err' : l.level === 'warn' ? 'warn' : l.level === 'sys' ? 'sys' : '') + '">' + JT.esc(l.text) + '</div>'; }).join('') : '<div class="empty">Aquí aparece lo que escribas con console.log(...) y los errores de ejecución.</div>';
    } else {
      var rows = function (o) { var k = Object.keys(o); return k.length ? k.map(function (x) { return '<tr><td>' + JT.esc(x) + '</td><td>' + JT.esc(String(o[x]).slice(0, 300)) + '</td></tr>'; }).join('') : '<tr><td colspan="2" style="color:#646b7d;font-style:italic">vacío</td></tr>'; };
      body.innerHTML = '<div class="area">localStorage (persiste al cerrar el navegador)</div><table><tr><th>Clave</th><th>Valor</th></tr>' + rows(M.storage.local) + '</table><div class="area">sessionStorage (solo esta pestaña)</div><table><tr><th>Clave</th><th>Valor</th></tr>' + rows(M.storage.session) + '</table>';
    }
    if (M.tab === 'console' && atEnd) body.scrollTop = body.scrollHeight; else body.scrollTop = keep;
  };
})();
