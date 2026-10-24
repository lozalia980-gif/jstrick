/* Xidecode :: contenido de las presentaciones inmersivas de la landing (un bloque por curso; los que no tengan se arman con el catálogo)
   uses: [titulo, descripcion, icono]   snippets: [archivo, lang, codigo]
   slides: term {title, code, out} | chart {title, bars:[[etiqueta, valor]], note} | flow {title, nodes:[], note} | browser {title, url, html} | phone {title, items:[]} */
(function () {
  var JT = window.JT = window.JT || {};
  var L = function () { return Array.prototype.join.call(arguments, '\n'); };
  JT.portalData = {
    python: {
      hero: 'Lógica de programación con la sintaxis más amable',
      intro: 'Python se lee casi como inglés. Por eso es el primer lenguaje de millones de personas y, a la vez, el que usan quienes analizan datos, entrenan inteligencia artificial o automatizan sistemas. Aprendes una vez y lo usas en todo.',
      uses: [
        ['Automatizar lo aburrido', 'Renombrar cientos de archivos, leer hojas de cálculo, generar reportes y enviarlos sin tocar nada.', 'bolt'],
        ['Analizar datos', 'Listas, diccionarios, JSON y estadística para responder preguntas con números reales.', 'db'],
        ['Inteligencia artificial', 'Es el idioma de la IA: desde probar ideas rápido hasta entrenar y usar modelos.', 'cube'],
        ['Bots y herramientas', 'Scripts de consola, bots de chat y utilidades que resuelven un problema concreto.', 'term'],
        ['Servicios web y APIs', 'Backends que responden a tu app o a tu página con datos en JSON.', 'globe'],
        ['Juegos y proyectos creativos', 'Del adivina el número a simulaciones: un lugar perfecto para jugar con ideas.', 'layers']
      ],
      snippets: [
        ['promedio.py', 'py', L('notas = [8, 6, 9, 7]', 'aprobadas = [n for n in notas if n >= 7]', '', 'print(f"Promedio: {sum(notas) / len(notas)}")', 'print(aprobadas)')],
        ['carrito.py', 'py', L('from dataclasses import dataclass', '', '@dataclass', 'class Producto:', '    nombre: str', '    precio: float', '', 'carrito = [Producto("pan", 2.5), Producto("sal", 1.0)]', 'print(sum(p.precio for p in carrito))')],
        ['fibonacci.py', 'py', L('def fibonacci():', '    a, b = 0, 1', '    while True:', '        yield a', '        a, b = b, a + b', '', 'g = fibonacci()', 'print([next(g) for _ in range(8)])')]
      ],
      slides: [
        { k: 'term', title: 'promedio.py', code: L('notas = [8, 6, 9, 7]', 'print(f"Promedio: {sum(notas) / len(notas)}")'), out: 'Promedio: 7.5' },
        { k: 'chart', title: 'Analizar datos en pocas líneas', bars: [['Ene', 42], ['Feb', 58], ['Mar', 51], ['Abr', 76], ['May', 69]], note: 'Ventas por mes (datos de ejemplo)' },
        { k: 'term', title: 'conteo.py', code: L('texto = "el gato y el perro y el pez"', 'conteo = {}', 'for p in texto.split():', '    conteo[p] = conteo.get(p, 0) + 1', 'print(conteo)'), out: "{'el': 3, 'gato': 1, 'y': 2, 'perro': 1, 'pez': 1}" },
        { k: 'flow', title: 'Tu ruta en Python', nodes: ['Variables y texto', 'Listas y diccionarios', 'Funciones', 'Clases y módulos', 'Decoradores y asyncio'], note: 'Tres niveles: básico, intermedio y avanzado' }
      ]
    },
    rust: {
      hero: 'Velocidad de C sin los fallos de memoria',
      intro: 'Rust te da el control de un lenguaje de sistemas, pero un compilador estricto revisa tu programa antes de ejecutarlo: sin referencias colgantes, sin carreras de datos y sin recolector de basura. Cuesta un poco al inicio, y por eso se queda contigo.',
      uses: [
        ['Programas de consola veloces', 'Herramientas que arrancan al instante y procesan archivos enormes sin esfuerzo.', 'term'],
        ['WebAssembly', 'Código casi nativo dentro del navegador para editores, juegos y gráficos.', 'globe'],
        ['Servidores de alto rendimiento', 'Servicios que atienden miles de conexiones usando pocos recursos.', 'bolt'],
        ['Motores de juegos y gráficos', 'Control total de la memoria y del tiempo, justo lo que pide un juego.', 'cube'],
        ['Sistemas embebidos', 'Código seguro para dispositivos pequeños donde un fallo no se puede permitir.', 'layers'],
        ['Concurrencia sin miedo', 'Hilos y canales con garantía del compilador: si compila, no hay carreras de datos.', 'code']
      ],
      snippets: [
        ['ownership.rs', 'rust', L('fn main() {', '    let a = String::from("hola");', '    let b = a.clone();', '    println!("{} {}", a, b);', '}')],
        ['forma.rs', 'rust', L('enum Forma {', '    Circulo(f64),', '    Rectangulo(f64, f64),', '}', '', 'fn area(f: &Forma) -> f64 {', '    match f {', '        Forma::Circulo(r) => 3.14 * r * r,', '        Forma::Rectangulo(a, b) => a * b,', '    }', '}')],
        ['hilos.rs', 'rust', L('use std::thread;', '', 'fn main() {', '    let hs: Vec<_> = (0..4)', '        .map(|i| thread::spawn(move || i * i))', '        .collect();', '    let r: Vec<i32> = hs.into_iter().map(|h| h.join().unwrap()).collect();', '    println!("{:?}", r);', '}')]
      ],
      slides: [
        { k: 'term', title: 'cargo build', code: L('let a = String::from("hola");', 'let b = a;', 'println!("{} {}", a, b);'), out: L('error[E0382]: borrow of moved value: `a`', ' --> main.rs:4:23', '  |', '2 |     let a = String::from("hola");', '  |         - move occurs because `a` has type `String`', '3 |     let b = a;', '  |             - value moved here', '4 |     println!("{} {}", a, b);', '  |                       ^ value borrowed here after move', '  |', 'help: consider cloning the value', '3 |     let b = a.clone();', '  |              ++++++++'), err: true },
        { k: 'flow', title: 'Ownership en cuatro pasos', nodes: ['let a = String::from("hola")', 'let b = a  (el dueño cambia)', 'a deja de ser válida', 'b libera la memoria al salir'], note: 'El compilador lo comprueba, no tú' },
        { k: 'term', title: 'hilos.rs', code: L('let hs: Vec<_> = (0..4)', '    .map(|i| thread::spawn(move || i * i))', '    .collect();'), out: '[0, 1, 4, 9]' },
        { k: 'flow', title: 'Tu ruta en Rust', nodes: ['Variables, tipos y control', 'Ownership y préstamos', 'Structs, enums y traits', 'Colecciones y errores', 'Lifetimes, hilos y macros'], note: 'Tres niveles: básico, intermedio y avanzado' }
      ]
    },
    react: {
      hero: 'Interfaces web que reaccionan a los datos',
      intro: 'En React describes cómo debe verse tu pantalla para un estado dado, y él se encarga de actualizarla cuando cambia. Construyes con piezas pequeñas y reutilizables (componentes) y de ahí salen desde un botón hasta aplicaciones enteras.',
      uses: [
        ['Aplicaciones de una sola página', 'Webs que se sienten como apps: cambias de pantalla sin recargar nada.', 'globe'],
        ['Paneles y dashboards', 'Tablas, filtros y gráficas que se actualizan en vivo con los datos.', 'layers'],
        ['Tiendas en línea', 'Catálogos, carritos y pagos con componentes reutilizables.', 'bolt'],
        ['Apps móviles', 'Lo aprendido se traslada a React Native para iPhone y Android.', 'cube'],
        ['Sistemas de diseño', 'Un botón o tarjeta bien hechos, usados en cien pantallas.', 'code'],
        ['Herramientas internas', 'Formularios y paneles para tu equipo, rápidos de construir y cambiar.', 'term']
      ],
      snippets: [
        ['Contador.jsx', 'jsx', L('import { useState } from "react";', '', 'export default function Contador() {', '  const [n, setN] = useState(0);', '  return (', '    <button onClick={() => setN(n + 1)}>', '      Clics: {n}', '    </button>', '  );', '}')],
        ['Lista.jsx', 'jsx', L('function Lista({ items }) {', '  return (', '    <ul>', '      {items.map(i => <li key={i.id}>{i.texto}</li>)}', '    </ul>', '  );', '}')],
        ['Datos.jsx', 'jsx', L('function Perfil({ id }) {', '  const [u, setU] = useState(null);', '  useEffect(() => {', '    fetch(`/api/usuarios/${id}`)', '      .then(r => r.json()).then(setU);', '  }, [id]);', '  return u ? <h2>{u.nombre}</h2> : <p>Cargando…</p>;', '}')]
      ],
      slides: [
        { k: 'browser', title: 'Contador.jsx en el navegador', url: 'localhost:5173', html: '<h4>Contador</h4><div class="pt-big">3</div><button type="button">Clics: 3</button>' },
        { k: 'flow', title: 'El ciclo de React', nodes: ['Estado (useState)', 'Se dibuja la pantalla', 'El usuario hace clic', 'Cambia el estado → se redibuja'], note: 'Tú describes el resultado, React actualiza' },
        { k: 'phone', title: 'Lista de tareas', items: ['Comprar pan', 'Estudiar React', 'Terminar el reto'] },
        { k: 'flow', title: 'Tu ruta en React', nodes: ['Componentes y props', 'Estado y eventos', 'Efectos y datos', 'Context y reducers', 'Rendimiento y patrones'], note: 'Tres niveles: básico, intermedio y avanzado' }
      ]
    }
  };
})();
