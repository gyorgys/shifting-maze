import { useState, useRef, useEffect } from 'react';
import { Tile as TileComponent } from './Tile';
import { Token } from './Token';
import { PlayerMarker } from './PlayerMarker';
import { Tile as TileType, Position } from '../types/Game';
import { ShiftRequest } from '../services/api';
import { calculateGridPosition, getItemsAtPosition } from '../utils/gridPositioning';

interface GameBoardProps {
  board: TileType[][];  // 7x7 tile matrix
  playerPositions: { [color: string]: Position };
  tokenPositions: { [tokenId: string]: Position };
  tileInPlay: TileType;  // The tile that will be pushed in
  controlsEnabled: boolean;  // Whether shift controls are active
  onShiftComplete?: (shift: ShiftRequest) => void;
}

export const TILE_SIZE = 80;

const ARROW_WIDTH = TILE_SIZE * 0.5;  // 40px - perpendicular to direction
const ARROW_LENGTH = TILE_SIZE * 0.2; // 16px - in direction of pointing
const ARROW_GAP = 4;
const OUTER_BORDER_GAP = 4; // Gap between preview tile and outer SVG border
const SHIFT_ANIMATION_MS = 300;

// Hover state type
type HoverState =
  | { type: 'row'; index: number; direction: 'left' | 'right' }
  | { type: 'column'; index: number; direction: 'up' | 'down' }
  | null;

// Shift animation state
interface ShiftAnimationState {
  shiftType: 'row' | 'column';
  shiftIndex: number;
  direction: 'left' | 'right' | 'up' | 'down';
  insertedTile: TileType;
}

export function GameBoard({
  board,
  playerPositions,
  tokenPositions,
  tileInPlay,
  controlsEnabled,
  onShiftComplete,
}: GameBoardProps) {
  const [hoveredArrow, setHoveredArrow] = useState<HoverState>(null);
  const [shiftAnimation, setShiftAnimation] = useState<ShiftAnimationState | null>(null);
  const [animating, setAnimating] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);

  const boardSize = 7 * TILE_SIZE;
  const shiftableIndices = [1, 3, 5]; // Rows/columns that can be shifted

  // Total padding: tile size + gap to outer border
  const PADDING = TILE_SIZE + OUTER_BORDER_GAP;

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const handleShiftRow = (row: number, direction: 'left' | 'right') => {
    if (!controlsEnabled || animating) return;

    const animation: ShiftAnimationState = {
      shiftType: 'row',
      shiftIndex: row,
      direction,
      insertedTile: tileInPlay,
    };

    setShiftAnimation(animation);
    setHoveredArrow(null);

    // Trigger animation on next frame so the initial position renders first
    requestAnimationFrame(() => {
      setAnimating(true);
    });

    // After animation completes, notify parent
    animationTimeoutRef.current = setTimeout(() => {
      setShiftAnimation(null);
      setAnimating(false);
      animationTimeoutRef.current = null;

      onShiftComplete?.({
        tile: tileInPlay,
        shiftType: 'row',
        shiftIndex: row,
        direction,
      });
    }, SHIFT_ANIMATION_MS);
  };

  const handleShiftColumn = (col: number, direction: 'up' | 'down') => {
    if (!controlsEnabled || animating) return;

    const animation: ShiftAnimationState = {
      shiftType: 'column',
      shiftIndex: col,
      direction,
      insertedTile: tileInPlay,
    };

    setShiftAnimation(animation);
    setHoveredArrow(null);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      setAnimating(true);
    });

    // After animation completes, notify parent
    animationTimeoutRef.current = setTimeout(() => {
      setShiftAnimation(null);
      setAnimating(false);
      animationTimeoutRef.current = null;

      onShiftComplete?.({
        tile: tileInPlay,
        shiftType: 'column',
        shiftIndex: col,
        direction,
      });
    }, SHIFT_ANIMATION_MS);
  };

  // Calculate tile animation transform
  function getTileTransform(rowIdx: number, colIdx: number): string | undefined {
    if (!shiftAnimation || !animating) return undefined;

    const { shiftType, shiftIndex, direction } = shiftAnimation;

    if (shiftType === 'row' && rowIdx === shiftIndex) {
      if (direction === 'left') return `translate(${-TILE_SIZE}, 0)`;
      if (direction === 'right') return `translate(${TILE_SIZE}, 0)`;
    }

    if (shiftType === 'column' && colIdx === shiftIndex) {
      if (direction === 'up') return `translate(0, ${-TILE_SIZE})`;
      if (direction === 'down') return `translate(0, ${TILE_SIZE})`;
    }

    return undefined;
  }

  // Calculate entity (player/token) animation transform
  function getEntityTransform(row: number, col: number): string | undefined {
    if (!shiftAnimation || !animating) return undefined;

    const { shiftType, shiftIndex, direction } = shiftAnimation;

    if (shiftType === 'row' && row === shiftIndex) {
      if (direction === 'left') return `translate(${-TILE_SIZE}, 0)`;
      if (direction === 'right') return `translate(${TILE_SIZE}, 0)`;
    }

    if (shiftType === 'column' && col === shiftIndex) {
      if (direction === 'up') return `translate(0, ${-TILE_SIZE})`;
      if (direction === 'down') return `translate(0, ${TILE_SIZE})`;
    }

    return undefined;
  }

  // Get the insertion position for the tile being pushed in during animation
  function getInsertedTilePosition(): { x: number; y: number } | null {
    if (!shiftAnimation) return null;

    const { shiftType, shiftIndex, direction } = shiftAnimation;

    if (shiftType === 'row') {
      const y = shiftIndex * TILE_SIZE;
      if (direction === 'right') {
        // Tile enters from left side
        return { x: -TILE_SIZE, y };
      } else {
        // Tile enters from right side
        return { x: boardSize, y };
      }
    } else {
      const x = shiftIndex * TILE_SIZE;
      if (direction === 'down') {
        // Tile enters from top
        return { x, y: -TILE_SIZE };
      } else {
        // Tile enters from bottom
        return { x, y: boardSize };
      }
    }
  }

  // Calculate preview tile position based on hovered arrow
  // Preview tiles are flush against the board edge
  const getPreviewPosition = (): { x: number; y: number } | null => {
    if (!hoveredArrow || !controlsEnabled || animating) return null;

    if (hoveredArrow.type === 'row') {
      const y = hoveredArrow.index * TILE_SIZE;
      if (hoveredArrow.direction === 'right') {
        // Left side - tile flush against left edge of board
        return { x: -TILE_SIZE, y };
      } else {
        // Right side - tile flush against right edge of board
        return { x: boardSize, y };
      }
    } else {
      const x = hoveredArrow.index * TILE_SIZE;
      if (hoveredArrow.direction === 'down') {
        // Top side - tile flush against top edge of board
        return { x, y: -TILE_SIZE };
      } else {
        // Bottom side - tile flush against bottom edge of board
        return { x, y: boardSize };
      }
    }
  };

  const previewPosition = getPreviewPosition();
  const insertedTilePos = getInsertedTilePosition();
  const transitionStyle = animating ? `transform ${SHIFT_ANIMATION_MS}ms ease-in-out` : 'none';

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

        {/* Clip path for board area - hides tiles sliding out */}
        <defs>
          <clipPath id="board-clip">
            <rect x={-TILE_SIZE} y={-TILE_SIZE} width={boardSize + 2 * TILE_SIZE} height={boardSize + 2 * TILE_SIZE} />
          </clipPath>
        </defs>

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
                fill={controlsEnabled && !animating ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled && !animating ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled && !animating ? () => handleShiftRow(rowIdx, 'right') : undefined}
                onMouseEnter={controlsEnabled && !animating ? () => setHoveredArrow({ type: 'row', index: rowIdx, direction: 'right' }) : undefined}
                onMouseLeave={controlsEnabled && !animating ? () => setHoveredArrow(null) : undefined}
              />
              {/* Right arrow - pointing left (pushes from right) */}
              <polygon
                points={`
                  ${boardSize + ARROW_GAP},${rowCenterY}
                  ${boardSize + ARROW_GAP + ARROW_LENGTH},${rowCenterY - ARROW_WIDTH / 2}
                  ${boardSize + ARROW_GAP + ARROW_LENGTH},${rowCenterY + ARROW_WIDTH / 2}
                `}
                fill={controlsEnabled && !animating ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled && !animating ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled && !animating ? () => handleShiftRow(rowIdx, 'left') : undefined}
                onMouseEnter={controlsEnabled && !animating ? () => setHoveredArrow({ type: 'row', index: rowIdx, direction: 'left' }) : undefined}
                onMouseLeave={controlsEnabled && !animating ? () => setHoveredArrow(null) : undefined}
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
                fill={controlsEnabled && !animating ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled && !animating ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled && !animating ? () => handleShiftColumn(colIdx, 'down') : undefined}
                onMouseEnter={controlsEnabled && !animating ? () => setHoveredArrow({ type: 'column', index: colIdx, direction: 'down' }) : undefined}
                onMouseLeave={controlsEnabled && !animating ? () => setHoveredArrow(null) : undefined}
              />
              {/* Bottom arrow - pointing up (pushes from bottom) */}
              <polygon
                points={`
                  ${colCenterX},${boardSize + ARROW_GAP}
                  ${colCenterX - ARROW_WIDTH / 2},${boardSize + ARROW_GAP + ARROW_LENGTH}
                  ${colCenterX + ARROW_WIDTH / 2},${boardSize + ARROW_GAP + ARROW_LENGTH}
                `}
                fill={controlsEnabled && !animating ? 'orange' : '#ccc'}
                stroke="#000"
                strokeWidth="1"
                className={controlsEnabled && !animating ? 'cursor-pointer' : 'cursor-not-allowed'}
                onClick={controlsEnabled && !animating ? () => handleShiftColumn(colIdx, 'up') : undefined}
                onMouseEnter={controlsEnabled && !animating ? () => setHoveredArrow({ type: 'column', index: colIdx, direction: 'up' }) : undefined}
                onMouseLeave={controlsEnabled && !animating ? () => setHoveredArrow(null) : undefined}
              />
            </g>
          );
        })}

        {/* Clipped group for board content (tiles, tokens, players) */}
        <g clipPath="url(#board-clip)">
          {/* Render tiles */}
          {board.map((row, rowIdx) =>
            row.map((tile, colIdx) => {
              const transform = getTileTransform(rowIdx, colIdx);
              return (
                <g
                  key={`tile-${rowIdx}-${colIdx}`}
                  style={{ transition: transform !== undefined ? transitionStyle : 'none' }}
                  transform={transform || undefined}
                >
                  <TileComponent
                    tile={tile}
                    x={colIdx * TILE_SIZE}
                    y={rowIdx * TILE_SIZE}
                    size={TILE_SIZE}
                  />
                </g>
              );
            })
          )}

          {/* Inserted tile (slides in during animation) */}
          {insertedTilePos && (
            <g
              style={{ transition: transitionStyle }}
              transform={animating ? getTileTransform(
                shiftAnimation!.shiftType === 'row' ? shiftAnimation!.shiftIndex : (shiftAnimation!.direction === 'down' ? -1 : 7),
                shiftAnimation!.shiftType === 'column' ? shiftAnimation!.shiftIndex : (shiftAnimation!.direction === 'right' ? -1 : 7)
              ) || undefined : undefined}
            >
              <TileComponent
                tile={shiftAnimation!.insertedTile}
                x={insertedTilePos.x}
                y={insertedTilePos.y}
                size={TILE_SIZE}
              />
            </g>
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

            const entityTransform = getEntityTransform(row, col);

            return (
              <g
                key={`token-${tokenId}`}
                style={{ transition: entityTransform !== undefined ? transitionStyle : 'none' }}
                transform={entityTransform || undefined}
              >
                <Token
                  tokenId={parseInt(tokenId)}
                  x={col * TILE_SIZE}
                  y={row * TILE_SIZE}
                  gridOffset={gridOffset}
                  tileSize={TILE_SIZE}
                />
              </g>
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

            const entityTransform = getEntityTransform(row, col);

            return (
              <g
                key={`player-${color}`}
                style={{ transition: entityTransform !== undefined ? transitionStyle : 'none' }}
                transform={entityTransform || undefined}
              >
                <PlayerMarker
                  color={color as 'red' | 'green' | 'blue' | 'white'}
                  x={col * TILE_SIZE}
                  y={row * TILE_SIZE}
                  gridOffset={gridOffset}
                  tileSize={TILE_SIZE}
                />
              </g>
            );
          })}
        </g>

        {/* Preview tile (shown when hovering over arrows) - rendered last with pointer-events: none */}
        {previewPosition && !shiftAnimation && (
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
