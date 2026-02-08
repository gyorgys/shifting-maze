import { Tile } from '../models/Game';

// Re-export all utilities from shared
export {
  LEFT,
  RIGHT,
  TOP,
  BOTTOM,
  rotateTileClockwise,
  rotateTileCounterClockwise,
  rotateTileNTimes,
  createTile,
  getTileSides
} from '@shared/utils/tileUtils';

/**
 * Alias for backward compatibility
 * @deprecated Use rotateTileClockwise instead
 */
export function rotateTile(tile: Tile): Tile {
  const { rotateTileClockwise } = require('@shared/utils/tileUtils');
  return rotateTileClockwise(tile);
}
