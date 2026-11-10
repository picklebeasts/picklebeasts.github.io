import Phaser from 'phaser';
export type MatchResult={won:boolean,score:string};
export class CourtScene extends Phaser.Scene{
 private player!:Phaser.GameObjects.Arc;private rival!:Phaser.GameObjects.Arc;private ball!:Phaser.GameObjects.Arc;private scoreText!:Phaser.GameObjects.Text;private score=[0,0];private vx=0;private vy=3;private rallies=0;private done=false;private finish!:(r:MatchResult)=>void;private keys!:Phaser.Types.Input.Keyboard.CursorKeys;private target={x:0,y:0};
 constructor(){super('court')}
 create(d:{finish:(r:MatchResult)=>void;handicap?:number}){
  this.finish=d.finish;this.score=[0,d.handicap||0];const w=this.scale.width,h=this.scale.height;
  this.add.rectangle(w/2,h/2,w,h,0x182326);
  this.add.ellipse(w/2,h*.54,w*.88,h*.82,0x263b34);
  const g=this.add.graphics();g.fillStyle(0x4d83c7);g.fillPoints([new Phaser.Geom.Point(w*.1,h*.2),new Phaser.Geom.Point(w*.9,h*.2),new Phaser.Geom.Point(w*.98,h*.85),new Phaser.Geom.Point(w*.02,h*.85)],true);g.lineStyle(3,0xf4f5f0);g.strokePoints([new Phaser.Geom.Point(w*.1,h*.2),new Phaser.Geom.Point(w*.9,h*.2),new Phaser.Geom.Point(w*.98,h*.85),new Phaser.Geom.Point(w*.02,h*.85)],true);g.lineBetween(w*.5,h*.2,w*.5,h*.85);g.lineBetween(w*.06,h*.55,w*.94,h*.55);
  this.add.rectangle(w/2,h*.55,w*.9,5,0x171b1d);this.add.rectangle(w/2,h*.55,w*.9,2,0xffffff);
  this.rival=this.add.circle(w*.5,h*.34,17,0xff704d).setStrokeStyle(3,0xffffff);this.player=this.add.circle(w*.5,h*.77,18,0xb9f227).setStrokeStyle(3,0xffffff);this.target={x:w*.5,y:h*.77};this.ball=this.add.circle(w*.5,h*.49,7,0xd9ff45).setStrokeStyle(2,0x26332e).setDepth(5);
  this.scoreText=this.add.text(16,15,'0  —  '+this.score[1],{fontSize:'25px',fontStyle:'bold',color:'#f4f5f0'}).setDepth(10);
  this.add.text(w/2,h*.1,'SOLARA CLUB · PARTIDO A 5 PUNTOS',{fontSize:'10px',fontStyle:'bold',color:'#b9f227'}).setOrigin(.5).setDepth(10);
  this.add.text(w/2,h*.93,'TOCA TU MITAD PARA MOVERTE · TOCA LA MITAD RIVAL PARA GOLPEAR',{fontSize:'8px',color:'#f4f5f0'}).setOrigin(.5).setDepth(10);
  this.keys=this.input.keyboard!.createCursorKeys();this.input.keyboard!.addKeys('W,A,S,D');
  this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.y>h*.56){this.target.x=Phaser.Math.Clamp(p.x,w*.08,w*.92);this.target.y=Phaser.Math.Clamp(p.y,h*.59,h*.87)}else if(this.ball.y>h*.55&&this.ball.y<h*.88){this.vx=(p.x-this.player.x)*.012;this.vy=-4.4;this.rallies++}});
  this.serve();
 }
 private serve(){this.ball.setPosition(this.scale.width*.5,this.scale.height*.5);this.vx=Phaser.Math.Between(-2,2);this.vy=3.5;this.rallies=0}
 update(){
  if(this.done)return;const w=this.scale.width,h=this.scale.height;const k=this.input.keyboard;
  const keyboardMove=!!(k?.checkDown(this.keys.left)||k?.checkDown(this.keys.right)||k?.checkDown(this.keys.up)||k?.checkDown(this.keys.down));if(k?.checkDown(this.keys.left))this.player.x-=4;if(k?.checkDown(this.keys.right))this.player.x+=4;if(k?.checkDown(this.keys.up))this.player.y-=4;if(k?.checkDown(this.keys.down))this.player.y+=4;
  if(keyboardMove){this.target.x=this.player.x;this.target.y=this.player.y}else{this.player.x=Phaser.Math.Linear(this.player.x,this.target.x,.035);this.player.y=Phaser.Math.Linear(this.player.y,this.target.y,.035)}
  this.player.x=Phaser.Math.Clamp(this.player.x,w*.08,w*.92);this.player.y=Phaser.Math.Clamp(this.player.y,h*.59,h*.88);
  this.rival.x=Phaser.Math.Linear(this.rival.x,this.ball.x,.045);this.rival.y=Phaser.Math.Linear(this.rival.y,Phaser.Math.Clamp(this.ball.y-h*.1,h*.27,h*.43),.05);
  this.ball.x+=this.vx;this.ball.y+=this.vy;this.vx*=.997;
  if(this.ball.x<w*.07||this.ball.x>w*.93)this.vx*=-.8;
  if(this.ball.y<h*.22){this.point(0);return}
  if(this.ball.y>h*.86){if(Phaser.Math.Distance.Between(this.player.x,this.player.y,this.ball.x,this.ball.y)<58&&this.rallies>0){this.vy=-4.5;this.vx+=(this.player.x-this.ball.x)*.035;this.rallies++}else{this.point(1);return}}
  if(this.ball.y<h*.46&&this.ball.y>h*.27&&Phaser.Math.Distance.Between(this.rival.x,this.rival.y,this.ball.x,this.ball.y)<34&&this.vy<0){this.vy=4.1;this.vx+=(this.player.x-this.rival.x)*.014}
 }
 private point(n:number){this.score[n]++;this.scoreText.setText(this.score[0]+'  —  '+this.score[1]);if(this.score[n]>=5){this.done=true;this.time.delayedCall(500,()=>this.finish({won:n===0,score:this.score[0]+' - '+this.score[1]}));return}this.ball.setPosition(this.scale.width*.5,this.scale.height*.5);this.vx=0;this.vy=0;this.time.delayedCall(350,()=>{this.vx=Phaser.Math.Between(-2,2);this.vy=n===0?-3.8:3.8})}
}