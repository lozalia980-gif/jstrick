/* js-trick :: revisor de código en tiempo real.
   Detecta errores de sintaxis y de logica comunes y los explica en espanol (por que esta mal y que escribir en su lugar). */
(function () {
  var JT = window.JT;
  var esc = JT.esc;

  /* ---------- utilidades ---------- */
  function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }
  function maskJS(src) {
    return src.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\[\s\S]|[^`\\])*`/g, function (m) {
      var q = m[0] === '"' || m[0] === "'" || m[0] === '`' ? m[0] : null;
      if (q) return q + m.slice(1, -1).replace(/[^\n]/g, ' ') + (m.length > 1 ? q : '');
      return m.replace(/[^\n]/g, ' ');
    });
  }
  JT.maskJS = maskJS;
  function I(sev, file, line, title, msg, fix, code) { return { sev: sev, file: file, line: line || 0, title: title, msg: msg, fix: fix || '', code: code || '' }; }
  var q = function (s) { return '<code>' + esc(s) + '</code>'; };

  var HTML_TAGS = 'a abbr address article aside audio b blockquote body br button canvas caption code col colgroup dd details div dl dt em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 head header hr html i iframe img input label legend li link main mark meta nav ol optgroup option p pre progress script section select small source span strong style sub summary sup table tbody td template textarea tfoot th thead title tr u ul video svg path circle rect line g polyline polygon text defs'.split(' ');
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1 };
  var OPTIONAL_END = { li: 1, p: 1, td: 1, th: 1, tr: 1, thead: 1, tbody: 1, tfoot: 1, option: 1, dt: 1, dd: 1, body: 1, html: 1, head: 1, colgroup: 1 };

  /* ---------- balance de paréntesis, llaves y comillas ---------- */
  JT.checkBrackets = function (code, file, lang) { return checkBrackets(code, file, lang); };
  function checkBrackets(code, file, lang) {
    var issues = [], stack = [], i = 0, n = code.length, line = 1, last = null;
    var pairs = { ')': '(', ']': '[', '}': '{' }, closer = { '(': ')', '[': ']', '{': '}' };
    var css = lang === 'css';
    while (i < n) {
      var ch = code[i], nx = code[i + 1];
      if (ch === '\n') { line++; i++; continue; }
      if (ch === '/' && nx === '*') { var e = code.indexOf('*/', i + 2); var seg = e < 0 ? code.slice(i) : code.slice(i, e + 2); line += (seg.match(/\n/g) || []).length; if (e < 0) { issues.push(I('error', file, line, 'Comentario sin cerrar', 'Abriste un comentario con ' + q('/*') + ' y nunca lo cerraste con ' + q('*/') + '. Todo lo que sigue queda comentado.', 'Agrega ' + q('*/') + ' al final del comentario.')); } i += seg.length; continue; }
      if (!css && ch === '/' && nx === '/') { var nl = code.indexOf('\n', i); i = nl < 0 ? n : nl; continue; }
      if (ch === '"' || ch === "'" || ch === '`') {
        var start = line, j = i + 1, closed = false;
        while (j < n) {
          if (code[j] === '\\') { j += 2; continue; }
          if (code[j] === '\n') { if (ch === '`') { line++; j++; continue; } break; }
          if (code[j] === ch) { closed = true; break; }
          j++;
        }
        if (!closed) {
          issues.push(I('error', file, start, 'Comillas sin cerrar', 'Abriste ' + q(ch) + ' en la línea ' + start + ' pero no la cerraste' + (ch === '`' ? '.' : ' antes de terminar la línea.'), 'Cierra el texto con la misma comilla: ' + q(ch) + '. Si el texto lleva comillas adentro, usa el otro tipo de comilla (ejemplo: ' + q('"Hola \'amigo\'"') + ').'));
          if (ch === '`') { i = n; break; }
          i = j; continue;
        }
        i = j + 1; continue;
      }
      if (!css && ch === '/') {
        var okRx = !last || /[(,=:\[!&|?{};+\-*%<>~^]/.test(last);
        if (okRx) { var rm = /^\/(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\/\\\n\[])+\/[a-z]*/.exec(code.slice(i)); if (rm) { i += rm[0].length; last = ')'; continue; } }
      }
      if (ch === '(' || ch === '[' || ch === '{') stack.push({ ch: ch, line: line });
      else if (ch === ')' || ch === ']' || ch === '}') {
        var top = stack[stack.length - 1];
        if (!top) issues.push(I('error', file, line, 'Sobra un ' + ch, 'Hay un ' + q(ch) + ' en la línea ' + line + ' que no cierra nada: no hay ningún ' + q(pairs[ch]) + ' abierto.', 'Borra ese ' + q(ch) + ' o revisa si te falta abrir un ' + q(pairs[ch]) + ' antes.'));
        else if (top.ch !== pairs[ch]) {
          issues.push(I('error', file, line, 'Cierre equivocado: ' + ch, 'En la línea ' + line + ' pusiste ' + q(ch) + ' pero se esperaba ' + q(closer[top.ch]) + ' para cerrar el ' + q(top.ch) + ' que abriste en la línea ' + top.line + '.', 'Cierra primero lo último que abriste: reemplaza o agrega ' + q(closer[top.ch]) + '.'));
          stack.pop();
        } else stack.pop();
      }
      if (!/\s/.test(ch)) last = ch;
      i++;
    }
    stack.slice(-2).reverse().forEach(function (o) {
      issues.push(I('error', file, o.line, 'Falta cerrar ' + o.ch, 'Abriste ' + q(o.ch) + ' en la línea ' + o.line + ' y nunca lo cerraste.', 'Agrega ' + q(closer[o.ch]) + ' donde termina ese bloque' + (o.ch === '{' ? ' (casi siempre al final de la función, if o bucle).' : o.ch === '(' ? ' (por ejemplo, al final de la llamada a la función).' : '.')));
    });
    return issues;
  }

  /* ---------- sintaxis JS: traduccion de mensajes del motor ---------- */
  function translateSyntax(msg, ctx) {
    var m;
    msg = String(msg || '').replace(/^Uncaught\s+/, '').replace(/^SyntaxError:\s*/, '');
    if (/Unexpected end of input/.test(msg)) return { title: 'El código termina antes de tiempo', msg: 'JavaScript llegó al final del archivo y todavía esperaba algo: casi siempre falta cerrar un ' + q('(') + ', ' + q('{') + ', ' + q('[') + ' o unas comillas.', fix: 'Cuenta las aperturas y los cierres de cada par ( ) { } [ ] y verifica que cada función termine con su ' + q('}') + '.' };
    if (/missing \) after argument list/.test(msg)) return { title: 'Falta un paréntesis o una coma', msg: 'Dentro de una llamada a una función (por ejemplo ' + q('console.log(...)') + ') falta cerrar con ' + q(')') + ' o falta una coma o un ' + q('+') + ' entre los valores.', fix: 'Para unir textos con variables usa ' + q('"Hola " + nombre') + '; para separar argumentos usa comas: ' + q('suma(2, 3)') + '.' };
    if ((m = /Unexpected token '(.+)'/.exec(msg)) || (m = /Unexpected token (.+)/.exec(msg))) {
      var t = m[1];
      var extra = { '}': 'Sobra una llave de cierre, o falta algo antes de ella.', ')': 'Sobra un paréntesis de cierre, o falta un valor antes de él.', ']': 'Sobra un corchete de cierre.', 'else': q('else') + ' solo puede ir justo después de un ' + q('if') + ' (sin otra instrucción en medio).', '=>': 'La flecha ' + q('=>') + ' necesita parámetros a su izquierda: ' + q('(x) => x * 2') + '.', ':': 'Los dos puntos van dentro de un objeto ' + q('{ clave: valor }') + ' o en un ' + q('case') + '; aquí aparecen sueltos.', '.': 'Hay un punto sin nada antes o después.', ',': 'Hay una coma de más o falta un valor entre comas.', ';': 'Hay un punto y coma donde no corresponde (por ejemplo, dentro de los paréntesis de un if o de una llamada).', '-': 'Las claves con guion (como ' + q('font-weight') + ') deben ir entre comillas: ' + q("'font-weight'") + ', o usar camelCase: ' + q('fontWeight') + '.' };
      return { title: 'Símbolo inesperado: ' + t, msg: 'JavaScript encontró ' + q(t) + ' en un lugar donde no lo espera. ' + (extra[t] || 'Suele significar que falta una coma, un punto y coma o un operador antes, o que hay un símbolo de más.'), fix: 'Mira la línea indicada y también la anterior: un símbolo olvidado en la línea de arriba suele mostrarse como error en la siguiente.' };
    }
    if (/Unexpected identifier/.test(msg)) { var w = (/'(.+)'/.exec(msg) || [])[1]; return { title: 'Palabra suelta' + (w ? ': ' + w : ''), msg: 'Apareció una palabra' + (w ? ' (' + q(w) + ')' : '') + ' sin que nada la conecte con lo anterior. Casi siempre falta una coma (en listas u objetos), un ' + q('+') + ' (al unir textos), un punto y coma, o una palabra clave como ' + q('const') + '/' + q('function') + ' está mal escrita.', fix: 'Revisa la línea anterior: ¿termina con ; , o + segun corresponda? Ejemplo para unir texto: ' + q('"Hola " + nombre') + '.' }; }
    if (/Unexpected string/.test(msg)) return { title: 'Un texto aparece sin conectarse', msg: 'Hay un texto entre comillas pegado a otro valor sin operador. JavaScript no sabe como unirlos.', fix: 'Une con ' + q('+') + ' (' + q('"a" + b') + '), separa con coma si están en una lista/llamada, o termina la instrucción anterior con ' + q(';') + '.' };
    if (/Unexpected number/.test(msg)) return { title: 'Un número aparece sin conectarse', msg: 'Hay un número pegado a otro valor sin operador ni coma.', fix: 'Agrega una coma o un operador (' + q('+ - * /') + ') entre los dos valores.' };
    if (/Invalid or unexpected token/.test(msg)) return { title: 'Carácter no válido', msg: 'Hay un carácter que JavaScript no entiende. Lo más común: comillas curvas ' + q('\u201c \u201d \u2018 \u2019') + ' (copiadas de Word o PDF), o comillas sin cerrar.', fix: 'Reemplaza las comillas por comillas rectas ' + q('"') + ' o ' + q("'") + ' y verifica que cada una tenga su pareja.' };
    if ((m = /Identifier '(.+)' has already been declared/.exec(msg))) return { title: 'Declaraste ' + m[1] + ' dos veces', msg: 'Usaste ' + q('let') + ' o ' + q('const') + ' con el nombre ' + q(m[1]) + ' más de una vez en el mismo lugar.', fix: 'Para cambiar el valor de una variable existente escribe solo ' + q(m[1] + ' = nuevoValor;') + ' (sin let/const), o usa otro nombre.' };
    if (/Missing initializer in const declaration/.test(msg)) return { title: 'const necesita un valor', msg: 'Una constante se declara con su valor al mismo tiempo.', fix: 'Escribe ' + q('const x = 5;') + ' (con el = y el valor). Si el valor cambiara luego, usa ' + q('let') + '.' };
    if (/Illegal return statement/.test(msg)) return { title: 'return fuera de una función', msg: q('return') + ' solo se puede usar dentro de una función.', fix: 'Mete ese return dentro de ' + q('function nombre() { ... }') + ' o elimina la línea.' };
    if (/await is only valid|Unexpected reserved word/.test(msg)) return { title: 'await fuera de una función async', msg: q('await') + ' solo funciona dentro de una función declarada como ' + q('async') + '.', fix: 'Declara la función así: ' + q('async function nombre() { ... }') + '.' };
    if (/Invalid left-hand side in assignment/.test(msg)) return { title: 'Asignación invalida', msg: 'A la izquierda del ' + q('=') + ' debe ir una variable o una propiedad (por ejemplo ' + q('x = 5') + '). Quizá quisiste comparar con ' + q('==') + ' o ' + q('===') + '.', fix: 'Si querias comparar usa ' + q('===') + '; si querias asignar, pon la variable a la izquierda.' };
    if (/Unterminated template literal/.test(msg)) return { title: 'Plantilla sin cerrar', msg: 'Abriste un texto con acento grave ' + q('`') + ' y no lo cerraste.', fix: 'Agrega la comilla invertida ' + q('`') + ' al final.' };
    if (/Illegal (break|continue)/.test(msg)) return { title: 'break/continue fuera de un bucle', msg: q('break') + ' y ' + q('continue') + ' solo existen dentro de un bucle (for, while) o de un switch.', fix: 'Quita esa línea o colocala dentro del bucle.' };
    return { title: 'Error de sintaxis', msg: 'El navegador no puede leer esta línea: ' + q(msg), fix: 'Revisa paréntesis, llaves, comillas, comas y puntos y coma cerca de la línea indicada.' };
  }
  JT.translateSyntax = translateSyntax;

  function syntaxIssue(code, file) {
    try { new Function(code); return null; } catch (e) {
      if (!(e instanceof SyntaxError)) return null;
      var tr = translateSyntax(e.message), lines = code.split('\n'), ln = 0;
      if (!/Unexpected end of input/.test(e.message)) {
        for (var k = 1; k <= lines.length; k++) {
          var pre = lines.slice(0, k).join('\n');
          try { new Function(pre); } catch (e2) { if (e2 instanceof SyntaxError && !/Unexpected end of input|missing \) after argument list/.test(e2.message) || (e2 instanceof SyntaxError && k === lines.length)) { ln = k; break; } }
        }
      }
      return I('error', file, ln, tr.title, tr.msg, tr.fix);
    }
  }

  /* ---------- HTML ---------- */
  function lintHTML(html, file, opts) {
    var issues = [], stack = [], ids = {};
    var re = /<!--[\s\S]*?-->|<\/([A-Za-z][\w:-]*)\s*>|<([A-Za-z][\w:-]*)((?:\s+[^\s=>\/"']+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|<([A-Za-z][\w:-]*)[^>]*$/g, m;
    var masked = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, function (x) { return x.replace(/[^\n]/g, ' '); });
    var custom = opts && opts.ng;
    while ((m = re.exec(masked))) {
      var line = lineOf(masked, m.index);
      if (m[0].indexOf('<!--') === 0) continue;
      if (m[5]) { issues.push(I('error', file, line, 'Etiqueta mal cerrada: <' + m[5] + '>', 'La etiqueta ' + q('<' + m[5]) + ' de la línea ' + line + ' no termina con ' + q('>') + ' (o tiene comillas sin cerrar en un atributo).', 'Revisa que cada atributo tenga la forma ' + q('nombre="valor"') + ' (con las dos comillas) y que la etiqueta cierre con ' + q('>') + '.')); continue; }
      if (m[2]) {
        var tag = m[2].toLowerCase();
        if (!custom && HTML_TAGS.indexOf(tag) < 0 && tag.indexOf('-') < 0) {
          var sug = JT.closest(tag, HTML_TAGS, 1);
          issues.push(I('warn', file, line, 'Etiqueta desconocida: <' + tag + '>', 'HTML no tiene una etiqueta llamada ' + q('<' + tag + '>') + '.' + (sug ? ' Quizá quisiste escribir ' + q('<' + sug + '>') + '.' : ''), sug ? 'Cambia ' + q('<' + tag + '>') + ' por ' + q('<' + sug + '>') + ' (y su cierre también).' : 'Revisa la ortografía de la etiqueta.'));
        }
        var idm = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(m[3] || '');
        if (idm) { var idv = idm[1] || idm[2]; if (ids[idv]) issues.push(I('warn', file, line, 'id repetido: ' + idv, 'El id ' + q(idv) + ' ya se uso en la línea ' + ids[idv] + '. Un id debe ser único en la página, si no getElementById siempre devolvera el primero.', 'Cambia uno de los dos ids, o usa class si necesitas repetirlo.')); else ids[idv] = line; }
        if (!m[4] && !VOID[tag]) stack.push({ tag: tag, line: line });
      } else if (m[1]) {
        var cl = m[1].toLowerCase(), pos = -1;
        for (var k = stack.length - 1; k >= 0; k--) if (stack[k].tag === cl) { pos = k; break; }
        if (VOID[cl]) continue;
        if (pos < 0) issues.push(I('error', file, line, 'Sobra </' + cl + '>', 'Cerraste ' + q('</' + cl + '>') + ' en la línea ' + line + ' pero no hay ninguna ' + q('<' + cl + '>') + ' abierta.', 'Borra ese cierre o agrega la etiqueta de apertura que falta.'));
        else {
          for (var z = stack.length - 1; z > pos; z--) if (!OPTIONAL_END[stack[z].tag]) issues.push(I('error', file, stack[z].line, 'Falta cerrar <' + stack[z].tag + '>', 'La etiqueta ' + q('<' + stack[z].tag + '>') + ' de la línea ' + stack[z].line + ' no se cerro antes de ' + q('</' + cl + '>') + ' (línea ' + line + ').', 'Agrega ' + q('</' + stack[z].tag + '>') + ' antes de ' + q('</' + cl + '>') + '. Las etiquetas se cierran en orden inverso a como se abren.'));
          stack.length = pos;
        }
      }
    }
    stack.forEach(function (s) { if (!OPTIONAL_END[s.tag]) issues.push(I('error', file, s.line, 'Falta cerrar <' + s.tag + '>', 'La etiqueta ' + q('<' + s.tag + '>') + ' de la línea ' + s.line + ' nunca se cerro.', 'Agrega ' + q('</' + s.tag + '>') + ' donde termina su contenido.')); });
    return { issues: issues, ids: Object.keys(ids) };
  }

  /* ---------- CSS ---------- */
  var CSS_PROPS = 'align-content align-items align-self animation animation-delay animation-duration animation-name background background-attachment background-clip background-color background-image background-position background-repeat background-size border border-bottom border-bottom-color border-bottom-left-radius border-bottom-right-radius border-bottom-style border-bottom-width border-collapse border-color border-left border-radius border-right border-spacing border-style border-top border-top-left-radius border-top-right-radius border-width bottom box-shadow box-sizing clear color column-gap content cursor display filter flex flex-basis flex-direction flex-flow flex-grow flex-shrink flex-wrap float font font-family font-size font-style font-weight gap grid grid-area grid-column grid-gap grid-row grid-template-areas grid-template-columns grid-template-rows height justify-content justify-items left letter-spacing line-height list-style list-style-type margin margin-bottom margin-left margin-right margin-top max-height max-width min-height min-width object-fit opacity order outline outline-offset overflow overflow-x overflow-y padding padding-bottom padding-left padding-right padding-top place-items pointer-events position resize right row-gap text-align text-decoration text-indent text-overflow text-shadow text-transform top transform transform-origin transition transition-delay transition-duration transition-property transition-timing-function user-select vertical-align visibility white-space width word-break word-wrap z-index'.split(' ');
  var UNITLESS_PROPS = { 'line-height': 1, opacity: 1, 'z-index': 1, 'flex-grow': 1, 'flex-shrink': 1, flex: 1, order: 1, 'font-weight': 1, 'animation-iteration-count': 1, 'column-count': 1, 'grid-row': 1, 'grid-column': 1, 'grid-area': 1 };
  var LENGTH_PROPS = /^(width|height|min-width|max-width|min-height|max-height|margin|margin-(top|bottom|left|right)|padding|padding-(top|bottom|left|right)|top|bottom|left|right|font-size|border-radius|gap|letter-spacing|border-width|text-indent)$/;
  function lintCSS(css, file) {
    var issues = checkBrackets(css, file, 'css');
    if (issues.length) return issues;
    var re = /\{([^{}]*)\}/g, m;
    while ((m = re.exec(css))) {
      var body = m[1], base = m.index + 1, offset = 0;
      var stmts = body.split(';');
      stmts.forEach(function (st) {
        var startIdx = base + offset; offset += st.length + 1;
        var t = st.replace(/\/\*[\s\S]*?\*\//g, '').trim(); if (!t) return;
        var line = lineOf(css, startIdx + (st.length - st.trimLeft().length));
        var colon = t.indexOf(':');
        if (colon < 0) { issues.push(I('error', file, line, 'Falta ":" en la declaración', 'La línea ' + q(t.split('\n')[0].trim()) + ' no tiene dos puntos. En CSS cada declaración es ' + q('propiedad: valor;') + '.', 'Escribe por ejemplo ' + q('color: red;') + '.')); return; }
        if (/\n\s*[\w-]+\s*:/.test(t.slice(colon))) { issues.push(I('error', file, line, 'Falta ";" entre declaraciones', 'Dos declaraciones quedaron juntas: ' + q(t.split('\n')[0].trim()) + ' no termina con punto y coma, por eso la siguiente se ignora.', 'Agrega ' + q(';') + ' al final de cada declaración.')); return; }
        var prop = t.slice(0, colon).trim().toLowerCase(), val = t.slice(colon + 1).trim();
        if (!/^--/.test(prop) && CSS_PROPS.indexOf(prop) < 0 && !/^(-webkit-|-moz-)/.test(prop)) {
          var sug = JT.closest(prop, CSS_PROPS, 2);
          issues.push(I('error', file, line, 'Propiedad desconocida: ' + prop, 'CSS no tiene una propiedad llamada ' + q(prop) + '.' + (sug ? ' Quizá quisiste escribir ' + q(sug) + '.' : ''), sug ? 'Cambia ' + q(prop) + ' por ' + q(sug) + '.' : 'Revisa la ortografía y recuerda que las propiedades llevan guion (ej: ' + q('background-color') + '), no mayúsculas.'));
        } else if (val === '') issues.push(I('error', file, line, 'Falta el valor de ' + prop, 'La propiedad ' + q(prop) + ' no tiene valor.', 'Escribe algo después de los dos puntos: ' + q(prop + ': ...;')));
        else {
          var bareNum = val.split(/\s+/).filter(function (tk) { return /^-?\d*\.?\d+$/.test(tk) && parseFloat(tk) !== 0; })[0];
          if (LENGTH_PROPS.test(prop) && bareNum && !UNITLESS_PROPS[prop]) issues.push(I('warn', file, line, 'Falta la unidad en ' + prop, 'El valor ' + q(bareNum) + ' es un número sin unidad. CSS ignora los números sin unidad (excepto el 0).', 'Agrega la unidad: ' + q(bareNum + 'px') + ' (o em, rem, %).'));
          var hx = /#([0-9a-fA-F]+)\b/.exec(val);
          if (hx && [3, 4, 6, 8].indexOf(hx[1].length) < 0) issues.push(I('warn', file, line, 'Color hexadecimal incompleto', q('#' + hx[1]) + ' no es un color válido: debe tener 3 o 6 digitos (ej: ' + q('#fff') + ' o ' + q('#ff8800') + ').', 'Completa los digitos del color.'));
        }
      });
    }
    return issues;
  }

  /* ---------- llamadas con argumentos ---------- */
  function callArgs(masked, orig, openIdx) {
    var d = 0, args = [], cur = '', i = openIdx, curStart = openIdx + 1;
    for (; i < masked.length; i++) {
      var c = masked[i];
      if (c === '(' || c === '[' || c === '{') { d++; if (d === 1) { curStart = i + 1; continue; } }
      if (c === ')' || c === ']' || c === '}') { d--; if (d === 0) { var t = orig.slice(curStart, i).trim(); if (t || args.length) args.push(t); return { args: args, end: i }; } }
      if (c === ',' && d === 1) { args.push(orig.slice(curStart, i).trim()); curStart = i + 1; }
    }
    return null;
  }

  var KNOWN = 'getElementById getElementsByTagName getElementsByClassName getElementsByName querySelector querySelectorAll addEventListener removeEventListener createElement appendChild removeChild setAttribute getAttribute removeAttribute innerHTML textContent innerText className classList parentNode firstChild lastChild nextSibling previousSibling insertBefore replaceChild cloneNode preventDefault stopPropagation currentTarget getItem setItem removeItem stringify forEach indexOf lastIndexOf includes reduce toString toFixed parseInt parseFloat charAt charCodeAt toUpperCase toLowerCase startsWith endsWith hasOwnProperty setRequestHeader getResponseHeader getAllResponseHeaders onreadystatechange readyState responseText responseXML responseType statusText onload onerror setTimeout setInterval clearTimeout clearInterval getBoundingClientRect scrollTop offsetWidth offsetHeight insertAdjacentHTML selectedIndex toISOString toLocaleString getFullYear getMonth getDate getHours attachEvent'.split(' ');
  var KNOWN_LC = {}; KNOWN.forEach(function (k) { KNOWN_LC[k.toLowerCase()] = k; });
  var JQ_METHODS = 'ready each map get eq first last index find children parent parents closest siblings next prev filter not is has add slice html text val attr removeAttr prop data addClass removeClass toggleClass hasClass css width height innerWidth innerHeight outerWidth outerHeight offset position scrollTop append prepend after before appendTo prependTo remove empty clone wrap on one off bind unbind delegate trigger click dblclick mouseover mouseout mouseenter mouseleave mousedown mouseup mousemove focus blur change keyup keydown keypress submit resize scroll select input hover load show hide toggle fadeIn fadeOut fadeToggle fadeTo slideDown slideUp slideToggle animate delay stop finish serialize serializeArray size toArray end detach contextmenu replaceWith wrapAll unwrap insertAfter insertBefore nextAll prevAll contents queue dequeue focusin focusout'.split(' ');
  var JS_COMMON = 'push pop shift unshift splice slice join split indexOf includes forEach map filter reduce find some every sort reverse concat toString toFixed trim replace match substring substr startsWith endsWith repeat keys values entries assign then catch finally json text length call apply bind charAt toUpperCase toLowerCase test exec padStart padEnd toLocaleString floor ceil round'.split(' ');
  var NS_MEMBERS = {
    JSON: ['parse', 'stringify'], localStorage: ['getItem', 'setItem', 'removeItem', 'clear', 'key'], sessionStorage: ['getItem', 'setItem', 'removeItem', 'clear', 'key'],
    Math: ['abs', 'ceil', 'floor', 'round', 'max', 'min', 'pow', 'sqrt', 'random', 'trunc', 'sign', 'PI', 'E', 'sin', 'cos', 'tan', 'log', 'exp', 'cbrt', 'hypot'],
    console: ['log', 'warn', 'error', 'info', 'debug', 'table', 'clear', 'assert', 'group', 'groupEnd', 'time', 'timeEnd', 'dir', 'count', 'trace']
  };

  /* ---------- JavaScript: reglas de logica ---------- */
  function lintJS(js, file, ctx) {
    var out = [], mk = maskJS(js);
    function each(re, cb, src) { var m, s = src || mk; re.lastIndex = 0; while ((m = re.exec(s))) { cb(m, lineOf(s, m.index)); if (m[0] === '') re.lastIndex++; } }

    each(/\b(if|while)\s*\(([^()]*?)(?<![=!<>])=(?![=>])([^()]*?)\)/g, function (m, ln) {
      out.push(I('error', file, ln, 'Usaste = dentro de ' + m[1], 'En ' + q(m[1] + ' (' + (m[2] + '=' + m[3]).trim() + ')') + ' escribiste un solo ' + q('=') + ', que ASIGNA un valor en vez de comparar. Siempre dara verdadero (o el valor asignado).', 'Para comparar usa ' + q('==') + ' o mejor ' + q('===') + ': ' + q(m[1] + ' (' + m[2].trim() + ' === ' + m[3].trim() + ')') + '.'));
    });
    each(/\bgetElementById\s*\(\s*(['"])#([^'"]+)\1/g, function (m, ln) {
      out.push(I('error', file, ln, 'getElementById no lleva #', 'Escribiste ' + q('getElementById("#' + m[2] + '")') + '. getElementById busca por el nombre del id tal cual; el símbolo # solo se usa en selectores CSS (querySelector o jQuery).', 'Usa ' + q('getElementById("' + m[2] + '")') + ' o ' + q('querySelector("#' + m[2] + '")') + '.'));
    }, js);
    each(/\.length\s*\(/g, function (m, ln) { out.push(I('error', file, ln, 'length no es una función', q('length') + ' es una propiedad: se escribe sin paréntesis.', 'Cambia ' + q('.length()') + ' por ' + q('.length') + '.')); });
    each(/[{,]\s*([a-z]+(?:-[a-z]+)+)\s*:/g, function (m, ln) {
      var camel = m[1].replace(/-([a-z])/g, function (x, c) { return c.toUpperCase(); });
      out.push(I('error', file, ln, 'Clave con guion sin comillas', 'En un objeto de JavaScript ' + q(m[1]) + ' se lee como ' + q(m[1].split('-')[0] + ' - ' + m[1].split('-').slice(1).join('-')) + ' (una resta), no como un nombre.', 'Ponla entre comillas ' + q("'" + m[1] + "'") + ' o usa camelCase: ' + q(camel) + '.'));
    });
    each(/addEventListener\s*\(\s*(['"])on([a-z]+)\1/g, function (m, ln) { out.push(I('error', file, ln, 'El evento no lleva "on"', 'Con addEventListener el nombre del evento va sin ' + q('on') + ': ' + q(m[2]) + ', no ' + q('on' + m[2]) + '.', 'Escribe ' + q('addEventListener("' + m[2] + '", función)') + '.')); }, js);
    each(/(?:\.on(?:click|change|mouseover|mouseout|keyup|keydown|submit|load|input)\s*=\s*([A-Za-z_$][\w$.]*)\s*\(\s*\)\s*[;\n])|(?:addEventListener\s*\(\s*['"][a-z]+['"]\s*,\s*([A-Za-z_$][\w$.]*)\s*\(\s*\)\s*[,)])/g, function (m, ln) {
      var f = m[1] || m[2];
      out.push(I('warn', file, ln, 'Estas ejecutando ' + f + ' en vez de pasarla', 'Escribir ' + q(f + '()') + ' EJECUTA la función ahora mismo y guarda lo que devuelve. El evento necesita la función sin paréntesis.', 'Escribe ' + q(f) + ' (sin paréntesis) o envuelvela: ' + q('function(){ ' + f + '(); }') + '.'));
    });
    each(/=\s*XMLHttpRequest\s*\(/g, function (m, ln) { out.push(I('error', file, ln, 'Falta new', 'Para crear un objeto XMLHttpRequest hay que usar ' + q('new') + ' (es un constructor).', 'Escribe ' + q('var xhr = new XMLHttpRequest();') + '.')); });
    each(/\b(while\s*\(\s*(?:true|1)\s*\)|for\s*\(\s*;\s*;\s*\))/g, function (m, ln) {
      var rest = mk.slice(m.index + m[0].length);
      if (!/\b(break|return)\b/.test(rest.slice(0, 600))) out.push(I('error', file, ln, 'Bucle infinito', 'El bucle ' + q(m[1]) + ' nunca termina porque no hay ningún ' + q('break') + ' ni ' + q('return') + '. Congelaria la pantalla, por eso NO lo ejecuto.', 'Agrega una condición que se vuelva falsa, o un ' + q('break') + ' dentro del bucle.'));
    });
    /* JSON.parse con objeto o con texto inválido */
    each(/\bJSON\s*\.\s*parse\s*\(/g, function (m, ln) {
      var ca = callArgs(mk, js, m.index + m[0].length - 1); if (!ca) return;
      var a = (ca.args[0] || '').trim();
      if (!a) { out.push(I('error', file, ln, 'JSON.parse sin argumento', q('JSON.parse()') + ' necesita el texto que va a convertir.', 'Escribe ' + q('JSON.parse(texto)') + '.')); return; }
      if (/^[{\[]/.test(a)) { out.push(I('error', file, ln, 'JSON.parse espera TEXTO', 'Le pasaste un objeto/arreglo directamente. ' + q('JSON.parse') + ' convierte un texto JSON en objeto, no un objeto en objeto.', 'Si ya tienes el objeto, usalo sin parse. Si querias un texto, ponlo entre comillas: ' + q("JSON.parse('{\"a\":1}')") + '.')); return; }
      if (/^(['"])(?:\\.|(?!\1)[^\\\n])*\1$/.test(a)) {
        var s; try { s = new Function('return ' + a)(); } catch (e) { return; }
        try { JSON.parse(s); } catch (e2) { out.push(I('error', file, ln, 'Ese texto no es JSON válido', 'El texto que le pasas a ' + q('JSON.parse') + ' no cumple el formato JSON (' + esc(jsonWhy(s)) + ').', 'En JSON: las claves y los textos van con <b>comillas dobles</b>, no se permiten comillas simples, comas finales ni comentarios. Ejemplo: ' + q('{"nombre":"Ana","edad":20}') + '.', a)); }
      }
    });
    each(/\bJSON\s*\.\s*stringify\s*\(/g, function (m, ln) {
      var ca = callArgs(mk, js, m.index + m[0].length - 1); if (!ca) return;
      if (!ca.args.length) out.push(I('error', file, ln, 'JSON.stringify sin argumento', q('JSON.stringify()') + ' necesita el objeto que va a convertir en texto.', 'Escribe ' + q('JSON.stringify(objeto)') + '.'));
      if (ca.args.length > 3) out.push(I('error', file, ln, 'Demasiados argumentos', q('JSON.stringify') + ' recibe maximo 3: (objeto, reemplazador, separador).', 'Ejemplo: ' + q('JSON.stringify(obj, null, 2)') + '.'));
    });
    /* storage */
    var objVars = {};
    each(/\b(?:var|let|const)\s+([\w$]+)\s*=\s*(?:\{|\[|new\s+(?:Object|Array)\b)/g, function (m) { objVars[m[1]] = 1; });
    each(/\b(localStorage|sessionStorage)\s*\.\s*(setItem|getItem|removeItem|key)\s*\(/g, function (m, ln) {
      var ca = callArgs(mk, js, m.index + m[0].length - 1); if (!ca) return;
      var n = ca.args.length;
      if (m[2] === 'setItem') {
        if (n < 2) out.push(I('error', file, ln, 'setItem necesita clave y valor', q(m[1] + '.setItem(' + (ca.args[0] || '') + ')') + ' recibió ' + n + ' argumento(s), pero necesita 2: el nombre (clave) y el valor a guardar.', 'Escribe ' + q(m[1] + ".setItem('clave', valor)") + '.'));
        else if (n > 2) out.push(I('warn', file, ln, 'setItem recibe solo 2 argumentos', 'Pasaste ' + n + ' argumentos. Solo se usan la clave y el valor; el resto se ignora.', 'Si quieres guardar varios datos, usa un objeto con ' + q('JSON.stringify') + '.'));
        else {
          var v = ca.args[1];
          if (/^[{\[]/.test(v) || objVars[v]) out.push(I('warn', file, ln, 'Vas a guardar "[object Object]"', 'Web Storage solo guarda TEXTO. Al guardar un objeto o arreglo directamente se convierte en ' + q('[object Object]') + ' y pierdes los datos.', 'Convierte primero a texto: ' + q(m[1] + ".setItem('" + (ca.args[0] || 'clave').replace(/['"]/g, '') + "', JSON.stringify(" + v + '))') + '.'));
        }
      } else if (n < 1) out.push(I('error', file, ln, m[2] + ' necesita la clave', q(m[1] + '.' + m[2] + '()') + ' necesita el nombre (clave) del dato' + (m[2] === 'key' ? ' (o el número de posición)' : '') + '.', 'Ejemplo: ' + q(m[1] + '.' + m[2] + "('clave')") + '.'));
      else if (n > 1 && m[2] !== 'key') out.push(I('warn', file, ln, m[2] + ' recibe solo la clave', q(m[2]) + ' solo usa un argumento: la clave. El segundo no hace nada.', 'Quita el argumento extra.'));
    });
    /* orden de XMLHttpRequest */
    var xv = {};
    each(/\b([\w$]+)\s*\.\s*(open|send)\s*\(/g, function (m, ln) { var o = xv[m[1]] = xv[m[1]] || {}; if (o[m[2]] === undefined) o[m[2]] = { idx: m.index, ln: ln }; });
    Object.keys(xv).forEach(function (v) {
      var o = xv[v]; if (!o.open || !o.send) return;
      if (!/new\s+XMLHttpRequest|XMLHttpRequest\s*\(/.test(mk)) return;
      if (o.send.idx < o.open.idx) out.push(I('error', file, o.send.ln, 'send() antes de open()', 'Llamaste ' + q(v + '.send()') + ' (línea ' + o.send.ln + ') antes de ' + q(v + '.open()') + ' (línea ' + o.open.ln + '). Primero se configura la petición con open y después se envia.', 'Orden correcto: ' + q('new XMLHttpRequest()') + ', ' + q('open') + ', (cabeceras), ' + q('send') + '.'));
    });
    each(/\b([\w$]+)\s*\.\s*open\s*\(/g, function (m, ln) {
      var ca = callArgs(mk, js, m.index + m[0].length - 1); if (!ca || !/XMLHttpRequest/.test(mk)) return;
      if (ca.args.length < 2) out.push(I('error', file, ln, 'open necesita método y URL', q(m[1] + '.open(' + ca.args.join(', ') + ')') + ' recibió ' + ca.args.length + ' argumento(s). Necesita al menos 2: el método HTTP y la URL.', 'Ejemplo: ' + q(m[1] + '.open("GET", url, true)') + '.'));
      else if (ca.args[0] && /^['"]/.test(ca.args[0]) && !/^['"](GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)['"]$/i.test(ca.args[0])) out.push(I('warn', file, ln, 'Método HTTP extrano', 'El método ' + q(ca.args[0]) + ' no es un método HTTP comun.', 'Usa ' + q('"GET"') + ' para pedir datos o ' + q('"POST"') + ' para enviarlos.'));
    });
    if (/readyState/.test(mk) && !/\bstatus\b/.test(mk) && /XMLHttpRequest/.test(mk) && !/onload/.test(mk)) out.push(I('info', file, 0, 'Falta comprobar status', 'Cuando readyState es 4 la petición terminó, pero eso no significa que salio bien: puede ser un 404 o un 500.', 'Comprueba también ' + q('xhr.status == 200') + ' antes de usar la respuesta.'));

    /* ids que no existen en el HTML */
    if (ctx && ctx.ids && ctx.html != null) {
      var seen = {};
      each(/\bgetElementById\s*\(\s*(['"])([^'"#]+)\1|\$\(\s*(['"])#([\w-]+)\3\s*\)|\bquerySelector(?:All)?\s*\(\s*(['"])#([\w-]+)\5\s*\)/g, function (m, ln) {
        var id = m[2] || m[4] || m[6]; if (seen[id] || ctx.ids.indexOf(id) >= 0) return; seen[id] = 1;
        if (new RegExp("id\\s*=\\s*[\\\\\"']{1,2}" + id + "|\\.id\\s*=\\s*['\"]" + id + "|attr\\(\\s*['\"]id['\"]\\s*,\\s*['\"]" + id + "|setAttribute\\(\\s*['\"]id['\"]\\s*,\\s*['\"]" + id).test(js)) return;
        var sug = JT.closest(id, ctx.ids, 3);
        out.push(I('error', file, ln, 'No existe el id "' + id + '" en tu HTML', 'Tu código busca un elemento con ' + q('id="' + id + '"') + ', pero en el HTML no hay ninguno. Buscarlo devolvera <b>null</b> y luego fallara cualquier cosa que hagas con el.', (sug ? 'Quizá quisiste escribir ' + q(sug) + '. ' : '') + (ctx.ids.length ? 'Los ids de tu HTML son: ' + ctx.ids.map(q).join(', ') + '.' : 'Tu HTML no tiene ningún elemento con id: agregalo, por ejemplo ' + q('<div id="' + id + '"></div>') + '.')));
      }, js);
    }

    /* errores de ortografía / mayúsculas en métodos conocidos */
    var defined = {};
    each(/\b(?:function\s+([\w$]+)|(?:var|let|const)\s+([\w$]+)|([\w$]+)\s*:|\.([\w$]+)\s*=(?!=)|\$\.fn\.([\w$]+)|class\s+([\w$]+))/g, function (m) { for (var i = 1; i < m.length; i++) if (m[i]) defined[m[i]] = 1; });
    var flagged = {};
    each(/\.\s*([A-Za-z_$][\w$]*)/g, function (m, ln) {
      var id = m[1]; if (flagged[id] || defined[id] || KNOWN.indexOf(id) >= 0 || JS_COMMON.indexOf(id) >= 0 || JQ_METHODS.indexOf(id) >= 0) return;
      var lc = id.toLowerCase();
      if (KNOWN_LC[lc] && KNOWN_LC[lc] !== id) { flagged[id] = 1; out.push(I('error', file, ln, 'Mayúsculas incorrectas: ' + id, 'JavaScript distingue mayúsculas de minúsculas. ' + q(id) + ' no existe; el nombre correcto es ' + q(KNOWN_LC[lc]) + '.', 'Cambia ' + q(id) + ' por ' + q(KNOWN_LC[lc]) + '.')); return; }
      if (id.length >= 7) { var near = JT.closest(id, KNOWN.concat(ctx && ctx.lib === 'jq' ? JQ_METHODS : []), 1); if (near && near !== id) { flagged[id] = 1; out.push(I('warn', file, ln, 'Posible error de escritura: ' + id, q(id) + ' no es un método conocido. ¿Quisiste escribir ' + q(near) + '?', 'Si era ' + q(near) + ', corrigelo; si es un método tuyo, ignora este aviso.')); } }
    });
    /* miembros inexistentes en objetos conocidos (JSON, Math, localStorage, ...) */
    each(/\b(JSON|Math|console|localStorage|sessionStorage)\s*\.\s*([A-Za-z_$][\w$]*)\s*(\()?/g, function (m, ln) {
      var ns = m[1], mem = m[2], list = NS_MEMBERS[ns];
      if (list.indexOf(mem) >= 0) return;
      if ((ns === 'localStorage' || ns === 'sessionStorage') && !m[3]) { if (mem === 'length') return; return; }
      if (flagged[mem]) return;
      var lc = mem.toLowerCase(), exact = list.filter(function (x) { return x.toLowerCase() === lc; })[0], near = exact || JT.closest(mem, list, 2);
      flagged[mem] = 1;
      out.push(I('error', file, ln, ns + '.' + mem + ' no existe', q(ns) + ' no tiene ' + (m[3] ? 'una función' : 'una propiedad') + ' llamada ' + q(mem) + '. Lo que si tiene: ' + list.slice(0, 8).map(q).join(', ') + '.', near ? 'Quizá quisiste escribir ' + q(ns + '.' + near) + '.' : 'Revisa que estes usando el objeto correcto para lo que quieres hacer.'));
    });
    /* métodos de jQuery encadenados */
    if (ctx && ctx.lib === 'jq') {
      var plugins = {}; ((ctx && ctx.plugins) || []).forEach(function (n) { plugins[n] = 1; }); each(/\$\.fn\.([\w$]+)|\.fn\.([\w$]+)\s*=|fn\.extend\s*\(\s*\{([\s\S]*?)\}\s*\)/g, function (m) { if (m[1]) plugins[m[1]] = 1; if (m[2]) plugins[m[2]] = 1; if (m[3]) m[3].replace(/([\w$]+)\s*:/g, function (a, b) { plugins[b] = 1; }); });
      var jqFlag = {};
      each(/(?:\$|jQuery)\s*\(/g, function (m, ln) {
        var ca = callArgs(mk, js, m.index + m[0].length - 1); if (!ca) return;
        var pos = ca.end + 1, guard = 0;
        while (guard++ < 30) {
          var mm = /^\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/.exec(mk.slice(pos)); if (!mm) break;
          var name = mm[1];
          if (!(JQ_METHODS.indexOf(name) >= 0 || JS_COMMON.indexOf(name) >= 0 || plugins[name] || jqFlag[name] || name === 'fn')) {
            jqFlag[name] = 1;
            var lc = name.toLowerCase(), exact = JQ_METHODS.filter(function (x) { return x.toLowerCase() === lc; })[0], near = exact || JT.closest(name, JQ_METHODS, 2);
            out.push(I('error', file, ln, 'jQuery no tiene ' + name + '()', 'El objeto jQuery no tiene un método llamado ' + q(name) + (exact ? ': jQuery distingue mayúsculas y el nombre correcto es ' + q(exact) + '.' : '.'), near ? 'Quizá quisiste escribir ' + q(near + '()') + '.' : 'Si ' + q(name) + ' es un plugin, debe estar definido antes con ' + q('$.fn.' + name + ' = function(){...}') + '. Si no, usa uno de los métodos de jQuery.'));
          }
          var c2 = callArgs(mk, js, pos + mm[0].length - 1); if (!c2) break;
          pos = c2.end + 1;
        }
      });
      each(/(?:\$|jQuery)\s*\(\s*(['"])([A-Za-z][\w-]*)\1\s*\)/g, function (m, ln) {
        if (HTML_TAGS.indexOf(m[2].toLowerCase()) >= 0) return;
        var hasId = ctx.ids && ctx.ids.indexOf(m[2]) >= 0;
        out.push(I('warn', file, ln, 'Falta # o . en el selector', 'El selector ' + q('"' + m[2] + '"') + ' busca etiquetas llamadas <' + m[2] + '>, que no existen. Para buscar por id se usa ' + q('#') + ' y por clase ' + q('.') + '.', hasId ? 'Escribe ' + q('$("#' + m[2] + '")') + '.' : 'Escribe ' + q('$("#' + m[2] + '")') + ' (id) o ' + q('$(".' + m[2] + '")') + ' (clase).'));
      }, js);
    }
    return out;
  }

  function jsonWhy(s) {
    var t = String(s);
    if (/'/.test(t) && !/"/.test(t)) return "usa comillas simples ' ' en vez de dobles \" \"";
    if (/,\s*[}\]]/.test(t)) return 'hay una coma sobrante antes de } o ]';
    if (/[{,]\s*[A-Za-z_]\w*\s*:/.test(t)) return 'hay claves sin comillas dobles (ej: nombre: en vez de "nombre":)';
    if (/\/\/|\/\*/.test(t)) return 'los comentarios no existen en JSON';
    if (/\bundefined\b/.test(t)) return 'undefined no existe en JSON (usa null)';
    try { JSON.parse(t); } catch (e) { return String(e.message).replace(/^JSON\.parse: /, ''); }
    return 'formato incorrecto';
  }
  JT.jsonWhy = jsonWhy;

  /* ---------- Angular ---------- */
  var NG_GLOBALS = { true: 1, false: 1, null: 1, undefined: 1, this: 1, $event: 1, Math: 1, JSON: 1, Number: 1, String: 1, Date: 1, Object: 1, Array: 1, parseInt: 1, parseFloat: 1, console: 1, typeof: 1, new: 1, in: 1, of: 1, let: 1, index: 1, first: 1, last: 1, even: 1, odd: 1, count: 1, else: 1, NaN: 1, Infinity: 1, window: 1, document: 1, alert: 1 };
  function exprIds(expr) {
    var e = expr.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, "''"), out = [], re = /(^|[^\w$.])([A-Za-z_$][\w$]*)/g, m;
    e = e.replace(/\|\s*[\w]+(\s*:\s*[^|]+)?/g, ' ');
    while ((m = re.exec(e))) out.push(m[2]);
    return out;
  }
  function lintNG(ts, html, mod, ctx) {
    var out = [];
    if (ts != null && !/@Component\s*\(/.test(maskJS(ts)) && /class\s+\w+/.test(ts)) out.push(I('error', 'ts', 0, 'Falta el decorador @Component', 'Una clase de Angular solo se convierte en componente cuando lleva encima ' + q('@Component({ selector: "...", template: "..." })') + '. Sin el decorador es una clase normal de TypeScript.', 'Agrega arriba de la clase: ' + q("@Component({ selector: 'app-root', templateUrl: './app.component.html' })") + '.'));
    if (!html) return out;
    var tsMask = ts ? maskJS(ts) : '', tsWords = {};
    (tsMask + ' ' + (ts || '')).replace(/[A-Za-z_$][\w$]*/g, function (w) { tsWords[w] = 1; });
    var refs = {}, locals = {};
    html.replace(/#([\w$]+)/g, function (m, n) { refs[n] = 1; });
    html.replace(/let\s+([\w$]+)\s*(?:of|=)/g, function (m, n) { locals[n] = 1; });
    html.replace(/let\s+[\w$]+\s*=\s*\w+\s*;\s*let\s+([\w$]+)\s*=/g, function (m, n) { locals[n] = 1; });
    html.replace(/;\s*let\s+([\w$]+)\s*=/g, function (m, n) { locals[n] = 1; });
    var seenId = {};
    function check(expr, idx, isStmt) {
      exprIds(expr).forEach(function (id) {
        if (NG_GLOBALS[id] || locals[id] || refs[id] || seenId[id]) return;
        if (!tsWords[id]) {
          seenId[id] = 1;
          var sug = JT.closest(id, Object.keys(tsWords).filter(function (w) { return !NG_GLOBALS[w]; }), 2);
          out.push(I('error', 'html', lineOf(html, idx), 'La plantilla usa "' + id + '" pero la clase no lo declara', 'En la plantilla escribiste ' + q(id) + ' dentro de ' + q(expr.trim()) + ', pero en la clase del componente no existe ninguna propiedad ni método con ese nombre.', (sug ? 'Quizá quisiste escribir ' + q(sug) + '. ' : '') + 'Declara ' + q(id) + ' en la clase del componente (por ejemplo ' + q(id + " = 'valor';") + ') o corrige el nombre en la plantilla.'));
        }
      });
    }
    var re = /\{\{([\s\S]*?)\}\}|\s(\[\(?[\w.-]+\)?\]|\([\w.-]+\)|\*ng\w+)\s*=\s*"([^"]*)"/gi, m;
    while ((m = re.exec(html))) {
      if (m[1] !== undefined) check(m[1], m.index);
      else {
        var name = m[2], val = m[3];
        if (/^\*ngfor$/i.test(name)) {
          if (name !== '*ngFor') out.push(I('error', 'html', lineOf(html, m.index), 'Es *ngFor (con F mayúscula)', 'Angular distingue mayúsculas: ' + q(name) + ' no es una directiva.', 'Escribe ' + q('*ngFor') + '.'));
          var fm = /^\s*let\s+([\w$]+)\s+of\s+(.+?)(;|$)/.exec(val);
          if (!fm) out.push(I('error', 'html', lineOf(html, m.index), 'Sintaxis incorrecta de *ngFor', 'Escribiste ' + q('*ngFor="' + val + '"') + '. La forma correcta es ' + q('*ngFor="let item of lista"') + ' (con ' + q('let') + ' y ' + q('of') + ').', 'Ejemplo: ' + q('<li *ngFor="let u of unidades">{{u}}</li>') + '.'));
          else check(fm[2], m.index);
        } else if (/^\*ngif$/i.test(name)) {
          if (name !== '*ngIf') out.push(I('error', 'html', lineOf(html, m.index), 'Es *ngIf (con I mayúscula)', 'Angular distingue mayúsculas: ' + q(name) + ' no es una directiva.', 'Escribe ' + q('*ngIf') + '.'));
          check(val.replace(/;\s*else.*$/, ''), m.index);
        } else if (/^\[\(ngmodel\)\]$/i.test(name)) {
          if (name !== '[(ngModel)]') out.push(I('error', 'html', lineOf(html, m.index), 'Es [(ngModel)] (con M mayúscula)', 'Angular distingue mayúsculas: ' + q(name) + ' no es una directiva.', 'Escribe ' + q('[(ngModel)]') + '.'));
          check(val, m.index);
        } else if (/^\(/.test(name)) {
          var evn = name.slice(1, -1);
          if (ctx.events.indexOf(evn) < 0 && ctx.events.indexOf(evn.toLowerCase()) < 0 && !/^ngSubmit$/.test(evn) && !(ctx.outputs && ctx.outputs.indexOf(evn) >= 0)) {
            var se = JT.closest(evn, ctx.events, 2);
            out.push(I('warn', 'html', lineOf(html, m.index), 'Evento desconocido: (' + evn + ')', 'No conozco el evento ' + q(evn) + '. Si es un evento propio de un componente hijo (@Output) puedes ignorar este aviso.', se ? 'Quizá quisiste escribir ' + q('(' + se + ')') + '.' : 'Eventos comunes: ' + ['click', 'change', 'input', 'keyup', 'submit', 'mouseover'].map(function (x) { return q('(' + x + ')'); }).join(', ') + '.'));
          }
          check(val, m.index, true);
        } else if (/^\[/.test(name)) check(val, m.index);
      }
    }
    if (/\[\(ngModel\)\]/.test(html) && mod != null && mod.trim() && !/imports\s*:\s*\[[^\]]*FormsModule/.test(maskJS(mod))) out.push(I('error', 'mod', 0, 'Falta importar FormsModule', 'La plantilla usa ' + q('[(ngModel)]') + ' pero el modulo no importa ' + q('FormsModule') + '. Sin el, Angular no reconoce ngModel y lanza el error "Can\'t bind to \'ngModel\'".', 'En app.module.ts agrega ' + q("import { FormsModule } from '@angular/forms';") + ' y ponlo dentro de ' + q('imports: [BrowserModule, FormsModule]') + '.'));
    html.replace(/<(input|select|textarea)\b[^>]*\[\(ngModel\)\][^>]*>/gi, function (tag, name, idx) {
      var before = html.slice(0, idx);
      var lastForm = before.lastIndexOf('<form'), lastEnd = before.lastIndexOf('</form');
      if (lastForm > lastEnd && !/\sname\s*=/.test(tag)) out.push(I('warn', 'html', lineOf(html, idx), 'Falta el atributo name', 'Dentro de un ' + q('<form>') + ', cada campo con ' + q('ngModel') + ' necesita un atributo ' + q('name') + ' para registrarse en el formulario.', 'Agrega por ejemplo ' + q('name="nombre"') + '.'));
      return tag;
    });
    return out;
  }

  /* ---------- entrada principal ---------- */
  var DOM_EVENTS = 'click dblclick change input keyup keydown keypress submit focus blur mouseover mouseout mouseenter mouseleave mousedown mouseup scroll select load ngSubmit contextmenu'.split(' ');
  JT.lint = function (spec) {
    if (spec.kind === 'term') return JT.lintLang(spec.lang, (spec.files || {})[spec.lang], { fragment: !!spec.fragment });
    var f = spec.files || {}, out = [], kind = spec.kind || 'web';
    var htmlRes = f.html != null ? lintHTML(f.html, 'html', { ng: kind === 'ng' }) : { issues: [], ids: [] };
    if (kind === 'ng') htmlRes.issues = htmlRes.issues.filter(function (x) { return x.title.indexOf('Etiqueta desconocida') < 0; });
    out = out.concat(htmlRes.issues);
    if (f.css) out = out.concat(lintCSS(f.css, 'css'));
    var ctx = { ids: htmlRes.ids, html: f.html, lib: spec.lib, plugins: spec.plugins };
    if (kind === 'ng') {
      var tsAll = (f.ts || '') + (f.mod ? '\n' + f.mod : ''), tsLines = (f.ts || '').split('\n').length;
      ['ts', 'mod'].forEach(function (name) {
        if (f[name] == null || !f[name].trim()) return;
        var br = checkBrackets(f[name], name, 'ts');
        out = out.concat(br);
      });
      if (!out.some(function (x) { return x.sev === 'error' && (x.file === 'ts' || x.file === 'mod'); })) {
        try {
          var tr = JT.ng.transform(tsAll);
          var si = syntaxIssue(tr.js, 'ts');
          if (si) {
            if (si.line > tsLines) { si.file = 'mod'; si.line -= tsLines + 1; }
            if (si.line > tsAll.split('\n').length + 1) si.line = 0;
            si.title = si.title + ' (TypeScript)';
            out.push(si);
          }
        } catch (e) { /* transformacion fallida: se reportara al ejecutar */ }
      }
      out = out.concat(lintNG(f.ts, f.html, f.mod, { events: DOM_EVENTS, outputs: (f.ts || '').match(/(\w+)\s*(?:=|:)\s*new\s+EventEmitter/g) ? (f.ts.match(/(\w+)\s*(?:=|:)[^;\n]*EventEmitter/g) || []).map(function (s) { return s.split(/\s|=|:/)[0]; }) : [] }));
    } else if (f.js != null && f.js.trim()) {
      var br2 = spec.noSyntax ? [] : checkBrackets(f.js, 'js', 'js');
      out = out.concat(br2);
      if (!br2.length && !spec.noSyntax) { var si2 = syntaxIssue(f.js, 'js'); if (si2) out.push(si2); }
      out = out.concat(lintJS(f.js, 'js', ctx));
    }
    /* ordenar: errores primero y sin duplicados */
    var seen = {}, rank = { error: 0, warn: 1, info: 2 };
    out = out.filter(function (x) { var k = x.sev + x.file + x.line + x.title; if (seen[k]) return false; seen[k] = 1; return true; });
    out.sort(function (a, b) { return rank[a.sev] - rank[b.sev] || (a.line || 999) - (b.line || 999); });
    /* ideas del ejemplo que el alumno quito */
    if (spec.original && !out.some(function (x) { return x.sev === 'error'; })) {
      var cur = {}, orig = {};
      ['js', 'ts', 'html'].forEach(function (k) { if (f[k] != null) JT.termsIn(f[k], k).forEach(function (t) { cur[t] = 1; }); if (spec.original[k] != null) JT.termsIn(spec.original[k], k).forEach(function (t) { orig[t] = 1; }); });
      var lost = Object.keys(orig).filter(function (t) { return !cur[t] && /^[\w$]+(\.[\w$]+)?$|^\.[\w]+$|^\*ng|^\[\(/.test(t) && JT.glossary[t] && JT.glossary[t].core; });
      if (lost.length) out.push(I('info', f.js != null ? 'js' : 'ts', 0, 'Quitaste una pieza clave del ejemplo', 'El ejemplo original usaba ' + lost.slice(0, 3).map(q).join(', ') + ' y ya no aparece en tu código. Es posible que el resultado cambie por completo.', 'Si fue a proposito, perfecto: sigue experimentando. Si no, usa "Restablecer" para volver al código original.'));
    }
    return out;
  };

  /* ---------- errores en ejecución ---------- */
  JT.explainRuntime = function (err, spec) {
    var msg = String(err.message || ''), name = err.name || '', f = (spec && spec.files) || {}, ids = [];
    if (f.html) lintHTML(f.html, 'html', { ng: true }).ids.forEach(function (i) { ids.push(i); });
    msg = msg.replace(/^Uncaught\s+/, '');
    var m, nm = /^(\w*Error):\s*(.*)$/.exec(msg); if (nm) { name = nm[1]; msg = nm[2]; }
    var idsHint = ids.length ? 'Los ids de tu HTML son: ' + ids.map(q).join(', ') + '.' : 'Tu HTML no tiene elementos con id.';
    if (/SyntaxError/.test(name) || /^Unexpected|^Invalid or unexpected|missing \)|Unexpected end/.test(msg)) { if (/JSON/.test(msg)) return jsonRuntime(msg); return translateSyntax(msg); }
    if (err.ng) {
      if ((m = /^(.+?) is not defined/.exec(msg))) return { title: 'La plantilla usa "' + m[1] + '" pero la clase no lo define', msg: 'Al pintar la plantilla, Angular no encontró ' + q(m[1]) + ' en el componente.', fix: 'Declara ' + q(m[1]) + ' como propiedad de la clase (ej: ' + q(m[1] + " = 'valor';") + ') o corrige el nombre.' };
      if (/NullInjectorError/.test(msg)) return { title: 'Angular no encuentra el servicio', msg: q(msg), fix: 'Revisa que la clase del servicio exista, tenga ' + q('@Injectable()') + ' y que el tipo del parámetro del constructor se llame igual.' };
      if (/could not be found/.test(msg)) return { title: 'Pipe desconocido', msg: q(msg), fix: 'Pipes disponibles en el simulador: json, uppercase, lowercase, titlecase, currency, number, percent, slice, date.' };
      if (/ngFor/.test(msg)) return { title: 'Problema con *ngFor', msg: esc(msg), fix: 'Usa ' + q('*ngFor="let item of lista"') + ' y asegurate de que ' + q('lista') + ' sea un arreglo.' };
      if (/NG8002/.test(msg)) return { title: 'Falta importar FormsModule', msg: 'La plantilla usa ' + q('[(ngModel)]') + ' pero el módulo no importa ' + q('FormsModule') + '. Angular no reconoce ngModel y lanza "Can\'t bind to \'ngModel\'".', fix: 'En el módulo agrega ' + q('import { FormsModule } from "@angular/forms";') + ' y ponlo en ' + q('imports: [BrowserModule, FormsModule]') + '.' };
      if (/NG0304/.test(msg)) return { title: 'Angular no reconoce esa etiqueta', msg: esc(msg), fix: 'Si es un componente, revisa que su ' + q('selector') + ' coincida con la etiqueta y que la clase esté en ' + q('declarations') + ' del módulo.' };
      if (/plantilla|template/i.test(msg)) return { title: 'Error de Angular', msg: esc(msg), fix: 'Revisa el módulo (declarations / imports) y los nombres del selector.' };
    }
    if ((m = /^([\w$]+) is not defined/.exec(msg))) {
      var id = m[1];
      if (id === '$' || id === 'jQuery') return { title: '"$" no existe en este ejemplo', msg: q('$') + ' es la función de <b>jQuery</b>. Este ejemplo usa JavaScript puro, así que ' + q('$') + ' no esta definido.', fix: 'Usa ' + q('document.getElementById("id")') + ' en lugar de ' + q('$("#id")') + '. (jQuery se estudia en las guias 10 y 11.)' };
      var decl = {}; ((f.js || f.ts || '')).replace(/\b(?:var|let|const|function|class)\s+([\w$]+)/g, function (a, b) { decl[b] = 1; });
      var cand = Object.keys(decl).concat(['console', 'document', 'window', 'localStorage', 'sessionStorage', 'JSON', 'Math', 'XMLHttpRequest', 'setTimeout', 'setInterval', 'parseInt', 'parseFloat', 'alert', 'fetch', 'Promise', 'Object', 'Array', 'String', 'Number']);
      var sug = JT.closest(id, cand, 2);
      return { title: 'No existe "' + id + '"', msg: 'Tu código usa ' + q(id) + ' pero esa variable o función no existe en ningún lado (no la declaraste, o la escribiste distinto).', fix: (sug ? 'Quizá quisiste escribir ' + q(sug) + '. ' : '') + 'Si es una variable, declara con ' + q('let ' + id + ' = ...;') + ' antes de usarla. Recuerda que JavaScript distingue mayúsculas de minúsculas.' };
    }
    if ((m = /Cannot (?:read|set) propert(?:y|ies) of (null|undefined) \((?:reading|setting) '([^']+)'\)/.exec(msg)) || (m = /(null|undefined) is not an object.*?'([^']+)'/.exec(msg))) {
      if (m[1] === 'null') return { title: 'El elemento no existe (null)', msg: 'Intentaste usar ' + q('.' + m[2]) + ' sobre <b>null</b>. Casi siempre significa que ' + q('getElementById') + ' / ' + q('querySelector') + ' / ' + q('$()') + ' no encontró el elemento: el id esta mal escrito, no existe en el HTML, o el script corre antes de que el elemento exista.', fix: idsHint + ' Verifica que el nombre sea identico y que el ' + q('<script>') + ' vaya después del HTML.' };
      return { title: 'Valor indefinido (undefined)', msg: 'Intentaste leer ' + q('.' + m[2]) + ' de algo que vale <b>undefined</b>: una variable sin valor, una propiedad que no existe, una posición del arreglo que no existe o una respuesta que aún no llegó.', fix: 'Revisa el nombre de la propiedad, que el objeto exista antes de usarlo y que las funciones asíncronas (AJAX) hayan terminado. Puedes protegerte con ' + q('if (objeto) { ... }') + '.' };
    }
    if ((m = /^(.+?) is not a function/.exec(msg))) {
      var expr = m[1], last = (/([\w$]+)$/.exec(expr) || [])[1] || expr, lc = last.toLowerCase();
      var pool = KNOWN.concat(JS_COMMON, JQ_METHODS), exact = pool.filter(function (x) { return x.toLowerCase() === lc; })[0], near = exact || JT.closest(last, pool, 2);
      var dom = /\b(getElementById|querySelector|document\.|getElementsBy|children|parentNode|\.target)/.test(expr) || /getElementById|querySelector/.test((f.js || ''));
      if (JQ_METHODS.indexOf(last) >= 0 && !(spec && spec.lib === 'jq') || (JQ_METHODS.indexOf(last) >= 0 && /getElementById|querySelector|document\.get/.test(expr)))
        return { title: last + '() es de jQuery, no del DOM', msg: q(expr) + ' no es una función: ' + q(last) + ' es un método de <b>jQuery</b>, pero lo llamaste sobre un elemento normal del DOM.', fix: 'Envuelve el elemento con ' + q('$(elemento).' + last + '(...)') + ' o usa la propiedad del DOM equivalente (por ejemplo ' + q('.style') + ', ' + q('.innerHTML') + ').' };
      return { title: expr + ' no es una función', msg: q(expr) + ' no es una función: o está mal escrita, o ese objeto no tiene ese método' + (exact ? ' (el nombre correcto es ' + q(exact) + ': JavaScript distingue mayúsculas)' : '') + ', o la variable guarda otro tipo de dato.', fix: near ? 'Quizá quisiste escribir ' + q(near + '()') + '.' : 'Revisa la ortografía y que el objeto realmente tenga ese método.' };
    }
    if (/JSON/.test(msg) && /(position|valid JSON|Unexpected end)/.test(msg)) return jsonRuntime(msg);
    if (/Assignment to constant variable/.test(msg)) return { title: 'No puedes cambiar una constante', msg: 'Declaraste la variable con ' + q('const') + ' y luego intentaste darle otro valor.', fix: 'Si el valor va a cambiar, declarala con ' + q('let') + ' en vez de ' + q('const') + '.' };
    if ((m = /Cannot access '(.+)' before initialization/.exec(msg))) return { title: 'Usas ' + m[1] + ' antes de crearla', msg: 'La variable ' + q(m[1]) + ' (declarada con let/const) se usa en una línea que se ejecuta antes de su declaración.', fix: 'Mueve la declaración ' + q('let ' + m[1] + ' = ...') + ' hacia arriba, antes de usarla.' };
    if (/Maximum call stack/.test(msg)) return { title: 'Función que se llama a si misma sin parar', msg: 'Una función se invoca a si misma una y otra vez (recursion infinita) hasta llenar la memoria.', fix: 'Agrega una condición de parada (un ' + q('if') + ' con ' + q('return') + ') o revisa que no te llames a ti mismo sin querer.' };
    if (/Failed to execute 'open'.*arguments required/.test(msg)) return { title: 'open() necesita método y URL', msg: q(msg), fix: 'Escribe ' + q('xhr.open("GET", "url")') + '.' };
    if (/setRequestHeader.*OPENED/.test(msg)) return { title: 'setRequestHeader antes de open', msg: 'Las cabeceras se definen DESPUES de open() y ANTES de send().', fix: 'Orden: ' + q('xhr.open(...)') + ' - ' + q('xhr.setRequestHeader(...)') + ' - ' + q('xhr.send(...)') + '.' };
    if (/'send' on 'XMLHttpRequest'.*OPENED/.test(msg)) return { title: 'send() en mal momento', msg: 'Llamaste ' + q('send()') + ' sin haber llamado antes a ' + q('open()') + ' o ya habias enviado esa misma petición.', fix: 'Cada petición se prepara con ' + q('open()') + ' y se envia una sola vez con ' + q('send()') + '. Para otra petición usa otra llamada a open (o crea un nuevo objeto).' };
    if (/2 arguments required.*setItem/.test(msg)) return { title: 'setItem necesita clave y valor', msg: q(msg), fix: 'Ejemplo: ' + q("localStorage.setItem('clave', 'valor')") + '.' };
    if (/not a valid selector|unrecognized expression/.test(msg)) return { title: 'Selector no válido', msg: 'El selector que escribiste no es válido: ' + q(msg), fix: 'Ejemplos válidos: ' + q('#miId') + ', ' + q('.miClase') + ', ' + q('ul li') + ', ' + q('input[type=text]') + '.' };
    if (/Failed to fetch|NetworkError/.test(msg)) return { title: 'No se pudo conectar al servidor', msg: 'La petición fallo antes de llegar. En este simulador solo funciona el servidor de práctica ' + q('https://mock.jstrick.dev') + '.', fix: 'Usa por ejemplo ' + q('https://mock.jstrick.dev/books') + ', ' + q('/cities') + ', ' + q('/users') + ' o ' + q('/todos') + '. En tu proyecto real iria la URL de tu cuenta de mockAPI.' };
    if (/not valid JSON/.test(msg)) return jsonRuntime(msg);
    return { title: (name && name !== 'Error' ? name : 'Error al ejecutar'), msg: 'El navegador reporto: ' + q(msg), fix: 'Mira la línea marcada en rojo y revisa los nombres, los paréntesis y el orden de las instrucciones. Usa el boton "?" de esa línea para ver que hace cada parte.' };
  };
  function jsonRuntime(msg) {
    if (/\[object Object\]/.test(msg)) return { title: 'JSON.parse recibió un objeto', msg: 'Le pasaste un <b>objeto</b> a ' + q('JSON.parse') + ', pero esa función espera un <b>texto</b> JSON. Pasa casi siempre cuando se guardo un objeto en localStorage sin ' + q('JSON.stringify') + '.', fix: 'Guarda con ' + q('JSON.stringify(objeto)') + ' y lee con ' + q('JSON.parse(texto)') + '. Si ya tienes el objeto, no necesitas parse.' };
    if (/"undefined" is not valid JSON|Unexpected token 'u'|undefined/.test(msg)) return { title: 'JSON.parse recibió undefined', msg: 'La clave que leiste no existe (o la variable esta vacia), así que no hay texto para convertir.', fix: 'Antes de parsear verifica el valor: ' + q('var t = localStorage.getItem("k"); if (t) { var o = JSON.parse(t); }') + '.' };
    if (/null/.test(msg) && /valid JSON/.test(msg)) return { title: 'No había nada guardado', msg: q('getItem') + ' devolvió null porque esa clave aún no existe.', fix: 'Comprueba antes: ' + q('if (texto !== null) { JSON.parse(texto) }') + '.' };
    if (/Unexpected end of JSON/.test(msg)) return { title: 'JSON incompleto', msg: 'El texto JSON termina antes de tiempo: falta cerrar una llave, un corchete o unas comillas (o llegó vacío).', fix: 'Revisa que cada ' + q('{') + ' tenga su ' + q('}') + ' y cada ' + q('[') + ' su ' + q(']') + '.' };
    return { title: 'El texto no es JSON válido', msg: 'JSON.parse no pudo leer el texto: ' + q(msg), fix: 'En JSON las claves y los textos van con <b>comillas dobles</b>; no se permiten comillas simples, comas finales, comentarios ni claves sin comillas. Correcto: ' + q('{"nombre":"Ana"}') + '.' };
  }
})();
