export type Kind='tutorial'|'precision'|'club'|'match'|'tactics'|'upgrade'|'tournament'|'comeback'|'academy'|'final';
export interface Level{id:number;title:string;subtitle:string;kind:Kind;xp:number;coins:number;description:string}
export const LEVELS:Level[]=[
{id:1,title:'First Steps',subtitle:'Fundamentos',kind:'tutorial',xp:100,coins:150,description:'Marcus te enseña movimiento, golpes y saque.'},
{id:2,title:'Find Your Rhythm',subtitle:'Precisión',kind:'precision',xp:120,coins:100,description:'Coloca la pelota en las zonas objetivo.'},
{id:3,title:'The Club',subtitle:'Conoce a Naomi',kind:'club',xp:150,coins:100,description:'Ayuda a recuperar la pista principal.'},
{id:4,title:'A New Rival',subtitle:'Primer duelo con Sofía',kind:'match',xp:150,coins:200,description:'Juega un partido contra Sofía, primero a cinco puntos.'},
{id:5,title:'Control the Kitchen',subtitle:'Zona de no volea',kind:'tactics',xp:180,coins:100,description:'Aprende a controlar la zona de no volea.'},
{id:6,title:'Club Revival',subtitle:'Renueva la pista',kind:'upgrade',xp:200,coins:150,description:'Invierte recursos para renovar la pista.'},
{id:7,title:'First Tournament',subtitle:'Torneo local',kind:'tournament',xp:250,coins:250,description:'Supera dos rondas para ganar tu primer trofeo.'},
{id:8,title:'The Comeback',subtitle:'La revancha',kind:'comeback',xp:250,coins:250,description:'Vuelve a enfrentarte a Sofía en una remontada.'},
{id:9,title:'A Bigger Ambition',subtitle:'Abre la academia',kind:'academy',xp:200,coins:150,description:'Abre la academia de Solara Club.'},
{id:10,title:'Road to Solara',subtitle:'Solara Rookie Cup',kind:'final',xp:400,coins:500,description:'Gana el torneo final de tres rondas.'}];
export const INITIAL={playerName:'',onboarded:false,level:1,xp:0,coins:300,energy:5,materials:0,completed:[] as number[],inventory:['starter','shoes','shirt','bag'],attributes:{power:35,control:42,reflexes:35,stamina:42,tactics:30},club:{court:0,reception:0,academy:false,members:0,prestige:0},stats:{matches:0,wins:0,titles:0},chapterComplete:false};
export type Save=typeof INITIAL;
export const ITEMS=[['Pala Starter','PALA','Común','Control +2','starter'],['Zapatillas Court','CALZADO','Común','Resistencia +2','shoes'],['Camiseta Solara','ROPA','Común','Estética','shirt'],['Bolsa Rookie','ACCESORIO','Común','Colección','bag'],['Pala Solara','PALA','Poco común','Control +3 · Potencia +1','solara'],['Solara Rookie Cup','TROFEO','Épico','Primer título','cup']];
