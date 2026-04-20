import Phaser from 'phaser';
export declare class GameScene extends Phaser.Scene {
    private cellGraphics;
    private unitSprites;
    private highlightGraphics;
    private hoverHighlightGraphics;
    private abilityHighlightGraphics;
    private attackHighlightGraphics;
    private deploymentHighlightGraphics;
    private lastState;
    private lastValidMoves;
    private lastAbilityTargets;
    private lastAttackTargets;
    constructor();
    create(): void;
    update(): void;
    private updateFromStore;
    private drawGrid;
    private drawUnits;
    private createUnitSprite;
    private updateUnitSprite;
    private drawHighlights;
    private drawAbilityHighlights;
    private drawAttackHighlights;
    private drawDeploymentHighlights;
    private handleCellClick;
    private lastHoveredPos;
    private handleCellHover;
    private drawHoverHighlight;
}
//# sourceMappingURL=GameScene.d.ts.map