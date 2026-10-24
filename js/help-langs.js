/* Xidecode :: explicación genérica de una línea para Python, SQL, PHP, C, C++ y C# (botón "?" del editor) */
(function () {
  var JT = window.JT, esc = JT.esc;
  function c(s) { return '<code>' + esc(s) + '</code>'; }
  var TYPES = { int: 'un número entero', float: 'un número con decimales', double: 'un número decimal (más preciso que float)', char: 'un solo carácter', long: 'un entero grande', bool: 'un valor verdadero/falso', string: 'un texto', decimal: 'un decimal exacto (ideal para dinero)', var: 'una variable cuyo tipo deduce el compilador' };
  function declC(t) {
    var m = /^(?:const\s+|static\s+|unsigned\s+)*(int|float|double|char|long|bool|string|decimal|var|size_t)\s+(\*?)(\w+)\s*(\[[^\]]*\])?\s*(?:=\s*(.*?))?\s*;?$/.exec(t);
    if (!m || /\(/.test(m[3])) return null;
    return 'Declara la variable ' + c(m[3]) + ' de tipo ' + c(m[1]) + ' (' + (m[4] ? 'un arreglo de ' : '') + (TYPES[m[1]] || 'un valor') + ')' + (m[5] ? ' y le guarda <code>' + esc(m[5].replace(/;$/, '')) + '</code>' : '') + '. En este lenguaje hay que decir el <b>tipo</b> de cada variable al crearla.';
  }
  JT.genericLang = function (text, f) {
    var t = text.trim(), m;
    if (!t) return null;
    var cm = f === 'py' ? /^#/ : f === 'sql' ? /^--/ : f === 'php' ? /^(\/\/|#|\/\*|\*)/ : /^(\/\/|\/\*|\*)/;
    if (cm.test(t)) return 'Es un <b>comentario</b>: texto para personas que el programa ignora por completo.';
    if (/^[}\]]\s*[;)]*$/.test(t)) return 'Cierra un bloque abierto antes con ' + c('{') + '. Cada llave que se abre necesita su cierre.';
    if (f === 'py') {
      if ((m = /^def\s+(\w+)\s*\(([^)]*)\)\s*:/.exec(t))) return 'Define la <b>función</b> ' + c(m[1]) + (m[2].trim() ? ' que recibe ' + c(m[2]) : ' sin parámetros') + '. Todo lo que va con sangría debajo es su cuerpo y se ejecuta cada vez que la llames.';
      if ((m = /^class\s+(\w+)/.exec(t))) return 'Define la <b>clase</b> ' + c(m[1]) + ': un molde para crear objetos con datos y comportamiento.';
      if ((m = /^for\s+(\w+)\s+in\s+(.*):/.exec(t))) return 'Bucle <code>for</code>: repite el bloque con sangría una vez por cada elemento de ' + c(m[2]) + ', guardando el elemento actual en ' + c(m[1]) + '.';
      if ((m = /^while\s+(.*):/.exec(t))) return 'Bucle <code>while</code>: repite el bloque mientras ' + c(m[1]) + ' sea verdadero.';
      if ((m = /^if\s+(.*):/.exec(t))) return 'Condición: si ' + c(m[1]) + ' es verdadera, se ejecuta el bloque con sangría.';
      if ((m = /^elif\s+(.*):/.exec(t))) return 'Otra condición: si las anteriores fueron falsas, se prueba ' + c(m[1]) + '.';
      if (/^else\s*:/.test(t)) return 'Lo que se ejecuta cuando ninguna condición anterior se cumplió.';
      if (/^(try)\s*:/.test(t)) return 'Intenta ejecutar el bloque; si ocurre un error, salta al ' + c('except') + ' en vez de romper el programa.';
      if ((m = /^except\b(.*):/.exec(t))) return 'Se ejecuta solo si hubo un error en el ' + c('try') + (m[1].trim() ? ' (del tipo ' + c(m[1].trim()) + ')' : '') + '.';
      if ((m = /^(?:from\s+(\S+)\s+)?import\s+(.*)/.exec(t))) return 'Trae ' + c(m[2]) + (m[1] ? ' del módulo ' + c(m[1]) : '') + ' para poder usarlo en este programa.';
      if ((m = /^return\b\s*(.*)/.exec(t))) return 'Termina la función y devuelve ' + (m[1] ? c(m[1]) : 'nada (None)') + ' a quien la llamó.';
      if ((m = /^print\s*\((.*)\)\s*$/.exec(t))) return 'Muestra en pantalla ' + c(m[1]) + '.';
      if ((m = /^(\w+)\s*(\+|-|\*|\/)?=\s*(.*)$/.exec(t))) return (m[2] ? 'Actualiza ' : 'Guarda en la variable ') + c(m[1]) + (m[2] ? ' sumándole/operando con ' : ' el valor ') + c(m[3]) + '. En Python no hace falta declarar el tipo: se deduce del valor.';
      return null;
    }
    if (f === 'sql') {
      var up = t.toUpperCase();
      if (/^SELECT\b/.test(up)) return 'Pide datos: después de ' + c('SELECT') + ' van las columnas que quieres ver (' + c('*') + ' significa todas).';
      if (/^FROM\b/.test(up)) return c('FROM') + ' dice de qué <b>tabla</b> se leen los datos.';
      if (/^WHERE\b/.test(up)) return c('WHERE') + ' filtra: solo se quedan las filas que cumplen la condición.';
      if (/^ORDER\s+BY\b/.test(up)) return c('ORDER BY') + ' ordena el resultado (' + c('ASC') + ' de menor a mayor, ' + c('DESC') + ' de mayor a menor).';
      if (/^GROUP\s+BY\b/.test(up)) return c('GROUP BY') + ' junta las filas que comparten un valor para poder resumirlas con COUNT, SUM, AVG...';
      if (/^HAVING\b/.test(up)) return c('HAVING') + ' filtra los <b>grupos</b> ya resumidos (WHERE filtra filas antes de agrupar).';
      if (/^LIMIT\b/.test(up)) return c('LIMIT') + ' recorta el resultado a las primeras filas.';
      if (/^(INNER\s+|LEFT\s+)?JOIN\b/.test(up)) return c('JOIN') + ' une dos tablas usando una columna que tienen en común (se indica con ' + c('ON') + ').';
      if (/^INSERT\b/.test(up)) return 'Agrega una fila nueva a la tabla con los valores indicados.';
      if (/^VALUES\b/.test(up)) return c('VALUES') + ' trae los datos de la fila que se va a guardar, en el mismo orden que las columnas.';
      if (/^UPDATE\b/.test(up)) return 'Modifica filas existentes. Con ' + c('SET') + ' se dice qué columnas cambian y con ' + c('WHERE') + ' cuáles filas.';
      if (/^DELETE\b/.test(up)) return 'Borra filas de la tabla (las que cumplan el ' + c('WHERE') + ').';
      if (/^CREATE\s+TABLE\b/.test(up)) return 'Crea una tabla nueva. Entre paréntesis van sus columnas con su tipo.';
      if (/^DROP\b/.test(up)) return 'Elimina la tabla completa con todos sus datos.';
      if (/^\w+\s+(INTEGER|INT|TEXT|REAL|VARCHAR|DATE|BOOLEAN)\b/.test(up)) return 'Define una columna: su nombre y el <b>tipo</b> de dato que guarda.';
      return null;
    }
    if (f === 'php') {
      if (/^<\?php/.test(t)) return 'Abre el bloque de código PHP. Todo lo que va después se ejecuta en el servidor.';
      if (/^\?>/.test(t)) return 'Cierra el bloque de PHP (en archivos que solo tienen PHP no hace falta).';
      if ((m = /^echo\s+(.*?);?$/.exec(t))) return c('echo') + ' escribe ' + c(m[1]) + ' en la página. Con el punto ' + c('.') + ' se unen textos.';
      if ((m = /^(\$\w+)\s*(\.|\+|-|\*|\/)?=\s*(.*?);?$/.exec(t))) return 'Guarda en la variable ' + c(m[1]) + ' el valor ' + c(m[3]) + '. Las variables de PHP siempre empiezan con ' + c('$') + ' y no se declara su tipo.';
      if ((m = /^function\s+(\w+)\s*\(([^)]*)\)/.exec(t))) return 'Define la función ' + c(m[1]) + (m[2].trim() ? ' que recibe ' + c(m[2]) : '') + '. Se ejecuta cuando la llamas.';
      if ((m = /^foreach\s*\((.*)\)/.exec(t))) return 'Recorre un arreglo: ' + c(m[1]) + ' repite el bloque una vez por cada elemento.';
      if ((m = /^(if|elseif|while|for)\s*\((.*)\)/.exec(t))) return (m[1] === 'while' || m[1] === 'for' ? 'Bucle: repite el bloque mientras ' : 'Condición: se ejecuta el bloque si ') + c(m[2]) + (m[1] === 'for' ? ' (inicio; condición; paso).' : ' se cumpla.');
      if (/^else\b/.test(t)) return 'Lo que se ejecuta cuando la condición anterior es falsa.';
      if ((m = /^return\b\s*(.*?);?$/.exec(t))) return 'Termina la función y devuelve ' + (m[1] ? c(m[1]) : 'nada') + '.';
      return null;
    }
    /* familia C */
    if (/^#\s*include/.test(t)) return 'Incluye una <b>biblioteca</b> (un conjunto de funciones ya hechas) para poder usarla. Por ejemplo ' + c('<stdio.h>') + ' trae ' + c('printf') + ' y ' + c('scanf') + '.';
    if (/^using\s+namespace\s+std/.test(t)) return 'Permite escribir ' + c('cout') + ' en lugar de ' + c('std::cout') + ' (todo lo de la biblioteca estándar vive en el espacio ' + c('std') + ').';
    if ((m = /^using\s+([\w.]+)\s*;/.exec(t))) return 'Importa el espacio de nombres ' + c(m[1]) + ' para usar sus clases sin escribir el nombre completo.';
    if ((m = /^namespace\s+(\w+)/.exec(t))) return 'Agrupa el código bajo el espacio de nombres ' + c(m[1]) + ' para evitar choques de nombres.';
    if ((m = /^(?:public\s+|private\s+|static\s+)*class\s+(\w+)/.exec(t))) return 'Declara la <b>clase</b> ' + c(m[1]) + ': un molde que agrupa datos y acciones.';
    if (/^(?:static\s+)?(?:public\s+)?(?:static\s+)?(?:void|int)\s+[Mm]ain\s*\(/.test(t)) return 'La función ' + c('main') + ' es el <b>punto de entrada</b>: el programa empieza a ejecutarse aquí.';
    if (/^return\s+0\s*;?$/.test(t)) return 'Termina el programa avisando al sistema que todo salió bien (0 = sin errores).';
    if ((m = /^(?:std::)?printf\s*\((.*)\)\s*;?$/.exec(t))) return c('printf') + ' escribe en pantalla. El texto lleva marcadores como ' + c('%d') + ' (entero), ' + c('%f') + ' (decimal), ' + c('%c') + ' (carácter) o ' + c('%s') + ' (texto) que se reemplazan por los valores que siguen; ' + c('\\n') + ' es un salto de línea.';
    if ((m = /^scanf\s*\((.*)\)\s*;?$/.exec(t))) return c('scanf') + ' lee lo que escribe el usuario y lo guarda en la variable. Se pone ' + c('&') + ' delante del nombre para pasar su dirección.';
    if ((m = /^(?:std::)?cout\s*<<(.*?);?$/.exec(t))) return c('cout') + ' escribe en pantalla; cada ' + c('<<') + ' agrega una pieza (' + c('endl') + ' o ' + c('\\n') + ' cambia de línea).';
    if ((m = /^(?:std::)?cin\s*>>(.*?);?$/.exec(t))) return c('cin') + ' lee del teclado y guarda el dato en la variable (' + c('>>') + ' apunta hacia la variable).';
    if ((m = /^Console\.WriteLine\s*\((.*)\)\s*;?$/.exec(t))) return c('Console.WriteLine') + ' escribe ' + c(m[1]) + ' en la consola y cambia de línea.';
    if ((m = /^Console\.Write\s*\((.*)\)\s*;?$/.exec(t))) return c('Console.Write') + ' escribe en la consola sin cambiar de línea.';
    var d = declC(t); if (d) return d;
    if ((m = /^(if|while)\s*\((.*)\)/.exec(t))) return (m[1] === 'if' ? 'Condición: si ' : 'Bucle: mientras ') + c(m[2]) + (m[1] === 'if' ? ' es verdadera se ejecuta el bloque.' : ' sea verdadero se repite el bloque.');
    if ((m = /^for\s*\((.*)\)/.exec(t))) return 'Bucle ' + c('for') + ': ' + c(m[1]) + ' (inicio; condición; paso).';
    if ((m = /^foreach\s*\((.*)\)/.exec(t))) return 'Recorre una colección: ' + c(m[1]) + ' repite el bloque por cada elemento.';
    if (/^else\b/.test(t)) return 'Lo que se ejecuta cuando la condición anterior es falsa.';
    if ((m = /^(\w[\w\s\*&:<>]*?)\s+(\w+)\s*\(([^)]*)\)\s*\{?$/.exec(t)) && !/^(if|for|while|switch|return)\b/.test(t)) return 'Define la función ' + c(m[2]) + (m[3].trim() ? ' que recibe ' + c(m[3]) : ' sin parámetros') + ' y devuelve ' + c(m[1]) + '.';
    return null;
  };
})();
