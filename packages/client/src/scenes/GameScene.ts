import Phaser from 'phaser';

import type { GameState, Position, UnitInstance } from '@mugen/shared';
import type { AbilityTarget } from '@mugen/shared/src/engines/ability/index.js';
import type { AttackTarget } from '@mugen/shared/src/engines/combat/index.js';

import { IntentType, TurnPhase } from '@mugen/shared';

import { useGameStore } from '../store/game-store.js';
import { sendIntent } from '../network/socket-client.js';

import { VisibilityEngine } from '@mugen/shared';



const CELL_SIZE = 32;

const GRID_COLOR = 0xffffff;

const GRID_LINE_COLOR = 0x000000;

const HIGHLIGHT_COLOR = 0x6366f1;

const HOVER_HIGHLIGHT_COLOR = 0xfacc15;

const ABILITY_HIGHLIGHT_COLOR = 0xffffff;

const ATTACK_HIGHLIGHT_COLOR = 0xef4444;

const DEPLOYMENT_HIGHLIGHT_COLOR = 0x22c55e;



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

  private hoverHighlightGraphics: Phaser.GameObjects.Graphics | null = null;

  private abilityHighlightGraphics: Phaser.GameObjects.Graphics | null = null;

  private attackHighlightGraphics: Phaser.GameObjects.Graphics | null = null;

  private deploymentHighlightGraphics: Phaser.GameObjects.Graphics | null = null;

  private sorceryHighlightGraphics: Phaser.GameObjects.Graphics | null = null;

  private sorceryFirstTargetGraphics: Phaser.GameObjects.Graphics | null = null;

  private lastState: GameState | null = null;

  private lastValidMoves: Position[] = [];

  private lastAbilityTargets: AbilityTarget[] = [];

  private lastAttackTargets: AttackTarget[] = [];



  constructor() {

    super({ key: 'GameScene' });

  }



  create() {
    this.cellGraphics = this.add.graphics();

    this.highlightGraphics = this.add.graphics();

    this.hoverHighlightGraphics = this.add.graphics();

    this.abilityHighlightGraphics = this.add.graphics();
    this.abilityHighlightGraphics.setDepth(100);

    this.attackHighlightGraphics = this.add.graphics();
    this.attackHighlightGraphics.setDepth(100);

    this.deploymentHighlightGraphics = this.add.graphics();
    this.deploymentHighlightGraphics.setDepth(100);

    this.sorceryHighlightGraphics = this.add.graphics();
    this.sorceryHighlightGraphics.setDepth(100);

    this.sorceryFirstTargetGraphics = this.add.graphics();
    this.sorceryFirstTargetGraphics.setDepth(101);



    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {

      // Block all board interactions while hand limit modal or standby modal is open
      const storeState = useGameStore.getState();
      if (storeState.handLimitModalOpen || storeState.standbyModalOpen) return;

      // Get accurate world coordinates that account for scaling

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      const gridX = Math.floor(worldPoint.x / CELL_SIZE);

      const gridY = Math.floor(worldPoint.y / CELL_SIZE);

      const pos = { x: gridX, y: gridY };

      

      // Check if there's a unit at this position first

      const store = useGameStore.getState();

      const gameState = store.gameState;

      

      if (gameState) {

        const cell = gameState.board.cells[pos.y]?.[pos.x];

        if (cell && cell.occupantId !== null) {

          // During ability targeting mode, pass all unit clicks to handleCellClick
          // so ability targets (including enemies) can be selected
          if (store.abilityModeActive && store.abilityTargets.length > 0) {
            this.handleCellClick(pos);
            return;
          }

          // During attack targeting mode, pass all unit clicks to handleCellClick
          // so enemy units can be selected as attack targets
          if (store.attackModeActive && store.attackTargets.length > 0) {
            this.handleCellClick(pos);
            return;
          }

          // During sorcery targeting mode, handle unit clicks as sorcery targets
          if (store.sorceryModeActive && store.selectedSorceryCard) {
            const excludedOccupantId = store.selectedSorceryCard.id === 's18' ? store.sorceryFirstTarget : undefined;
            const isValidSorceryTarget = this.isValidSorceryOccupantTarget(
              cell.occupantId,
              store.selectedSorceryCard.id,
              gameState,
              store.playerId,
              excludedOccupantId
            );

            if (isValidSorceryTarget) {
              this.handleSorceryTarget(cell.occupantId);
            }
            return;
          }

          // Find the unit at this position

          for (const player of gameState.players) {

            for (const unit of player.units) {

              const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;

              if (unitInstanceId === cell.occupantId && unit.position && unit.position.x === pos.x && unit.position.y === pos.y) {

                const isMobileUiMode = store.mobileUiMode;

                // Mobile mode: expose tapped unit data for inspection
                if (isMobileUiMode) {
                  store.setHoveredCard(unit.card, unit);
                }

                // Opponent units are view-only (no selection/actions)
                if (unit.ownerId !== store.playerId) {
                  if (isMobileUiMode) {
                    store.selectUnit(null);
                  }
                  return;
                }

                // Handle unit click

                if (store.selectedUnitId === unit.card.id) {

                  store.selectUnit(null);
                  if (isMobileUiMode) {
                    store.clearHoveredCard();
                  }

                } else {

                  store.selectUnit(unit.card.id);

                }

                return; // Stop processing - unit click handled

              }

            }

          }

        }

      }

      

      // If no unit was clicked, handle as regular grid click

      this.handleCellClick(pos);

    });



    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {

      // Use raw pointer coordinates and let Phaser handle scaling internally

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

    const store = useGameStore.getState();

    const state = store.gameState;

    const validMoves = store.validMoves;

    const abilityTargets = store.abilityTargets;

    const attackTargets = store.attackTargets;

    if (state !== this.lastState || validMoves !== this.lastValidMoves || abilityTargets !== this.lastAbilityTargets || attackTargets !== this.lastAttackTargets) {

      this.lastState = state;

      this.lastValidMoves = validMoves;

      this.lastAbilityTargets = abilityTargets;

      this.lastAttackTargets = attackTargets;

      this.updateFromStore();

    }

    // Always redraw ability highlights for pulsing animation
    if (abilityTargets.length > 0) {
      this.drawAbilityHighlights();
    }

    // Always redraw attack highlights for pulsing animation
    if (attackTargets.length > 0) {
      this.drawAttackHighlights();
    }

    this.drawSorceryHighlights();
    this.drawSorceryFirstTarget();

  }



  private updateFromStore() {
    const state = useGameStore.getState().gameState;

    if (!state) {
      return;
    }



    this.drawGrid(state.board.width, state.board.height);

    this.drawUnits(state);

    this.drawHighlights();

    this.drawAbilityHighlights();

    this.drawDeploymentHighlights();

    this.drawAttackHighlights();

    this.drawSorceryHighlights();

    this.drawSorceryFirstTarget();

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

    

    const visibleUnits = VisibilityEngine.getVisibleUnits(state);

    

    visibleUnits.forEach((unit: UnitInstance) => {


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

    // Unit clicks are now handled globally at the grid level

    // This ensures the entire cell area is clickable, not just the sprite area



    // Hover is handled at grid level via handleCellHover to ensure

    // consistent full-cell coverage for all players/colors.

    // Unit clicks are now handled in the global pointerdown handler to ensure

    // the entire cell area is clickable, not just the sprite area.



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

  private drawAbilityHighlights() {

    if (!this.abilityHighlightGraphics) return;

    this.abilityHighlightGraphics.clear();

    const abilityTargets = useGameStore.getState().abilityTargets;

    if (abilityTargets.length === 0) return;

    // Blinking white outline: on/off flash using sine wave
    const wave = Math.sin(this.time.now / 250); // oscillates -1..1
    const visible = wave > -0.3; // visible ~75% of the time for a flash effect
    if (!visible) return;

    const strokeAlpha = 0.6 + (wave * 0.5 + 0.5) * 0.4; // 0.6..1.0

    abilityTargets.forEach((target) => {

      const px = target.position.x * CELL_SIZE;
      const py = target.position.y * CELL_SIZE;

      // Draw thick white outline around the unit cell (no fill)
      this.abilityHighlightGraphics!.lineStyle(3, ABILITY_HIGHLIGHT_COLOR, strokeAlpha);
      this.abilityHighlightGraphics!.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);

    });

  }



  private drawAttackHighlights() {

    if (!this.attackHighlightGraphics) return;

    this.attackHighlightGraphics.clear();

    const attackTargets = useGameStore.getState().attackTargets;

    if (attackTargets.length === 0) return;

    // Fast dramatic pulse: bright red fill + thick outline
    const wave = Math.sin(this.time.now / 150); // faster oscillation
    const pulse = wave * 0.5 + 0.5; // 0..1
    const fillAlpha = 0.15 + pulse * 0.3;   // 0.15..0.45
    const strokeAlpha = 0.7 + pulse * 0.3;  // 0.7..1.0

    attackTargets.forEach((target) => {

      const px = target.position.x * CELL_SIZE;
      const py = target.position.y * CELL_SIZE;

      // Red tinted fill so it's obvious
      this.attackHighlightGraphics!.fillStyle(ATTACK_HIGHLIGHT_COLOR, fillAlpha);
      this.attackHighlightGraphics!.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      // Thick red outline
      this.attackHighlightGraphics!.lineStyle(4, ATTACK_HIGHLIGHT_COLOR, strokeAlpha);
      this.attackHighlightGraphics!.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

    });

  }

  private drawDeploymentHighlights() {
    if (!this.deploymentHighlightGraphics) return;

    this.deploymentHighlightGraphics.clear();

    const store = useGameStore.getState();
    const { deploymentModeActive, gameState } = store;

    if (!deploymentModeActive || !gameState) return;

    // Highlight all empty cells where units can be deployed
    for (let y = 0; y < gameState.board.height; y++) {
      for (let x = 0; x < gameState.board.width; x++) {
        const cell = gameState.board.cells[y]?.[x];
        if (cell && cell.occupantId === null) {
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;

          // Green tinted fill for deployment zones
          this.deploymentHighlightGraphics.fillStyle(DEPLOYMENT_HIGHLIGHT_COLOR, 0.3);
          this.deploymentHighlightGraphics.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

          // Green outline
          this.deploymentHighlightGraphics.lineStyle(2, DEPLOYMENT_HIGHLIGHT_COLOR, 0.8);
          this.deploymentHighlightGraphics.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
    }
  }

  private drawSorceryHighlights() {
    if (!this.sorceryHighlightGraphics) return;

    this.sorceryHighlightGraphics.clear();

    const store = useGameStore.getState();
    const { sorceryModeActive, selectedSorceryCard, gameState, playerId, sorceryFirstTarget } = store;

    if (!sorceryModeActive || !selectedSorceryCard || !gameState || !playerId) return;

    // Calculate valid targets for the selected sorcery card
    const excludedOccupantId = selectedSorceryCard.id === 's18' ? sorceryFirstTarget : undefined;
    const validTargets = this.getValidSorceryTargets(selectedSorceryCard.id, gameState, playerId, excludedOccupantId);

    if (validTargets.length === 0) return;

    // Blinking white outline for sorcery targets (similar to ability highlights)
    const wave = Math.sin(this.time.now / 250);
    const visible = wave > -0.3;
    if (!visible) return;

    const strokeAlpha = 0.6 + (wave * 0.5 + 0.5) * 0.4;

    validTargets.forEach((pos) => {
      const px = pos.x * CELL_SIZE;
      const py = pos.y * CELL_SIZE;

      // Draw thick white outline around the unit cell (no fill)
      this.sorceryHighlightGraphics!.lineStyle(3, ABILITY_HIGHLIGHT_COLOR, strokeAlpha);
      this.sorceryHighlightGraphics!.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    });
  }

  private getValidSorceryTargets(cardId: string, gameState: GameState, playerId: string, excludedOccupantId?: string | null): Position[] {
    const validTargets: Position[] = [];
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return validTargets;

    // Sorcery cards that don't require a target
    const nonTargetCards = new Set(['s03', 's09', 's10', 's16', 's17', 's19', 's21']);
    if (nonTargetCards.has(cardId)) return validTargets;

    // Determine valid targets based on card type
    for (const player of gameState.players) {
      for (const unit of player.units) {
        if (!unit.position) continue;

        const occupantId = `${player.id}-${unit.card.id}`;
        if (excludedOccupantId && occupantId === excludedOccupantId) {
          continue;
        }

        const isFriendly = player.id === playerId;
        const isEnemy = !isFriendly;

        // Damage spells that target enemies
        if (['s01', 's04', 's08', 's12', 's22'].includes(cardId)) {
          if (isEnemy) {
            validTargets.push(unit.position);
          }
        }
        // Heal/buff spells that target friendlies
        else if (['s02', 's05', 's06', 's11', 's13', 's14', 's20'].includes(cardId)) {
          if (isFriendly) {
            validTargets.push(unit.position);
          }
        }
        // Debuff spells that target enemies
        else if (['s07', 's15'].includes(cardId)) {
          if (isEnemy) {
            validTargets.push(unit.position);
          }
        }
        // Dimensional Swap - can target any unit (friendly or enemy)
        else if (['s18'].includes(cardId)) {
          validTargets.push(unit.position);
        }
      }
    }

    return validTargets;
  }

  private getSorceryTargetByOccupantId(occupantId: string, gameState: GameState): { ownerId: string; unitId: string; unit: UnitInstance } | null {
    for (const player of gameState.players) {
      for (const unit of player.units) {
        if (`${player.id}-${unit.card.id}` === occupantId) {
          return { ownerId: player.id, unitId: unit.card.id, unit };
        }
      }
    }

    return null;
  }

  private getSorceryTargetPositionByOccupantId(occupantId: string, gameState: GameState): Position | null {
    return this.getSorceryTargetByOccupantId(occupantId, gameState)?.unit.position ?? null;
  }

  private isValidSorceryOccupantTarget(
    occupantId: string,
    cardId: string,
    gameState: GameState,
    playerId: string | null,
    excludedOccupantId?: string | null
  ): boolean {
    if (!playerId) return false;

    const targetPosition = this.getSorceryTargetPositionByOccupantId(occupantId, gameState);
    if (!targetPosition) return false;

    const validTargets = this.getValidSorceryTargets(cardId, gameState, playerId, excludedOccupantId);
    return validTargets.some(pos => pos.x === targetPosition.x && pos.y === targetPosition.y);
  }

  private drawSorceryFirstTarget() {
    if (!this.sorceryFirstTargetGraphics) return;

    this.sorceryFirstTargetGraphics.clear();

    const store = useGameStore.getState();
    const { sorceryFirstTarget, gameState } = store;

    if (!sorceryFirstTarget || !gameState) return;

    const target = this.getSorceryTargetByOccupantId(sorceryFirstTarget, gameState);
    if (!target || !target.unit.position) return;

    const pos = target.unit.position;
    const px = pos.x * CELL_SIZE;
    const py = pos.y * CELL_SIZE;

    // Draw a distinctive highlight for the first selected unit (gold/yellow)
    this.sorceryFirstTargetGraphics.lineStyle(4, 0xf59e0b, 1);
    this.sorceryFirstTargetGraphics.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);

    // Add a fill to make it more visible
    this.sorceryFirstTargetGraphics.fillStyle(0xf59e0b, 0.3);
    this.sorceryFirstTargetGraphics.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }



  private handleCellClick(pos: Position) {

    const store = useGameStore.getState();

    const { validMoves, selectedUnitId, moveModeActive, abilityModeActive, abilityTargets, attackModeActive, attackTargets, gameState, deploymentModeActive, selectedBenchUnit } = store;

    // Handle deployment mode click
    if (deploymentModeActive && selectedBenchUnit && gameState) {
      // Check if the clicked cell is empty and within bounds
      if (pos.x >= 0 && pos.y >= 0 && pos.x < gameState.board.width && pos.y < gameState.board.height) {
        const cell = gameState.board.cells[pos.y]?.[pos.x];
        if (cell && cell.occupantId === null) {
          // Deploy the bench unit
          import('../network/socket-client.js').then(({ sendIntent }) => {
            sendIntent({
              type: IntentType.DEPLOY_RESERVE,
              unitId: selectedBenchUnit.id,
              position: pos,
            });
          });
          
          // Exit deployment mode after deploying
          store.exitDeploymentMode();
          return;
        }
      }
      
      // If clicked on invalid position, exit deployment mode
      store.exitDeploymentMode();
      return;
    }

    // Handle ability target click

    if (abilityModeActive && selectedUnitId && abilityTargets.length > 0) {

      const target = abilityTargets.find((t) => t.position.x === pos.x && t.position.y === pos.y);

      if (target) {

        import('../network/socket-client.js').then(({ sendIntent }) => {

          sendIntent({

            type: IntentType.USE_ABILITY,

            unitId: selectedUnitId,

            targetId: target.unitId,

            targetOwnerId: target.ownerId,

          });

        });



        // Clear ability mode after using ability

        store.selectUnit(null);

        store.clearAbilityTargets();

        store.exitAbilityMode();

        store.showMenuDuringMove();

        // Also exit sorcery mode if active
        if (store.sorceryModeActive) {
          store.exitSorceryMode();
          store.setError(null);
        }

        return;

      }

    }



    // Handle attack target click

    if (attackModeActive && selectedUnitId && attackTargets.length > 0) {

      const target = attackTargets.find((t) => t.position.x === pos.x && t.position.y === pos.y);

      if (target) {

        import('../network/socket-client.js').then(({ sendIntent }) => {

          sendIntent({

            type: IntentType.ATTACK,

            attackerId: selectedUnitId,

            defenderId: target.unitId,

            defenderOwnerId: target.ownerId,

          });

        });

        // Clear attack mode after attacking
        store.selectUnit(null);

        store.clearAttackTargets();

        store.exitAttackMode();

        store.showMenuDuringMove();

        return;

      }

    }



    // Step 5: Execute movement when clicking a highlighted valid cell

    const isValidMove = validMoves.some((m) => m.x === pos.x && m.y === pos.y);

    if (isValidMove && selectedUnitId && moveModeActive) {

      import('../network/socket-client.js').then(({ sendIntent }) => {

        sendIntent({

          type: IntentType.MOVE_UNIT,

          unitId: selectedUnitId,

          target: pos,

        });

      });



      // Clear selection, highlights, and move mode after executing move

      store.selectUnit(null);

      // Also exit sorcery mode if active
      if (store.sorceryModeActive) {
        store.exitSorceryMode();
        store.setError(null);
      }

      store.clearValidMoves();

      store.exitMoveMode();

      store.showMenuDuringMove();

      return;

    }



    // Check if clicked cell has a unit (unit clicks handled by sprite pointerdown)

    if (gameState) {

      const cell = gameState.board.cells[pos.y]?.[pos.x];

      if (cell && cell.occupantId !== null) {

        return;

      }

    }



    // Clicking empty space: clear selection, close modal, remove highlights

    if (selectedUnitId) {

      store.selectUnit(null);

      store.clearValidMoves();

      store.exitMoveMode();

      store.exitAbilityMode();

      store.clearAbilityTargets();

    }

    if (store.mobileUiMode) {
      store.clearHoveredCard();
    }

  }



  private handleSorceryTarget(occupantId: string | null) {
    if (!occupantId) return;

    const store = useGameStore.getState();
    const { selectedSorceryCard, gameState, playerId, sorceryModeActive, sorceryFirstTarget } = store;

    // Validate sorcery mode is active
    if (!sorceryModeActive) {
      store.setError('Sorcery mode is not active');
      return;
    }

    if (!selectedSorceryCard) {
      store.setError('No sorcery card selected');
      store.exitSorceryMode();
      return;
    }

    if (!gameState || !playerId) {
      store.setError('Game state or player ID not available');
      store.exitSorceryMode();
      return;
    }

    const currentPlayerId = gameState.players[gameState.currentPlayerIndex]?.id;
    if (gameState.turnPhase !== TurnPhase.ABILITY || currentPlayerId !== playerId) {
      store.setError('Sorcery can only be used during your Ability Phase');
      store.exitSorceryMode();
      return;
    }

    const target = this.getSorceryTargetByOccupantId(occupantId, gameState);
    if (!target || !target.unit.position) {
      store.setError('Target unit not found or not on board');
      store.exitSorceryMode();
      return;
    }

    const { ownerId: targetOwnerId, unitId: targetUnitId, unit: targetUnit } = target;

    const excludedOccupantId = selectedSorceryCard.id === 's18' ? sorceryFirstTarget : undefined;

    // Validate that the target is a valid sorcery target for this card
    const validTargets = this.getValidSorceryTargets(selectedSorceryCard.id, gameState, playerId, excludedOccupantId);

    const isValidTarget = validTargets.some(
      pos => pos.x === targetUnit.position!.x && pos.y === targetUnit.position!.y
    );

    if (!isValidTarget) {
      store.setError('Invalid target for this sorcery card');
      return;
    }

    // Handle Dimensional Swap (s18) - requires two targets
    if (selectedSorceryCard.id === 's18') {
      if (!sorceryFirstTarget) {
        // First target selected - store it and wait for second
        store.setSorceryFirstTarget(occupantId);
        store.setError(`First unit selected. Select second unit to swap.`);
        return;
      } else {
        // Second target selected - execute swap
        const firstTarget = this.getSorceryTargetByOccupantId(sorceryFirstTarget, gameState);
        if (!firstTarget) {
          store.setError('Invalid first target');
          store.exitSorceryMode();
          return;
        }

        const { ownerId: firstOwnerId, unitId: firstUnitId } = firstTarget;

        // Prevent selecting the same unit twice
        if (sorceryFirstTarget === occupantId) {
          store.setError('Cannot swap a unit with itself');
          return;
        }

        // Send the PLAY_SORCERY intent with both targets
        sendIntent({
          type: IntentType.PLAY_SORCERY,
          cardId: selectedSorceryCard.id,
          targetUnitId: firstUnitId,
          targetOwnerId: firstOwnerId,
          targetUnitId2: targetUnitId,
          targetOwnerId2: targetOwnerId,
        });

        // Exit sorcery mode after sending
        store.exitSorceryMode();
        store.setError(null);
        return;
      }
    }

    // Send the PLAY_SORCERY intent with the target (for single-target sorceries)
    sendIntent({
      type: IntentType.PLAY_SORCERY,
      cardId: selectedSorceryCard.id,
      targetUnitId,
      targetOwnerId,
    });

    // Exit sorcery mode after sending
    store.exitSorceryMode();
    store.setError(null);
  }



  private lastHoveredPos: Position | null = null;



  private handleCellHover(pos: Position) {

    const store = useGameStore.getState();

    const state = store.gameState;



    // Draw yellow hover highlight on current cell

    this.drawHoverHighlight(pos, state);



    // Optimization: skip re-processing if the grid cell hasn't changed

    const isSameCell =

      this.lastHoveredPos &&

      this.lastHoveredPos.x === pos.x &&

      this.lastHoveredPos.y === pos.y;



    if (!isSameCell) {

      this.lastHoveredPos = pos;

    }



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

          store.setHoveredCard(unit.card, unit);

          return;

        }

      }

    }



    store.clearHoveredCard();

  }



  private drawHoverHighlight(pos: Position, state: GameState | null) {

    if (!this.hoverHighlightGraphics) return;

    this.hoverHighlightGraphics.clear();



    if (!state) return;



    // Only highlight if cursor is within the grid bounds

    if (pos.x < 0 || pos.y < 0 || pos.x >= state.board.width || pos.y >= state.board.height) {

      return;

    }



    const px = pos.x * CELL_SIZE;

    const py = pos.y * CELL_SIZE;



    this.hoverHighlightGraphics.lineStyle(2, HOVER_HIGHLIGHT_COLOR, 1);

    this.hoverHighlightGraphics.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);

  }

}


