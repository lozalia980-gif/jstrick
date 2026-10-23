/* js-trick :: constructor compacto de temas para los lenguajes nuevos (HTML, CSS, Python, SQL, PHP, C, C++, C#)
   JT.tk({ id, track, num, badge, title, short, color, summary, seed?, theory:[[icono, titulo, html, codigo?, analogia?]],
           ex:[{ t, s, i, p:[[codigo, explicacion] | [archivo, codigo, explicacion]], out, tryit:[], notes:[] }],
           xs:[{ t, s, g, base, out?, st:[{ t, i, w, sol, alts?, hint?, tpl?, f? }] }],
           quiz:[[pregunta, [opciones], correcta, porque]] }) */
(function () {
  var JT = window.JT;

  function stripC(s, lang) {
    s = String(s || '').replace(/\r/g, '');
    if (lang === 'py') return s.split('\n').map(function (l) { var m = /^((?:[^#'"]|'[^']*'|"[^"]*")*)#.*$/.exec(l); return m ? m[1] : l; }).join('\n');
    if (lang === 'sql') return s.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(function (l) { var m = /^((?:[^-'"]|-(?!-)|'[^']*'|"[^"]*")*)--.*$/.exec(l); return m ? m[1] : l; }).join('\n');
    if (lang === 'html') return s.replace(/<!--[\s\S]*?-->/g, '');
    if (lang === 'css') return s.replace(/\/\*[\s\S]*?\*\//g, '');
    return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');
  }
  /* forma canónica para comparar lo que escribe el alumno con la solución */
  function squash(s, lang) {
    s = stripC(s, lang).replace(/\u201c|\u201d/g, '"').replace(/\u2018|\u2019/g, "'");
    if (lang === 'py') {
      var ls = s.split('\n').filter(function (l) { return l.trim(); }), widths = [];
      ls.forEach(function (l) { var w = /^ */.exec(l.replace(/\t/g, '    '))[0].length; if (widths.indexOf(w) < 0) widths.push(w); });
      widths.sort(function (a, b) { return a - b; });
      return ls.map(function (l) { var w = /^ */.exec(l.replace(/\t/g, '    '))[0].length; return widths.indexOf(w) + '|' + l.trim().replace(/\s+/g, ' ').replace(/ ?([(){}\[\],.:=+\-*\/<>!%]) ?/g, '$1').replace(/"/g, "'"); }).join('\n');
    }
    if (lang === 'sql') return s.replace(/\s+/g, ' ').trim().replace(/ ?([(),=<>*+\-\/.]) ?/g, '$1').replace(/;+$/, '').replace(/"/g, "'").split(/('[^']*')/).map(function (x, i) { return i % 2 ? x : x.toLowerCase(); }).join('');
    if (lang === 'html') return s.replace(/\s+/g, ' ').trim().replace(/ ?([<>=\/]) ?/g, '$1').replace(/"/g, "'").toLowerCase();
    if (lang === 'css') return s.replace(/\s+/g, ' ').trim().replace(/ ?([{}:;,>+~]) ?/g, '$1').replace(/;}/g, '}').replace(/;$/, '').replace(/"/g, "'").toLowerCase();
    if (lang === 'tsc' || lang === 'jsx' || lang === 'node' || lang === 'js') return s.replace(/\s+/g, ' ').trim().replace(/ ?([(){}\[\];,.=+\-*\/<>!%?:&|]) ?/g, '$1').replace(/"|`/g, "'").replace(/;/g, '').replace(/,(?=[)\]}])/g, '');
    if (lang === 'php') return s.replace(/\s+/g, ' ').trim().replace(/ ?([(){}\[\];,.=+\-*\/<>!%?:&|]) ?/g, '$1').replace(/"/g, "'");
    return s.replace(/\s+/g, ' ').trim().replace(/ ?([(){}\[\];,.=+\-*\/<>!%?:&|]) ?/g, '$1');
  }
  JT.squash = squash;
  /* comparador: acepta la solución o cualquiera de sus variantes */
  JT.same = function (lang, sols) {
    var canon = sols.map(function (x) { return squash(x, lang); });
    return function (n, raw) { var r = squash(raw, lang); return canon.indexOf(r) >= 0; };
  };

  /* tight: las partes se pegan sin línea en blanco (programas con llaves donde una parte continúa a la anterior) */
  function mkParts(lang, p, tight) {
    var trim = function (c) { return c.replace(/^\n/, '').replace(/\s+$/, ''); };
    /* en un programa "tight", una parte que empieza con salto de línea deja una línea en blanco antes de ella */
    return p.map(function (x) { return x.length === 3 ? { f: x[0], code: trim(x[1]), why: x[2] } : { f: lang, code: trim(x[0]), why: x[1] || '', tight: !!tight && !/^\n/.test(x[0]) }; });
  }

  JT.tk = function (o) {
    var tr = JT.track(o.track), lang = tr.kind === 'term' ? tr.lang : null, term = tr.kind === 'term';
    var t = {
      id: o.id, num: o.num, badge: o.badge, track: o.track, kind: tr.kind, guide: o.guide || tr.name, title: o.title, short: o.short, color: o.color || tr.color,
      summary: o.summary, seed: o.seed, lib: null, compact: true,
      theory: o.theory.map(function (x) { return { icon: x[0], h: x[1], html: x[2], code: x[3], analogy: x[4] }; }),
      examples: o.ex.map(function (e, i) {
        return { id: o.id + 'e' + (i + 1), title: e.t, short: e.s, lib: null, intro: e.i, parts: mkParts(lang, e.p, o.tight), out: e.out, stdin: e.stdin, notes: e.notes, tryit: e.tryit || [] };
      }),
      exercises: o.xs.map(function (x, i) {
        var base = x.base;
        if (typeof base === 'string') { base = {}; base[lang] = x.base; }
        var files = Object.keys(base);
        return {
          id: o.id + 'x' + (i + 1), title: x.t, short: x.s, lib: null, goal: x.g, base: base, out: x.out, stdin: x.stdin,
          steps: x.st.map(function (s) {
            var f = s.f || lang || files[files.length - 1], st = {
              file: f, title: s.t, instr: s.i, why: s.w, hint: s.hint || '<code>' + JT.esc(s.sol.split('\n')[0]) + (s.sol.indexOf('\n') > 0 ? ' …' : '') + '</code>',
              sol: s.sol, ok: JT.same(f, [s.sol].concat(s.alts || []))
            };
            if (s.tpl) { st.type = 'blank'; st.tpl = s.tpl; }
            if (s.sol.indexOf('\n') >= 0) st.multi = true;
            if (s.indent) st.indent = s.indent;
            if (s.at) st.at = s.at;
            if (s.errs) st.errs = s.errs;
            if (s.after) st.after = s.after;
            return st;
          })
        };
      }),
      quiz: o.quiz.map(function (q) { return { q: q[0], opts: q[1], a: q[2], why: q[3] }; })
    };
    /* nombres de tablas y columnas de la base de ejemplo: el revisor no debe tomarlos por palabras mal escritas */
    if (o.seed) { JT.sqlIdents = JT.sqlIdents || {}; (o.seed.replace(/'[^']*'/g, ' ').match(/[A-Za-z_]\w*/g) || []).forEach(function (w) { JT.sqlIdents[w.toLowerCase()] = 1; }); }
    JT.topics.push(t);
    return t;
  };
})();
