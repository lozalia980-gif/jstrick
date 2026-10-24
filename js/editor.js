/* Xidecode :: editor de código con resaltado, números de línea y boton "?" por línea */
(function () {
  var JT = window.JT;

  function Editor(root, opts) {
    var self = this;
    this.opts = opts || {};
    this.order = this.opts.order || ['html', 'css', 'js'];
    this.files = {};
    this.active = this.order[0];
    this.errors = {};
    this.hot = {};
    this.lineCount = 0;
    root.innerHTML =
      '<div class="editor">' +
      '<div class="ed-top"><div class="ed-tabs" style="display:flex;gap:6px;flex-wrap:wrap"></div><div class="ed-tools"></div></div>' +
      '<div class="ed-body"><div class="ed-gutter"></div><div class="ed-main"><pre class="ed-hl" aria-hidden="true"></pre><textarea class="ed-ta" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off"></textarea></div></div>' +
      '<div class="ed-foot"><span class="ed-pos">Ln 1, Col 1</span><span class="chips"></span></div>' +
      '</div>';
    this.el = root.firstChild;
    this.tabsEl = root.querySelector('.ed-tabs');
    this.toolsEl = root.querySelector('.ed-tools');
    this.gutter = root.querySelector('.ed-gutter');
    this.hl = root.querySelector('.ed-hl');
    this.ta = root.querySelector('.ed-ta');
    this.body = root.querySelector('.ed-body');
    this.pos = root.querySelector('.ed-pos');
    this.chips = root.querySelector('.chips');

    this.tabsEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (b) self.setActive(b.getAttribute('data-f'));
    });
    this.gutter.addEventListener('click', function (e) {
      var b = e.target.closest('.qb'); if (!b) return;
      var n = +b.getAttribute('data-n');
      self.opts.onHelp && self.opts.onHelp({ file: self.active, line: n, text: (self.files[self.active] || '').split('\n')[n - 1] || '' });
    });
    this.chips.addEventListener('click', function (e) {
      var b = e.target.closest('[data-term]'); if (b) self.opts.onTerm && self.opts.onTerm(b.getAttribute('data-term'));
    });
    this.ta.addEventListener('input', function () {
      self.files[self.active] = self.ta.value;
      self.refresh();
      self.opts.onChange && self.opts.onChange(self.files, self.active);
    });
    this.ta.addEventListener('scroll', function () {
      self.hl.scrollTop = self.ta.scrollTop; self.hl.scrollLeft = self.ta.scrollLeft; self.gutter.scrollTop = self.ta.scrollTop;
    });
    ['keyup', 'click', 'focus'].forEach(function (ev) { self.ta.addEventListener(ev, function () { self.updateCursor(); }); });
    this.ta.addEventListener('keydown', function (e) {
      if (self.ta.readOnly) return;
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
      } else if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        var v = self.ta.value, s = self.ta.selectionStart, ls = v.lastIndexOf('\n', s - 1) + 1, cur = v.slice(ls, s);
        var indent = /^\s*/.exec(cur)[0], prev = v[s - 1], next = v[s];
        if (prev === '{' || prev === '[' || prev === '(') {
          e.preventDefault();
          var ins = '\n' + indent + '  ' + ((next === '}' || next === ']' || next === ')') ? '\n' + indent : '');
          document.execCommand('insertText', false, ins);
          if (ins.length > indent.length + 3) { var p = s + indent.length + 3; self.ta.setSelectionRange(p, p); }
        } else if (indent) { e.preventDefault(); document.execCommand('insertText', false, '\n' + indent); }
      }
    });
    if (this.opts.readOnly) this.ta.readOnly = true;
  }

  Editor.prototype.setFiles = function (files, active) {
    var self = this;
    this.files = {}; this.order.forEach(function (k) { self.files[k] = files[k] != null ? files[k] : ''; });
    if (active && this.order.indexOf(active) >= 0) this.active = active;
    this.renderTabs(); this.load();
  };
  Editor.prototype.getFiles = function () { return Object.assign({}, this.files); };
  Editor.prototype.setActive = function (f) {
    if (this.order.indexOf(f) < 0) return;
    this.active = f; this.renderTabs(); this.load();
    this.opts.onTab && this.opts.onTab(f);
  };
  Editor.prototype.renderTabs = function () {
    var self = this;
    this.tabsEl.innerHTML = this.order.map(function (k) {
      var bad = (self.errors[k] || []).length;
      return '<button class="ed-tab' + (k === self.active ? ' on' : '') + (bad ? ' hasbad' : '') + '" data-f="' + k + '"><span class="d" style="background:' + JT.FILE_COLOR[k] + '"></span>' + JT.esc(JT.FILE_EXT[k]) + '<span class="bad"></span></button>';
    }).join('');
  };
  Editor.prototype.load = function () {
    this.ta.value = this.files[this.active] || '';
    this.lineCount = 0;
    this.refresh();
    this.ta.scrollTop = 0; this.ta.scrollLeft = 0;
  };
  Editor.prototype.refresh = function () {
    var code = this.ta.value, lines = JT.highlightLines(code, this.active), bad = {}, hot = this.hot[this.active] || {};
    (this.errors[this.active] || []).forEach(function (n) { bad[n] = 1; });
    this.hl.innerHTML = lines.map(function (h, i) { return '<div class="l' + (bad[i + 1] ? ' bad' : '') + (hot[i + 1] ? ' hot' : '') + '">' + (h || '') + '</div>'; }).join('');
    var n = lines.length;
    if (n !== this.lineCount) {
      var g = '';
      for (var i = 1; i <= n; i++) g += '<div class="ed-g" data-n="' + i + '"><button class="qb" data-n="' + i + '" title="Qué hace esta línea?" aria-label="Que hace la línea ' + i + '">?</button><span>' + i + '</span></div>';
      this.gutter.innerHTML = g; this.lineCount = n;
    }
    var gs = this.gutter.children;
    for (var k = 0; k < gs.length; k++) gs[k].classList.toggle('bad', !!bad[k + 1]);
    var h = Math.max(220, Math.min(560, n * 20 + 28));
    if (!this.opts.fixedHeight) this.body.style.setProperty('--edh', h + 'px');
    this.hl.scrollTop = this.ta.scrollTop; this.gutter.scrollTop = this.ta.scrollTop;
    this.updateCursor();
    if (this.opts.onTerms) this.setTerms(JT.termsIn(code, this.active));
  };
  Editor.prototype.updateCursor = function () {
    var v = this.ta.value, s = this.ta.selectionStart, before = v.slice(0, s), ln = before.split('\n').length, col = s - before.lastIndexOf('\n');
    this.pos.textContent = 'Ln ' + ln + ', Col ' + col;
    var gs = this.gutter.children;
    for (var i = 0; i < gs.length; i++) gs[i].classList.toggle('cur', i === ln - 1);
  };
  Editor.prototype.setErrors = function (map) {
    this.errors = map || {};
    this.renderTabs(); this.refresh();
  };
  Editor.prototype.setTerms = function (keys) {
    this.chips.innerHTML = keys.length ? '<span style="margin-right:2px">Consulta:</span>' + keys.slice(0, 14).map(function (k) { return '<button class="chip" data-term="' + JT.esc(k) + '">' + JT.esc(k) + '<i>?</i></button>'; }).join('') : '';
  };
  Editor.prototype.flash = function (file, from, to) {
    if (file && file !== this.active) this.setActive(file);
    var h = this.hot[this.active] = {}, self = this;
    for (var i = from; i <= to; i++) h[i] = 1;
    this.refresh();
    var y = Math.max(0, (from - 3) * 20); this.ta.scrollTop = y;
    clearTimeout(this._ft); this._ft = setTimeout(function () { self.hot = {}; self.refresh(); }, 2300);
  };
  Editor.prototype.setReadOnly = function (b) { this.ta.readOnly = !!b; };
  Editor.prototype.focus = function () { this.ta.focus(); };
  JT.Editor = Editor;
})();
