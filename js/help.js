/* Xidecode :: cuadro de ayuda "?" (explica términos, líneas y responde dudas escritas) */
(function () {
  var JT = window.JT, esc = JT.esc;
  var H = JT.help = { parts: [], history: [] };
  var ov, modal;

  H.init = function () {
    ov = document.getElementById('overlay'); modal = document.getElementById('modal');
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) H.close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('show')) H.close(); });
    modal.addEventListener('click', function (e) {
      var t = e.target.closest('[data-term]'); if (t && !t.closest('.tk')) { H.openTerm(t.getAttribute('data-term')); return; }
      if (e.target.closest('[data-close]')) H.close();
      var b = e.target.closest('[data-back]'); if (b) H.back();
      var s = e.target.closest('[data-ask]'); if (s) H.ask();
    });
    modal.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.id === 'askInput') H.ask(); });
  };
  H.close = function () { if (ov) ov.classList.remove('show'); };
  H.show = function (title, body, opts) {
    opts = opts || {};
    modal.innerHTML =
      '<div class="mh">' + (H.history.length > 1 ? '<button class="xbtn" data-back title="Volver">' + JT.icon('left') + '</button>' : '') + '<h3>' + title + '</h3><button class="xbtn" data-close title="Cerrar (Esc)">' + JT.icon('x') + '</button></div>' +
      '<div class="mb">' + body + '</div>' +
      '<div class="askbox"><input id="askInput" type="text" placeholder="Escribe tu duda (ej: cómo guardo un objeto, para qué sirve open, qué es ngFor)" value="' + esc(opts.query || '') + '"><button class="btn primary" data-ask>' + JT.icon('search') + 'Preguntar</button></div>';
    ov.classList.add('show');
    ov.scrollTop = 0;
    if (opts.focus) setTimeout(function () { var i = document.getElementById('askInput'); i && i.focus(); }, 30);
  };
  H.back = function () { H.history.pop(); var last = H.history.pop(); if (last) last(); };
  function push(fn) { H.history.push(fn); fn(); }

  function entryHTML(key) {
    var g = JT.glossary[key]; if (!g) return '<p>Todavía no tengo información sobre esto.</p>';
    var h = '<p>' + g.d + '</p>';
    if (g.sig) h += '<h5>Cómo se escribe</h5><pre>' + JT.highlight(g.sig, g.lang || 'js') + '</pre>';
    if (g.ex) h += '<h5>Ejemplo</h5><pre>' + JT.highlight(g.ex, g.lang || 'js') + '</pre>';
    if (g.tip) h += '<div class="callout tip">' + JT.icon('bulb') + '<div>' + g.tip + '</div></div>';
    if (g.err) h += '<div class="callout bad">' + JT.icon('alert') + '<div><b>Error común:</b> ' + g.err + '</div></div>';
    if (g.see && g.see.length) h += '<h5>También te puede servir</h5><div class="chips">' + g.see.filter(function (k) { return JT.glossary[k]; }).map(function (k) { return '<button class="chip" data-term="' + esc(k) + '">' + esc(JT.glossary[k].t || k) + '<i>?</i></button>'; }).join('') + '</div>';
    return h;
  }
  H.openTerm = function (key) {
    var g = JT.glossary[key]; if (!g) return;
    push(function () { H.show(JT.icon('help') + '<span>' + esc(g.t || key) + '</span>', entryHTML(key)); });
  };

  /* ---------- explicación genérica de una línea ---------- */
  var CSSP = { color: 'el color del texto', background: 'el fondo', 'background-color': 'el color de fondo', width: 'el ancho', height: 'el alto', margin: 'el espacio exterior', padding: 'el espacio interior', border: 'el borde', 'font-size': 'el tamaño de la letra', 'font-weight': 'el grosor de la letra', 'text-align': 'la alineación del texto', display: 'cómo se muestra el elemento (block, inline, none, flex...)', position: 'cómo se posiciona el elemento', 'border-radius': 'qué tan redondeadas son las esquinas', cursor: 'el icono del cursor al pasar encima', opacity: 'la transparencia', transition: 'la animación suave entre estados', overflow: 'qué pasa con lo que se sale de la caja', flex: 'el reparto de espacio en un contenedor flexible', gap: 'el espacio entre los elementos hijos', 'box-shadow': 'la sombra de la caja', 'list-style': 'el estilo de las viñetas de la lista', 'font-family': 'el tipo de letra' };
  function generic(text, f) {
    if (JT.genericLang && /^(py|c|cpp|cs|php|sql)$/.test(f)) { var gl = JT.genericLang(text, f); if (gl) return gl; }
    var t = text.trim(), m;
    if (!t) return 'Línea vacía: sirve para separar bloques y que el código se lea mejor. No hace nada.';
    if (f === 'html') {
      if ((m = /^<\/(\w[\w-]*)>/.exec(t))) return 'Cierra la etiqueta <code>&lt;' + esc(m[1]) + '&gt;</code> abierta antes. Toda etiqueta que se abre debe cerrarse.';
      if ((m = /^<!doctype/i.exec(t))) return 'Indica al navegador que el documento usa HTML5.';
      if ((m = /^<([A-Za-z][\w-]*)([^>]*)>?/.exec(t))) { var at = (m[2].match(/[\w\[\]\(\)\*#-]+(?==)/g) || []); return 'Abre la etiqueta <code>&lt;' + esc(m[1]) + '&gt;</code>' + (at.length ? ' con los atributos ' + at.map(function (a) { return '<code>' + esc(a) + '</code>'; }).join(', ') : '') + '. Los atributos son datos extra con la forma <code>nombre="valor"</code>.'; }
      return 'Texto que se mostrará dentro de la etiqueta que lo contiene.';
    }
    if (f === 'css') {
      if (/^\}/.test(t)) return 'Cierra el bloque de reglas del selector anterior.';
      if ((m = /^([^{:]+)\{\s*$/.exec(t))) return 'Selector <code>' + esc(m[1].trim()) + '</code>: dice a QUÉ elementos se aplican las reglas que siguen entre llaves.';
      if ((m = /^([\w-]+)\s*:\s*(.+?);?$/.exec(t))) return 'Propiedad <code>' + esc(m[1]) + '</code> con valor <code>' + esc(m[2]) + '</code>' + (CSSP[m[1]] ? ': controla ' + CSSP[m[1]] + '.' : '.') + ' Cada declaración termina con <code>;</code>.';
      return 'Regla de estilo CSS.';
    }
    if (/^\/\//.test(t) || /^\/\*/.test(t) || /^\*/.test(t)) return 'Es un <b>comentario</b>: texto para personas que el navegador ignora por completo.';
    if (/^(\}\)?;?|\}\);|\]\);?|\);?)$/.test(t)) return 'Cierra un bloque, una función o una llamada que se abrió más arriba. Cada <code>{</code> necesita su <code>}</code>.';
    if ((m = /^(?:export\s+)?(var|let|const)\s+([\w$]+)\s*(?::\s*[^=]+)?(?:=\s*(.*))?$/.exec(t))) {
      var rhs = (m[3] || '').trim(), what = '';
      if (/^function\b|=>/.test(rhs)) what = ' guardando una <b>función</b>'; else if (/^new\s+(\w+)/.test(rhs)) what = ' con un objeto nuevo de tipo <code>' + esc(/^new\s+(\w+)/.exec(rhs)[1]) + '</code>'; else if (/^['"`]/.test(rhs)) what = ' con un <b>texto</b>'; else if (/^-?\d/.test(rhs)) what = ' con un <b>número</b>'; else if (/^\[/.test(rhs)) what = ' con un <b>arreglo</b> (lista de valores)'; else if (/^\{/.test(rhs)) what = ' con un <b>objeto</b> (pares clave: valor)'; else if (/^(true|false)/.test(rhs)) what = ' con un valor <b>booleano</b>'; else if (rhs) what = ' con el resultado de <code>' + esc(rhs.replace(/;$/, '')) + '</code>';
      return 'Declara ' + (m[1] === 'const' ? 'la <b>constante</b>' : 'la <b>variable</b>') + ' <code>' + esc(m[2]) + '</code>' + what + '. ' + (m[1] === 'const' ? 'Una constante no se puede reasignar.' : m[1] === 'let' ? 'Con <code>let</code> el valor puede cambiar después.' : '<code>var</code> es la forma antigua de declarar variables; hoy se prefiere let/const.');
    }
    if ((m = /^(?:export\s+)?(async\s+)?function\s+([\w$]+)\s*\(([^)]*)\)/.exec(t))) return 'Declara la <b>función</b> <code>' + esc(m[2]) + '</code>' + (m[3].trim() ? ' que recibe los parámetros <code>' + esc(m[3]) + '</code>' : ' sin parámetros') + '. El código dentro de las llaves se ejecuta cada vez que alguien la llame.';
    if (/^\}?\s*else\s+if\b/.test(t)) return 'Otra condición: si la anterior fue falsa, se prueba esta.';
    if (/^\}?\s*else\b/.test(t)) return 'Lo que se ejecuta cuando la condición del <code>if</code> es falsa.';
    if ((m = /^if\s*\((.*)\)/.exec(t))) return 'Condición: si <code>' + esc(m[1]) + '</code> es verdadera, se ejecuta el bloque que sigue.';
    if ((m = /^for\s*\((.*)\)/.exec(t))) return 'Bucle <code>for</code>: repite el bloque siguiendo <code>' + esc(m[1]) + '</code> (inicio; condición; paso).';
    if ((m = /^while\s*\((.*)\)/.exec(t))) return 'Bucle <code>while</code>: repite el bloque mientras <code>' + esc(m[1]) + '</code> sea verdadero.';
    if (/^switch\b/.test(t)) return 'Compara un valor contra varios <code>case</code> y ejecuta el que coincida.';
    if ((m = /^case\s+(.*):/.exec(t))) return 'Caso: se ejecuta cuando el valor comparado es <code>' + esc(m[1]) + '</code>.';
    if (/^break\b/.test(t)) return 'Sale del bucle o del <code>switch</code> inmediatamente.';
    if ((m = /^return\b\s*(.*)/.exec(t))) return 'Termina la función y devuelve ' + (m[1].replace(/;$/, '') ? '<code>' + esc(m[1].replace(/;$/, '')) + '</code>' : 'nada (undefined)') + ' a quien la llamó.';
    if (/^try\b/.test(t)) return 'Intenta ejecutar el bloque; si algo falla, salta al <code>catch</code> en lugar de romper el programa.';
    if (/^\}?\s*catch\b/.test(t)) return 'Se ejecuta solo si hubo un error dentro del <code>try</code>. La variable entre paréntesis guarda el error.';
    if (/^throw\b/.test(t)) return 'Lanza un error a propósito para avisar que algo salió mal.';
    if ((m = /^([\w$.\[\]'"]+)\s*=\s*(.*)$/.exec(t))) return 'Asigna a <code>' + esc(m[1]) + '</code> el valor <code>' + esc(m[2].replace(/;$/, '')) + '</code>.';
    if ((m = /^([\w$.]+)\s*\(/.exec(t))) return 'Llama a la función <code>' + esc(m[1]) + '</code>' + (/\)\s*;?\s*$/.test(t) ? '' : ' (la instrucción continúa en las líneas siguientes)') + '. Lo que va entre paréntesis son los datos que le pasas.';
    if (/^@Component/.test(t)) return 'Decorador de Angular: convierte la clase de abajo en un <b>componente</b> y le dice su selector y su plantilla.';
    if (/^(export\s+)?class\s+(\w+)/.test(t)) return 'Declara la <b>clase</b> <code>' + esc(/class\s+(\w+)/.exec(t)[1]) + '</code>: un molde que agrupa datos (propiedades) y acciones (métodos).';
    if (/^import\b/.test(t)) return 'Importa piezas de otro archivo o librería para poder usarlas aquí.';
    return 'Instrucción de código. Si no entiendes alguna palabra, usa el recuadro de abajo para preguntar.';
  }
  H.generic = generic;

  H.openLine = function (info) {
    var text = info.text, f = info.file;
    push(function () {
      var h = '<h5>Línea ' + info.line + ' (' + esc(JT.FILE_EXT[f] || f) + ')</h5><div class="linectx"><pre style="margin:0;padding:0;background:none">' + (text.trim() ? JT.highlight(text, f) : '(línea vacía)') + '</pre></div>';
      var tr = text.trim(), why = '';
      if (tr) H.parts.forEach(function (p) { if (!why && p.f === f && p.why) { var ls = p.code.split('\n').map(function (x) { return x.trim(); }); if (ls.indexOf(tr) >= 0 && tr.length > 3) why = p.why; } });
      h += '<h5>Qué hace esta línea</h5><p>' + generic(text, f) + '</p>';
      if (why) h += '<h5>Explicación del ejemplo</h5><div class="callout info">' + JT.icon('info') + '<div>' + why + '</div></div>';
      var keys = JT.termsIn(text, f);
      if (keys.length) {
        h += '<h5>Piezas de esta línea</h5>' + keys.map(function (k) { var g = JT.glossary[k]; return '<div class="card" style="margin-bottom:8px;padding:10px 14px"><div style="display:flex;gap:8px;align-items:center;margin-bottom:4px"><b style="font-family:var(--mono);color:#e5c07b">' + esc(g.t || k) + '</b><span class="spacer"></span><button class="btn sm" data-term="' + esc(k) + '">Ver más</button></div><div style="font-size:14px">' + g.d + '</div></div>'; }).join('');
      }
      H.show(JT.icon('help') + '<span>¿Qué hace esta línea?</span>', h);
    });
  };

  /* ---------- búsqueda de dudas ---------- */
  var STOP = {};
  'que como para por con una uno unos unas los las del de la el en y o es se mi me no si al lo cual cuando donde porque puedo quiero hace hacer sirve usar uso son un esta este esto eso ese hay tengo tiene'.split(' ').forEach(function (w) { STOP[w] = 1; });
  var STEM = function (w) { return w.length > 4 ? w.replace(/(es|s)$/, '') : w; };
  H.search = function (q) {
    var words = JT.plain(q).replace(/[^a-z0-9ñ$.\[\]()*#{}_-]+/g, ' ').split(' ').filter(function (w) { return w && !STOP[w]; }).map(STEM);
    if (!words.length) return [];
    var keys = Object.keys(JT.glossary), idx = keys.map(function (k) {
      var g = JT.glossary[k];
      return { k: k, key: JT.plain(k + ' ' + (g.t || '')), kw: JT.plain(g.kw || ''), d: JT.plain(g.d.replace(/<[^>]+>/g, ' ')), core: g.core };
    });
    var weight = words.map(function (w) {
      var df = idx.filter(function (e) { return e.key.indexOf(w) >= 0 || e.kw.indexOf(w) >= 0 || e.d.indexOf(w) >= 0; }).length;
      return 1 / (1 + Math.log(1 + df));
    });
    var res = [];
    idx.forEach(function (e) {
      var s = 0;
      words.forEach(function (w, i) {
        var part = 0;
        if (e.key.indexOf(w) >= 0) part += e.key.split(/[\s.]/).indexOf(w) >= 0 ? 7 : 4;
        if (e.kw.indexOf(w) >= 0) part += 5;
        if (e.d.indexOf(w) >= 0) part += 1;
        s += part * weight[i] * 3;
      });
      if (s && e.core) s += 0.5;
      if (s) res.push({ k: e.k, s: s });
    });
    res.sort(function (a, b) { return b.s - a.s; });
    return res.slice(0, 6);
  };
  H.ask = function (q) {
    var inp = document.getElementById('askInput');
    q = (q != null ? q : (inp ? inp.value : '')).trim();
    if (!q) { H.openIntro(); return; }
    var res = H.search(q);
    push(function () {
      var h = '<h5>Tu pregunta</h5><p>' + esc(q) + '</p>';
      if (!res.length) h += '<div class="callout warn">' + JT.icon('warn') + '<div>No encontré algo que coincida. Prueba con palabras clave como <code>JSON</code>, <code>localStorage</code>, <code>XMLHttpRequest</code>, <code>click</code>, <code>fadeIn</code>, <code>ngFor</code>, <code>ngModel</code> o el nombre de una función.</div></div>';
      else {
        h += '<h5>Esto es lo que mejor responde</h5>' + entryHTML(res[0].k);
        if (res.length > 1) h += '<h5>Otras coincidencias</h5><div class="results">' + res.slice(1).map(function (r) { var g = JT.glossary[r.k]; return '<button class="res" data-term="' + esc(r.k) + '"><b>' + esc(g.t || r.k) + '</b><span>' + esc(g.d.replace(/<[^>]+>/g, '').slice(0, 110)) + '...</span></button>'; }).join('') + '</div>';
      }
      H.show(JT.icon('help') + '<span>Respuesta</span>', h, { query: q });
    });
  };
  H.openIntro = function () {
    H.history = [];
    push(function () {
      var h = '<p>Escribe abajo cualquier duda y te explico. También puedes tocar los botones <b>?</b> que aparecen junto a cada línea de código, cada pieza del desglose y en la lista "Consulta" bajo el editor.</p><h5>Temas frecuentes</h5><div class="chips">' +
        ['Guardar un objeto o arreglo', 'JSON.parse', 'JSON.stringify', 'localStorage.setItem', 'XMLHttpRequest', '.readyState', '$', '.click', '.fadeIn', '*ngFor', '[(ngModel)]', '== y ==='].filter(function (k) { return JT.glossary[k]; }).map(function (k) { return '<button class="chip" data-term="' + esc(k) + '">' + esc(JT.glossary[k].t || k) + '<i>?</i></button>'; }).join('') + '</div>';
      H.show(JT.icon('help') + '<span>Pregúntale a Xidecode</span>', h, { focus: true });
    });
  };
})();
