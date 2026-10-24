/* js-trick :: "terminal" para Python, SQL, PHP, C, C++ y C#
   - Python y SQL se ejecutan de verdad en el navegador (Pyodide y sql.js, se descargan una vez).
   - Si el código es igual al del ejemplo se muestra su salida esperada al instante.
   - C, C++, C# y PHP pueden ejecutarse en línea (opcional, con tu permiso) en un servicio público gratuito. */
(function () {
  var JT = window.JT, esc = JT.esc;
  var T = JT.term = { py: null, sqlLib: null };
  var PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
  var SQLJS = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/';
  var JUDGE = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';
  var JUDGE_IDS = { py: 100, c: 103, cpp: 105, cs: 51, php: 98, tsc: 74, node: 63, kt: 78, swift: 83, java: 62 };
  var CMD = { py: 'python main.py', sql: 'sqlite3 escuela.db < consulta.sql', php: 'php index.php', c: 'gcc main.c -o main && ./main', cpp: 'g++ main.cpp -o main && ./main', cs: 'dotnet run', java: 'javac Main.java && java Main', tsc: 'npx tsx index.ts', jsx: 'npm run dev', node: 'node index.js', dart: 'flutter run -d chrome', kt: 'kotlinc Main.kt -include-runtime -d main.jar && java -jar main.jar', swift: 'swift main.swift' };
  var NAMES = { py: 'Python', sql: 'SQL', php: 'PHP', c: 'C', cpp: 'C++', cs: 'C#', java: 'Java', tsc: 'TypeScript', jsx: 'React', node: 'Node.js', dart: 'Flutter', kt: 'Kotlin', swift: 'Swift' };

  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res;
      s.onerror = function () { rej(new Error('No se pudo descargar ' + src + '. ¿Tienes conexión a internet?')); };
      document.head.appendChild(s);
    });
  }

  /* ---------------- Python (Pyodide) ---------------- */
  T.python = function (code, stdin) {
    var out = [];
    return Promise.resolve().then(function () {
      if (T.py) return T.py;
      return (window.loadPyodide ? Promise.resolve() : loadScript(PYODIDE + 'pyodide.js')).then(function () { return window.loadPyodide({ indexURL: PYODIDE }); }).then(function (py) { T.py = py; return py; });
    }).then(function (py) {
      py.setStdout({ batched: function (s) { out.push(s); } });
      py.setStderr({ batched: function (s) { out.push(s); } });
      var g = py.globals.get('dict')();
      g.set('__jt_inputs', py.toPy(stdin || []));
      return py.runPythonAsync("import builtins\ndef __jt_input(prompt=''):\n    v = __jt_inputs.pop(0) if __jt_inputs else '1'\n    print(str(prompt) + str(v))\n    return str(v)\nbuiltins.input = __jt_input\n", { globals: g }).then(function () {
        /* Pyodide ya tiene un bucle de eventos en marcha: asyncio.run(f()) se ejecuta como "await f()" (mismo resultado, mismas líneas) */
        return py.runPythonAsync(code.replace(/\basyncio\.run\((.*)\)[ \t]*$/gm, 'await $1'), { globals: g });
      }).then(function () { return { ok: true, text: out.join('\n') }; }, function (e) {
        var msg = String(e.message || e), last = msg.trim().split('\n').pop(), tm = /^(\w+(?:Error|Exception|Interrupt|Exit)?):\s*(.*)$/.exec(last), ln = /File "<exec>", line (\d+)/g, lm, line = 0;
        while ((lm = ln.exec(msg))) line = +lm[1];
        if (!line) { var sm = /line (\d+)/.exec(msg); if (sm) line = +sm[1]; }
        return { ok: false, text: out.join('\n'), error: { type: tm ? tm[1] : 'Error', message: tm ? tm[2] : last, line: line, raw: msg } };
      });
    });
  };

  /* ---------------- SQL (sql.js) ---------------- */
  function asciiTable(cols, rows) {
    var w = cols.map(function (c, i) { var m = String(c).length; rows.forEach(function (r) { m = Math.max(m, String(r[i] == null ? 'NULL' : r[i]).length); }); return m; });
    var line = function (cells) { return cells.map(function (c, i) { return String(c == null ? 'NULL' : c) + new Array(w[i] - String(c == null ? 'NULL' : c).length + 1).join(' '); }).join(' | '); };
    var out = [line(cols), w.map(function (n) { return new Array(n + 1).join('-'); }).join('-+-')];
    rows.forEach(function (r) { out.push(line(r)); });
    out.push('(' + rows.length + (rows.length === 1 ? ' fila)' : ' filas)'));
    return out.join('\n');
  }
  T.sql = function (code, seed) {
    return Promise.resolve().then(function () {
      if (T.sqlLib) return T.sqlLib;
      return (window.initSqlJs ? Promise.resolve() : loadScript(SQLJS + 'sql-wasm.js')).then(function () { return window.initSqlJs({ locateFile: function (f) { return SQLJS + f; } }); }).then(function (S) { T.sqlLib = S; return S; });
    }).then(function (S) {
      var db = new S.Database(), parts = [];
      try {
        if (seed) db.exec(seed);
        var res = db.exec(code);
        res.forEach(function (r) { parts.push(asciiTable(r.columns, r.values)); });
        var changed = db.getRowsModified();
        if (!parts.length) parts.push('Sentencias ejecutadas correctamente' + (changed ? ' (' + changed + ' fila' + (changed === 1 ? '' : 's') + ' afectada' + (changed === 1 ? '' : 's') + ')' : '') + '.\nTip: termina con un SELECT para ver cómo quedaron los datos.');
        db.close();
        return { ok: true, text: parts.join('\n\n') };
      } catch (e) {
        db.close();
        return { ok: false, text: parts.join('\n\n'), error: { type: 'SQLError', message: String(e.message || e), line: 0 } };
      }
    });
  };

  /* ---------------- C, C++, C#, PHP (en línea, opcional) ---------------- */
  T.judge = function (lang, code) {
    var id = JUDGE_IDS[lang];
    if (!id) return Promise.reject(new Error('Ese lenguaje no se puede ejecutar en línea.'));
    if (!JT.state.judgeOk) {
      if (!confirm('Para ejecutar ' + NAMES[lang] + ' de verdad, js-trick enviará tu código a un servicio público y gratuito de ejecución (ce.judge0.com). Solo se envía el código de este editor. Puede tardar hasta 30 segundos.\n\n¿Permitir?')) return Promise.resolve({ ok: false, cancelled: true, text: 'Ejecución en línea cancelada.' });
      JT.state.judgeOk = 1; JT.saveState();
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(function () { ctrl && ctrl.abort(); }, 60000);
    return fetch(JUDGE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language_id: id, source_code: code, stdin: '' }), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { clearTimeout(to); return r.json(); })
      .then(function (d) {
        var st = d.status ? d.status.id : 0;
        if (st === 3) return { ok: true, text: d.stdout || '(el programa no escribió nada)' };
        var raw = d.compile_output || d.stderr || d.message || (d.status && d.status.description) || 'Error desconocido';
        return { ok: false, text: d.stdout || '', error: { type: st === 6 ? 'CompileError' : st === 5 ? 'Timeout' : 'RuntimeError', message: String(raw).trim(), line: lineFromCompile(raw), raw: raw } };
      }, function (e) { clearTimeout(to); throw new Error('No se pudo contactar al servicio de ejecución (' + (e.name === 'AbortError' ? 'tardó demasiado' : 'sin conexión o servicio ocupado') + ').'); });
  };
  function lineFromCompile(raw) { var m = /(?:main\.\w+|prog\.\w+|Main\.cs|Main\.java|script\.\w+|\.php)[:(](\d+)/.exec(String(raw)) || /line (\d+)/i.exec(String(raw)) || /\((\d+),\d+\)/.exec(String(raw)); return m ? +m[1] : 0; }

  /* ---------------- ejecución según el caso ---------------- */
  T.canOnline = function (lang) { return !!JUDGE_IDS[lang]; };
  T.exec = function (spec) {
    var lang = spec.lang, code = (spec.files || {})[lang] || '', same = spec.original != null && JT.norm(code) === JT.norm(spec.original);
    if (spec.partial) return Promise.resolve({ status: 'partial', text: '', note: 'Todavía no terminaste el programa: sigue con los pasos y aquí verás su resultado.' });
    if (spec.online && lang !== 'sql') return T.judge(lang, code).then(function (r) { return Object.assign({ status: r.cancelled ? 'cancelled' : 'online' }, r); }, function (e) { return { status: 'neterr', ok: false, text: '', note: e.message }; });
    if (same && spec.expected != null && !spec.online) return Promise.resolve({ status: 'expected', ok: true, text: spec.expected });
    if (lang === 'py') return T.python(code, spec.stdin).then(function (r) { r.status = 'real'; return r; }, function (e) { return { status: 'neterr', ok: false, text: '', note: e.message + ' Python necesita descargar su intérprete (unos MB, una sola vez).' }; });
    if (lang === 'sql') return T.sql(code, spec.seed).then(function (r) { r.status = 'real'; return r; }, function (e) { return { status: 'neterr', ok: false, text: '', note: e.message + ' SQL necesita descargar su motor (una sola vez).' }; });
    return Promise.resolve({ status: 'changed', ok: false, text: '', note: 'Modificaste el código. ' + NAMES[lang] + ' no se puede ejecutar dentro de la página sin un compilador; revisé la sintaxis (mira el cuadro de errores) y puedes pulsar <b>Ejecutar en línea</b> para correrlo de verdad en un servicio externo.' });
  };

  /* ---------------- documento de la pantalla ---------------- */
  T.doc = function (res, lang) {
    var badge = { expected: ['Salida esperada del ejemplo', '#98c379'], real: ['Ejecutado en tu navegador', '#61afef'], online: ['Ejecutado en línea', '#c678dd'], changed: ['Código modificado', '#e5c07b'], partial: ['Programa incompleto', '#e5c07b'], neterr: ['Sin conexión', '#e06c75'], cancelled: ['Cancelado', '#e5c07b'], loading: ['Ejecutando...', '#8c93a6'] }[res.status] || ['', '#8c93a6'];
    var body = res.text ? '<pre class="' + (res.ok === false ? 'err' : '') + '">' + esc(res.text) + '</pre>' : '';
    if (res.error && !res.text) body = '<pre class="err">' + esc(res.error.type + ': ' + res.error.message) + '</pre>';
    else if (res.error) body += '<pre class="err">' + esc(res.error.type + ': ' + res.error.message) + '</pre>';
    var note = res.note ? '<p class="note">' + res.note + '</p>' : '';
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%}body{background:#14171c;color:#d7dae0;font:13px/1.6 "Cascadia Code",Consolas,"Courier New",monospace;padding:0}' +
      '.bar{display:flex;gap:6px;align-items:center;padding:8px 12px;background:#1d2128;border-bottom:1px solid #2c3140;position:sticky;top:0}.bar i{width:10px;height:10px;border-radius:50%;background:#e06c75}.bar i:nth-child(2){background:#e5c07b}.bar i:nth-child(3){background:#98c379}.bar span{margin-left:auto;font:600 11px "Segoe UI",sans-serif;color:' + badge[1] + ';border:1px solid ' + badge[1] + ';border-radius:99px;padding:1px 9px}' +
      '.cmd{padding:10px 14px 0;color:#7f8794}.cmd b{color:#98c379}pre{margin:0;padding:6px 14px 14px;white-space:pre-wrap;word-break:break-word}pre.err{color:#f5a8af}.note{margin:8px 14px;color:#f1dba4;font:13px/1.5 "Segoe UI",sans-serif}b{font-weight:700}' +
      '.cur{display:inline-block;width:8px;height:15px;background:#d7dae0;vertical-align:-3px;animation:b 1s steps(1) infinite}@keyframes b{50%{opacity:0}}</style></head><body>' +
      '<div class="bar"><i></i><i></i><i></i><span>' + badge[0] + '</span></div><div class="cmd"><b>$</b> ' + esc(CMD[lang] || '') + '</div>' + body + note + (res.status === 'loading' ? '<pre><span class="cur"></span></pre>' : '') + '</body></html>';
  };

  /* ---------------- explicación de errores (en español) ---------------- */
  function c(s) { return '<code>' + esc(s) + '</code>'; }
  T.explain = function (lang, err) {
    var type = err.name || err.type || '', msg = String(err.message || '').trim(), m;
    var first = msg.split('\n')[0];
    if (lang === 'py') {
      if (/SyntaxError|IndentationError|TabError/.test(type + msg)) {
        if (/expected ':'/.test(msg)) return { title: 'Falta ":"', msg: 'Una línea que abre un bloque (' + c('if') + ', ' + c('for') + ', ' + c('def') + '...) debe terminar con dos puntos.', fix: 'Agrega ' + c(':') + ' al final de esa línea.' };
        if (/expected an indented block|IndentationError/.test(msg)) return { title: 'Falta sangría', msg: 'Después de una línea que termina en ' + c(':') + ' el bloque debe ir con sangría (4 espacios).', fix: 'Agrega 4 espacios al inicio de las líneas del bloque.' };
        if (/unmatched|was never closed|unexpected EOF|closing parenthesis/.test(msg)) return { title: 'Paréntesis sin cerrar o sobrante', msg: esc(first), fix: 'Cuenta los paréntesis ' + c('( )') + ', corchetes ' + c('[ ]') + ' y llaves ' + c('{ }') + ': cada uno debe tener su pareja.' };
        if (/unterminated string|EOL while/.test(msg)) return { title: 'Comillas sin cerrar', msg: 'Abriste un texto con comillas y no lo cerraste en esa línea.', fix: 'Cierra el texto con la misma comilla.' };
        if (/Missing parentheses in call to 'print'/.test(msg)) return { title: 'print necesita paréntesis', msg: 'En Python 3 ' + c('print') + ' es una función.', fix: 'Escribe ' + c('print("hola")') + '.' };
        if (/invalid syntax/.test(msg)) return { title: 'Sintaxis inválida', msg: 'Python no entiende esa línea: ' + esc(first) + '. Suele faltar un operador, una coma, dos puntos o hay una palabra de más.', fix: 'Revisa esa línea y también la anterior.' };
        return { title: 'Error de sintaxis', msg: esc(first), fix: 'Revisa paréntesis, comillas y dos puntos.' };
      }
      if ((m = /name '(\w+)' is not defined/.exec(msg))) return { title: 'No existe "' + m[1] + '"', msg: 'Usas ' + c(m[1]) + ' pero no la creaste antes (o la escribiste distinto: Python distingue mayúsculas).', fix: 'Asigna un valor antes de usarla: ' + c(m[1] + ' = ...') + ', o corrige el nombre.' };
      if (/ZeroDivisionError/.test(type + msg)) return { title: 'División entre cero', msg: 'No se puede dividir entre 0.', fix: 'Comprueba que el divisor no sea 0 antes de dividir.' };
      if (/IndexError/.test(type)) return { title: 'Posición fuera de la lista', msg: 'Pediste una posición que no existe en la lista (las posiciones empiezan en 0).', fix: 'Usa posiciones entre 0 y ' + c('len(lista) - 1') + '.' };
      if (/KeyError/.test(type)) return { title: 'Clave inexistente', msg: 'El diccionario no tiene la clave ' + esc(msg) + '.', fix: 'Revisa cómo la escribiste, o usa ' + c('dic.get(clave)') + '.' };
      if (/ValueError/.test(type)) return { title: 'Valor no válido', msg: esc(msg), fix: 'Por ejemplo, ' + c('int("abc")') + ' falla porque "abc" no es un número.' };
      if (/TypeError/.test(type)) {
        if (/can only concatenate str/.test(msg) || /unsupported operand type\(s\) for \+: 'int' and 'str'/.test(msg)) return { title: 'No puedes sumar número y texto', msg: 'Intentaste unir un número con un texto usando ' + c('+') + '.', fix: 'Convierte con ' + c('str(numero)') + ' o usa una f-string: ' + c('f"Edad: {edad}"') + '.' };
        return { title: 'Tipos incompatibles', msg: esc(msg), fix: 'Revisa qué tipo de dato (texto, número, lista) recibe cada operación.' };
      }
      if (/AttributeError/.test(type)) return { title: 'Ese objeto no tiene eso', msg: esc(msg), fix: 'Revisa el nombre del método o atributo (¿mayúsculas? ¿tipo equivocado?).' };
    }
    if (lang === 'sql') {
      if ((m = /near "([^"]+)": syntax error/.exec(msg))) return { title: 'Error de sintaxis cerca de "' + m[1] + '"', msg: 'SQL no entendió la sentencia justo en ' + c(m[1]) + '. Suele haber una palabra mal escrita, una coma de más o una parte que falta.', fix: 'Revisa esa zona y la palabra anterior.' };
      if ((m = /no such table: (\w+)/.exec(msg))) return { title: 'La tabla "' + m[1] + '" no existe', msg: 'Pides datos de una tabla que no está en esta base de datos.', fix: 'Revisa el nombre de la tabla (las tablas disponibles se listan en la descripción del ejemplo).' };
      if ((m = /no such column: ([\w.]+)/.exec(msg))) return { title: 'La columna "' + m[1] + '" no existe', msg: 'Esa columna no está en la tabla que consultas.', fix: 'Revisa su nombre o mira las columnas con ' + c('SELECT * FROM tabla;') + '.' };
      if (/UNIQUE constraint failed|PRIMARY KEY/.test(msg)) return { title: 'Valor repetido', msg: 'Estás insertando un valor que debe ser único (por ejemplo un id que ya existe).', fix: 'Cambia el id o deja que se genere solo.' };
      if (/NOT NULL constraint failed/.test(msg)) return { title: 'Falta un dato obligatorio', msg: esc(msg), fix: 'Agrega un valor para esa columna.' };
      if (/incomplete input/.test(msg)) return { title: 'Sentencia incompleta', msg: 'La sentencia termina antes de tiempo.', fix: 'Falta cerrar paréntesis o comillas, o completar alguna cláusula.' };
    }
    if (lang === 'c' || lang === 'cpp') {
      if (/expected ['`‘]?;/.test(msg) || /expected ';'/.test(msg)) return { title: 'Falta ";"', msg: 'El compilador esperaba un punto y coma. ' + esc(first), fix: 'Agrega ' + c(';') + ' al final de la línea indicada (o de la anterior).' };
      if ((m = /['‘`]?(\w+)['’']? undeclared|use of undeclared identifier '(\w+)'|'(\w+)' was not declared/.exec(msg))) { var v = m[1] || m[2] || m[3]; return { title: '"' + v + '" no está declarada', msg: 'Usas ' + c(v) + ' sin declararla antes con su tipo (' + c('int') + ', ' + c('char') + '...).', fix: 'Declara la variable antes: ' + c('int ' + v + ' = 0;') + ' o corrige el nombre.' }; }
      if (/implicit declaration of function/.test(msg)) return { title: 'Falta un #include', msg: 'Usas una función de la biblioteca estándar sin incluir su archivo de cabecera.', fix: 'Agrega el ' + c('#include') + ' correspondiente (<stdio.h>, <stdlib.h>, <string.h>, <math.h>...).' };
      if (/undefined reference to/.test(msg)) return { title: 'Función sin definir', msg: esc(first), fix: 'Definiste mal el nombre de la función o falta enlazar la biblioteca (por ejemplo ' + c('-lm') + ' para math.h).' };
      if (/Segmentation fault|segfault/i.test(msg)) return { title: 'Acceso inválido a memoria', msg: 'El programa intentó leer o escribir donde no debía (índice fuera del arreglo, puntero nulo...).', fix: 'Revisa los índices de tus arreglos y que los punteros apunten a algo válido.' };
    }
    if (lang === 'cs') {
      if ((m = /error CS1002/.exec(msg))) return { title: 'Falta ";"', msg: 'El compilador esperaba un punto y coma.', fix: 'Agrega ' + c(';') + ' al final de la línea.' };
      if ((m = /error CS0103: The name '(\w+)' does not exist/.exec(msg))) return { title: '"' + m[1] + '" no existe', msg: 'Usas ' + c(m[1]) + ' sin declararla (o con otras mayúsculas).', fix: 'Declárala con su tipo: ' + c('int ' + m[1] + ' = 0;') + '.' };
      if (/CS0246/.test(msg)) return { title: 'Tipo o espacio de nombres no encontrado', msg: esc(first), fix: 'Falta un ' + c('using') + ' (por ejemplo ' + c('using System;') + ').' };
      if (/CS0029|CS0266/.test(msg)) return { title: 'Tipos incompatibles', msg: esc(first), fix: 'Convierte el valor (' + c('int.Parse(...)') + ', ' + c('Convert.ToInt32(...)') + ') o cambia el tipo de la variable.' };
    }
    if (lang === 'java') {
      if (/error: ';' expected/.test(msg)) return { title: 'Falta ";"', msg: 'El compilador esperaba un punto y coma.', fix: 'Agrega ' + c(';') + ' al final de la línea anterior a la que señala el error.' };
      if ((m = /cannot find symbol[\s\S]*?symbol:\s+(?:variable|method|class)\s+(\w+)/.exec(msg))) return { title: '"' + m[1] + '" no existe', msg: 'Usas ' + c(m[1]) + ' sin declararla, con otras mayúsculas o sin importar su clase.', fix: 'Declárala con su tipo, revisa mayúsculas (Java distingue ' + c('String') + ' de ' + c('string') + ') o agrega el ' + c('import') + ' que falte.' };
      if (/incompatible types/.test(msg)) return { title: 'Tipos incompatibles', msg: esc(first), fix: 'Convierte el valor (por ejemplo ' + c('Integer.parseInt(...)') + ' o un cast como ' + c('(int) x') + ') o cambia el tipo de la variable.' };
      if (/missing return statement/.test(msg)) return { title: 'Falta un return', msg: 'El método promete devolver un valor pero algún camino termina sin hacerlo.', fix: 'Agrega ' + c('return ...;') + ' en todos los caminos (o cambia el tipo a ' + c('void') + ').' };
      if (/should be declared in a file named/.test(msg)) return { title: 'La clase pública debe llamarse como el archivo', msg: esc(first), fix: 'Usa ' + c('public class Main') + ' en el archivo ' + c('Main.java') + '.' };
      if (/ArrayIndexOutOfBounds|StringIndexOutOfBounds/.test(msg)) return { title: 'Índice fuera de rango', msg: esc(first), fix: 'Los índices van de 0 a ' + c('length - 1') + '.' };
      if (/NullPointerException/.test(msg)) return { title: 'NullPointerException', msg: 'Usaste un objeto que vale ' + c('null') + '.', fix: 'Asegúrate de crearlo con ' + c('new') + ' o comprueba ' + c('if (x != null)') + ' antes de usarlo.' };
    }
    if (lang === 'php') {
      if (/Parse error|syntax error/.test(msg)) return { title: 'Error de sintaxis en PHP', msg: esc(first), fix: 'Casi siempre falta un ' + c(';') + ', unas comillas o un ' + c('$') + ' en una variable.' };
      if (/Undefined variable/.test(msg)) return { title: 'Variable no definida', msg: esc(first), fix: 'Asígnale un valor antes de usarla (y recuerda el ' + c('$') + ').' };
      if (/Call to undefined function/.test(msg)) return { title: 'Función inexistente', msg: esc(first), fix: 'Revisa el nombre de la función (¿ortografía?).' };
    }
    return { title: type && type !== 'Error' ? type : 'Error al ejecutar', msg: 'El sistema reportó: ' + c(first), fix: 'Lee la línea indicada y compara con el ejemplo. Usa el botón ? de esa línea para ver qué hace cada parte.' };
  };
})();
