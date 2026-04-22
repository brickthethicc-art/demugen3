import { create } from 'zustand';
import { MAX_HAND_SIZE } from '@mugen/shared';
import { getVisibleUnits } from '@mugen/shared/src/engines/visibility/index.js';
const initialState = {
    playerId: null,
    playerName: '',
    lobbyCode: null,
    screen: 'main-menu',
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
    standbyModalNotification: false,
    standbyModalOpen: false,
    standbyModalDismissed: false,
    canSelectBenchUnits: false,
    isPlayerReady: false,
    readyPlayersCount: 0,
    totalPlayersCount: 0,
    isWaitingForOthers: false,
};
export const useGameStore = create((set, get) => ({
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
            // Standby deploy modal: show ONLY when it is the LOCAL player's turn
            // and they enter standby with fewer than 3 of THEIR OWN active units.
            // Each player (1–4) has separate units; never count other players' units.
            const isMyTurn = state.players[state.currentPlayerIndex]?.id === playerId;
            if (state.turnPhase === 'STANDBY' && isMyTurn && currentPlayer) {
                const myActiveOnBoard = currentPlayer.units.filter(u => u.position !== null &&
                    u.position.x >= 0 &&
                    u.position.x < state.board.width &&
                    u.position.y >= 0 &&
                    u.position.y < state.board.height).length;
                const hasBench = currentPlayer.team.reserveUnits.length > 0;
                if (myActiveOnBoard < 3 && hasBench && !get().standbyModalNotification && !get().standbyModalOpen && !get().standbyModalDismissed) {
                    set({ standbyModalNotification: true }); // Trigger notification first
                }
            }
            else if (state.turnPhase !== 'STANDBY' || !isMyTurn) {
                // Reset standby modal state when leaving standby phase or when it's not our turn
                if (get().standbyModalNotification || get().standbyModalOpen || get().standbyModalDismissed) {
                    set({ standbyModalNotification: false, standbyModalOpen: false, standbyModalDismissed: false, canSelectBenchUnits: false });
                }
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
        }
        else {
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
    showStandbyNotification: () => set({ standbyModalNotification: true, standbyModalOpen: false, standbyModalDismissed: false, canSelectBenchUnits: false }),
    openStandbyModal: () => set({ standbyModalNotification: false, standbyModalOpen: true, standbyModalDismissed: false, canSelectBenchUnits: false }),
    closeStandbyModal: () => set({
        standbyModalOpen: false,
        standbyModalDismissed: true,
        canSelectBenchUnits: true // Enable bench unit selection after modal is dismissed
    }),
    resetStandbyModal: () => set({ standbyModalOpen: false, standbyModalDismissed: false, canSelectBenchUnits: false }),
    setCanSelectBenchUnits: (canSelect) => set({ canSelectBenchUnits: canSelect }),
    setQueueStatus: (isReady, readyCount, totalCount, waiting) => set({
        isPlayerReady: isReady,
        readyPlayersCount: readyCount,
        totalPlayersCount: totalCount,
        isWaitingForOthers: waiting
    }),
    reset: () => set(initialState),
}));
//# sourceMappingURL=game-store.js.map