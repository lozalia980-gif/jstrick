/* Xidecode :: retos libres (sin pasos guiados): el alumno escribe el programa completo y se corrige ejecutándolo de verdad.
   JT.retosDef('py1', { lang: 'py', items: [{ t, s, g, start, sol, hint, tests: [{ code, stdin, label }] }] })
   - py: Python (Pyodide); sql: sql.js sobre la base de ejemplo del tema; js: JavaScript en un Worker (con console.log).
   - La salida esperada se obtiene ejecutando la solución del autor, así que solo hay que escribir `sol`.
   - tests: cada prueba añade su `code` al final del programa del alumno (o `stdin` en Python) y compara la salida. */
(function () {
  var JT = window.JT, esc = JT.esc, ic = JT.icon, T = JT.term;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var defs = {};
  JT.retos = { defs: defs };
  JT.retosDef = function (id, d) { defs[id] = d; };
  JT.retosOf = function (t) { var d = defs[t.id]; return d ? d.items : []; };

  /* ---------- ejecución ---------- */
  function fmtJs(a) { return typeof a === 'string' ? a : (a === undefined ? 'undefined' : (typeof a === 'function' ? String(a) : JSON.stringify(a))); }
  function runJs(code) {
    return new Promise(function (resolve) {
      var src = 'var __o=[];var console={log:function(){__o.push([].slice.call(arguments).map(function(a){try{return typeof a==="string"?a:(a===undefined?"undefined":(typeof a==="function"?String(a):JSON.stringify(a)))}catch(e){return String(a)}}).join(" "))}};' +
        'var AF=Object.getPrototypeOf(async function(){}).constructor;' +
        'var f=new AF("console",' + JSON.stringify(code) + ');' +
        'f(console).then(function(){setTimeout(function(){postMessage({ok:true,text:__o.join("\\n")})},150)},function(e){postMessage({ok:false,text:__o.join("\\n"),error:{type:(e&&e.name)||"Error",message:String((e&&e.message)||e)}})});';
      var w, url;
      try { url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' })); w = new Worker(url); } catch (e) { return resolve({ ok: false, text: '', error: { type: 'Error', message: 'Este navegador no puede ejecutar el código aquí.' } }); }
      var to = setTimeout(function () { w.terminate(); URL.revokeObjectURL(url); resolve({ ok: false, text: '', error: { type: 'Timeout', message: 'El programa tardó demasiado (¿hay un bucle infinito?).' } }); }, 4000);
      w.onmessage = function (m) { clearTimeout(to); w.terminate(); URL.revokeObjectURL(url); resolve(m.data); };
      w.onerror = function (e) { clearTimeout(to); w.terminate(); URL.revokeObjectURL(url); resolve({ ok: false, text: '', error: { type: 'SyntaxError', message: String(e.message || 'Error de sintaxis') } }); e.preventDefault && e.preventDefault(); };
    });
  }
  function runOne(t, d, code, test) {
    test = test || {};
    if (d.lang === 'py') return T.python(code + (test.code ? '\n' + test.code : ''), test.stdin);
    if (d.lang === 'sql') return T.sql(code + (test.code ? '\n' + test.code : ''), t.seed);
    return runJs(code + (test.code ? '\n' + test.code : ''));
  }
  function norm(s) { return String(s == null ? '' : s).replace(/\r/g, '').split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).join('\n').trim(); }
  function tests(c) { return c.tests && c.tests.length ? c.tests : [{}]; }

  /* ejecuta todas las pruebas con un código y devuelve [{label, got, exp, ok, error}] */
  function evaluate(t, d, c, code) {
    var list = tests(c), out = [], p = Promise.resolve();
    list.forEach(function (test, k) {
      p = p.then(function () { return runOne(t, d, c.sol, test); }).then(function (exp) {
        return runOne(t, d, code, test).then(function (got) {
          out.push({ label: test.label || (list.length > 1 ? 'Prueba ' + (k + 1) : ''), got: got.text || '', exp: exp.text || '', ok: got.ok !== false && norm(got.text) === norm(exp.text), error: got.error || null });
        });
      });
    });
    return p.then(function () { return out; });
  }
  JT.retos.evaluate = evaluate;

  /* comprobación interna: la solución debe pasar y el código inicial no */
  JT.retos.selfTest = function () {
    var problems = [], p = Promise.resolve();
    Object.keys(defs).forEach(function (id) {
      var t = JT.topic(id), d = defs[id];
      if (!t) { problems.push(id + ': tema inexistente'); return; }
      d.items.forEach(function (c, i) {
        var w = id + ' reto ' + (i + 1) + ' (' + c.t + ')';
        p = p.then(function () { return evaluate(t, d, c, c.sol); }).then(function (r) {
          r.forEach(function (x) { if (!x.ok) problems.push(w + ': la solución falla. ' + (x.error ? x.error.message : '')); if (!norm(x.exp)) problems.push(w + ': la solución no imprime nada'); });
          return evaluate(t, d, c, c.start || '');
        }).then(function (r) { if (r.every(function (x) { return x.ok; })) problems.push(w + ': el código inicial ya pasa'); })
          .catch(function (e) { problems.push(w + ': ' + e.message); });
      });
    });
    return p.then(function () { return problems; });
  };

  /* ---------- listado (pestaña) ---------- */
  JT.retos.list = function (t) {
    var items = JT.retosOf(t);
    return '<div class="callout info">' + ic('target') + '<div><b>Retos libres.</b> Aquí nadie te dicta el código: lees el enunciado, escribes el programa completo y el sistema lo <b>ejecuta de verdad</b> y compara el resultado. Es la mejor forma de comprobar si ya lo dominas.</div></div>' +
      '<div class="list">' + items.map(function (c, i) {
        var id = 'r:' + t.id + ':' + i, ok = JT.state.done[id];
        return '<a class="item' + (ok ? ' done' : '') + '" href="#/t/' + t.id + '/r/' + i + '"><span class="idx">' + (ok ? ic('check') : i + 1) + '</span><span class="tx"><b>' + esc(c.t) + '</b><span>' + esc(c.s || '') + '</span></span><span class="badge' + (ok ? ' ok' : '') + '">' + (ok ? 'Resuelto' : 'Pendiente') + '</span>' + ic('right') + '</a>';
      }).join('') + '</div>';
  };

  /* ---------- página de un reto ---------- */
  JT.retos.page = function (view, t, i, cleanup) {
    var d = defs[t.id], c = d.items[i], id = 'r:' + t.id + ':' + i, helped = !!(JT.state.drafts[id] && JT.state.drafts[id].helped), busy = false;
    var saved = JT.state.drafts[id] && JT.state.drafts[id].code;
    var lang = d.lang === 'js' ? 'js' : d.lang;
    var prev = d.items[i - 1], next = d.items[i + 1];
    document.title = 'Xidecode | Reto: ' + c.t;
    view.innerHTML = '<div class="crumbs"><a href="#/">Inicio</a>' + ic('right') + '<a href="#/t/' + t.id + '/retos">' + esc(t.guide) + '</a>' + ic('right') + '<b>Reto ' + (i + 1) + ' de ' + d.items.length + '</b></div>' +
      '<h1 style="margin:0 0 4px">' + esc(c.t) + '</h1>' +
      '<div class="card"><h3>' + ic('target') + 'Tu misión</h3>' + c.g + '</div>' +
      '<div class="card"><h3>' + ic('code') + 'Tu código</h3><textarea id="retoCode" class="answer" spellcheck="false" autocomplete="off" autocapitalize="off" style="width:100%;min-height:260px;box-sizing:border-box;font:13px/1.6 var(--mono);tab-size:4"></textarea>' +
      '<div class="btnrow" style="margin-top:10px"><button class="btn primary" id="retoRun">' + ic('play') + 'Ejecutar y comprobar</button><button class="btn" id="retoHint">' + ic('bulb') + 'Dame una pista</button><button class="btn" id="retoSol">' + ic('eye') + 'Ver solución</button><button class="btn" id="retoReset">Reiniciar</button></div>' +
      '<div id="retoBox"></div></div>' +
      '<div class="navrow">' + (prev ? '<a class="btn sm" href="#/t/' + t.id + '/r/' + (i - 1) + '">' + ic('left') + 'Anterior</a>' : '') + '<a class="btn sm" href="#/t/' + t.id + '/retos">Todos los retos</a>' + (next ? '<a class="btn sm" href="#/t/' + t.id + '/r/' + (i + 1) + '">Siguiente' + ic('right') + '</a>' : '') + '</div>';
    var ta = $('#retoCode'), box = $('#retoBox'), saveT;
    ta.value = saved != null ? saved : (c.start || '');
    function save() { JT.state.drafts[id] = { code: ta.value, helped: helped }; JT.saveState(); }
    ta.addEventListener('input', function () { clearTimeout(saveT); saveT = setTimeout(save, 400); });
    ta.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, d.lang === 'py' ? '    ' : '  '); } });
    function pre(s) { return '<pre style="margin:4px 0 0;background:var(--code-bg);padding:8px 12px;border-radius:7px;white-space:pre-wrap;font:13px/1.55 var(--mono);max-height:240px;overflow:auto">' + esc(s || '(sin salida)') + '</pre>'; }
    function onClick(e) {
      if (e.target.closest('#retoHint')) { box.innerHTML = '<div class="callout tip">' + ic('bulb') + '<div><b>Pista:</b> ' + (c.hint || 'Relee el enunciado y prueba el programa paso a paso.') + '</div></div>'; return; }
      if (e.target.closest('#retoSol')) {
        if (!helped && !confirm('Si ves la solución ganarás menos XP en este reto. ¿Quieres verla?')) return;
        helped = true; save();
        box.innerHTML = '<div class="callout warn">' + ic('eye') + '<div><b>Solución:</b>' + pre(c.sol).replace('max-height:240px', 'max-height:none') + '</div></div>'; return;
      }
      if (e.target.closest('#retoReset')) { if (confirm('¿Volver al código inicial?')) { ta.value = c.start || ''; save(); box.innerHTML = ''; } return; }
      if (e.target.closest('#retoRun')) {
        if (busy) return; busy = true; save();
        var btn = $('#retoRun'); btn.disabled = true;
        box.innerHTML = '<div class="callout info">' + ic('info') + '<div>Ejecutando' + (d.lang === 'py' ? ' (la primera vez Python se descarga unos segundos)' : '') + '...</div></div>';
        evaluate(t, d, c, ta.value).then(function (res) {
          busy = false; btn.disabled = false;
          var bad = res.filter(function (x) { return !x.ok; })[0], h;
          if (!bad) {
            JT.markDone(id, helped ? 6 : 18, 'reto resuelto: ' + c.t);
            h = '<div class="callout tip">' + ic('check') + '<div><b>¡Reto resuelto!</b> Tu programa produce exactamente lo que se pedía' + (helped ? ' (con ayuda: ganas menos XP)' : '') + '.' + (res[0].got ? '<br><span style="opacity:.8">Salida:</span>' + pre(res[0].got) : '') + (next ? '<br><a class="btn sm primary" style="margin-top:8px" href="#/t/' + t.id + '/r/' + (i + 1) + '">Siguiente reto' + ic('right') + '</a>' : '') + '</div></div>';
          } else if (bad.error) {
            var info = null; try { info = lang !== 'js' ? T.explain(lang, bad.error) : null; } catch (e2) { /* sin explicación */ }
            h = '<div class="callout bad">' + ic('alert') + '<div><b>Tu programa tuvo un error.</b>' + (info ? '<br><b>' + info.title + '.</b> ' + info.msg + '<br>' + info.fix : '') + pre(bad.error.type + ': ' + bad.error.message) + (bad.got ? '<span style="opacity:.8">Antes del error mostró:</span>' + pre(bad.got) : '') + '</div></div>';
          } else {
            h = '<div class="callout warn">' + ic('warn') + '<div><b>Todavía no coincide.</b>' + (bad.label ? ' (' + esc(bad.label) + ')' : '') + ' Compara lo que produce tu programa con lo que se pide:<br><span style="opacity:.8">Tu salida:</span>' + pre(bad.got) + '<span style="opacity:.8">Salida esperada:</span>' + pre(bad.exp) + '</div></div>';
          }
          box.innerHTML = h;
        }, function (err) { busy = false; btn.disabled = false; box.innerHTML = '<div class="callout bad">' + ic('alert') + '<div>' + esc(err.message || err) + ' Revisa tu conexión: ' + (d.lang === 'sql' ? 'SQL' : 'Python') + ' necesita descargar su motor la primera vez.</div></div>'; });
      }
    }
    view.addEventListener('click', onClick);
    cleanup.push(function () { view.removeEventListener('click', onClick); clearTimeout(saveT); });
  };
})();
