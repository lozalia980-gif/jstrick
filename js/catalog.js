/* js-trick :: datos ligeros para la landing (no carga el contenido de los cursos) */
(function () {
  var JT = window.JT = window.JT || {};
  /* ex = ejemplos, xs = ejercicios, q = preguntas del reto. Actualizar al agregar contenido. */
  JT.catalog = {
    html:   { ex: 30, xs: 30, q: 24, topics: ['Estructura semántica', 'Formularios y validación', 'Tablas y accesibilidad', 'Elementos interactivos', 'Componentes web y APIs'], file: 'index.html', lang: 'html', run: 'Se ve en la pantalla',
      code: '<h1>Hola, mundo</h1>\n<p>Mi primera <b>página</b>.</p>\n<a href="https://js-trick.dev">Visitar</a>', out: 'Hola, mundo' },
    css:    { ex: 30, xs: 30, q: 24, topics: ['Variables y selectores', 'Flexbox y Grid', 'Diseño responsive', 'Animaciones', 'Container queries y :has()'], file: 'style.css', lang: 'css', run: 'Se ve en la pantalla',
      code: '.boton {\n  background: #61afef;\n  border-radius: 12px;\n  padding: 10px 18px;\n}', out: 'botón azul redondeado' },
    js:     { ex: 91, xs: 50, q: 64, topics: ['Repaso de bases', 'JSON y AJAX', 'jQuery y Angular', 'JavaScript moderno', 'Proxy, generadores y asincronía'], file: 'app.js', lang: 'js', run: 'Se ejecuta de verdad',
      code: 'const alumno = { nombre: "Ana", edad: 20 };\nconst texto = JSON.stringify(alumno);\nconsole.log(texto);', out: '{"nombre":"Ana","edad":20}' },
    python: { ex: 30, xs: 30, q: 24, topics: ['Variables y tipos', 'Listas y bucles', 'Excepciones y archivos', 'Clases y herencia', 'Decoradores y asyncio'], file: 'main.py', lang: 'py', run: 'Se ejecuta de verdad',
      code: 'nombres = ["Ana", "Luis", "Eva"]\nfor n in nombres:\n    print("Hola,", n)', out: 'Hola, Ana\nHola, Luis\nHola, Eva' },
    sql:    { ex: 30, xs: 30, q: 24, topics: ['SELECT y WHERE', 'JOIN y GROUP BY', 'Subconsultas', 'Vistas y transacciones', 'CTE y funciones de ventana'], file: 'consulta.sql', lang: 'sql', run: 'Se ejecuta de verdad',
      code: 'SELECT nombre, edad\nFROM alumnos\nWHERE edad >= 18\nORDER BY edad DESC;', out: 'nombre | edad\nLuis   | 22\nAna    | 20' },
    ts:     { ex: 30, xs: 30, q: 24, topics: ['Tipos e interfaces', 'Genéricos', 'Uniones y narrowing', 'Clases y errores', 'Tipos condicionales y mapeados'], file: 'index.ts', lang: 'tsc', run: 'Se practica aquí y se prueba en VS Code',
      code: 'function sumar(a: number, b: number): number {\n  return a + b;\n}\nconsole.log(sumar(2, 3));', out: '5' },
    react:  { ex: 30, xs: 30, q: 24, topics: ['JSX y props', 'Hooks y efectos', 'Context y reducer', 'Hooks propios', 'Rendimiento y Suspense'], file: 'App.jsx', lang: 'jsx', run: 'Se practica aquí y se prueba en VS Code',
      code: 'function Saludo({ nombre }) {\n  return <h2>Hola, {nombre}</h2>;\n}', out: 'Hola, Ana' },
    node:   { ex: 30, xs: 30, q: 24, topics: ['Archivos y JSON', 'Eventos y streams', 'Servidor HTTP', 'Errores asíncronos', 'Workers, crypto y API REST'], file: 'index.js', lang: 'node', run: 'Se practica aquí y se prueba en VS Code',
      code: 'const fs = require("fs");\nfs.writeFileSync("nota.txt", "Hola");\nconsole.log(fs.readFileSync("nota.txt", "utf8"));', out: 'Hola' },
    flutter: { ex: 30, xs: 30, q: 24, topics: ['Widgets y layout', 'Estado y navegación', 'HTTP y formularios', 'Animaciones y datos', 'Streams y pruebas'], file: 'main.dart', lang: 'dart', run: 'Se practica aquí y se prueba en VS Code',
      code: "Text('Hola, Flutter',\n  style: TextStyle(fontSize: 24),\n)", out: 'Hola, Flutter' },
    kotlin: { ex: 30, xs: 30, q: 24, topics: ['Null safety', 'Colecciones y clases', 'Android con Compose', 'Estado y corrutinas', 'Flow y ViewModel'], file: 'Main.kt', lang: 'kt', run: 'Salida esperada + ejecución en línea',
      code: 'fun main() {\n    val nombre = "Ana"\n    println("Hola, $nombre")\n}', out: 'Hola, Ana' },
    swift:  { ex: 30, xs: 30, q: 24, topics: ['Opcionales', 'Closures y structs', 'iOS con SwiftUI', 'Datos con async', 'Actores y @Observable'], file: 'main.swift', lang: 'swift', run: 'Salida esperada + ejecución en línea',
      code: 'let nombre = "Ana"\nprint("Hola, \\(nombre)")', out: 'Hola, Ana' },
    php:    { ex: 30, xs: 30, q: 24, topics: ['Funciones y arreglos', 'Clases y herencia', 'JSON, fechas y archivos', 'Validación de formularios', 'Enums, PDO y generadores'], file: 'index.php', lang: 'php', run: 'Salida esperada + ejecución en línea',
      code: '<?php\n$nombre = "Ana";\necho "Hola, $nombre";\n?>', out: 'Hola, Ana' },
    c:      { ex: 30, xs: 30, q: 24, topics: ['Punteros y memoria', 'Estructuras', 'Archivos y recursión', 'Bits y enum', 'Listas, árboles y macros'], file: 'main.c', lang: 'c', run: 'Salida esperada + ejecución en línea',
      code: '#include <stdio.h>\n\nint main(void) {\n    printf("Hola, C\\n");\n    return 0;\n}', out: 'Hola, C' },
    cpp:    { ex: 30, xs: 30, q: 24, topics: ['Referencias y clases', 'STL y lambdas', 'Plantillas y excepciones', 'Punteros inteligentes', 'Movimiento y concurrencia'], file: 'main.cpp', lang: 'cpp', run: 'Salida esperada + ejecución en línea',
      code: '#include <iostream>\n\nint main() {\n    std::cout << "Hola, C++" << std::endl;\n    return 0;\n}', out: 'Hola, C++' },
    java:   { ex: 30, xs: 30, q: 24, topics: ['Clases y objetos', 'Colecciones y streams', 'Genéricos y excepciones', 'Concurrencia y NIO.2'], file: 'Main.java', lang: 'java', run: 'Salida esperada + ejecución en línea',
      code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hola, Java");\n    }\n}', out: 'Hola, Java' },
    csharp: { ex: 30, xs: 30, q: 24, topics: ['Colecciones y LINQ', 'Herencia e interfaces', 'Delegados y eventos', 'Records y pattern matching', 'Async y concurrencia'], file: 'Program.cs', lang: 'cs', run: 'Salida esperada + ejecución en línea',
      code: 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hola, C#");\n    }\n}', out: 'Hola, C#' }
  };
})();
