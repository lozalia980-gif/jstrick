/* Validacion estatica del contenido de js-trick (se ejecuta con: node tools/validate.js) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
global.window = global; global.document = { getElementById() { return null; } };
global.localStorage = { getItem() { return null; }, setItem() { } };
const load = f => vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
['js/core.js', 'js/tracks.js', 'js/highlight.js', 'js/glossary1.js', 'js/glossary2.js', 'js/glossary3.js', 'js/glossary4.js', 'js/hl-langs.js', 'js/linter.js', 'js/lint-langs.js', 'js/lib-prelude.js', 'js/lib-jquery.js', 'js/lib-angular.js'].forEach(load);
const only = process.argv[2];
load('js/data/tk.js');
fs.readdirSync(path.join(root, 'js/data')).sort().forEach(f => { if (f !== 'tk.js' && (!only || f.includes(only))) load('js/data/' + f); });
const JT = global.JT;
let problems = 0, checked = 0;
const dump = [];
const bad = (where, msg) => { problems++; console.log('  [X] ' + where + ': ' + msg); };

function orderFiles(t, files) { return files; }
JT.topics.forEach(t => {
  console.log('== ' + t.id + ' ' + t.title + ' (' + t.examples.length + ' ejemplos, ' + t.exercises.length + ' ejercicios, ' + (t.quiz || []).length + ' preguntas)');
  if (t.examples.length < 10) bad(t.id, 'menos de 10 ejemplos');
  if (t.exercises.length < 5) bad(t.id, 'menos de 5 ejercicios');
  if (t.kind === 'term' && t.examples.some(e => e.out == null)) bad(t.id, 'ejemplo sin salida esperada (out)');
  if (t.examples.length !== t.exercises.length && t.track && t.track !== 'js') bad(t.id, 'cada ejemplo debe tener su ejercicio (1 a 1)');
  const kind = t.kind || 'web';
  t.examples.forEach((ex, i) => {
    const w = t.id + ' ejemplo ' + (i + 1) + ' (' + ex.title + ')';
    checked++;
    if (!ex.parts || !ex.parts.length) return bad(w, 'sin partes');
    ex.parts.forEach((p, k) => { if (!p.why) bad(w, 'parte ' + (k + 1) + ' sin explicacion'); });
    const files = JT.filesFromParts(ex.parts);
    const lang = kind === 'term' ? JT.trackOf(t).lang : undefined;
    if (lang) dump.push({ id: ex.id, lang, code: files[lang], out: ex.out, seed: t.seed });
    const issues = JT.lint({ files, kind, lang, lib: ex.lib || t.lib });
    issues.filter(x => x.sev !== 'info').forEach(x => bad(w, x.sev + ' ' + x.file + ':' + x.line + ' ' + x.title + ' -> ' + x.msg.replace(/<[^>]+>/g, '').slice(0, 140)));
  });
  t.exercises.forEach((xs, i) => {
    const w = t.id + ' ejercicio ' + (i + 1) + ' (' + xs.title + ')';
    checked++;
    if (xs.steps.length < (t.compact ? 2 : 4)) bad(w, 'pocos pasos');
    const files = Object.assign({}, xs.base || {});
    xs.steps.forEach((s, k) => {
      const sw = w + ' paso ' + (k + 1);
      ['title', 'instr', 'why', 'hint', 'sol'].forEach(f => { if (!s[f] && !(s.type === 'blank' && f === 'sol' && s.tpl)) bad(sw, 'falta ' + f); });
      let text;
      if (s.type === 'blank') {
        text = s.tpl.replace(/\[\[([\s\S]*?)\]\]/g, (m, a) => a.split('|')[0].trim());
        const solN = JT.norm(s.sol || ''), tN = JT.norm(text);
        if (s.sol && solN !== tN) bad(sw, 'sol no coincide con tpl: ' + solN + ' vs ' + tN);
      } else {
        text = s.sol;
        const n = JT.norm(text), ok = typeof s.ok === 'function' ? s.ok(n, text) : s.ok && s.ok.test(n);
        if (!ok) bad(sw, 'la solucion NO cumple ok: ' + n);
        // las pistas multi-linea tambien deben pasar
      }
      const pad = '  '.repeat(s.indent || 0), k2 = s.file || 'js';
      const lines = text.split('\n').map(l => l.trim() ? pad + l : l);
      let cur = files[k2] == null ? '' : files[k2], ls = cur ? cur.split('\n') : [], at = -1;
      for (let a = 0; a < ls.length; a++) if (ls[a].indexOf('tu código aquí') >= 0 && (!s.at || ls[a].indexOf(s.at) >= 0)) { at = a; break; }
      if (at >= 0) ls.splice(at, 0, ...lines); else ls.push(...lines);
      files[k2] = ls.join('\n');
      // pasos errs: ninguna debe aceptar la solucion
      (s.errs || []).forEach(e => { if (e[0].test(JT.norm(text))) bad(sw, 'un patron de error coincide con la solucion: ' + e[0]); });
    });
    Object.keys(files).forEach(k => { files[k] = files[k].split('\n').filter(l => l.indexOf('tu código aquí') < 0).join('\n'); });
    const lang2 = kind === 'term' ? JT.trackOf(t).lang : undefined;
    if (lang2) { if (xs.out == null) bad(w, 'sin salida esperada (out)'); dump.push({ id: xs.id, lang: lang2, code: files[lang2], out: xs.out, seed: t.seed }); }
    const issues = JT.lint({ files, kind, lang: lang2, lib: xs.lib || t.lib });
    issues.filter(x => x.sev !== 'info').forEach(x => bad(w + ' (codigo final)', x.sev + ' ' + x.file + ':' + x.line + ' ' + x.title + ' -> ' + x.msg.replace(/<[^>]+>/g, '').slice(0, 140)));
  });
  (t.quiz || []).forEach((q, i) => { if (q.a < 0 || q.a >= q.opts.length) bad(t.id + ' quiz ' + (i + 1), 'indice de respuesta fuera de rango'); });
});
fs.writeFileSync(path.join(__dirname, '.termdump.json'), JSON.stringify(dump));
console.log('\nRevisados: ' + checked + ' | problemas: ' + problems);
process.exit(problems ? 1 : 0);
