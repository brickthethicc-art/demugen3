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

const DAMAGE_POTION_COLOR = 0xef4444;

const HEAL_POTION_COLOR = 0x22c55e;

const BLOOD_MAIN_COLOR = 0x8b0000;

const BLOOD_DROPLET_COLOR = 0xa52a2a;

const BLOOD_STAIN_COLOR = 0x660000;

const ATTACKER_SURVIVE_FLASH_DURATION_MS = 420;

const ATTACKER_DIES_FLASH_DURATION_MS = 840;

const DEFENDER_FLASH_DURATION_MS = 840;

const DEATH_FLASH_LONG_DURATION_MS = 840;

const DEATH_EXPLOSION_DELAY_MS = 140;

const DEATH_UNIT_FADE_DURATION_MS = 440;

const DEATH_PARTICLE_CLEANUP_MS = 1200;

const BLOOD_SPLATTER_CLEANUP_MS = 1800;

const BLOOD_DROPLET_CLEANUP_MS = 1400;

const DEATH_EXPLOSION_CORE_DURATION_MS = 360;

const DEATH_SHOCKWAVE_DURATION_MS = 760;

const SOUL_ORB_HOVER_DURATION_MS = 500;

const SOUL_ORB_FLIGHT_DURATION_MS = 1200;

const DISCARD_PILE_FLASH_DURATION_MS = 680;

const ATTACK_SLASH_DELAY_MS = 140;

const ATTACK_DAMAGE_NUMBER_DELAY_MS = 260;



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

type UnitAnimationState = 'idle' | 'moving' | 'spawning' | 'dying';

type UnitTweenBundle = {
  move?: Phaser.Tweens.Tween;
  scale?: Phaser.Tweens.Tween;
  spawn?: Phaser.Tweens.Tween;
  death?: Phaser.Tweens.Tween;
};

type ViewportPoint = {
  x: number;
  y: number;
};

type PendingAttackFeedback = {
  attackerInstanceId: string;
  defenderInstanceId: string;
  attackerPos: Position;
  defenderPos: Position;
};

type PendingAbilityDamageFeedback = {
  targetInstanceId: string;
  targetPos: Position;
  attackerPos?: Position;
  damage: number;
  targetDied: boolean;
};

type PendingAbilityDeathFeedback = {
  damage: number;
  targetPos: Position;
  attackerPos?: Position;
};

type HealingEffectEntry = {
  text: Phaser.GameObjects.Text;
  tween: Phaser.Tweens.Tween;
};



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

  private previousBoardUnits: Map<string, UnitInstance> = new Map();

  private initialUnitsRendered = false;

  private unitTweens: Map<string, UnitTweenBundle> = new Map();

  private pendingAttackFeedback: PendingAttackFeedback | null = null;

  private pendingAbilityDamageFeedback: PendingAbilityDamageFeedback[] | null = null;

  private pendingAbilityDeathFeedback: Map<string, PendingAbilityDeathFeedback> = new Map();

  private pendingHealingSplashSources: Map<string, Position> = new Map();

  private activeHealingEffects: Map<string, Set<HealingEffectEntry>> = new Map();

  private activeOverlayElements: Set<HTMLElement> = new Set();

  private readonly particleTextureKey = 'unit-effect-particle';



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

    this.ensureParticleTexture();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupOverlayElements();
    });



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

      // Keep the last hovered card visible until a new hover occurs.

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

    const activeVisibleUnitIds = new Set<string>();
    const visibleUnits = VisibilityEngine.getVisibleUnits(state);
    const currentBoardUnits = this.getBoardUnitsById(state);

    this.capturePendingAbilityDamageFeedback(currentBoardUnits);
    this.playPendingAttackFeedback(currentBoardUnits);
    this.playPendingAbilityDamageFeedback(currentBoardUnits);

    visibleUnits.forEach((unit: UnitInstance) => {
      if (!unit.position) return;

      const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;
      activeVisibleUnitIds.add(unitInstanceId);

      const targetX = unit.position.x * CELL_SIZE + CELL_SIZE / 2;
      const targetY = unit.position.y * CELL_SIZE + CELL_SIZE / 2;
      const unitColor = getPlayerColor(unit.color);
      const deathExplosionColor = unit.color ? unitColor : undefined;

      let container = this.unitSprites.get(unitInstanceId);
      if (!container) {
        container = this.createUnitSprite(unit, unitColor);
        container.setPosition(targetX, targetY);
        this.unitSprites.set(unitInstanceId, container);

        const shouldAnimateSpawn = this.initialUnitsRendered && !this.previousBoardUnits.has(unitInstanceId);
        if (shouldAnimateSpawn) {
          this.playDeploymentSpawnAnimation(unitInstanceId, container, targetX, targetY, unitColor);
        }
      }

      const previousUnit = this.previousBoardUnits.get(unitInstanceId);
      const hasMoved = Boolean(
        previousUnit?.position
        && (previousUnit.position.x !== unit.position.x || previousUnit.position.y !== unit.position.y)
      );
      const healedAmount = previousUnit ? Math.max(0, unit.currentHp - previousUnit.currentHp) : 0;

      if (unit.currentHp <= 0) {
        if (container.getData('animationState') !== 'dying') {
          const abilityDeathFeedback = this.pendingAbilityDeathFeedback.get(unitInstanceId);
          if (abilityDeathFeedback) {
            this.emitSplashPotion(
              abilityDeathFeedback.attackerPos,
              abilityDeathFeedback.targetPos,
              DAMAGE_POTION_COLOR,
              () => {
                this.flashUnit(unitInstanceId, abilityDeathFeedback.damage, DEATH_FLASH_LONG_DURATION_MS);
              },
            );
            this.playDeathAnimation(unitInstanceId, container, targetX, targetY, DEATH_FLASH_LONG_DURATION_MS, true, deathExplosionColor);
            this.pendingAbilityDeathFeedback.delete(unitInstanceId);
          } else {
            this.playDeathAnimation(unitInstanceId, container, targetX, targetY, DEATH_EXPLOSION_DELAY_MS, false, deathExplosionColor);
          }
        }
      } else if (hasMoved) {
        this.playMoveAnimation(unitInstanceId, container, targetX, targetY, previousUnit!.position!, unit.position, unitColor);
      } else if (container.getData('animationState') !== 'moving' && container.getData('animationState') !== 'dying') {
        container.setPosition(targetX, targetY);
      }

      if (healedAmount > 0 && container.getData('animationState') !== 'dying' && unit.position) {
        this.showHealingEffect(unitInstanceId, container, healedAmount, unitColor, unit.position);
      }

      this.updateUnitSprite(container, unit, unitColor);
    });

    for (const [id, container] of this.unitSprites.entries()) {
      if (activeVisibleUnitIds.has(id)) {
        continue;
      }

      const boardUnit = currentBoardUnits.get(id);
      const previousUnit = this.previousBoardUnits.get(id);
      const deathExplosionColor = boardUnit?.color
        ? getPlayerColor(boardUnit.color)
        : previousUnit?.color
          ? getPlayerColor(previousUnit.color)
          : undefined;
      const deathEffectPos = boardUnit?.position ?? previousUnit?.position;
      const deathEffectCoords = deathEffectPos ? this.gridToWorld(deathEffectPos) : { x: container.x, y: container.y };
      const shouldPlayDeath = !boardUnit || boardUnit.currentHp <= 0 || !boardUnit.position;
      if (shouldPlayDeath) {
        if (container.getData('animationState') !== 'dying') {
          const abilityDeathFeedback = this.pendingAbilityDeathFeedback.get(id);
          if (abilityDeathFeedback) {
            this.emitSplashPotion(
              abilityDeathFeedback.attackerPos,
              abilityDeathFeedback.targetPos,
              DAMAGE_POTION_COLOR,
              () => {
                this.flashUnit(id, abilityDeathFeedback.damage, DEATH_FLASH_LONG_DURATION_MS);
              },
            );
            this.playDeathAnimation(id, container, deathEffectCoords.x, deathEffectCoords.y, DEATH_FLASH_LONG_DURATION_MS, true, deathExplosionColor);
            this.pendingAbilityDeathFeedback.delete(id);
          } else {
            this.playDeathAnimation(id, container, deathEffectCoords.x, deathEffectCoords.y, DEATH_EXPLOSION_DELAY_MS, false, deathExplosionColor);
          }
        }
      } else {
        this.cleanupUnitContainer(id, container);
      }
    }

    this.previousBoardUnits = currentBoardUnits;
    this.initialUnitsRendered = true;

  }

  private getBoardUnitsById(state: GameState): Map<string, UnitInstance> {
    const units = new Map<string, UnitInstance>();
    for (const player of state.players) {
      for (const unit of player.units) {
        units.set(`${unit.ownerId}-${unit.card.id}`, unit);
      }
    }
    return units;
  }

  private getMoveDuration(from: Position, to: Position): number {
    const cells = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    return Phaser.Math.Clamp(250 + cells * 90, 300, 500);
  }

  private getUnitTweens(unitId: string): UnitTweenBundle {
    let tweens = this.unitTweens.get(unitId);
    if (!tweens) {
      tweens = {};
      this.unitTweens.set(unitId, tweens);
    }
    return tweens;
  }

  private stopUnitTweens(unitId: string) {
    const activeTweens = this.unitTweens.get(unitId);
    if (!activeTweens) return;

    activeTweens.move?.stop();
    activeTweens.scale?.stop();
    activeTweens.spawn?.stop();
    activeTweens.death?.stop();

    this.unitTweens.delete(unitId);
  }

  private playMoveAnimation(
    unitId: string,
    container: Phaser.GameObjects.Container,
    targetX: number,
    targetY: number,
    from: Position,
    to: Position,
    unitColor: number,
  ) {
    if (container.getData('animationState') === 'dying') {
      return;
    }

    this.clearHealingEffects(unitId);
    this.stopUnitTweens(unitId);
    container.setData('animationState', 'moving' as UnitAnimationState);
    container.setData('moveTargetX', targetX);
    container.setData('moveTargetY', targetY);
    const duration = this.getMoveDuration(from, to);
    const tweens = this.getUnitTweens(unitId);

    const distance = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
    if (distance >= 2) {
      this.emitMovementTrail(targetX, targetY, unitColor);
    }

    tweens.scale = this.tweens.add({
      targets: container,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: Math.floor(duration / 2),
      ease: 'Cubic.Out',
      yoyo: true,
    });

    tweens.move = this.tweens.add({
      targets: container,
      x: targetX,
      y: targetY,
      duration,
      ease: 'Cubic.Out',
      onComplete: () => {
        container.setScale(1);
        container.setData('moveTargetX', undefined);
        container.setData('moveTargetY', undefined);
        if (container.getData('animationState') !== 'dying') {
          container.setData('animationState', 'idle' as UnitAnimationState);
        }
        this.unitTweens.delete(unitId);
      },
    });
  }

  private playDeploymentSpawnAnimation(
    unitId: string,
    container: Phaser.GameObjects.Container,
    targetX: number,
    targetY: number,
    unitColor: number,
  ) {
    if (container.getData('animationState') === 'dying') {
      return;
    }

    this.stopUnitTweens(unitId);
    container.setData('animationState', 'spawning' as UnitAnimationState);
    container.setAlpha(0);
    container.setScale(0.1);
    container.setPosition(targetX, targetY - CELL_SIZE * 1.2);

    const tweens = this.getUnitTweens(unitId);

    tweens.spawn = this.tweens.add({
      targets: container,
      x: targetX,
      y: targetY,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 520,
      ease: 'Elastic.Out',
      onStart: () => {
        this.emitParticleBurst(targetX, targetY, unitColor, 8);
      },
      onComplete: () => {
        if (container.getData('animationState') !== 'dying') {
          container.setData('animationState', 'idle' as UnitAnimationState);
        }
        this.unitTweens.delete(unitId);
      },
    });
  }

  private playDeathAnimation(
    unitId: string,
    container: Phaser.GameObjects.Container,
    targetX: number,
    targetY: number,
    explosionDelayMs = DEATH_EXPLOSION_DELAY_MS,
    preserveFlash = false,
    unitColor?: number,
  ) {
    this.clearHealingEffects(unitId);
    this.stopUnitTweens(unitId);
    container.setData('animationState', 'dying' as UnitAnimationState);

    const tweens = this.getUnitTweens(unitId);

    const square = container.getData('mainSquare') as Phaser.GameObjects.Rectangle | undefined;
    const existingFlashTween = container.getData('flashTween') as Phaser.Tweens.Tween | undefined;
    if (existingFlashTween) {
      if (!preserveFlash) {
        existingFlashTween.stop();
        container.setData('flashTween', null);
      }
    }

    if (square && !preserveFlash) {
      square.setFillStyle(0xffffff, 1);
    }

    this.emitBloodSplatter(targetX, targetY);

    this.time.delayedCall(explosionDelayMs, () => {
      this.emitDeathExplosion(targetX, targetY, unitColor);

      let fadeComplete = false;
      let soulComplete = false;
      const finalizeDeathCleanup = () => {
        if (!fadeComplete || !soulComplete) return;
        this.cleanupUnitContainer(unitId, container);
      };

      this.playSoulOrbAnimation(targetX, targetY, () => {
        soulComplete = true;
        finalizeDeathCleanup();
      });

      tweens.death = this.tweens.add({
        targets: container,
        alpha: 0,
        duration: DEATH_UNIT_FADE_DURATION_MS,
        ease: 'Quad.Out',
        onComplete: () => {
          fadeComplete = true;
          finalizeDeathCleanup();
        },
      });
    });
  }

  private cleanupOverlayElements() {
    this.activeOverlayElements.forEach((element) => {
      element.remove();
    });
    this.activeOverlayElements.clear();
  }

  private registerOverlayElement(element: HTMLElement) {
    this.activeOverlayElements.add(element);
  }

  private removeOverlayElement(element: HTMLElement) {
    element.remove();
    this.activeOverlayElements.delete(element);
  }

  private worldToViewport(worldX: number, worldY: number): ViewportPoint {
    const camera = this.cameras.main;
    const canvasRect = this.game.canvas.getBoundingClientRect();
    const xScale = canvasRect.width / camera.width;
    const yScale = canvasRect.height / camera.height;
    return {
      x: canvasRect.left + (worldX - camera.worldView.x) * xScale,
      y: canvasRect.top + (worldY - camera.worldView.y) * yScale,
    };
  }

  private playSoulOrbAnimation(startWorldX: number, startWorldY: number, onComplete: () => void) {
    const discardPileElement = document.querySelector<HTMLElement>('[data-discard-pile="desktop"]');
    if (!discardPileElement) {
      onComplete();
      return;
    }

    const startPoint = this.worldToViewport(startWorldX, startWorldY);
    const discardRect = discardPileElement.getBoundingClientRect();
    const endPoint = {
      x: discardRect.left + discardRect.width / 2,
      y: discardRect.top + discardRect.height / 2,
    };
    const controlPoint = {
      x: startPoint.x + (endPoint.x - startPoint.x) * 0.55,
      y: Math.min(startPoint.y, endPoint.y) - 72,
    };

    const orb = document.createElement('div');
    orb.style.position = 'fixed';
    orb.style.left = `${startPoint.x}px`;
    orb.style.top = `${startPoint.y}px`;
    orb.style.width = '30px';
    orb.style.height = '30px';
    orb.style.borderRadius = '9999px';
    orb.style.pointerEvents = 'none';
    orb.style.zIndex = '1400';
    orb.style.opacity = '1';
    orb.style.transform = 'translate(-50%, -50%)';
    orb.style.background = 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(226,232,255,0.95) 44%, rgba(209,225,255,0.55) 72%, rgba(209,225,255,0) 100%)';
    orb.style.boxShadow = '0 0 20px rgba(255,255,255,0.9), 0 0 34px rgba(210,224,255,0.75), 0 0 52px rgba(210,224,255,0.35)';
    document.body.appendChild(orb);
    this.registerOverlayElement(orb);

    const hoverAnimation = orb.animate(
      [
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: 'translate(-50%, calc(-50% - 10px)) scale(1.08)', opacity: 1 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
      ],
      {
        duration: SOUL_ORB_HOVER_DURATION_MS,
        easing: 'ease-in-out',
      },
    );

    hoverAnimation.onfinish = () => {
      const flightAnimation = orb.animate(
        [
          { left: `${startPoint.x}px`, top: `${startPoint.y}px`, opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
          { left: `${controlPoint.x}px`, top: `${controlPoint.y}px`, opacity: 1, offset: 0.55, transform: 'translate(-50%, -50%) scale(1.12)' },
          { left: `${endPoint.x}px`, top: `${endPoint.y}px`, opacity: 0.94, transform: 'translate(-50%, -50%) scale(0.7)' },
        ],
        {
          duration: SOUL_ORB_FLIGHT_DURATION_MS,
          easing: 'cubic-bezier(0.2, 0.75, 0.2, 1)',
          fill: 'forwards',
        },
      );

      flightAnimation.onfinish = () => {
        this.triggerDiscardPileFlash(discardPileElement);
        this.removeOverlayElement(orb);
        onComplete();
      };

      flightAnimation.oncancel = () => {
        this.removeOverlayElement(orb);
        onComplete();
      };
    };

    hoverAnimation.oncancel = () => {
      this.removeOverlayElement(orb);
      onComplete();
    };
  }

  private triggerDiscardPileFlash(discardPileElement: HTMLElement) {
    const discardRect = discardPileElement.getBoundingClientRect();
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.left = `${discardRect.left}px`;
    flash.style.top = `${discardRect.top}px`;
    flash.style.width = `${discardRect.width}px`;
    flash.style.height = `${discardRect.height}px`;
    flash.style.borderRadius = '10px';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '1399';
    flash.style.opacity = '0';
    flash.style.background = 'radial-gradient(circle at center, rgba(255,255,255,0.98) 0%, rgba(244,248,255,0.94) 52%, rgba(231,239,255,0.58) 100%)';
    flash.style.boxShadow = '0 0 36px rgba(255,255,255,0.82), 0 0 62px rgba(224,235,255,0.58)';
    document.body.appendChild(flash);
    this.registerOverlayElement(flash);

    window.dispatchEvent(new CustomEvent('discard-pile-flash', {
      detail: {
        startedAt: performance.now(),
        durationMs: DISCARD_PILE_FLASH_DURATION_MS,
      },
    }));

    const flashAnimation = flash.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.28 },
        { opacity: 0 },
      ],
      {
        duration: DISCARD_PILE_FLASH_DURATION_MS,
        easing: 'ease-out',
      },
    );

    flashAnimation.onfinish = () => {
      this.removeOverlayElement(flash);
    };

    flashAnimation.oncancel = () => {
      this.removeOverlayElement(flash);
    };
  }

  private cleanupUnitContainer(unitId: string, container: Phaser.GameObjects.Container) {
    const flashTween = container.getData('flashTween') as Phaser.Tweens.Tween | undefined;
    flashTween?.stop();

    this.clearHealingEffects(unitId);
    this.stopUnitTweens(unitId);
    container.destroy();
    this.unitSprites.delete(unitId);
  }

  private getHealingEffects(unitId: string): Set<HealingEffectEntry> {
    let effects = this.activeHealingEffects.get(unitId);
    if (!effects) {
      effects = new Set<HealingEffectEntry>();
      this.activeHealingEffects.set(unitId, effects);
    }
    return effects;
  }

  private clearHealingEffects(unitId: string) {
    const effects = this.activeHealingEffects.get(unitId);
    if (!effects) return;

    effects.forEach((entry) => {
      entry.tween.stop();
      entry.text.destroy();
    });

    this.activeHealingEffects.delete(unitId);
  }

  private ensureParticleTexture() {
    if (this.textures.exists(this.particleTextureKey)) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 6, 6);
    graphics.generateTexture(this.particleTextureKey, 6, 6);
    graphics.destroy();
  }

  private emitParticleBurst(
    x: number,
    y: number,
    color: number,
    quantity: number,
    includeWhite = false,
    cleanupDelayMs = 600,
  ) {
    const totalParticles = Phaser.Math.Clamp(quantity, 1, 30);
    const tint = includeWhite && Math.random() > 0.5 ? 0xffffff : color;

    const emitter = this.add.particles(x, y, this.particleTextureKey, {
      speed: { min: 50, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 550 },
      tint,
      quantity: totalParticles,
      emitting: false,
    });

    emitter.explode(totalParticles, x, y);
    this.time.delayedCall(cleanupDelayMs, () => emitter.destroy());
  }

  private emitBloodSplatter(x: number, y: number) {
    const splatterParticles = Phaser.Math.Between(18, 26);
    const splatterEmitter = this.add.particles(x, y, this.particleTextureKey, {
      speed: { min: 70, max: 190 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.55, end: 0.08 },
      alpha: { start: 0.88, end: 0 },
      lifespan: { min: 500, max: 840 },
      tint: BLOOD_MAIN_COLOR,
      quantity: splatterParticles,
      emitting: false,
      gravityY: 140,
    });

    splatterEmitter.explode(splatterParticles, x, y);
    this.time.delayedCall(BLOOD_SPLATTER_CLEANUP_MS, () => splatterEmitter.destroy());

    const dropletParticles = Phaser.Math.Between(10, 16);
    const dropletsEmitter = this.add.particles(x, y, this.particleTextureKey, {
      speed: { min: 120, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.3, end: 0.04 },
      alpha: { start: 0.8, end: 0 },
      lifespan: { min: 320, max: 580 },
      tint: BLOOD_DROPLET_COLOR,
      quantity: dropletParticles,
      emitting: false,
      gravityY: 200,
    });

    dropletsEmitter.explode(dropletParticles, x, y);
    this.time.delayedCall(BLOOD_DROPLET_CLEANUP_MS, () => dropletsEmitter.destroy());

    const stain = this.add.circle(x, y, 2.5, BLOOD_STAIN_COLOR, 0.66);
    stain.setDepth(285);

    this.tweens.add({
      targets: stain,
      scaleX: Phaser.Math.FloatBetween(2.1, 2.6),
      scaleY: Phaser.Math.FloatBetween(1.7, 2.2),
      alpha: 0,
      duration: 1800,
      ease: 'Quad.Out',
      onComplete: () => stain.destroy(),
    });
  }

  private emitSplashParticles(x: number, y: number, color: number) {
    const totalParticles = Phaser.Math.Between(16, 24);
    const emitter = this.add.particles(x, y, this.particleTextureKey, {
      speed: { min: 70, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 320, max: 520 },
      tint: color,
      quantity: totalParticles,
      emitting: false,
    });

    emitter.explode(totalParticles, x, y);
    this.time.delayedCall(600, () => emitter.destroy());

    const ripple = this.add.circle(x, y, 3, color, 0.5);
    ripple.setDepth(299);

    this.tweens.add({
      targets: ripple,
      scale: 3,
      alpha: 0,
      duration: 360,
      ease: 'Cubic.Out',
      onComplete: () => ripple.destroy(),
    });
  }

  private emitSplashPotion(
    fromPos: Position | undefined,
    toPos: Position,
    color: number,
    onImpact?: () => void,
  ) {
    const end = this.gridToWorld(toPos);
    const start = fromPos ? this.gridToWorld(fromPos) : { x: end.x, y: end.y - CELL_SIZE * 1.4 };

    const potion = this.add.circle(start.x, start.y, 4, color, 1);
    potion.setDepth(300);
    potion.setStrokeStyle(1, 0xffffff, 0.8);

    const travelDuration = Phaser.Math.Clamp(
      220 + Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y) * 1.1,
      220,
      420,
    );

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: travelDuration,
      ease: 'Sine.InOut',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        potion.x = Phaser.Math.Linear(start.x, end.x, progress);
        const baseY = Phaser.Math.Linear(start.y, end.y, progress);
        const arcHeight = Math.sin(progress * Math.PI) * Math.max(18, Math.abs(end.y - start.y) * 0.35 + 24);
        potion.y = baseY - arcHeight;
      },
      onComplete: () => {
        potion.destroy();
        this.emitSplashParticles(end.x, end.y, color);
        onImpact?.();
      },
    });
  }

  private emitMovementTrail(x: number, y: number, color: number) {
    const ghost = this.add.rectangle(x, y, CELL_SIZE - 4, CELL_SIZE - 4, color, 0.35);
    this.tweens.add({
      targets: ghost,
      alpha: 0,
      scaleX: 0.85,
      scaleY: 0.85,
      duration: 180,
      ease: 'Quart.Out',
      onComplete: () => ghost.destroy(),
    });
  }

  private emitShockwave(x: number, y: number, color: number, durationMs = 380) {
    const shockwave = this.add.graphics();
    shockwave.setDepth(290);
    shockwave.lineStyle(3, color, 0.8);
    shockwave.strokeCircle(x, y, 8);

    this.tweens.add({
      targets: shockwave,
      scale: 5,
      alpha: 0,
      duration: durationMs,
      ease: 'Cubic.Out',
      onUpdate: () => {
        shockwave.clear();
        shockwave.lineStyle(3, color, shockwave.alpha);
        shockwave.strokeCircle(x, y, 8);
      },
      onComplete: () => shockwave.destroy(),
    });
  }

  private blendColors(baseColor: number, accentColor: number, accentWeight = 0.42): number {
    return Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(baseColor),
      Phaser.Display.Color.ValueToColor(accentColor),
      100,
      Math.floor(Phaser.Math.Clamp(accentWeight, 0, 1) * 100),
    ).color;
  }

  private emitDeathExplosion(x: number, y: number, unitColor?: number) {
    const primaryColor = unitColor ?? 0xef4444;
    const secondaryColor = unitColor !== undefined ? this.blendColors(unitColor, 0xf97316) : 0xf97316;

    this.emitParticleBurst(x, y, primaryColor, 36, true, DEATH_PARTICLE_CLEANUP_MS);
    this.emitParticleBurst(x, y, secondaryColor, 26, true, DEATH_PARTICLE_CLEANUP_MS);
    this.emitShockwave(x, y, primaryColor, DEATH_SHOCKWAVE_DURATION_MS);

    const core = this.add.circle(x, y, 9, 0xffffff, 0.95);
    core.setDepth(300);

    this.tweens.add({
      targets: core,
      scale: 2.6,
      alpha: 0,
      duration: DEATH_EXPLOSION_CORE_DURATION_MS,
      ease: 'Cubic.Out',
      onComplete: () => core.destroy(),
    });
  }

  private gridToWorld(position: Position): { x: number; y: number } {
    return {
      x: position.x * CELL_SIZE + CELL_SIZE / 2,
      y: position.y * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  private showDamageNumber(unitPosition: Position, damage: number, isOverkill: boolean) {
    const { x, y } = this.gridToWorld(unitPosition);
    const clampedDamage = Math.max(0, damage);
    const textValue = isOverkill ? `${clampedDamage}! (OVERKILL)` : `${clampedDamage}`;
    const damageText = this.add.text(x, y, textValue, {
      fontSize: isOverkill ? '20px' : '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: isOverkill ? 4 : 3,
    });

    damageText.setOrigin(0.5);
    damageText.setDepth(320);

    this.tweens.add({
      targets: damageText,
      y: y - 26,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.Out',
      onComplete: () => damageText.destroy(),
    });
  }

  private showHealingEffect(
    unitId: string,
    container: Phaser.GameObjects.Container,
    healedAmount: number,
    unitColor: number,
    targetPos: Position,
  ) {
    const clampedHeal = Math.max(0, healedAmount);
    if (clampedHeal <= 0) return;
    if (container.getData('animationState') === 'dying') return;

    const { x: startX, y: startY } = this.gridToWorld(targetPos);

    const healingText = this.add.text(startX, startY, `+${clampedHeal}`, {
      fontSize: clampedHeal >= 10 ? '20px' : '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#22c55e',
      stroke: '#000000',
      strokeThickness: clampedHeal >= 10 ? 4 : 3,
    });

    healingText.setOrigin(0.5);
    healingText.setDepth(320);

    const effects = this.getHealingEffects(unitId);
    const effectEntry = {} as HealingEffectEntry;

    const tween = this.tweens.add({
      targets: healingText,
      y: startY - 26,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.Out',
      onComplete: () => {
        healingText.destroy();
        effects.delete(effectEntry);
        if (effects.size === 0) {
          this.activeHealingEffects.delete(unitId);
        }
      },
    });

    effectEntry.text = healingText;
    effectEntry.tween = tween;
    effects.add(effectEntry);

    const splashSource = this.pendingHealingSplashSources.get(unitId);
    this.pendingHealingSplashSources.delete(unitId);
    this.emitSplashPotion(splashSource, targetPos, HEAL_POTION_COLOR);

    const square = container.getData('mainSquare') as Phaser.GameObjects.Rectangle | undefined;
    if (square) {
      const existingFlashTween = container.getData('flashTween') as Phaser.Tweens.Tween | undefined;
      if (existingFlashTween) {
        existingFlashTween.stop();
      }

      square.setFillStyle(0x22c55e, 1);
      const healFlashTween = this.tweens.addCounter({
        from: 0,
        to: 1,
        duration: 320,
        ease: 'Sine.Out',
        onUpdate: (flashTween) => {
          const progress = flashTween.getValue() ?? 0;
          const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0x22c55e),
            Phaser.Display.Color.ValueToColor(unitColor),
            100,
            Math.floor(progress * 100),
          ).color;
          square.setFillStyle(color, 0.9);
        },
        onComplete: () => {
          square.setFillStyle(unitColor, 0.9);
          container.setData('flashTween', null);
        },
      });

      container.setData('flashTween', healFlashTween);
    }
  }

  private showSlashEffect(attackerPos: Position, defenderPos: Position) {
    const start = this.gridToWorld(attackerPos);
    const end = this.gridToWorld(defenderPos);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);

    const directionIndicator = this.add.graphics();
    directionIndicator.setDepth(278);
    directionIndicator.setAlpha(0);

    const indicatorEndT = 0.84;
    const indicatorEndX = Phaser.Math.Linear(start.x, end.x, indicatorEndT);
    const indicatorEndY = Phaser.Math.Linear(start.y, end.y, indicatorEndT);
    directionIndicator.lineStyle(2, 0xfff1c2, 0.9);
    directionIndicator.lineBetween(start.x, start.y, indicatorEndX, indicatorEndY);

    const arrowTipX = Phaser.Math.Linear(start.x, end.x, 0.92);
    const arrowTipY = Phaser.Math.Linear(start.y, end.y, 0.92);
    const arrowSize = Phaser.Math.Clamp(distance * 0.14, 5, 9);
    directionIndicator.lineBetween(
      arrowTipX,
      arrowTipY,
      arrowTipX + Math.cos(angle + Math.PI - 0.5) * arrowSize,
      arrowTipY + Math.sin(angle + Math.PI - 0.5) * arrowSize,
    );
    directionIndicator.lineBetween(
      arrowTipX,
      arrowTipY,
      arrowTipX + Math.cos(angle + Math.PI + 0.5) * arrowSize,
      arrowTipY + Math.sin(angle + Math.PI + 0.5) * arrowSize,
    );

    const slash = this.add.graphics();
    slash.setDepth(281);
    slash.setAlpha(0);

    const slashGlow = this.add.graphics();
    slashGlow.setDepth(280);
    slashGlow.setAlpha(0);

    const slashAngle = angle + Phaser.Math.DegToRad(18);
    const slashDirX = Math.cos(slashAngle);
    const slashDirY = Math.sin(slashAngle);
    const slashPerpX = -slashDirY;
    const slashPerpY = slashDirX;

    const halfLength = Phaser.Math.Clamp(distance * 0.48, 14, 24);
    const secondaryHalfLength = halfLength * 0.85;
    const laneOffset = Phaser.Math.Clamp(distance * 0.08, 2, 4);

    slashGlow.lineStyle(12, 0xff8b3d, 0.5);
    slashGlow.lineBetween(
      end.x - slashDirX * halfLength,
      end.y - slashDirY * halfLength,
      end.x + slashDirX * halfLength,
      end.y + slashDirY * halfLength,
    );
    slashGlow.lineBetween(
      end.x - slashDirX * secondaryHalfLength + slashPerpX * laneOffset,
      end.y - slashDirY * secondaryHalfLength + slashPerpY * laneOffset,
      end.x + slashDirX * secondaryHalfLength + slashPerpX * laneOffset,
      end.y + slashDirY * secondaryHalfLength + slashPerpY * laneOffset,
    );

    slash.lineStyle(5, 0xffffff, 1);
    slash.lineBetween(
      end.x - slashDirX * halfLength,
      end.y - slashDirY * halfLength,
      end.x + slashDirX * halfLength,
      end.y + slashDirY * halfLength,
    );
    slash.lineStyle(3, 0xffd2a6, 0.95);
    slash.lineBetween(
      end.x - slashDirX * secondaryHalfLength + slashPerpX * laneOffset,
      end.y - slashDirY * secondaryHalfLength + slashPerpY * laneOffset,
      end.x + slashDirX * secondaryHalfLength + slashPerpX * laneOffset,
      end.y + slashDirY * secondaryHalfLength + slashPerpY * laneOffset,
    );

    const impactRing = this.add.circle(end.x, end.y, 4, 0xfff1c2, 0.75);
    impactRing.setDepth(282);
    impactRing.setScale(0.5);

    const impactCore = this.add.circle(end.x + perpX * 1.5, end.y + perpY * 1.5, 3, 0xffffff, 0.9);
    impactCore.setDepth(283);
    impactCore.setScale(0.4);

    this.tweens.add({
      targets: directionIndicator,
      alpha: 1,
      duration: 80,
      ease: 'Sine.Out',
      yoyo: true,
      hold: 110,
      onComplete: () => {
        directionIndicator.destroy();
      },
    });

    this.tweens.add({
      targets: [slash, slashGlow],
      alpha: 1,
      duration: 100,
      ease: 'Sine.Out',
      yoyo: true,
      hold: 260,
      onComplete: () => {
        slash.destroy();
        slashGlow.destroy();
      },
    });

    this.tweens.add({
      targets: impactRing,
      alpha: 0,
      scale: 2.2,
      duration: 280,
      ease: 'Cubic.Out',
      onComplete: () => impactRing.destroy(),
    });

    this.tweens.add({
      targets: impactCore,
      alpha: 0,
      scale: 1.7,
      duration: 210,
      ease: 'Sine.Out',
      onComplete: () => impactCore.destroy(),
    });
  }

  private flashUnit(unitInstanceId: string, damage: number, durationMs = 420) {
    const container = this.unitSprites.get(unitInstanceId);
    if (!container) return;

    const square = container.getData('mainSquare') as Phaser.GameObjects.Rectangle | undefined;
    if (!square) return;

    const existingFlashTween = container.getData('flashTween') as Phaser.Tweens.Tween | undefined;
    if (existingFlashTween) {
      existingFlashTween.stop();
    }

    const baseColor = (container.getData('unitColor') as number | undefined) ?? 0xffffff;
    const maxAlphaBoost = Phaser.Math.Clamp(damage / 8, 0, 0.2);
    const baseAlpha = 0.9 + maxAlphaBoost;

    square.setFillStyle(0xffffff, baseAlpha);

    const flashTween = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: durationMs,
      ease: 'Sine.Out',
      onUpdate: (tween) => {
        const progress = tween.getValue() ?? 0;
        let color: number;

        if (progress < 0.5) {
          const lerp = progress / 0.5;
          color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xffffff),
            Phaser.Display.Color.ValueToColor(0xff0000),
            100,
            Math.floor(lerp * 100),
          ).color;
        } else {
          const lerp = (progress - 0.5) / 0.5;
          color = Phaser.Display.Color.Interpolate.ColorWithColor(
            Phaser.Display.Color.ValueToColor(0xff0000),
            Phaser.Display.Color.ValueToColor(baseColor),
            100,
            Math.floor(lerp * 100),
          ).color;
        }

        square.setFillStyle(color, baseAlpha);
      },
      onComplete: () => {
        square.setFillStyle(baseColor, 0.9);
        container.setData('flashTween', null);
      },
    });

    container.setData('flashTween', flashTween);
  }

  private capturePendingAbilityDamageFeedback(currentBoardUnits: Map<string, UnitInstance>) {
    const abilityCasterEntry = Array.from(currentBoardUnits.entries()).find(([id, currentUnit]) => {
      const previousUnit = this.previousBoardUnits.get(id);
      return Boolean(
        previousUnit
        && !previousUnit.hasUsedAbilityThisTurn
        && currentUnit.hasUsedAbilityThisTurn,
      );
    });

    const abilityWasUsed = Boolean(abilityCasterEntry);

    if (!abilityWasUsed) {
      return;
    }

    const feedback: PendingAbilityDamageFeedback[] = [];
    const resolvedAbilityCasterPos = abilityCasterEntry
      ? abilityCasterEntry[1].position ?? this.previousBoardUnits.get(abilityCasterEntry[0])?.position
      : null;
    const abilityCasterPos = resolvedAbilityCasterPos ?? undefined;

    for (const [id, previousUnit] of this.previousBoardUnits.entries()) {
      const currentUnit = currentBoardUnits.get(id);
      const hpDelta = previousUnit.currentHp - (currentUnit?.currentHp ?? 0);
      if (hpDelta === 0) {
        continue;
      }

      const targetPos = currentUnit?.position ?? previousUnit.position;
      if (!targetPos) {
        continue;
      }

      feedback.push({
        targetInstanceId: id,
        targetPos,
        attackerPos: abilityCasterPos,
        damage: hpDelta,
        targetDied: hpDelta > 0 && (!currentUnit || currentUnit.currentHp <= 0 || !currentUnit.position),
      });
    }

    if (feedback.length === 0) {
      return;
    }

    this.pendingAbilityDamageFeedback = feedback;
  }

  private playPendingAbilityDamageFeedback(currentBoardUnits: Map<string, UnitInstance>) {
    if (!this.pendingAbilityDamageFeedback) {
      return;
    }

    const feedback = this.pendingAbilityDamageFeedback;

    feedback.forEach((entry) => {
      if (entry.damage < 0) {
        this.pendingHealingSplashSources.set(entry.targetInstanceId, entry.attackerPos ?? entry.targetPos);
        return;
      }

      if (entry.targetDied) {
        this.pendingAbilityDeathFeedback.set(entry.targetInstanceId, {
          damage: entry.damage,
          targetPos: entry.targetPos,
          attackerPos: entry.attackerPos,
        });
        return;
      }

      const currentUnit = currentBoardUnits.get(entry.targetInstanceId);
      if (!currentUnit || currentUnit.currentHp <= 0 || !currentUnit.position) {
        return;
      }

      this.emitSplashPotion(entry.attackerPos, entry.targetPos, DAMAGE_POTION_COLOR, () => {
        const container = this.unitSprites.get(entry.targetInstanceId);
        if (!container || container.getData('animationState') === 'dying') {
          return;
        }

        this.flashUnit(entry.targetInstanceId, entry.damage);
      });
    });

    this.pendingAbilityDamageFeedback = null;
  }

  private playPendingAttackFeedback(currentBoardUnits: Map<string, UnitInstance>) {
    if (!this.pendingAttackFeedback) return;

    const feedback = this.pendingAttackFeedback;
    const previousAttacker = this.previousBoardUnits.get(feedback.attackerInstanceId);
    const previousDefender = this.previousBoardUnits.get(feedback.defenderInstanceId);
    if (!previousAttacker || !previousDefender) {
      this.pendingAttackFeedback = null;
      return;
    }

    const currentAttacker = currentBoardUnits.get(feedback.attackerInstanceId);
    const currentDefender = currentBoardUnits.get(feedback.defenderInstanceId);

    const attackerDamage = Math.max(0, previousAttacker.currentHp - (currentAttacker?.currentHp ?? 0));
    const defenderDamage = Math.max(0, previousDefender.currentHp - (currentDefender?.currentHp ?? 0));

    const attackerActed = Boolean(
      (currentAttacker && !previousAttacker.hasAttackedThisTurn && currentAttacker.hasAttackedThisTurn)
      || (!currentAttacker && previousAttacker.currentHp > 0)
    );

    if (!attackerActed && attackerDamage === 0 && defenderDamage === 0) {
      return;
    }

    const attackerSurvived = Boolean(currentAttacker && currentAttacker.currentHp > 0);
    const attackerFlashDuration = attackerSurvived
      ? ATTACKER_SURVIVE_FLASH_DURATION_MS
      : ATTACKER_DIES_FLASH_DURATION_MS;

    this.flashUnit(feedback.attackerInstanceId, attackerDamage, attackerFlashDuration);
    this.flashUnit(feedback.defenderInstanceId, defenderDamage, DEFENDER_FLASH_DURATION_MS);

    this.time.delayedCall(ATTACK_SLASH_DELAY_MS, () => {
      this.showSlashEffect(feedback.attackerPos, feedback.defenderPos);
    });

    this.time.delayedCall(ATTACK_DAMAGE_NUMBER_DELAY_MS, () => {
      this.showDamageNumber(
        feedback.attackerPos,
        attackerDamage,
        attackerDamage > previousAttacker.currentHp,
      );
      this.showDamageNumber(
        feedback.defenderPos,
        defenderDamage,
        defenderDamage > previousDefender.currentHp,
      );
    });

    this.pendingAttackFeedback = null;
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

    container.setData('mainSquare', square);
    container.setData('hpBar', hpBar);
    container.setData('unitColor', color);
    container.setData('animationState', 'idle' as UnitAnimationState);
    container.setData('flashTween', null);



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

        const attackerOwnerId = store.playerId;
        const attackerUnit = attackerOwnerId && gameState
          ? gameState.players
            .find((player) => player.id === attackerOwnerId)
            ?.units.find((unit) => unit.card.id === selectedUnitId)
          : undefined;

        if (attackerOwnerId && attackerUnit?.position) {
          this.pendingAttackFeedback = {
            attackerInstanceId: `${attackerOwnerId}-${selectedUnitId}`,
            defenderInstanceId: `${target.ownerId}-${target.unitId}`,
            attackerPos: attackerUnit.position,
            defenderPos: target.position,
          };
        }

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



    return;

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


