/* js-trick :: retos libres de SQL (se ejecutan sobre la base de ejemplo del tema; la salida esperada sale de la solución) */
(function () {
  var COLS = ' <b>Usa exactamente esos nombres de columna y ese orden</b> para que el resultado coincida.';
  JT.retosDef('sq1', {
    lang: 'sql', items: [
      { t: 'Alumnos de Sistemas', s: 'WHERE y ORDER BY', g: '<p>Muestra el <code>nombre</code> y la <code>nota</code> de los alumnos de la carrera <b>Sistemas</b>, de la nota más alta a la más baja.</p>', start: '-- escribe tu consulta\n',
        sol: "SELECT nombre, nota FROM alumnos WHERE carrera = 'Sistemas' ORDER BY nota DESC;", hint: 'Filtra con <code>WHERE carrera = \'Sistemas\'</code> y ordena con <code>ORDER BY nota DESC</code>.' },
      { t: 'Mayores y aplicados', s: 'AND y comparaciones', g: '<p>Muestra <code>nombre</code> y <code>edad</code> de los alumnos con <b>más de 20 años</b> <b>y</b> nota de <b>7.5 o más</b>, ordenados por nombre.</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT nombre, edad FROM alumnos WHERE edad > 20 AND nota >= 7.5 ORDER BY nombre;', hint: 'Une las dos condiciones con <code>AND</code>.' },
      { t: 'Nombres que terminan en a', s: 'LIKE', g: '<p>Muestra solo la columna <code>nombre</code> de los alumnos cuyo nombre <b>termina en la letra a</b>, en orden alfabético.</p>', start: '-- escribe tu consulta\n',
        sol: "SELECT nombre FROM alumnos WHERE nombre LIKE '%a' ORDER BY nombre;", hint: 'En <code>LIKE</code>, el signo <code>%</code> representa cualquier cantidad de letras.' },
      { t: 'Promedio por carrera', s: 'GROUP BY y AVG', g: '<p>Muestra cada <code>carrera</code> con su nota promedio redondeada a 2 decimales (columna <code>promedio</code>), de mayor a menor promedio.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT carrera, ROUND(AVG(nota), 2) AS promedio FROM alumnos GROUP BY carrera ORDER BY promedio DESC;', hint: 'Agrupa con <code>GROUP BY carrera</code> y usa <code>ROUND(AVG(nota), 2) AS promedio</code>.' },
      { t: 'Los tres mejores', s: 'ORDER BY y LIMIT', g: '<p>Muestra el <code>nombre</code> y la <code>nota</code> de los <b>3 alumnos con la nota más alta</b>, de mayor a menor.</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT nombre, nota FROM alumnos ORDER BY nota DESC LIMIT 3;', hint: '<code>ORDER BY nota DESC</code> y después <code>LIMIT 3</code>.' },
      { t: 'Alumnos y sus cursos', s: 'JOIN de tres tablas', g: '<p>Muestra el nombre del alumno (columna <code>alumno</code>) y el nombre del curso (columna <code>curso</code>) de cada inscripción, ordenado por alumno y luego por curso.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT a.nombre AS alumno, c.nombre AS curso FROM inscripciones i JOIN alumnos a ON a.id = i.alumno_id JOIN cursos c ON c.id = i.curso_id ORDER BY alumno, curso;', hint: 'La tabla <code>inscripciones</code> une a las otras dos: haz dos <code>JOIN</code> con <code>alumno_id</code> y <code>curso_id</code>.' },
      { t: 'Subir las notas', s: 'UPDATE', g: '<p>Los alumnos de <b>Medicina</b> hicieron un trabajo extra: súmales <b>0.5</b> a la nota. Escribe solo la sentencia <code>UPDATE</code>; el sistema revisará cómo quedó la tabla.</p>', start: '-- escribe tu UPDATE\n',
        tests: [{ code: '\nSELECT nombre, nota FROM alumnos ORDER BY id;' }],
        sol: "UPDATE alumnos SET nota = nota + 0.5 WHERE carrera = 'Medicina';", hint: '<code>UPDATE alumnos SET nota = nota + 0.5 WHERE ...</code>. No olvides el <code>WHERE</code>.' }
    ]
  });
  JT.retosDef('sq2', {
    lang: 'sql', items: [
      { t: 'Clientes sin ciudad', s: 'NULL y COALESCE', g: '<p>Muestra el <code>nombre</code> y la <code>ciudad</code> de todos los clientes (por orden de <code>id</code>), pero si no tienen ciudad muestra el texto <b>Sin ciudad</b>.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: "SELECT nombre, COALESCE(ciudad, 'Sin ciudad') AS ciudad FROM clientes ORDER BY id;", hint: '<code>COALESCE(ciudad, \'Sin ciudad\') AS ciudad</code> devuelve el primer valor que no sea NULL.' },
      { t: 'Rangos de precio', s: 'CASE', g: '<p>Muestra el <code>nombre</code> de cada producto y una columna <code>rango</code> con <b>barato</b> (precio menor a 5), <b>medio</b> (menor a 20) o <b>caro</b>. Ordena por precio.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: "SELECT nombre, CASE WHEN precio < 5 THEN 'barato' WHEN precio < 20 THEN 'medio' ELSE 'caro' END AS rango FROM productos ORDER BY precio;", hint: 'Usa <code>CASE WHEN ... THEN ... ELSE ... END AS rango</code>.' },
      { t: 'Pedidos por cliente', s: 'LEFT JOIN y COUNT', g: '<p>Muestra cada cliente (<code>nombre</code>) y cuántos pedidos hizo (columna <code>pedidos</code>), <b>incluyendo a quienes no hicieron ninguno</b>. Ordena de más a menos pedidos y, si empatan, por nombre.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT c.nombre, COUNT(p.id) AS pedidos FROM clientes c LEFT JOIN pedidos p ON p.cliente_id = c.id GROUP BY c.id ORDER BY pedidos DESC, c.nombre;', hint: 'Con <code>LEFT JOIN</code> se conservan los clientes sin pedidos; <code>COUNT(p.id)</code> no cuenta los NULL.' },
      { t: 'Categorías que venden', s: 'HAVING', g: '<p>Calcula el total vendido por <code>categoria</code> (cantidad × precio, redondeado a 2 decimales, columna <code>total</code>) y muestra solo las categorías con total <b>mayor a 20</b>, de mayor a menor.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT pr.categoria, ROUND(SUM(pe.cantidad * pr.precio), 2) AS total FROM pedidos pe JOIN productos pr ON pr.id = pe.producto_id GROUP BY pr.categoria HAVING total > 20 ORDER BY total DESC;', hint: 'Filtra grupos con <code>HAVING</code> (no <code>WHERE</code>), después del <code>GROUP BY</code>.' },
      { t: 'Más caros que el promedio', s: 'Subconsulta', g: '<p>Muestra <code>nombre</code> y <code>precio</code> de los productos cuyo precio es <b>mayor que el precio promedio</b> de todos los productos, ordenados por precio.</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT nombre, precio FROM productos WHERE precio > (SELECT AVG(precio) FROM productos) ORDER BY precio;', hint: 'Escribe un <code>SELECT AVG(precio)</code> entre paréntesis dentro del <code>WHERE</code>.' },
      { t: 'Detalle de pedidos', s: 'JOIN de tres tablas', g: '<p>Para cada pedido muestra: <code>id</code>, el nombre del cliente (<code>cliente</code>), el del producto (<code>producto</code>) y el importe <code>cantidad × precio</code> (columna <code>importe</code>). Ordena por <code>id</code> del pedido.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT pe.id, c.nombre AS cliente, pr.nombre AS producto, pe.cantidad * pr.precio AS importe FROM pedidos pe JOIN clientes c ON c.id = pe.cliente_id JOIN productos pr ON pr.id = pe.producto_id ORDER BY pe.id;', hint: '<code>pedidos</code> tiene <code>cliente_id</code> y <code>producto_id</code>: haz un <code>JOIN</code> para cada uno.' }
    ]
  });
  JT.retosDef('sq3', {
    lang: 'sql', items: [
      { t: 'Ganan más que su departamento', s: 'CTE', g: '<p>Con una <b>CTE</b>, muestra el <code>nombre</code> y el <code>salario</code> de los empleados que ganan <b>más que el promedio de su propio departamento</b>, ordenados por nombre.</p>', start: '-- escribe tu consulta\n',
        sol: 'WITH prom AS (SELECT depto_id, AVG(salario) AS p FROM empleados GROUP BY depto_id) SELECT e.nombre, e.salario FROM empleados e JOIN prom ON prom.depto_id = e.depto_id WHERE e.salario > prom.p ORDER BY e.nombre;', hint: 'La CTE calcula el promedio por departamento; únela con <code>empleados</code> por <code>depto_id</code>.' },
      { t: 'Cadena de mando', s: 'WITH RECURSIVE', g: '<p>Muestra la <b>cadena de jefes</b> de Eva, empezando por ella y subiendo hasta quien no tiene jefe. Una sola columna: <code>nombre</code>, en ese orden (Eva primero).</p>', start: '-- escribe tu consulta\n',
        sol: "WITH RECURSIVE cadena(id, nombre, jefe_id, nivel) AS (SELECT id, nombre, jefe_id, 0 FROM empleados WHERE nombre = 'Eva' UNION ALL SELECT e.id, e.nombre, e.jefe_id, c.nivel + 1 FROM empleados e JOIN cadena c ON e.id = c.jefe_id) SELECT nombre FROM cadena ORDER BY nivel;", hint: 'El caso base es Eva; el recursivo une a cada fila con su jefe (<code>e.id = c.jefe_id</code>). Un contador <code>nivel</code> sirve para ordenar.' },
      { t: 'Ranking por departamento', s: 'RANK() OVER', g: '<p>Muestra <code>nombre</code>, <code>depto_id</code>, <code>salario</code> y la posición salarial dentro de su departamento (columna <code>pos</code>, 1 = el que más gana). Ordena por departamento, posición y nombre.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT nombre, depto_id, salario, RANK() OVER (PARTITION BY depto_id ORDER BY salario DESC) AS pos FROM empleados ORDER BY depto_id, pos, nombre;', hint: '<code>RANK() OVER (PARTITION BY depto_id ORDER BY salario DESC)</code>.' },
      { t: 'Ventas acumuladas', s: 'SUM() OVER', g: '<p>Muestra <code>id</code>, <code>monto</code> y el total acumulado de ventas hasta esa fila (columna <code>acumulado</code>), ordenando por fecha y luego por id.' + COLS + '</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT id, monto, SUM(monto) OVER (ORDER BY fecha, id) AS acumulado FROM ventas ORDER BY fecha, id;', hint: '<code>SUM(monto) OVER (ORDER BY fecha, id)</code> suma de la primera fila hasta la actual.' },
      { t: 'Empleados sin ventas', s: 'NOT EXISTS', g: '<p>Muestra el <code>nombre</code> de los empleados que <b>no tienen ninguna venta</b> registrada, en orden alfabético.</p>', start: '-- escribe tu consulta\n',
        sol: 'SELECT nombre FROM empleados e WHERE NOT EXISTS (SELECT 1 FROM ventas v WHERE v.empleado_id = e.id) ORDER BY nombre;', hint: '<code>NOT EXISTS (SELECT 1 FROM ventas v WHERE v.empleado_id = e.id)</code> filtra a quienes no tienen filas relacionadas.' }
    ]
  });
})();
