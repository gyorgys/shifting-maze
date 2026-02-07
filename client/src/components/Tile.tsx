import { Tile as TileType } from '../types/Game';

interface TileProps {
  tile: TileType;  // Bitmask 0-15
  x: number;
  y: number;
  size?: number;
}

// Tile bitmask constants
const LEFT = 0x1;    // Bit 0
const RIGHT = 0x2;   // Bit 1
const TOP = 0x4;     // Bit 2
const BOTTOM = 0x8;  // Bit 3

export function Tile({ tile, x, y, size = 80 }: TileProps) {
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
    <g transform={`translate(${x}, ${y})`}>
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
