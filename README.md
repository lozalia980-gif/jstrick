# js-trick

Plataforma interactiva para aprender a programar practicando: **HTML, CSS, JavaScript (guías 8 a 12: JSON, AJAX, jQuery y Angular), Python, SQL, PHP, C, C++, C# y Java**. Cada ejemplo se explica pieza por pieza y termina con un ejercicio guiado. Está hecha con HTML, CSS y JavaScript puros, sin cuentas ni instalación.

- `index.html`: **landing page** con efectos 3D ligeros (se pausan fuera de pantalla y respetan *reducir movimiento*) y un botón al panel.
- `app.html`: el **entorno** (panel de usuario con nivel, XP, racha, logros y reto diario; catálogo de lenguajes; ejemplos, ejercicios y retos).

## Cómo abrirla

- **Recomendado en Windows:** doble clic en `abrir-js-trick.bat`. Inicia un servidor local con Python (si está instalado) y abre el navegador; para detenerlo cierra la ventana negra.
- **Opción simple:** doble clic en `index.html` (Chrome, Edge o Firefox) y pulsa **Entrar al panel**.
- **Si algo no carga** (por ejemplo, por restricciones del navegador con archivos locales), abre una terminal en esta carpeta y ejecuta:

```bash
python -m http.server 5173
```

y entra a `http://localhost:5173`.

## Cursos (cada nivel: 10 lecciones con su ejercicio guiado y 8 preguntas)

| Curso | Niveles | Cómo se ejecuta |
|---|---|---|
| HTML y CSS | Básico + intermedio + avanzado | Se ven de verdad en la pantalla del resultado |
| JavaScript | Guías 8-12 + intermedio + avanzado | Se ejecuta de verdad en la pantalla del resultado |
| Python | Básico + intermedio + avanzado | Se ejecuta de verdad con Pyodide (descarga el intérprete la primera vez) |
| SQL | Básico + intermedio + avanzado | Se ejecuta de verdad con sql.js sobre una base de ejemplo |
| TypeScript y Node.js | Básico + intermedio + avanzado | Salida esperada; *Ejecutar en línea* opcional; se prueban en VS Code |
| React | Básico + intermedio + avanzado | Salida descrita; se practica aquí y se prueba con Vite en VS Code |
| PHP, C, C++, C# y Java | Básico + intermedio + avanzado | Salida esperada; el revisor explica errores de sintaxis; *Ejecutar en línea* opcional (el intermedio y el avanzado de PHP, C++, C# y Java usan sintaxis moderna que el servicio en línea puede no soportar: PHP 8.1, C++17, hilos y C# reciente) |
| Flutter | Básico + intermedio + avanzado | Salida descrita (o de consola en las lecciones de Dart); se prueba con `flutter run -d chrome` en VS Code |
| Kotlin | Básico + Android con Jetpack Compose + avanzado | Básico: salida esperada y *Ejecutar en línea* opcional; avanzado: Kotlin, corrutinas y Flow con salida esperada y Compose en Android Studio |
| Swift | Básico + iOS con SwiftUI + avanzado | Básico: salida esperada y *Ejecutar en línea* opcional; avanzado: Swift y concurrencia con salida esperada y SwiftUI en Xcode (requiere Mac) |

*Ejecutar en línea* pide permiso y usa el servicio público ce.judge0.com. Los cursos de Java, TypeScript, React, Node.js, Flutter, Kotlin y Swift empiezan con una guía para instalar todo en tu computadora.

El contenido está en `js/data/` (`tk.js` es el constructor compacto de temas). Salidas verificadas contra ejecución real: Python, SQL, C#, Java, TypeScript (con comprobación de tipos con tsc) y Node.js, en los tres niveles. Los cursos avanzados de HTML y CSS se ejecutan en el sandbox del propio proyecto (`tools/runall.html`). Escritas y revisadas a mano (sin compilador en el entorno de desarrollo): C, C++, PHP, React, Flutter, Kotlin y Swift.

## Herramientas para quien edita el contenido

```bash
node tools/validate.js
python tools/checkterm.py
```

`validate.js` revisa estructura, soluciones y errores del revisor; `checkterm.py` ejecuta Python, SQL y C# (si hay .NET) y compara con la salida esperada (`--fill archivo.js` rellena los `'@@'` pendientes).

## Contenido de las guías 8 a 12

| Tema | Ejemplos | Ejercicios guiados | Reto rápido |
|---|---|---|---|
| Repaso exprés (lo básico de JavaScript) | 11 | 5 | 8 preguntas |
| Guía 8 · JSON, localStorage y sessionStorage | 12 | 5 | 8 preguntas |
| Guía 9 · AJAX (XMLHttpRequest) | 12 | 5 | 8 preguntas |
| Guía 10 · Introducción a jQuery | 12 | 5 | 8 preguntas |
| Guía 11 · jQuery en la práctica (menús, sliders, plugins) | 11 | 5 | 8 preguntas |
| Guía 12 · Angular | 13 | 5 | 8 preguntas |

Cada **ejemplo** trae: el contexto explicado, el código **desglosado pieza por pieza** (con su explicación), un **editor con todo el código** (HTML, CSS y JS) que puedes modificar, una **computadora** que se abre y muestra el resultado en tiempo real, una consola, y botones **?** en cada línea y en cada función u objeto.

Cada **ejercicio** te dicta qué escribir paso a paso. Mientras tecleas, el sistema te dice si vas bien, qué está mal y por qué, te da pistas y te explica la razón de cada paso. Algunos pasos son de "completar los huecos". Al terminar se desbloquea el editor.

Si escribes algo incorrecto (de sintaxis o de lógica) aparece un cuadro que explica **qué está mal, por qué y qué escribir en su lugar**. Revisa, entre otras cosas: paréntesis, llaves y comillas; `=` en lugar de `===`; ids que no existen en tu HTML; métodos mal escritos o con mayúsculas incorrectas (`setitem`, `fadein`, `getelementbyid`); funciones que no pertenecen a ese objeto (`JSON.parsee`); `JSON.parse` de un texto inválido; guardar un objeto sin `JSON.stringify`; `send()` antes de `open()`; `FormsModule` sin importar; y más.

## Cosas útiles del simulador

- **Servidor de práctica** (reemplaza a mockAPI.io de la guía 9): `https://mock.jstrick.dev` con `/books`, `/cities`, `/users` y `/todos` (GET, POST, PUT, DELETE), más `/saludo.txt`, `/noticias.html`, `/datos.json`, `/lento` (tarda 2,5 s) y `/error500`. En tu práctica real solo cambias la URL por la de tu cuenta.
- **Almacenamiento:** hay una pestaña "Almacenamiento" bajo la computadora (como en las herramientas de desarrollador), un botón **Cerrar pestaña** (borra sessionStorage y deja localStorage) y la función `simularOtraPestana("clave", "valor")` para ver el evento `storage`.
- **jQuery:** se incluye una versión propia mínima (`js/lib-jquery.js`) con lo que enseñan las guías: selectores (`:even`, `:contains`...), eventos, efectos, `animate`, DOM, AJAX y plugins (`$.fn`).
- **Angular:** es un **simulador didáctico** (`js/lib-angular.js`): componentes, `@Input`/`@Output`, servicios con inyección de dependencias, `*ngFor`, `*ngIf`, `[(ngModel)]`, `(eventos)`, `[propiedades]`, validación de formularios y pipes. No reemplaza a Angular CLI: para tu práctica real sigue usando `ng new` y `ng serve`.
- `alert` muestra un aviso sobre la pantalla en lugar de bloquear, `confirm` devuelve `true` y `prompt` devuelve el valor por defecto.
- Tu progreso (XP, niveles, ejemplos y ejercicios completados) y los cambios que hagas en el código se guardan en este navegador. Al final de la página de inicio hay un enlace para reiniciarlo.

## Estructura

```
index.html           página principal
css/style.css        estilos (tema oscuro tipo editor de código)
js/core.js           utilidades, progreso y XP
js/highlight.js      resaltado de sintaxis y detección de piezas para los "?"
js/glossary1.js      glosario: JavaScript, JSON, Storage, AJAX
js/glossary2.js      glosario: jQuery, Angular
js/linter.js         revisor de errores en tiempo real
js/lib-prelude.js    consola, almacenamiento y servidor de práctica de la pantalla
js/lib-jquery.js     mini-jQuery
js/lib-angular.js    simulador de Angular
js/sandbox.js        arma el documento que corre en la pantalla
js/editor.js         editor de código
js/monitor.js        la computadora (tapa 3D, consola, almacenamiento)
js/help.js           cuadro de ayuda "?"
js/app.js            vistas, rutas, ejercicios guiados y retos
js/data/t*.js        contenido de cada tema
tools/               utilidades para quien mantenga el proyecto
```

## Para quien mantenga el contenido

```bash
node tools/validate.js
```

revisa que todos los ejemplos no tengan errores y que la solución de cada paso de los ejercicios cumpla su propia validación. `tools/runall.html` (abierta desde un servidor local) ejecuta todos los ejemplos y los códigos finales de los ejercicios en la pantalla y lista los errores de ejecución.
