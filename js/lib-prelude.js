/* Xidecode :: prelude que se ejecuta DENTRO de la pantalla (iframe) antes del código del alumno.
   Esta función se serializa con toString(), por eso debe ser autosuficiente (no usar variables externas). */
(function () {
  var JT = window.JT;
  JT.libs.prelude = function (win) {
    var P = win.parent;
    function send(m) { try { m.jt = 1; P.postMessage(m, '*'); } catch (e) { /* ignorar */ } }

    /* ---------- formateo para la consola ---------- */
    function fmt(v, d) {
      d = d || 0;
      if (v === undefined) return 'undefined';
      if (v === null) return 'null';
      var t = typeof v;
      if (t === 'string') return d ? JSON.stringify(v) : v;
      if (t === 'number' || t === 'boolean' || t === 'bigint') return String(v);
      if (t === 'function') return 'ƒ ' + (v.name || 'anonima') + '()';
      if (t === 'symbol') return v.toString();
      if (v instanceof win.Error) return v.name + ': ' + v.message;
      if (win.Element && v instanceof win.Element) {
        var s = '<' + v.tagName.toLowerCase() + (v.id ? ' id="' + v.id + '"' : '') + (v.className && typeof v.className === 'string' ? ' class="' + v.className + '"' : '') + '>';
        return s;
      }
      if (v && v.jquery) return 'jQuery(' + v.length + ')';
      if (d > 3) return Array.isArray(v) ? '[...]' : '{...}';
      try {
        if (Array.isArray(v)) return '[' + v.map(function (x) { return fmt(x, d + 1); }).join(', ') + ']';
        if (v instanceof win.Date) return v.toISOString();
        var ks = Object.keys(v);
        if (!ks.length) return '{}';
        return '{ ' + ks.map(function (k) { return k + ': ' + fmt(v[k], d + 1); }).join(', ') + ' }';
      } catch (e) { return String(v); }
    }
    win.__jtFmt = fmt;

    /* ---------- consola ---------- */
    var c = win.console, orig = {};
    ['log', 'info', 'warn', 'error', 'debug'].forEach(function (lv) {
      orig[lv] = c[lv] ? c[lv].bind(c) : function () { };
      c[lv] = function () {
        var args = Array.prototype.slice.call(arguments);
        send({ type: 'log', level: lv === 'debug' || lv === 'info' ? 'log' : lv, text: args.map(function (a) { return fmt(a); }).join(' ') });
        orig[lv].apply(null, args);
      };
    });
    c.table = function (data) { send({ type: 'log', level: 'log', text: fmt(data) }); };
    c.clear = function () { send({ type: 'clear' }); };
    c.assert = function (cond) { if (!cond) c.error('Assertion failed: ' + Array.prototype.slice.call(arguments, 1).map(function (a) { return fmt(a); }).join(' ')); };

    /* ---------- errores ---------- */
    win.addEventListener('error', function (e) {
      if (e.target && e.target !== win && e.target.tagName) return; // recursos que no cargan (imagenes) no son errores de JS
      win.__jtHadError = true;
      send({ type: 'error', name: e.error && e.error.name, message: e.message, line: e.lineno, col: e.colno, file: e.filename, stack: e.error && e.error.stack });
    }, true);
    win.addEventListener('unhandledrejection', function (e) {
      var r = e.reason;
      win.__jtHadError = true;
      send({ type: 'error', name: r && r.name, message: r && r.message ? r.message : String(r), line: 0, rejection: true });
    });

    /* ---------- alert / confirm / prompt sin bloquear ---------- */
    function toast(msg) {
      try {
        var b = win.document.body; if (!b) return;
        var d = win.document.createElement('div');
        d.setAttribute('style', 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);background:#23262f;color:#fff;font:14px/1.4 Segoe UI,sans-serif;padding:10px 16px;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.4);z-index:2147483647;max-width:88%;border:1px solid #61afef');
        d.textContent = msg; b.appendChild(d);
        setTimeout(function () { d.remove(); }, 3200);
      } catch (e) { /* ignorar */ }
    }
    win.alert = function (m) { send({ type: 'log', level: 'sys', text: 'alert: ' + fmt(m) }); toast(fmt(m)); };
    win.confirm = function (m) { send({ type: 'log', level: 'sys', text: 'confirm: ' + fmt(m) + '  (devuelve true en el simulador)' }); toast(fmt(m)); return true; };
    win.prompt = function (m, def) { send({ type: 'log', level: 'sys', text: 'prompt: ' + fmt(m) + '  (devuelve "' + (def || 'Ejemplo') + '" en el simulador)' }); return def || 'Ejemplo'; };

    /* ---------- almacenamiento simulado (aislado de los datos de la aplicación) ---------- */
    function memStore() {
      var m = {};
      return {
        get length() { return Object.keys(m).length; },
        key: function (i) { return Object.keys(m)[i] || null; },
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
        setItem: function (k, v) { m[k] = String(v); },
        removeItem: function (k) { delete m[k]; },
        clear: function () { m = {}; }
      };
    }
    function realOf(name) { try { var s = P[name]; s.length; return s; } catch (e) { return memStore(); } }
    var stores = {};
    function makeStore(name, pre) {
      var real = realOf(name);
      function keys() { var out = []; for (var i = 0; i < real.length; i++) { var k = real.key(i); if (k && k.indexOf(pre) === 0) out.push(k.slice(pre.length)); } return out; }
      var api = {
        getItem: function (k) { var v = real.getItem(pre + k); return v === null || v === undefined ? null : v; },
        setItem: function (k, v) { if (arguments.length < 2) throw new TypeError("Failed to execute 'setItem' on 'Storage': 2 arguments required, but only " + arguments.length + " present."); real.setItem(pre + k, String(v)); snap(); },
        removeItem: function (k) { real.removeItem(pre + k); snap(); },
        clear: function () { keys().forEach(function (k) { real.removeItem(pre + k); }); snap(); },
        key: function (i) { var ks = keys(); return ks[i] === undefined ? null : ks[i]; }
      };
      var proxy = new Proxy({}, {
        get: function (t, p) {
          if (typeof p === 'symbol') return p === Symbol.toStringTag ? 'Storage' : undefined;
          if (p === 'length') return keys().length;
          if (Object.prototype.hasOwnProperty.call(api, p)) return api[p];
          var v = api.getItem(p); return v === null ? undefined : v;
        },
        set: function (t, p, v) { api.setItem(String(p), v); return true; },
        deleteProperty: function (t, p) { api.removeItem(String(p)); return true; },
        has: function (t, p) { return Object.prototype.hasOwnProperty.call(api, p) || (typeof p === 'string' && api.getItem(p) !== null); },
        ownKeys: function () { return keys(); },
        getOwnPropertyDescriptor: function (t, p) { if (typeof p === 'string' && api.getItem(p) !== null) return { value: api.getItem(p), enumerable: true, configurable: true, writable: true }; }
      });
      stores[name] = { api: api, proxy: proxy, keys: keys, real: real, pre: pre };
      return proxy;
    }
    var snapTimer = null;
    function dump(n) { var o = {}, s = stores[n]; s.keys().forEach(function (k) { o[k] = s.api.getItem(k); }); return o; }
    function snap() {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(function () { send({ type: 'storage', local: dump('localStorage'), session: dump('sessionStorage') }); }, 20);
    }
    var L = makeStore('localStorage', 'jt-ls:'), S = makeStore('sessionStorage', 'jt-ss:');
    function def(name, val) {
      try { Object.defineProperty(win, name, { configurable: true, get: function () { return val; } }); }
      catch (e) { try { delete win[name]; Object.defineProperty(win, name, { configurable: true, get: function () { return val; } }); } catch (e2) { /* ignorar */ } }
    }
    def('localStorage', L); def('sessionStorage', S);
    snap();

    /* Simula que OTRA pestaña modifica el almacenamiento: dispara el evento 'storage' */
    win.simularOtraPestana = function (clave, valor, area) {
      var name = area === 'session' ? 'sessionStorage' : 'localStorage', s = stores[name];
      var old = s.api.getItem(clave), nuevo = valor === undefined || valor === null ? null : String(valor);
      if (nuevo === null) s.real.removeItem(s.pre + clave); else s.real.setItem(s.pre + clave, nuevo);
      snap();
      var ev = new win.StorageEvent('storage', { key: clave, oldValue: old, newValue: nuevo, url: win.location.href });
      Object.defineProperty(ev, 'storageArea', { value: s.proxy });
      setTimeout(function () { win.dispatchEvent(ev); }, 30);
    };

    /* ---------- servidor de práctica (reemplaza a mockAPI.io) ---------- */
    var HOST = 'https://mock.xidecode.dev';
    function svg(w, h, body) { return 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + body + '</svg>'); }
    function cover(t, c1, c2) {
      return svg(120, 170, '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="120" height="170" rx="6" fill="url(#g)"/><rect x="10" y="12" width="6" height="146" fill="rgba(0,0,0,.18)"/><text x="64" y="86" font-family="Segoe UI,Arial" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">' + t + '</text><text x="64" y="150" font-family="Segoe UI,Arial" font-size="9" fill="rgba(255,255,255,.8)" text-anchor="middle">Xidecode</text>');
    }
    function scene(c1, c2, shape) { return svg(320, 180, '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/>' + shape); }
    var seed = function () {
      return {
        books: [
          { id: '1', title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', description: 'Un recorrido moderno por el lenguaje: funciones, objetos, DOM y programación asíncrona.', image: cover('Eloquent JS', '#e5c07b', '#c0763a') },
          { id: '2', title: 'Java 8 en acción', author: 'Raoul-Gabriel Urma', description: 'Expresiones lambda, streams y programación funcional con Java.', image: cover('Java 8', '#61afef', '#3b4a9b') },
          { id: '3', title: 'Secrets of the JavaScript Ninja', author: 'John Resig', description: 'Técnicas avanzadas escritas por el creador de jQuery.', image: cover('JS Ninja', '#c678dd', '#4b2a7a') },
          { id: '4', title: 'Node.js en acción', author: 'Mike Cantelon', description: 'Construye aplicaciones de servidor con JavaScript.', image: cover('Node.js', '#98c379', '#2f6b3a') }
        ],
        cities: [
          { id: '1', name: 'París', image: scene('#f6c1a6', '#6a7fb3', '<rect x="150" y="40" width="14" height="120" fill="#2b2f3a"/><polygon points="157,20 140,160 174,160" fill="#2b2f3a"/><rect y="150" width="320" height="30" fill="#3d4258"/>'), description: 'París es la capital de Francia, famosa por la Torre Eiffel y sus museos.' },
          { id: '2', name: 'Tokio', image: scene('#ffb3c7', '#5b4a9c', '<circle cx="250" cy="55" r="26" fill="#ffe1ea"/><rect x="40" y="90" width="30" height="90" fill="#2a2640"/><rect x="80" y="70" width="36" height="110" fill="#352f52"/><rect x="126" y="100" width="28" height="80" fill="#2a2640"/>'), description: 'Tokio mezcla tradición y tecnología: templos antiguos junto a rascacielos.' },
          { id: '3', name: 'San Salvador', image: scene('#8fd3f4', '#2f8f6b', '<polygon points="60,160 150,50 240,160" fill="#2a6f55"/><polygon points="140,160 220,80 300,160" fill="#33805f"/><circle cx="260" cy="40" r="20" fill="#ffe08a"/>'), description: 'San Salvador esta rodeada de volcanes y es la capital de El Salvador.' },
          { id: '4', name: 'Roma', image: scene('#ffd9a0', '#b4553a', '<rect x="60" y="80" width="200" height="80" rx="40" fill="#8a3f2b"/><rect x="90" y="100" width="22" height="60" fill="#ffd9a0"/><rect x="149" y="100" width="22" height="60" fill="#ffd9a0"/><rect x="208" y="100" width="22" height="60" fill="#ffd9a0"/>'), description: 'Roma conserva el Coliseo y el Foro, testigos de más de 2000 años de historia.' }
        ],
        users: [
          { id: '1', name: 'Ana López', email: 'ana@correo.com', age: 22, city: 'San Salvador' },
          { id: '2', name: 'Luis Pérez', email: 'luis@correo.com', age: 31, city: 'Santa Ana' },
          { id: '3', name: 'Marta Díaz', email: 'marta@correo.com', age: 27, city: 'San Miguel' },
          { id: '4', name: 'Carlos Ruiz', email: 'carlos@correo.com', age: 19, city: 'Soyapango' },
          { id: '5', name: 'Sofía Mena', email: 'sofia@correo.com', age: 35, city: 'Antiguo Cuscatlán' }
        ],
        todos: [
          { id: '1', title: 'Estudiar JSON', done: true }, { id: '2', title: 'Practicar AJAX', done: false },
          { id: '3', title: 'Aprender jQuery', done: false }, { id: '4', title: 'Crear un componente Angular', done: false },
          { id: '5', title: 'Repasar localStorage', done: true }, { id: '6', title: 'Entregar la guía', done: false }
        ]
      };
    };
    var DB; try { DB = P.__jtMockDB = P.__jtMockDB || seed(); } catch (e) { DB = seed(); }
    win.__jtMockReset = function () { try { P.__jtMockDB = seed(); DB = P.__jtMockDB; } catch (e) { DB = seed(); } };

    var FILES = {
      '/noticias.html': '<h3>Últimas noticias</h3><ul><li>Nueva versión de JavaScript publicada</li><li>Curso de jQuery disponible</li><li>Angular alcanza nuevas funciones</li></ul>',
      '/saludo.txt': 'Hola desde el servidor de práctica de Xidecode',
      '/datos.json': '{"curso":"Desarrollo de Aplicaciones Web","guia":9,"tema":"AJAX"}',
      '/inicio.html': '<h2>Inicio</h2><p>Bienvenido al sitio de práctica. Este contenido se cargó con AJAX sin recargar la página.</p>',
      '/contacto.html': '<h2>Contacto</h2><p>Escríbenos a <b>hola@xidecode.dev</b>.</p>',
      '/acerca.html': '<h2>Acerca de</h2><p>Un sitio pequeño para practicar peticiones asíncronas.</p>'
    };
    function parseQuery(q) {
      var o = {}; if (!q) return o;
      q.split('&').forEach(function (p) { if (!p) return; var kv = p.split('='); o[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
      return o;
    }
    function handle(method, url, body, headers) {
      url = String(url);
      var abs = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
      if (abs && url.indexOf(HOST) !== 0) return { network: true, delay: 500 };
      var path = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^\/]+/i, ''), qs = '';
      var qi = path.indexOf('?'); if (qi >= 0) { qs = path.slice(qi + 1).split('#')[0]; path = path.slice(0, qi); }
      path = path.split('#')[0].replace(/^(\.\/)+/, '').replace(/\/+$/, '');
      path = path.replace(/^(\.\.\/)+/, '');
      if (path.charAt(0) !== '/') path = '/' + path;
      path = path.replace(/^\/api(?=\/)/, '');
      var js = { 'content-type': 'application/json; charset=utf-8' };
      function ok(data, status, delay, hd) { return { status: status || 200, statusText: status === 201 ? 'Created' : 'OK', body: typeof data === 'string' ? data : JSON.stringify(data), headers: hd || js, delay: delay == null ? 350 : delay }; }
      function err(status, text, msg) { return { status: status, statusText: text, body: JSON.stringify({ error: msg || text }), headers: js, delay: 250 }; }
      if (path === '/lento') return { status: 200, statusText: 'OK', body: 'Respuesta lenta (tardó 2.5 segundos)', headers: { 'content-type': 'text/plain; charset=utf-8' }, delay: 2500 };
      if (path === '/error500') return err(500, 'Internal Server Error', 'Algo falló en el servidor');
      if (FILES[path] !== undefined && method === 'GET') {
        var isH = /\.html$/.test(path), isJ = /\.json$/.test(path);
        return { status: 200, statusText: 'OK', body: FILES[path], headers: { 'content-type': isH ? 'text/html; charset=utf-8' : isJ ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'x-servidor': 'xidecode' }, delay: 300 };
      }
      var m = /^\/([a-z]+)(?:\/([^\/]+))?$/.exec(path);
      if (!m || !DB[m[1]]) return err(404, 'Not Found', 'No existe el recurso ' + path + '. Recursos disponibles: /books, /cities, /users, /todos');
      var col = DB[m[1]], id = m[2];
      function ctype() { return String((headers && headers['content-type']) || '').toLowerCase(); }
      function parseBody() {
        if (body == null) return {};
        if (typeof body === 'string') {
          if (ctype().indexOf('json') >= 0 || /^\s*[{\[]/.test(body)) { try { return JSON.parse(body); } catch (e) { return { __bad: true }; } }
          return parseQuery(body);
        }
        if (win.FormData && body instanceof win.FormData) { var o = {}; body.forEach(function (v, k) { o[k] = v; }); return o; }
        if (win.URLSearchParams && body instanceof win.URLSearchParams) return parseQuery(body.toString());
        return {};
      }
      var i;
      if (method === 'GET' || method === 'HEAD') {
        if (id) { for (i = 0; i < col.length; i++) if (col[i].id === id) return ok(col[i]); return err(404, 'Not Found', 'No existe ' + m[1] + ' con id ' + id); }
        var q = parseQuery(qs), out = col.slice();
        Object.keys(q).forEach(function (k) {
          if (k === '_limit') out = out.slice(0, +q[k]);
          else if (k === 'search') out = out.filter(function (r) { return JSON.stringify(r).toLowerCase().indexOf(q[k].toLowerCase()) >= 0; });
          else out = out.filter(function (r) { return String(r[k]) === q[k]; });
        });
        return ok(out);
      }
      if (method === 'POST') {
        if (id) return err(404, 'Not Found', 'POST se hace sobre /' + m[1] + ' (sin id)');
        var data = parseBody(); if (data.__bad) return err(400, 'Bad Request', 'El cuerpo no es JSON válido');
        var max = 0; col.forEach(function (r) { max = Math.max(max, +r.id || 0); });
        var item = { id: String(max + 1) }; Object.keys(data).forEach(function (k) { if (k !== 'id') item[k] = data[k]; });
        col.push(item); return ok(item, 201);
      }
      if (method === 'PUT' || method === 'PATCH') {
        if (!id) return err(404, 'Not Found', method + ' necesita un id: /' + m[1] + '/1');
        var d2 = parseBody();
        for (i = 0; i < col.length; i++) if (col[i].id === id) { Object.keys(d2).forEach(function (k) { if (k !== 'id') col[i][k] = d2[k]; }); return ok(col[i]); }
        return err(404, 'Not Found', 'No existe ' + m[1] + ' con id ' + id);
      }
      if (method === 'DELETE') {
        if (!id) return err(404, 'Not Found', 'DELETE necesita un id: /' + m[1] + '/1');
        for (i = 0; i < col.length; i++) if (col[i].id === id) { var rem = col.splice(i, 1)[0]; return ok(rem); }
        return err(404, 'Not Found', 'No existe ' + m[1] + ' con id ' + id);
      }
      return err(405, 'Method Not Allowed', 'Método ' + method + ' no permitido');
    }

    /* XMLHttpRequest simulado, con los 5 estados reales */
    function MockXHR() {
      this.readyState = 0; this.status = 0; this.statusText = ''; this.responseText = ''; this.response = ''; this.responseXML = null;
      this.responseURL = ''; this.responseType = ''; this.timeout = 0; this.withCredentials = false;
      this._h = {}; this._rh = {}; this._ls = {}; this._state = 'new'; this.upload = {};
    }
    ['UNSENT', 'OPENED', 'HEADERS_RECEIVED', 'LOADING', 'DONE'].forEach(function (n, i) { MockXHR[n] = i; MockXHR.prototype[n] = i; });
    var X = MockXHR.prototype;
    X.addEventListener = function (t, f) { (this._ls[t] = this._ls[t] || []).push(f); };
    X.removeEventListener = function (t, f) { var a = this._ls[t] || []; var i = a.indexOf(f); if (i >= 0) a.splice(i, 1); };
    X._fire = function (t) {
      var ev = { type: t, target: this, currentTarget: this, lengthComputable: false, loaded: this.responseText.length, total: this.responseText.length };
      var h = this['on' + t]; if (typeof h === 'function') { try { h.call(this, ev); } catch (e) { setTimeout(function () { throw e; }); } }
      (this._ls[t] || []).slice().forEach(function (f) { try { f.call(this, ev); } catch (e) { setTimeout(function () { throw e; }); } }, this);
    };
    X.open = function (method, url, async) {
      if (arguments.length < 2) throw new TypeError("Failed to execute 'open' on 'XMLHttpRequest': 2 arguments required, but only " + arguments.length + " present.");
      this._m = String(method).toUpperCase(); this._u = String(url); this._async = async !== false; this._state = 'opened'; this._h = {}; this._rh = {};
      this.readyState = 1; this.status = 0; this.statusText = ''; this.responseText = ''; this.response = '';
      this._fire('readystatechange');
    };
    X.setRequestHeader = function (k, v) {
      if (this.readyState !== 1 || this._state === 'sent') throw new win.DOMException("Failed to execute 'setRequestHeader' on 'XMLHttpRequest': The object's state must be OPENED.", 'InvalidStateError');
      this._h[String(k).toLowerCase()] = String(v);
    };
    X.overrideMimeType = function () { };
    X.getResponseHeader = function (k) { var v = this._rh[String(k).toLowerCase()]; return v === undefined || this.readyState < 2 ? null : v; };
    X.getAllResponseHeaders = function () { if (this.readyState < 2) return ''; var s = ''; for (var k in this._rh) s += k + ': ' + this._rh[k] + '\r\n'; return s; };
    X.abort = function () { if (this._state === 'sent') { this._state = 'aborted'; clearTimeout(this._t1); clearTimeout(this._t2); clearTimeout(this._t3); this.readyState = 0; this.status = 0; this._fire('abort'); this._fire('loadend'); } };
    X.send = function (body) {
      if (this.readyState !== 1 || this._state !== 'opened') throw new win.DOMException("Failed to execute 'send' on 'XMLHttpRequest': The object's state must be OPENED.", 'InvalidStateError');
      var self = this; this._state = 'sent';
      var res = handle(this._m, this._u, body, this._h);
      function apply() {
        self.status = res.status; self.statusText = res.statusText; self._rh = res.headers || {}; self.responseURL = self._u;
        self.responseText = res.body; self.response = res.body;
        if (self.responseType === 'json') { try { self.response = JSON.parse(res.body); } catch (e) { self.response = null; } }
      }
      if (res.network) {
        var failNow = function () { self._state = 'done'; self.readyState = 4; self.status = 0; self._fire('readystatechange'); self._fire('error'); self._fire('loadend'); };
        if (!this._async) { failNow(); return; }
        this._t1 = setTimeout(failNow, res.delay); return;
      }
      function finish() { apply(); self._state = 'done'; self.readyState = 4; self._fire('readystatechange'); self._fire('load'); self._fire('loadend'); }
      if (!this._async) { apply(); this.readyState = 2; this._fire('readystatechange'); this.readyState = 3; this._fire('readystatechange'); this._state = 'done'; this.readyState = 4; this._fire('readystatechange'); this._fire('load'); this._fire('loadend'); return; }
      this._fire('loadstart');
      this._t1 = setTimeout(function () { self.readyState = 2; self.status = res.status; self.statusText = res.statusText; self._rh = res.headers || {}; self._fire('readystatechange'); }, Math.min(80, res.delay / 3));
      this._t2 = setTimeout(function () { self.readyState = 3; self.responseText = res.body.slice(0, Math.floor(res.body.length / 2)); self._fire('readystatechange'); }, Math.min(160, res.delay / 1.6));
      this._t3 = setTimeout(finish, res.delay);
      if (this.timeout > 0 && this.timeout < res.delay) {
        clearTimeout(this._t3);
        this._t3 = setTimeout(function () { self._state = 'done'; self.readyState = 4; self.status = 0; self._fire('readystatechange'); self._fire('timeout'); self._fire('loadend'); }, this.timeout);
      }
    };
    win.XMLHttpRequest = MockXHR;

    /* fetch simulado */
    win.fetch = function (url, opts) {
      opts = opts || {};
      var method = String(opts.method || (url && url.method) || 'GET').toUpperCase();
      var u = url && url.url ? url.url : String(url), hd = {};
      var h = opts.headers || {}; if (h && typeof h.forEach === 'function' && !Array.isArray(h)) h.forEach(function (v, k) { hd[String(k).toLowerCase()] = v; }); else Object.keys(h).forEach(function (k) { hd[k.toLowerCase()] = h[k]; });
      return new Promise(function (resolve, reject) {
        var res = handle(method, u, opts.body, hd);
        setTimeout(function () {
          if (res.network) { reject(new TypeError('Failed to fetch')); return; }
          var body = (res.status === 204 || res.status === 304) ? null : res.body;
          try { resolve(new win.Response(body, { status: res.status, statusText: res.statusText, headers: res.headers })); } catch (e) { reject(e); }
        }, res.delay);
      });
    };

    send({ type: 'ready' });
  };
})();
