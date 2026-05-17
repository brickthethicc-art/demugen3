import { useEffect, useRef, useState } from 'react';

import Phaser from 'phaser';

import { GameScene } from '../scenes/GameScene.js';

import { UnitActionMenu } from './UnitActionMenu.js';

const BOARD_CELL_SIZE_PX = 26;
const BOARD_GRID_SIZE = 23;
const BOARD_SIZE_PX = BOARD_GRID_SIZE * BOARD_CELL_SIZE_PX;



export function GameBoard() {
  console.log('GAME BOARD COMPONENT LOADED');

  const containerRef = useRef<HTMLDivElement>(null);

  const gameRef = useRef<Phaser.Game | null>(null);
  const phaserReadyRef = useRef(false);

  const [phaserError, setPhaserError] = useState<string | null>(null);
  const [phaserInitialized, setPhaserInitialized] = useState(false);

  useEffect(() => {
    console.log('GAME BOARD USE EFFECT RUNNING');
    console.log('INIT STATE VALUE:', phaserInitialized);
    console.log('Container ref:', containerRef.current);
    console.log('Game ref:', gameRef.current);

    if (!containerRef.current) {
      console.error('BLOCKING CONDITION: containerRef.current is null');
      return;
    }
    if (gameRef.current) {
      console.error('BLOCKING CONDITION: gameRef.current already exists - preventing re-initialization');
      return;
    }
    console.log('INITIALIZATION STARTED');

    let initTimeout: ReturnType<typeof setTimeout> | null = null;

    try {
      gameRef.current = new Phaser.Game({

        type: Phaser.AUTO,

        parent: containerRef.current,

        width: BOARD_SIZE_PX,

        height: BOARD_SIZE_PX,

        transparent: true,

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

      console.log('PHASER GAME OBJECT CREATED (not yet ready)');

      // Phaser 3 auto-starts immediately, but we need to wait for it to be fully ready
      // Use a short delay to ensure the game instance has booted before marking as initialized
      setTimeout(() => {
        console.log('PHASER INITIALIZATION DELAY COMPLETE');
        console.log('INITIALIZATION COMPLETE TRIGGERED');
        phaserReadyRef.current = true;
        setPhaserInitialized(true);
      }, 100);

      // Add a timeout to detect if Phaser fails to initialize silently
      const timeout = setTimeout(() => {
        if (!phaserReadyRef.current) {
          console.error('PHASER INITIALIZATION TIMEOUT - Phaser may have failed silently');
          console.log('INIT TIMEOUT — FORCED COMPLETE');
          setPhaserError('Phaser initialization timeout - game engine may have failed to start');
        }
      }, 5000);

      console.log('INIT TIMEOUT SCHEDULED: 100ms and 5000s');

      return () => {
        console.log('CLEANUP: Clearing timeouts and destroying Phaser game instance');
        if (initTimeout) clearTimeout(initTimeout);
        clearTimeout(timeout);
        gameRef.current?.destroy(true);
        gameRef.current = null;
      };
    } catch (error) {
      console.error('PHASER INITIALIZATION ERROR:', error);
      phaserReadyRef.current = true;
      setPhaserError(error instanceof Error ? error.message : 'Failed to initialize Phaser');
    }

  }, []);

  if (phaserError) {
    return (
      <div className="rounded-xl shadow-2xl border border-red-500 bg-red-900/30 p-8" style={{ width: `${BOARD_SIZE_PX}px`, height: `${BOARD_SIZE_PX}px` }}>
        <h2 className="text-xl font-bold text-red-400 mb-2">Game Board Error</h2>
        <p className="text-gray-300">{phaserError}</p>
      </div>
    );
  }

  return (
    <div className="relative" data-game-board-root="true">
      {/* containerRef div MUST always be rendered so the ref is populated when useEffect fires.
          Previously this div only existed after phaserInitialized=true, causing a deadlock where
          containerRef.current was always null and Phaser could never start. */}
      <div
        ref={containerRef}
        className="rounded-xl"
        style={{ width: `${BOARD_SIZE_PX}px`, height: `${BOARD_SIZE_PX}px` }}
      />

      {/* Loading overlay — shown on top while Phaser boots, removed once initialized */}
      {!phaserInitialized && (
        <div
          className="absolute inset-0 rounded-xl bg-mugen-bg flex items-center justify-center"
          style={{ width: `${BOARD_SIZE_PX}px`, height: `${BOARD_SIZE_PX}px` }}
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">Initializing Game Board...</h2>
            <p className="text-gray-400">Loading game engine</p>
          </div>
        </div>
      )}

      {phaserInitialized && <UnitActionMenu />}
    </div>
  );
}

