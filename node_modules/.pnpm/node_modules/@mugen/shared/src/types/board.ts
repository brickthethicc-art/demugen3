export interface Position {
  x: number;
  y: number;
}

export interface GridCell {
  position: Position;
  occupantId: string | null;
}

export interface BoardState {
  width: number;
  height: number;
  cells: GridCell[][];
}

export const DEFAULT_BOARD_WIDTH = 23;
export const DEFAULT_BOARD_HEIGHT = 23;
