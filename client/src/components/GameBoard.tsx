import { Tile as TileComponent } from './Tile';
import { Token } from './Token';
import { PlayerMarker } from './PlayerMarker';
import { Tile as TileType, Position, TokenId } from '../types/Game';
import { calculateGridPosition, getItemsAtPosition } from '../utils/gridPositioning';

interface GameBoardProps {
  board: TileType[][];  // 7x7 tile matrix
  tileInPlay: TileType;
  playerPositions: { [color: string]: Position };
  tokenPositions: { [tokenId: string]: Position };
  collectedTokens: { [color: string]: TokenId[] };
  tileSize?: number;
}

export function GameBoard({
  board,
  tileInPlay,
  playerPositions,
  tokenPositions,
  tileSize = 80,
}: GameBoardProps) {
  const boardWidth = 7 * tileSize;
  const boardHeight = 7 * tileSize;

  return (
    <div>
      <svg
        width={boardWidth}
        height={boardHeight}
        style={{
          border: '2px solid #000',
          display: 'block',
          margin: '0 auto',
        }}
      >
        {/* Render tiles */}
        {board.map((row, rowIdx) =>
          row.map((tile, colIdx) => (
            <TileComponent
              key={`tile-${rowIdx}-${colIdx}`}
              tile={tile}
              x={colIdx * tileSize}
              y={rowIdx * tileSize}
              size={tileSize}
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
            tileSize * 0.25
          );

          return (
            <Token
              key={`token-${tokenId}`}
              tokenId={parseInt(tokenId)}
              x={col * tileSize}
              y={row * tileSize}
              gridOffset={gridOffset}
              tileSize={tileSize}
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
            tileSize * 0.25
          );

          return (
            <PlayerMarker
              key={`player-${color}`}
              color={color as 'red' | 'green' | 'blue' | 'white'}
              x={col * tileSize}
              y={row * tileSize}
              gridOffset={gridOffset}
              tileSize={tileSize}
            />
          );
        })}
      </svg>

      {/* Tile in play indicator */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
          Tile in Play:
        </div>
        <svg width={tileSize} height={tileSize} style={{ border: '1px solid #000' }}>
          <TileComponent
            tile={tileInPlay}
            x={0}
            y={0}
            size={tileSize}
          />
        </svg>
      </div>
    </div>
  );
}
