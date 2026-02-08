import { useState, useEffect } from 'react';
import { getGameDetails } from '../services/api';
import { Game, Tile as TileType } from '../types/Game';
import { User } from '../types/User';
import { GameBoard, TILE_SIZE } from './GameBoard';
import { Tile } from './Tile';

// Tile bitmask constants
const LEFT = 0x1;    // Bit 0
const RIGHT = 0x2;   // Bit 1
const TOP = 0x4;     // Bit 2
const BOTTOM = 0x8;  // Bit 3

// Rotate tile clockwise
function rotateTileClockwise(tile: TileType): TileType {
  const hasLeft = !!(tile & LEFT);
  const hasRight = !!(tile & RIGHT);
  const hasTop = !!(tile & TOP);
  const hasBottom = !!(tile & BOTTOM);

  // CW rotation: LEFT->TOP, TOP->RIGHT, RIGHT->BOTTOM, BOTTOM->LEFT
  let rotated = 0;
  if (hasLeft) rotated |= TOP;
  if (hasTop) rotated |= RIGHT;
  if (hasRight) rotated |= BOTTOM;
  if (hasBottom) rotated |= LEFT;

  return rotated;
}

// Rotate tile counter-clockwise
function rotateTileCounterClockwise(tile: TileType): TileType {
  const hasLeft = !!(tile & LEFT);
  const hasRight = !!(tile & RIGHT);
  const hasTop = !!(tile & TOP);
  const hasBottom = !!(tile & BOTTOM);

  // CCW rotation: LEFT->BOTTOM, BOTTOM->RIGHT, RIGHT->TOP, TOP->LEFT
  let rotated = 0;
  if (hasLeft) rotated |= BOTTOM;
  if (hasBottom) rotated |= RIGHT;
  if (hasRight) rotated |= TOP;
  if (hasTop) rotated |= LEFT;

  return rotated;
}

interface GamePageProps {
  gameCode: string;
  user: User;
  onGameLoaded?: (gameName: string) => void;
}

export function GamePage({ gameCode, user, onGameLoaded }: GamePageProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Local state for rotated tile (starts with original tile value)
  const [rotatedTile, setRotatedTile] = useState<TileType | null>(null);

  useEffect(() => {
    async function loadGame() {
      setLoading(true);
      setError(null);
      try {
        const gameData = await getGameDetails(gameCode, user.token);
        setGame(gameData);
        // Initialize rotated tile with the current tile in play
        if (gameData.tileInPlay !== undefined) {
          setRotatedTile(gameData.tileInPlay);
        }
        // Notify parent of game name for header
        if (onGameLoaded) {
          onGameLoaded(gameData.name);
        }
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadGame();
  }, [gameCode, user.token, onGameLoaded]);

  // Reset rotated tile when game's tileInPlay changes
  useEffect(() => {
    if (game?.tileInPlay !== undefined) {
      setRotatedTile(game.tileInPlay);
    }
  }, [game?.tileInPlay]);

  const handleRotateClockwise = () => {
    if (rotatedTile !== null) {
      setRotatedTile(rotateTileClockwise(rotatedTile));
    }
  };

  const handleRotateCounterClockwise = () => {
    if (rotatedTile !== null) {
      setRotatedTile(rotateTileCounterClockwise(rotatedTile));
    }
  };

  if (loading) {
    return <p>Loading game...</p>;
  }

  if (error) {
    return <div className="text-error">Error: {error}</div>;
  }

  if (!game) {
    return <p>Game not found</p>;
  }

  // Controls are only enabled during shift phase for the current player
  const controlsEnabled = game.currentTurn?.username === user.username && game.currentTurn?.phase === 'shift';

  return (
    <div className="grid-game-page">
      {/* Info Panel */}
      <div className="card self-start">
        <div className="mb-10">
          <span className="text-emphasized">Stage:</span> {game.stage}
        </div>


        {/* Players list */}
        <div>
          <span className="text-emphasized">Players:</span>
          <ul className="list-compact">
            {game.players.map(player => {
              const isCurrentPlayer = game.currentTurn?.username === player.username;
              return (
                <li key={player.username}>
                  <span
                    className="player-indicator"
                    style={{ backgroundColor: player.color }}
                  ></span>
                  <span className={isCurrentPlayer ? 'text-emphasized' : 'text-normal'}>
                    {player.username} ({player.color})
                    {isCurrentPlayer && game.currentTurn && (
                      <span> - {game.currentTurn.phase}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Game Board */}
      {game.board && game.tileInPlay !== undefined && game.playerPositions && game.tokenPositions ? (
        <GameBoard
          board={game.board}
          playerPositions={game.playerPositions}
          tokenPositions={game.tokenPositions}
          controlsEnabled={controlsEnabled}
        />
      ) : (
        <div className="card p-20">
          <p>Game board not available (game may not have started yet)</p>
        </div>
      )}

      {/* Tile in Play */}
      {rotatedTile !== null && (
        <div className="self-start">
          <div className="header2 mb-10">
            Tile in Play:
          </div>
          <svg viewBox={`0 0 ${TILE_SIZE} ${TILE_SIZE}`} className="svg-tile-in-play">
            <Tile
              tile={rotatedTile}
              x={0}
              y={0}
              size={TILE_SIZE}
            />
          </svg>

          {/* Rotation controls */}
          <div className="flex gap-8 mt-10 justify-center">
            <button
              onClick={handleRotateClockwise}
              disabled={!controlsEnabled}
              className="btn btn-icon btn-info"
              title="Rotate Clockwise"
            >
              ↻
            </button>
            <button
              onClick={handleRotateCounterClockwise}
              disabled={!controlsEnabled}
              className="btn btn-icon btn-info"
              title="Rotate Counter-Clockwise"
            >
              ↺
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
