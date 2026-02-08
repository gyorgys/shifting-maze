import { useState, useRef, useEffect } from 'react';
import { Tile as TileType } from '../types/Game';
import { Tile } from './Tile';
import { rotateTileClockwise } from '@shared/utils/tileUtils';
import { TILE_SIZE } from './GameBoard';

interface TileInPlayProps {
  tile: TileType;
  controlsEnabled: boolean;
  onRotationComplete: (newTile: TileType) => void;
}

export function TileInPlay({ tile, controlsEnabled, onRotationComplete }: TileInPlayProps) {
  const [displayTile, setDisplayTile] = useState(tile);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const rotationTimeoutRef = useRef<number | null>(null);
  const pendingRotationsRef = useRef<number>(0);

  // Reset when tile changes from parent
  useEffect(() => {
    setDisplayTile(tile);
    setIsAnimating(false); // Disable animation for instant reset
    setRotationAngle(0);
    pendingRotationsRef.current = 0;
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
      rotationTimeoutRef.current = null;
    }
  }, [tile]);

  const handleRotateClockwise = () => {
    // Cancel any pending rotation update
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
    }

    // Track pending rotations
    pendingRotationsRef.current += 1;

    // Enable animation and apply visual rotation
    setIsAnimating(true);
    setRotationAngle(prev => prev + 90);

    // After animation completes (300ms), apply all pending rotations
    rotationTimeoutRef.current = setTimeout(() => {
      const rotations = pendingRotationsRef.current;
      // Apply the net rotations (modulo 4 since 4 rotations = 360°)
      const netRotations = ((rotations % 4) + 4) % 4;

      let result = displayTile;
      for (let i = 0; i < netRotations; i++) {
        result = rotateTileClockwise(result);
      }

      setDisplayTile(result);
      setIsAnimating(false); // Disable animation for instant reset
      setRotationAngle(0);
      pendingRotationsRef.current = 0;
      rotationTimeoutRef.current = null;

      // Notify parent of the new tile
      onRotationComplete(result);
    }, 300);
  };

  const handleRotateCounterClockwise = () => {
    // Cancel any pending rotation update
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
    }

    // Track pending rotations (negative for counterclockwise)
    pendingRotationsRef.current -= 1;

    // Enable animation and apply visual rotation
    setIsAnimating(true);
    setRotationAngle(prev => prev - 90);

    // After animation completes (300ms), apply all pending rotations
    rotationTimeoutRef.current = setTimeout(() => {
      const rotations = pendingRotationsRef.current;
      // Apply the net rotations (modulo 4 since 4 rotations = 360°)
      const netRotations = ((rotations % 4) + 4) % 4;

      let result = displayTile;
      for (let i = 0; i < netRotations; i++) {
        result = rotateTileClockwise(result);
      }

      setDisplayTile(result);
      setIsAnimating(false); // Disable animation for instant reset
      setRotationAngle(0);
      pendingRotationsRef.current = 0;
      rotationTimeoutRef.current = null;

      // Notify parent of the new tile
      onRotationComplete(result);
    }, 300);
  };

  return (
    <div className="self-start">
      <div className="header2 mb-10">
        Tile in Play:
      </div>
      <svg viewBox={`0 0 ${TILE_SIZE * 1.5} ${TILE_SIZE * 1.5}`} className="svg-tile-in-play">
        <g className={isAnimating ? 'tile-animating' : ''}>
          <Tile
            tile={displayTile}
            x={TILE_SIZE * 0.25}
            y={TILE_SIZE * 0.25}
            size={TILE_SIZE}
            rotation={rotationAngle}
          />
        </g>
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
  );
}
