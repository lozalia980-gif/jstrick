const fs=require('fs'),path=require('path'),vm=require('vm');
global.window=global;global.document={getElementById(){return null}};global.localStorage={getItem(){return null},setItem(){}};
const load=f=>vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
['js/core.js','js/highlight.js','js/glossary1.js','js/glossary2.js','js/linter.js','js/lib-angular.js'].forEach(load);
const cases=[
`import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Item { id: number; nombre: string; }

@Component({
  selector: 'app-x',
  template: '<p>{{ a }}</p>'
})
export class XComponent implements OnInit {
  a: string = 'hola';
  items: Item[] = [];
  private contador = 0;
  public nombre!: string;
  opcional?: number;

  constructor(private http: HttpClient) {}

  ngOnInit() {}

  get doble(): number { return this.contador * 2; }

  sumar(n: number = 1): void { this.contador += n; }

  async cargar(): Promise<void> {
    const r = await fetch('/x');
    const lista: Item[] = (await r.json()) as Item[];
    this.items = lista.map((i: Item) => ({ id: i.id, nombre: i.nombre.toUpperCase() }));
  }

  filtrar(t: string): Item[] {
    return this.items.filter(i => i.nombre.indexOf(t) > -1);
  }
}`,
`@Injectable()
export class S {
  datos: string[] = ["a", "b"];
  getDatos(): string[] { return this.datos; }
}
@Component({ selector: "a", template: "x" })
export class C {
  constructor(private s: S) { }
  x = this.s;
}`
];
cases.forEach((c,i)=>{ const r=JT.ng.transform(c); try{ new Function(r.js); console.log('caso '+(i+1)+': sintaxis OK'); }catch(e){ console.log('caso '+(i+1)+': ERROR '+e.message); console.log(r.js.split('\n').slice(0,40).join('\n')); } });
