/* js-trick :: resaltado para Python, SQL, PHP, C, C++ y C# (+ enlace con el glosario para los botones "?") */
(function () {
  var JT = window.JT;
  JT.langScan = JT.langScan || {};

  function set(s) { var o = {}; s.split(/\s+/).forEach(function (k) { if (k) o[k] = 1; }); return o; }
  var C_KW = 'auto break case char const continue default do double else enum extern float for goto if int long register return short signed sizeof static struct switch typedef union unsigned void volatile while inline restrict';
  var CFG = {
    py: { kw: set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'), lit: set('True False None'), line: ['#'], block: false, triple: true, strings: ['"', "'"], cls: true },
    sql: { kw: set('select from where insert into values update set delete create table drop alter add column primary key foreign references not null unique default check index view join inner left right full outer cross on group by order having limit offset distinct as and or in between like is exists case when then else end union all asc desc count sum avg min max autoincrement integer int text real varchar char date datetime boolean pragma with begin commit rollback transaction if'), lit: set('true false null'), line: ['--'], block: true, strings: ["'", '"'], ci: true },
    php: { kw: set('abstract and array as break callable case catch class clone const continue declare default do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile extends final finally fn for foreach function global if implements include include_once instanceof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield'), lit: set('true false null TRUE FALSE NULL'), line: ['//', '#'], block: true, strings: ['"', "'"], php: true, cls: true },
    c: { kw: set(C_KW), lit: set('NULL true false'), line: ['//'], block: true, strings: ['"', "'"], pre: true, types: set('size_t FILE bool') },
    cpp: { kw: set(C_KW + ' and and_eq asm bool catch class compl const_cast constexpr decltype delete dynamic_cast explicit export false friend mutable namespace new noexcept not not_eq nullptr operator or or_eq private protected public reinterpret_cast static_assert static_cast template this throw try typeid typename using virtual xor override final auto'), lit: set('true false nullptr NULL'), line: ['//'], block: true, strings: ['"', "'"], pre: true, cls: true },
    dart: { kw: set('abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory final finally for get hide if implements import in interface is late library mixin new on operator part required rethrow return set show static super switch sync this throw try typedef var void while with yield'), lit: set('true false null'), line: ['//'], block: true, strings: ['"', "'"], cls: true, types: set('int double String bool num Object dynamic') },
    kt: { kw: set('as break by catch class constructor continue do else enum fun for if import in init interface is object open override package private protected public return sealed super this throw try typealias val var when while data companion lateinit abstract final inner internal out vararg suspend where get set'), lit: set('true false null'), line: ['//'], block: true, strings: ['"', "'"], cls: true, types: set('Int String Boolean Double Float Long Char Unit Any Nothing') },
    swift: { kw: set('associatedtype break case catch class continue default defer deinit do else enum extension fallthrough fileprivate for func guard if import in init inout internal is let nil open operator private protocol public repeat rethrows return self Self static struct subscript super switch throw throws try typealias var where while as mutating override final lazy weak unowned'), lit: set('true false nil'), line: ['//'], block: true, strings: ['"'], cls: true, types: set('Int String Bool Double Float Character Any') },
    cs: { kw: set('abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw try typeof uint ulong unchecked unsafe ushort using var virtual void volatile while get set value async await record init'), lit: set('true false null'), line: ['//'], block: true, strings: ['"', "'"], cls: true }
  };

  function scan(src, cfg) {
    var toks = [], i = 0, n = src.length, m, last = null, atLineStart = true;
    function push(t, s) { var o = { t: t, s: s }; toks.push(o); if (t !== 'w' && t !== 'c') last = o; }
    var reNum = /0[xX][0-9a-fA-F]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[fFlLuUdDmM]*/y, reId = /[A-Za-z_][\w]*/y;
    var reStrPy = /[fFrRbBuU]{0,2}(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y;
    var reStrC = /[@$]{0,2}(?:"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)/y;
    var reStrSql = /'(?:''|[^'\n])*'?|"(?:[^"\n])*"?/y;
    var reStrPhp = /"(?:\\[\s\S]|[^"\\])*"?|'(?:\\[\s\S]|[^'\\])*'?/y;
    while (i < n) {
      var ch = src[i], rest;
      if (ch === '\n') { push('w', '\n'); i++; atLineStart = true; continue; }
      if (/\s/.test(ch)) { m = /[ \t\r]+/y; m.lastIndex = i; var mm = m.exec(src); push('w', mm[0]); i += mm[0].length; continue; }
      /* comentarios */
      var isLineC = false;
      for (var k = 0; k < cfg.line.length; k++) if (src.substr(i, cfg.line[k].length) === cfg.line[k]) { isLineC = true; break; }
      if (cfg.pre && atLineStart && ch === '#') { var e0 = src.indexOf('\n', i); if (e0 < 0) e0 = n; push('pp', src.slice(i, e0)); i = e0; continue; }
      if (isLineC && !(cfg.php && src.substr(i, 2) === '#[')) { var e1 = src.indexOf('\n', i); if (e1 < 0) e1 = n; push('c', src.slice(i, e1)); i = e1; continue; }
      if (cfg.block && src.substr(i, 2) === '/*') { var e2 = src.indexOf('*/', i + 2); e2 = e2 < 0 ? n : e2 + 2; push('c', src.slice(i, e2)); i = e2; continue; }
      atLineStart = false;
      if (cfg.php) {
        if (src.substr(i, 5) === '<?php') { push('pp', '<?php'); i += 5; continue; }
        if (src.substr(i, 3) === '<?=') { push('pp', '<?='); i += 3; continue; }
        if (src.substr(i, 2) === '?>') { push('pp', '?>'); i += 2; continue; }
        if (ch === '$' && /[A-Za-z_]/.test(src[i + 1] || '')) { m = /\$[A-Za-z_]\w*/y; m.lastIndex = i; var vm = m.exec(src); push('var', vm[0]); i += vm[0].length; continue; }
      }
      /* cadenas */
      var strRe = cfg.triple ? reStrPy : cfg.php ? reStrPhp : cfg.ci ? reStrSql : reStrC;
      if (ch === '"' || ch === "'" || (cfg.triple && /[fFrRbBuU]/.test(ch) && /["']/.test(src[i + 1] || '')) || (cfg.triple && /[fFrRbBuU]/.test(ch) && /[fFrRbBuU]/.test(src[i + 1] || '') && /["']/.test(src[i + 2] || '')) || (!cfg.triple && !cfg.php && !cfg.ci && /[@$]/.test(ch) && /["@$]/.test(src[i + 1] || ''))) {
        strRe.lastIndex = i; m = strRe.exec(src);
        if (m && m.index === i && m[0].length) { push('s', m[0]); i += m[0].length; continue; }
      }
      if (/\d/.test(ch)) { reNum.lastIndex = i; m = reNum.exec(src); push('n', m[0]); i += m[0].length; continue; }
      if (/[A-Za-z_]/.test(ch)) {
        reId.lastIndex = i; m = reId.exec(src);
        var w = m[0], key = cfg.ci ? w.toLowerCase() : w, prevDot = last && (last.s === '.' || last.s === '->' || last.s === '::'), type = 'i';
        if (!prevDot && cfg.kw[key]) type = 'k';
        else if (!prevDot && cfg.lit[w]) type = 'l';
        else {
          var nx = i + w.length; while (src[nx] === ' ') nx++;
          if (src[nx] === '(' && !cfg.ci) type = 'f';
          else if (cfg.ci && src[nx] === '(' ) type = 'f';
          else if (prevDot) type = 'p';
          else if (cfg.types && cfg.types[w]) type = 'cls';
          else if (cfg.cls && /^[A-Z][a-z]/.test(w)) type = 'cls';
        }
        push(type, w); i += w.length; continue;
      }
      if (ch === '-' && src[i + 1] === '>') { push('o', '->'); i += 2; continue; }
      if (ch === ':' && src[i + 1] === ':') { push('o', '::'); i += 2; continue; }
      push('o', ch); i++;
    }
    return toks;
  }
  Object.keys(CFG).forEach(function (L) { JT.langScan[L] = function (src) { return scan(src, CFG[L]); }; });
  JT.langCfg = CFG;

  /* ---------- enlace con el glosario ---------- */
  var SQL2 = ['ORDER BY', 'GROUP BY', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INSERT INTO', 'CREATE TABLE', 'PRIMARY KEY', 'FOREIGN KEY', 'NOT NULL', 'IS NULL', 'IS NOT NULL', 'UNION ALL', 'DELETE FROM', 'DROP TABLE', 'ALTER TABLE'];
  JT.langAnnotate = function (toks, L) {
    var G = JT.glossary, ci = !!(CFG[L] && CFG[L].ci);
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.t === 'pp') {
        var d = /^#\s*(\w+)/.exec(t.s); if (d && G[L + ':#' + d[1]]) t.key = L + ':#' + d[1];
        else if (t.s === '<?php' && G[L + ':<?php']) t.key = L + ':<?php';
        continue;
      }
      if (t.t === 'var') { var vk = /^\$_(GET|POST|SERVER|SESSION)$/.test(t.s) ? L + ':$_GET' : L + ':$'; if (G[vk]) t.key = vk; continue; }
      if (!/^(f|p|i|cls|k|l)$/.test(t.t)) continue;
      var name = ci ? t.s.toUpperCase() : t.s, j = i - 1;
      while (j >= 0 && toks[j].t === 'w') j--;
      var sep = j >= 0 && /^(\.|->|::)$/.test(toks[j].s) ? toks[j].s : null, keys = [];
      if (sep) {
        var k2 = j - 1; while (k2 >= 0 && toks[k2].t === 'w') k2--;
        var pre = k2 >= 0 && /^(f|p|i|cls|k)$/.test(toks[k2].t) ? toks[k2].s : null;
        if (pre) { keys.push(L + ':' + pre + sep + name); if (sep !== '.') keys.push(L + ':' + pre + '.' + name); }
        keys.push(L + ':.' + name); if (sep === '->') keys.push(L + ':->' + name);
      } else {
        if (ci) {
          var nx = i + 1; while (nx < toks.length && toks[nx].t === 'w') nx++;
          if (nx < toks.length && /^(i|k|f)$/.test(toks[nx].t)) { var two = name + ' ' + toks[nx].s.toUpperCase(); if (SQL2.indexOf(two) >= 0) keys.push(L + ':' + two); }
        }
        keys.push(L + ':' + name);
      }
      for (var q = 0; q < keys.length; q++) if (G[keys[q]]) { t.key = keys[q]; break; }
    }
    return toks;
  };
})();
