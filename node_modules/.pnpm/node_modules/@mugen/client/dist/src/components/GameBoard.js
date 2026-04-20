import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene.js';
import { UnitActionMenu } from './UnitActionMenu.js';
export function GameBoard() {
    const containerRef = useRef(null);
    const gameRef = useRef(null);
    useEffect(() => {
        if (!containerRef.current || gameRef.current)
            return;
        gameRef.current = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: 23 * 32,
            height: 23 * 32,
            backgroundColor: '#0f0f1a',
            scene: [GameScene],
            scale: {
                mode: Phaser.Scale.NONE,
                autoCenter: Phaser.Scale.NO_CENTER,
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false,
                },
            },
            fps: {
                target: 60,
                forceSetTimeOut: true,
            },
        });
        return () => {
            gameRef.current?.destroy(true);
            gameRef.current = null;
        };
    }, []);
    return (_jsxs("div", { className: "relative", children: [_jsx("div", { ref: containerRef, className: "rounded-xl shadow-2xl border border-white/5", style: { width: '736px', height: '736px' } }), _jsx(UnitActionMenu, {})] }));
}
//# sourceMappingURL=GameBoard.js.map