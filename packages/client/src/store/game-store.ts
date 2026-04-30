import { create } from 'zustand';
import type { GameState, Position, Card, UnitInstance, UnitCard } from '@mugen/shared';
import type { AbilityTarget } from '@mugen/shared/src/engines/ability/index.js';
import type { AttackTarget } from '@mugen/shared/src/engines/combat/index.js';
import { MAX_HAND_SIZE } from '@mugen/shared';
import { getVisibleUnits } from '@mugen/shared/src/engines/visibility/index.js';
import { shouldTriggerStandbyPhase } from '@mugen/shared/src/engines/standby/index.js';
import { diffAndLog } from '../utils/game-log.js';

export type Screen = 'main-menu' | 'deck-builder' | 'card-library' | 'deck-select' | 'lobby' | 'pregame' | 'game' | 'gameover';

const MOBILE_UI_SESSION_KEY = 'mugen-mobile-ui-mode';

function readInitialMobileUiMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(MOBILE_UI_SESSION_KEY) === '1';
}

function persistMobileUiMode(enabled: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(MOBILE_UI_SESSION_KEY, enabled ? '1' : '0');
}

export interface GameStore {
  // Connection
  playerId: string | null;
  playerName: string;
  lobbyCode: string | null;
  screen: Screen;

  // Game initialization lock
  isGameInitialized: boolean;

  // UI mode
  mobileUiMode: boolean;

  // Lobby
  lobbyPlayers: { id: string; name: string; isReady: boolean }[];

  // Deck selection
  selectedDeck: Card[] | null;
  startingUnits: UnitCard[];

  // Game state
  gameState: GameState | null;
  selectedUnitId: string | null;
  moveModeActive: boolean;
  menuHiddenDuringMove: boolean;
  validMoves: Position[];
  abilityModeActive: boolean;
  abilityTargets: AbilityTarget[];
  attackModeActive: boolean;
  attackTargets: AttackTarget[];
  deploymentModeActive: boolean;
  sorceryModeActive: boolean;
  selectedSorceryCard: Card | null;
  sorceryRequiresTarget: boolean;
  sorceryFirstTarget: string | null; // For two-target sorceries like Dimensional Swap
  selectedBenchUnit: UnitCard | null;
  hoveredCard: Card | null;
  hoveredUnitInstance: UnitInstance | null;
  activeUnits: UnitInstance[];
  benchUnits: UnitCard[];
  mainDeck: Card[];
  discardPile: Card[];
  error: string | null;

  // Hand limit enforcement
  handLimitNotification: boolean;
  handLimitModalOpen: boolean;

  // Standby deploy modal
  standbyModalNotification: boolean;
  standbyModalOpen: boolean;
  standbyModalDismissed: boolean;
  canSelectBenchUnits: boolean;

  // Summon to bench modal
  summonModalOpen: boolean;

  // Player defeat modal
  playerDefeatedModalOpen: boolean;
  isSpectating: boolean;

  // Queue/Ready state
  isPlayerReady: boolean;
  readyPlayersCount: number;
  totalPlayersCount: number;
  isWaitingForOthers: boolean;

  // Game log
  gameLogs: string[];

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setLobbyCode: (code: string | null) => void;
  setScreen: (screen: Screen) => void;
  setMobileUiMode: (enabled: boolean) => void;
  toggleMobileUiMode: () => void;
  setLobbyPlayers: (players: { id: string; name: string; isReady: boolean }[]) => void;
  setGameState: (state: GameState) => void;
  selectUnit: (unitId: string | null) => void;
  enterMoveMode: () => void;
  exitMoveMode: () => void;
  hideMenuDuringMove: () => void;
  showMenuDuringMove: () => void;
  setValidMoves: (moves: Position[]) => void;
  clearValidMoves: () => void;
  enterAbilityMode: () => void;
  exitAbilityMode: () => void;
  setAbilityTargets: (targets: AbilityTarget[]) => void;
  clearAbilityTargets: () => void;
  enterAttackMode: () => void;
  exitAttackMode: () => void;
  setAttackTargets: (targets: AttackTarget[]) => void;
  clearAttackTargets: () => void;
  enterSorceryMode: (card: Card, requiresTarget: boolean) => void;
  exitSorceryMode: () => void;
  setSelectedSorceryCard: (card: Card | null) => void;
  setSorceryFirstTarget: (target: string | null) => void;
  enterDeploymentMode: (benchUnit: UnitCard) => void;
  exitDeploymentMode: () => void;
  setSelectedBenchUnit: (unit: UnitCard | null) => void;
  setSelectedDeck: (deck: Card[] | null) => void;
  setStartingUnits: (units: UnitCard[]) => void;
  confirmStartingUnits: () => void;
  setHoveredCard: (card: Card | null, unitInstance?: UnitInstance | null) => void;
  clearHoveredCard: () => void;
  setActiveUnits: (units: UnitInstance[]) => void;
  setBenchUnits: (units: UnitCard[]) => void;
  setMainDeck: (cards: Card[]) => void;
  setDiscardPile: (cards: Card[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  showHandLimitNotification: () => void;
  openHandLimitModal: () => void;
  closeHandLimitModal: () => void;
  showStandbyNotification: () => void;
  openStandbyModal: () => void;
  closeStandbyModal: () => void;
  resetStandbyModal: () => void;
  setCanSelectBenchUnits: (canSelect: boolean) => void;
  openSummonModal: () => void;
  closeSummonModal: () => void;
  openPlayerDefeatedModal: () => void;
  closePlayerDefeatedModal: () => void;
  setSpectating: (spectating: boolean) => void;
  setQueueStatus: (isReady: boolean, readyCount: number, totalCount: number, waiting: boolean) => void;
  addGameLog: (message: string) => void;
  reset: () => void;
}

const initialState = {
  playerId: null,
  playerName: '',
  lobbyCode: null,
  screen: 'main-menu' as Screen,
  isGameInitialized: false,
  mobileUiMode: readInitialMobileUiMode(),
  lobbyPlayers: [],
  selectedDeck: null,
  startingUnits: [],
  gameState: null,
  selectedUnitId: null,
  moveModeActive: false,
  menuHiddenDuringMove: false,
  validMoves: [],
  abilityModeActive: false,
  abilityTargets: [],
  attackModeActive: false,
  attackTargets: [],
  deploymentModeActive: false,
  sorceryModeActive: false,
  selectedSorceryCard: null,
  sorceryRequiresTarget: false,
  sorceryFirstTarget: null,
  selectedBenchUnit: null,
  hoveredCard: null,
  hoveredUnitInstance: null,
  activeUnits: [],
  benchUnits: [],
  mainDeck: [],
  discardPile: [],
  error: null,
  handLimitNotification: false,
  handLimitModalOpen: false,
  standbyModalNotification: false,
  standbyModalOpen: false,
  standbyModalDismissed: false,
  canSelectBenchUnits: false,
  summonModalOpen: false,
  playerDefeatedModalOpen: false,
  isSpectating: false,
  isPlayerReady: false,
  readyPlayersCount: 0,
  totalPlayersCount: 0,
  isWaitingForOthers: false,
  gameLogs: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setLobbyCode: (code) => set({ lobbyCode: code }),
  setScreen: (screen) => set({ screen }),
  setMobileUiMode: (enabled) => {
    persistMobileUiMode(enabled);
    set({ mobileUiMode: enabled });
  },
  toggleMobileUiMode: () => {
    const nextMode = !get().mobileUiMode;
    persistMobileUiMode(nextMode);
    set({ mobileUiMode: nextMode });
  },
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),
  addGameLog: (message) => set((s) => ({ gameLogs: [...s.gameLogs, message] })),

  setGameState: (state) => {
    const playerId = get().playerId;
    const prevGameState = get().gameState;

    if (!state) {
      set({ gameState: null, screen: 'main-menu' });
      return;
    }

    // Clear selected deck when transitioning to IN_PROGRESS phase (game actually starts)
    const currentScreen = get().screen;
    if (state && state.phase === 'IN_PROGRESS' && currentScreen === 'pregame') {
      set({ selectedDeck: null });
    }

    // CRITICAL: Populate selectedDeck from game state if it's null and we're in PRE_GAME phase
    // This ensures the deck is available for unit selection when the game starts
    if (state.phase === 'PRE_GAME' && playerId) {
      const currentPlayer = state.players.find(p => p.id === playerId);
      if (currentPlayer) {
        // Try multiple sources for the deck data
        let deckCards: any[] = [];
        
        // First try deck.cards (where it's stored during PRE_GAME)
        if (currentPlayer.deck && currentPlayer.deck.cards.length > 0) {
          deckCards = currentPlayer.deck.cards;
        }
        // Fallback to mainDeck.cards (where it might be after initialization)
        else if (currentPlayer.mainDeck && currentPlayer.mainDeck.cards.length > 0) {
          deckCards = currentPlayer.mainDeck.cards;
        }
        
        if (deckCards.length > 0) {
          set({ selectedDeck: deckCards });
        }
      }
    }

    // CRITICAL: Automatically set screen based on game phase to prevent blank screen
    let newScreen = currentScreen;
    if (state.phase === 'IN_PROGRESS' && currentScreen !== 'game') {
      newScreen = 'game';
    } else if (state.phase === 'PRE_GAME' && currentScreen !== 'pregame') {
      newScreen = 'pregame';
    } else if (state.phase === 'ENDED' && currentScreen !== 'game') {
      newScreen = 'game';
    }

    // Log initial board state on first IN_PROGRESS transition
    if (state.phase === 'IN_PROGRESS' && (!prevGameState || prevGameState.phase !== 'IN_PROGRESS')) {
      get().addGameLog('[GAME STARTED]');
      for (const player of state.players) {
        const label = `[${player.name.toUpperCase()}]`;
        for (const unit of player.team.activeUnits) {
          get().addGameLog(`${label}: ${unit.name.toUpperCase()} HAS BEEN DEPLOYED TO THE FIELD`);
        }
      }
    }

    set({ gameState: state, screen: newScreen });

    // Sync active and bench units from server-authoritative state
    if (state && playerId) {
      // Exit sorcery mode if phase changes away from ABILITY or it's no longer our turn
      const isLocalPlayersTurnForSorcery = state.players[state.currentPlayerIndex]?.id === playerId;
      if (get().sorceryModeActive && (state.turnPhase !== 'ABILITY' || !isLocalPlayersTurnForSorcery)) {
        get().exitSorceryMode();
        get().setError(null);
      }

      // FAILSAFE: Validate and correct only obvious initialization anomalies.
      // Never overwrite legitimate elimination/life updates after initialization.
      const isGameInitialized = get().isGameInitialized;
      const validatedPlayers = state.players.map(p => {
        if (p.life === undefined || p.life === null || Number.isNaN(p.life)) {
          return { ...p, life: 24, isEliminated: false };
        }

        if (!isGameInitialized && state.turnNumber === 1) {
          if (p.life <= 0) {
            return { ...p, life: 24, isEliminated: false };
          }
          if (p.isEliminated) {
            return { ...p, isEliminated: false };
          }
        }

        return p;
      });

      // Update state with validated players if corrections were made
      if (validatedPlayers.some((p, i) => p.life !== state.players[i]?.life || p.isEliminated !== state.players[i]?.isEliminated)) {
        state = { ...state, players: validatedPlayers };
      }

      // Centralized deterministic game log: diff previous vs current state
      if (prevGameState && prevGameState.phase === 'IN_PROGRESS' && state.phase === 'IN_PROGRESS') {
        diffAndLog(prevGameState, state, (msg) => get().addGameLog(msg));
      }

      // CRITICAL: Use the corrected state for all subsequent operations
      // activeUnits = ONLY visible active units on board (filtered by getVisibleUnits)
      const visibleActiveUnits = getVisibleUnits(state);

      // benchUnits = local player's reserve units only
      const currentPlayer = state.players.find(p => p.id === playerId);
      const bench = currentPlayer ? currentPlayer.team.reserveUnits : [];
      
      // Sync mainDeck and discardPile from server state
      const playerMainDeck = currentPlayer?.mainDeck?.cards ?? [];
      const playerDiscardPile = currentPlayer?.discardPile?.cards ?? [];

      set({ 
        activeUnits: visibleActiveUnits,
        benchUnits: bench,
        mainDeck: playerMainDeck,
        discardPile: playerDiscardPile,
      });

      // Hand limit detection: trigger notification → modal flow
      const handSize = currentPlayer?.hand.cards.length ?? 0;
      if (handSize > MAX_HAND_SIZE && !get().handLimitModalOpen && !get().handLimitNotification) {
        set({ handLimitNotification: true });
      }

      // Standby deploy modal: show ONLY when it is the LOCAL player's turn
      // and they enter standby with fewer than 3 of THEIR OWN active units.
      // Each player (1–4) has separate units; never count other players' units.
      const isMyTurn = state.players[state.currentPlayerIndex]?.id === playerId;
      if (state.turnPhase === 'STANDBY' && isMyTurn && currentPlayer) {
        const myActiveOnBoard = currentPlayer.units.filter(u =>
          u.position !== null &&
          u.position!.x >= 0 &&
          u.position!.x < state.board.width &&
          u.position!.y >= 0 &&
          u.position!.y < state.board.height
        ).length;
        const hasBench = currentPlayer.team.reserveUnits.length > 0;
        if (myActiveOnBoard < 3 && hasBench && !get().standbyModalNotification && !get().standbyModalOpen && !get().standbyModalDismissed) {
          set({ standbyModalNotification: true }); // Trigger notification first
        }
        // Check if summon-to-bench step is available (step 3 of standby)
        const standbyStatus = shouldTriggerStandbyPhase(currentPlayer, state.board.width, state.board.height);
        if (standbyStatus.canSummonToBench && !get().summonModalOpen) {
          // Only show summon modal after standby deploy is resolved
          if (!standbyStatus.needsBenchDeployment && !standbyStatus.needsHandDiscard) {
            set({ summonModalOpen: true });
          }
        }
      } else if (state.turnPhase !== 'STANDBY' || !isMyTurn) {
        // Reset standby modal state when leaving standby phase or when it's not our turn
        if (get().standbyModalNotification || get().standbyModalOpen || get().standbyModalDismissed) {
          set({ standbyModalNotification: false, standbyModalOpen: false, standbyModalDismissed: false, canSelectBenchUnits: false });
        }
        // Reset summon modal state
        if (get().summonModalOpen) {
          set({ summonModalOpen: false });
        }
      }

      // Player defeat detection: show modal when local player is eliminated
      // INITIALIZATION LOCK: Only check for defeat after game is fully initialized
      const shouldMarkInitialized = state.phase === 'IN_PROGRESS' && state.turnNumber === 1 && !get().isGameInitialized;
      if (shouldMarkInitialized) {
        set({ isGameInitialized: true });
      }

      // SAFEGUARD: Never show defeat modal if game is not yet initialized
      if (!get().isGameInitialized && currentPlayer?.isEliminated) {
        const correctedPlayers = state.players.map(p =>
          p.id === currentPlayer.id ? { ...p, isEliminated: false, life: p.life > 0 ? p.life : 24 } : p
        );
        set({ gameState: { ...state, players: correctedPlayers } });
        return; // Exit early to prevent modal from showing
      }

      // Additional safeguard: Never show defeat modal on turn 1 regardless of phase
      if (state.turnNumber === 1 && currentPlayer?.isEliminated) {
        const correctedPlayers = state.players.map(p =>
          p.id === currentPlayer.id ? { ...p, isEliminated: false, life: p.life > 0 ? p.life : 24 } : p
        );
        set({ gameState: { ...state, players: correctedPlayers } });
        return; // Exit early to prevent modal from showing
      }

      if (currentPlayer && currentPlayer.isEliminated && !get().playerDefeatedModalOpen && get().isGameInitialized) {
        set({ playerDefeatedModalOpen: true });
      }
    }
  },
  selectUnit: (unitId) => set({ selectedUnitId: unitId, moveModeActive: false, menuHiddenDuringMove: false, validMoves: [], abilityModeActive: false, abilityTargets: [], attackModeActive: false, attackTargets: [], sorceryModeActive: false, selectedSorceryCard: null, sorceryRequiresTarget: false, sorceryFirstTarget: null }),
  enterMoveMode: () => set({ moveModeActive: true, abilityModeActive: false, abilityTargets: [], attackModeActive: false, attackTargets: [], sorceryModeActive: false, selectedSorceryCard: null, sorceryRequiresTarget: false, sorceryFirstTarget: null }),
  exitMoveMode: () => set({ moveModeActive: false, menuHiddenDuringMove: false, validMoves: [] }),
  enterAbilityMode: () => set({ abilityModeActive: true, moveModeActive: false, validMoves: [], attackModeActive: false, attackTargets: [], sorceryModeActive: false, selectedSorceryCard: null, sorceryRequiresTarget: false, sorceryFirstTarget: null }),
  exitAbilityMode: () => set({ abilityModeActive: false, abilityTargets: [] }),
  setAbilityTargets: (targets) => set({ abilityTargets: targets }),
  clearAbilityTargets: () => set({ abilityTargets: [] }),
  enterAttackMode: () => set({ attackModeActive: true, moveModeActive: false, validMoves: [], abilityModeActive: false, abilityTargets: [], sorceryModeActive: false, selectedSorceryCard: null, sorceryRequiresTarget: false, sorceryFirstTarget: null }),
  exitAttackMode: () => set({ attackModeActive: false, attackTargets: [] }),
  setAttackTargets: (targets) => set({ attackTargets: targets }),
  clearAttackTargets: () => set({ attackTargets: [] }),
  enterSorceryMode: (card: Card, requiresTarget: boolean) => set({
    sorceryModeActive: true,
    selectedSorceryCard: card,
    sorceryRequiresTarget: requiresTarget,
    sorceryFirstTarget: null,
    moveModeActive: false,
    validMoves: [],
    abilityModeActive: false,
    abilityTargets: [],
    attackModeActive: false,
    attackTargets: [],
    deploymentModeActive: false,
    selectedBenchUnit: null,
    selectedUnitId: null,
  }),
  exitSorceryMode: () => set({
    sorceryModeActive: false,
    selectedSorceryCard: null,
    sorceryRequiresTarget: false,
    sorceryFirstTarget: null,
  }),
  setSelectedSorceryCard: (card: Card | null) => set({ selectedSorceryCard: card }),
  setSorceryFirstTarget: (target: string | null) => set({ sorceryFirstTarget: target }),
  enterDeploymentMode: (benchUnit) => set({ 
    deploymentModeActive: true, 
    selectedBenchUnit: benchUnit,
    moveModeActive: false, 
    abilityModeActive: false, 
    abilityTargets: [], 
    attackModeActive: false, 
    attackTargets: [],
    sorceryModeActive: false,
    selectedSorceryCard: null,
    sorceryRequiresTarget: false,
    sorceryFirstTarget: null,
    selectedUnitId: null,
    validMoves: []
  }),
  exitDeploymentMode: () => set({ deploymentModeActive: false, selectedBenchUnit: null }),
  setSelectedBenchUnit: (unit) => set({ selectedBenchUnit: unit }),
  hideMenuDuringMove: () => set({ menuHiddenDuringMove: true }),
  showMenuDuringMove: () => set({ menuHiddenDuringMove: false }),
  setValidMoves: (moves) => set({ validMoves: moves }),
  clearValidMoves: () => set({ validMoves: [] }),
  setSelectedDeck: (deck) => {
    set({ selectedDeck: deck });
    // Send selected deck to server
    if (deck) {
      import('../network/socket-client.js').then(({ setSelectedDeck: sendDeck }) => {
        sendDeck(deck);
      });
    }
  },
  setStartingUnits: (units) => set({ startingUnits: units }),
  confirmStartingUnits: () => {
    const { startingUnits } = get();
    
    // Validate selection (redundant with UI validation but safe)
    if (startingUnits.length !== 6) {
      set({ error: 'Must select exactly 6 units' });
      return;
    }
    
    const totalCost = startingUnits.reduce((sum, unit) => sum + unit.cost, 0);
    if (totalCost >= 40) {
      set({ error: 'Total cost must be less than 40' });
      return;
    }
    
    // Send to server for actual game initialization
    import('../network/socket-client.js').then(({ confirmStartingUnits }) => {
      confirmStartingUnits(startingUnits);
    });
  },
    setHoveredCard: (card, unitInstance) => set({ hoveredCard: card, hoveredUnitInstance: unitInstance ?? null }),
  clearHoveredCard: () => set({ hoveredCard: null, hoveredUnitInstance: null }),
  setActiveUnits: (units) => set({ activeUnits: units }),
  setBenchUnits: (units) => set({ benchUnits: units }),
  setMainDeck: (cards) => set({ mainDeck: cards }),
  setDiscardPile: (cards) => set({ discardPile: cards }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  showHandLimitNotification: () => set({ handLimitNotification: true }),
  openHandLimitModal: () => set({ handLimitNotification: false, handLimitModalOpen: true }),
  closeHandLimitModal: () => set({ handLimitModalOpen: false }),
  showStandbyNotification: () => set({ standbyModalNotification: true, standbyModalOpen: false, standbyModalDismissed: false, canSelectBenchUnits: false }),
  openStandbyModal: () => set({ standbyModalNotification: false, standbyModalOpen: true, standbyModalDismissed: false, canSelectBenchUnits: false }),
  closeStandbyModal: () => set({
    standbyModalOpen: false,
    standbyModalDismissed: true,
    canSelectBenchUnits: true // Enable bench unit selection after modal is dismissed
  }),
  resetStandbyModal: () => set({ standbyModalOpen: false, standbyModalDismissed: false, canSelectBenchUnits: false }),
  setCanSelectBenchUnits: (canSelect) => set({ canSelectBenchUnits: canSelect }),
  openSummonModal: () => set({ summonModalOpen: true }),
  closeSummonModal: () => set({ summonModalOpen: false }),
  openPlayerDefeatedModal: () => set({ playerDefeatedModalOpen: true }),
  closePlayerDefeatedModal: () => set({ playerDefeatedModalOpen: false }),
  setSpectating: (spectating) => set({ isSpectating: spectating }),
  setQueueStatus: (isReady, readyCount, totalCount, waiting) => set({ 
    isPlayerReady: isReady, 
    readyPlayersCount: readyCount, 
    totalPlayersCount: totalCount, 
    isWaitingForOthers: waiting 
  }),
  reset: () => set({ ...initialState, mobileUiMode: readInitialMobileUiMode() }),
}));
