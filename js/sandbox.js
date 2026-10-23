/* js-trick :: arma el documento que se muestra en la "pantalla" (iframe) y recibe sus mensajes */
(function () {
  var JT = window.JT;

  var BASE_CSS = 'html,body{margin:0}body{font:15px/1.5 "Segoe UI",system-ui,-apple-system,Roboto,Arial,sans-serif;color:#1f2430;background:#fff;padding:14px}' +
    'button,input,select,textarea{font:inherit}button{padding:6px 12px;cursor:pointer;border:1px solid #9aa3b5;background:#f3f5f9;border-radius:6px}button:hover{background:#e6eaf2}' +
    'input[type=text],input[type=number],input[type=password],input[type=email],select,textarea{padding:6px 8px;border:1px solid #b6bdcc;border-radius:5px}' +
    'table{border-collapse:collapse}th,td{border:1px solid #ccd2de;padding:5px 10px;text-align:left}th{background:#eef1f7}h1,h2,h3{margin:.4em 0}';

  function safeScript(code) { return code.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--'); }
  function fnSrc(fn) { return safeScript('(' + fn.toString() + ')(window);'); }

  /* devuelve { html, offsets } */
  JT.buildDoc = function (spec) {
    if (spec.kind === 'termdoc') return { html: spec.html, info: {} };
    var f = spec.files || {}, kind = spec.kind || 'web', head = '', body = '', info = {};
    head += '<meta charset="utf-8"><style>' + BASE_CSS + '</style>';
    if (f.css) head += '<style>' + f.css.replace(/<\/style/gi, '<\\/style') + '</style>';
    head += '<script>' + fnSrc(JT.libs.prelude) + '<\/script>';
    if (spec.lib === 'jq') head += '<script>' + fnSrc(JT.libs.jq) + '<\/script>';
    if (kind === 'ng') {
      head += '<script>' + fnSrc(JT.libs.ng) + '<\/script>';
      var tsAll = (f.ts || '') + (f.mod ? '\n' + f.mod : ''), tr;
      try { tr = JT.ng.transform(tsAll); } catch (e) { tr = { js: '' }; }
      info.tsLines = (f.ts || '').split('\n').length;
      body = '<div id="__root"></div>';
      body += '<script>(function(){var s=document.createElement("script");s.text=' + safeScript(JSON.stringify(tr.js + '\n//# sourceURL=usuario.js')) + ';document.body.appendChild(s);' +
        'if(window.__jtHadError)return;try{__ng.start(' + safeScript(JSON.stringify(f.html || '')) + ');}catch(e){window.parent.postMessage({jt:1,type:"error",name:e.name,message:e.message,line:0,ng:true},"*");console.error(e.name+": "+e.message);}})();<\/script>';
    } else {
      body = (f.html || '') + '\n<script>(function(){var s=document.createElement("script");s.text=' + safeScript(JSON.stringify((f.js || '') + '\n//# sourceURL=usuario.js')) + ';document.body.appendChild(s);})();<\/script>';
    }
    return { html: '<!DOCTYPE html><html lang="es"><head>' + head + '</head><body>' + body + '</body></html>', info: info };
  };

  /* ---------- control del iframe ---------- */
  function Sandbox(iframe, onMsg) {
    var self = this;
    this.iframe = iframe; this.onMsg = onMsg; this.spec = null; this.info = {};
    this.handler = function (e) {
      if (!e.data || e.data.jt !== 1 || e.source !== iframe.contentWindow) return;
      self.onMsg && self.onMsg(e.data, self);
    };
    window.addEventListener('message', this.handler);
  }
  Sandbox.prototype.run = function (spec) {
    var d = JT.buildDoc(spec);
    this.spec = spec; this.info = d.info;
    this.iframe.srcdoc = d.html;
  };
  Sandbox.prototype.blank = function () { this.iframe.srcdoc = '<!DOCTYPE html><html><body style="margin:0;background:#12141a"></body></html>'; };
  Sandbox.prototype.destroy = function () { window.removeEventListener('message', this.handler); };
  JT.Sandbox = Sandbox;
})();
