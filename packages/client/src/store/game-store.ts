import { create } from 'zustand';
import type { GameState, Position, Card, UnitInstance, UnitCard } from '@mugen/shared';
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
  validMoves: Position[];
  hoveredCard: Card | null;
  activeUnits: UnitInstance[];
  benchUnits: UnitCard[];
  mainDeck: Card[];
  discardPile: Card[];
  error: string | null;

  // Actions
  setPlayerId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setLobbyCode: (code: string | null) => void;
  setScreen: (screen: Screen) => void;
  setLobbyPlayers: (players: { id: string; name: string; isReady: boolean }[]) => void;
  setGameState: (state: GameState) => void;
  selectUnit: (unitId: string | null) => void;
  setValidMoves: (moves: Position[]) => void;
  clearValidMoves: () => void;
  setSelectedDeck: (deck: Card[] | null) => void;
  setStartingUnits: (units: UnitCard[]) => void;
  confirmStartingUnits: () => void;
  setHoveredCard: (card: Card | null) => void;
  clearHoveredCard: () => void;
  setActiveUnits: (units: UnitInstance[]) => void;
  setBenchUnits: (units: UnitCard[]) => void;
  setMainDeck: (cards: Card[]) => void;
  setDiscardPile: (cards: Card[]) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
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
  validMoves: [],
  hoveredCard: null,
  activeUnits: [],
  benchUnits: [],
  mainDeck: [],
  discardPile: [],
  error: null,
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
    }
  },
  selectUnit: (unitId) => set({ selectedUnitId: unitId }),
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
    setHoveredCard: (card) => set({ hoveredCard: card }),
  clearHoveredCard: () => set({ hoveredCard: null }),
  setActiveUnits: (units) => set({ activeUnits: units }),
  setBenchUnits: (units) => set({ benchUnits: units }),
  setMainDeck: (cards) => set({ mainDeck: cards }),
  setDiscardPile: (cards) => set({ discardPile: cards }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}));
