import './style.css';

type Shot = 'dink' | 'drive' | 'lob';
type Level = { id:number; title:string; brief:string; hint:string; shot:Shot; target:[number,number]; defenders:[number,number][]; moves:number; };
const LEVELS:Level[] = [
 {id:1,title:'Encuentra el hueco',brief:'La rival cubre el centro. Busca un espacio libre en la pista.',hint:'Un golpe suave a la cocina puede dejarla fuera de posición.',shot:'dink',target:[72,34],defenders:[[50,22],[49,42]] ,moves:3},
 {id:2,title:'Cerca de la línea',brief:'La rival se ha adelantado. Juega profundo, cerca de la línea de fondo.',hint:'Un drive profundo supera a quien está pegado a la red.',shot:'drive',target:[24,12],defenders:[[48,28],[70,39]],moves:3},
 {id:3,title:'Por encima',brief:'Los dos rivales presionan la red. Necesitas cambiar la altura.',hint:'El globo pasa por encima de los jugadores adelantados.',shot:'lob',target:[78,13],defenders:[[35,31],[65,29]],moves:3},
 {id:4,title:'Dink cruzado',brief:'La zona central está cerrada. Ataca la esquina corta.',hint:'El dink cruzado busca un ángulo corto y preciso.',shot:'dink',target:[18,39],defenders:[[48,25],[78,37]],moves:3},
 {id:5,title:'El pasillo',brief:'La pareja rival deja libre una banda. Encuentra el pasillo.',hint:'Un drive lateral puede castigar una mala colocación.',shot:'drive',target:[86,27],defenders:[[42,20],[55,40]],moves:3},
 {id:6,title:'Globos y paciencia',brief:'La red está protegida, pero el fondo está desocupado.',hint:'Eleva la pelota para superar la presión.',shot:'lob',target:[28,11],defenders:[[30,31],[68,30]],moves:3},
 {id:7,title:'La cocina',brief:'Tu rival no llega a una pelota corta junto a la línea de no volea.',hint:'Controla la fuerza: el dink debe caer en la cocina.',shot:'dink',target:[78,45],defenders:[[34,27],[56,35]],moves:2},
 {id:8,title:'Cambio de dirección',brief:'Los rivales se han desplazado hacia la izquierda.',hint:'Busca el espacio contrario con un drive.',shot:'drive',target:[82,17],defenders:[[25,24],[42,39]],moves:2},
 {id:9,title:'Sobre sus cabezas',brief:'Ambos jugadores están muy cerca de la red.',hint:'Un globo alto puede cambiar el punto.',shot:'lob',target:[16,14],defenders:[[34,30],[68,28]],moves:2},
 {id:10,title:'Ángulo imposible',brief:'El centro está defendido. Necesitas precisión junto a la línea lateral.',hint:'Un dink bien colocado abre un ángulo difícil.',shot:'dink',target:[87,42],defenders:[[49,25],[72,35]],moves:2},
 {id:11,title:'Última oportunidad',brief:'Queda poco espacio y solo dos golpes. Lee la posición rival.',hint:'El globo al fondo evita a los dos defensores adelantados.',shot:'lob',target:[80,10],defenders:[[30,32],[61,29]],moves:2},
 {id:12,title:'Beast mode',brief:'El reto final: elige el golpe adecuado y encuentra el hueco.',hint:'Observa la pista. La solución está en combinar lectura y precisión.',shot:'drive',target:[17,16],defenders:[[47,24],[76,39]],moves:2}
];
const KEY='picklebeasts-puzzle-v1';
type Save={unlocked:number; stars:Record<number,number>; best:Record<number,number>};
function load():Save { try { const v=JSON.parse(localStorage.getItem(KEY)||'null'); if(v&&typeof v.unlocked==='number') return v; } catch {} return {unlocked:1,stars:{},best:{}}; }
let save=load(),current=LEVELS[0],shot:Shot='dink',aim:[number,number]|null=null,moves=0,screen:'home'|'level'|'result'='home',resultText='',lastStars=0;
const app=document.querySelector<HTMLDivElement>('#app');
if(!app) throw new Error('No se encuentra el contenedor principal');
const esc=(s:string)=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c));
const shotNames:Record<Shot,string>={dink:'DINK',drive:'DRIVE',lob:'GLOBO'};
function persist(){localStorage.setItem(KEY,JSON.stringify(save));}
function shell(body:string){app!.innerHTML='<div class="pb-app"><header class="pb-top"><button class="pb-brand" data-home>PICKLE<span>BEASTS</span></button><div class="pb-progress">NIVEL '+Math.min(save.unlocked,12)+' / 12</div></header>'+body+'</div>';app!.querySelector('[data-home]')?.addEventListener('click',home);}
function home(){
 screen='home';
 const cards=LEVELS.map(l=>{const open=l.id<=save.unlocked,stars=save.stars[l.id]||0;return '<button class="pb-level '+(open?'':'locked')+'" data-open="'+l.id+'" '+(open?'':'disabled')+'><span class="pb-level-no">'+String(l.id).padStart(2,'0')+'</span><span class="pb-level-name">'+esc(l.title)+'</span><span class="pb-stars">'+('★'.repeat(stars))+('☆'.repeat(3-stars))+'</span><span class="pb-level-arrow">'+(open?'›':'🔒')+'</span></button>'}).join('');
 shell('<main class="pb-home"><div class="pb-kicker">PUZZLE ADVENTURE · PICKLEBALL</div><h1>JUEGA CON<br><em>INTELIGENCIA.</em></h1><p class="pb-lead">Lee la pista. Elige tu golpe. Encuentra el hueco. Cada nivel te acerca a convertirte en una PickleBeast.</p><div class="pb-feature"><div class="pb-court-mini"><span class="mini-ball"></span><span class="mini-target"></span><span class="mini-net"></span></div><div><b>DESAFÍO DE PISTA</b><small>12 retos · 3 tipos de golpe · precisión y estrategia</small></div><button class="pb-play" data-play>JUGAR</button></div><div class="pb-section-head"><b>CAPÍTULO 01 · ROOKIE</b><span>'+Object.keys(save.stars).length+' / 12 superados</span></div><div class="pb-levels">'+cards+'</div><p class="pb-footnote">Sin prisas. Sin azar. Cada reto tiene una solución que puedes descubrir.</p></main>');
 app!.querySelector('[data-play]')?.addEventListener('click',()=>openLevel(Math.min(save.unlocked,12)));
 app!.querySelectorAll<HTMLElement>('[data-open]').forEach(b=>b.addEventListener('click',()=>openLevel(Number(b.dataset.open))));
}
function courtSvg(){
 const l=current,tx=30+l.target[0]*3,ty=38+l.target[1]*4.35;
 const defenders=l.defenders.map((p,i)=>{const x=30+p[0]*3,y=38+p[1]*4.35;return '<g><circle cx="'+x+'" cy="'+y+'" r="18" fill="#ff704d" opacity=".18"/><circle cx="'+x+'" cy="'+y+'" r="10" fill="#ff704d" stroke="#fff" stroke-width="2"/><text x="'+x+'" y="'+(y+3)+'" text-anchor="middle" font-size="8" font-weight="900" fill="#17201d">'+(i+1)+'</text></g>'}).join('');
 const aimMark=aim?'<line x1="180" y1="424" x2="'+(30+aim[0]*3)+'" y2="'+(38+aim[1]*4.35)+'" stroke="#d8ff59" stroke-width="3" stroke-dasharray="7 6"/><circle cx="'+(30+aim[0]*3)+'" cy="'+(38+aim[1]*4.35)+'" r="9" fill="#d8ff59" stroke="#17201d" stroke-width="2"/>':'';
 return '<svg class="pb-court" id="court" viewBox="0 0 360 520" role="img" aria-label="Pista de pickleball interactiva"><defs><pattern id="grain" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#fff" opacity=".1"/></pattern></defs><rect x="30" y="38" width="300" height="444" rx="5" fill="#3976a9"/><rect x="30" y="38" width="300" height="444" rx="5" fill="url(#grain)"/><rect x="30" y="38" width="300" height="444" fill="none" stroke="#fff" stroke-width="3"/><line x1="180" y1="38" x2="180" y2="482" stroke="#fff" stroke-width="2"/><line x1="30" y1="260" x2="330" y2="260" stroke="#f7f7ed" stroke-width="5"/><line x1="30" y1="198" x2="330" y2="198" stroke="#fff" stroke-width="2"/><line x1="30" y1="322" x2="330" y2="322" stroke="#fff" stroke-width="2"/><line x1="105" y1="38" x2="105" y2="198" stroke="#fff" stroke-width="2"/><line x1="255" y1="38" x2="255" y2="198" stroke="#fff" stroke-width="2"/><line x1="105" y1="322" x2="105" y2="482" stroke="#fff" stroke-width="2"/><line x1="255" y1="322" x2="255" y2="482" stroke="#fff" stroke-width="2"/><rect x="30" y="198" width="300" height="124" fill="#b9f227" opacity=".13"/><text x="180" y="253" text-anchor="middle" fill="#fff" opacity=".75" font-size="10" font-weight="900" letter-spacing="2">RED</text><text x="180" y="313" text-anchor="middle" fill="#fff" opacity=".75" font-size="10" font-weight="900" letter-spacing="2">KITCHEN</text><text x="180" y="62" text-anchor="middle" fill="#fff" opacity=".8" font-size="9" font-weight="900">CAMPO RIVAL</text><text x="180" y="466" text-anchor="middle" fill="#fff" opacity=".8" font-size="9" font-weight="900">TU CAMPO</text><circle cx="'+tx+'" cy="'+ty+'" r="24" fill="#b9f227" opacity=".25" stroke="#d8ff59" stroke-width="3" stroke-dasharray="5 4"/><circle cx="'+tx+'" cy="'+ty+'" r="4" fill="#d8ff59"/>'+defenders+aimMark+'<circle cx="180" cy="424" r="12" fill="#d8ff59" stroke="#17201d" stroke-width="3"/><circle cx="180" cy="424" r="3" fill="#17201d"/></svg>';
}
function openLevel(id:number){
 current=LEVELS[id-1];if(!current||id>save.unlocked)return;
 screen='level';shot=current.shot;aim=null;moves=0;
 game();
}
function game(){
 const l=current;
 shell('<main class="pb-game"><div class="pb-gamebar"><button class="pb-back" data-back>‹ MAPA</button><span>RETO '+String(l.id).padStart(2,'0')+' / 12</span><span class="pb-moves">GOLPES: <b id="moves">'+(l.moves-moves)+'</b></span></div><div class="pb-instruction"><div class="pb-kicker">LEE LA SITUACIÓN</div><h2>'+esc(l.title)+'</h2><p>'+esc(l.brief)+'</p></div><div class="pb-court-wrap">'+courtSvg()+'<div class="pb-court-hint">TOCA LA PISTA RIVAL PARA APUNTAR</div></div><div class="pb-shot-picker"><button data-shot="dink" class="'+(shot==='dink'?'selected':'')+'"><b>⌁</b><span>DINK</span><small>Corto</small></button><button data-shot="drive" class="'+(shot==='drive'?'selected':'')+'"><b>↗</b><span>DRIVE</span><small>Rápido</small></button><button data-shot="lob" class="'+(shot==='lob'?'selected':'')+'"><b>⌒</b><span>GLOBO</span><small>Alto</small></button></div><div class="pb-actions"><button class="pb-reset" data-reset>REINICIAR</button><button class="pb-hit" data-hit '+(!aim?'disabled':'')+'>GOLPEAR PELOTA</button></div><p class="pb-feedback" id="feedback">'+(aim?'Objetivo seleccionado. ¡Ejecuta el golpe!':'Selecciona un punto de caída en el campo rival.')+'</p></main>');
 app!.querySelector('[data-back]')?.addEventListener('click',home);
 app!.querySelector('[data-reset]')?.addEventListener('click',()=>openLevel(l.id));
 app!.querySelectorAll<HTMLElement>('[data-shot]').forEach(b=>b.addEventListener('click',()=>{shot=b.dataset.shot as Shot;game();}));
 app!.querySelector('#court')?.addEventListener('pointerdown',(ev)=>{
  const svg=ev.currentTarget as SVGSVGElement,pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;
  const p=pt.matrixTransform(svg.getScreenCTM()!.inverse());
  const x=(p.x-30)/3,y=(p.y-38)/4.35;
  if(x<0||x>100||y<0||y>50)return;
  aim=[Math.round(x),Math.round(y)];game();
 });
 app!.querySelector('[data-hit]')?.addEventListener('click',hit);
}
function hit(){
 if(!aim)return;
 moves++;
 const [x,y]=aim,[tx,ty]=current.target;
 const distance=Math.hypot(x-tx,y-ty);
 const defender=current.defenders.some(p=>Math.hypot(x-p[0],y-p[1])<9);
 const inRange=shot===current.shot;
 const near=distance<=8;
 const feedback=app!.querySelector<HTMLElement>('#feedback');
 if(near&&!defender&&inRange){complete();return;}
 let msg='';
 if(!inRange)msg='Ese golpe no es el adecuado. Piensa en la altura y profundidad que necesitas.';
 else if(defender)msg='¡El rival llega a esa pelota! Busca un espacio menos protegido.';
 else if(distance>8)msg='La pelota cae fuera de la zona objetivo. Ajusta mejor la dirección.';
 if(moves>=current.moves){fail(msg||'Se han agotado los golpes.');return;}
 if(feedback)feedback.textContent=msg+' Te quedan '+(current.moves-moves)+' golpes.';
 const counter=app!.querySelector('#moves');if(counter)counter.textContent=String(current.moves-moves);
 aim=null;
 const court=app!.querySelector('.pb-court-wrap');if(court){const old=app!.querySelector('#court');old?.remove();court.insertAdjacentHTML('afterbegin',courtSvg());}
 app!.querySelector('[data-hit]')?.setAttribute('disabled','');
 app!.querySelector('#court')?.addEventListener('pointerdown',(ev)=>{
  const svg=ev.currentTarget as SVGSVGElement,pt=svg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const p=pt.matrixTransform(svg.getScreenCTM()!.inverse());
  const x=(p.x-30)/3,y=(p.y-38)/4.35;if(x>=0&&x<=100&&y>=0&&y<=50){aim=[Math.round(x),Math.round(y)];const wrap=app!.querySelector('.pb-court-wrap');wrap?.querySelector('#court')?.remove();wrap?.insertAdjacentHTML('afterbegin',courtSvg());app!.querySelector('[data-hit]')?.removeAttribute('disabled');const f=app!.querySelector('#feedback');if(f)f.textContent='Nuevo objetivo seleccionado. ¡Prueba otra vez!';}
 });
}
function complete(){
 const stars=moves===1?3:moves===2?2:1;
 save.stars[current.id]=Math.max(save.stars[current.id]||0,stars);
 save.best[current.id]=Math.min(save.best[current.id]||99,moves);
 save.unlocked=Math.max(save.unlocked,Math.min(12,current.id+1));persist();
 lastStars=stars;resultText='¡PUNTO GANADOR!';screen='result';result();
}
function fail(msg:string){
 screen='result';resultText=msg;lastStars=0;result();
}
function result(){
 const won=lastStars>0;
 shell('<main class="pb-result"><div class="pb-result-mark">'+(won?'★':'↻')+'</div><div class="pb-kicker">'+(won?'RETO SUPERADO':'SIGUE INTENTÁNDOLO')+'</div><h1>'+(won?'¡BUEN GOLPE!':'CASI LO TIENES')+'</h1><p>'+esc(resultText)+'</p>'+(won?'<div class="pb-earned">'+('★'.repeat(lastStars))+('☆'.repeat(3-lastStars))+'</div><div class="pb-result-detail">Nivel '+current.id+' completado</div>':'<div class="pb-result-detail">La pista tiene la solución. Vuelve a intentarlo.</div>')+'<div class="pb-result-actions"><button class="pb-reset" data-retry>'+(won?'REPETIR NIVEL':'VOLVER A INTENTAR')+'</button><button class="pb-hit" data-next>'+(won&&current.id===12?'VER MAPA':'SIGUIENTE NIVEL')+'</button></div></main>');
 app!.querySelector('[data-retry]')?.addEventListener('click',()=>openLevel(current.id));
 app!.querySelector('[data-next]')?.addEventListener('click',()=>won&&current.id<12?openLevel(current.id+1):home());
}
home();
