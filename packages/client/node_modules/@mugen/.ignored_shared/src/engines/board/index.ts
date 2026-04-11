import type { BoardState, GridCell, Position } from '../../types/index.js';
import { DEFAULT_BOARD_WIDTH, DEFAULT_BOARD_HEIGHT } from '../../types/index.js';
import type { Result } from '../../types/actions.js';

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

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function moveUnit(
  board: BoardState,
  from: Position,
  to: Position,
  movementRange: number
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

  const dist = manhattanDistance(from, to);
  if (dist > movementRange) {
    return {
      ok: false,
      error: `Target is out of range: distance ${dist}, movement ${movementRange}`,
    };
  }

  const newCells = cloneCells(board.cells);
  const unitId = fromCell.occupantId;
  newCells[from.y]![from.x] = { position: { ...from }, occupantId: null };
  newCells[to.y]![to.x] = { position: { ...to }, occupantId: unitId };
  return { ok: true, value: { ...board, cells: newCells } };
}

export function getValidMoves(board: BoardState, pos: Position, movementRange: number): Position[] {
  const moves: Position[] = [];
  for (let dy = -movementRange; dy <= movementRange; dy++) {
    for (let dx = -movementRange; dx <= movementRange; dx++) {
      if (dx === 0 && dy === 0) continue;
      const target: Position = { x: pos.x + dx, y: pos.y + dy };
      if (!isInBounds(board, target)) continue;
      if (manhattanDistance(pos, target) > movementRange) continue;

      const cell = board.cells[target.y]?.[target.x];
      if (cell && cell.occupantId === null) {
        moves.push(target);
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
