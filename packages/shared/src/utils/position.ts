import type { Position } from '../types/index.js';

/**
 * Calculate Chebyshev distance between two positions.
 * This is the distance metric used for grid-based movement and range calculations.
 * Chebyshev distance is the maximum of the absolute differences of coordinates.
 */
export function chebyshevDistance(a: Position, b: Position): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
