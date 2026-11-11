import Phaser from 'phaser';

type Progress={talked:boolean;balls:number;courtFixed:boolean;gateOpen:boolean;visited:string[]};
const SAVE_KEY='picklebeasts-adventure-v1';
const fresh=():Progress=>({talked:false,balls:0,courtFixed:false,gateOpen:false,visited:[]});
function readSave():Progress{try{const v=JSON.parse(localStorage.getItem(SAVE_KEY)||'null') as Progress|null;if(v&&typeof v.balls==='number')return {...fresh(),...v};}catch{}return fresh();}
function save(p:Progress){localStorage.setItem(SAVE_KEY,JSON.stringify(p));}

type Place={x:number;y:number;name:string;kind:string;body:string;done?:boolean};
class ClubWorld extends Phaser.Scene{
 private player!:Phaser.GameObjects.Container;
 private body!:Phaser.GameObjects.Arc;
 private move={x:0,y:0};
 private progress=readSave();
 private places:Place[]=[];
 private pickups:{x:number;y:number;used:boolean;g:Phaser.GameObjects.Container}[]=[];
 private hud!:HTMLElement;
 private messageUntil=0;
 private facing=1;
 constructor(){super('club-world');}
 create(){
  this.cameras.main.setBackgroundColor('#91bd83');
  this.physics.world.setBounds(0,0,900,1250);
  this.drawWorld();
  this.makePlayer();
  this.makePeopleAndPlaces();
  this.makePickups();
  this.cameras.main.startFollow(this.player,true,.08,.08);
  this.cameras.main.setBounds(0,0,900,1250);
  this.cameras.main.setZoom(.82);
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
   if(p.x<150&&p.y>this.scale.height-190)return;
   const world=this.cameras.main.getWorldPoint(p.x,p.y);
   const place=this.nearestPlace(world.x,world.y,95);
   if(place)this.interact(place);
   else this.moveTo(world.x,world.y);
  });
  window.addEventListener('pb-joystick',this.onJoystick as EventListener);
  window.addEventListener('pb-interact',this.onInteract as EventListener);
  window.addEventListener('pb-map',this.onMap as EventListener);
  this.refreshHud();
  this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{window.removeEventListener('pb-joystick',this.onJoystick as EventListener);window.removeEventListener('pb-interact',this.onInteract as EventListener);window.removeEventListener('pb-map',this.onMap as EventListener);});
 }
 private onJoystick=(e:CustomEvent<{x:number;y:number}>)=>{this.move=e.detail;};
 private onInteract=()=>{const p=this.nearestPlace(this.player.x,this.player.y,120);if(p)this.interact(p);else this.say('Acércate a alguien o a un lugar para interactuar.');};
 private onMap=()=>{this.cameras.main.pan(450,620,350,'Sine.easeInOut');this.time.delayedCall(450,()=>this.cameras.main.startFollow(this.player,true,.08,.08));};
 private drawWorld(){
  const g=this.add.graphics();
  g.fillStyle(0x83b978);g.fillRect(0,0,900,1250);
  // Soft park patches
  for(let i=0;i<28;i++){const x=Phaser.Math.Between(35,850),y=Phaser.Math.Between(40,1200);g.fillStyle(i%2?0x8fc482:0x78ad70,.32);g.fillEllipse(x,y,Phaser.Math.Between(45,100),Phaser.Math.Between(22,55));}
  // Main winding paths
  g.lineStyle(74,0xd8c69a,1);g.beginPath();g.moveTo(435,1160);g.lineTo(435,920);g.lineTo(300,790);g.lineTo(300,600);g.lineTo(450,465);g.lineTo(450,240);g.strokePath();
  g.lineStyle(6,0xe9d9b4,.55);g.beginPath();g.moveTo(435,1160);g.lineTo(435,920);g.lineTo(300,790);g.lineTo(300,600);g.lineTo(450,465);g.lineTo(450,240);g.strokePath();
  // Court plaza
  this.drawCourt(g,300,350);
  // Garden and pond
  g.fillStyle(0x4f9a9c,1);g.fillEllipse(670,680,170,110);
  g.lineStyle(8,0xc9d7a1);g.strokeEllipse(670,680,170,110);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;g.fillStyle(0x4b8d4c);g.fillCircle(670+Math.cos(a)*115,680+Math.sin(a)*80,18);}
  // Trees around edges
  for(const [x,y] of [[90,160],[170,300],[780,180],[760,390],[95,510],[120,890],[760,960],[690,1120],[260,1080],[850,760],[560,90],[60,1080]] as number[][])this.drawTree(g,x,y);
  // boundary fence
  g.lineStyle(8,0x56734e,.8);g.strokeRoundedRect(18,18,864,1214,36);
  this.add.text(450,48,'PICKLEBEASTS CLUB',{fontFamily:'Arial',fontSize:'19px',fontStyle:'bold',color:'#f5f4dd',stroke:'#426746',strokeThickness:5}).setOrigin(.5).setDepth(2);
 }
 private drawCourt(g:Phaser.GameObjects.Graphics,x:number,y:number){
  g.fillStyle(0x426d55);g.fillRoundedRect(x-150,y-8,300,220,22);
  g.fillStyle(0x477db0);g.fillRoundedRect(x-133,y,266,190,9);
  g.lineStyle(5,0xffffff);g.strokeRect(x-133,y,266,190);
  g.lineBetween(x,y,x,y+190);g.lineBetween(x-133,y+95,x+133,y+95);
  g.lineStyle(3,0xf4f4ed);g.lineBetween(x-133,y+62,x+133,y+62);g.lineBetween(x-133,y+128,x+133,y+128);
  g.fillStyle(0x202b2b);g.fillRect(x-5,y+88,10,14);
  g.fillStyle(0xffffff,.85);g.fillCircle(x+95,y+145,5);g.fillCircle(x-90,y+45,5);
 }
 private drawTree(g:Phaser.GameObjects.Graphics,x:number,y:number){
  g.fillStyle(0x604d37);g.fillRect(x-5,y+8,10,27);
  g.fillStyle(0x39754a);g.fillCircle(x,y,27);g.fillStyle(0x57985b);g.fillCircle(x-10,y-10,18);g.fillStyle(0x75ad66);g.fillCircle(x+10,y-13,13);
 }
 private makePlayer(){
  const shadow=this.add.ellipse(0,16,36,15,0x243d2c,.28);
  const legs=this.add.rectangle(0,10,16,20,0x263b48);
  const torso=this.add.rectangle(0,-5,28,28,0xb9f227).setStrokeStyle(2,0x344b31);
  const head=this.add.circle(0,-27,13,0xdba77d).setStrokeStyle(2,0x654a37);
  const hair=this.add.arc(0,-31,13,185,355,false,0x49372e);
  const cap=this.add.rectangle(0,-39,25,5,0x202c2c);
  this.player=this.add.container(435,1030,[shadow,legs,torso,head,hair,cap]).setDepth(1030);
  this.body=head;
 }
 private makePeopleAndPlaces(){
  this.addBuilding(450,205,'CLUBHOUSE',0xd9a56d);
  this.addBuilding(120,610,'TALLER',0xb4a2d7);
  this.addBuilding(670,420,'CAFÉ DINK',0xf0b36c);
  this.addNpc(365,470,'MARCUS',0xff795e);
  this.addNpc(575,820,'NAOMI',0x70a9d7);
  this.addNpc(720,565,'SOFÍA',0xd58cb5);
  this.addSign(435,900,'PORTÓN · ZONA 2',this.progress.gateOpen);
  this.places=[
   {x:450,y:245,name:'Clubhouse',kind:'club',body:'Tu base. Aquí se reúnen los miembros y se preparan las próximas aventuras.'},
   {x:300,y:420,name:'Pista central',kind:'court',body:'La pista necesita una pequeña puesta a punto. ¡Vamos a devolverle la vida!'},
   {x:365,y:470,name:'Marcus · Entrenador',kind:'npc',body:'¡Ey, rookie! Bienvenido al club. Antes de abrir la pista, necesito que recojas tres pelotas perdidas por el recinto.'},
   {x:120,y:610,name:'Taller',kind:'shop',body:'Aquí podrás personalizar tu equipo y reparar instalaciones. Pronto habrá nuevas mejoras.'},
   {x:670,y:420,name:'Café Dink',kind:'cafe',body:'El punto de encuentro del club. Escucharás rumores, conocerás gente y descubrirás retos.'},
   {x:575,y:820,name:'Naomi · Comunidad',kind:'npc',body:'¡Qué alegría tenerte aquí! Cuando el club crezca, podremos organizar eventos para todos.'},
   {x:720,y:565,name:'Sofía · Rival',kind:'npc',body:'¿Nuevo por aquí? Ya veremos si estás a la altura. Nos vemos en la pista.'},
   {x:435,y:900,name:'Portón del parque',kind:'gate',body:'Al otro lado hay nuevas pistas y personajes. Completa la primera misión para abrirlo.'}
  ];
 }
 private addBuilding(x:number,y:number,label:string,color:number){
  const g=this.add.graphics().setDepth(y-10);
  g.fillStyle(0x31533d,.22);g.fillEllipse(x,y+62,210,42);
  g.fillStyle(0x9c704d);g.fillRect(x-77,y-48,154,105);
  g.fillStyle(color);g.fillPoints([{x:x-90,y:y-48},{x,y:y-115},{x:x+90,y:y-48}],true);
  g.fillStyle(0xf0dfbb);g.fillRect(x-23,y+5,46,52);
  g.fillStyle(0x416b65);g.fillRect(x-59,y-30,34,32);g.fillRect(x+25,y-30,34,32);
  g.lineStyle(3,0x654a36);g.strokeRect(x-77,y-48,154,105);
  this.add.text(x,y+76,label,{fontFamily:'Arial',fontSize:'13px',fontStyle:'bold',color:'#fff8df',stroke:'#38543b',strokeThickness:4}).setOrigin(.5).setDepth(y+80);
 }
 private addNpc(x:number,y:number,name:string,color:number){
  const c=this.add.container(x,y).setDepth(y+20);
  c.add([this.add.ellipse(0,15,34,13,0x263b2c,.25),this.add.rectangle(0,0,25,31,color).setStrokeStyle(2,0x354a3a),this.add.circle(0,-24,13,0xdba77d).setStrokeStyle(2,0x654a37),this.add.arc(0,-28,13,185,355,false,0x49372e)]);
  this.add.text(x,y+35,name,{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#fff',stroke:'#3c5a3c',strokeThickness:4}).setOrigin(.5).setDepth(y+40);
 }
 private addSign(x:number,y:number,label:string,open:boolean){
  const g=this.add.graphics().setDepth(y);
  g.fillStyle(0x795b3a);g.fillRect(x-4,y-35,8,58);g.fillStyle(open?0xb9f227:0x354a3a);g.fillRoundedRect(x-75,y-62,150,34,7);
  this.add.text(x,y-45,open?'ZONA 2 ABIERTA':label,{fontSize:'10px',fontStyle:'bold',color:'#fff'}).setOrigin(.5).setDepth(y+1);
 }
 private makePickups(){
  const coords=[[210,770],[610,300],[760,880]];
  coords.forEach(([x,y],i)=>{
   const c=this.add.container(x,y).setDepth(y+5);
   c.add([this.add.ellipse(0,6,25,10,0x253c2d,.25),this.add.circle(0,0,9,0xd8f34c).setStrokeStyle(2,0x50652f),this.add.circle(-3,-3,2,0xffffff)]);
   this.pickups.push({x,y,used:false,g:c});
  });
 }
 private nearestPlace(x:number,y:number,max:number){let best:Place|undefined,dist=max;for(const p of this.places){const d=Phaser.Math.Distance.Between(x,y,p.x,p.y);if(d<dist){dist=d;best=p;}}return best;}
 private moveTo(x:number,y:number){this.player.setData('target',{x:Phaser.Math.Clamp(x,50,850),y:Phaser.Math.Clamp(y,80,1180)});}
 update(_t:number,dt:number){
  const target=this.player.getData('target') as {x:number;y:number}|undefined;
  let dx=this.move.x,dy=this.move.y;
  if(Math.hypot(dx,dy)<.08&&target){dx=target.x-this.player.x;dy=target.y-this.player.y;const d=Math.hypot(dx,dy);if(d<10){this.player.setData('target',null);dx=0;dy=0;}else{dx/=d;dy/=d;}}
  const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
  const speed=dt*.23;
  this.player.x=Phaser.Math.Clamp(this.player.x+dx*speed,45,855);
  this.player.y=Phaser.Math.Clamp(this.player.y+dy*speed,70,1180);
  if(Math.abs(dx)>.05)this.facing=Math.sign(dx);
  this.player.setScale(this.facing<0?-1:1,1);
  this.player.setDepth(this.player.y+30);
  this.pickups.forEach(p=>{if(!p.used&&Phaser.Math.Distance.Between(this.player.x,this.player.y,p.x,p.y)<36){p.used=true;p.g.destroy();this.progress.balls++;save(this.progress);this.refreshHud();this.say('¡Pelota recuperada! '+this.progress.balls+'/3');}});
  const near=this.nearestPlace(this.player.x,this.player.y,125);
  const label=document.getElementById('pb-nearby');if(label)label.textContent=near?'CERCA: '+near.name.toUpperCase():'EXPLORA EL CLUB';
 }
 private interact(p:Place){
  if(p.kind==='npc'&&p.name.startsWith('Marcus')){
   if(!this.progress.talked){this.progress.talked=true;this.say(p.body);}
   else if(this.progress.balls<3)this.say('¡Buen trabajo! Aún faltan '+(3-this.progress.balls)+' pelotas. Busca los destellos amarillos por el club.');
   else if(!this.progress.courtFixed)this.say('¡Las tenemos! Ahora acércate a la pista central y pulsa INTERACTUAR para repararla.');
   else this.say('¡La pista está como nueva! La aventura acaba de empezar, rookie.');
  }else if(p.kind==='court'){
   if(!this.progress.talked)this.say('Parece que alguien del club debería explicarte qué hacer primero.');
   else if(this.progress.balls<3)this.say('Necesitamos las tres pelotas perdidas antes de preparar la pista. Te faltan '+(3-this.progress.balls)+'.');
   else if(!this.progress.courtFixed){this.progress.courtFixed=true;this.progress.gateOpen=true;save(this.progress);this.refreshHud();this.say('¡PISTA RECUPERADA! Has desbloqueado el portón del parque. ¡Nueva zona disponible próximamente!');this.addSign(435,900,'PORTÓN',true);}
   else this.say('La pista está lista. Aquí llegarán los próximos desafíos.');
  }else if(p.kind==='gate'){
   this.say(this.progress.gateOpen?'¡Zona 2 desbloqueada! La siguiente área llegará en la próxima expansión.':'El portón está cerrado. Completa la misión de Marcus para abrirlo.');
  }else this.say(p.body);
  if(!this.progress.visited.includes(p.name)){this.progress.visited.push(p.name);save(this.progress);}
 }
 private say(message:string){
  const box=document.getElementById('pb-dialog');if(!box)return;
  box.innerHTML='<div class="pb-dialog-card"><button class="pb-dialog-close" aria-label="Cerrar">×</button><div class="pb-dialog-tag">PICKLEBEASTS CLUB</div><p>'+message.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]||c))+'</p><button class="pb-dialog-ok">VALE</button></div>';
  box.classList.add('show');const close=()=>box.classList.remove('show');box.querySelector('.pb-dialog-close')?.addEventListener('click',close);box.querySelector('.pb-dialog-ok')?.addEventListener('click',close);
 }
 private refreshHud(){
  const mission=document.getElementById('pb-mission');if(mission){
   const title=!this.progress.talked?'HABLA CON MARCUS':this.progress.balls<3?'RECUPERA LAS PELOTAS':!this.progress.courtFixed?'REPARA LA PISTA':'¡MISIÓN COMPLETADA!';
   const sub=!this.progress.talked?'Busca al entrenador junto a la pista':this.progress.balls<3?'Pelotas encontradas: '+this.progress.balls+'/3':!this.progress.courtFixed?'Vuelve a la pista central':'Has devuelto la vida al club';
   mission.innerHTML='<b>'+title+'</b><small>'+sub+'</small>';
  }
  const count=document.getElementById('pb-balls');if(count)count.textContent=String(this.progress.balls)+'/3';
 }
}
export function startAdventure(root:HTMLElement){
 root.innerHTML=`
 <div class="pb-world">
  <header class="pb-world-top"><div class="pb-wordmark">PICKLE<span>BEASTS</span></div><div class="pb-world-stats"><span>★ ROOKIE</span><span>● <b id="pb-balls">0/3</b></span></div></header>
  <div id="pb-game" class="pb-game-canvas"></div>
  <div class="pb-world-bottom">
   <div class="pb-mission" id="pb-mission"><b>HABLA CON MARCUS</b><small>Busca al entrenador junto a la pista</small></div>
   <div class="pb-controls"><div class="pb-joystick" id="pb-stick"><div class="pb-stick-knob" id="pb-knob"></div></div><div class="pb-control-right"><div class="pb-nearby" id="pb-nearby">EXPLORA EL CLUB</div><button id="pb-interact-btn" class="pb-interact">INTERACTUAR</button><button id="pb-map-btn" class="pb-map-btn">MAPA</button></div></div>
  </div>
  <div class="pb-dialog" id="pb-dialog"></div>
 </div>`;
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'pb-game',backgroundColor:'#83b978',scale:{mode:Phaser.Scale.RESIZE,width:390,height:780},render:{antialias:true,pixelArt:false},scene:[ClubWorld],audio:{noAudio:true}});
 const stick=root.querySelector<HTMLElement>('#pb-stick')!,knob=root.querySelector<HTMLElement>('#pb-knob')!;
 let active=-1,origin={x:0,y:0};
 const move=(e:PointerEvent)=>{if(e.pointerId!==active)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y,len=Math.max(1,Math.hypot(dx,dy)),mag=Math.min(1,len/42),x=dx/len*mag,y=dy/len*mag;knob.style.transform='translate('+x*34+'px,'+y*34+'px)';window.dispatchEvent(new CustomEvent('pb-joystick',{detail:{x,y}}));};
 stick.addEventListener('pointerdown',e=>{active=e.pointerId;origin={x:e.clientX,y:e.clientY};stick.setPointerCapture(active);move(e);});
 stick.addEventListener('pointermove',move);
 const stop=(e:PointerEvent)=>{if(e.pointerId!==active)return;active=-1;knob.style.transform='translate(0,0)';window.dispatchEvent(new CustomEvent('pb-joystick',{detail:{x:0,y:0}}));};
 stick.addEventListener('pointerup',stop);stick.addEventListener('pointercancel',stop);
 root.querySelector('#pb-interact-btn')?.addEventListener('click',()=>window.dispatchEvent(new Event('pb-interact')));
 root.querySelector('#pb-map-btn')?.addEventListener('click',()=>window.dispatchEvent(new Event('pb-map')));
 window.addEventListener('keydown',e=>{const keys:Record<string,{x:number;y:number}>={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0}};if(keys[e.key])window.dispatchEvent(new CustomEvent('pb-joystick',{detail:keys[e.key]}));});
 window.addEventListener('keyup',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key))window.dispatchEvent(new CustomEvent('pb-joystick',{detail:{x:0,y:0}}));});
 return game;
}
