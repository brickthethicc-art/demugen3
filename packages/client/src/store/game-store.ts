import { create } from 'zustand';
import type { GameState, Position, Card, UnitInstance, UnitCard } from '@mugen/shared';
import type { AbilityTarget } from '@mugen/shared/src/engines/ability/index.js';
import type { AttackTarget } from '@mugen/shared/src/engines/combat/index.js';
import { MAX_HAND_SIZE } from '@mugen/shared';
import { getVisibleUnits } from '@mugen/shared/src/engines/visibility/index.js';

export type Screen = 'main-menu' | 'deck-builder' | 'card-library' | 'deck-select' | 'lobby' | 'pregame' | 'game' | 'gameover';

export interface GameStore {
  // Connection
  playerId: string | null;
  playerName: string;
  lobbyCode: string | null;
  screen: Screen;

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

  // Queue/Ready state
  isPlayerReady: boolean;
  readyPlayersCount: number;
  totalPlayersCount: number;
  isWaitingForOthers: boolean;

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setLobbyCode: (code: string | null) => void;
  setScreen: (screen: Screen) => void;
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
  setQueueStatus: (isReady: boolean, readyCount: number, totalCount: number, waiting: boolean) => void;
  reset: () => void;
}

const initialState = {
  playerId: null,
  playerName: '',
  lobbyCode: null,
  screen: 'main-menu' as Screen,
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
  isPlayerReady: false,
  readyPlayersCount: 0,
  totalPlayersCount: 0,
  isWaitingForOthers: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setLobbyCode: (code) => set({ lobbyCode: code }),
  setScreen: (screen) => set({ screen }),
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),
  setGameState: (state) => {
    console.log('GameStore: setGameState called with:', state?.phase);
    console.log('GameStore: playerId:', get().playerId);
    
    // Clear selected deck when transitioning to IN_PROGRESS phase (game actually starts)
    const currentScreen = get().screen;
    if (state && state.phase === 'IN_PROGRESS' && currentScreen === 'pregame') {
      set({ selectedDeck: null });
    }
    
    set({ gameState: state });
    
    // Sync active and bench units from server-authoritative state
    const playerId = get().playerId;
    if (state && playerId) {
      // activeUnits = ONLY visible active units on board (filtered by getVisibleUnits)
      const visibleActiveUnits = getVisibleUnits(state);
      
      // benchUnits = local player's reserve units only
      const currentPlayer = state.players.find(p => p.id === playerId);
      const bench = currentPlayer ? currentPlayer.team.reserveUnits : [];
      
      console.log('GameStore: Setting activeUnits from getVisibleUnits:', visibleActiveUnits.length);
      console.log('GameStore: Bench units for local player:', bench.length);
      
      // Sync mainDeck and discardPile from server state
      const playerMainDeck = currentPlayer?.mainDeck?.cards ?? [];
      const playerDiscardPile = currentPlayer?.discardPile?.cards ?? [];

      console.log('GameStore: currentPlayer mainDeck:', currentPlayer?.mainDeck);
      console.log('GameStore: Setting mainDeck with cards:', playerMainDeck.length);

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
    }
  },
  selectUnit: (unitId) => set({ selectedUnitId: unitId, moveModeActive: false, menuHiddenDuringMove: false, validMoves: [], abilityModeActive: false, abilityTargets: [], attackModeActive: false, attackTargets: [] }),
  enterMoveMode: () => set({ moveModeActive: true, abilityModeActive: false, abilityTargets: [], attackModeActive: false, attackTargets: [] }),
  exitMoveMode: () => set({ moveModeActive: false, menuHiddenDuringMove: false, validMoves: [] }),
  enterAbilityMode: () => set({ abilityModeActive: true, moveModeActive: false, validMoves: [], attackModeActive: false, attackTargets: [] }),
  exitAbilityMode: () => set({ abilityModeActive: false, abilityTargets: [] }),
  setAbilityTargets: (targets) => set({ abilityTargets: targets }),
  clearAbilityTargets: () => set({ abilityTargets: [] }),
  enterAttackMode: () => set({ attackModeActive: true, moveModeActive: false, validMoves: [], abilityModeActive: false, abilityTargets: [] }),
  exitAttackMode: () => set({ attackModeActive: false, attackTargets: [] }),
  setAttackTargets: (targets) => set({ attackTargets: targets }),
  clearAttackTargets: () => set({ attackTargets: [] }),
  enterDeploymentMode: (benchUnit) => set({ 
    deploymentModeActive: true, 
    selectedBenchUnit: benchUnit,
    moveModeActive: false, 
    abilityModeActive: false, 
    abilityTargets: [], 
    attackModeActive: false, 
    attackTargets: [],
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
    console.log('=== DEBUG: Client setSelectedDeck ===');
    console.log('Setting selected deck with', deck?.length || 0, 'cards');
    if (deck && deck.length > 0) {
      console.log('First card:', deck[0]);
    }
    
    set({ selectedDeck: deck });
    // Send selected deck to server
    if (deck) {
      console.log('Sending deck to server...');
      import('../network/socket-client.js').then(({ setSelectedDeck: sendDeck }) => {
        console.log('About to send deck to server:', deck.length, 'cards');
        sendDeck(deck);
        console.log('Deck sent to server');
      });
    } else {
      console.log('No deck to send to server');
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
    console.log('Confirming starting units:', startingUnits);
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
  setQueueStatus: (isReady, readyCount, totalCount, waiting) => set({ 
    isPlayerReady: isReady, 
    readyPlayersCount: readyCount, 
    totalPlayersCount: totalCount, 
    isWaitingForOthers: waiting 
  }),
  reset: () => set(initialState),
}));
