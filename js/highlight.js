/* js-trick :: resaltado de sintaxis + deteccion de terminos del glosario (los botones "?") */
(function () {
  var JT = window.JT;

  var KW = {};
  ('var let const function return if else for while do switch case break continue new this typeof instanceof in of try catch finally throw class extends import export from default async await static super delete void yield implements interface private public protected readonly type enum declare abstract namespace get set')
    .split(' ').forEach(function (k) { KW[k] = 1; });
  var LIT = { 'true': 1, 'false': 1, 'null': 1, 'undefined': 1, 'NaN': 1, 'Infinity': 1 };

  function tok(t, s) { return { t: t, s: s }; }

  /* ---------- JavaScript / TypeScript ---------- */
  function scanJS(src) {
    var toks = [], i = 0, n = src.length, m, last = null;
    var reWs = /\s+/y, reCom = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y,
      reStr = /"(?:\\[\s\S]|[^"\\\n])*"?|'(?:\\[\s\S]|[^'\\\n])*'?|`(?:\\[\s\S]|[^`\\])*`?/y,
      reNum = /\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?/y, reId = /[A-Za-z_$][\w$]*/y,
      reRx = /\/(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\/\\\n\[])+\/[a-z]*/y;
    function push(t, s) { var o = tok(t, s); toks.push(o); if (t !== 'w' && t !== 'c') last = o; }
    while (i < n) {
      var ch = src[i];
      reWs.lastIndex = i; if ((m = reWs.exec(src)) && m.index === i) { push('w', m[0]); i += m[0].length; continue; }
      if (ch === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) { reCom.lastIndex = i; m = reCom.exec(src); push('c', m[0]); i += m[0].length; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { reStr.lastIndex = i; m = reStr.exec(src); push('s', m[0]); i += m[0].length; continue; }
      if (ch === '/') {
        var okRx = !last || /^[(,=:\[!&|?{};+\-*%<>~^]$/.test(last.s) || (last.t === 'k' && last.s !== 'this');
        if (okRx) { reRx.lastIndex = i; if ((m = reRx.exec(src)) && m.index === i) { push('rx', m[0]); i += m[0].length; continue; } }
      }
      if (/\d/.test(ch)) { reNum.lastIndex = i; m = reNum.exec(src); push('n', m[0]); i += m[0].length; continue; }
      if (/[A-Za-z_$]/.test(ch)) {
        reId.lastIndex = i; m = reId.exec(src);
        var w = m[0], prevDot = last && last.s === '.' , type = 'i';
        if (!prevDot && KW[w]) type = 'k';
        else if (!prevDot && LIT[w]) type = 'l';
        else {
          var nx = i + w.length; while (src[nx] === ' ') nx++;
          if (src[nx] === '(') type = 'f';
          else if (prevDot) type = 'p';
          else if (/^[A-Z]/.test(w) && w.length > 1) type = 'cls';
        }
        push(type, w); i += w.length; continue;
      }
      if (ch === '=' && src[i + 1] === '>') { push('o', '=>'); i += 2; continue; }
      push('o', ch); i++;
    }
    return toks;
  }

  /* ---------- HTML ---------- */
  function scanHTML(src) {
    var toks = [], i = 0, n = src.length, m;
    while (i < n) {
      var rest = src.slice(i);
      if ((m = /^<!--[\s\S]*?(?:-->|$)/.exec(rest))) { toks.push(tok('c', m[0])); i += m[0].length; continue; }
      if ((m = /^<![^>]*>?/.exec(rest))) { toks.push(tok('c', m[0])); i += m[0].length; continue; }
      if ((m = /^<(\/?)([A-Za-z][\w:-]*)/.exec(rest))) {
        toks.push(tok('o', '<' + m[1])); toks.push(tok('tg', m[2])); i += m[0].length;
        var tagName = m[2].toLowerCase();
        for (;;) {
          var r2 = src.slice(i);
          if ((m = /^\s+/.exec(r2))) { toks.push(tok('w', m[0])); i += m[0].length; continue; }
          if ((m = /^\/?>/.exec(r2))) { toks.push(tok('o', m[0])); i += m[0].length; break; }
          if ((m = /^[^\s=>\/"'][^\s=>"']*/.exec(r2))) { toks.push(tok('at', m[0])); i += m[0].length; continue; }
          if (r2[0] === '=') {
            toks.push(tok('o', '=')); i++;
            r2 = src.slice(i);
            if ((m = /^"[^"]*"?|^'[^']*'?|^[^\s>]+/.exec(r2))) { toks.push(tok('s', m[0])); i += m[0].length; }
            continue;
          }
          if (i >= n) break;
          toks.push(tok('o', r2[0])); i++;
        }
        if ((tagName === 'script' || tagName === 'style') && src[i - 1] === '>' && !/\/>$/.test(src.slice(Math.max(0, i - 2), i))) {
          var endRe = new RegExp('</' + tagName, 'i'), idx = src.slice(i).search(endRe);
          var inner = idx < 0 ? src.slice(i) : src.slice(i, i + idx);
          (tagName === 'script' ? scanJS(inner) : scanCSS(inner)).forEach(function (t) { toks.push(t); });
          i += inner.length;
        }
        continue;
      }
      if ((m = /^\{\{[\s\S]*?(?:\}\}|$)/.exec(rest))) { toks.push(tok('ip', m[0])); i += m[0].length; continue; }
      if ((m = /^[^<{]+|^[{<]/.exec(rest))) { toks.push(tok('tx', m[0])); i += m[0].length; continue; }
      toks.push(tok('tx', src[i])); i++;
    }
    return toks;
  }

  /* ---------- CSS ---------- */
  function scanCSS(src) {
    var toks = [], i = 0, n = src.length, depth = 0, m;
    function valueScan(str) {
      var j = 0, mm;
      while (j < str.length) {
        var r = str.slice(j);
        if ((mm = /^\s+/.exec(r))) { toks.push(tok('w', mm[0])); j += mm[0].length; continue; }
        if ((mm = /^\/\*[\s\S]*?\*\//.exec(r))) { toks.push(tok('c', mm[0])); j += mm[0].length; continue; }
        if ((mm = /^"[^"]*"|^'[^']*'/.exec(r))) { toks.push(tok('s', mm[0])); j += mm[0].length; continue; }
        if ((mm = /^#[0-9a-fA-F]{3,8}\b|^-?\d*\.?\d+(?:px|em|rem|%|vh|vw|vmin|ms|s|deg|fr|ch)?/.exec(r))) { toks.push(tok('n', mm[0])); j += mm[0].length; continue; }
        if ((mm = /^[A-Za-z_-][\w-]*(?=\()/.exec(r))) { toks.push(tok('f', mm[0])); j += mm[0].length; continue; }
        if ((mm = /^[A-Za-z_-][\w-]*/.exec(r))) { toks.push(tok('va', mm[0])); j += mm[0].length; continue; }
        toks.push(tok('o', r[0])); j++;
      }
    }
    while (i < n) {
      var rest = src.slice(i);
      if ((m = /^\s+/.exec(rest))) { toks.push(tok('w', m[0])); i += m[0].length; continue; }
      if ((m = /^\/\*[\s\S]*?(?:\*\/|$)/.exec(rest))) { toks.push(tok('c', m[0])); i += m[0].length; continue; }
      if (rest[0] === '}') { toks.push(tok('o', '}')); i++; depth = Math.max(0, depth - 1); continue; }
      if (rest[0] === '{') { toks.push(tok('o', '{')); i++; depth++; continue; }
      if (rest[0] === ';') { toks.push(tok('o', ';')); i++; continue; }
      var nextStop = rest.search(/[{};]/); if (nextStop < 0) nextStop = rest.length;
      var isSel = depth === 0 || rest[nextStop] === '{';
      if (isSel) {
        var chunk = rest.slice(0, nextStop);
        if (chunk[0] === '@') { var am = /^@[\w-]+/.exec(chunk); toks.push(tok('k', am[0])); toks.push(tok('sel', chunk.slice(am[0].length))); }
        else toks.push(tok('sel', chunk));
        i += chunk.length; continue;
      }
      if ((m = /^[\w-]+(?=\s*:)/.exec(rest))) { toks.push(tok('pr', m[0])); i += m[0].length; continue; }
      if (rest[0] === ':') {
        toks.push(tok('o', ':')); i++;
        var vEnd = src.slice(i).search(/[;}]/); if (vEnd < 0) vEnd = n - i;
        valueScan(src.slice(i, i + vEnd)); i += vEnd; continue;
      }
      toks.push(tok('tx', rest[0])); i++;
    }
    return toks;
  }

  /* ---------- asociar tokens con el glosario ---------- */
  var ALIAS = { sessionStorage: 'localStorage', 'xhr': '', peticion: '' };
  function annotate(toks, lang) {
    var G = JT.glossary;
    if (lang === 'html') {
      var seenIp = false;
      toks.forEach(function (t) {
        var k = null;
        if (t.t === 'tg') k = G['<' + t.s.toLowerCase() + '>'] ? '<' + t.s.toLowerCase() + '>' : null;
        else if (t.t === 'at') {
          var a = t.s;
          if (!/^[\*\[\(#]/.test(a)) k = null;
          else if (G[a]) k = a;
          else if (/^\[class\./.test(a)) k = '[class.x]';
          else if (/^\(.+\)$/.test(a)) k = '(evento)';
          else if (/^\[.+\]$/.test(a)) k = '[propiedad]';
          else if (/^#/.test(a)) k = '#ref';
        } else if (t.t === 'ip' && !seenIp) { k = '{{ }}'; seenIp = true; }
        if (k && G[k]) t.key = k;
      });
      return toks;
    }
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (!/^(f|p|i|cls|k)$/.test(t.t)) continue;
      var name = t.s, j = i - 1;
      while (j >= 0 && toks[j].t === 'w') j--;
      var dotted = j >= 0 && toks[j].s === '.';
      var keys = [];
      if (dotted) {
        var k2 = j - 1; while (k2 >= 0 && toks[k2].t === 'w') k2--;
        var pre = k2 >= 0 && /^(f|p|i|cls)$/.test(toks[k2].t) ? toks[k2].s : null;
        if (pre) { keys.push(pre + '.' + name); if (ALIAS[pre]) keys.push(ALIAS[pre] + '.' + name); }
        keys.push('.' + name);
      } else keys.push(name);
      for (var q = 0; q < keys.length; q++) if (G[keys[q]]) { t.key = keys[q]; break; }
    }
    return toks;
  }

  function tokenize(code, lang) {
    if (JT.langScan && JT.langScan[lang]) return JT.langAnnotate(JT.langScan[lang](code), lang);
    var toks = lang === 'html' ? scanHTML(code) : lang === 'css' ? scanCSS(code) : scanJS(code);
    return annotate(toks, lang === 'html' || lang === 'css' ? lang : 'js');
  }
  function langOf(f) { return f === 'html' ? 'html' : f === 'css' ? 'css' : (JT.langScan && JT.langScan[f]) ? f : 'js'; }

  function wrapTok(t, opts, seen) {
    var cls = 't-' + t.t;
    var text = JT.esc(t.s);
    if (t.t === 'w' || t.t === 'tx') return text;
    var html = '<span class="' + cls + '">' + text + '</span>';
    if (opts && opts.terms && t.key && !(opts.once && seen[t.key])) {
      seen[t.key] = 1;
      html = '<span class="tk" data-term="' + JT.esc(t.key) + '">' + html + '<button class="q" data-term="' + JT.esc(t.key) + '" title="Que es esto?" aria-label="Que es ' + JT.esc(t.key) + '">?</button></span>';
    }
    return html;
  }

  /* HTML completo (para <pre>) */
  JT.highlight = function (code, f, opts) {
    var seen = {}, toks = tokenize(code, langOf(f));
    return toks.map(function (t) { return wrapTok(t, opts, seen); }).join('');
  };
  /* arreglo de lineas (para el editor) */
  JT.highlightLines = function (code, f) {
    var toks = tokenize(code, langOf(f)), lines = [''], open = null;
    toks.forEach(function (t) {
      var parts = t.s.split('\n');
      parts.forEach(function (p, idx) {
        if (idx > 0) lines.push('');
        if (p === '') return;
        var text = JT.esc(p);
        lines[lines.length - 1] += (t.t === 'w' || t.t === 'tx') ? text : '<span class="t-' + t.t + '">' + text + '</span>';
      });
    });
    return lines;
  };
  /* lista de claves de glosario presentes en un texto */
  JT.termsIn = function (code, f) {
    var out = [], seen = {};
    tokenize(code, langOf(f)).forEach(function (t) { if (t.key && !seen[t.key]) { seen[t.key] = 1; out.push(t.key); } });
    return out;
  };
  JT.tokenize = tokenize;
})();
