import Phaser from 'phaser';
import type { GameState, Position, UnitInstance } from '@mugen/shared';
import { IntentType } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';
import { VisibilityEngine } from '@mugen/shared';

const CELL_SIZE = 32;
const GRID_COLOR = 0xffffff;
const GRID_LINE_COLOR = 0x000000;
const HIGHLIGHT_COLOR = 0x6366f1;

// Map player colors to Phaser color numbers
const COLOR_MAP: Record<string, number> = {
  red: 0xef4444,
  blue: 0x6366f1,
  yellow: 0xf59e0b,
  green: 0x22c55e,
};

function getPlayerColor(color?: string): number {
  return color ? COLOR_MAP[color] ?? 0x6366f1 : 0x6366f1;
}

export class GameScene extends Phaser.Scene {
  private cellGraphics: Phaser.GameObjects.Graphics | null = null;
  private unitSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private highlightGraphics: Phaser.GameObjects.Graphics | null = null;
  private lastState: GameState | null = null;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.cellGraphics = this.add.graphics();
    this.highlightGraphics = this.add.graphics();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const gridX = Math.floor(pointer.x / CELL_SIZE);
      const gridY = Math.floor(pointer.y / CELL_SIZE);
      this.handleCellClick({ x: gridX, y: gridY });
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const gridX = Math.floor(pointer.x / CELL_SIZE);
      const gridY = Math.floor(pointer.y / CELL_SIZE);
      this.handleCellHover({ x: gridX, y: gridY });
    });

    this.events.on('pointerout', () => {
      useGameStore.getState().clearHoveredCard();
    });

    this.updateFromStore();
  }

  update() {
    const state = useGameStore.getState().gameState;
    if (state !== this.lastState) {
      this.lastState = state;
      this.updateFromStore();
    }
  }

  private updateFromStore() {
    const state = useGameStore.getState().gameState;
    if (!state) return;

    this.drawGrid(state.board.width, state.board.height);
    this.drawUnits(state);
    this.drawHighlights();
  }

  private drawGrid(width: number, height: number) {
    if (!this.cellGraphics) return;
    this.cellGraphics.clear();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        this.cellGraphics.fillStyle(GRID_COLOR, 0.9);
        this.cellGraphics.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        this.cellGraphics.lineStyle(1, GRID_LINE_COLOR, 0.8);
        this.cellGraphics.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  private drawUnits(state: GameState) {
    const activeUnitIds = new Set<string>();
    
    // CRITICAL FIX: Use getVisibleUnits() to get ALL active units from ALL players
    const visibleUnits = VisibilityEngine.getVisibleUnits(state);
    
    // Debug logging to verify visibility system
    console.log('VISIBLE UNITS:', visibleUnits.map(u => ({
      id: u.card.id,
      owner: u.ownerId,
      color: u.color,
      position: { x: u.position!.x, y: u.position!.y }
    })));

    visibleUnits.forEach((unit: UnitInstance) => {
      // Use unique instance ID to prevent sprite collision between players
      const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;
      activeUnitIds.add(unitInstanceId);

      // Use actual unit positions (no perspective transformation needed)
      let displayPosition = unit.position!;

      const px = displayPosition.x * CELL_SIZE + CELL_SIZE / 2;
      const py = displayPosition.y * CELL_SIZE + CELL_SIZE / 2;

      // Use unit's assigned color instead of hardcoded array
      const unitColor = getPlayerColor(unit.color);
      
      let container = this.unitSprites.get(unitInstanceId);
      if (!container) {
        container = this.createUnitSprite(unit, unitColor);
        this.unitSprites.set(unitInstanceId, container);
      }

      container.setPosition(px, py);
      this.updateUnitSprite(container, unit, unitColor);
    });

    // Remove dead units
    for (const [id, container] of this.unitSprites.entries()) {
      if (!activeUnitIds.has(id)) {
        container.destroy();
        this.unitSprites.delete(id);
      }
    }
  }

  private createUnitSprite(unit: UnitInstance, color: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, 0);

    // Use actual unit color instead of hardcoded red
    const square = this.add.rectangle(0, 0, CELL_SIZE - 2, CELL_SIZE - 2, color, 0.9);
    square.setStrokeStyle(1, 0xffffff, 0.8);

    const initial = this.add.text(0, -1, unit.card.name.charAt(0).toUpperCase(), {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hpBar = this.add.graphics();
    container.setData('hpBar', hpBar);

    container.add([square, initial, hpBar]);
    container.setSize(CELL_SIZE, CELL_SIZE);
    container.setInteractive();

    // Hover handlers for red square
    container.on('pointerover', () => {
      useGameStore.getState().setHoveredCard(unit.card);
    });

    container.on('pointerout', () => {
      useGameStore.getState().clearHoveredCard();
    });

    container.on('pointerdown', () => {
      const store = useGameStore.getState();
      if (store.selectedUnitId === unit.card.id) {
        store.selectUnit(null);
      } else {
        store.selectUnit(unit.card.id);
      }
    });

    return container;
  }

  private updateUnitSprite(container: Phaser.GameObjects.Container, unit: UnitInstance, _color: number) {
    const hpBar = container.getData('hpBar') as Phaser.GameObjects.Graphics;
    if (!hpBar) return;

    hpBar.clear();
    const hpPct = unit.currentHp / unit.card.maxHp;
    const barWidth = 16;
    const barHeight = 2;
    const barX = -barWidth / 2;
    const barY = 8;

    hpBar.fillStyle(0x333333);
    hpBar.fillRect(barX, barY, barWidth, barHeight);

    const hpColor = hpPct > 0.5 ? 0x22c55e : hpPct > 0.25 ? 0xf59e0b : 0xef4444;
    hpBar.fillStyle(hpColor);
    hpBar.fillRect(barX, barY, barWidth * hpPct, barHeight);
  }

  private drawHighlights() {
    if (!this.highlightGraphics) return;
    this.highlightGraphics.clear();

    const validMoves = useGameStore.getState().validMoves;
    validMoves.forEach((pos) => {
      const px = pos.x * CELL_SIZE;
      const py = pos.y * CELL_SIZE;

      this.highlightGraphics!.fillStyle(HIGHLIGHT_COLOR, 0.25);
      this.highlightGraphics!.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      this.highlightGraphics!.lineStyle(2, HIGHLIGHT_COLOR, 0.7);
      this.highlightGraphics!.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    });
  }

  private handleCellClick(pos: Position) {
    const store = useGameStore.getState();
    const validMoves = store.validMoves;

    const isValidMove = validMoves.some((m) => m.x === pos.x && m.y === pos.y);
    if (isValidMove && store.selectedUnitId) {
      // Execute the move via socket client
      import('../network/socket-client.js').then(({ sendIntent }) => {
        sendIntent({
          type: IntentType.MOVE_UNIT,
          unitId: store.selectedUnitId!,
          target: pos,
        });
      });
      
      // Clear selection after move
      store.selectUnit(null);
      store.clearValidMoves();
    }
  }

  private lastHoveredPos: Position | null = null;

  private handleCellHover(pos: Position) {
    if (
      this.lastHoveredPos &&
      this.lastHoveredPos.x === pos.x &&
      this.lastHoveredPos.y === pos.y
    ) {
      return;
    }
    this.lastHoveredPos = pos;

    const store = useGameStore.getState();
    const state = store.gameState;
    if (!state) {
      store.clearHoveredCard();
      return;
    }

    // Find if there's a unit at this position
    const cell = state.board.cells[pos.y]?.[pos.x];
    if (!cell || !cell.occupantId) {
      store.clearHoveredCard();
      return;
    }

    // Find the unit instance by matching the full occupant ID (playerId-cardId)
    for (const player of state.players) {
      for (const unit of player.units) {
        const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;
        if (unitInstanceId === cell.occupantId) {
          store.setHoveredCard(unit.card);
          return;
        }
      }
    }

    store.clearHoveredCard();
  }
}
