/* js-trick :: datos ligeros para la landing (no carga el contenido de los cursos) */
(function () {
  var JT = window.JT = window.JT || {};
  /* ex = ejemplos, xs = ejercicios, q = preguntas del reto. Actualizar al agregar contenido. */
  JT.catalog = {
    html:   { ex: 10, xs: 10, q: 8, topics: ['Etiquetas y estructura', 'Enlaces e imágenes', 'Listas y tablas', 'Formularios'], file: 'index.html', lang: 'html', run: 'Se ve en la pantalla',
      code: '<h1>Hola, mundo</h1>\n<p>Mi primera <b>página</b>.</p>\n<a href="https://js-trick.dev">Visitar</a>', out: 'Hola, mundo' },
    css:    { ex: 10, xs: 10, q: 8, topics: ['Selectores y colores', 'Caja: margen y relleno', 'Flexbox', 'Animaciones'], file: 'style.css', lang: 'css', run: 'Se ve en la pantalla',
      code: '.boton {\n  background: #61afef;\n  border-radius: 12px;\n  padding: 10px 18px;\n}', out: 'botón azul redondeado' },
    js:     { ex: 81, xs: 40, q: 14, topics: ['Repaso de bases', 'JSON y AJAX', 'jQuery y Angular', 'JavaScript moderno'], file: 'app.js', lang: 'js', run: 'Se ejecuta de verdad',
      code: 'const alumno = { nombre: "Ana", edad: 20 };\nconst texto = JSON.stringify(alumno);\nconsole.log(texto);', out: '{"nombre":"Ana","edad":20}' },
    python: { ex: 20, xs: 20, q: 16, topics: ['Variables y tipos', 'Listas y bucles', 'Excepciones y archivos', 'Clases y herencia'], file: 'main.py', lang: 'py', run: 'Se ejecuta de verdad',
      code: 'nombres = ["Ana", "Luis", "Eva"]\nfor n in nombres:\n    print("Hola,", n)', out: 'Hola, Ana\nHola, Luis\nHola, Eva' },
    sql:    { ex: 20, xs: 20, q: 16, topics: ['SELECT y WHERE', 'JOIN y GROUP BY', 'Subconsultas', 'Vistas y transacciones'], file: 'consulta.sql', lang: 'sql', run: 'Se ejecuta de verdad',
      code: 'SELECT nombre, edad\nFROM alumnos\nWHERE edad >= 18\nORDER BY edad DESC;', out: 'nombre | edad\nLuis   | 22\nAna    | 20' },
    ts:     { ex: 10, xs: 10, q: 8, topics: ['Entorno en VS Code', 'Tipos e interfaces', 'Funciones tipadas', 'Genéricos'], file: 'index.ts', lang: 'tsc', run: 'Se practica aquí y se prueba en VS Code',
      code: 'function sumar(a: number, b: number): number {\n  return a + b;\n}\nconsole.log(sumar(2, 3));', out: '5' },
    react:  { ex: 10, xs: 10, q: 8, topics: ['Entorno con Vite', 'JSX y props', 'Estado y eventos', 'Listas y formularios'], file: 'App.jsx', lang: 'jsx', run: 'Se practica aquí y se prueba en VS Code',
      code: 'function Saludo({ nombre }) {\n  return <h2>Hola, {nombre}</h2>;\n}', out: 'Hola, Ana' },
    node:   { ex: 10, xs: 10, q: 8, topics: ['Entorno en VS Code', 'Archivos y JSON', 'Promesas y async', 'Servidor HTTP'], file: 'index.js', lang: 'node', run: 'Se practica aquí y se prueba en VS Code',
      code: 'const fs = require("fs");\nfs.writeFileSync("nota.txt", "Hola");\nconsole.log(fs.readFileSync("nota.txt", "utf8"));', out: 'Hola' },
    php:    { ex: 10, xs: 10, q: 8, topics: ['Variables con $', 'Arreglos', 'Funciones', 'Formularios'], file: 'index.php', lang: 'php', run: 'Salida esperada + ejecución en línea',
      code: '<?php\n$nombre = "Ana";\necho "Hola, $nombre";\n?>', out: 'Hola, Ana' },
    c:      { ex: 10, xs: 10, q: 8, topics: ['Tipos y printf', 'Condicionales y bucles', 'Arreglos', 'Funciones'], file: 'main.c', lang: 'c', run: 'Salida esperada + ejecución en línea',
      code: '#include <stdio.h>\n\nint main(void) {\n    printf("Hola, C\\n");\n    return 0;\n}', out: 'Hola, C' },
    cpp:    { ex: 10, xs: 10, q: 8, topics: ['cout y variables', 'Vectores', 'Funciones', 'Clases'], file: 'main.cpp', lang: 'cpp', run: 'Salida esperada + ejecución en línea',
      code: '#include <iostream>\n\nint main() {\n    std::cout << "Hola, C++" << std::endl;\n    return 0;\n}', out: 'Hola, C++' },
    csharp: { ex: 10, xs: 10, q: 8, topics: ['Console y variables', 'Condicionales y bucles', 'Métodos', 'Clases'], file: 'Program.cs', lang: 'cs', run: 'Salida esperada + ejecución en línea',
      code: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hola, C#");\n    }\n}', out: 'Hola, C#' }
  };
})();
