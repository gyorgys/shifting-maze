import { Tile as TileType } from '../types/Game';
import { LEFT, RIGHT, TOP, BOTTOM } from '@shared/utils/tileUtils';

interface TileProps {
  tile: TileType;  // Bitmask 0-15
  x: number;
  y: number;
  size?: number;
  rotation?: number;  // Rotation angle in degrees (default: 0)
}

export function Tile({ tile, x, y, size = 80, rotation = 0 }: TileProps) {
  const PATH_WIDTH = size * (2/5);  // 2/5 of tile (32px for 80px tile)
  const PATH_HALF = PATH_WIDTH / 2;
  const CENTER = size / 2;

  // Determine which sides are open
  const hasLeft = !!(tile & LEFT);
  const hasRight = !!(tile & RIGHT);
  const hasTop = !!(tile & TOP);
  const hasBottom = !!(tile & BOTTOM);

  // Build path segments connecting open sides to center
  let pathData = '';

  // Center square (always present)
  pathData += `M ${CENTER - PATH_HALF} ${CENTER - PATH_HALF} `;
  pathData += `L ${CENTER + PATH_HALF} ${CENTER - PATH_HALF} `;
  pathData += `L ${CENTER + PATH_HALF} ${CENTER + PATH_HALF} `;
  pathData += `L ${CENTER - PATH_HALF} ${CENTER + PATH_HALF} Z `;

  // Left path
  if (hasLeft) {
    pathData += `M 0 ${CENTER - PATH_HALF} `;
    pathData += `L ${CENTER - PATH_HALF} ${CENTER - PATH_HALF} `;
    pathData += `L ${CENTER - PATH_HALF} ${CENTER + PATH_HALF} `;
    pathData += `L 0 ${CENTER + PATH_HALF} Z `;
  }

  // Right path
  if (hasRight) {
    pathData += `M ${CENTER + PATH_HALF} ${CENTER - PATH_HALF} `;
    pathData += `L ${size} ${CENTER - PATH_HALF} `;
    pathData += `L ${size} ${CENTER + PATH_HALF} `;
    pathData += `L ${CENTER + PATH_HALF} ${CENTER + PATH_HALF} Z `;
  }

  // Top path
  if (hasTop) {
    pathData += `M ${CENTER - PATH_HALF} 0 `;
    pathData += `L ${CENTER + PATH_HALF} 0 `;
    pathData += `L ${CENTER + PATH_HALF} ${CENTER - PATH_HALF} `;
    pathData += `L ${CENTER - PATH_HALF} ${CENTER - PATH_HALF} Z `;
  }

  // Bottom path
  if (hasBottom) {
    pathData += `M ${CENTER - PATH_HALF} ${CENTER + PATH_HALF} `;
    pathData += `L ${CENTER + PATH_HALF} ${CENTER + PATH_HALF} `;
    pathData += `L ${CENTER + PATH_HALF} ${size} `;
    pathData += `L ${CENTER - PATH_HALF} ${size} Z `;
  }

  return (
    <g
      className="tile-rotatable"
      transform={`translate(${x}, ${y}) rotate(${rotation}, ${size/2}, ${size/2})`}
    >
      {/* Brown background */}
      <rect
        width={size}
        height={size}
        fill="#8B4513"
        stroke="#000000"
        strokeWidth="1"
      />

      {/* Sand paths */}
      <path
        d={pathData}
        fill="#F4A460"
        stroke="none"
      />
    </g>
  );
}
