import { useState } from 'react';
import { Tile as TileComponent } from './Tile';
import { Token } from './Token';
import { PlayerMarker } from './PlayerMarker';
import { Tile as TileType, Position } from '../types/Game';
import { calculateGridPosition, getItemsAtPosition } from '../utils/gridPositioning';

interface GameBoardProps {
  board: TileType[][];  // 7x7 tile matrix
  playerPositions: { [color: string]: Position };
  tokenPositions: { [tokenId: string]: Position };
  tileInPlay: TileType;  // The tile that will be pushed in
  controlsEnabled: boolean;  // Whether shift controls are active
}

export const TILE_SIZE = 80;

const ARROW_WIDTH = TILE_SIZE * 0.5;  // 40px - perpendicular to direction
const ARROW_LENGTH = TILE_SIZE * 0.2; // 16px - in direction of pointing
const ARROW_GAP = 4;

// Preview tile positioning
const PREVIEW_GAP = 8; // Gap between preview tile and board edge

// Hover state type
type HoverState =
  | { type: 'row'; index: number; direction: 'left' | 'right' }
  | { type: 'column'; index: number; direction: 'up' | 'down' }
  | null;

export function GameBoard({
  board,
  playerPositions,
  tokenPositions,
  tileInPlay,
  controlsEnabled,
}: GameBoardProps) {
  const [hoveredArrow, setHoveredArrow] = useState<HoverState>(null);

  const boardSize = 7 * TILE_SIZE;
  const shiftableIndices = [1, 3, 5]; // Rows/columns that can be shifted

  // Total padding to accommodate preview tiles
  const PADDING = TILE_SIZE + PREVIEW_GAP;

  const handleShiftRow = (row: number, direction: 'left' | 'right') => {
    console.log(`Shift row ${row} ${direction}`);
  };

  const handleShiftColumn = (col: number, direction: 'up' | 'down') => {
    console.log(`Shift column ${col} ${direction}`);
  };

  // Calculate preview tile position based on hovered arrow
  const getPreviewPosition = (): { x: number; y: number } | null => {
    if (!hoveredArrow || !controlsEnabled) return null;

    if (hoveredArrow.type === 'row') {
      const y = hoveredArrow.index * TILE_SIZE;
      if (hoveredArrow.direction === 'right') {
        // Left side - tile pushing from left
        return { x: -TILE_SIZE - PREVIEW_GAP, y };
      } else {
        // Right side - tile pushing from right
        return { x: boardSize + PREVIEW_GAP, y };
      }
    } else {
      const x = hoveredArrow.index * TILE_SIZE;
      if (hoveredArrow.direction === 'down') {
        // Top side - tile pushing from top
        return { x, y: -TILE_SIZE - PREVIEW_GAP };
      } else {
        // Bottom side - tile pushing from bottom
        return { x, y: boardSize + PREVIEW_GAP };
      }
    }
  };

  const previewPosition = getPreviewPosition();

  return (
    <div>
      <svg
        viewBox={`${-PADDING} ${-PADDING} ${boardSize + 2 * PADDING} ${boardSize + 2 * PADDING}`}
        className="svg-board"
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
              {/* Left arrow - pointing right (pushes from left) */}
              <polygon
                points={`
                  ${-ARROW_GAP},${rowCenterY}
                  ${-ARROW_GAP - ARROW_LENGTH},${rowCenterY - ARROW_WIDTH / 2}
                  ${-ARROW_GAP - ARROW_LENGTH},${rowCenterY + ARROW_WIDTH / 2}
                `}
                fill={controlsEnabled ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled ? () => handleShiftRow(rowIdx, 'right') : undefined}
                onMouseEnter={controlsEnabled ? () => setHoveredArrow({ type: 'row', index: rowIdx, direction: 'right' }) : undefined}
                onMouseLeave={controlsEnabled ? () => setHoveredArrow(null) : undefined}
              />
              {/* Right arrow - pointing left (pushes from right) */}
              <polygon
                points={`
                  ${boardSize + ARROW_GAP},${rowCenterY}
                  ${boardSize + ARROW_GAP + ARROW_LENGTH},${rowCenterY - ARROW_WIDTH / 2}
                  ${boardSize + ARROW_GAP + ARROW_LENGTH},${rowCenterY + ARROW_WIDTH / 2}
                `}
                fill={controlsEnabled ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled ? () => handleShiftRow(rowIdx, 'left') : undefined}
                onMouseEnter={controlsEnabled ? () => setHoveredArrow({ type: 'row', index: rowIdx, direction: 'left' }) : undefined}
                onMouseLeave={controlsEnabled ? () => setHoveredArrow(null) : undefined}
              />
            </g>
          );
        })}

        {/* Column shift arrows (top and bottom) */}
        {shiftableIndices.map(colIdx => {
          const colCenterX = colIdx * TILE_SIZE + TILE_SIZE / 2;

          return (
            <g key={`col-${colIdx}`}>
              {/* Top arrow - pointing down (pushes from top) */}
              <polygon
                points={`
                  ${colCenterX},${-ARROW_GAP}
                  ${colCenterX - ARROW_WIDTH / 2},${-ARROW_GAP - ARROW_LENGTH}
                  ${colCenterX + ARROW_WIDTH / 2},${-ARROW_GAP - ARROW_LENGTH}
                `}
                fill={controlsEnabled ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled ? () => handleShiftColumn(colIdx, 'down') : undefined}
                onMouseEnter={controlsEnabled ? () => setHoveredArrow({ type: 'column', index: colIdx, direction: 'down' }) : undefined}
                onMouseLeave={controlsEnabled ? () => setHoveredArrow(null) : undefined}
              />
              {/* Bottom arrow - pointing up (pushes from bottom) */}
              <polygon
                points={`
                  ${colCenterX},${boardSize + ARROW_GAP}
                  ${colCenterX - ARROW_WIDTH / 2},${boardSize + ARROW_GAP + ARROW_LENGTH}
                  ${colCenterX + ARROW_WIDTH / 2},${boardSize + ARROW_GAP + ARROW_LENGTH}
                `}
                fill={controlsEnabled ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled ? () => handleShiftColumn(colIdx, 'up') : undefined}
                onMouseEnter={controlsEnabled ? () => setHoveredArrow({ type: 'column', index: colIdx, direction: 'up' }) : undefined}
                onMouseLeave={controlsEnabled ? () => setHoveredArrow(null) : undefined}
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

        {/* Preview tile (shown when hovering over arrows) - rendered last with pointer-events: none */}
        {previewPosition && (
          <g opacity="0.5" pointerEvents="none">
            <TileComponent
              tile={tileInPlay}
              x={previewPosition.x}
              y={previewPosition.y}
              size={TILE_SIZE}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
