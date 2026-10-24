/* Xidecode :: Python desde cero */
(function () {
  JT.tk({
    id: 'py1', track: 'python', num: 'Py', badge: 'Py', guide: 'Python', title: 'Python desde cero', short: 'Python básico',
    summary: 'Variables, textos, condiciones, bucles, listas, diccionarios y funciones con el lenguaje más amable para empezar.',
    theory: [
      ['cube', 'Variables y tipos', '<p>En Python una variable se crea al asignarle un valor con <code>=</code>; no hace falta declarar su tipo. Los tipos básicos son <b>int</b> (enteros), <b>float</b> (decimales), <b>str</b> (texto) y <b>bool</b> (<code>True</code> / <code>False</code>).</p>', 'nombre = "Ana"\nedad = 20\npromedio = 8.5\nactiva = True', 'Una variable es una <b>caja con etiqueta</b>: la etiqueta es el nombre y dentro va el dato.'],
      ['bolt', 'Operadores', '<p><code>+ - * /</code> hacen las cuatro operaciones (la división <code>/</code> siempre da decimal). <code>//</code> es división entera, <code>%</code> es el resto y <code>**</code> es potencia. Para comparar: <code>== != &lt; &gt; &lt;= &gt;=</code>; para combinar: <code>and</code>, <code>or</code>, <code>not</code>.</p>', 'print(17 // 5)   # 3\nprint(17 % 5)    # 2\nprint(2 ** 3)    # 8'],
      ['flag', 'Condicionales', '<p><code>if</code>, <code>elif</code> y <code>else</code> deciden qué bloque se ejecuta. Cada línea que abre un bloque termina en <code>:</code> y el bloque va <b>con sangría</b> (4 espacios). En Python la sangría <i>es</i> la sintaxis.</p>', 'if nota >= 6:\n    print("Aprobado")\nelse:\n    print("Reprobado")', 'Es un <b>semáforo</b>: si está en verde pasas; si no, esperas.'],
      ['refresh', 'Bucles', '<p><code>for</code> recorre una secuencia: <code>for i in range(1, 6)</code> cuenta de 1 a 5 (el final no se incluye). <code>while</code> repite mientras la condición sea verdadera; cuida que algo cambie dentro para que termine.</p>', 'for i in range(3):\n    print(i)   # 0 1 2'],
      ['list', 'Listas y diccionarios', '<p>Una <b>lista</b> guarda valores en orden: <code>[1, 2, 3]</code> (posiciones desde 0). Un <b>diccionario</b> guarda pares <code>clave: valor</code>: <code>{"nombre": "Ana"}</code>. Métodos útiles: <code>append</code>, <code>len</code>, <code>sort</code>, <code>items</code>.</p>', 'frutas = ["pera", "uva"]\nfrutas.append("mango")\nalumno = {"nombre": "Ana"}'],
      ['code', 'Funciones', '<p>Una función se define con <code>def</code>, recibe parámetros y devuelve un resultado con <code>return</code>. Declararla no la ejecuta: hay que <b>llamarla</b> con paréntesis.</p>', 'def doble(n):\n    return n * 2\n\nprint(doble(21))', 'Una función es una <b>receta</b>: le das ingredientes y te entrega el plato.']
    ],
    ex: [
      { t: 'Variables y print', s: 'Guardar datos y mostrarlos', i: '<p><code>print()</code> muestra valores en pantalla. Separados por comas, se escriben con un espacio entre ellos. Aquí guardamos dos datos y los mostramos.</p>',
        p: [['nombre = "Ana"\nedad = 20', 'Dos variables: un <b>texto</b> entre comillas y un <b>número</b> sin comillas. No se declara el tipo: Python lo deduce.'], ['print("Hola,", nombre)\nprint("Tienes", edad, "años")', '<code>print</code> acepta varios valores separados por coma y los muestra en una línea con un espacio entre cada uno.']],
        out: 'Hola, Ana\nTienes 20 años', tryit: ['Cambia el nombre y la edad.', 'Agrega una tercera variable <code>ciudad</code> y muéstrala.'] },
      { t: 'Tipos y operadores', s: 'Sumar, dividir, resto y potencia', i: '<p>Python hace cálculos con operadores. Fíjate en la diferencia entre <code>/</code> (decimal) y <code>//</code> (entera).</p>',
        p: [['a = 17\nb = 5', 'Dos enteros con los que haremos cuentas.'], ['print(a + b)\nprint(a / b)\nprint(a // b)\nprint(a % b)\nprint(a ** 2)', '<code>+</code> suma (22). <code>/</code> divide y da decimal (3.4). <code>//</code> divide y descarta los decimales (3). <code>%</code> da el resto (2). <code>**</code> eleva a la potencia (289).'], ['print(type(a), type(a / b))', '<code>type()</code> dice el tipo de un valor: aquí <code>int</code> y <code>float</code>.']],
        out: "22\n3.4\n3\n2\n289\n<class 'int'> <class 'float'>", tryit: ['Cambia <code>a</code> y <code>b</code> por otros números.', 'Calcula <code>10 / 0</code> y lee el error.'] },
      { t: 'Texto y f-strings', s: 'Métodos de texto y formato', i: '<p>Los textos (<code>str</code>) tienen métodos como <code>upper()</code> o <code>title()</code>. Las <b>f-strings</b> insertan variables dentro de un texto con <code>{}</code>.</p>',
        p: [['nombre = "ana lopez"\nprint(nombre.upper())\nprint(nombre.title())', '<code>upper()</code> pasa todo a mayúsculas; <code>title()</code> pone mayúscula inicial en cada palabra.'], ['print(len(nombre))', '<code>len()</code> cuenta los caracteres (el espacio también cuenta): 9.'], ['edad = 20\nprint(f"{nombre.title()} tiene {edad} años")', 'La <b>f</b> antes de las comillas activa las llaves: lo que está dentro de <code>{ }</code> se calcula y se inserta en el texto.']],
        out: 'ANA LOPEZ\nAna Lopez\n9\nAna Lopez tiene 20 años', tryit: ['Prueba <code>nombre.lower()</code> y <code>nombre.replace("a", "4")</code>.'] },
      { t: 'Condicionales: if, elif, else', s: 'Decidir según una nota', i: '<p>Python revisa las condiciones <b>en orden</b>; ejecuta el bloque de la primera que sea verdadera y se salta el resto.</p>',
        p: [['nota = 7.5', 'La nota que vamos a evaluar.'], ['if nota >= 9:\n    print("Excelente")\nelif nota >= 7:\n    print("Bueno")\nelif nota >= 6:\n    print("Aprobado")\nelse:\n    print("Reprobado")', 'Cada <code>if</code>/<code>elif</code>/<code>else</code> termina en <code>:</code> y su bloque va con <b>4 espacios</b> de sangría. Con 7.5, la primera condición falla y la segunda se cumple, así que imprime "Bueno".']],
        out: 'Bueno', notes: [{ type: 'warn', html: '<b>Error clásico:</b> olvidar los dos puntos o la sangría. Python te avisará con <code>IndentationError</code> o <code>SyntaxError</code>.' }], tryit: ['Cambia la nota a 5 y a 10.'] },
      { t: 'Bucle for con range', s: 'Repetir un número de veces', i: '<p><code>range(1, 6)</code> genera 1, 2, 3, 4, 5 (el último número <b>no</b> se incluye). <code>for</code> toma cada valor y ejecuta el bloque.</p>',
        p: [['for i in range(1, 6):\n    print("3 x", i, "=", 3 * i)', 'La variable <code>i</code> vale 1 en la primera vuelta, 2 en la segunda, etc. Todo lo que tenga sangría debajo del <code>for</code> se repite.']],
        out: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15', tryit: ['Cambia el 3 por otra tabla.', 'Cambia <code>range(1, 6)</code> por <code>range(1, 11)</code>.'] },
      { t: 'Bucle while', s: 'Repetir mientras se cumpla algo', i: '<p><code>while</code> repite el bloque mientras su condición sea verdadera. Si nada cambia dentro, el bucle nunca termina.</p>',
        p: [['x = 3', 'Contador inicial.'], ['while x > 0:\n    print(x)\n    x -= 1', '<code>x -= 1</code> resta 1 en cada vuelta. Cuando <code>x</code> llega a 0, la condición falla y el bucle termina.'], ['print("¡Despegue!")', 'Esta línea ya no tiene sangría: se ejecuta cuando el bucle terminó.']],
        out: '3\n2\n1\n¡Despegue!', tryit: ['Haz que cuente de 2 en 2 con <code>x -= 2</code> desde 10.'] },
      { t: 'Listas', s: 'append, len, índices, sort y recorrer', i: '<p>Una lista guarda varios valores en orden. La primera posición es la <b>0</b> y <code>-1</code> es la última.</p>',
        p: [['frutas = ["pera", "manzana"]\nfrutas.append("uva")\nprint(frutas)', '<code>append</code> agrega al final. Al imprimir una lista se muestra con corchetes.'], ['print(len(frutas))\nprint(frutas[0], frutas[-1])', '<code>len</code> dice cuántos hay (3). <code>frutas[0]</code> es la primera y <code>frutas[-1]</code> la última.'], ['frutas.sort()\nprint(frutas)', '<code>sort()</code> ordena la lista alfabéticamente <b>modificándola</b>.'], ['for f in frutas:\n    print("-", f)', 'El <code>for</code> recorre cada elemento de la lista.']],
        out: "['pera', 'manzana', 'uva']\n3\npera uva\n['manzana', 'pera', 'uva']\n- manzana\n- pera\n- uva", tryit: ['Quita el último con <code>frutas.pop()</code> y muestra la lista.'] },
      { t: 'Diccionarios', s: 'Datos con nombre', i: '<p>Un diccionario guarda pares <b>clave: valor</b>. Se accede por clave, no por posición.</p>',
        p: [['alumno = {"nombre": "Ana", "edad": 20}\nprint(alumno["nombre"])', 'Entre llaves, cada dato tiene una clave. <code>alumno["nombre"]</code> lee el valor de esa clave.'], ['alumno["carrera"] = "Sistemas"', 'Asignar a una clave nueva la agrega al diccionario.'], ['for clave, valor in alumno.items():\n    print(clave, "->", valor)\nprint("edad" in alumno)', '<code>items()</code> entrega pares (clave, valor) para recorrerlos. <code>in</code> pregunta si existe una clave.']],
        out: 'Ana\nnombre -> Ana\nedad -> 20\ncarrera -> Sistemas\nTrue', tryit: ['Cambia la edad y vuelve a mostrar el diccionario.'] },
      { t: 'Funciones', s: 'def, parámetros y return', i: '<p>Una función agrupa un trabajo para reutilizarlo. <code>return</code> entrega el resultado a quien la llamó.</p>',
        p: [['def area(base, altura):\n    return base * altura', 'Define la función <code>area</code> con dos parámetros. <b>No se ejecuta</b> hasta que la llamemos.'], ['def es_par(n):\n    return n % 2 == 0', 'Devuelve <code>True</code> si el resto de dividir entre 2 es 0.'], ['print(area(5, 4))\nprint(es_par(7))\nprint(es_par(10))', 'Llamamos a las funciones con valores concretos. Cada llamada se reemplaza por lo que la función devuelve.']],
        out: '20\nFalse\nTrue', tryit: ['Crea <code>def cubo(n)</code> que devuelva <code>n ** 3</code>.'] },
      { t: 'Mini proyecto: promedio de notas', s: 'Juntar todo lo aprendido', i: '<p>Combinamos lista, función, bucle y condición en un programa corto: calculamos el promedio y marcamos qué notas hay que revisar.</p>',
        p: [['notas = [8, 6.5, 9, 7]', 'Una lista con las notas.'], ['def promedio(lista):\n    return sum(lista) / len(lista)', '<code>sum</code> suma todos los elementos; dividimos entre cuántos hay.'], ['media = promedio(notas)\nprint("Promedio:", media)', 'Llamamos a la función y mostramos el resultado: 30.5 / 4 = 7.625.'], ['for n in notas:\n    estado = "aprobado" if n >= 7 else "revisar"\n    print(n, estado)', 'Recorremos las notas. <code>A if cond else B</code> es un if en una línea que elige entre dos valores.']],
        out: 'Promedio: 7.625\n8 aprobado\n6.5 revisar\n9 aprobado\n7 aprobado', tryit: ['Agrega otra nota y comprueba el promedio.', 'Cambia el mínimo para aprobar a 6.'] }
    ],
    xs: [
      { t: 'Variables y print', s: 'Guarda y muestra datos', g: '<p>Guarda un nombre y una edad y muéstralos en dos frases.</p>', base: '# tu código aquí', out: 'Hola, Ana\nTienes 20 años',
        st: [
          { t: 'Tu nombre', i: 'Crea la variable <code>nombre</code> con el texto <code>"Ana"</code>.', w: 'Los textos van entre comillas. Sin comillas Python buscaría una variable llamada Ana.', sol: 'nombre = "Ana"' },
          { t: 'Tu edad', i: 'Crea la variable <code>edad</code> con el número 20 (sin comillas).', w: 'Los números van sin comillas para poder hacer cuentas con ellos.', sol: 'edad = 20' },
          { t: 'Saluda', i: 'Muestra <code>"Hola,"</code> seguido de la variable <code>nombre</code> con <code>print</code>.', w: '<code>print</code> separa con un espacio los valores que le des separados por comas.', sol: 'print("Hola,", nombre)' },
          { t: 'Di la edad', i: 'Muestra <code>"Tienes"</code>, la variable <code>edad</code> y el texto <code>"años"</code> con un solo <code>print</code>.', w: 'Puedes mezclar textos y variables en el mismo print usando comas.', sol: 'print("Tienes", edad, "años")' }
        ] },
      { t: 'Operadores', s: 'Suma, división entera y resto', g: '<p>Haz tres cálculos con dos números y muéstralos.</p>', base: '# tu código aquí', out: '22\n3\n2',
        st: [
          { t: 'Dos números', i: 'Crea <code>a = 17</code> y <code>b = 5</code> en una sola línea cada una (primero <code>a</code>).', w: 'Dos variables numéricas para trabajar.', sol: 'a = 17\nb = 5', hint: '<code>a = 17</code> y en la línea siguiente <code>b = 5</code>' },
          { t: 'Suma', i: 'Muestra la suma de <code>a</code> y <code>b</code>.', w: '<code>+</code> suma números.', sol: 'print(a + b)' },
          { t: 'División entera', i: 'Muestra el resultado de <code>a // b</code>.', w: '<code>//</code> divide y se queda solo con la parte entera.', sol: 'print(a // b)' },
          { t: 'Resto', i: 'Muestra el resto de dividir <code>a</code> entre <code>b</code>.', w: '<code>%</code> devuelve lo que sobra de la división.', sol: 'print(a % b)' }
        ] },
      { t: 'Texto y f-strings', s: 'Métodos de texto', g: '<p>Transforma un texto y arma una frase con una f-string.</p>', base: '# tu código aquí', out: 'ANA LOPEZ\n9\nAna Lopez saluda',
        st: [
          { t: 'Un nombre', i: 'Crea <code>nombre = "ana lopez"</code>.', w: 'Un texto en minúsculas para transformar.', sol: 'nombre = "ana lopez"' },
          { t: 'Mayúsculas', i: 'Muestra <code>nombre</code> en mayúsculas con el método <code>upper()</code>.', w: 'Los métodos se llaman con punto después de la variable: <code>nombre.upper()</code>.', sol: 'print(nombre.upper())' },
          { t: 'Largo', i: 'Muestra cuántos caracteres tiene <code>nombre</code> con <code>len</code>.', w: '<code>len(x)</code> cuenta los elementos o caracteres de x.', sol: 'print(len(nombre))' },
          { t: 'f-string', i: 'Muestra una f-string que diga el nombre con <code>title()</code> seguido de la palabra <code>saluda</code>: <code>f"{nombre.title()} saluda"</code>.', w: 'La <b>f</b> antes de las comillas permite poner código dentro de llaves.', sol: 'print(f"{nombre.title()} saluda")' }
        ] },
      { t: 'Condicionales', s: 'if y else', g: '<p>Decide si una nota aprueba o reprueba.</p>', base: '# tu código aquí', out: 'Reprobado',
        st: [
          { t: 'La nota', i: 'Crea <code>nota = 5</code>.', w: 'El dato que vamos a evaluar.', sol: 'nota = 5' },
          { t: 'Si aprueba', i: 'Escribe un <code>if</code> que, cuando <code>nota &gt;= 6</code>, muestre <code>"Aprobado"</code>. Recuerda los dos puntos y la sangría.', w: 'El bloque del if va con 4 espacios de sangría y la línea del if termina en <code>:</code>.', sol: 'if nota >= 6:\n    print("Aprobado")' },
          { t: 'Si no', i: 'Agrega el <code>else</code> que muestre <code>"Reprobado"</code>.', w: '<code>else</code> cubre todo lo demás y también termina en dos puntos.', sol: 'else:\n    print("Reprobado")' }
        ] },
      { t: 'Bucle for', s: 'Repite con range', g: '<p>Cuenta tres vueltas y avisa al terminar.</p>', base: '# tu código aquí', out: 'Vuelta 1\nVuelta 2\nVuelta 3\nFin',
        st: [
          { t: 'El bucle', i: 'Escribe un <code>for i in range(1, 4):</code> que muestre <code>"Vuelta"</code> y el valor de <code>i</code>.', w: '<code>range(1, 4)</code> da 1, 2 y 3. El 4 no se incluye.', sol: 'for i in range(1, 4):\n    print("Vuelta", i)' },
          { t: 'Al terminar', i: 'Fuera del bucle (sin sangría) muestra <code>"Fin"</code>.', w: 'Al no tener sangría, esta línea corre una sola vez, cuando el bucle ya terminó.', sol: 'print("Fin")' }
        ] },
      { t: 'Bucle while', s: 'Cuenta regresiva', g: '<p>Haz una cuenta regresiva desde 3.</p>', base: '# tu código aquí', out: '3\n2\n1\n¡Despegue!',
        st: [
          { t: 'Contador', i: 'Crea <code>x = 3</code>.', w: 'Valor inicial del contador.', sol: 'x = 3' },
          { t: 'El while', i: 'Escribe <code>while x &gt; 0:</code> que muestre <code>x</code> y le reste 1 (<code>x -= 1</code>).', w: 'Restar dentro del bucle es lo que hace que algún día termine.', sol: 'while x > 0:\n    print(x)\n    x -= 1', alts: ['while x > 0:\n    print(x)\n    x = x - 1'] },
          { t: 'Despegue', i: 'Muestra <code>"¡Despegue!"</code> fuera del bucle.', w: 'Sin sangría: se ejecuta después de que el bucle termina.', sol: 'print("¡Despegue!")' }
        ] },
      { t: 'Listas', s: 'Crear, agregar y leer', g: '<p>Crea una lista de colores, agrega uno y consulta datos.</p>', base: '# tu código aquí', out: '3\nrojo',
        st: [
          { t: 'La lista', i: 'Crea <code>colores</code> con <code>"rojo"</code> y <code>"azul"</code>.', w: 'Las listas se escriben entre corchetes y con comas.', sol: 'colores = ["rojo", "azul"]' },
          { t: 'Agregar', i: 'Agrega <code>"verde"</code> al final con <code>append</code>.', w: '<code>lista.append(x)</code> pone x al final de la lista.', sol: 'colores.append("verde")' },
          { t: 'Cantidad', i: 'Muestra cuántos colores hay con <code>len</code>.', w: '<code>len(colores)</code> devuelve 3 ahora.', sol: 'print(len(colores))' },
          { t: 'Primero', i: 'Muestra el primer color (posición 0).', w: 'Las posiciones empiezan en 0.', sol: 'print(colores[0])' }
        ] },
      { t: 'Diccionarios', s: 'Claves y valores', g: '<p>Crea un diccionario, léelo y modifícalo.</p>', base: '# tu código aquí', out: "Luis\n{'nombre': 'Luis', 'edad': 23}",
        st: [
          { t: 'El diccionario', i: 'Crea <code>persona</code> con <code>"nombre": "Luis"</code> y <code>"edad": 22</code>.', w: 'Cada par es clave, dos puntos y valor; los pares se separan con comas.', sol: 'persona = {"nombre": "Luis", "edad": 22}' },
          { t: 'Leer', i: 'Muestra el valor de la clave <code>"nombre"</code>.', w: 'Se lee con corchetes y la clave: <code>persona["nombre"]</code>.', sol: 'print(persona["nombre"])' },
          { t: 'Cambiar', i: 'Cambia la edad a 23.', w: 'Asignar a una clave existente reemplaza su valor.', sol: 'persona["edad"] = 23' },
          { t: 'Todo', i: 'Muestra el diccionario completo.', w: 'Al imprimirlo se ve con llaves y comillas simples.', sol: 'print(persona)' }
        ] },
      { t: 'Funciones', s: 'def y return', g: '<p>Crea dos funciones y úsalas.</p>', base: '# tu código aquí', out: '42\nHola, Ana',
        st: [
          { t: 'Función doble', i: 'Define <code>doble(n)</code> que devuelva <code>n * 2</code>.', w: '<code>def</code> crea la función y <code>return</code> entrega el resultado.', sol: 'def doble(n):\n    return n * 2' },
          { t: 'Llámala', i: 'Muestra <code>doble(21)</code>.', w: 'Para ejecutar la función hay que llamarla con paréntesis y argumentos.', sol: 'print(doble(21))' },
          { t: 'Función saludar', i: 'Define <code>saludar(nombre)</code> que devuelva <code>"Hola, " + nombre</code>.', w: 'Con textos, <code>+</code> los une. Cuida el espacio después de la coma.', sol: 'def saludar(nombre):\n    return "Hola, " + nombre' },
          { t: 'Úsala', i: 'Muestra <code>saludar("Ana")</code>.', w: 'El resultado de la función se pasa directo a <code>print</code>.', sol: 'print(saludar("Ana"))' }
        ] },
      { t: 'Mini proyecto: total y mayor', s: 'sum y max', g: '<p>Con una lista de precios calcula el total y el precio más alto.</p>', base: '# tu código aquí', out: 'Total: 40\nMayor: 25',
        st: [
          { t: 'Los precios', i: 'Crea <code>precios = [10, 25, 5]</code>.', w: 'Una lista de números.', sol: 'precios = [10, 25, 5]' },
          { t: 'El total', i: 'Guarda en <code>total</code> la suma con <code>sum(precios)</code>.', w: '<code>sum</code> suma todos los elementos de la lista.', sol: 'total = sum(precios)' },
          { t: 'Muestra el total', i: 'Muestra <code>"Total:"</code> y <code>total</code>.', w: 'Dos valores separados por coma salen en la misma línea.', sol: 'print("Total:", total)' },
          { t: 'El mayor', i: 'Muestra <code>"Mayor:"</code> y el máximo con <code>max(precios)</code>.', w: '<code>max</code> devuelve el elemento más grande.', sol: 'print("Mayor:", max(precios))' }
        ] }
    ],
    quiz: [
      ['¿Qué muestra <code>print(7 // 2)</code>?', ['3.5', '3', '4', '1'], 1, '<code>//</code> es la división entera: 7 entre 2 es 3 y sobra 1.'],
      ['¿Qué debe llevar al final una línea que abre un bloque (if, for, def)?', ['Un punto y coma', 'Dos puntos <code>:</code>', 'Un paréntesis', 'Nada'], 1, 'En Python los bloques se abren con <code>:</code> y el contenido va con sangría.'],
      ['¿Cuál es la posición del primer elemento de una lista?', ['1', '0', '-1', 'Depende'], 1, 'Las posiciones empiezan en 0.'],
      ['¿Qué hace <code>lista.append(5)</code>?', ['Borra el 5', 'Agrega 5 al final', 'Agrega 5 al inicio', 'Cuenta los 5'], 1, '<code>append</code> añade un elemento al final de la lista.'],
      ['¿Qué devuelve <code>len("hola")</code>?', ['3', '4', '5', 'Error'], 1, 'Cuenta los caracteres: h, o, l, a.'],
      ['¿Qué palabra entrega un valor desde una función?', ['print', 'give', 'return', 'send'], 2, '<code>return</code> devuelve el resultado a quien llamó la función.'],
      ['¿Qué tipo tiene el resultado de <code>10 / 4</code>?', ['int', 'float', 'str', 'bool'], 1, 'La división <code>/</code> siempre produce un decimal (<code>float</code>): 2.5.'],
      ['¿Cómo se lee el valor de la clave "edad" en <code>d = {"edad": 20}</code>?', ['d.edad', 'd(edad)', 'd["edad"]', 'd[0]'], 2, 'Con corchetes y la clave entre comillas.']
    ]
  });
})();
