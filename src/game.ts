import Phaser from 'phaser';

export type MatchResult={won:boolean,score:string};
type Shot='drive'|'dink'|'lob';
type Team=0|1;

/**
 * PickleBeasts court prototype.
 * The player controls one athlete; their doubles partner and the two opponents
 * are autonomous. Ball flight uses a simple height axis so bounce/volley rules
 * can be distinguished from the ball's ground position.
 */
export class CourtScene extends Phaser.Scene{
 private player!:Phaser.GameObjects.Arc;
 private partner!:Phaser.GameObjects.Arc;
 private rivals:Phaser.GameObjects.Arc[]=[];
 private ball!:Phaser.GameObjects.Arc;
 private scoreText!:Phaser.GameObjects.Text;
 private statusText!:Phaser.GameObjects.Text;
 private score=[0,0];
 private servingTeam:Team=0;
 private serverNumber=2;
 private bx=0;private by=0;private z=0;
 private vx=0;private vy=0;private vz=0;
 private gravity=.24;
 private bounces=[false,false];
 private totalBounces=0;
 private shot:Shot='drive';
 private target={x:0,y:0};
 private done=false;
 private finish!:(r:MatchResult)=>void;
 private keys!:Phaser.Types.Input.Keyboard.CursorKeys;
 private dragging=false;
 private aim={x:0,y:0};
 private joystickPointer=-1;
 private joystickBase={x:0,y:0};
 private joystickRing!:Phaser.GameObjects.Arc;
 private joystickKnob!:Phaser.GameObjects.Arc;
 private rallyHits=0;
 private lastHitter:Team|null=null;
 private waitingForServe=false;

 constructor(){super('court')}
 setShot(s:Shot){this.shot=s}
 create(d:{finish:(r:MatchResult)=>void;handicap?:number}){
  this.finish=d.finish;this.score=[0,d.handicap||0];
  const w=this.scale.width,h=this.scale.height;
  this.add.rectangle(w/2,h/2,w,h,0x182326);
  this.add.ellipse(w/2,h*.52,w*.94,h*.91,0x263b34);
  const left=w*.09,right=w*.91,top=h*.10,bottom=h*.90,net=h*.50,nvz=h*.082;
  const g=this.add.graphics();
  g.fillStyle(0x4d83c7);g.fillRect(left,top,right-left,bottom-top);
  g.lineStyle(3,0xf4f5f0);g.strokeRect(left,top,right-left,bottom-top);
  g.lineBetween(w*.5,top,w*.5,bottom);
  g.lineBetween(left,net-nvz,right,net-nvz);
  g.lineBetween(left,net+nvz,right,net+nvz);
  g.lineStyle(5,0x171b1d);g.lineBetween(left,net,right,net);
  g.lineStyle(2,0xffffff);g.lineBetween(left,net,right,net);
  this.add.text(w/2,top+8,'CAMPO RIVAL',{fontSize:'9px',fontStyle:'bold',color:'#dce8e1'}).setOrigin(.5);
  this.add.text(w/2,bottom-17,'TU CAMPO',{fontSize:'9px',fontStyle:'bold',color:'#dce8e1'}).setOrigin(.5);
  this.add.text(w/2,net-nvz+4,'KITCHEN',{fontSize:'8px',fontStyle:'bold',color:'#f4f5f0'}).setOrigin(.5);
  this.add.text(w/2,net+nvz-13,'KITCHEN',{fontSize:'8px',fontStyle:'bold',color:'#f4f5f0'}).setOrigin(.5);
  this.rivals=[
   this.add.circle(w*.36,h*.22,15,0xff704d).setStrokeStyle(2,0xffffff),
   this.add.circle(w*.64,h*.29,15,0xe7a06b).setStrokeStyle(2,0xffffff)
  ];
  this.partner=this.add.circle(w*.69,h*.75,15,0x8bd04b).setStrokeStyle(2,0xffffff);
  this.player=this.add.circle(w*.32,h*.78,17,0xb9f227).setStrokeStyle(3,0xffffff);
  this.target={x:this.player.x,y:this.player.y};
  this.ball=this.add.circle(0,0,7,0xd9ff45).setStrokeStyle(2,0x26332e).setDepth(8);
  this.scoreText=this.add.text(12,12,'0 — 0 · 2',{fontSize:'22px',fontStyle:'bold',color:'#f4f5f0'}).setDepth(10);
  this.statusText=this.add.text(w/2,top+30,'DOBLES · PRIMER A 11 · DIFERENCIA DE 2',{fontSize:'9px',fontStyle:'bold',color:'#b9f227'}).setOrigin(.5).setDepth(10);
  this.keys=this.input.keyboard!.createCursorKeys();
  this.input.keyboard!.addKeys('W,A,S,D');
  this.joystickBase={x:w*.18,y:h*.82};
  this.joystickRing=this.add.circle(this.joystickBase.x,this.joystickBase.y,43,0x101719,.48).setStrokeStyle(2,0xf4f5f0,.55).setDepth(20);
  this.joystickKnob=this.add.circle(this.joystickBase.x,this.joystickBase.y,18,0xb9f227,.9).setStrokeStyle(2,0xffffff).setDepth(21);
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
   if(this.done)return;
   if(p.x<w*.31&&p.y>h*.66){
    this.joystickPointer=p.id;this.moveJoystick(p.x,p.y);return;
   }
   if(p.y>net+nvz+15){
    this.target.x=Phaser.Math.Clamp(p.x,left+18,right-18);
    this.target.y=Phaser.Math.Clamp(p.y,net+10,bottom-18);
   }
   this.dragging=Phaser.Math.Distance.Between(this.player.x,this.player.y,this.bx,this.by)<78&&this.z<38;
   this.aim={x:p.x,y:p.y};
  });
  this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{
   if(p.id===this.joystickPointer){this.moveJoystick(p.x,p.y);return}
   if(this.dragging)this.aim={x:p.x,y:p.y};
  });
  this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{
   if(p.id===this.joystickPointer){
    this.joystickPointer=-1;this.joystickKnob.setPosition(this.joystickBase.x,this.joystickBase.y);return;
   }
   if(!this.dragging||this.done)return;
   this.dragging=false;
   if(Phaser.Math.Distance.Between(this.player.x,this.player.y,this.bx,this.by)<82&&this.z<38)this.tryPlayerHit(this.aim.x,this.aim.y);
  });
  this.serve();
 }
 private refreshScore(){
  this.scoreText.setText(this.score[0]+' — '+this.score[1]+' · '+this.serverNumber);
 }
 public serveNow(){if(this.waitingForServe&&this.servingTeam===0)this.launchServe()}
 private serve(){
  if(this.done)return;
  this.bounces=[false,false];this.totalBounces=0;this.rallyHits=0;this.lastHitter=null;
  const w=this.scale.width,h=this.scale.height;
  const fromBottom=this.servingTeam===0;
  const serverX=fromBottom?(this.score[0]%2===0?w*.68:w*.32):(this.score[1]%2===0?w*.32:w*.68);
  this.bx=serverX;this.by=fromBottom?h*.82:h*.18;this.z=0;
  this.vx=0;this.vy=0;this.vz=0;
  this.ball.setPosition(this.bx,this.by);
  this.lastHitter=this.servingTeam;
  this.waitingForServe=true;
  this.refreshScore();
  this.statusText.setText(fromBottom?'PULSA SACAR':'EL RIVAL SE PREPARA PARA SACAR');
  if(this.servingTeam===1)this.time.delayedCall(700,()=>this.launchServe());
 }
 private launchServe(){
  if(this.done||!this.waitingForServe)return;
  this.waitingForServe=false;
  const w=this.scale.width,h=this.scale.height,fromBottom=this.servingTeam===0;
  this.vx=fromBottom?-3.1:3.1;this.vy=fromBottom?-h*.014:h*.014;this.vz=5.6;
  this.statusText.setText(fromBottom?'SAQUE EN JUEGO':'DEVUELVE EL SAQUE');
 }
 private moveJoystick(x:number,y:number){
  const dx=x-this.joystickBase.x,dy=y-this.joystickBase.y,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,43/len);
  const nx=dx*scale,ny=dy*scale;
  this.joystickKnob.setPosition(this.joystickBase.x+nx,this.joystickBase.y+ny);
  this.target.x=Phaser.Math.Clamp(this.player.x+nx*2.2,this.scale.width*.11,this.scale.width*.89);
  this.target.y=Phaser.Math.Clamp(this.player.y+ny*2.2,this.scale.height*.51,this.scale.height*.88);
 }
 private tryPlayerHit(tx:number,ty:number){
  if(this.done||this.waitingForServe||this.z>38)return;
  const team:Team=0;
  const currentSide=this.by>this.scale.height*.5?0:1;
  if(this.totalBounces<2&&!this.bounces[currentSide])return;
  const px=this.player.x,py=this.player.y;
  if(!this.bounces[0]&&py>this.scale.height*.5&&py<this.scale.height*.5+this.scale.height*.082){
   this.endRally(1);return;
  }
  this.launchShot(team,px,py,tx,ty);
 }
 private launchShot(team:Team,px:number,py:number,tx:number,ty:number){
  const w=this.scale.width,h=this.scale.height;
  const dx=Phaser.Math.Clamp(tx-px,-w*.45,w*.45);
  const dy=team===0?-1:1;
  const speed=this.shot==='drive'?9.3:this.shot==='dink'?8.5:7.2;
  this.bx=px;this.by=py- (team===0?12:-12);this.z=20;
  this.vx=Phaser.Math.Clamp(dx*.025,-4.5,4.5);
  this.vy=dy*speed;
  this.vz=this.shot==='lob'?7.2:this.shot==='dink'?3.8:5.6;
  this.lastHitter=team;this.rallyHits++;this.bounces[team]=false;
  this.statusText.setText(this.shot==='drive'?'DRIVE':this.shot==='dink'?'DINK':'GLOBO');
 }
 update(){
  if(this.done)return;
  const w=this.scale.width,h=this.scale.height,net=h*.5,nvz=h*.082;
  const k=this.input.keyboard;
  if(k?.checkDown(this.keys.left))this.target.x-=4;
  if(k?.checkDown(this.keys.right))this.target.x+=4;
  if(k?.checkDown(this.keys.up))this.target.y-=4;
  if(k?.checkDown(this.keys.down))this.target.y+=4;
  this.target.x=Phaser.Math.Clamp(this.target.x,w*.11,w*.89);
  this.target.y=Phaser.Math.Clamp(this.target.y,net+10,h*.88);
  this.player.x=Phaser.Math.Linear(this.player.x,this.target.x,.14);
  this.player.y=Phaser.Math.Linear(this.player.y,this.target.y,.14);
  this.partner.x=Phaser.Math.Linear(this.partner.x,Phaser.Math.Clamp(this.bx+w*.12,w*.12,w*.88),.045);
  this.partner.y=Phaser.Math.Linear(this.partner.y,Phaser.Math.Clamp(this.by+h*.08,net+nvz+12,h*.87),.045);
  this.rivals.forEach((r,i)=>{
   const x=Phaser.Math.Clamp(this.bx+(i===0?-w*.1:w*.1),w*.12,w*.88);
   const y=Phaser.Math.Clamp(this.by-h*.08,h*.12,net-nvz-12);
   r.x=Phaser.Math.Linear(r.x,x,.07);r.y=Phaser.Math.Linear(r.y,y,.07);
  });
  if(this.waitingForServe){this.ball.setPosition(this.bx,this.by);return}
  this.bx+=this.vx;this.by+=this.vy;this.z+=this.vz;this.vz-=this.gravity;
  if(this.z<=0){
   this.z=0;this.vz=0;
   const side:Team=this.by>net?0:1;
   if(!this.bounces[side]){this.bounces[side]=true;this.totalBounces++}
   else {this.endRally(side===0?1:0);return}
   this.vx*=.88;this.vy*=.88;
  }
  this.ball.setPosition(this.bx,this.by-this.z);
  if(this.bx<w*.09||this.bx>w*.91){this.endRally(this.lastHitter===0?1:0);return}
  if(this.by<h*.10||this.by>h*.90){this.endRally(this.lastHitter===0?1:0);return}
  if(Math.abs(this.by-net)<8&&this.z<13){this.endRally(this.lastHitter===0?1:0);return}
  // AI returns: the partner covers the user's side; two opponents cover the far side.
  if(this.by>net&&this.lastHitter===1){
   const candidates=[this.player,this.partner];
   const nearest=candidates.sort((a,b)=>Phaser.Math.Distance.Between(a.x,a.y,this.bx,this.by)-Phaser.Math.Distance.Between(b.x,b.y,this.bx,this.by))[0];
   if(Phaser.Math.Distance.Between(nearest.x,nearest.y,this.bx,this.by)<31&&this.z<25&&this.canVolley(0)){
    if(nearest===this.player){this.statusText.setText('¡TU TURNO! TOCA PARA GOLPEAR')}
    else this.aiHit(0,nearest.x,nearest.y);
   }
  }
  if(this.by<net&&this.lastHitter===0){
   const nearest=this.rivals.reduce((a,b)=>Phaser.Math.Distance.Between(a.x,a.y,this.bx,this.by)<Phaser.Math.Distance.Between(b.x,b.y,this.bx,this.by)?a:b);
   if(Phaser.Math.Distance.Between(nearest.x,nearest.y,this.bx,this.by)<32&&this.z<24&&this.canVolley(1))this.aiHit(1,nearest.x,nearest.y);
  }
  // The first two bounces are compulsory: no one may volley until both sides have bounced.
 }
 private canVolley(team:Team){return this.totalBounces>=2||this.bounces[team]}
 private aiHit(team:Team,x:number,y:number){
  const w=this.scale.width,h=this.scale.height;
  if(team===0&&y>h*.5-h*.082&&y<h*.5+h*.082&&this.z<5){this.endRally(1);return}
  const targetX=team===0?Phaser.Math.Between(w*.15,w*.85):Phaser.Math.Between(w*.15,w*.85);
  this.bx=x;this.by=y;this.z=16;this.vx=(targetX-x)*.012;this.vy=team===0?-9.0:9.0;this.vz=5.6;
  this.lastHitter=team;this.rallyHits++;this.bounces[team]=false;
 }
 private endRally(winner:Team){
  if(this.done)return;
  if(winner===this.servingTeam)this.score[winner]++;
  else if(this.serverNumber===1)this.serverNumber=2;
  else{this.servingTeam=winner;this.serverNumber=1}
  this.refreshScore();
  if(this.score[this.servingTeam]>=11&&this.score[this.servingTeam]-this.score[1-this.servingTeam]>=2){
   this.done=true;this.time.delayedCall(650,()=>this.finish({won:this.score[0]>this.score[1],score:this.score[0]+' - '+this.score[1]}));return;
  }
  this.time.delayedCall(650,()=>this.serve());
 }
}