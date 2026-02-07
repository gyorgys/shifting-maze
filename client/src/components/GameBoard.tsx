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

const ARROW_WIDTH = TILE_SIZE * 0.5;  // 40px - perpendicular to direction
const ARROW_LENGTH = TILE_SIZE * 0.2; // 16px - in direction of pointing
const ARROW_GAP = 4;
const ARROW_AREA = ARROW_LENGTH + ARROW_GAP; // 20px

export function GameBoard({
  board,
  playerPositions,
  tokenPositions,
}: GameBoardProps) {
  const boardSize = 7 * TILE_SIZE;
  const shiftableIndices = [1, 3, 5]; // Rows/columns that can be shifted

  const handleShiftRow = (row: number, direction: 'left' | 'right') => {
    console.log(`Shift row ${row} ${direction}`);
  };

  const handleShiftColumn = (col: number, direction: 'up' | 'down') => {
    console.log(`Shift column ${col} ${direction}`);
  };

  return (
    <div>
      <svg
        viewBox={`${-ARROW_AREA} ${-ARROW_AREA} ${boardSize + 2 * ARROW_AREA} ${boardSize + 2 * ARROW_AREA}`}
        style={{
          display: 'block',
          height: '75vh',
          width: 'auto',
        }}
      >
        {/* Board border */}
        <rect
          x={0}
          y={0}
          width={boardSize}
          height={boardSize}
          fill="none"
          stroke="#000"
          strokeWidth="2"
        />

        {/* Row shift arrows (left and right) */}
        {shiftableIndices.map(rowIdx => {
          const rowCenterY = rowIdx * TILE_SIZE + TILE_SIZE / 2;

          return (
            <g key={`row-${rowIdx}`}>
              {/* Left arrow - pointing right */}
              <polygon
                points={`
                  ${-ARROW_GAP},${rowCenterY}
                  ${-ARROW_GAP - ARROW_LENGTH},${rowCenterY - ARROW_WIDTH / 2}
                  ${-ARROW_GAP - ARROW_LENGTH},${rowCenterY + ARROW_WIDTH / 2}
                `}
                fill="orange"
                stroke="#000"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => handleShiftRow(rowIdx, 'right')}
              />
              {/* Right arrow - pointing left */}
              <polygon
                points={`
                  ${boardSize + ARROW_GAP},${rowCenterY}
                  ${boardSize + ARROW_GAP + ARROW_LENGTH},${rowCenterY - ARROW_WIDTH / 2}
                  ${boardSize + ARROW_GAP + ARROW_LENGTH},${rowCenterY + ARROW_WIDTH / 2}
                `}
                fill="orange"
                stroke="#000"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => handleShiftRow(rowIdx, 'left')}
              />
            </g>
          );
        })}

        {/* Column shift arrows (top and bottom) */}
        {shiftableIndices.map(colIdx => {
          const colCenterX = colIdx * TILE_SIZE + TILE_SIZE / 2;

          return (
            <g key={`col-${colIdx}`}>
              {/* Top arrow - pointing down */}
              <polygon
                points={`
                  ${colCenterX},${-ARROW_GAP}
                  ${colCenterX - ARROW_WIDTH / 2},${-ARROW_GAP - ARROW_LENGTH}
                  ${colCenterX + ARROW_WIDTH / 2},${-ARROW_GAP - ARROW_LENGTH}
                `}
                fill="orange"
                stroke="#000"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => handleShiftColumn(colIdx, 'down')}
              />
              {/* Bottom arrow - pointing up */}
              <polygon
                points={`
                  ${colCenterX},${boardSize + ARROW_GAP}
                  ${colCenterX - ARROW_WIDTH / 2},${boardSize + ARROW_GAP + ARROW_LENGTH}
                  ${colCenterX + ARROW_WIDTH / 2},${boardSize + ARROW_GAP + ARROW_LENGTH}
                `}
                fill="orange"
                stroke="#000"
                strokeWidth="1"
                style={{ cursor: 'pointer' }}
                onClick={() => handleShiftColumn(colIdx, 'up')}
              />
            </g>
          );
        })}

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
