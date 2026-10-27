/* BLOODYCAPELLA QUIZ ENGINE v1.0 */
(() => {
"use strict";
const root=document.getElementById("bc-quiz");
if(!root||root.dataset.bcInitialized==="1") return;
root.dataset.bcInitialized="1";
const $=id=>document.getElementById(id);
const el={intro:$("bc-intro"),game:$("bc-game"),results:$("bc-results"),start:$("bc-start"),next:$("bc-next"),back:$("bc-back"),restart:$("bc-restart"),share:$("bc-share"),number:$("bc-number"),progress:$("bc-progress"),percent:$("bc-progress-text"),question:$("bc-question"),options:$("bc-options"),warning:$("bc-warning"),loading:$("bc-loading"),error:$("bc-error"),count:$("bc-question-count"),name:$("bc-result-name"),tag:$("bc-result-tag"),description:$("bc-result-description"),traits:$("bc-traits"),second:$("bc-second"),bars:$("bc-bars")};
const COUNT=30, qURL=root.dataset.questionsUrl, cURL=root.dataset.charactersUrl;
let questions=[],characters={},round=[],answers=[],index=0,winner="";
const hide=e=>{if(e)e.hidden=true},show=e=>{if(e)e.hidden=false};
function screen(which){[el.intro,el.game,el.results].forEach(hide);show(which)}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
async function load(){
 if(!qURL||!cURL||/TU_USUARIO|TU_REPOSITORIO/.test(qURL+cURL))throw Error("Configura las URL públicas de GitHub en los atributos data-questions-url y data-characters-url.");
 const [a,b]=await Promise.all([fetch(qURL,{cache:"no-store"}),fetch(cURL,{cache:"no-store"})]);
 if(!a.ok)throw Error("No se pudo descargar questions.txt (HTTP "+a.status+").");
 if(!b.ok)throw Error("No se pudo descargar characters.json (HTTP "+b.status+").");
 const [q,c]=await Promise.all([a.json(),b.json()]);
 if(!Array.isArray(q)||q.length<COUNT)throw Error("El banco necesita al menos 30 preguntas.");
 if(!c||typeof c!=="object")throw Error("characters.json no tiene un formato válido.");
 const ids=new Set();
 q.forEach((item,i)=>{if(!item.id||!item.question||!Array.isArray(item.answers)||item.answers.length<2)throw Error("Pregunta inválida en posición "+(i+1)+".");if(ids.has(item.id))throw Error("ID duplicado: "+item.id);ids.add(item.id);item.answers.forEach(x=>{if(!x.text||!c[x.character])throw Error("Respuesta o personaje no válido en "+item.id+".")})});
 questions=q;characters=c;
}
function begin(){round=shuffle(questions).slice(0,COUNT);answers=Array(COUNT).fill(null);index=0;screen(el.game);render()}
function render(){
 const q=round[index];el.number.textContent="REGISTRO "+String(index+1).padStart(2,"0")+" / "+COUNT;
 el.progress.style.width=((index+1)/COUNT*100)+"%";el.percent.textContent=Math.round((index+1)/COUNT*100)+"%";
 el.question.textContent=q.question;el.options.replaceChildren();hide(el.warning);
 shuffle(q.answers).forEach(answer=>{
  const btn=document.createElement("button");btn.type="button";btn.className="bc-option";btn.textContent=answer.text;
  const active=answers[index]===answer.character;btn.classList.toggle("is-selected",active);btn.setAttribute("aria-pressed",String(active));
  btn.addEventListener("click",()=>{answers[index]=answer.character;[...el.options.children].forEach(x=>{x.classList.remove("is-selected");x.setAttribute("aria-pressed","false")});btn.classList.add("is-selected");btn.setAttribute("aria-pressed","true");hide(el.warning)});
  el.options.append(btn);
 });
 el.back.disabled=index===0;el.next.textContent=index===COUNT-1?"CALCULAR RESULTADO":"SIGUIENTE →";
}
function result(){
 const scores=Object.fromEntries(Object.keys(characters).map(k=>[k,0]));
 answers.forEach(k=>{if(k in scores)scores[k]++});
 const ranking=Object.entries(scores).sort((a,b)=>b[1]-a[1]||Math.random()-.5);
 winner=ranking[0][0];const main=characters[winner],secondary=ranking[1][1]?characters[ranking[1][0]]:null,total=answers.filter(Boolean).length;
 el.name.textContent=main.name;el.tag.textContent=main.code+" // "+main.title;el.description.textContent=main.description;
 el.traits.replaceChildren();(main.traits||[]).forEach(t=>{const s=document.createElement("span");s.className="bc-trait";s.textContent=t;el.traits.append(s)});
 el.second.textContent=secondary?"Afinidad secundaria: "+secondary.name+" ("+ranking[1][1]+" respuestas)":"No se detectó una afinidad secundaria clara.";
 el.bars.replaceChildren();ranking.forEach(([key,value])=>{const row=document.createElement("div");row.className="bc-score-row";const label=document.createElement("div");label.className="bc-score-label";const n=document.createElement("span"),v=document.createElement("strong");n.textContent=characters[key].name;v.textContent=value+"/"+total;label.append(n,v);const track=document.createElement("div");track.className="bc-score-track";const fill=document.createElement("div");fill.className="bc-score-fill";fill.style.width=(value/Math.max(1,total)*100)+"%";track.append(fill);row.append(label,track);el.bars.append(row)});
 screen(el.results);
}
el.start.addEventListener("click",begin);
el.next.addEventListener("click",()=>{if(!answers[index]){el.warning.textContent="Selecciona una respuesta antes de continuar.";show(el.warning);return}if(index<COUNT-1){index++;render()}else result()});
el.back.addEventListener("click",()=>{if(index>0){index--;render()}});
el.restart.addEventListener("click",()=>screen(el.intro));
el.share.addEventListener("click",()=>{const c=characters[winner],txt="Mi resultado en BloodyCapella Quiz Engine: "+c.name+" — "+c.title+".";if(navigator.share)navigator.share({title:"BloodyCapella Quiz",text:txt}).catch(()=>{});else if(navigator.clipboard?.writeText)navigator.clipboard.writeText(txt).then(()=>{el.share.textContent="COPIADO"}).catch(()=>prompt("Copia tu resultado:",txt));else prompt("Copia tu resultado:",txt)});
(async()=>{try{el.start.disabled=true;show(el.loading);await load();hide(el.loading);el.start.disabled=false;el.count.textContent=questions.length+" preguntas disponibles. Se seleccionarán 30 distintas por partida."}catch(e){hide(el.loading);show(el.error);el.error.textContent="ERROR DE SISTEMA: "+e.message;el.start.disabled=true}})();
})();