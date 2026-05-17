import type { Position } from '../types/index.js';

export function wallKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

export function createWallSet(walls: Position[]): Set<string> {
  return new Set(walls.map(wallKey));
}

export function isWallCell(pos: Position, walls: Position[] | Set<string>): boolean {
  if (walls instanceof Set) {
    return walls.has(wallKey(pos));
  }

  for (const wall of walls) {
    if (wall.x === pos.x && wall.y === pos.y) {
      return true;
    }
  }

  return false;
}

function pushWallIfInBounds(target: Position[], pos: Position, width: number, height: number): void {
  if (pos.x < 0 || pos.y < 0 || pos.x >= width || pos.y >= height) {
    return;
  }
  target.push(pos);
}

export function generateDefaultWalls(width: number, height: number): Position[] {
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const radius = Math.max(4, Math.floor(Math.min(width, height) / 4));
  const armLength = 3;

  const topLeftCorner = { x: centerX - radius, y: centerY - radius };
  const topRightCorner = { x: centerX + radius, y: centerY - radius };
  const bottomLeftCorner = { x: centerX - radius, y: centerY + radius };
  const bottomRightCorner = { x: centerX + radius, y: centerY + radius };

  const walls: Position[] = [];

  for (let i = 0; i < armLength; i++) {
    // Left-side L walls: rotated 90 degrees counterclockwise from the default orientation.
    // Top-left corner originally extended right (+x) and up (-y); rotated CCW it now extends up (-y) and left (-x).
    pushWallIfInBounds(walls, { x: topLeftCorner.x, y: topLeftCorner.y - i }, width, height);
    pushWallIfInBounds(walls, { x: topLeftCorner.x - i, y: topLeftCorner.y }, width, height);

    pushWallIfInBounds(walls, { x: topRightCorner.x, y: topRightCorner.y + i }, width, height);
    pushWallIfInBounds(walls, { x: topRightCorner.x + i, y: topRightCorner.y }, width, height);

    // Bottom-left corner originally extended right (+x) and down (+y); rotated CCW it now extends up (-y) and right (+x).
    pushWallIfInBounds(walls, { x: bottomLeftCorner.x, y: bottomLeftCorner.y - i }, width, height);
    pushWallIfInBounds(walls, { x: bottomLeftCorner.x + i, y: bottomLeftCorner.y }, width, height);

    pushWallIfInBounds(walls, { x: bottomRightCorner.x, y: bottomRightCorner.y - i }, width, height);
    pushWallIfInBounds(walls, { x: bottomRightCorner.x + i, y: bottomRightCorner.y }, width, height);
  }

  const deduped = new Map<string, Position>();
  for (const wall of walls) {
    deduped.set(wallKey(wall), wall);
  }

  return Array.from(deduped.values());
}
