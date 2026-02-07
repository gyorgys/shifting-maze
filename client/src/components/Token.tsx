import { TokenId } from '../types/Game';

interface TokenProps {
  tokenId: TokenId;  // 0-20
  x: number;  // Tile x coordinate
  y: number;  // Tile y coordinate
  gridOffset: { dx: number; dy: number };  // Offset within tile for grid layout
  tileSize?: number;
}

export function Token({ tokenId, x, y, gridOffset, tileSize = 80 }: TokenProps) {
  const DIAMETER = tileSize * 0.5;  // 1/2 of tile (40px for 80px tile)
  const RADIUS = DIAMETER / 2;

  // Center in tile + grid offset
  const cx = x + tileSize / 2 + gridOffset.dx;
  const cy = y + tileSize / 2 + gridOffset.dy;

  // Token values: 0-19 = 1-20, 20 = 25
  const value = tokenId <= 19 ? tokenId + 1 : 25;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS}
        fill="white"
        stroke="black"
        strokeWidth="2"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={tileSize * 0.2}
        fontWeight="bold"
        fill="black"
        fontFamily="Arial, sans-serif"
      >
        {value}
      </text>
    </g>
  );
}
