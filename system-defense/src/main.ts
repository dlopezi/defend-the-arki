import './style.css';
import { Game } from './game/Game';
import { syncDocument } from './i18n';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('#app not found');

syncDocument();
const game = new Game(root);
// Handy for debugging and for the browser stress test (dev server only).
if (import.meta.env.DEV) (window as unknown as { game: Game }).game = game;
