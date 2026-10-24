/* js-trick :: revisor de errores para Python, SQL, PHP, C, C++ y C# (explica qué está mal y cómo corregirlo) */
(function () {
  var JT = window.JT, esc = JT.esc;
  function I(sev, file, line, title, msg, fix) { return { sev: sev, file: file, line: line || 0, title: title, msg: msg, fix: fix || '', code: '' }; }
  var q = function (s) { return '<code>' + esc(s) + '</code>'; };
  function lineOf(text, idx) { return text.slice(0, idx).split('\n').length; }

  /* texto sin comentarios ni contenido de cadenas (conserva saltos de línea y posiciones) */
  function mask(code, L) {
    var toks = JT.langScan[L](code), out = '';
    toks.forEach(function (t) {
      if (t.t === 'c') out += t.s.replace(/[^\n]/g, ' ');
      else if (t.t === 's' && /^[fFrRbBuU]{0,2}("""|''')/.test(t.s)) out += t.s.replace(/[^\n]/g, ' ');
      else if (t.t === 's') { var inner = t.s.replace(/[^\n]/g, ' '); out += t.s.length > 1 ? t.s[0] + inner.slice(1, -1) + t.s[t.s.length - 1] : inner; }
      else out += t.s;
    });
    return out;
  }

  /* paréntesis, llaves y comillas */
  function balance(code, L, file) {
    var out = [], toks = JT.langScan[L](code), stack = [], line = 1, closer = { '(': ')', '[': ']', '{': '}' }, pairs = { ')': '(', ']': '[', '}': '{' };
    toks.forEach(function (t) {
      if (t.t === 's') {
        var s = t.s, open = s[0], isPyTriple = /^(?:[fFrRbBuU]{0,2})("""|''')/.test(s);
        if (!isPyTriple && L !== 'sql' && !/\n/.test(s) && (L !== 'php')) {
          var core = s.replace(/^[@$fFrRbBuU]+/, '');
          var qc = core[0];
          if (core.length < 2 || core[core.length - 1] !== qc || (core.length === 2 && false)) out.push(I('error', file, line, 'Comillas sin cerrar', 'Abriste ' + q(qc) + ' en la línea ' + line + ' y no la cerraste antes de terminar la línea.', 'Cierra el texto con la misma comilla: ' + q(qc) + '.'));
        } else if (L === 'sql' && !/\n/.test(s) && (s.length < 2 || s[s.length - 1] !== s[0])) out.push(I('error', file, line, 'Comillas sin cerrar', 'Abriste ' + q(s[0]) + ' en la línea ' + line + ' y no la cerraste.', 'Cierra el texto con ' + q(s[0]) + '.'));
        else if (L === 'php' && (s.length < 2 || s[s.length - 1] !== s[0])) out.push(I('error', file, line, 'Comillas sin cerrar', 'Abriste ' + q(s[0]) + ' en la línea ' + line + ' y no la cerraste.', 'Cierra el texto con ' + q(s[0]) + '.'));
      } else if (t.t === 'o' && /^[()\[\]{}]$/.test(t.s)) {
        var ch = t.s;
        if (closer[ch]) stack.push({ ch: ch, line: line });
        else {
          var top = stack[stack.length - 1];
          if (!top) out.push(I('error', file, line, 'Sobra un ' + ch, 'Hay un ' + q(ch) + ' en la línea ' + line + ' que no cierra nada.', 'Bórralo o revisa si falta abrir un ' + q(pairs[ch]) + ' antes.'));
          else if (top.ch !== pairs[ch]) { out.push(I('error', file, line, 'Cierre equivocado: ' + ch, 'En la línea ' + line + ' pusiste ' + q(ch) + ' pero se esperaba ' + q(closer[top.ch]) + ' para cerrar el ' + q(top.ch) + ' de la línea ' + top.line + '.', 'Cierra primero lo último que abriste.')); stack.pop(); }
          else stack.pop();
        }
      }
      line += (t.s.match(/\n/g) || []).length;
    });
    stack.slice(-2).reverse().forEach(function (o) { out.push(I('error', file, o.line, 'Falta cerrar ' + o.ch, 'Abriste ' + q(o.ch) + ' en la línea ' + o.line + ' y nunca lo cerraste.', 'Agrega ' + q(closer[o.ch]) + ' donde termina ese bloque.')); });
    return out;
  }

  function nearest(word, list, d) { return JT.closest(word, list, d == null ? 2 : d); }
  function eachLine(masked, fn) { masked.split('\n').forEach(function (l, i) { fn(l, i + 1); }); }

  /* ======================= PYTHON ======================= */
  var PY_BUILTINS = 'print len range input int float str bool list dict set tuple type isinstance abs round max min sum sorted reversed enumerate zip map filter open format any all pow divmod chr ord bin hex id dir help iter next repr super object Exception ValueError TypeError KeyError IndexError ZeroDivisionError NameError AttributeError StopIteration'.split(' ');
  function lintPy(code, file, o) {
    var out = [], m = mask(code, 'py'), lines = code.split('\n'), mlines = m.split('\n');
    if (!o.fragment) out = out.concat(balance(code, 'py', file));
    var defined = {}, mdef = m + (o.context ? '\n' + o.context : '');
    PY_BUILTINS.forEach(function (b) { defined[b] = 1; });
    mdef.replace(/\bdef\s+(\w+)\s*\(([^)]*)\)/g, function (a, n, ps) { defined[n] = 1; ps.split(',').forEach(function (p) { var w = /\w+/.exec(p); if (w) defined[w[0]] = 1; }); return a; });
    mdef.replace(/\bclass\s+(\w+)/g, function (a, n) { defined[n] = 1; return a; });
    mdef.replace(/\bimport\s+([\w., ]+)/g, function (a, n) { n.split(',').forEach(function (x) { var w = x.trim().split(/\s+as\s+/); defined[(w[1] || w[0]).split('.')[0]] = 1; }); return a; });
    mdef.replace(/\bfrom\s+[\w.]+\s+import\s+([\w, *]+)/g, function (a, n) { n.split(',').forEach(function (x) { var w = x.trim().split(/\s+as\s+/); defined[(w[1] || w[0]).trim()] = 1; }); return a; });
    mdef.replace(/^\s*([\w, ]+?)\s*=(?!=)/gm, function (a, n) { n.split(',').forEach(function (x) { defined[x.trim()] = 1; }); return a; });
    mdef.replace(/\bfor\s+([\w, ]+)\s+in\b/g, function (a, n) { n.split(',').forEach(function (x) { defined[x.trim()] = 1; }); return a; });
    mdef.replace(/\bas\s+(\w+)/g, function (a, n) { defined[n] = 1; return a; });
    mdef.replace(/\blambda\s+([\w, ]*):/g, function (a, n) { n.split(',').forEach(function (x) { defined[x.trim()] = 1; }); return a; });
    var depth = 0, prevIndent = -1, prevOpener = false, prevDepth0 = true, inputVars = {};
    eachLine(m, function (ln, no) {
      var raw = lines[no - 1], t = ln.trim();
      var startDepth = depth;
      for (var i = 0; i < ln.length; i++) { var c = ln[i]; if (c === '(' || c === '[' || c === '{') depth++; else if (c === ')' || c === ']' || c === '}') depth = Math.max(0, depth - 1); }
      if (!t) return;
      var indentStr = /^[ \t]*/.exec(raw)[0], indent = indentStr.replace(/\t/g, '    ').length;
      if (/ \t|\t /.test(indentStr)) out.push(I('warn', file, no, 'Mezclas tabuladores y espacios', 'La sangría de la línea ' + no + ' mezcla tabuladores y espacios. Python se confunde con eso.', 'Usa solo espacios (4 por nivel).'));
      /* palabras clave de otros lenguajes */
      if (/&&|\|\|/.test(ln)) out.push(I('error', file, no, 'Python no usa && ni ||', 'En Python el "y" lógico es ' + q('and') + ' y el "o" es ' + q('or') + '.', 'Cambia ' + q('&&') + ' por ' + q('and') + ' y ' + q('||') + ' por ' + q('or') + '.'));
      if (/(^|[\s(])!(?!=)/.test(ln)) out.push(I('error', file, no, 'Python no usa !', 'Para negar una condición se escribe ' + q('not') + ', por ejemplo ' + q('if not activo:') + '.', 'Cambia ' + q('!') + ' por ' + q('not') + '.'));
      if (/\w(\+\+|--)(?![\w(])/.test(ln) && !/^\s*#/.test(ln)) out.push(I('error', file, no, 'Python no tiene ++ ni --', 'No existe el operador ' + q('i++') + '. Para sumar uno se escribe ' + q('i += 1') + ' (y ' + q('i -= 1') + ' para restar).', 'Escribe ' + q('i += 1') + '.'));
      if (/\belse\s+if\b/.test(ln)) out.push(I('error', file, no, 'Es elif, no else if', 'En Python "si no, si..." se escribe ' + q('elif') + ' (una sola palabra).', 'Cambia ' + q('else if') + ' por ' + q('elif') + '.'));
      if (/\belseif\b/.test(ln)) out.push(I('error', file, no, 'Es elif, no elseif', 'En Python se escribe ' + q('elif') + '.', 'Cambia ' + q('elseif') + ' por ' + q('elif') + '.'));
      if (/\b(true|false|null)\b/.test(ln)) { var w = /\b(true|false|null)\b/.exec(ln)[1]; out.push(I('warn', file, no, w + ' se escribe distinto en Python', 'En Python los valores son ' + q('True') + ', ' + q('False') + ' y ' + q('None') + ' (con la primera letra en mayúscula).', 'Escribe ' + q(w === 'null' ? 'None' : w === 'true' ? 'True' : 'False') + '.')); }
      if (/^print\s+[^(=\s]|^print\s+["'\w]/.test(t) && !/^print\s*\(/.test(t)) out.push(I('error', file, no, 'print necesita paréntesis', 'En Python 3, ' + q('print') + ' es una función: lo que quieres mostrar va entre paréntesis.', 'Escribe ' + q('print("hola")') + ' en lugar de ' + q('print "hola"') + '.'));
      if (/^(if|elif|while)\b[^=!<>:]*[^=!<>:]=(?!=)[^=]/.test(t) && !/:=/.test(t)) out.push(I('error', file, no, 'Usaste = dentro de ' + /^(\w+)/.exec(t)[1], 'Un solo ' + q('=') + ' guarda un valor; para comparar se usa ' + q('==') + '.', 'Cambia ' + q('=') + ' por ' + q('==') + ' en la condición.'));
      /* dos puntos */
      if (!o.fragment && startDepth === 0 && /^(?:async\s+)?(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(t) && depth === 0 && !/[:\\,]$/.test(t) && !/\bif\b.*\belse\b/.test(t) && !/^(if|while|for)\b.*:\s*\S/.test(t) && !/^(?:async\s+)?(def|class)\b.*:\s*\S/.test(t)) out.push(I('error', file, no, 'Falta ":" al final de la línea', 'Las líneas que abren un bloque (' + q(/^(\w+)/.exec(t)[1]) + ') deben terminar con dos puntos.', 'Agrega ' + q(':') + ' al final: ' + q(t + ':') + '.'));
      if (/^def\s+\w+\s*:/.test(t)) out.push(I('error', file, no, 'Faltan los paréntesis de la función', 'Una función se declara con paréntesis aunque no tenga parámetros: ' + q('def saludar():') + '.', 'Escribe ' + q('def nombre():') + '.'));
      /* sangría */
      if (!o.fragment && startDepth === 0) {
        if (prevOpener && indent <= prevIndent) out.push(I('error', file, no, 'Falta sangría (IndentationError)', 'La línea anterior termina en ":" y abre un bloque, así que la línea ' + no + ' debe ir <b>más a la derecha</b> (sangría de 4 espacios).', 'Agrega 4 espacios al inicio de la línea ' + no + '.'));
        else if (!prevOpener && prevIndent >= 0 && indent > prevIndent && prevDepth0) out.push(I('error', file, no, 'Sangría inesperada', 'La línea ' + no + ' está más a la derecha que la anterior, pero la anterior no abre un bloque (no termina en ":").', 'Quita la sangría sobrante o agrega los dos puntos en la línea de arriba.'));
      }
      /* input() devuelve texto */
      var im = /^\s*(\w+)\s*=\s*input\s*\(/.exec(ln); if (im) inputVars[im[1]] = no;
      Object.keys(inputVars).forEach(function (v) {
        if (no > inputVars[v] && new RegExp('(^|[^\\w."\'])' + v + '\\s*([*/+\\-%]\\s*\\d|[<>]=?\\s*\\d|\\*\\*)').test(ln) && !new RegExp('\\b(int|float)\\s*\\(\\s*' + v).test(ln)) { out.push(I('warn', file, no, 'input() devuelve texto', 'La variable ' + q(v) + ' viene de ' + q('input()') + ', que <b>siempre</b> entrega un texto. Operar con números fallará o dará resultados raros ("5" * 3 es "555").', 'Conviértela: ' + q(v + ' = int(input("..."))') + ' (o ' + q('float(...)') + ' para decimales).')); delete inputVars[v]; }
      });
      /* llamadas a funciones que no existen */
      ln.replace(/(^|[^\w.])([A-Za-z_]\w*)\s*\(/g, function (a, pre, name) {
        if (defined[name] || /^(if|elif|while|for|return|print|and|or|not|in|is|lambda|def|class|with|assert|yield|del|raise|except)$/.test(name)) return a;
        var near = nearest(name, Object.keys(defined), 2);
        if (near && name.length >= 3) out.push(I('error', file, no, name + '() no existe', 'No hay ninguna función llamada ' + q(name) + ' (ni de Python ni definida por ti).', 'Quizá quisiste escribir ' + q(near + '()') + '. Revisa la ortografía y las mayúsculas.'));
        return a;
      });
      prevOpener = depth === 0 && /:\s*$/.test(t) && /^(?:async\s+)?(if|elif|else|for|while|def|class|try|except|finally|with)\b/.test(t) || (depth === 0 && /:\s*$/.test(t) && startDepth === 0 && /^(?:async\s+)?(if|elif|else|for|while|def|class|try|except|finally|with|match|case)\b/.test(t));
      prevIndent = indent; prevDepth0 = depth === 0;
    });
    if (!o.fragment && prevOpener) out.push(I('error', file, lines.length, 'Falta el contenido del bloque', 'El último bloque abierto con ":" no tiene ninguna línea dentro.', 'Escribe al menos una instrucción con sangría (o ' + q('pass') + ' si no hace nada).'));
    return out;
  }

  /* ======================= SQL ======================= */
  var SQL_STARTS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'WITH', 'PRAGMA', 'BEGIN', 'COMMIT', 'ROLLBACK', 'EXPLAIN'];
  var SQL_WORDS = 'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE DROP ALTER GROUP BY ORDER HAVING LIMIT OFFSET DISTINCT AS AND OR IN BETWEEN LIKE IS NULL NOT JOIN INNER LEFT RIGHT ON COUNT SUM AVG MIN MAX ASC DESC UNION ALL PRIMARY KEY FOREIGN REFERENCES DEFAULT UNIQUE CASE WHEN THEN ELSE END VALUE CAST AFTER BEFORE OVER FILTER ROWS ROW PARTITION UNBOUNDED PRECEDING FOLLOWING CURRENT WINDOW RECURSIVE EXCLUDED CONFLICT RETURNING TRIGGER VIEW INDEX BEGIN COMMIT ROLLBACK EXISTS INTERSECT EXCEPT CROSS NTILE RANK DENSE LAG LEAD FIRST LAST CHECK COALESCE IGNORE NOTHING REPLACE OUTER USING NATURAL FULL TEMP TEMPORARY'.split(' ');
  function lintSql(code, file, o) {
    var out = [], m = mask(code, 'sql');
    m = m.replace(/CREATE\s+(?:TEMP\s+|TEMPORARY\s+)?TRIGGER[\s\S]*?\bEND\s*;?/gi, function (x) { return x.replace(/[^\n]/g, ' '); });
    if (!o.fragment) out = out.concat(balance(code, 'sql', file));
    /* partir en sentencias */
    var idx = 0, stmts = [];
    m.split(';').forEach(function (s, k, arr) { stmts.push({ text: s, start: idx, last: k === arr.length - 1 }); idx += s.length + 1; });
    stmts.forEach(function (st) {
      var t = st.text.trim(); if (!t) return;
      var no = lineOf(m, st.start + (st.text.length - st.text.replace(/^\s+/, '').length)), up = t.toUpperCase();
      var first = /^\w+/.exec(up) ? /^\w+/.exec(up)[0] : '';
      if (first && SQL_STARTS.indexOf(first) < 0) {
        var near = nearest(first, SQL_STARTS, 2);
        out.push(I('error', file, no, 'Sentencia desconocida: ' + first, 'Una sentencia SQL debe empezar con ' + SQL_STARTS.slice(0, 5).map(q).join(', ') + '... y ' + q(first) + ' no es ninguna.', near ? 'Quizá quisiste escribir ' + q(near) + '.' : 'Revisa que la sentencia anterior termine con ' + q(';') + '.'));
        return;
      }
      /* palabras clave mal escritas */
      (up.match(/\b[A-Z_]{4,}\b/g) || []).forEach(function (w) {
        if (SQL_WORDS.indexOf(w) >= 0 || (JT.sqlIdents && JT.sqlIdents[w.toLowerCase()])) return;
        var near2 = nearest(w, SQL_WORDS, 1);
        if (near2 && w.length >= 4 && /^[A-Z]+$/.test(w) && new RegExp('\\b' + w + '\\b', 'i').test(t) && !/["'`]/.test(t.slice(Math.max(0, t.toUpperCase().indexOf(w) - 1), t.toUpperCase().indexOf(w)))) {
          var raw = new RegExp('\\b' + w + '\\b', 'i').exec(t);
          if (raw && raw[0] === raw[0].toUpperCase() || raw && raw[0] === raw[0].toLowerCase()) out.push(I('warn', file, no, 'Posible error de escritura: ' + raw[0], q(raw[0]) + ' no es una palabra de SQL. ¿Quisiste escribir ' + q(near2) + '?', 'Si es el nombre de una columna o tabla, ignora este aviso.'));
        }
      });
      if (/^SELECT\b/.test(up) && !/\bFROM\b/.test(up) && /(\*|\bWHERE\b|\bORDER\b|\bGROUP\b)/.test(up) && !/^SELECT\s+[\d'(]/.test(up)) out.push(I('error', file, no, 'Falta FROM', 'Un ' + q('SELECT') + ' que lee de una tabla necesita ' + q('FROM tabla') + ' para saber de dónde sacar los datos.', 'Ejemplo: ' + q('SELECT * FROM alumnos;') + '.'));
      if (/^UPDATE\b/.test(up) && !/\bSET\b/.test(up)) out.push(I('error', file, no, 'UPDATE necesita SET', 'Para modificar datos: ' + q('UPDATE tabla SET columna = valor WHERE ...') + '.', 'Agrega ' + q('SET columna = valor') + '.'));
      if (/^UPDATE\b/.test(up) && !/\bWHERE\b/.test(up)) out.push(I('warn', file, no, 'UPDATE sin WHERE', 'Sin ' + q('WHERE') + ' se modifican <b>todas</b> las filas de la tabla.', 'Agrega ' + q('WHERE condición') + ' para cambiar solo las filas que quieres.'));
      if (/^DELETE\b/.test(up) && !/^DELETE\s+FROM\b/.test(up)) out.push(I('error', file, no, 'DELETE necesita FROM', 'Para borrar filas: ' + q('DELETE FROM tabla WHERE ...') + '.', 'Escribe ' + q('DELETE FROM') + ' y el nombre de la tabla.'));
      if (/^DELETE\b/.test(up) && !/\bWHERE\b/.test(up)) out.push(I('warn', file, no, 'DELETE sin WHERE', 'Sin ' + q('WHERE') + ' se borran <b>todas</b> las filas de la tabla.', 'Agrega ' + q('WHERE condición') + '.'));
      if (/^INSERT\b/.test(up) && !/^INSERT\s+(OR\s+\w+\s+)?INTO\b/.test(up)) out.push(I('error', file, no, 'INSERT necesita INTO', 'La forma es ' + q('INSERT INTO tabla (columnas) VALUES (valores)') + '.', 'Escribe ' + q('INSERT INTO') + ' y la tabla.'));
      if (/^INSERT\b/.test(up) && !/\bVALUES\b|\bSELECT\b/.test(up)) out.push(I('error', file, no, 'Falta VALUES', 'Un ' + q('INSERT') + ' necesita ' + q('VALUES (...)') + ' con los datos a guardar.', 'Agrega ' + q("VALUES ('dato1', 5)") + '.'));
      if (/\bORDER\s+(?!BY\b)\w/.test(up)) out.push(I('error', file, no, 'Es ORDER BY', 'Para ordenar se escribe ' + q('ORDER BY columna') + ' (las dos palabras).', 'Agrega ' + q('BY') + ' después de ORDER.'));
      if (/\bGROUP\s+(?!BY\b)\w/.test(up)) out.push(I('error', file, no, 'Es GROUP BY', 'Para agrupar se escribe ' + q('GROUP BY columna') + '.', 'Agrega ' + q('BY') + ' después de GROUP.'));
      if (/(^|[^<>!=])==(?!=)/.test(t.replace(/'[^']*'/g, "''"))) out.push(I('error', file, no, 'En SQL se compara con un solo =', 'SQL no usa ' + q('==') + '. La igualdad es ' + q('=') + ' (y la desigualdad ' + q('<>') + ' o ' + q('!=') + ').', 'Cambia ' + q('==') + ' por ' + q('=') + '.'));
      if (/[=<>]\s*NULL\b/i.test(t) && !/\bIS\s+(NOT\s+)?NULL\b/i.test(t)) out.push(I('error', file, no, 'NULL se compara con IS NULL', 'Comparar con ' + q('= NULL') + ' nunca da verdadero: NULL significa "sin dato", no es un valor.', 'Escribe ' + q('columna IS NULL') + ' o ' + q('columna IS NOT NULL') + '.'));
      if (/\b(AND|OR)\s*(AND|OR)\b/.test(up)) out.push(I('error', file, no, 'AND/OR repetido', 'Hay dos conectores seguidos (' + q('AND OR') + '). Falta una condición entre ellos.', 'Escribe una condición completa entre cada AND/OR.'));
      if (/"[^"]*"/.test(t) && !/\bAS\s+"|\b(FROM|JOIN|INTO|TABLE|UPDATE)\s+"/i.test(t)) out.push(I('warn', file, no, 'Textos con comillas simples', 'En SQL los textos van entre <b>comillas simples</b> (' + q("'Ana'") + '). Las comillas dobles se usan para nombres de columnas y tablas; SQLite las acepta a veces, pero otros motores darán error.', 'Cambia ' + q('"Ana"') + ' por ' + q("'Ana'") + '.'));
      if (/\bSELECT\b[\s\S]*\bFROM\b[\s\S]*\bGROUP\s+BY\b/.test(up) === false && /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(/.test(up) && /^SELECT\s+(?!COUNT|SUM|AVG|MIN|MAX)\w+\s*,\s*(COUNT|SUM|AVG|MIN|MAX)\s*\(/.test(up) && !/\bGROUP\s+BY\b/.test(up)) out.push(I('error', file, no, 'Falta GROUP BY', 'Mezclas una columna normal con una función de resumen (' + q('COUNT/SUM/AVG...') + ') y SQL no sabe cómo agrupar.', 'Agrega ' + q('GROUP BY columna') + ' al final.'));
    });
    /* punto y coma entre sentencias */
    if (!o.fragment) {
      var bodies = m.split(/\n/), buf = '', startNo = 0, depth2 = 0;
      bodies.forEach(function (l, i) {
        var t2 = l.trim();
        if (!t2) return;
        var w = /^\w+/.exec(t2.toUpperCase());
        if (w && SQL_STARTS.indexOf(w[0]) >= 0 && buf && !/;\s*$/.test(buf.trim()) && !/^(WITH|SELECT)/.test(w[0]) || (w && SQL_STARTS.indexOf(w[0]) >= 0 && buf && !/;\s*$/.test(buf.trim()) && /^(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)$/.test(w[0]))) out.push(I('error', file, startNo, 'Falta ; al final de la sentencia', 'La sentencia que empieza en la línea ' + startNo + ' no termina con punto y coma antes de que empiece otra.', 'Agrega ' + q(';') + ' al final de la sentencia.'));
        if (w && SQL_STARTS.indexOf(w[0]) >= 0 && (!buf || /;\s*$/.test(buf.trim()))) { buf = t2; startNo = i + 1; } else buf += ' ' + t2;
      });
    }
    return out;
  }

  /* ======================= familia C (C, C++, C#) y PHP ======================= */
  var CTRL = /^(if|for|while|switch|foreach|catch|else|do|try|finally|using|lock|namespace|class|struct|enum|interface|union|typedef|public|private|protected|case|default|template|#)\b|^(else|do)\b/;
  function missingSemis(code, L, file, o) {
    var out = [], m = mask(code, L), lines = m.split('\n'), initDepth = 0, enumDepth = 0, inEnum = false;
    for (var i = 0; i < lines.length; i++) {
      var t = lines[i].trim();
      if (!t) continue;
      var nextT = ''; for (var j = i + 1; j < lines.length; j++) { if (lines[j].trim()) { nextT = lines[j].trim(); break; } }
      if (/\benum\b/.test(t)) inEnum = true;
      if (inEnum) { if (/\}/.test(t)) inEnum = false; continue; }
      if (/=\s*\{[^}]*$/.test(t)) initDepth++;
      if (initDepth > 0) { if (/\}\s*;?\s*$/.test(t) && !/=\s*\{/.test(t)) initDepth--; else if (/\}\s*;/.test(t)) initDepth--; continue; }
      if (/^(#|<\?php|\?>|\/\/|\/\*|\*|\[)/.test(t) || /^[{}]/.test(t)) continue;
      if (/[;{},(\[:.+\-*\/&|?=<>\\]$/.test(t) || /^(\.|->|\+|-|&&|\|\||\?|:)/.test(t)) continue;
      if (/^(else|do|try|finally)$/.test(t)) continue;
      if (/^@/.test(t)) continue;
      if (/^\.[A-Za-z_]/.test(nextT)) continue;
      if (/\)\s*throws\s+[\w.,\s]+$/.test(t) && /^\{/.test(nextT)) continue;
      if (/\)$/.test(t) && /^\{/.test(nextT)) continue;
      if (/\bfunction\b.*\)\s*(:\s*\??[\w\\|]+)?$/.test(t) && /^\{/.test(nextT)) continue;
      if (/^[)\]]/.test(nextT) || /^(->|\?->)/.test(nextT)) continue;
      if (/\)\s*(const|noexcept|override|final)(\s+(const|noexcept|override|final))*$/.test(t) && /^\{/.test(nextT)) continue;
      if (/^(if|for|while|switch|foreach|catch|else if|elseif|using)\b/.test(t) && /\)$/.test(t) && !/;$/.test(t) && nextT && !/^\{/.test(nextT)) { /* if sin llaves: la siguiente es la sentencia */ continue; }
      if (/^(class|struct|namespace|interface)\b|^(public|private|protected|internal|static)\s+(class|struct|interface)\b/.test(t)) continue;
      if (/^((public|private|protected|internal|static|abstract|sealed|partial|readonly|final)\s+)*(class|struct|interface|record|namespace|enum|trait)\b/.test(t) && !/;$/.test(t)) continue;
      if (/\bswitch$/.test(t) && /^\{/.test(nextT)) continue;
      if (/=>/.test(t) && /^\}/.test(nextT)) continue;
      if (/\bnew\b[^;(]*(\[\])?$/.test(t) && /^\{/.test(nextT)) continue;
      if (/^new\b/.test(t) && /^[}\]]/.test(nextT)) continue;
      if (/^(public|private|protected|internal)\b.*\)$/.test(t) && /^\{/.test(nextT)) continue;
      if (/^\w[\w\s\*&:<>,\[\]]*\s+\*?\w+\s*\([^)]*\)$/.test(t) && /^\{/.test(nextT) ) continue;
      if (/(\)|\w|"|'|\]|\+\+|--)$/.test(t)) {
        out.push(I('error', file, i + 1, 'Falta ";" al final de la línea ' + (i + 1), 'En ' + ({ php: 'PHP', c: 'C', cpp: 'C++', cs: 'C#', java: 'Java' })[L] + ' cada instrucción termina con punto y coma: ' + q(lines[i].trim()) + ' no lo tiene.', 'Agrega ' + q(';') + ' al final: ' + q(lines[i].trim() + ';') + '.'));
      }
    }
    return out;
  }

  var C_FUNCS = 'qsort bsearch strrchr snprintf sscanf vprintf vsnprintf vfprintf strtol strtod strtoul remove rewind ftell fseek fwrite fread memmove memcmp isupper islower isspace isalnum va_start va_arg va_end perror strerror labs strncat strncmp strtok assert printf scanf puts putchar getchar gets fgets fputs fopen fclose fprintf sprintf strlen strcpy strncpy strcmp strcat strchr strstr malloc calloc realloc free sqrt pow abs fabs floor ceil rand srand time atoi atof exit toupper tolower isdigit isalpha memset memcpy sort reverse find min max swap to_string stoi stod getline begin end size length substr push_back pop_back count accumulate'.split(' ');
  function lintC(code, file, o, L) {
    var out = [], m = mask(code, L), cpp = L === 'cpp';
    if (!o.fragment) out = out.concat(balance(code, L, file));
    if (!o.fragment) out = out.concat(missingSemis(code, L, file, o));
    var defs = {}; m.replace(/\b[A-Za-z_][\w\*&:<>]*\s+\*?([A-Za-z_]\w*)\s*\([^;()]*\)\s*(?:const\s*)?(?:\{|\n\s*\{)/g, function (a, n) { defs[n] = 1; return a; });
    m.replace(/#\s*define\s+(\w+)/g, function (a, n) { defs[n] = 1; return a; });
    var has = function (re) { return re.test(m) || re.test(code); };
    if (!o.fragment) {
      if (!cpp) {
        if (/\b(printf|scanf|puts|putchar|getchar|fgets|fopen|sprintf)\s*\(/.test(m) && !/#\s*include\s*<stdio\.h>/.test(code)) out.push(I('error', file, 1, 'Falta #include <stdio.h>', 'Usas funciones de entrada/salida (' + q('printf') + ', ' + q('scanf') + '...) pero no incluiste su biblioteca.', 'Agrega al inicio: ' + q('#include <stdio.h>') + '.'));
        if (/\b(strlen|strcpy|strncpy|strcmp|strcat|strstr|strchr|memset|memcpy)\s*\(/.test(m) && !/#\s*include\s*<string\.h>/.test(code)) out.push(I('error', file, 1, 'Falta #include <string.h>', 'Usas funciones de texto (' + q('strlen') + ', ' + q('strcpy') + '...) sin incluir su biblioteca.', 'Agrega ' + q('#include <string.h>') + '.'));
        if (/\b(malloc|calloc|realloc|free|atoi|atof|rand|srand|exit)\s*\(/.test(m) && !/#\s*include\s*<stdlib\.h>/.test(code)) out.push(I('error', file, 1, 'Falta #include <stdlib.h>', 'Usas ' + q('malloc/free/rand/atoi...') + ' sin incluir su biblioteca.', 'Agrega ' + q('#include <stdlib.h>') + '.'));
        if (/\b(sqrt|pow|floor|ceil|fabs|sin|cos|tan)\s*\(/.test(m) && !/#\s*include\s*<math\.h>/.test(code)) out.push(I('error', file, 1, 'Falta #include <math.h>', 'Usas funciones matemáticas (' + q('sqrt') + ', ' + q('pow') + '...) sin incluir ' + q('math.h') + '.', 'Agrega ' + q('#include <math.h>') + ' (y al compilar con gcc: ' + q('-lm') + ').'));
        if (/\bbool\b/.test(m) && !/#\s*include\s*<stdbool\.h>/.test(code)) out.push(I('warn', file, lineOf(m, m.search(/\bbool\b/)), 'bool necesita stdbool.h', 'En C el tipo ' + q('bool') + ' no existe sin ' + q('#include <stdbool.h>') + '.', 'Agrega ' + q('#include <stdbool.h>') + ' o usa ' + q('int') + ' (0 y 1).'));
        if (/\bstring\s+\w+\s*(=|;)/.test(m)) out.push(I('error', file, lineOf(m, m.search(/\bstring\s+\w+\s*(=|;)/)), 'C no tiene el tipo string', 'En C los textos son arreglos de caracteres: ' + q('char nombre[] = "Ana";') + '.', 'Cambia ' + q('string') + ' por ' + q('char nombre[]') + ' (o ' + q('char *nombre') + ').'));
        if (/\b(cout|cin|endl)\b|<<\s*"/.test(m)) out.push(I('error', file, lineOf(m, m.search(/\b(cout|cin|endl)\b|<<\s*"/)), 'Eso es C++, no C', q('cout') + ' y ' + q('<<') + ' pertenecen a C++. En C se usa ' + q('printf') + '.', 'Escribe ' + q('printf("texto\\n");') + '.'));
      } else {
        if (/\b(cout|cin|cerr|endl)\b/.test(m) && !/#\s*include\s*<iostream>/.test(code)) out.push(I('error', file, 1, 'Falta #include <iostream>', 'Usas ' + q('cout') + '/' + q('cin') + ' sin incluir la biblioteca de entrada y salida.', 'Agrega al inicio: ' + q('#include <iostream>') + '.'));
        if (/(^|[^:\w])(cout|cin|cerr|endl|string|vector|getline)\b/.test(m.replace(/std::\w+/g, '')) && !/using\s+namespace\s+std\s*;/.test(code) && /(^|[^:\w.])(cout|cin|endl)\b/.test(m.replace(/std::\w+/g, ''))) out.push(I('error', file, lineOf(m, m.search(/(^|[^:\w.])(cout|cin|endl)\b/)), 'Falta std:: o using namespace std', q('cout') + ', ' + q('cin') + ' y ' + q('endl') + ' viven en el espacio de nombres ' + q('std') + '.', 'Escribe ' + q('using namespace std;') + ' después de los #include, o usa ' + q('std::cout') + '.'));
        if (/\bcout\s*>>|\bcin\s*<</.test(m)) out.push(I('error', file, lineOf(m, m.search(/\bcout\s*>>|\bcin\s*<</)), 'Operador al revés', q('cout') + ' usa ' + q('<<') + ' (sale hacia la pantalla) y ' + q('cin') + ' usa ' + q('>>') + ' (entra a la variable).', 'Escribe ' + q('cout << x;') + ' y ' + q('cin >> x;') + '.'));
        if (/\bvector\s*</.test(m) && !/#\s*include\s*<vector>/.test(code)) out.push(I('error', file, 1, 'Falta #include <vector>', 'Usas ' + q('vector') + ' sin incluir su biblioteca.', 'Agrega ' + q('#include <vector>') + '.'));
        if (/\bstring\s+\w+/.test(m) && !/#\s*include\s*<(string|iostream)>/.test(code)) out.push(I('error', file, 1, 'Falta #include <string>', 'Usas el tipo ' + q('string') + ' sin incluir su biblioteca.', 'Agrega ' + q('#include <string>') + '.'));
        var cl = /\b(class|struct)\s+\w+[^;{]*\{/g, cm;
        while ((cm = cl.exec(m))) { var op = cm.index + cm[0].length - 1, d = 0, k; for (k = op; k < m.length; k++) { if (m[k] === '{') d++; else if (m[k] === '}') { d--; if (d === 0) break; } } if (k < m.length && !/^\s*[;\w*&]/.test(m.slice(k + 1, k + 6))) out.push(I('error', file, lineOf(m, k), 'Falta ; después de la clase', 'En C++ la llave que cierra una ' + q(cm[1]) + ' debe ir seguida de punto y coma: ' + q('};') + '.', 'Escribe ' + q('};') + '.')); }
      }
      if (/\bmain\s*\(/.test(m) === false && /#\s*include/.test(code)) out.push(I('warn', file, 0, 'No encuentro main()', 'Todo programa en ' + (cpp ? 'C++' : 'C') + ' empieza en la función ' + q('main') + '.', 'Escribe ' + q('int main() { ... return 0; }') + '.'));
      if (/\bvoid\s+main\s*\(/.test(m)) out.push(I('warn', file, lineOf(m, m.search(/\bvoid\s+main/)), 'main debería devolver int', 'El estándar pide ' + q('int main()') + ' y terminar con ' + q('return 0;') + '.', 'Cambia ' + q('void main') + ' por ' + q('int main') + '.'));
    }
    eachLine(m, function (ln, no) {
      var t = ln.trim();
      if (/\b(if|while)\s*\([^()=!<>]*[^=!<>]=(?!=)[^()=]*\)/.test(t) && !/\bfor\b/.test(t)) out.push(I('error', file, no, 'Usaste = dentro de la condición', 'Un solo ' + q('=') + ' guarda un valor; para comparar se usa ' + q('==') + '. Con ' + q('=') + ' la condición casi siempre da verdadero.', 'Cambia ' + q('=') + ' por ' + q('==') + '.'));
      if (/\b(int|long|short|float|double|char|bool)\s+\w+\s*=\s*"/.test(t)) out.push(I('error', file, no, 'No puedes guardar un texto ahí', 'Estás guardando un texto entre comillas dobles en una variable numérica o de un solo carácter.', cpp ? 'Para textos usa ' + q('string nombre = "Ana";') + '.' : 'Para textos usa ' + q('char nombre[] = "Ana";') + '. Para un solo carácter usa comillas simples: ' + q("char c = 'a';") + '.'));
      if ((((code.split('\n')[no - 1] || '').replace(/"(?:[^"\\]|\\.)*"/g, '""').match(/'(?:[^'\\]|\\.)*'/g)) || []).some(function (c) { return /^'[^'\\]{2,}'$/.test(c); })) out.push(I('error', file, no, 'Comillas simples con más de una letra', 'Las comillas simples ' + q("'a'") + ' son para <b>un solo carácter</b>. Los textos van con comillas dobles.', 'Usa ' + q('"hola"') + '.'));
      if (!cpp) { var sm = /\bscanf\s*\(\s*"[^"]*%[dfi][^"]*"\s*,\s*([A-Za-z_]\w*)\s*\)/.exec(code.split('\n')[no - 1] || ''); if (sm) out.push(I('error', file, no, 'scanf necesita &', q('scanf') + ' debe recibir la <b>dirección</b> de la variable: ' + q('&' + sm[1]) + '. Sin el ' + q('&') + ' el programa se cierra de golpe.', 'Escribe ' + q('scanf("%d", &' + sm[1] + ');') + '.')); }
      ln.replace(/(^|[^\w.>:])([A-Za-z_]\w*)\s*\(/g, function (a, pre, name) {
        if (defs[name] || C_FUNCS.indexOf(name) >= 0 || CTRL.test(name) || /^(sizeof|return|main|defined|catch|operator|new|delete|static_cast|dynamic_cast|if|for|while|switch)$/.test(name)) return a;
        var near = name.length >= 4 ? nearest(name, C_FUNCS, 1) : null;
        if (near) out.push(I('error', file, no, name + '() no existe', 'No existe ninguna función ' + q(name) + ' (ni de la biblioteca estándar ni definida por ti).', 'Quizá quisiste escribir ' + q(near + '()') + '. Los lenguajes C distinguen mayúsculas de minúsculas.'));
        return a;
      });
    });
    return out;
  }

  /* ======================= C# ======================= */
  var CS_MEMBERS = { Console: ['WriteLine', 'Write', 'ReadLine', 'ReadKey', 'Clear', 'Read'], Math: ['Abs', 'Sqrt', 'Pow', 'Round', 'Floor', 'Ceiling', 'Max', 'Min', 'PI', 'Sin', 'Cos'], String: ['Join', 'Format', 'IsNullOrEmpty', 'Concat'], Convert: ['ToInt32', 'ToDouble', 'ToString', 'ToBoolean'], DateTime: ['Now', 'Today', 'Parse'] };
  function lintCs(code, file, o) {
    var out = [], m = mask(code, 'cs');
    if (!o.fragment) out = out.concat(balance(code, 'cs', file)).concat(missingSemis(code, 'cs', file, o));
    if (!o.fragment && /\bConsole\./.test(m) && !/using\s+System\s*;/.test(m) && !/System\.Console/.test(m) && !/namespace/.test(m)) out.push(I('error', file, 1, 'Falta using System;', q('Console') + ' pertenece al espacio de nombres ' + q('System') + '.', 'Agrega al inicio ' + q('using System;') + ' (o escribe ' + q('System.Console.WriteLine') + ').'));
    if (!o.fragment && /\bList\s*</.test(m) && !/using\s+System\.Collections\.Generic\s*;/.test(m)) out.push(I('error', file, 1, 'Falta using System.Collections.Generic;', q('List<T>') + ' vive en ese espacio de nombres.', 'Agrega ' + q('using System.Collections.Generic;') + '.'));
    if (!o.fragment && !/\bMain\s*\(/.test(m) && /\bclass\b/.test(m)) out.push(I('warn', file, 0, 'No encuentro el método Main', 'Un programa de consola en C# empieza en ' + q('static void Main(string[] args)') + ' (a menos que uses instrucciones de nivel superior).', 'Agrega el método ' + q('static void Main()') + ' dentro de la clase.'));
    eachLine(m, function (ln, no) {
      var t = ln.trim();
      ln.replace(/\b(Console|Math|String|Convert|DateTime)\s*\.\s*(\w+)/g, function (a, ns, mem) {
        var list = CS_MEMBERS[ns];
        if (list.indexOf(mem) >= 0) return a;
        var lc = list.filter(function (x) { return x.toLowerCase() === mem.toLowerCase(); })[0], near = lc || nearest(mem, list, 2);
        out.push(I('error', file, no, ns + '.' + mem + ' no existe', 'En C# se distinguen mayúsculas y minúsculas: ' + q(ns + '.' + mem) + ' no existe.', near ? 'Quizá quisiste escribir ' + q(ns + '.' + near) + '.' : 'Los miembros de ' + q(ns) + ' son: ' + list.map(q).join(', ') + '.'));
        return a;
      });
      if (/\b(if|while)\s*\([^()=!<>]*[^=!<>]=(?!=)[^()=]*\)/.test(t)) out.push(I('error', file, no, 'Usaste = dentro de la condición', 'En C# ni siquiera compila si no es un bool. Para comparar se usa ' + q('==') + '.', 'Cambia ' + q('=') + ' por ' + q('==') + '.'));
      if (/\b(int|long|double|float|decimal|bool|char)\s+\w+\s*=\s*"/.test(t)) out.push(I('error', file, no, 'Tipo incorrecto', 'No puedes guardar un texto en una variable numérica, booleana o char. Los textos van en ' + q('string') + '.', 'Cambia el tipo a ' + q('string') + '.'));
      if (/\bstring\s+\w+\s*=\s*-?\d/.test(t)) out.push(I('error', file, no, 'Tipo incorrecto', 'Un ' + q('string') + ' guarda texto: el número va entre comillas ("5") o la variable debe ser ' + q('int') + '.', 'Usa ' + q('int') + ' para números.'));
      if (/\b(int|double|float|decimal|long)\s+\w+\s*=\s*Console\.ReadLine\s*\(\s*\)/.test(t)) out.push(I('error', file, no, 'ReadLine devuelve texto', q('Console.ReadLine()') + ' siempre entrega un <b>string</b>.', 'Conviértelo: ' + q('int n = int.Parse(Console.ReadLine());') + '.'));
      if (/\bforeach\s*\(\s*\w+\s+in\b/.test(t) && !/\bforeach\s*\(\s*(var|[\w<>\[\]?]+)\s+\w+\s+in\b/.test(t)) out.push(I('error', file, no, 'foreach necesita el tipo', 'La forma es ' + q('foreach (var item in lista)') + ': primero el tipo (o var) y luego el nombre.', 'Escribe ' + q('foreach (var x in lista)') + '.'));
      if (/\bConsole\.(println|print|log)\b/i.test(t) && !/WriteLine/.test(t)) out.push(I('error', file, no, 'En C# se escribe Console.WriteLine', 'Eso es de otro lenguaje. En C# se muestra con ' + q('Console.WriteLine(...)') + '.', 'Usa ' + q('Console.WriteLine("hola");') + '.'));
    });
    return out;
  }

  /* ======================= Java ======================= */
  var JAVA_OUT = ['println', 'print', 'printf', 'format', 'flush', 'write'];
  function lintJava(code, file, o) {
    var out = [], m = mask(code, 'java');
    if (!o.fragment) out = out.concat(balance(code, 'java', file)).concat(missingSemis(code, 'java', file, o));
    if (!o.fragment && /\bclass\b/.test(m) && !/\bmain\s*\(/.test(m) && !/\binterface\b|\brecord\b|\benum\b/.test(m)) out.push(I('warn', file, 0, 'No encuentro el método main', 'Un programa Java empieza en ' + q('public static void main(String[] args)') + '. Sin él, la máquina virtual no sabe por dónde empezar.', 'Agrega el método ' + q('public static void main(String[] args) { ... }') + ' dentro de la clase.'));
    if (!o.fragment && /\b(List|ArrayList|Map|HashMap|Set|HashSet|Scanner|Optional|Arrays|Collectors)\b/.test(m) && !/^\s*import\s/m.test(m) && !/java\.util\./.test(m)) out.push(I('error', file, 1, 'Falta un import', 'Usas una clase de ' + q('java.util') + ' (como List, ArrayList o Scanner) sin importarla.', 'Agrega al inicio, por ejemplo, ' + q('import java.util.*;') + '.'));
    eachLine(m, function (ln, no) {
      var t = ln.trim();
      ln.replace(/\bSystem\s*\.\s*out\s*\.\s*(\w+)/g, function (a, mem) {
        if (JAVA_OUT.indexOf(mem) >= 0) return a;
        var lc = JAVA_OUT.filter(function (x) { return x.toLowerCase() === mem.toLowerCase(); })[0], near = lc || nearest(mem, JAVA_OUT, 2);
        out.push(I('error', file, no, 'System.out.' + mem + ' no existe', 'Java distingue mayúsculas y minúsculas: ' + q('System.out.' + mem) + ' no existe.', near ? 'Quizá quisiste escribir ' + q('System.out.' + near) + '.' : 'Los métodos habituales son ' + JAVA_OUT.slice(0, 3).map(q).join(', ') + '.'));
        return a;
      });
      if (/\bsystem\s*\.\s*out\b|\bSystem\s*\.\s*Out\b/.test(t)) out.push(I('error', file, no, 'Se escribe System.out', 'En Java se escribe ' + q('System.out.println(...)') + ' con la S de System en mayúscula y out en minúscula.', 'Usa ' + q('System.out.println("hola");') + '.'));
      if (/\bstring\s+\w+\s*[=;)]/.test(t) || /\(\s*string\s+\w+/.test(t)) out.push(I('error', file, no, 'String lleva mayúscula', 'En Java el tipo de los textos es ' + q('String') + ' (clase, con mayúscula), no ' + q('string') + '.', 'Cambia ' + q('string') + ' por ' + q('String') + '.'));
      if (/\b(if|while)\s*\([^()=!<>]*[^=!<>]=(?!=)[^()=]*\)/.test(t)) out.push(I('error', file, no, 'Usaste = dentro de la condición', 'Un solo ' + q('=') + ' asigna; para comparar se usa ' + q('==') + ' (o ' + q('.equals') + ' en textos).', 'Cambia ' + q('=') + ' por ' + q('==') + '.'));
      if (/\b(int|long|double|float|boolean|char)\s+\w+\s*=\s*"/.test(t)) out.push(I('error', file, no, 'Tipo incorrecto', 'No puedes guardar un texto en una variable numérica, boolean o char. Los textos van en ' + q('String') + '.', 'Cambia el tipo a ' + q('String') + '.'));
      if (/\bString\s+\w+\s*=\s*-?\d/.test(t)) out.push(I('error', file, no, 'Tipo incorrecto', 'Un ' + q('String') + ' guarda texto: el número va entre comillas ("5") o la variable debe ser ' + q('int') + '.', 'Usa ' + q('int') + ' para números.'));
      if (/==\s*"|"\s*==/.test(t) || /!=\s*"/.test(t)) out.push(I('warn', file, no, 'Comparar textos con ==', 'Con ' + q('==') + ' Java compara si son <b>el mismo objeto</b>, no si dicen lo mismo, y puede dar ' + q('false') + ' aunque el texto sea igual.', 'Usa ' + q('a.equals(b)') + '.'));
      if (/\bfor\s*\(\s*(?:\w+(?:<[^>]*>)?\s+)?\w+\s+in\b/.test(t)) out.push(I('error', file, no, 'El for mejorado usa ":"', 'En Java se escribe ' + q('for (String s : lista)') + ', con dos puntos (no ' + q('in') + ').', 'Cambia ' + q('in') + ' por ' + q(':') + '.'));
      if (/\bConsole\.(WriteLine|Write)\b|\bconsole\.log\b|^print\s*\(/.test(t)) out.push(I('error', file, no, 'Eso no es Java', 'En Java se muestra texto con ' + q('System.out.println(...)') + '.', 'Usa ' + q('System.out.println("hola");') + '.'));
    });
    return out;
  }

  /* ======================= PHP ======================= */
  var PHP_FUNCS = 'strlen strtoupper strtolower ucfirst ucwords str_replace str_repeat strpos substr trim count array_push array_pop array_merge array_keys array_values array_sum in_array sort rsort asort ksort implode explode isset empty unset date time rand mt_rand round floor ceil abs sqrt pow max min number_format var_dump print_r json_encode json_decode file_get_contents htmlspecialchars is_numeric is_array is_string intval floatval strval sprintf printf define array_map array_filter usort range arsort asort ksort krsort rsort usort uasort uksort array_slice array_splice array_merge array_unique array_reverse array_search array_flip array_combine array_fill array_column array_chunk array_diff array_intersect array_key_exists array_key_first array_key_last array_pop array_push array_shift array_unshift array_product range compact extract str_contains str_starts_with str_ends_with str_pad str_repeat str_word_count ucwords lcfirst wordwrap nl2br htmlspecialchars html_entity_decode strcmp strcasecmp strncmp strstr stripos strrpos substr_count substr_replace similar_text levenshtein sprintf vsprintf number_format intdiv fmod abs ceil floor round max min sqrt pow pi json_encode json_decode json_last_error_msg date time mktime strtotime checkdate date_default_timezone_set filter_var file_put_contents file_get_contents file fopen fgets fgetcsv fputcsv fclose fwrite feof file_exists is_file is_dir mkdir unlink rename copy basename dirname pathinfo realpath var_dump print_r var_export gettype get_class is_int is_string is_array is_numeric is_null is_bool intval floatval strval boolval settype method_exists property_exists class_exists function_exists spl_autoload_register password_hash password_verify md5 sha1 hash random_int mt_rand rand uniqid usleep sleep microtime memory_get_usage array_is_list iterator_to_array call_user_func call_user_func_array func_get_args'.split(' ');
  function lintPhp(code, file, o) {
    var out = [], m = mask(code, 'php');
    if (!o.fragment) out = out.concat(balance(code, 'php', file)).concat(missingSemis(code, 'php', file, o));
    if (!o.fragment && !/<\?php|<\?=/.test(code)) out.push(I('warn', file, 1, 'Falta <?php al inicio', 'El código PHP debe ir dentro de ' + q('<?php ... ?>') + '; sin la etiqueta de apertura el servidor lo muestra como texto.', 'Escribe ' + q('<?php') + ' en la primera línea.'));
    var defs = {}; (m + (o.context ? '\n' + o.context : '')).replace(/\bfunction\s+(\w+)/g, function (a, n) { defs[n] = 1; return a; });
    eachLine(m, function (ln, no) {
      var t = ln.trim();
      if (/^[A-Za-z_]\w*\s*=(?![=>])/.test(t) && !/^(define|const|public|private|protected|static|var|use|namespace|class)\b/.test(t)) out.push(I('error', file, no, 'La variable necesita $', 'En PHP todas las variables empiezan con ' + q('$') + ': ' + q('$' + t.split('=')[0].trim()) + '.', 'Escribe ' + q('$' + t.replace(/;$/, '') + ';') + '.'));
      if (/\b(echo|print)\b[^;]*"[^"]*"\s*\+\s*(\$|")/.test(t) || /(\$\w+|")\s*\+\s*"/.test(t.replace(/\d+\s*\+\s*\d+/g, ''))) out.push(I('error', file, no, 'En PHP se concatena con punto', 'El operador ' + q('+') + ' suma números. Para unir textos PHP usa el <b>punto</b> ' + q('.') + '.', 'Escribe ' + q('"Hola " . $nombre') + '.'));
      if (/\b(if|while|elseif)\s*\([^()=!<>]*[^=!<>]=(?!=)[^()=]*\)/.test(t)) out.push(I('error', file, no, 'Usaste = dentro de la condición', 'Un solo ' + q('=') + ' asigna; para comparar se usa ' + q('==') + ' o ' + q('===') + '.', 'Cambia ' + q('=') + ' por ' + q('==') + '.'));
      if (/\belif\b|\belse\s+if\b/.test(t) && /\belif\b/.test(t)) out.push(I('error', file, no, 'En PHP es elseif', q('elif') + ' es de Python. En PHP se escribe ' + q('elseif') + ' (o ' + q('else if') + ').', 'Cambia ' + q('elif') + ' por ' + q('elseif') + '.'));
      if (/\$\w+\.[A-Za-z_]/.test(t)) out.push(I('warn', file, no, 'Acceso con -> y no con .', 'Para leer una propiedad de un objeto PHP usa la flecha ' + q('->') + ' (' + q('$obj->nombre') + '). El punto sirve para unir textos.', 'Cambia el punto por ' + q('->') + '.'));
      if (/\bvar_dump\s*\(|\bprint_r\s*\(/.test(t) === false && /\bprintln\b|\bconsole\.log\b|\bSystem\.out/.test(t)) out.push(I('error', file, no, 'Eso no es PHP', 'En PHP se muestra texto con ' + q('echo') + '.', 'Escribe ' + q('echo "hola";') + '.'));
      ln.replace(/(^|[^\w$>:.])([A-Za-z_]\w*)\s*\(/g, function (a, pre, name) {
        if (defs[name] || PHP_FUNCS.indexOf(name) >= 0 || /^(if|elseif|while|for|foreach|switch|function|array|list|echo|print|isset|empty|unset|die|exit|return|catch|fn|match|include|require|include_once|require_once|new)$/.test(name)) return a;
        var near = name.length >= 4 ? nearest(name, PHP_FUNCS, 1) : null;
        if (near) out.push(I('error', file, no, name + '() no existe', 'PHP no tiene una función llamada ' + q(name) + '.', 'Quizá quisiste escribir ' + q(near + '()') + '.'));
        return a;
      });
    });
    return out;
  }

  /* ======================= entrada ======================= */
  JT.lintLang = function (lang, code, opts) {
    opts = opts || {};
    var file = lang, out = [];
    if (!code || !String(code).trim()) return out;
    try {
      if (lang === 'py') out = lintPy(code, file, opts);
      else if (lang === 'sql') out = lintSql(code, file, opts);
      else if (lang === 'php') out = lintPhp(code, file, opts);
      else if (lang === 'c') out = lintC(code, file, opts, 'c');
      else if (lang === 'cpp') out = lintC(code, file, opts, 'cpp');
      else if (lang === 'cs') out = lintCs(code, file, opts);
      else if (lang === 'java') out = lintJava(code, file, opts);
      else if (lang === 'dart' || lang === 'kt' || lang === 'swift') out = opts.fragment ? [] : balance(code, lang, file);
      else if (lang === 'tsc' || lang === 'jsx' || lang === 'node') out = opts.fragment ? [] : JT.checkBrackets(code, lang, 'js');
    } catch (e) { /* un fallo del revisor nunca debe romper la página */ }
    var seen = {}, rank = { error: 0, warn: 1, info: 2 };
    out = out.filter(function (x) { var k = x.sev + x.line + x.title; if (seen[k]) return false; seen[k] = 1; return true; });
    out.sort(function (a, b) { return rank[a.sev] - rank[b.sev] || (a.line || 999) - (b.line || 999); });
    return out;
  };
})();
