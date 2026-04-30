import type { BoardState, GridCell, Position } from '../../types/index.js';
import { DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT } from '../../types/index.js';
import type { Result } from '../../types/actions.js';
import { chebyshevDistance } from '../../utils/position.js';
import { createWallSet, wallKey } from '../../utils/walls.js';

export function createBoardState(
  width: number = DEFAULT_BOARD_WIDTH,
  height: number = DEFAULT_BOARD_HEIGHT
): BoardState {
  const cells: GridCell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: GridCell[] = [];
    for (let x = 0; x < width; x++) {
      row.push({ position: { x, y }, occupantId: null });
    }
    cells.push(row);
  }
  return { width, height, cells };
}

function isInBounds(board: BoardState, pos: Position): boolean {
  return pos.x >= 0 && pos.x < board.width && pos.y >= 0 && pos.y < board.height;
}

function cloneCells(cells: GridCell[][]): GridCell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell, position: { ...cell.position } })));
}

export function placeUnit(board: BoardState, unitId: string, pos: Position): Result<BoardState> {
  if (!isInBounds(board, pos)) {
    return { ok: false, error: `Position (${pos.x},${pos.y}) is out of bounds` };
  }

  const cell = board.cells[pos.y]?.[pos.x];
  if (!cell) {
    return { ok: false, error: `Invalid cell at (${pos.x},${pos.y})` };
  }

  if (cell.occupantId !== null) {
    return { ok: false, error: `Cell (${pos.x},${pos.y}) is already occupied by ${cell.occupantId}` };
  }

  const newCells = cloneCells(board.cells);
  newCells[pos.y]![pos.x] = { position: { ...pos }, occupantId: unitId };
  return { ok: true, value: { ...board, cells: newCells } };
}

export function removeUnit(board: BoardState, pos: Position): Result<BoardState> {
  if (!isInBounds(board, pos)) {
    return { ok: false, error: `Position (${pos.x},${pos.y}) is out of bounds` };
  }

  const cell = board.cells[pos.y]?.[pos.x];
  if (!cell || cell.occupantId === null) {
    return { ok: false, error: `No unit at position (${pos.x},${pos.y})` };
  }

  const newCells = cloneCells(board.cells);
  newCells[pos.y]![pos.x] = { position: { ...pos }, occupantId: null };
  return { ok: true, value: { ...board, cells: newCells } };
}

export function moveUnit(
  board: BoardState,
  from: Position,
  to: Position,
  movementRange: number,
  walls: Position[] = []
): Result<BoardState> {
  if (!isInBounds(board, to)) {
    return { ok: false, error: `Target (${to.x},${to.y}) is out of bounds` };
  }

  const fromCell = board.cells[from.y]?.[from.x];
  if (!fromCell || fromCell.occupantId === null) {
    return { ok: false, error: `No unit at (${from.x},${from.y})` };
  }

  const toCell = board.cells[to.y]?.[to.x];
  if (!toCell) {
    return { ok: false, error: `Invalid target cell` };
  }
  if (toCell.occupantId !== null) {
    return { ok: false, error: `Target (${to.x},${to.y}) is already occupied` };
  }

  const wallSet = createWallSet(walls);
  if (wallSet.has(wallKey(to))) {
    return { ok: false, error: `Target (${to.x},${to.y}) is blocked by a wall` };
  }

  const validMoves = getValidMoves(board, from, movementRange, walls);
  const canReachTarget = validMoves.some((move) => move.x === to.x && move.y === to.y);
  if (!canReachTarget) {
    const dist = chebyshevDistance(from, to);
    return {
      ok: false,
      error: `Target is not reachable: distance ${dist}, movement ${movementRange}`,
    };
  }

  const newCells = cloneCells(board.cells);
  const unitId = fromCell.occupantId;
  newCells[from.y]![from.x] = { position: { ...from }, occupantId: null };
  newCells[to.y]![to.x] = { position: { ...to }, occupantId: unitId };
  return { ok: true, value: { ...board, cells: newCells } };
}

export function getValidMoves(
  board: BoardState,
  pos: Position,
  movementRange: number,
  walls: Position[] = []
): Position[] {
  if (movementRange <= 0) return [];

  const wallSet = createWallSet(walls);
  const startKey = wallKey(pos);
  const queue: Array<{ pos: Position; steps: number }> = [{ pos, steps: 0 }];
  const visited = new Set<string>([startKey]);
  const moves: Position[] = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (current.steps >= movementRange) {
      continue;
    }

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const next: Position = { x: current.pos.x + dx, y: current.pos.y + dy };
        if (!isInBounds(board, next)) continue;

        const nextKey = wallKey(next);
        if (visited.has(nextKey)) continue;
        if (wallSet.has(nextKey)) continue;

        const cell = board.cells[next.y]?.[next.x];
        if (!cell) continue;

        visited.add(nextKey);

        if (cell.occupantId === null) {
          moves.push(next);
          queue.push({ pos: next, steps: current.steps + 1 });
        }
      }
    }
  }

  return moves;
}

export function getUnitAt(board: BoardState, pos: Position): string | null {
  if (!isInBounds(board, pos)) return null;
  const cell = board.cells[pos.y]?.[pos.x];
  return cell?.occupantId ?? null;
}

export function getUnitsForPlayer(
  board: BoardState,
  playerIdPrefix: string
): { unitId: string; position: Position }[] {
  const units: { unitId: string; position: Position }[] = [];
  for (let y = 0; y < board.height; y++) {
    const row = board.cells[y];
    if (!row) continue;
    for (let x = 0; x < board.width; x++) {
      const cell = row[x];
      if (cell && cell.occupantId !== null && cell.occupantId.startsWith(playerIdPrefix)) {
        units.push({ unitId: cell.occupantId, position: { x, y } });
      }
    }
  }
  return units;
}
