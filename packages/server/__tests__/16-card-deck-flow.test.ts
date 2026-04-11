import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState } from '../src/resolver/action-resolver.js';
import { setSelectedDeck, createLobby, joinLobby, setReady, startGame } from '../src/lobby/lobby-manager.js';
import { StartingPlacementEngine } from '@mugen/shared';
import type { Lobby } from '../src/lobby/lobby-manager.js';
import type { Card } from '@mugen/shared';

describe('16-Card Deck Flow Integration', () => {
  let lobby: Lobby;

  beforeEach(() => {
    // Create a fresh lobby for each test
    lobby = createLobby('host-1', 'HostPlayer');
    const joinResult = joinLobby(lobby, 'player-2', 'Player2');
    if (joinResult.ok) {
      lobby = joinResult.value;
    }
  });

  function create16CardDeck(): Card[] {
    return Array.from({ length: 16 }, (_, i) => ({
      id: `card-${i}`,
      name: `Test Card ${i}`,
      cardType: 'UNIT' as any,
      hp: 5,
      maxHp: 5,
      atk: 3,
      movement: 2,
      range: 1,
      ability: {
        id: `ability-${i}`,
        name: `Test Ability ${i}`,
        description: 'Test description',
        cost: 2,
        abilityType: 'DAMAGE' as any
      },
      cost: 3 + (i % 3) // Vary costs between 3-5
    }));
  }

  it('complete flow: 16-card deck selection -> game start -> 10-card main deck', () => {
    // Step 1: Players select 16-card decks
    const hostDeck = create16CardDeck();
    const playerDeck = create16CardDeck();

    // Step 2: Set selected decks in lobby
    const hostDeckResult = setSelectedDeck(lobby, 'host-1', hostDeck);
    expect(hostDeckResult.ok).toBe(true);
    if (hostDeckResult.ok) {
      lobby = hostDeckResult.value;
    }

    const playerDeckResult = setSelectedDeck(lobby, 'player-2', playerDeck);
    expect(playerDeckResult.ok).toBe(true);
    if (playerDeckResult.ok) {
      lobby = playerDeckResult.value;
    }

    // Step 3: Players set ready
    const hostReadyResult = setReady(lobby, 'host-1', true);
    expect(hostReadyResult.ok).toBe(true);
    if (hostReadyResult.ok) {
      lobby = hostReadyResult.value;
    }

    const playerReadyResult = setReady(lobby, 'player-2', true);
    expect(playerReadyResult.ok).toBe(true);
    if (playerReadyResult.ok) {
      lobby = playerReadyResult.value;
    }

    // Step 4: Start game (should validate 16-card decks)
    const startGameResult = startGame(lobby);
    expect(startGameResult.ok).toBe(true);
    if (!startGameResult.ok) return;

    lobby = startGameResult.value;
    expect(lobby.gameStarted).toBe(true);

    // Step 5: Create initial game state
    const gameStateResult = createInitialGameState(lobby);
    expect(gameStateResult.ok).toBe(true);
    if (!gameStateResult.ok) return;

    const gameState = gameStateResult.value;
    expect(gameState.phase).toBe('PRE_GAME');

    // Step 6: Verify 16-card deck data was transferred to game state
    expect(gameState.players).toHaveLength(2);
    
    const hostPlayer = gameState.players.find(p => p.id === 'host-1');
    const player2 = gameState.players.find(p => p.id === 'player-2');

    expect(hostPlayer).toBeDefined();
    expect(player2).toBeDefined();

    // Verify mainDeck contains 10 cards (16 - 6 field cards)
    expect(hostPlayer!.mainDeck.cards).toHaveLength(10);
    expect(player2!.mainDeck.cards).toHaveLength(10);
    expect(hostPlayer!.discardPile.cards).toHaveLength(0);
    expect(player2!.discardPile.cards).toHaveLength(0);

    // Step 7: Lock teams and initialize match
    // Simulate the confirm_starting_units flow - select 6 cards from the 16-card deck
    const { active, bench } = StartingPlacementEngine.assignActiveAndBenchUnits(hostDeck.slice(0, 6) as any);
    
    // Update host player's team
    const updatedPlayers = gameState.players.map(p =>
      p.id === 'host-1'
        ? { ...p, team: { activeUnits: active, reserveUnits: bench, locked: true } }
        : p
    );
    const updatedState = { ...gameState, players: updatedPlayers };

    // Do the same for player 2
    const { active: active2, bench: bench2 } = StartingPlacementEngine.assignActiveAndBenchUnits(playerDeck.slice(0, 6) as any);
    const finalPlayers = updatedState.players.map(p =>
      p.id === 'player-2'
        ? { ...p, team: { activeUnits: active2, reserveUnits: bench2, locked: true } }
        : p
    );
    const finalState = { ...updatedState, players: finalPlayers };

    // Step 8: Initialize match units
    const matchResult = StartingPlacementEngine.initializeMatchUnits(finalState);
    expect(matchResult.ok).toBe(true);
    if (!matchResult.ok) return;

    const matchState = matchResult.value;
    expect(matchState.phase).toBe('IN_PROGRESS');

    // Step 9: Verify 10-card deck data is preserved through match initialization
    const finalHostPlayer = matchState.players.find(p => p.id === 'host-1');
    const finalPlayer2 = matchState.players.find(p => p.id === 'player-2');

    expect(finalHostPlayer).toBeDefined();
    expect(finalPlayer2).toBeDefined();

    // Verify decks are preserved (same references)
    expect(finalHostPlayer!.mainDeck.cards).toBe(hostPlayer!.mainDeck.cards);
    expect(finalPlayer2!.mainDeck.cards).toBe(player2!.mainDeck.cards);
    
    // Verify deck lengths are preserved (10 cards after field cards are taken)
    expect(finalHostPlayer!.mainDeck.cards).toHaveLength(10);
    expect(finalPlayer2!.mainDeck.cards).toHaveLength(10);

    // Step 10: Verify units are properly initialized
    expect(finalHostPlayer!.units).toHaveLength(6); // 3 active + 3 bench
    expect(finalPlayer2!.units).toHaveLength(6);
    expect(finalHostPlayer!.team.locked).toBe(true);
    expect(finalPlayer2!.team.locked).toBe(true);
  });

  it('rejects game start with invalid 16-card deck sizes', () => {
    // Create partial decks (less than 16 cards)
    const partialDeck = create16CardDeck().slice(0, 12); // Only 12 cards

    // Set partial deck for host
    const hostDeckResult = setSelectedDeck(lobby, 'host-1', partialDeck);
    expect(hostDeckResult.ok).toBe(true);
    if (hostDeckResult.ok) {
      lobby = hostDeckResult.value;
    }

    // Set full deck for player 2
    const fullDeck = create16CardDeck();
    const playerDeckResult = setSelectedDeck(lobby, 'player-2', fullDeck);
    expect(playerDeckResult.ok).toBe(true);
    if (playerDeckResult.ok) {
      lobby = playerDeckResult.value;
    }

    // Set both players ready
    const hostReadyResult = setReady(lobby, 'host-1', true);
    if (hostReadyResult.ok) lobby = hostReadyResult.value;
    const playerReadyResult = setReady(lobby, 'player-2', true);
    if (playerReadyResult.ok) lobby = playerReadyResult.value;

    // Try to start game - should fail due to invalid deck size
    const startGameResult = startGame(lobby);
    expect(startGameResult.ok).toBe(false);
    if (!startGameResult.ok) {
      expect(startGameResult.error).toContain('exactly 16 cards');
      expect(startGameResult.error).toContain('has 12');
    }
  });

  it('validates all players have 16-card decks', () => {
    // Create valid 16-card decks
    const hostDeck = create16CardDeck();
    const playerDeck = create16CardDeck();

    // Set decks
    const hostDeckResult = setSelectedDeck(lobby, 'host-1', hostDeck);
    if (hostDeckResult.ok) lobby = hostDeckResult.value;
    const playerDeckResult = setSelectedDeck(lobby, 'player-2', playerDeck);
    if (playerDeckResult.ok) lobby = playerDeckResult.value;

    // Set ready
    const hostReadyResult = setReady(lobby, 'host-1', true);
    if (hostReadyResult.ok) lobby = hostReadyResult.value;
    const playerReadyResult = setReady(lobby, 'player-2', true);
    if (playerReadyResult.ok) lobby = playerReadyResult.value;

    // Start game should succeed
    const startGameResult = startGame(lobby);
    expect(startGameResult.ok).toBe(true);
    if (!startGameResult.ok) return;

    // Create game state should create 10-card main decks from 16-card selected decks
    const gameStateResult = createInitialGameState(startGameResult.value);
    expect(gameStateResult.ok).toBe(true);
    if (!gameStateResult.ok) return;

    const gameState = gameStateResult.value;
    // After initialization: 6 field cards + 10 main deck cards (from 16-card deck)
    expect(gameState.players[0]!.mainDeck.cards).toHaveLength(10);
    expect(gameState.players[1]!.mainDeck.cards).toHaveLength(10);
    expect(gameState.players[0]!.discardPile.cards).toHaveLength(0);
    expect(gameState.players[1]!.discardPile.cards).toHaveLength(0);
  });

  it('handles empty deck case gracefully', () => {
    // Don't set any decks (they will be empty)

    // Set players ready
    const hostReadyResult = setReady(lobby, 'host-1', true);
    if (hostReadyResult.ok) lobby = hostReadyResult.value;
    const playerReadyResult = setReady(lobby, 'player-2', true);
    if (playerReadyResult.ok) lobby = playerReadyResult.value;

    // Try to start game - should fail due to empty decks
    const startGameResult = startGame(lobby);
    expect(startGameResult.ok).toBe(false);
    if (!startGameResult.ok) {
      expect(startGameResult.error).toContain('exactly 16 cards');
      expect(startGameResult.error).toContain('has 0');
    }
  });
});
