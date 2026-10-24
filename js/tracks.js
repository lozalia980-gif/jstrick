/* js-trick :: catálogo de lenguajes (pistas de aprendizaje) */
(function () {
  var JT = window.JT = window.JT || {};
  /* kind: web = se ejecuta en la pantalla (HTML/CSS/JS); term = programa con salida de consola/tablas */
  JT.tracks = [
    { id: 'html', name: 'HTML', color: '#e06c75', icon: 'code', kind: 'web', tagline: 'La estructura de toda página web', why: 'Es lo primero que se aprende: texto, enlaces, imágenes, formularios y tablas.' },
    { id: 'css', name: 'CSS', color: '#56b6c2', icon: 'layers', kind: 'web', tagline: 'Colores, tamaños, cajas y animaciones', why: 'Convierte una página gris en un diseño que da gusto ver.' },
    { id: 'js', name: 'JavaScript', color: '#e5c07b', icon: 'bolt', kind: 'web', tagline: 'Hace que la web cobre vida: JSON, AJAX, jQuery y Angular', why: 'El único lenguaje que corre en todos los navegadores.' },
    { id: 'python', name: 'Python', color: '#61afef', icon: 'term', kind: 'term', lang: 'py', ext: 'py', file: 'main.py', tagline: 'El lenguaje más amable para empezar a programar', why: 'Se lee casi como inglés. Sirve para datos, automatización, IA y web.' },
    { id: 'sql', name: 'SQL', color: '#c678dd', icon: 'db', kind: 'term', lang: 'sql', ext: 'sql', file: 'consulta.sql', tagline: 'Habla con las bases de datos y saca respuestas de tus datos', why: 'Casi toda aplicación guarda sus datos en tablas; SQL es el idioma para pedirlos.' },
    { id: 'ts', name: 'TypeScript', color: '#3b82c4', icon: 'code', kind: 'term', lang: 'tsc', ext: 'ts', file: 'index.ts', tagline: 'JavaScript con tipos: menos errores y mejor ayuda en VS Code', why: 'Es la base de Angular, React moderno y casi todo proyecto web serio.' },
    { id: 'react', name: 'React', color: '#61dafb', icon: 'layers', kind: 'term', lang: 'jsx', ext: 'jsx', file: 'App.jsx', tagline: 'Interfaces web con componentes reutilizables', why: 'La librería de interfaces más usada: componentes, estado y eventos.' },
    { id: 'node', name: 'Node.js', color: '#98c379', icon: 'term', kind: 'term', lang: 'node', ext: 'js', file: 'index.js', tagline: 'JavaScript fuera del navegador: scripts, archivos y servidores', why: 'Permite usar JavaScript para el servidor, herramientas y automatización.' },
    { id: 'flutter', name: 'Flutter', color: '#56b6c2', icon: 'layers', kind: 'term', lang: 'dart', ext: 'dart', file: 'main.dart', tagline: 'Apps móviles y web con Dart y widgets', why: 'Una sola base de código para Android, iOS y web, con recarga en caliente.' },
    { id: 'kotlin', name: 'Kotlin', color: '#c678dd', icon: 'code', kind: 'term', lang: 'kt', ext: 'kt', file: 'Main.kt', tagline: 'El lenguaje moderno de Android y del servidor', why: 'Conciso, seguro frente a null y 100% compatible con Java.' },
    { id: 'swift', name: 'Swift', color: '#e06c75', icon: 'bolt', kind: 'term', lang: 'swift', ext: 'swift', file: 'main.swift', tagline: 'Apps para iPhone, iPad y Mac', why: 'El lenguaje de Apple: rápido, seguro y fácil de leer.' },
    { id: 'php', name: 'PHP', color: '#8892bf', icon: 'globe', kind: 'term', lang: 'php', ext: 'php', file: 'index.php', tagline: 'El lenguaje del servidor detrás de millones de sitios', why: 'WordPress y gran parte de la web funcionan con PHP.' },
    { id: 'c', name: 'C', color: '#7f8ea3', icon: 'cube', kind: 'term', lang: 'c', ext: 'c', file: 'main.c', tagline: 'Cómo funciona realmente una computadora', why: 'Te enseña memoria, tipos y control total. Base de sistemas y microcontroladores.' },
    { id: 'cpp', name: 'C++', color: '#d19a66', icon: 'cube', kind: 'term', lang: 'cpp', ext: 'cpp', file: 'main.cpp', tagline: 'Potencia y rendimiento: videojuegos y software de alto nivel', why: 'C con clases, plantillas y una biblioteca estándar enorme.' },
    { id: 'csharp', name: 'C#', color: '#98c379', icon: 'layers', kind: 'term', lang: 'cs', ext: 'cs', file: 'Program.cs', tagline: 'Apps de escritorio, web y videojuegos con Unity', why: 'Un lenguaje moderno y ordenado del ecosistema .NET.' },
    { id: 'java', name: 'Java', color: '#e5754f', icon: 'cube', kind: 'term', lang: 'java', ext: 'java', file: 'Main.java', tagline: 'El gigante de las empresas, Android y los sistemas grandes', why: 'Tipado fuerte, orientado a objetos y con un ecosistema enorme: lleva décadas entre los lenguajes más usados.' },
    { id: 'go', name: 'Go', color: '#56b6c2', icon: 'bolt', kind: 'term', lang: 'go', ext: 'go', file: 'main.go', tagline: 'Simple, rápido y hecho para servidores y concurrencia', why: 'Lo usan Docker, Kubernetes y media nube: se aprende en días y compila a un solo ejecutable.' },
    { id: 'rust', name: 'Rust', color: '#d19a66', icon: 'cube', kind: 'term', lang: 'rust', ext: 'rs', file: 'main.rs', tagline: 'Velocidad de C sin los fallos de memoria', why: 'El compilador garantiza seguridad de memoria sin recolector de basura: el lenguaje más querido por quienes lo usan.' }
  ];
  JT.soon = [];
  JT.track = function (id) { for (var i = 0; i < JT.tracks.length; i++) if (JT.tracks[i].id === id) return JT.tracks[i]; return null; };
  JT.trackOf = function (t) { return JT.track(t.track || 'js'); };
})();
