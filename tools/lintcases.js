const fs=require('fs'),path=require('path'),vm=require('vm');
global.window=global;global.document={getElementById(){return null}};global.localStorage={getItem(){return null},setItem(){}};
const load=f=>vm.runInThisContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),{filename:f});
['js/core.js','js/highlight.js','js/glossary1.js','js/glossary2.js','js/linter.js','js/lib-angular.js'].forEach(load);
const cases=[
 ['js','var x = JSON.parsee(\'{"a":1}\');'],
 ['js','localStorage.setitem("a","b");'],
 ['js','localStorage.setItem("a");'],
 ['js','var o={a:1};\nlocalStorage.setItem("o", o);'],
 ['js','var t = JSON.parse("{\'a\':1}");'],
 ['js','if (x = 5) { alert(1); }'],
 ['js','document.getElementById("#caja").innerHTML = "hola";'],
 ['js','var arr=[1,2,3];\nconsole.log(arr.length());'],
 ['js','function f( {\n  return 1;\n}'],
 ['js','var s = "hola;\nconsole.log(s);'],
 ['js','var xhr = XMLHttpRequest();\nxhr.open("GET");'],
 ['js','xhr.send();\nvar xhr = new XMLHttpRequest();\nxhr.open("GET","x");'],
 ['js','document.getElementById("boton").addEventListener("onclick", f);'],
 ['js','while(true){ console.log(1); }'],
 ['js','var a = { font-weight: "bold" };'],
 ['js','document.getElementbyid("x");'],
 ['js','var x = 5;\nvar x = 6;\nlet y; let y;'],
 ['js','console.logg("a");'],
 ['jq','$("#caja").fadein();'],
 ['jq','$("caja").hide();'],
 ['jq','$("#x").explotar();'],
 ['jq','$(document).ready(function () {\n  $("#a").click(function () {\n    $(this).hide();\n  });\n'],
 ['css','p { colour: red; font-size: 20 }\n.a { width: 100 }'],
 ['css','p { color: red;'],
 ['html','<div><span>hola</div></span>'],
 ['html','<dvi id="a">x</dvi>'],
 ['html','<p id="a">uno</p><p id="a">dos</p>'],
];
cases.forEach(([k,code])=>{
  const files = k==='css'?{css:code}:k==='html'?{html:code}:{html:'<div id="caja"></div><button id="boton"></button>',js:code};
  const r=JT.lint({files,kind:'web',lib:k==='jq'?'jq':null});
  console.log('--- '+k+': '+code.replace(/\n/g,' ⏎ ').slice(0,70));
  r.forEach(x=>console.log('   ['+x.sev+'] '+x.file+':'+x.line+' '+x.title));
  if(!r.length) console.log('   (sin avisos)');
});
