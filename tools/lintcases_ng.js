const fs=require('fs'),path=require('path'),vm=require('vm');
global.window=global;global.document={getElementById(){return null}};global.localStorage={getItem(){return null},setItem(){}};
const load=f=>vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
['js/core.js','js/highlight.js','js/glossary1.js','js/glossary2.js','js/linter.js','js/lib-angular.js'].forEach(load);
const TS='import { Component } from "@angular/core";\n@Component({ selector: "app-root", templateUrl: "./app.component.html" })\nexport class AppComponent {\n  nombre = "Ana";\n  lista = ["a","b"];\n  sumar(): void { }\n}';
const MOD='import { NgModule } from "@angular/core";\nimport { FormsModule } from "@angular/forms";\n@NgModule({ declarations: [AppComponent], imports: [BrowserModule], bootstrap: [AppComponent] })\nexport class AppModule { }';
const cases=[
 ['*ngfor minuscula','<li *ngfor="let x of lista">{{ x }}</li>',TS,null],
 ['ngFor sin let','<li *ngFor="x of lista">{{ x }}</li>',TS,null],
 ['propiedad inexistente','<h1>{{ titulo }}</h1>',TS,null],
 ['evento mal escrito','<button (clik)="sumar()">+</button>',TS,null],
 ['metodo inexistente','<button (click)="restar()">-</button>',TS,null],
 ['ngmodel minuscula','<input [(ngmodel)]="nombre">',TS,null],
 ['sin FormsModule','<input [(ngModel)]="nombre">',TS,MOD],
 ['sin @Component','<h1>{{ nombre }}</h1>','export class AppComponent { nombre = "x"; }',null],
 ['llave sin cerrar ts','<h1>{{ nombre }}</h1>',TS.replace('sumar(): void { }','sumar(): void {'),null],
 ['todo bien','<ul><li *ngFor="let x of lista; let i = index">{{ i }} {{ x }}</li></ul><button (click)="sumar()">+</button>',TS,null],
];
cases.forEach(([n,html,ts,mod])=>{
  const r=JT.lint({files:{html,ts,mod},kind:'ng'});
  console.log('--- '+n); r.forEach(x=>console.log('   ['+x.sev+'] '+x.file+':'+x.line+' '+x.title)); if(!r.length) console.log('   (sin avisos)');
});
