import { EventEmitter } from 'events';

export const gameEmitter = new EventEmitter();
gameEmitter.setMaxListeners(200); // support many concurrent pollers

// Called by gameService after every state-changing write
export function notifyGameUpdate(code: string): void {
  gameEmitter.emit(`update:${code}`);
}
