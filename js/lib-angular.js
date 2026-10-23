/* js-trick :: simulador didactico de Angular.
   - JT.ng.transform(ts): convierte el TypeScript del alumno a JavaScript ejecutable (conserva los números de línea).
   - JT.libs.ng(win): motor que corre DENTRO de la pantalla: renderiza plantillas, enlaces de datos, *ngFor, *ngIf,
     [(ngModel)], eventos, pipes, servicios, componentes hijos con @Input/@Output y formularios con validación. */
(function () {
  var JT = window.JT;
  JT.ng = {};

  /* ======================= TypeScript -> JavaScript ======================= */
  function blank(s) { return s.replace(/[^\n]/g, ''); }
  function maskStrings(s) {
    return s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`/g, function (m) {
      return m.replace(/[^\n]/g, ' ');
    });
  }
  function matchClose(src, openIdx) {
    var o = src[openIdx], c = o === '(' ? ')' : o === '{' ? '}' : ']', d = 0, m = maskStrings(src);
    for (var i = openIdx; i < m.length; i++) {
      if (m[i] === o) d++;
      else if (m[i] === c) { d--; if (d === 0) return i; }
    }
    return -1;
  }
  function stripParams(p) {
    var out = [], d = 0, cur = '';
    for (var i = 0; i < p.length; i++) {
      var ch = p[i];
      if (ch === '(' || ch === '[' || ch === '{' || ch === '<') d++;
      if (ch === ')' || ch === ']' || ch === '}' || (ch === '>' && p[i - 1] !== '=')) d--;
      if (ch === ',' && d === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out.map(function (x) {
      x = x.trim().replace(/^(public|private|protected|readonly)\s+/g, '');
      var eq = x.indexOf('='), left = eq >= 0 ? x.slice(0, eq) : x, right = eq >= 0 ? x.slice(eq) : '';
      left = left.replace(/\?\s*:/, ':').replace(/\?$/, '').replace(/\s*:\s*[\s\S]*$/, '');
      return left.trim() + (right ? ' ' + right : '');
    }).join(', ');
  }

  JT.ng.transform = function (src) {
    var decs = [], deps = {}, classNames = [], out = src;

    /* 1. imports */
    out = out.replace(/import\s+[\s\S]*?from\s*['"][^'"]+['"]\s*;?|import\s*['"][^'"]+['"]\s*;?/g, blank);

    /* 2. interfaces y types */
    for (var guard = 0; guard < 50; guard++) {
      var im = /(^|\n)([ \t]*(?:export\s+)?interface\s+\w+[^{]*\{)/.exec(out);
      if (!im) break;
      var st = im.index + im[1].length, open = st + im[2].length - 1, close = matchClose(out, open);
      if (close < 0) break;
      out = out.slice(0, st) + blank(out.slice(st, close + 1)) + out.slice(close + 1);
    }
    out = out.replace(/(^|\n)[ \t]*(?:export\s+)?type\s+\w+[^=\n]*=[^;\n]*;?/g, function (m) { return blank(m); });

    /* 3. decoradores de clase */
    for (var g2 = 0; g2 < 50; g2++) {
      var dm = /@(Component|Injectable|NgModule|Directive|Pipe)\s*\(/.exec(maskStrings(out));
      if (!dm) break;
      var po = dm.index + dm[0].length - 1, pc = matchClose(out, po);
      if (pc < 0) break;
      var args = out.slice(po + 1, pc).trim();
      var after = out.slice(pc + 1), cm = /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+(\w+)/.exec(after);
      decs.push({ dec: dm[1], args: args, cls: cm ? cm[1] : null });
      out = out.slice(0, dm.index) + blank(out.slice(dm.index, pc + 1)) + out.slice(pc + 1);
    }
    out = out.replace(/@(Input|Output|ViewChild|ViewChildren|HostBinding|HostListener|Optional|Inject)\s*\([^)]*\)\s*/g, '');

    /* 4. export */
    out = out.replace(/\bexport\s+(default\s+)?/g, '');

    /* 5. clases */
    out = out.replace(/(^|\n)([ \t]*)class\s+(\w+)(<[^>{]*>)?/g, function (m, a, b, n) { classNames.push(n); return a + b + 'class ' + n; });
    out = out.replace(/(class\s+\w+(?:\s+extends\s+[\w.]+)?)\s+implements\s+[\w\s,<>.]+(?=\{)/g, '$1 ');

    /* 6. constructores */
    out = out.replace(/constructor\s*\(([\s\S]*?)\)\s*\{/g, function (m, params, idx) {
      var cls = null, re = /class\s+(\w+)/g, mm;
      while ((mm = re.exec(out)) && mm.index < idx) cls = mm[1];
      var list = params.split(',').map(function (x) { return x.trim(); }).filter(Boolean), names = [], assigns = '', types = [];
      list.forEach(function (x) {
        var mo = /^((?:public|private|protected|readonly)\s+)*([\w$]+)\??\s*(?::\s*([\w.<>\[\]]+))?/.exec(x);
        if (!mo) return;
        names.push(mo[2]); types.push(mo[3] || null);
        if (/^(public|private|protected|readonly)\s/.test(x)) assigns += ' this.' + mo[2] + ' = ' + mo[2] + ';';
      });
      if (cls) deps[cls] = types;
      return 'constructor(' + names.join(', ') + ') {' + assigns + blank(m);
    });

    /* 7. cuerpo de las clases, línea por línea */
    var lines = out.split('\n'), masked = maskStrings(out).split('\n'), depth = 0, inClass = [], res = [];
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i], ml = masked[i], trimmed = ml.trim(), line = ln;
      var startsClass = /^\s*class\s+\w+/.test(ml);
      var classDepth = inClass.length ? inClass[inClass.length - 1] : -1;
      if (inClass.length && depth === classDepth + 1 && trimmed && trimmed !== '}' && !startsClass) {
        line = line.replace(/^(\s*)((?:(?:public|private|protected|readonly|abstract|override)\s+)+)/, '$1');
        var ml2 = line.replace(/^\s+/, '');
        var meth = /^((?:static\s+|async\s+|get\s+|set\s+)*)([\w$]+)\s*\(([^)]*)\)\s*(?::\s*[^{=]+?)?\s*\{(.*)$/.exec(ml2);
        if (meth && !/^(if|for|while|switch|catch|function)$/.test(meth[2])) {
          line = line.match(/^\s*/)[0] + meth[1] + meth[2] + '(' + stripParams(meth[3]) + ') {' + meth[4];
        } else if (/^[\w$]+\s*[!?]?\s*(:|=|;|$)/.test(ml2) && !/^[\w$]+\s*\(/.test(ml2)) {
          line = line.replace(/^(\s*)([\w$]+)\s*[!?]?\s*:\s*([^=;]+?)\s*(?=(=|;|$))/, '$1$2 ');
          line = line.replace(/^(\s*[\w$]+)\s*[!?]\s*(?=[=;]|$)/, '$1');
        }
      } else if (!inClass.length && depth === 0) {
        line = line.replace(/\b(let|const|var)\s+([\w$]+)\s*:\s*[^=;(]+?(?=\s*=)/g, '$1 $2');
      } else if (inClass.length && depth > classDepth + 1) {
        line = line.replace(/\b(let|const|var)\s+([\w$]+)\s*:\s*[^=;(]+?(?=\s*=)/g, '$1 $2');
        line = line.replace(/\)\s*:\s*[\w<>\[\]|. ]+?\s*=>/g, ') =>');
        line = line.replace(/\(([^()]*:[^()]*)\)\s*=>/g, function (m, p) { return '(' + stripParams(p) + ') =>'; });
        line = line.replace(/\s+as\s+[A-Za-z_][\w.<>\[\]|]*/g, '');
        line = line.replace(/(new\s+[\w.]+)<[^>()]*>\(/g, '$1(');
        line = line.replace(/([\w)\]])!(?=[.\[(;,)\s]|$)/g, '$1');
      }
      res.push(line);
      var pendingClass = startsClass;
      for (var j = 0; j < ml.length; j++) {
        var c = ml[j];
        if (c === '{' || c === '(' || c === '[') {
          if (c === '{' && pendingClass) { inClass.push(depth); pendingClass = false; }
          depth++;
        } else if (c === '}' || c === ')' || c === ']') {
          depth--;
          if (c === '}' && inClass.length && depth === inClass[inClass.length - 1]) inClass.pop();
        }
      }
    }
    out = res.join('\n');

    /* 8. pie: registro en el motor */
    var foot = '\n;(function(){';
    foot += '__ng.classes({' + classNames.map(function (n) { return n + ':(typeof ' + n + "==='undefined'?undefined:" + n + ')'; }).join(',') + '});';
    Object.keys(deps).forEach(function (k) { foot += '__ng.deps("' + k + '",' + JSON.stringify(deps[k]) + ');'; });
    decs.forEach(function (d) {
      if (d.dec === 'Component' && d.cls) foot += '__ng.component(' + d.cls + ',(' + d.args + '));';
      else if (d.dec === 'Injectable' && d.cls) foot += '__ng.injectable(' + d.cls + ');';
      else if (d.dec === 'NgModule') foot += '__ng.module((' + (d.args || '{}') + '));';
    });
    foot += '})();';
    return { js: out + foot, classNames: classNames, decorators: decs, deps: deps };
  };

  /* ======================= motor dentro de la pantalla ======================= */
  JT.libs.ng = function (win) {
    var doc = win.document;
    var realSetTimeout = win.setTimeout.bind(win);
    var NG = win.__ng = { byName: {}, metas: {}, sel: {}, depsOf: {}, singletons: {}, inst: {}, ctrl: {}, tplCache: {}, moduleMeta: null, rendering: false, warned: {} };

    NG.classes = function (map) { for (var k in map) if (map[k]) NG.byName[k] = map[k]; };
    NG.deps = function (n, d) { NG.depsOf[n] = d; };
    NG.component = function (C, meta) { NG.metas[C.name] = meta || {}; if (meta && meta.selector) NG.sel[meta.selector] = C; };
    NG.injectable = function (C) { C.__injectable = true; };
    NG.module = function (m) { NG.moduleMeta = m; };

    ['BrowserModule', 'FormsModule', 'ReactiveFormsModule', 'HttpClientModule', 'HttpModule', 'RouterModule', 'CommonModule'].forEach(function (n) { win[n] = win[n] || { __module: n }; });
    win.platformBrowserDynamic = win.platformBrowserDynamic || function () { return { bootstrapModule: function () { return Promise.resolve(); } }; };

    /* ---- piezas de @angular/core que se usan en las guias ---- */
    win.EventEmitter = function EventEmitter() { this._h = []; };
    win.EventEmitter.prototype.emit = function (v) { this._h.slice().forEach(function (h) { h(v); }); };
    win.EventEmitter.prototype.subscribe = function (h) { var self = this; this._h.push(h); return { unsubscribe: function () { var i = self._h.indexOf(h); if (i >= 0) self._h.splice(i, 1); } }; };
    win.of = function (v) { return { subscribe: function (n) { n(v); }, pipe: function () { return this; }, toPromise: function () { return Promise.resolve(v); } }; };
    function HttpClient() { }
    HttpClient.prototype.get = function (url) {
      var p = function () { return win.fetch(url).then(function (r) { if (!r.ok) throw new Error('Http failure response for ' + url + ': ' + r.status + ' ' + r.statusText); return r.json(); }); };
      return { subscribe: function (next, err) { if (next && typeof next === 'object') { err = next.error; next = next.next; } p().then(next, err); }, toPromise: p };
    };
    win.HttpClient = HttpClient; NG.byName.HttpClient = HttpClient;

    function construct(C) {
      var deps = (NG.depsOf[C.name] || []).map(function (t) {
        if (!t) return undefined;
        if (!NG.byName[t]) throw new Error("NullInjectorError: No provider for " + t + "! (el constructor de " + C.name + " pide un '" + t + "' que no existe)");
        return service(t);
      });
      return new (Function.prototype.bind.apply(C, [null].concat(deps)))();
    }
    function service(name) {
      var C = NG.byName[name];
      if (!C) throw new Error("NullInjectorError: No provider for " + name + "!");
      return NG.singletons[name] || (NG.singletons[name] = construct(C));
    }

    /* ---- "zona" minima: cuando termina código asincrono se vuelve a pintar ---- */
    var pending = false;
    function digest() {
      if (pending) return; pending = true;
      realSetTimeout(function () { pending = false; try { renderRoot(); } catch (e) { reportErr(e); } }, 0);
    }
    function wrapCb(f) { if (typeof f !== 'function') return f; return function () { try { return f.apply(this, arguments); } finally { digest(); } }; }
    var oST = win.setTimeout.bind(win), oSI = win.setInterval.bind(win);
    win.setTimeout = function (f) { var a = Array.prototype.slice.call(arguments); a[0] = wrapCb(f); return oST.apply(null, a); };
    win.setInterval = function (f) { var a = Array.prototype.slice.call(arguments); a[0] = wrapCb(f); return oSI.apply(null, a); };
    var oThen = win.Promise.prototype.then;
    win.Promise.prototype.then = function (a, b) { return oThen.call(this, wrapCb(a), wrapCb(b)); };

    function reportErr(e) {
      try { win.parent.postMessage({ jt: 1, type: 'error', name: e && e.name, message: e && e.message ? e.message : String(e), line: 0, ng: true }, '*'); } catch (x) { /* ignorar */ }
      if (win.console) win.console.error((e && e.name ? e.name + ': ' : '') + (e && e.message ? e.message : e));
    }
    function warnOnce(k, msg) { if (NG.warned[k]) return; NG.warned[k] = 1; reportErr(new Error(msg)); }

    /* ---- mini parser de plantillas (conserva las mayúsculas de los atributos) ---- */
    var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
    function decode(s) { if (s.indexOf('&') < 0) return s; var t = doc.createElement('textarea'); t.innerHTML = s; return t.value; }
    function parseTpl(html) {
      var root = { t: 'el', tag: '#root', attrs: [], kids: [] }, stack = [root];
      var re = /<!--[\s\S]*?-->|<\/([A-Za-z][\w:-]*)\s*>|<([A-Za-z][\w:-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|[^<]+|</g, m;
      while ((m = re.exec(html))) {
        var top = stack[stack.length - 1];
        if (m[0].indexOf('<!--') === 0) continue;
        if (m[1]) {
          var n = m[1].toLowerCase();
          for (var k = stack.length - 1; k > 0; k--) if (stack[k].tag === n) { stack.length = k; break; }
        } else if (m[2]) {
          var el = { t: 'el', tag: m[2].toLowerCase(), attrs: [], kids: [] };
          var ar = /([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g, am;
          while ((am = ar.exec(m[3] || ''))) el.attrs.push([am[1], am[2] !== undefined ? am[2] : am[3] !== undefined ? am[3] : am[4] !== undefined ? am[4] : '']);
          top.kids.push(el);
          if (!m[4] && !VOID[el.tag]) stack.push(el);
        } else {
          var lastKid = top.kids[top.kids.length - 1];
          if (lastKid && lastKid.t === 'tx') lastKid.s += m[0]; else top.kids.push({ t: 'tx', s: m[0] });
        }
      }
      return root;
    }

    /* ---- ambito de evaluacion (propiedades del componente + variables locales + referencias #x) ---- */
    function newScope(comp, locals, refs) {
      var S = { comp: comp, locals: locals, refs: refs };
      S.proxy = new Proxy({}, {
        has: function (t, k) {
          if (typeof k === 'symbol' || k === '$event' || k === '__v' || k === '__s') return false;
          if (k in locals || k in refs || k in comp) return true;
          if (k in win) return false;
          return true;
        },
        get: function (t, k) {
          if (typeof k === 'symbol') return undefined;
          if (k in locals) return locals[k];
          if (k in refs) return refs[k];
          if (k in comp) { var v = comp[k]; return typeof v === 'function' && !/^class\b/.test(Function.prototype.toString.call(v)) ? v.bind(comp) : v; }
          throw new ReferenceError(k + ' is not defined');
        },
        set: function (t, k, v) { if (k in locals) locals[k] = v; else comp[k] = v; return true; }
      });
      return S;
    }
    function fork(S, loc) { return newScope(S.comp, Object.assign({}, S.locals, loc), S.refs); }

    /* ---- expresiones y pipes ---- */
    var cache = {};
    function splitTop(expr, sepChar, single) {
      var parts = [], cur = '', q = null, d = 0;
      for (var i = 0; i < expr.length; i++) {
        var c = expr[i];
        if (q) { cur += c; if (c === q && expr[i - 1] !== '\\') q = null; continue; }
        if (c === '"' || c === "'" || c === '`') { q = c; cur += c; continue; }
        if (c === '(' || c === '[' || c === '{') d++;
        if (c === ')' || c === ']' || c === '}') d--;
        if (c === sepChar && d === 0 && (!single || (expr[i + 1] !== sepChar && expr[i - 1] !== sepChar))) { parts.push(cur); cur = ''; continue; }
        cur += c;
      }
      parts.push(cur);
      return parts;
    }
    function evalRaw(code, S, ev) {
      var f = cache['e' + code] || (cache['e' + code] = new Function('__s', '$event', 'with(__s){return (' + code + '\n)}'));
      return f(S.proxy, ev);
    }
    var PIPES = {
      json: function (v) { return JSON.stringify(v, null, 2); },
      uppercase: function (v) { return v == null ? v : String(v).toUpperCase(); },
      lowercase: function (v) { return v == null ? v : String(v).toLowerCase(); },
      titlecase: function (v) { return v == null ? v : String(v).toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); },
      currency: function (v, code) { if (v == null || v === '') return null; try { return Number(v).toLocaleString('en-US', { style: 'currency', currency: code || 'USD' }); } catch (e) { return Number(v).toFixed(2); } },
      number: function (v, f) {
        if (v == null || v === '') return null; var mi = 1, mn = 0, mx = 3;
        if (f) { var m = /^(\d+)?\.?(\d+)?-?(\d+)?$/.exec(f); if (m) { mi = +m[1] || 1; mn = +m[2] || 0; mx = m[3] !== undefined ? +m[3] : Math.max(mn, 3); } }
        return Number(v).toLocaleString('en-US', { minimumIntegerDigits: mi, minimumFractionDigits: mn, maximumFractionDigits: mx });
      },
      percent: function (v) { return v == null ? null : Math.round(Number(v) * 100) + '%'; },
      slice: function (v, a, b) { return v == null ? v : v.slice(a, b); },
      date: function (v, f) {
        if (v == null || v === '') return null; var d = new Date(v); if (isNaN(d)) return v;
        var p = function (n) { return (n < 10 ? '0' : '') + n; };
        var F = { short: 'M/d/yy, h:mm a', shortDate: 'M/d/yy', mediumDate: 'MMM d, y', fullDate: 'EEEE, MMMM d, y', shortTime: 'h:mm a' };
        f = F[f] || f || 'MMM d, y';
        var mon = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return f.replace(/yyyy|yy|y|MMMM|MMM|MM|M|dd|d|EEEE|HH|H|hh|h|mm|ss|a/g, function (t) {
          switch (t) {
            case 'yyyy': case 'y': return d.getFullYear(); case 'yy': return String(d.getFullYear()).slice(2);
            case 'MMMM': return mon[d.getMonth()]; case 'MMM': return mon[d.getMonth()].slice(0, 3); case 'MM': return p(d.getMonth() + 1); case 'M': return d.getMonth() + 1;
            case 'dd': return p(d.getDate()); case 'd': return d.getDate(); case 'EEEE': return day[d.getDay()];
            case 'HH': return p(d.getHours()); case 'H': return d.getHours(); case 'hh': return p(d.getHours() % 12 || 12); case 'h': return d.getHours() % 12 || 12;
            case 'mm': return p(d.getMinutes()); case 'ss': return p(d.getSeconds()); case 'a': return d.getHours() < 12 ? 'AM' : 'PM';
          } return t;
        });
      }
    };
    function evalExpr(code, S, ev) {
      var parts = splitTop(code, '|', true), v = evalRaw(parts[0].trim(), S, ev);
      for (var i = 1; i < parts.length; i++) {
        var seg = splitTop(parts[i], ':', false), name = seg[0].trim();
        if (!PIPES[name]) throw new Error("The pipe '" + name + "' could not be found");
        var a = seg.slice(1).map(function (x) { return evalRaw(x.trim(), S, ev); });
        v = PIPES[name].apply(null, [v].concat(a));
      }
      return v;
    }
    function execStmt(code, S, ev) {
      var f = cache['s' + code] || (cache['s' + code] = new Function('__s', '$event', 'with(__s){' + code + '\n}'));
      return f(S.proxy, ev);
    }
    function execAssign(code, S, v) {
      var f = cache['a' + code] || (cache['a' + code] = new Function('__s', '__v', 'with(__s){' + code + ' = __v}'));
      return f(S.proxy, v);
    }
    function interp(text, S) {
      var out = '', last = 0, re = /\{\{([\s\S]*?)\}\}/g, m;
      while ((m = re.exec(text))) {
        out += decode(text.slice(last, m.index));
        var v = evalExpr(m[1], S);
        out += v == null ? '' : typeof v === 'object' ? (Array.isArray(v) ? v.join(',') : '[object Object]') : String(v);
        last = re.lastIndex;
      }
      return out + decode(text.slice(last));
    }

    /* ---- validación de formularios ---- */
    function makeCtrl(el, value, key) {
      var st = NG.ctrl[key] || (NG.ctrl[key] = { dirty: false, touched: false });
      var errors = {}, v = value, str = v == null ? '' : String(v);
      if (el.hasAttribute('required') && (v == null || str === '' || v === false)) errors.required = true;
      if (el.hasAttribute('minlength') && str.length < +el.getAttribute('minlength')) errors.minlength = { requiredLength: +el.getAttribute('minlength'), actualLength: str.length };
      if (el.hasAttribute('maxlength') && str.length > +el.getAttribute('maxlength')) errors.maxlength = { requiredLength: +el.getAttribute('maxlength'), actualLength: str.length };
      if (el.hasAttribute('min') && str !== '' && +v < +el.getAttribute('min')) errors.min = { min: +el.getAttribute('min'), actual: +v };
      if (el.hasAttribute('max') && str !== '' && +v > +el.getAttribute('max')) errors.max = { max: +el.getAttribute('max'), actual: +v };
      if (el.hasAttribute('pattern') && str !== '' && !new RegExp('^(?:' + el.getAttribute('pattern') + ')$').test(str)) errors.pattern = true;
      if (el.getAttribute('type') === 'email' && str !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) errors.email = true;
      var invalid = Object.keys(errors).length > 0;
      return { value: v, valid: !invalid, invalid: invalid, pristine: !st.dirty, dirty: st.dirty, touched: st.touched, untouched: !st.touched, errors: invalid ? errors : null, hasError: function (n) { return !!errors[n]; } };
    }
    function makeForm() {
      var f = { controls: [], submitted: false };
      Object.defineProperty(f, 'valid', { get: function () { return this.controls.every(function (c) { return c.valid; }); } });
      Object.defineProperty(f, 'invalid', { get: function () { return !this.valid; } });
      Object.defineProperty(f, 'pristine', { get: function () { return this.controls.every(function (c) { return c.pristine; }); } });
      Object.defineProperty(f, 'dirty', { get: function () { return !this.pristine; } });
      Object.defineProperty(f, 'value', { get: function () { var o = {}; this.controls.forEach(function (c) { if (c.name) o[c.name] = c.value; }); return o; } });
      f.form = f; f.reset = function () { };
      return f;
    }

    /* ---- instancias y plantillas ---- */
    function getRec(C, key) {
      var rec = NG.inst[key];
      if (!rec || rec.C !== C) rec = NG.inst[key] = { C: C, inst: construct(C), init: false };
      return rec;
    }
    function tplOf(C, tabTpl, isRoot) {
      var m = NG.metas[C.name] || {}, html = isRoot && tabTpl && tabTpl.trim() ? tabTpl : m.template;
      if (html == null) throw new Error("El componente " + C.name + " no tiene plantilla: agrega 'template' en @Component o escribe la plantilla en la pestaña HTML");
      var ck = C.name + '|' + html;
      return NG.tplCache[ck] || (NG.tplCache[ck] = parseTpl(html));
    }
    function formsOk() {
      var m = NG.moduleMeta; if (!m || !m.imports) return true;
      return m.imports.indexOf(win.FormsModule) >= 0 || m.imports.indexOf(win.ReactiveFormsModule) >= 0;
    }
    function declared(C) {
      var m = NG.moduleMeta; if (!m || !m.declarations) return true;
      return m.declarations.indexOf(C) >= 0;
    }

    /* ---- render ---- */
    var PROPMAP = { innerhtml: 'innerHTML', textcontent: 'textContent', readonly: 'readOnly', classname: 'className', maxlength: 'maxLength', minlength: 'minLength', colspan: 'colSpan', rowspan: 'rowSpan', tabindex: 'tabIndex' };
    var BOOLP = { hidden: 1, disabled: 1, checked: 1, readonly: 1, required: 1, selected: 1 };
    var rctx = null;
    function camelCss(s) { return s.replace(/-([a-z])/g, function (x, c) { return c.toUpperCase(); }); }
    function kids(node, out, S, form) { node.kids.forEach(function (k) { renderNode(k, out, S, form); }); }

    function renderNode(node, out, S, form) {
      if (node.t === 'tx') { out.appendChild(doc.createTextNode(node.s.indexOf('{{') >= 0 ? interp(node.s, S) : decode(node.s))); return; }
      var attrs = node.attrs;
      function get(n) { for (var i = 0; i < attrs.length; i++) if (attrs[i][0].toLowerCase() === n) return attrs[i][1]; return null; }
      if (node.tag === 'ng-template') {
        var rn = attrs.filter(function (a) { return a[0].charAt(0) === '#'; })[0];
        if (rn) S.refs[rn[0].slice(1)] = { __tpl: node };
        return;
      }
      var forx = node.noFor ? null : get('*ngfor');
      if (forx !== null) {
        var fm = /let\s+([\w$]+)\s+of\s+([^;]+)/.exec(forx);
        if (!fm) throw new Error("Sintaxis incorrecta en *ngFor: se espera \"let item of lista\" y se recibió \"" + forx + "\"");
        var list = evalExpr(fm[2].trim(), S);
        if (list == null) return;
        if (typeof list.length !== 'number') throw new Error("*ngFor solo recorre arreglos y '" + fm[2].trim() + "' no es un arreglo");
        var one = { t: 'el', tag: node.tag, attrs: node.attrs, kids: node.kids, noFor: true };
        Array.prototype.forEach.call(list, function (item, i) {
          var loc = {}; loc[fm[1]] = item;
          var ex = /let\s+([\w$]+)\s*=\s*(index|first|last|even|odd|count)/g, em;
          while ((em = ex.exec(forx))) loc[em[1]] = em[2] === 'index' ? i : em[2] === 'first' ? i === 0 : em[2] === 'last' ? i === list.length - 1 : em[2] === 'even' ? i % 2 === 0 : em[2] === 'odd' ? i % 2 === 1 : list.length;
          renderNode(one, out, fork(S, loc), form);
        });
        return;
      }
      var ifx = node.noIf ? null : get('*ngif');
      if (ifx !== null) {
        var em2 = /^([\s\S]*?);\s*else\s+([\w$]+)\s*$/.exec(ifx), cond = em2 ? em2[1] : ifx;
        if (evalExpr(cond.trim(), S)) renderNode({ t: 'el', tag: node.tag, attrs: node.attrs, kids: node.kids, noFor: node.noFor, noIf: true }, out, S, form);
        else if (em2 && S.refs[em2[2]] && S.refs[em2[2]].__tpl) kids(S.refs[em2[2]].__tpl, out, S, form);
        return;
      }
      if (node.tag === 'ng-container') { kids(node, out, S, form); return; }
      if (node.tag === 'router-outlet' || node.tag === 'script') return;

      var el = doc.createElement(node.tag), model = null, refs = [], evs = [], myForm = form, childRec = null, childKey = null;
      var ChildC = NG.sel[node.tag];
      if (!ChildC && /-/.test(node.tag)) warnOnce('tag:' + node.tag, "NG0304: '" + node.tag + "' is not a known element. Si es un componente, verifica que su selector sea '" + node.tag + "' y que este declarado en el modulo.");
      if (node.tag === 'form') myForm = makeForm();
      if (ChildC) {
        if (!declared(ChildC)) warnOnce('decl:' + ChildC.name, "NG0304: '" + node.tag + "' is not a known element: " + ChildC.name + " no esta en 'declarations' de @NgModule.");
        childKey = rctx.key + '>' + node.tag + '#' + (rctx.counter[node.tag] = (rctx.counter[node.tag] || 0) + 1);
        childRec = getRec(ChildC, childKey);
      }
      attrs.forEach(function (a) {
        var name = a[0], val = a[1], low = name.toLowerCase();
        if (low === '*ngfor' || low === '*ngif') return;
        if (low === '[(ngmodel)]') { model = val; if (!formsOk()) warnOnce('forms', "NG8002: Can't bind to 'ngModel' since it isn't a known property of '" + node.tag + "'. Falta importar FormsModule en el @NgModule (imports)."); return; }
        if (low.charAt(0) === '#') { refs.push([name.slice(1), val]); return; }
        if (low.charAt(0) === '(') { evs.push([name.slice(1, -1), val]); return; }
        if (low.charAt(0) === '[') {
          var prop = name.slice(1, -1), pl = prop.toLowerCase();
          if (childRec && !/^(class|style|attr)\./.test(pl)) { childRec.inst[prop] = evalExpr(val, S); return; }
          var v = evalExpr(val, S);
          if (pl.indexOf('class.') === 0) { if (v) el.classList.add(prop.slice(6)); return; }
          if (pl.indexOf('style.') === 0) { var pr = prop.slice(6).split('.'); el.style[camelCss(pr[0])] = v == null ? '' : v + (pr[1] || ''); return; }
          if (pl.indexOf('attr.') === 0) { if (v == null) el.removeAttribute(prop.slice(5)); else el.setAttribute(prop.slice(5), v); return; }
          if (pl === 'ngclass') {
            if (typeof v === 'string') v.split(/\s+/).forEach(function (c) { if (c) el.classList.add(c); });
            else if (Array.isArray(v)) v.forEach(function (c) { el.classList.add(c); });
            else if (v) Object.keys(v).forEach(function (c) { if (v[c]) c.split(/\s+/).forEach(function (x) { if (x) el.classList.add(x); }); });
            return;
          }
          if (pl === 'ngstyle') { if (v) Object.keys(v).forEach(function (k) { el.style[camelCss(k)] = v[k]; }); return; }
          if (pl === 'ngvalue') { el.value = v; return; }
          var real = PROPMAP[pl] || pl;
          if (BOOLP[pl]) { if (v) el.setAttribute(pl, ''); else el.removeAttribute(pl); }
          try { el[real] = v; } catch (e) { /* propiedad de solo lectura */ }
          return;
        }
        var fin = val.indexOf('{{') >= 0 ? interp(val, S) : val;
        if (childRec && (name in childRec.inst)) childRec.inst[name] = fin;
        el.setAttribute(name, fin);
        if (low === 'value') el.value = fin;
      });

      if (childRec) {
        if (!childRec.init) { childRec.init = true; if (typeof childRec.inst.ngOnInit === 'function') childRec.inst.ngOnInit(); }
        evs.forEach(function (p) {
          var emitter = childRec.inst[p[0]];
          if (emitter && typeof emitter.subscribe === 'function') { emitter._h = []; emitter.subscribe(function (e) { try { execStmt(p[1], S, e); } catch (er) { reportErr(er); } digest(); }); }
        });
        var sk = rctx.key, sc = rctx.counter; rctx.key = childKey; rctx.counter = {};
        kids(tplOf(childRec.C, null, false), el, newScope(childRec.inst, {}, {}), null);
        rctx.key = sk; rctx.counter = sc;
        out.appendChild(el);
        return;
      }

      refs.forEach(function (r) {
        var mode = r[1].toLowerCase();
        if (mode === 'ngform') S.refs[r[0]] = myForm || makeForm();
        else if (mode !== 'ngmodel') S.refs[r[0]] = el;
      });
      kids(node, el, S, myForm);
      out.appendChild(el);
      if (node.tag === 'form' && myForm) { el.classList.add(myForm.valid ? 'ng-valid' : 'ng-invalid', myForm.pristine ? 'ng-pristine' : 'ng-dirty'); }

      var ctrl = null;
      if (model !== null) {
        var key = rctx.mc++, type = (el.getAttribute('type') || '').toLowerCase(), tag = node.tag, value = evalExpr(model, S);
        el.setAttribute('data-ngk', key);
        if (type === 'checkbox') el.checked = !!value;
        else if (type === 'radio') el.checked = el.value == value;
        else if (tag === 'select') { var sv = value == null ? '' : String(value); el.value = sv; if (value == null || el.value !== sv) el.selectedIndex = -1; }
        else el.value = value == null ? '' : value;
        ctrl = makeCtrl(el, value, key); ctrl.name = el.getAttribute('name');
        el.classList.add(ctrl.valid ? 'ng-valid' : 'ng-invalid', ctrl.pristine ? 'ng-pristine' : 'ng-dirty', ctrl.touched ? 'ng-touched' : 'ng-untouched');
        if (myForm) myForm.controls.push(ctrl);
        var evName = (tag === 'select' || type === 'checkbox' || type === 'radio') ? 'change' : 'input';
        el.addEventListener(evName, function () {
          var nv;
          if (type === 'checkbox') nv = el.checked;
          else if (type === 'radio') { if (!el.checked) return; nv = el.value; }
          else if (type === 'number' || type === 'range') nv = el.value === '' ? null : Number(el.value);
          else nv = el.value;
          (NG.ctrl[key] = NG.ctrl[key] || {}).dirty = true;
          try { execAssign(model, S, nv); } catch (er) { reportErr(er); }
          digest();
        });
        el.addEventListener('blur', function () { var st = NG.ctrl[key] = NG.ctrl[key] || {}; if (!st.touched) { st.touched = true; digest(); } });
      }
      refs.forEach(function (r) {
        if (r[1].toLowerCase() === 'ngmodel') S.refs[r[0]] = ctrl || makeCtrl(el, el.value, -1);
      });
      evs.forEach(function (p) {
        var evn = p[0].toLowerCase(), code = p[1];
        if (evn === 'ngsubmit') {
          el.addEventListener('submit', function (e) { e.preventDefault(); if (myForm) myForm.submitted = true; try { execStmt(code, S, e); } catch (er) { reportErr(er); } digest(); });
          return;
        }
        el.addEventListener(evn, function (e) { try { execStmt(code, S, e); } catch (er) { reportErr(er); } digest(); });
      });
    }

    var tabTpl = '', rootName = null, hostEl = null;
    NG.start = function (tpl) {
      tabTpl = tpl || '';
      var comps = Object.keys(NG.metas);
      if (!comps.length) throw new Error("No encontre ningún componente: escribe una clase con el decorador @Component({ ... })");
      rootName = comps.filter(function (n) { return NG.metas[n].selector === 'app-root'; })[0] || comps[0];
      hostEl = doc.getElementById('__root') || doc.body.appendChild(doc.createElement('div'));
      renderRoot();
    };
    function renderRoot() {
      if (!rootName || NG.rendering) return;
      NG.rendering = true;
      try {
        var C = NG.byName[rootName];
        var ae = doc.activeElement, fk = null, sel = null;
        if (ae && hostEl.contains(ae) && ae.getAttribute && ae.getAttribute('data-ngk') != null) { fk = ae.getAttribute('data-ngk'); try { sel = [ae.selectionStart, ae.selectionEnd]; } catch (e) { sel = null; } }
        rctx = { key: 'root', counter: {}, mc: 0 };
        var rec = getRec(C, 'root');
        if (!rec.init) { rec.init = true; if (typeof rec.inst.ngOnInit === 'function') rec.inst.ngOnInit(); }
        var host = doc.createElement(/^[a-z][\w-]*$/.test(NG.metas[rootName].selector || '') ? NG.metas[rootName].selector : 'app-root');
        kids(tplOf(C, tabTpl, true), host, newScope(rec.inst, {}, {}), null);
        hostEl.innerHTML = ''; hostEl.appendChild(host);
        if (fk != null) { var ne = hostEl.querySelector('[data-ngk="' + fk + '"]'); if (ne) { ne.focus(); try { if (sel) ne.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignorar */ } } }
      } finally { NG.rendering = false; }
    }
  };
})();
