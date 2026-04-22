import Phaser from 'phaser';
import { IntentType } from '@mugen/shared';
import { useGameStore } from '../store/game-store.js';
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
const COLOR_MAP = {
    red: 0xef4444,
    blue: 0x6366f1,
    yellow: 0xf59e0b,
    green: 0x22c55e,
};
function getPlayerColor(color) {
    return color ? COLOR_MAP[color] ?? 0x6366f1 : 0x6366f1;
}
export class GameScene extends Phaser.Scene {
    cellGraphics = null;
    unitSprites = new Map();
    highlightGraphics = null;
    hoverHighlightGraphics = null;
    abilityHighlightGraphics = null;
    attackHighlightGraphics = null;
    deploymentHighlightGraphics = null;
    lastState = null;
    lastValidMoves = [];
    lastAbilityTargets = [];
    lastAttackTargets = [];
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
        this.input.on('pointerdown', (pointer) => {
            // Block all board interactions while hand limit modal or standby modal is open
            const storeState = useGameStore.getState();
            if (storeState.handLimitModalOpen || storeState.standbyModalOpen)
                return;
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
                    // Find the unit at this position
                    for (const player of gameState.players) {
                        for (const unit of player.units) {
                            const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;
                            if (unitInstanceId === cell.occupantId && unit.position && unit.position.x === pos.x && unit.position.y === pos.y) {
                                // Only allow selecting own units
                                if (unit.ownerId !== store.playerId) {
                                    return; // Ignore clicks on opponent units
                                }
                                // Handle unit click - use unit instance ID for proper selection
                                if (store.selectedUnitId === unitInstanceId) {
                                    store.selectUnit(null);
                                }
                                else {
                                    store.selectUnit(unitInstanceId);
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
        this.input.on('pointermove', (pointer) => {
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
    }
    updateFromStore() {
        const state = useGameStore.getState().gameState;
        if (!state)
            return;
        this.drawGrid(state.board.width, state.board.height);
        this.drawUnits(state);
        this.drawHighlights();
        this.drawAbilityHighlights();
        this.drawDeploymentHighlights();
        this.drawAttackHighlights();
    }
    drawGrid(width, height) {
        if (!this.cellGraphics)
            return;
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
    drawUnits(state) {
        const activeUnitIds = new Set();
        // CRITICAL FIX: Use getVisibleUnits() to get ALL active units from ALL players
        const visibleUnits = VisibilityEngine.getVisibleUnits(state);
        // Debug logging to verify visibility system
        console.log('VISIBLE UNITS:', visibleUnits.map(u => ({
            id: u.card.id,
            owner: u.ownerId,
            color: u.color,
            position: { x: u.position.x, y: u.position.y }
        })));
        visibleUnits.forEach((unit) => {
            // Use unique instance ID to prevent sprite collision between players
            const unitInstanceId = `${unit.ownerId}-${unit.card.id}`;
            activeUnitIds.add(unitInstanceId);
            // Use actual unit positions (no perspective transformation needed)
            let displayPosition = unit.position;
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
    createUnitSprite(unit, color) {
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
    updateUnitSprite(container, unit, _color) {
        const hpBar = container.getData('hpBar');
        if (!hpBar)
            return;
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
    drawHighlights() {
        if (!this.highlightGraphics)
            return;
        this.highlightGraphics.clear();
        const validMoves = useGameStore.getState().validMoves;
        validMoves.forEach((pos) => {
            const px = pos.x * CELL_SIZE;
            const py = pos.y * CELL_SIZE;
            this.highlightGraphics.fillStyle(HIGHLIGHT_COLOR, 0.25);
            this.highlightGraphics.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
            this.highlightGraphics.lineStyle(2, HIGHLIGHT_COLOR, 0.7);
            this.highlightGraphics.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        });
    }
    drawAbilityHighlights() {
        if (!this.abilityHighlightGraphics)
            return;
        this.abilityHighlightGraphics.clear();
        const abilityTargets = useGameStore.getState().abilityTargets;
        if (abilityTargets.length === 0)
            return;
        // Blinking white outline: on/off flash using sine wave
        const wave = Math.sin(this.time.now / 250); // oscillates -1..1
        const visible = wave > -0.3; // visible ~75% of the time for a flash effect
        if (!visible)
            return;
        const strokeAlpha = 0.6 + (wave * 0.5 + 0.5) * 0.4; // 0.6..1.0
        abilityTargets.forEach((target) => {
            const px = target.position.x * CELL_SIZE;
            const py = target.position.y * CELL_SIZE;
            // Draw thick white outline around the unit cell (no fill)
            this.abilityHighlightGraphics.lineStyle(3, ABILITY_HIGHLIGHT_COLOR, strokeAlpha);
            this.abilityHighlightGraphics.strokeRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
        });
    }
    drawAttackHighlights() {
        if (!this.attackHighlightGraphics)
            return;
        this.attackHighlightGraphics.clear();
        const attackTargets = useGameStore.getState().attackTargets;
        if (attackTargets.length === 0)
            return;
        // Fast dramatic pulse: bright red fill + thick outline
        const wave = Math.sin(this.time.now / 150); // faster oscillation
        const pulse = wave * 0.5 + 0.5; // 0..1
        const fillAlpha = 0.15 + pulse * 0.3; // 0.15..0.45
        const strokeAlpha = 0.7 + pulse * 0.3; // 0.7..1.0
        attackTargets.forEach((target) => {
            const px = target.position.x * CELL_SIZE;
            const py = target.position.y * CELL_SIZE;
            // Red tinted fill so it's obvious
            this.attackHighlightGraphics.fillStyle(ATTACK_HIGHLIGHT_COLOR, fillAlpha);
            this.attackHighlightGraphics.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
            // Thick red outline
            this.attackHighlightGraphics.lineStyle(4, ATTACK_HIGHLIGHT_COLOR, strokeAlpha);
            this.attackHighlightGraphics.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        });
    }
    drawDeploymentHighlights() {
        if (!this.deploymentHighlightGraphics)
            return;
        this.deploymentHighlightGraphics.clear();
        const store = useGameStore.getState();
        const { deploymentModeActive, gameState } = store;
        if (!deploymentModeActive || !gameState)
            return;
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
    handleCellClick(pos) {
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
            store.exitAttackMode();
            store.clearAttackTargets();
            store.showMenuDuringMove();
        }
    }
    lastHoveredPos = null;
    handleCellHover(pos) {
        const store = useGameStore.getState();
        const state = store.gameState;
        // Draw yellow hover highlight on current cell
        this.drawHoverHighlight(pos, state);
        // Optimization: skip re-processing if the grid cell hasn't changed
        const isSameCell = this.lastHoveredPos &&
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
    drawHoverHighlight(pos, state) {
        if (!this.hoverHighlightGraphics)
            return;
        this.hoverHighlightGraphics.clear();
        if (!state)
            return;
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
//# sourceMappingURL=GameScene.js.map