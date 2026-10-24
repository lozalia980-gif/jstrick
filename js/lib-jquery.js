/* Xidecode :: mini-jQuery incluido en la pantalla (sin internet).
   Implementa la parte de jQuery que ensenan las guias 10 y 11 (selectores, eventos, efectos, DOM, AJAX y plugins).
   Se serializa con toString(): debe ser autosuficiente. */
(function () {
  var JT = window.JT;
  JT.libs.jq = function (win) {
    var doc = win.document;
    var arr = function (x) { return Array.prototype.slice.call(x); };
    var uniq = function (a) { var out = []; a.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); }); return out; };
    var camel = function (s) { return String(s).replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); }); };
    var UNITLESS = { opacity: 1, zIndex: 1, lineHeight: 1, fontWeight: 1, flex: 1, order: 1, zoom: 1, scrollTop: 1, scrollLeft: 1 };

    /* ---------- selector con pseudo-selectores propios de jQuery ---------- */
    var CUSTOM = /:(first|last|eq|even|odd|lt|gt|contains|visible|hidden)(\(((?:[^()]|\([^()]*\))*)\))?/;
    function isVisible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
    function applyPseudo(set, name, arg) {
      arg = arg == null ? '' : arg.trim();
      switch (name) {
        case 'first': return set.slice(0, 1);
        case 'last': return set.slice(-1);
        case 'eq': var n = parseInt(arg, 10); if (n < 0) n += set.length; return set[n] ? [set[n]] : [];
        case 'even': return set.filter(function (e, i) { return i % 2 === 0; });
        case 'odd': return set.filter(function (e, i) { return i % 2 === 1; });
        case 'lt': return set.slice(0, parseInt(arg, 10));
        case 'gt': return set.slice(parseInt(arg, 10) + 1);
        case 'contains': var t = arg.replace(/^['"]|['"]$/g, ''); return set.filter(function (e) { return (e.textContent || '').indexOf(t) >= 0; });
        case 'visible': return set.filter(isVisible);
        case 'hidden': return set.filter(function (e) { return !isVisible(e); });
      }
      return set;
    }
    function select(sel, roots) {
      sel = String(sel).trim();
      var m = CUSTOM.exec(sel);
      if (!m) {
        var out = [];
        roots.forEach(function (r) { try { out = out.concat(arr(r.querySelectorAll(sel))); } catch (e) { throw new Error("Syntax error, unrecognized expression: " + sel); } });
        return uniq(out);
      }
      var before = sel.slice(0, m.index).trim() || '*', after = sel.slice(m.index + m[0].length).trim();
      var set = applyPseudo(select(before, roots), m[1], m[3]);
      if (after) {
        if (/^[>+~]/.test(after)) {
          var rel = []; set.forEach(function (el) { try { rel = rel.concat(arr(el.querySelectorAll(':scope ' + after))); } catch (e) { /* ignorar */ } });
          set = uniq(rel);
        } else if (CUSTOM.test(after) || /^[\w.#\[*:]/.test(after)) set = select(after, set);
      }
      return set;
    }
    function matchesSel(el, sel) {
      if (CUSTOM.test(sel)) return select(sel, [doc]).indexOf(el) >= 0;
      try { return el.matches(sel); } catch (e) { return false; }
    }
    function htmlToNodes(html) { var t = doc.createElement('template'); t.innerHTML = html.trim(); return arr(t.content.childNodes); }

    /* ---------- constructor ---------- */
    function JQ(sel, ctx) { return new JQ.fn.init(sel, ctx); }
    JQ.fn = JQ.prototype = { jquery: '3.7.1-xidecode', length: 0, constructor: JQ };
    var init = JQ.fn.init = function (sel, ctx) {
      this.length = 0;
      if (!sel) return this;
      var els = [];
      if (typeof sel === 'string') {
        if (/^\s*<[\s\S]+>\s*$/.test(sel)) els = htmlToNodes(sel).filter(function (n) { return n.nodeType === 1; });
        else {
          var roots = ctx ? (ctx.jquery ? arr(ctx) : [ctx]) : [doc];
          els = select(sel, roots);
        }
      } else if (typeof sel === 'function') { ready(sel); return this; }
      else if (sel.jquery) els = arr(sel);
      else if (sel.nodeType || sel === win || sel === doc) els = [sel];
      else if (typeof sel.length === 'number') els = arr(sel);
      else els = [sel];
      for (var i = 0; i < els.length; i++) this[i] = els[i];
      this.length = els.length;
      return this;
    };
    init.prototype = JQ.fn;
    function wrap(a) { var j = new JQ.fn.init(); a.forEach(function (x, i) { j[i] = x; }); j.length = a.length; return j; }
    function ready(fn) {
      if (doc.readyState !== 'loading') setTimeout(function () { fn.call(doc, JQ); }, 0);
      else doc.addEventListener('DOMContentLoaded', function () { fn.call(doc, JQ); });
    }

    /* ---------- estaticos ---------- */
    JQ.extend = JQ.fn.extend = function () {
      var a = arguments, deep = false, i = 1, target = a[0];
      if (typeof target === 'boolean') { deep = target; target = a[1]; i = 2; }
      if (a.length === i) { target = this; i--; }
      for (; i < a.length; i++) {
        var src = a[i]; if (!src) continue;
        for (var k in src) {
          if (deep && src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) && !src[k].nodeType) target[k] = JQ.extend(true, target[k] && typeof target[k] === 'object' ? target[k] : {}, src[k]);
          else if (src[k] !== undefined) target[k] = src[k];
        }
      }
      return target;
    };
    JQ.each = function (o, fn) {
      if (o && typeof o.length === 'number' && typeof o !== 'function') { for (var i = 0; i < o.length; i++) if (fn.call(o[i], i, o[i]) === false) break; }
      else for (var k in o) if (fn.call(o[k], k, o[k]) === false) break;
      return o;
    };
    JQ.map = function (o, fn) { var out = []; JQ.each(o, function (i, v) { var r = fn(v, i); if (r != null) out = out.concat(r); }); return out; };
    JQ.trim = function (s) { return s == null ? '' : String(s).trim(); };
    JQ.isArray = Array.isArray;
    JQ.isFunction = function (f) { return typeof f === 'function'; };
    JQ.isEmptyObject = function (o) { for (var k in o) return false; return true; };
    JQ.inArray = function (v, a) { return Array.prototype.indexOf.call(a, v); };
    JQ.parseJSON = JSON.parse; JQ.noop = function () { }; JQ.now = Date.now;
    JQ.type = function (o) { return o === null ? 'null' : Array.isArray(o) ? 'array' : typeof o; };
    JQ.proxy = function (f, c) { return function () { return f.apply(c, arguments); }; };
    JQ.browser = { msie: false, safari: false, chrome: true, mozilla: false, opera: false, version: '0' };
    JQ.param = function (o) { return Object.keys(o).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }).join('&'); };
    JQ.fx = { off: false };

    /* ---------- Deferred minimo ---------- */
    JQ.Deferred = function () {
      var st = 'pending', val = [], cbs = { done: [], fail: [] }, always = [];
      var d = {
        resolve: function () { if (st !== 'pending') return d; st = 'resolved'; val = arguments; cbs.done.forEach(function (f) { f.apply(null, val); }); always.forEach(function (f) { f.apply(null, val); }); return d; },
        reject: function () { if (st !== 'pending') return d; st = 'rejected'; val = arguments; cbs.fail.forEach(function (f) { f.apply(null, val); }); always.forEach(function (f) { f.apply(null, val); }); return d; },
        done: function (f) { if (st === 'resolved') f.apply(null, val); else cbs.done.push(f); return d; },
        fail: function (f) { if (st === 'rejected') f.apply(null, val); else cbs.fail.push(f); return d; },
        always: function (f) { if (st !== 'pending') f.apply(null, val); else always.push(f); return d; },
        then: function (a, b) { if (a) d.done(a); if (b) d.fail(b); return d; },
        promise: function () { return d; }, state: function () { return st; }
      };
      return d;
    };

    /* ---------- AJAX ---------- */
    JQ.ajax = function (url, o) {
      if (typeof url === 'object') { o = url; url = o.url; }
      o = JQ.extend({ type: 'GET', dataType: null, data: null, contentType: 'application/x-www-form-urlencoded; charset=UTF-8', headers: {} }, o || {});
      var method = String(o.type || o.method || 'GET').toUpperCase(), d = JQ.Deferred(), xhr = new win.XMLHttpRequest();
      var body = null, data = o.data;
      if (data && typeof data !== 'string' && !(data instanceof win.FormData)) data = o.contentType && /json/.test(o.contentType) ? JSON.stringify(data) : JQ.param(data);
      if (data && (method === 'GET' || method === 'HEAD')) { url += (url.indexOf('?') < 0 ? '?' : '&') + data; } else body = data || null;
      xhr.open(method, url, o.async !== false);
      if (body && !(body instanceof win.FormData)) xhr.setRequestHeader('Content-Type', o.contentType);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      for (var h in o.headers) xhr.setRequestHeader(h, o.headers[h]);
      var jq = { readyState: 0, status: 0, responseText: '', abort: function () { xhr.abort(); }, getResponseHeader: function (n) { return xhr.getResponseHeader(n); } };
      jq.done = function (f) { d.done(f); return jq; }; jq.fail = function (f) { d.fail(f); return jq; };
      jq.always = function (f) { d.always(f); return jq; }; jq.then = function (a, b) { d.then(a, b); return jq; };
      xhr.onload = function () {
        jq.readyState = 4; jq.status = xhr.status; jq.statusText = xhr.statusText; jq.responseText = xhr.responseText;
        var type = o.dataType || (/json/.test(xhr.getResponseHeader('content-type') || '') ? 'json' : 'text'), res = xhr.responseText;
        if (xhr.status >= 200 && xhr.status < 300) {
          try { if (type === 'json') res = JSON.parse(res); } catch (e) { if (o.error) o.error(jq, 'parsererror', e); d.reject(jq, 'parsererror', e); if (o.complete) o.complete(jq, 'parsererror'); return; }
          if (o.success) o.success.call(o.context || null, res, 'success', jq);
          d.resolve(res, 'success', jq);
          if (o.complete) o.complete.call(o.context || null, jq, 'success');
        } else {
          if (o.error) o.error.call(o.context || null, jq, 'error', xhr.statusText);
          d.reject(jq, 'error', xhr.statusText);
          if (o.complete) o.complete.call(o.context || null, jq, 'error');
        }
      };
      xhr.onerror = function () { jq.status = 0; if (o.error) o.error(jq, 'error', ''); d.reject(jq, 'error', ''); if (o.complete) o.complete(jq, 'error'); };
      if (o.beforeSend) o.beforeSend(jq);
      xhr.send(body);
      return jq;
    };
    function shortAjax(method, url, data, cb, type) {
      if (typeof data === 'function') { type = type || cb; cb = data; data = null; }
      return JQ.ajax({ url: url, type: method, data: data, success: cb, dataType: type });
    }
    JQ.get = function (u, d, cb, t) { return shortAjax('GET', u, d, cb, t); };
    JQ.post = function (u, d, cb, t) { return shortAjax('POST', u, d, cb, t); };
    JQ.getJSON = function (u, d, cb) { return shortAjax('GET', u, d, cb, 'json'); };
    JQ.getScript = function (u, cb) { return JQ.ajax({ url: u, dataType: 'text', success: function (t) { (0, win.eval)(t); if (cb) cb(t); } }); };

    /* ---------- efectos ---------- */
    var DUR = { slow: 600, fast: 200, _default: 400 };
    function dur(d) { return d == null ? DUR._default : typeof d === 'number' ? d : (DUR[d] != null ? DUR[d] : DUR._default); }
    function queue(el, job) {
      var q = el.__fxq = el.__fxq || { run: false, items: [] };
      q.items.push(job); if (!q.run) next(el);
    }
    function next(el) {
      var q = el.__fxq, job = q.items.shift();
      if (!job) { q.run = false; return; }
      q.run = true;
      job(function () { next(el); });
    }
    function tween(el, props, ms, cb) {
      var start = {}, end = {}, unit = {}, k;
      var cs = win.getComputedStyle(el);
      for (k in props) {
        var key = camel(k), v = props[k];
        var cur = key === 'scrollTop' ? el.scrollTop : (parseFloat(cs[key]) || 0);
        start[key] = cur;
        if (typeof v === 'string' && /^[+-]=/.test(v)) end[key] = cur + parseFloat(v.replace('=', '')) * 1;
        else end[key] = parseFloat(v);
        var um = typeof v === 'string' ? /[a-z%]+$/i.exec(v) : null;
        unit[key] = UNITLESS[key] ? '' : (um ? um[0] : 'px');
      }
      var t0 = null;
      el.__fxstop = false;
      function set(key, val) { if (key === 'scrollTop') el.scrollTop = val; else el.style[key] = val + unit[key]; }
      if (!ms || JQ.fx.off) { for (k in end) set(k, end[k]); cb && cb(); return; }
      function step(t) {
        if (el.__fxstop) return;
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / ms), e = 0.5 - Math.cos(p * Math.PI) / 2;
        for (var kk in end) set(kk, start[kk] + (end[kk] - start[kk]) * e);
        if (p < 1) win.requestAnimationFrame(step); else cb && cb();
      }
      win.requestAnimationFrame(step);
    }
    var DISP = {};
    function defaultDisplay(el) {
      var n = el.nodeName; if (DISP[n]) return DISP[n];
      var t = doc.createElement(n); doc.body.appendChild(t); var d = win.getComputedStyle(t).display; t.remove();
      if (d === 'none') d = 'block'; return (DISP[n] = d);
    }
    function isHidden(el) { return win.getComputedStyle(el).display === 'none'; }
    function showHide(el, show, ms, mode, done) {
      var hidden = isHidden(el);
      if (show && !hidden) return done && done();
      if (!show && hidden) return done && done();
      var saved = { o: el.style.opacity, h: el.style.height, w: el.style.width, ov: el.style.overflow, pt: el.style.paddingTop, pb: el.style.paddingBottom, mt: el.style.marginTop, mb: el.style.marginBottom };
      function restore() { el.style.opacity = saved.o; el.style.height = saved.h; el.style.width = saved.w; el.style.overflow = saved.ov; el.style.paddingTop = saved.pt; el.style.paddingBottom = saved.pb; el.style.marginTop = saved.mt; el.style.marginBottom = saved.mb; }
      if (show) { el.style.display = el.__olddisp && el.__olddisp !== 'none' ? el.__olddisp : defaultDisplay(el); if (win.getComputedStyle(el).display === 'none') el.style.display = defaultDisplay(el); }
      else el.__olddisp = win.getComputedStyle(el).display;
      if (!ms) { if (!show) el.style.display = 'none'; return done && done(); }
      var cs = win.getComputedStyle(el), full = { height: el.offsetHeight, width: el.offsetWidth, pt: parseFloat(cs.paddingTop) || 0, pb: parseFloat(cs.paddingBottom) || 0, mt: parseFloat(cs.marginTop) || 0, mb: parseFloat(cs.marginBottom) || 0 };
      var from = {}, to = {};
      var useOp = mode === 'fade' || mode === 'both', useH = mode === 'slide' || mode === 'both', useW = mode === 'both';
      if (useOp) { from.opacity = show ? 0 : 1; to.opacity = show ? 1 : 0; }
      if (useH) { from.height = show ? 0 : full.height; to.height = show ? full.height : 0; from.paddingTop = show ? 0 : full.pt; to.paddingTop = show ? full.pt : 0; from.paddingBottom = show ? 0 : full.pb; to.paddingBottom = show ? full.pb : 0; from.marginTop = show ? 0 : full.mt; to.marginTop = show ? full.mt : 0; from.marginBottom = show ? 0 : full.mb; to.marginBottom = show ? full.mb : 0; el.style.overflow = 'hidden'; }
      if (useW) { from.width = show ? 0 : full.width; to.width = show ? full.width : 0; }
      for (var k in from) el.style[k] = from[k] + (k === 'opacity' ? '' : 'px');
      tween(el, to, ms, function () { if (!show) el.style.display = 'none'; restore(); done && done(); });
    }
    function fxJob(self, show, speed, mode, cb, toggle) {
      if (typeof speed === 'function') { cb = speed; speed = null; }
      return self.each(function () {
        var el = this;
        queue(el, function (nx) {
          var s = toggle ? isHidden(el) : show;
          showHide(el, s, speed == null && mode !== 'plain' ? (mode === 'both' ? 0 : DUR._default) : dur(speed), mode, function () { if (cb) cb.call(el); nx(); });
        });
      });
    }

    /* ---------- eventos ---------- */
    function bindEv(el, types, sel, fn, one) {
      types.split(/\s+/).forEach(function (full) {
        if (!full) return;
        var type = full.split('.')[0], ns = full.split('.')[1] || '';
        var h = function (e) {
          var target = el;
          if (sel) { var t = e.target && e.target.closest ? e.target.closest(sel) : null; if (!t || !el.contains(t) || t === el && !matchesSel(el, sel)) return; target = t; }
          if (one) el.removeEventListener(type, h);
          var r = fn.call(target, e);
          if (r === false) { e.preventDefault(); e.stopPropagation(); }
        };
        (el.__jqev = el.__jqev || []).push({ type: type, ns: ns, fn: fn, sel: sel, h: h });
        el.addEventListener(type, h);
      });
    }
    var EV = ['click', 'dblclick', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousedown', 'mouseup', 'mousemove', 'focus', 'blur', 'change', 'keyup', 'keydown', 'keypress', 'submit', 'resize', 'scroll', 'select', 'input', 'contextmenu'];

    /* ---------- metodos ---------- */
    var F = JQ.fn;
    F.each = function (fn) { for (var i = 0; i < this.length; i++) if (fn.call(this[i], i, this[i]) === false) break; return this; };
    F.map = function (fn) { var out = []; for (var i = 0; i < this.length; i++) { var r = fn.call(this[i], i, this[i]); if (r != null) out = out.concat(r); } return wrap(out); };
    F.get = function (i) { return i == null ? arr(this) : this[i < 0 ? this.length + i : i]; };
    F.toArray = function () { return arr(this); };
    F.size = function () { return this.length; };
    F.eq = function (i) { return wrap(this[i < 0 ? this.length + i : i] ? [this[i < 0 ? this.length + i : i]] : []); };
    F.first = function () { return this.eq(0); }; F.last = function () { return this.eq(-1); };
    F.slice = function (a, b) { return wrap(arr(this).slice(a, b)); };
    F.index = function (x) {
      if (x == null) { var e = this[0]; return e && e.parentNode ? arr(e.parentNode.children).indexOf(e) : -1; }
      var t = typeof x === 'string' ? select(x, [doc])[0] : x.jquery ? x[0] : x;
      return arr(this).indexOf(t);
    };
    F.find = function (s) { return wrap(select(s, arr(this))); };
    F.children = function (s) { var o = []; this.each(function () { o = o.concat(arr(this.children)); }); if (s) o = o.filter(function (e) { return matchesSel(e, s); }); return wrap(uniq(o)); };
    F.parent = function () { var o = []; this.each(function () { if (this.parentNode && this.parentNode.nodeType === 1) o.push(this.parentNode); }); return wrap(uniq(o)); };
    F.parents = function (s) { var o = []; this.each(function () { var p = this.parentNode; while (p && p.nodeType === 1) { if (!s || matchesSel(p, s)) o.push(p); p = p.parentNode; } }); return wrap(uniq(o)); };
    F.closest = function (s) { var o = []; this.each(function () { var c = this.closest ? this.closest(s) : null; if (c) o.push(c); }); return wrap(uniq(o)); };
    F.siblings = function (s) { var o = []; this.each(function () { var me = this; if (me.parentNode) arr(me.parentNode.children).forEach(function (e) { if (e !== me && (!s || matchesSel(e, s))) o.push(e); }); }); return wrap(uniq(o)); };
    F.next = function () { var o = []; this.each(function () { if (this.nextElementSibling) o.push(this.nextElementSibling); }); return wrap(o); };
    F.prev = function () { var o = []; this.each(function () { if (this.previousElementSibling) o.push(this.previousElementSibling); }); return wrap(o); };
    F.filter = function (s) { return wrap(arr(this).filter(function (e, i) { return typeof s === 'function' ? s.call(e, i, e) : matchesSel(e, s); })); };
    F.not = function (s) { return wrap(arr(this).filter(function (e, i) { return !(typeof s === 'function' ? s.call(e, i, e) : s && s.nodeType ? e === s : matchesSel(e, s)); })); };
    F.has = function (s) { return wrap(arr(this).filter(function (e) { return e.querySelector(s); })); };
    F.is = function (s) { return arr(this).some(function (e, i) { return typeof s === 'function' ? s.call(e, i, e) : s && s.nodeType ? e === s : s && s.jquery ? arr(s).indexOf(e) >= 0 : matchesSel(e, s); }); };
    F.add = function (s) { return wrap(uniq(arr(this).concat(arr(JQ(s))))); };
    F.end = function () { return this; };

    F.html = function (v) { if (v === undefined) return this[0] ? this[0].innerHTML : undefined; return this.each(function () { this.innerHTML = v; }); };
    F.text = function (v) { if (v === undefined) return arr(this).map(function (e) { return e.textContent; }).join(''); return this.each(function () { this.textContent = v; }); };
    F.val = function (v) {
      if (v === undefined) { var e = this[0]; if (!e) return undefined; if (e.tagName === 'SELECT' && e.multiple) return arr(e.selectedOptions).map(function (o) { return o.value; }); return e.value; }
      return this.each(function () { this.value = v; });
    };
    F.attr = function (n, v) {
      if (typeof n === 'object') { for (var k in n) this.attr(k, n[k]); return this; }
      if (v === undefined) return this[0] && this[0].getAttribute ? (this[0].getAttribute(n) === null ? undefined : this[0].getAttribute(n)) : undefined;
      return this.each(function () { if (v === null) this.removeAttribute(n); else this.setAttribute(n, v); });
    };
    F.removeAttr = function (n) { return this.each(function () { this.removeAttribute(n); }); };
    F.prop = function (n, v) { if (v === undefined) return this[0] ? this[0][n] : undefined; return this.each(function () { this[n] = v; }); };
    F.data = function (k, v) {
      if (v === undefined) { var e = this[0]; if (!e) return undefined; e.__jqd = e.__jqd || {}; if (k in e.__jqd) return e.__jqd[k]; var a = e.getAttribute && e.getAttribute('data-' + k); return a === null || a === undefined ? undefined : a; }
      return this.each(function () { this.__jqd = this.__jqd || {}; this.__jqd[k] = v; });
    };
    F.addClass = function (c) { return this.each(function () { var el = this; String(c).split(/\s+/).forEach(function (x) { if (x) el.classList.add(x); }); }); };
    F.removeClass = function (c) { return this.each(function () { var el = this; if (c === undefined) el.className = ''; else String(c).split(/\s+/).forEach(function (x) { if (x) el.classList.remove(x); }); }); };
    F.toggleClass = function (c, st) { return this.each(function () { var el = this; String(c).split(/\s+/).forEach(function (x) { if (x) el.classList.toggle(x, st === undefined ? undefined : !!st); }); }); };
    F.hasClass = function (c) { return arr(this).some(function (e) { return e.classList && e.classList.contains(c); }); };
    F.css = function (n, v) {
      if (typeof n === 'object') { for (var k in n) this.css(k, n[k]); return this; }
      var key = camel(n);
      if (v === undefined) { var e = this[0]; return e ? win.getComputedStyle(e)[key] || e.style[key] : undefined; }
      return this.each(function () { var val = v; if (typeof v === 'number' && !UNITLESS[key]) val = v + 'px'; if (typeof v === 'string' && /^[+-]=/.test(v)) val = (parseFloat(win.getComputedStyle(this)[key]) + parseFloat(v.replace('=', ''))) + 'px'; this.style[key] = val; });
    };
    ['width', 'height'].forEach(function (d) {
      F[d] = function (v) {
        if (v === undefined) { var e = this[0]; if (!e) return undefined; if (e === win) return win.innerWidth; var cs = win.getComputedStyle(e); var x = parseFloat(cs[d]); return isNaN(x) ? (d === 'width' ? e.offsetWidth : e.offsetHeight) : x; }
        return this.css(d, v);
      };
      var D = d.charAt(0).toUpperCase() + d.slice(1);
      F['inner' + D] = function () { var e = this[0]; return e ? (d === 'width' ? e.clientWidth : e.clientHeight) : undefined; };
      F['outer' + D] = function () { var e = this[0]; return e ? (d === 'width' ? e.offsetWidth : e.offsetHeight) : undefined; };
    });
    F.offset = function () { var e = this[0]; if (!e) return undefined; var r = e.getBoundingClientRect(); return { top: r.top + win.pageYOffset, left: r.left + win.pageXOffset }; };
    F.position = function () { var e = this[0]; return e ? { top: e.offsetTop, left: e.offsetLeft } : undefined; };
    F.scrollTop = function (v) {
      if (v === undefined) { var e = this[0]; return e === win || e === doc ? win.pageYOffset : e ? e.scrollTop : undefined; }
      return this.each(function () { if (this === win || this === doc) win.scrollTo(0, v); else this.scrollTop = v; });
    };

    function toNodes(c) {
      if (c == null) return [];
      if (typeof c === 'string') return htmlToNodes(c);
      if (c.jquery) return arr(c);
      if (c.nodeType) return [c];
      if (typeof c.length === 'number') return arr(c);
      return [doc.createTextNode(String(c))];
    }
    function insert(self, content, where) {
      var many = self.length > 1;
      return self.each(function (i) {
        var host = this;
        var nodes = toNodes(content).map(function (n) { return many && i < self.length - 1 ? n.cloneNode(true) : n; });
        if (where === 'append') nodes.forEach(function (n) { host.appendChild(n); });
        else if (where === 'prepend') nodes.slice().reverse().forEach(function (n) { host.insertBefore(n, host.firstChild); });
        else if (where === 'after') nodes.slice().reverse().forEach(function (n) { host.parentNode && host.parentNode.insertBefore(n, host.nextSibling); });
        else if (where === 'before') nodes.forEach(function (n) { host.parentNode && host.parentNode.insertBefore(n, host); });
      });
    }
    F.append = function (c) { return insert(this, c, 'append'); };
    F.prepend = function (c) { return insert(this, c, 'prepend'); };
    F.after = function (c) { return insert(this, c, 'after'); };
    F.before = function (c) { return insert(this, c, 'before'); };
    F.appendTo = function (t) { insert(JQ(t), this, 'append'); return this; };
    F.prependTo = function (t) { insert(JQ(t), this, 'prepend'); return this; };
    F.remove = function () { return this.each(function () { if (this.parentNode) this.parentNode.removeChild(this); }); };
    F.detach = F.remove;
    F.empty = function () { return this.each(function () { this.innerHTML = ''; }); };
    F.clone = function () { return wrap(arr(this).map(function (e) { return e.cloneNode(true); })); };
    F.wrap = function (h) { return this.each(function () { var w = htmlToNodes(h)[0]; this.parentNode.insertBefore(w, this); w.appendChild(this); }); };
    F.serializeArray = function () { var o = []; this.find('input,select,textarea').each(function () { if (this.name && !this.disabled && (this.type !== 'checkbox' && this.type !== 'radio' || this.checked)) o.push({ name: this.name, value: this.value }); }); return o; };
    F.serialize = function () { return this.serializeArray().map(function (p) { return encodeURIComponent(p.name) + '=' + encodeURIComponent(p.value); }).join('&'); };

    F.on = function (types, sel, fn) {
      if (typeof sel === 'function') { fn = sel; sel = null; }
      return this.each(function () { bindEv(this, types, sel, fn, false); });
    };
    F.one = function (types, sel, fn) { if (typeof sel === 'function') { fn = sel; sel = null; } return this.each(function () { bindEv(this, types, sel, fn, true); }); };
    F.off = function (types, fn) {
      return this.each(function () {
        var el = this, list = el.__jqev || [];
        list.slice().forEach(function (r) {
          var t = types ? types.split(/\s+/).some(function (x) { var p = x.split('.'); return (!p[0] || p[0] === r.type) && (!p[1] || p[1] === r.ns); }) : true;
          if (t && (!fn || fn === r.fn)) { el.removeEventListener(r.type, r.h); list.splice(list.indexOf(r), 1); }
        });
      });
    };
    F.bind = F.on; F.unbind = F.off;
    F.delegate = function (sel, types, fn) { return this.on(types, sel, fn); };
    F.trigger = function (type) {
      return this.each(function () {
        var t = String(type).split('.')[0];
        if (t === 'click' && this.click) this.click();
        else if (t === 'focus' && this.focus) this.focus();
        else if (t === 'blur' && this.blur) this.blur();
        else if (t === 'submit' && this.dispatchEvent) this.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
        else this.dispatchEvent(new win.Event(t, { bubbles: true, cancelable: true }));
      });
    };
    EV.forEach(function (n) {
      F[n] = function (fn) { return fn === undefined ? this.trigger(n) : this.on(n, fn); };
    });
    F.hover = function (a, b) { return this.on('mouseenter', a).on('mouseleave', b || a); };
    F.ready = function (fn) { ready(fn); return this; };
    F.load = function (url, a, b) {
      var self = this, parts = String(url).split(/\s+/), u = parts[0], sel = parts[1], cb = typeof a === 'function' ? a : b;
      JQ.ajax({ url: u, dataType: 'text', complete: function (x, st) {
        if (x.status >= 200 && x.status < 300) { var html = x.responseText; if (sel) { var d = doc.createElement('div'); d.innerHTML = html; var s = d.querySelector(sel); html = s ? s.outerHTML : ''; } self.html(html); }
        else self.html('<span style="color:#e06c75">Error ' + x.status + ' al cargar ' + u + '</span>');
        if (cb) self.each(function () { cb.call(this, x.responseText, st, x); });
      } });
      return this;
    };

    /* efectos */
    F.show = function (s, cb) { return fxJob(this, true, s, 'both', cb); };
    F.hide = function (s, cb) { return fxJob(this, false, s, 'both', cb); };
    var origToggle = function (s, cb) { return fxJob(this, null, s, 'both', cb, true); };
    F.toggle = function () {
      var a = arguments;
      if (typeof a[0] === 'function' && typeof a[1] === 'function') {
        var fns = arr(a), n = 0;
        return this.on('click', function (e) { var f = fns[n % fns.length]; n++; return f.call(this, e); });
      }
      if (typeof a[0] === 'boolean') return a[0] ? this.show() : this.hide();
      return origToggle.apply(this, a);
    };
    F.fadeIn = function (s, cb) { return fxJob(this, true, s, 'fade', cb); };
    F.fadeOut = function (s, cb) { return fxJob(this, false, s, 'fade', cb); };
    F.fadeToggle = function (s, cb) { return fxJob(this, null, s, 'fade', cb, true); };
    F.slideDown = function (s, cb) { return fxJob(this, true, s, 'slide', cb); };
    F.slideUp = function (s, cb) { return fxJob(this, false, s, 'slide', cb); };
    F.slideToggle = function (s, cb) { return fxJob(this, null, s, 'slide', cb, true); };
    F.fadeTo = function (s, o, cb) { return this.each(function () { var el = this; queue(el, function (nx) { if (isHidden(el)) { el.style.display = defaultDisplay(el); el.style.opacity = 0; } tween(el, { opacity: o }, dur(s), function () { if (cb) cb.call(el); nx(); }); }); }); };
    F.animate = function (props, s, easing, cb) {
      if (typeof s === 'object') { cb = s.complete; s = s.duration; }
      if (typeof easing === 'function') { cb = easing; }
      return this.each(function () { var el = this; queue(el, function (nx) { tween(el, props, dur(s), function () { if (cb) cb.call(el); nx(); }); }); });
    };
    F.delay = function (ms) { return this.each(function () { queue(this, function (nx) { setTimeout(nx, ms); }); }); };
    F.stop = function (clear) { return this.each(function () { this.__fxstop = true; if (this.__fxq) { this.__fxq.items = clear ? [] : this.__fxq.items; this.__fxq.run = false; } }); };
    F.finish = F.stop;

    win.jQuery = win.$ = JQ;
  };
})();
