import { PlayerColor } from '../types/Game';

interface PlayerMarkerProps {
  color: PlayerColor;
  x: number;  // Tile x coordinate
  y: number;  // Tile y coordinate
  gridOffset: { dx: number; dy: number };  // Offset within tile for grid layout
  tileSize?: number;
}

export function PlayerMarker({ color, x, y, gridOffset, tileSize = 80 }: PlayerMarkerProps) {
  const OUTER_DIAMETER = tileSize * 0.3;  // 3/10 of tile (24px for 80px tile)
  const INNER_DIAMETER = tileSize * 0.2;  // 1/5 of tile (16px for 80px tile)

  // Center in tile + grid offset
  const cx = x + tileSize / 2 + gridOffset.dx;
  const cy = y + tileSize / 2 + gridOffset.dy;

  return (
    <g>
      {/* Outer circle */}
      <circle
        cx={cx}
        cy={cy}
        r={OUTER_DIAMETER / 2}
        fill={color}
        stroke="black"
        strokeWidth="2"
      />
      {/* Inner circle */}
      <circle
        cx={cx}
        cy={cy}
        r={INNER_DIAMETER / 2}
        fill={color}
        stroke="black"
        strokeWidth="2"
      />
    </g>
  );
}
