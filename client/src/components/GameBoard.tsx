import { Tile as TileComponent } from './Tile';
import { Token } from './Token';
import { PlayerMarker } from './PlayerMarker';
import { Tile as TileType, Position } from '../types/Game';
import { calculateGridPosition, getItemsAtPosition } from '../utils/gridPositioning';

interface GameBoardProps {
  board: TileType[][];  // 7x7 tile matrix
  playerPositions: { [color: string]: Position };
  tokenPositions: { [tokenId: string]: Position };
}

export const TILE_SIZE = 80;

export function GameBoard({
  board,
  playerPositions,
  tokenPositions,
}: GameBoardProps) {
  const boardSize = 7 * TILE_SIZE;

  return (
    <div>
      <svg
        viewBox={`0 0 ${boardSize} ${boardSize}`}
        style={{
          border: '2px solid #000',
          display: 'block',
          height: '75vh',
          width: 'auto',
        }}
      >
        {/* Render tiles */}
        {board.map((row, rowIdx) =>
          row.map((tile, colIdx) => (
            <TileComponent
              key={`tile-${rowIdx}-${colIdx}`}
              tile={tile}
              x={colIdx * TILE_SIZE}
              y={rowIdx * TILE_SIZE}
              size={TILE_SIZE}
            />
          ))
        )}

        {/* Render tokens */}
        {Object.entries(tokenPositions).map(([tokenId, [row, col]]) => {
          // Get all items at this position for grid layout
          const tokensAtPos = getItemsAtPosition(row, col, tokenPositions);
          const playersAtPos = getItemsAtPosition(row, col, playerPositions);
          const allItemsAtPos = [...tokensAtPos, ...playersAtPos];

          // Calculate grid position
          const gridOffset = calculateGridPosition(
            tokenId,
            allItemsAtPos,
            TILE_SIZE * 0.25
          );

          return (
            <Token
              key={`token-${tokenId}`}
              tokenId={parseInt(tokenId)}
              x={col * TILE_SIZE}
              y={row * TILE_SIZE}
              gridOffset={gridOffset}
              tileSize={TILE_SIZE}
            />
          );
        })}

        {/* Render players */}
        {Object.entries(playerPositions).map(([color, [row, col]]) => {
          // Get all items at this position for grid layout
          const tokensAtPos = getItemsAtPosition(row, col, tokenPositions);
          const playersAtPos = getItemsAtPosition(row, col, playerPositions);
          const allItemsAtPos = [...tokensAtPos, ...playersAtPos];

          // Calculate grid position
          const gridOffset = calculateGridPosition(
            color,
            allItemsAtPos,
            TILE_SIZE * 0.25
          );

          return (
            <PlayerMarker
              key={`player-${color}`}
              color={color as 'red' | 'green' | 'blue' | 'white'}
              x={col * TILE_SIZE}
              y={row * TILE_SIZE}
              gridOffset={gridOffset}
              tileSize={TILE_SIZE}
            />
          );
        })}
      </svg>
    </div>
  );
}
