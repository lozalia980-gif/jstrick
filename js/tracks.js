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
    { id: 'php', name: 'PHP', color: '#8892bf', icon: 'globe', kind: 'term', lang: 'php', ext: 'php', file: 'index.php', tagline: 'El lenguaje del servidor detrás de millones de sitios', why: 'WordPress y gran parte de la web funcionan con PHP.' },
    { id: 'c', name: 'C', color: '#7f8ea3', icon: 'cube', kind: 'term', lang: 'c', ext: 'c', file: 'main.c', tagline: 'Cómo funciona realmente una computadora', why: 'Te enseña memoria, tipos y control total. Base de sistemas y microcontroladores.' },
    { id: 'cpp', name: 'C++', color: '#d19a66', icon: 'cube', kind: 'term', lang: 'cpp', ext: 'cpp', file: 'main.cpp', tagline: 'Potencia y rendimiento: videojuegos y software de alto nivel', why: 'C con clases, plantillas y una biblioteca estándar enorme.' },
    { id: 'csharp', name: 'C#', color: '#98c379', icon: 'layers', kind: 'term', lang: 'cs', ext: 'cs', file: 'Program.cs', tagline: 'Apps de escritorio, web y videojuegos con Unity', why: 'Un lenguaje moderno y ordenado del ecosistema .NET.' }
  ];
  JT.soon = [
    { name: 'React', color: '#61dafb', tagline: 'Interfaces web con componentes' },
    { name: 'Node.js', color: '#98c379', tagline: 'JavaScript en el servidor' },
    { name: 'Flutter', color: '#56b6c2', tagline: 'Apps móviles con Dart' },
    { name: 'Kotlin', color: '#c678dd', tagline: 'Android moderno' },
    { name: 'Swift', color: '#e06c75', tagline: 'Apps para iPhone y iPad' },
    { name: 'TypeScript', color: '#3b82c4', tagline: 'JavaScript con tipos' }
  ];
  JT.track = function (id) { for (var i = 0; i < JT.tracks.length; i++) if (JT.tracks[i].id === id) return JT.tracks[i]; return null; };
  JT.trackOf = function (t) { return JT.track(t.track || 'js'); };
})();
