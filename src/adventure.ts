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
 private readonly treeObstacles:Array<{x:number;y:number;r:number}>=[{x:75,y:130,r:45},{x:175,y:300,r:45},{x:790,y:145,r:45},{x:790,y:360,r:45},{x:80,y:530,r:45},{x:110,y:900,r:45},{x:780,y:960,r:45},{x:690,y:1120,r:45},{x:250,y:1080,r:45},{x:840,y:780,r:45},{x:560,y:90,r:45},{x:55,y:1100,r:45},{x:520,y:570,r:45},{x:180,y:850,r:45},{x:835,y:1110,r:45}];
 constructor(){super('club-world');}
 create(){
  this.cameras.main.setBackgroundColor('#91bd83');
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
  // Rich landscaped base with soft terrain variation
  g.fillStyle(0x7da96d);g.fillRect(0,0,900,1250);
  for(let i=0;i<90;i++){
   const x=Phaser.Math.Between(25,875),y=Phaser.Math.Between(25,1225),r=Phaser.Math.Between(12,36);
   g.fillStyle(i%3===0?0x9ac17b:i%3===1?0x6e9e64:0x87b675,.2);
   g.fillEllipse(x,y,r*2,r);
  }
  // Park border and flower beds
  g.fillStyle(0x557e50);g.fillRoundedRect(12,12,876,1226,40);
  g.fillStyle(0x8bb978);g.fillRoundedRect(24,24,852,1202,32);
  // Main plaza path with layered edges
  const path=(color:number,width:number)=>{g.lineStyle(width,color,1);g.beginPath();g.moveTo(435,1190);g.lineTo(435,920);g.lineTo(300,790);g.lineTo(300,600);g.lineTo(450,465);g.lineTo(450,220);g.strokePath();};
  path(0xb69a70,96);path(0xe4d1a8,82);path(0xf0dfbd,3);
  // Paving joints
  g.lineStyle(2,0xcbb78f,.65);
  for(let y=950;y<1180;y+=34)g.lineBetween(393,y,477,y);
  for(let y=650;y<780;y+=30)g.lineBetween(260,y,340,y);
  // Central court terrace
  g.fillStyle(0x45684c,.24);g.fillEllipse(300,420,300,90);
  g.fillStyle(0xd5c49b);g.fillRoundedRect(160,170,280,500,28);
  g.fillStyle(0xeee0bd);g.fillRoundedRect(169,179,262,482,22);
  this.drawCourt(g,300,420);
  // Clubhouse garden plaza
  g.fillStyle(0x45684c,.2);g.fillEllipse(450,240,270,70);
  // Pond and stone rim
  g.fillStyle(0x547d57);g.fillEllipse(670,680,202,140);
  g.fillStyle(0xd9c99f);g.fillEllipse(670,674,190,126);
  g.fillStyle(0x55a7a7);g.fillEllipse(670,670,170,108);
  g.lineStyle(3,0xc6eeee,.5);g.strokeEllipse(670,670,130,76);g.strokeEllipse(670,670,90,50);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;g.fillStyle(0x3d7d4d);g.fillEllipse(670+Math.cos(a)*112,680+Math.sin(a)*75,34,23);g.fillStyle(0x9fcf73);g.fillCircle(670+Math.cos(a)*112,680+Math.sin(a)*75,7);}
  // Flower beds
  for(const [x,y] of [[180,205],[730,230],[820,500],[110,760],[760,1050],[250,1120],[550,1000]] as number[][])this.drawFlowerBed(g,x,y);
  // trees and shrubs
  for(const p of this.treeObstacles)this.drawTree(g,p.x,p.y);
  // Decorative fence with posts
  g.lineStyle(5,0x536c48,.85);g.strokeRoundedRect(24,24,852,1202,30);
  for(let x=65;x<850;x+=65){g.fillStyle(0xe2d4ad);g.fillCircle(x,28,4);g.fillCircle(x,1222,4);}
  this.add.text(450,65,'SOLARA  •  PICKLEBEASTS CLUB',{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#fff8df',stroke:'#385b3e',strokeThickness:5}).setOrigin(.5).setDepth(3);
  this.add.text(300,260,'CENTRAL COURTS',{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#fff8df',stroke:'#45684c',strokeThickness:4}).setOrigin(.5).setDepth(4);
 }
 private drawCourt(g:Phaser.GameObjects.Graphics,x:number,y:number){
  // Medidas reglamentarias: 20 x 44 ft, representadas a escala 1:2,2.
  const w=180,h=396,left=x-w/2,top=y-h/2,netY=y;
  g.fillStyle(0x294b38,.25);g.fillRoundedRect(left-18,top+12,w+36,h+20,15);
  g.fillStyle(0x765c43);g.fillRoundedRect(left-12,top-12,w+24,h+24,13);
  g.fillStyle(0x426c51);g.fillRoundedRect(left-7,top-7,w+14,h+14,10);
  g.fillStyle(0x477eae);g.fillRoundedRect(left,top,w,h,4);
  g.fillStyle(0x548db9,.35);g.fillRect(left+5,top+5,w-10,h-10);
  g.lineStyle(3,0xf8f4e5,1);g.strokeRect(left+2,top+2,w-4,h-4);
  const kitchen=63; // 7 ft de zona de no volea a esta escala
  g.lineStyle(2.5,0xf8f4e5,1);
  g.lineBetween(left,netY-kitchen,left+w,netY-kitchen);
  g.lineBetween(left,netY+kitchen,left+w,netY+kitchen);
  g.lineBetween(x,top+2,x,netY-kitchen);
  g.lineBetween(x,netY+kitchen,x,top+h-2);
  g.fillStyle(0x334b49);g.fillRoundedRect(left-5,netY-5,5,10,2);g.fillRoundedRect(left+w,netY-5,5,10,2);
  g.lineStyle(4,0xf6f0dc,1);g.lineBetween(left-3,netY,left+w+3,netY);
  g.lineStyle(1,0xdce8df,.8);g.lineBetween(left,netY-4,left+w,netY-4);
  g.fillStyle(0x9a704d);g.fillRoundedRect(left+w+19,top+h-52,22,28,5);
  for(let i=0;i<3;i++){g.fillStyle(0xd9f05a);g.fillCircle(left+w+25+i*6,top+h-42,3);}
 }
 private drawTree(g:Phaser.GameObjects.Graphics,x:number,y:number){
  // Soft cast shadow and layered canopy
  g.fillStyle(0x29472e,.22);g.fillEllipse(x+8,y+24,72,34);
  g.fillStyle(0x75583d);g.fillRoundedRect(x-7,y-2,14,42,5);
  g.fillStyle(0x3c7047);g.fillCircle(x,y-12,34);
  g.fillStyle(0x4d8951);g.fillCircle(x-13,y-22,23);g.fillCircle(x+13,y-23,22);
  g.fillStyle(0x69a75d);g.fillCircle(x-8,y-32,15);g.fillCircle(x+12,y-34,13);
  g.fillStyle(0x9acb70,.8);g.fillCircle(x-12,y-38,5);g.fillCircle(x+8,y-42,4);
  g.fillStyle(0x315f3c,.35);g.fillEllipse(x+10,y-2,23,12);
 }
 private drawFlowerBed(g:Phaser.GameObjects.Graphics,x:number,y:number){
  g.fillStyle(0x557b4c,.25);g.fillEllipse(x,y+12,78,25);
  g.fillStyle(0x9d825e);g.fillRoundedRect(x-34,y-12,68,26,12);
  g.fillStyle(0x527d48);g.fillRoundedRect(x-30,y-9,60,19,9);
  for(let i=0;i<7;i++){const px=x-23+i*7;g.fillStyle(i%2?0xf4c5a0:0xe9d87c);g.fillCircle(px,y-5-(i%3)*4,4);g.fillStyle(0xe9e5ca);g.fillCircle(px+2,y-8-(i%3)*4,2);}
 }
 private makePlayer(){
  const shadow=this.add.ellipse(0,18,42,19,0x1f3829,.3);
  const legs=this.add.container(0,9,[this.add.ellipse(-7,9,10,15,0x263b48),this.add.ellipse(7,9,10,15,0x263b48),this.add.ellipse(-9,17,13,7,0xf4eee0),this.add.ellipse(9,17,13,7,0xf4eee0)]);
  const torso=this.add.ellipse(0,-3,31,34,0xb9f227).setStrokeStyle(3,0x405a36);
  const strap=this.add.rectangle(7,-2,6,26,0x263e40).setAngle(-16);
  const armL=this.add.ellipse(-17,1,10,21,0xd9a77d).setAngle(-15);
  const armR=this.add.ellipse(17,1,10,21,0xd9a77d).setAngle(15);
  const head=this.add.circle(0,-29,14,0xe0b58e).setStrokeStyle(2,0x694b38);
  const hair=this.add.arc(0,-34,14,185,355,false,0x49372e);
  const cap=this.add.ellipse(0,-41,30,9,0x243a38);
  const brim=this.add.ellipse(7,-39,20,4,0x172b2b);
  const eyes=this.add.container(0,-28,[this.add.circle(-5,0,1.8,0x25302c),this.add.circle(5,0,1.8,0x25302c)]);
  const paddle=this.add.container(23,-3,[this.add.rectangle(0,10,5,17,0x80563c).setAngle(-18),this.add.ellipse(0,-2,15,21,0x2d7c83).setStrokeStyle(2,0xf4f0dc),this.add.circle(0,-2,4,0xb9f227)]);
  this.player=this.add.container(435,1030,[shadow,legs,torso,strap,armL,armR,head,hair,cap,brim,eyes,paddle]).setDepth(1030);
  this.body=head;
 }
 private makePeopleAndPlaces(){
  this.addBuilding(650,205,'CLUBHOUSE',0xd9a56d);
  this.addBuilding(120,610,'TALLER',0xb4a2d7);
  this.addBuilding(670,420,'CAFÉ DINK',0xf0b36c);
  this.addNpc(470,500,'MARCUS',0xff795e);
  this.addNpc(575,820,'NAOMI',0x70a9d7);
  this.addNpc(720,565,'SOFÍA',0xd58cb5);
  this.addSign(435,900,'PORTÓN · ZONA 2',this.progress.gateOpen);
  this.places=[
   {x:650,y:245,name:'Clubhouse',kind:'club',body:'Tu base. Aquí se reúnen los miembros y se preparan las próximas aventuras.'},
   {x:300,y:420,name:'Pista central',kind:'court',body:'La pista necesita una pequeña puesta a punto. ¡Vamos a devolverle la vida!'},
   {x:470,y:500,name:'Marcus · Entrenador',kind:'npc',body:'¡Ey, rookie! Bienvenido al club. Antes de abrir la pista, necesito que recojas tres pelotas perdidas por el recinto.'}
   {x:120,y:610,name:'Taller',kind:'shop',body:'Aquí podrás personalizar tu equipo y reparar instalaciones. Pronto habrá nuevas mejoras.'},
   {x:670,y:420,name:'Café Dink',kind:'cafe',body:'El punto de encuentro del club. Escucharás rumores, conocerás gente y descubrirás retos.'},
   {x:575,y:820,name:'Naomi · Comunidad',kind:'npc',body:'¡Qué alegría tenerte aquí! Cuando el club crezca, podremos organizar eventos para todos.'},
   {x:720,y:565,name:'Sofía · Rival',kind:'npc',body:'¿Nuevo por aquí? Ya veremos si estás a la altura. Nos vemos en la pista.'},
   {x:435,y:900,name:'Portón del parque',kind:'gate',body:'Al otro lado hay nuevas pistas y personajes. Completa la primera misión para abrirlo.'}
  ];
 }
 private addBuilding(x:number,y:number,label:string,color:number){
  const g=this.add.graphics().setDepth(y-10);
  // drop shadow, terrace and walls
  g.fillStyle(0x29462e,.22);g.fillEllipse(x+10,y+75,220,48);
  g.fillStyle(0x9b805d);g.fillRoundedRect(x-104,y-52,208,142,13);
  g.fillStyle(0xe9d7b3);g.fillRoundedRect(x-95,y-58,190,132,10);
  g.fillStyle(0xd8c09a);g.fillRect(x-86,y-43,172,110);
  // facade panels and windows
  g.fillStyle(color);g.fillRect(x-87,y-48,174,14);
  g.fillStyle(0x477b7b);g.fillRoundedRect(x-70,y-27,43,39,5);g.fillRoundedRect(x+27,y-27,43,39,5);
  g.lineStyle(3,0xf7e8c9);g.strokeRoundedRect(x-70,y-27,43,39,5);g.strokeRoundedRect(x+27,y-27,43,39,5);
  g.lineStyle(2,0xf7e8c9);g.lineBetween(x-49,y-27,x-49,y+12);g.lineBetween(x+48,y-27,x+48,y+12);
  g.fillStyle(0x8d6545);g.fillRoundedRect(x-20,y+5,40,62,5);
  g.fillStyle(0xf1dcae);g.fillCircle(x+11,y+38,2);
  // roof silhouette with highlights
  g.fillStyle(0x78513e);g.fillPoints([{x:x-110,y:y-48},{x,y:y-128},{x:x+110,y:y-48}],true);
  g.fillStyle(color);g.fillPoints([{x:x-98,y:y-50},{x,y:y-119},{x:x+98,y:y-50}],true);
  g.lineStyle(4,0xffffff,.25);g.lineBetween(x-80,y-62,x,y-116);g.lineBetween(x,y-116,x+80,y-62);
  // sign board
  g.fillStyle(0x294b40);g.fillRoundedRect(x-68,y+78,136,25,7);
  this.add.text(x,y+90,label,{fontFamily:'Arial',fontSize:'11px',fontStyle:'bold',color:'#f8f1db'}).setOrigin(.5).setDepth(y+100);
 }
 private addNpc(x:number,y:number,name:string,color:number){
  const c=this.add.container(x,y).setDepth(y+20);
  const shadow=this.add.ellipse(0,19,40,17,0x263e2c,.25);
  const legs=this.add.container(0,8,[this.add.ellipse(-6,10,9,15,0x293b43),this.add.ellipse(6,10,9,15,0x293b43),this.add.ellipse(-7,17,12,6,0xf1eadb),this.add.ellipse(7,17,12,6,0xf1eadb)]);
  const body=this.add.ellipse(0,-3,32,35,color).setStrokeStyle(2,0x344e3b);
  const collar=this.add.triangle(0,-15,0,0,10,10,-10,10,0xf2e9d2);
  const head=this.add.circle(0,-31,14,0xd9a77e).setStrokeStyle(2,0x684a37);
  const hair=this.add.arc(0,-36,14,185,355,false,name.startsWith('MARCUS')?0x392f2a:0x4a3028);
  const eyes=this.add.container(0,-30,[this.add.circle(-5,0,1.8,0x26302b),this.add.circle(5,0,1.8,0x26302b)]);
  const tag=this.add.rectangle(0,27,64,18,0x233c32,.94).setStrokeStyle(1,0xffffff,.4);
  const text=this.add.text(0,27,name,{fontFamily:'Arial',fontSize:'9px',fontStyle:'bold',color:'#fff8e7'}).setOrigin(.5);
  c.add([shadow,legs,body,collar,head,hair,eyes,tag,text]);
  this.tweens.add({targets:c,y:y-3,duration:900+Math.random()*250,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
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
 private blocked(x:number,y:number){
  const lake=((x-670)/125)**2+((y-670)/90)**2;
  if(lake<1)return true;
  const buildings=[{x:650,y:205},{x:120,y:610},{x:670,y:420}];
  for(const b of buildings)if(x>b.x-125&&x<b.x+125&&y>b.y-140&&y<b.y+88)return true;
  for(const t of this.treeObstacles){const dx=x-t.x,dy=y-(t.y-5);if(dx*dx+dy*dy<t.r*t.r)return true;}
  const beds=[[180,205],[730,230],[820,500],[110,760],[760,1050],[250,1120],[550,1000]];
  for(const [bx,by] of beds)if(Math.abs(x-bx)<50&&Math.abs(y-by)<26)return true;
  return false;
 }
 private moveTo(x:number,y:number){this.player.setData('target',{x:Phaser.Math.Clamp(x,50,850),y:Phaser.Math.Clamp(y,80,1180)});}
 update(_t:number,dt:number){
  const target=this.player.getData('target') as {x:number;y:number}|undefined;
  let dx=this.move.x,dy=this.move.y;
  if(Math.hypot(dx,dy)<.08&&target){dx=target.x-this.player.x;dy=target.y-this.player.y;const d=Math.hypot(dx,dy);if(d<10){this.player.setData('target',null);dx=0;dy=0;}else{dx/=d;dy/=d;}}
  const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
  const speed=dt*.23;
  const nextX=Phaser.Math.Clamp(this.player.x+dx*speed,45,855);
  const nextY=Phaser.Math.Clamp(this.player.y+dy*speed,70,1180);
  if(!this.blocked(nextX,this.player.y))this.player.x=nextX;else this.player.setData('target',null);
  if(!this.blocked(this.player.x,nextY))this.player.y=nextY;else this.player.setData('target',null);
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
 const game=new Phaser.Game({type:Phaser.AUTO,parent:'pb-game',backgroundColor:'#83b978',scale:{mode:Phaser.Scale.RESIZE,width:390,height:780},render:{antialias:true,pixelArt:false,roundPixels:false},resolution:Math.min(window.devicePixelRatio||1,2),scene:[ClubWorld],audio:{noAudio:true}});
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
