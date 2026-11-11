import './adventure.css';
import { startAdventure } from './adventure';

const root=document.querySelector<HTMLElement>('#app');
if(!root)throw new Error('No se encuentra el contenedor principal');
startAdventure(root);
window.dispatchEvent(new Event('pb-ready'));
