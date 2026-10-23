"""Comprueba que la salida esperada (out) de los ejemplos y ejercicios coincide con la ejecucion real.
Uso: node tools/validate.js && python tools/checkterm.py
Python y SQL (sqlite) se ejecutan de verdad; C#, C, C++ y PHP se ejecutan solo si hay compilador instalado."""
import io, json, os, shutil, subprocess, sys, sqlite3, tempfile

here = os.path.dirname(os.path.abspath(__file__))
items = json.load(io.open(os.path.join(here, '.termdump.json'), encoding='utf8'))
bad = 0
fill_path = sys.argv[sys.argv.index('--fill') + 1] if '--fill' in sys.argv else None
fill_src = io.open(fill_path, encoding='utf8').read() if fill_path else None
ran = {}
skipped = {}


def fmt(v):
    if v is None: return 'NULL'
    if isinstance(v, float) and v.is_integer(): return str(int(v))
    return str(v)


def table(cols, rows):
    w = [max([len(str(c))] + [len(fmt(r[i])) for r in rows]) for i, c in enumerate(cols)]
    cell = lambda v, i: fmt(v).ljust(w[i])
    out = [' | '.join(cell(c, i) for i, c in enumerate(cols)), '-+-'.join('-' * n for n in w)]
    for r in rows:
        out.append(' | '.join(cell(v, i) for i, v in enumerate(r)))
    out.append('(%d %s)' % (len(rows), 'fila' if len(rows) == 1 else 'filas'))
    return '\n'.join(out)


def run_py(code):
    r = subprocess.run([sys.executable, '-I', '-X', 'utf8', '-c', code], capture_output=True, text=True, encoding='utf8', timeout=20)
    return (r.stdout + r.stderr).replace('\r', '')


def run_sql(code, seed):
    db = sqlite3.connect(':memory:')
    parts = []
    if seed:
        db.executescript(seed)
    for stmt in split_sql(code):
        cur = db.execute(stmt)
        if cur.description:
            parts.append(table([d[0] for d in cur.description], cur.fetchall()))
    db.close()
    return '\n\n'.join(parts) if parts else 'Sentencias ejecutadas correctamente.'


def split_sql(code):
    out, buf = [], ''
    for line in code.split('\n'):
        buf += line + '\n'
        if sqlite3.complete_statement(buf):
            out.append(buf.strip()); buf = ''
    if buf.strip():
        out.append(buf.strip())
    return out


def run_native(lang, code):
    d = tempfile.mkdtemp()
    try:
        if lang in ('c', 'cpp') and shutil.which('gcc' if lang == 'c' else 'g++'):
            src = os.path.join(d, 'main.' + lang); io.open(src, 'w', encoding='utf8').write(code)
            exe = os.path.join(d, 'main.exe')
            c = subprocess.run([('gcc' if lang == 'c' else 'g++'), src, '-o', exe, '-lm'], capture_output=True, text=True)
            if c.returncode: return 'COMPILE ERROR\n' + c.stderr
            return subprocess.run([exe], capture_output=True, text=True, timeout=10).stdout.replace('\r', '')
        if lang == 'cs' and shutil.which('dotnet'):
            proj = os.path.join(here, '.cs_tmp')
            os.makedirs(proj, exist_ok=True)
            io.open(os.path.join(proj, 'app.csproj'), 'w', encoding='utf8').write('<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><ImplicitUsings>disable</ImplicitUsings><Nullable>disable</Nullable><NoWarn>CS8981;CS0168;CS0219;CS0162</NoWarn></PropertyGroup></Project>')
            io.open(os.path.join(proj, 'Program.cs'), 'w', encoding='utf8').write(code)
            b = subprocess.run(['dotnet', 'build', 'app.csproj', '-o', 'out', '-nologo', '-v', 'q'], cwd=proj, capture_output=True, text=True, encoding='utf8')
            if b.returncode: return 'COMPILE ERROR\n' + (b.stdout + b.stderr)[-1500:]
            return subprocess.run([os.path.join(proj, 'out', 'app.exe')], capture_output=True, text=True, encoding='utf8', timeout=20, env=dict(os.environ, DOTNET_SYSTEM_GLOBALIZATION_INVARIANT='1')).stdout.replace('\r', '')
        if lang == 'php' and shutil.which('php'):
            src = os.path.join(d, 'index.php'); io.open(src, 'w', encoding='utf8').write(code)
            return subprocess.run(['php', src], capture_output=True, text=True, timeout=10).stdout.replace('\r', '')
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return None


for it in items:
    lang, code, exp = it['lang'], it['code'] or '', (it['out'] or '').rstrip('\n')
    try:
        if lang == 'py': got = run_py(code)
        elif lang == 'sql': got = run_sql(code, it.get('seed'))
        else: got = run_native(lang, code)
    except Exception as e:
        got = 'EXC ' + repr(e)
    if got is None:
        skipped[lang] = skipped.get(lang, 0) + 1
        continue
    ran[lang] = ran.get(lang, 0) + 1
    got = got.rstrip('\n')
    if fill_src is not None and it['out'] == '@@':
        lit = "'" + got.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n') + "'"
        fill_src = fill_src.replace("'@@'", lit, 1)
        continue
    if got != exp:
        bad += 1
        print('[X] %s (%s)\n--- esperado ---\n%s\n--- real ---\n%s\n' % (it['id'], lang, exp, got))

if fill_path:
    io.open(fill_path, 'w', encoding='utf8').write(fill_src); print('Rellenado', fill_path)
print('Ejecutados:', ran, '| sin compilador (no verificados):', skipped, '| diferencias:', bad)
sys.exit(1 if bad else 0)
