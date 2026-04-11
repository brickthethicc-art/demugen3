# Test Strategy

## Tools
- **Vitest** (unit + component tests)
- **@testing-library/react** (component rendering)
- **jsdom** (DOM environment)

## Test Categories

### Phase 1: Main Menu + Navigation
| Test | Description | Status |
|------|-------------|--------|
| Store: screen defaults to main-menu | Initial screen state is 'main-menu' | ✅ PASS |
| Store: setScreen navigates to all screens | setScreen changes screen for all valid values | ✅ PASS |
| Store: reset returns to main-menu | reset() returns screen to 'main-menu' | ✅ PASS |
| Store: rapid navigation | Handles rapid screen changes correctly | ✅ PASS |
| MainMenu: renders game title | Title "MUGEN" is present | ✅ PASS |
| MainMenu: renders subtitle | Subtitle "Strategy Card Game" is present | ✅ PASS |
| MainMenu: renders Play button | Play button is present | ✅ PASS |
| MainMenu: renders Deck Builder button | Deck Builder button is present | ✅ PASS |
| MainMenu: renders Card Library button | Card Library button is present | ✅ PASS |
| MainMenu: Play navigates to deck-select | Clicking Play calls setScreen('deck-select') | ✅ PASS |
| MainMenu: Deck Builder navigates | Clicking Deck Builder calls setScreen('deck-builder') | ✅ PASS |
| MainMenu: Card Library navigates | Clicking Card Library calls setScreen('card-library') | ✅ PASS |
| App: routes main-menu screen | App renders MainMenu when screen='main-menu' | ✅ PASS |
| App: routes deck-builder screen | App renders DeckBuilder placeholder when screen='deck-builder' | ✅ PASS |
| App: routes card-library screen | App renders CardLibrary placeholder when screen='card-library' | ✅ PASS |
| App: routes deck-select screen | App renders DeckSelect placeholder when screen='deck-select' | ✅ PASS |
| App: routes lobby screen | App renders LobbyScreen when screen='lobby' | ✅ PASS |

### Phase 2: Deck Builder Core
| Test | Description | Status |
|------|-------------|--------|
| Cards: 40+ units | At least 40 unit cards | ✅ PASS |
| Cards: 20+ sorceries | At least 20 sorcery cards | ✅ PASS |
| Cards: unique IDs | All cards have unique IDs | ✅ PASS |
| Cards: valid stats | All unit stats positive, maxHp matches hp | ✅ PASS |
| Cards: ability fields | All units have valid ability definitions | ✅ PASS |
| Cards: cost ranges | Units 1-8, Sorceries 1-6 | ✅ PASS |
| Validate: 16 cards valid | Exactly 16 cards passes validation | ✅ PASS |
| Validate: wrong count invalid | 0, 15, 17 cards fail validation | ✅ PASS |
| CanAdd: under 16 | Returns true when < 16 | ✅ PASS |
| CanAdd: at 16 | Returns false when = 16 | ✅ PASS |
| Filter: by type | Filters units and sorceries correctly | ✅ PASS |
| Filter: by cost | Filters by exact cost | ✅ PASS |
| Filter: by ability | Filters units by ability type | ✅ PASS |
| Filter: by search | Case-insensitive name search | ✅ PASS |
| Filter: combined | Multiple filters compose correctly | ✅ PASS |
| Stats: empty deck | Returns zeros for empty | ✅ PASS |
| Stats: averageCost | Calculates average correctly | ✅ PASS |
| Stats: type counts | Counts units and sorceries | ✅ PASS |
| Stats: cost curve | Cost distribution sums to deck size | ✅ PASS |
| Storage: save/load | Save and reload a deck | ✅ PASS |
| Storage: slots | Independent slot management | ✅ PASS |
| Storage: delete | Remove deck from slot | ✅ PASS |
| Storage: invalid slot | Throws for out-of-range | ✅ PASS |
| Store: initial state | Empty deck, no filters, no slot | ✅ PASS |
| Store: add/remove | Add cards, remove by index | ✅ PASS |
| Store: 16-card limit | Won't exceed MAX_DECK_SIZE | ✅ PASS |
| Store: filters | Set/clear search, type, cost, ability | ✅ PASS |
| Store: load into builder | Loads deck with name + slot | ✅ PASS |
| Store: clear/reset | Resets all builder state | ✅ PASS |

### Phase 3: Deck Selection Flow
| Test | Description | Status |
|------|-------------|--------|
| Store: null selectedDeck | Initial state is null | ✅ PASS |
| Store: setSelectedDeck | Sets deck array | ✅ PASS |
| Store: clear selectedDeck | Sets to null | ✅ PASS |
| Store: reset clears deck | reset() clears selectedDeck | ✅ PASS |
| DeckSelect: renders title | "Select a Deck" shown | ✅ PASS |
| DeckSelect: back button | Navigates to main-menu | ✅ PASS |
| DeckSelect: build new | Navigates to deck-builder | ✅ PASS |
| DeckSelect: empty state | Shows "No saved decks" | ✅ PASS |
| DeckSelect: shows slots | Displays saved deck names | ✅ PASS |
| DeckSelect: select deck | Sets selectedDeck + navigates to lobby | ✅ PASS |

### Phase 4: Card Library Browser
| Test | Description | Status |
|------|-------------|--------|
| Library: renders title | "Card Library" shown | ✅ PASS |
| Library: back button | Navigates to main-menu | ✅ PASS |
| Library: card count | Shows total card count | ✅ PASS |
| Library: search input | Search field renders | ✅ PASS |
| Library: view toggles | Grid/List buttons render | ✅ PASS |
| Library: card names | Card names displayed | ✅ PASS |
| Library: search filter | Filters cards by name | ✅ PASS |
| Library: card detail | Click card shows detail | ✅ PASS |

### Phase 5: Integration & Polish
| Test | Description | Status |
|------|-------------|--------|
| Integration: starts at main menu | App defaults to main menu |  |
| Integration: Menu  DeckSelect  Menu | Round-trip navigation |  |
| Integration: Menu  DeckBuilder  Menu | Round-trip navigation |  |
| Integration: Menu  CardLibrary  Menu | Round-trip navigation |  |
| Integration: DeckSelect  Build New | No decks  build new deck |  |
| Integration: saved deck in DeckSelect | Saved deck appears in list |  |
| Integration: select  lobby | Selecting deck navigates to lobby |  |
| Integration: rapid navigation | Multiple fast navigations stable |  |
| Integration: persistence | localStorage round-trip works |  |
| Integration: delete all  empty | All decks deleted  empty state |  |

### Phase 7: Grid Resize (30×30) & Hover Stats
| Test | Description | Status |
|------|-------------|--------|
| Board: default 30×30 | createBoardState() returns 30×30 |  |
| Board: boundary (29,29) | Place unit at bottom-right corner |  |
| Board: out of bounds (30,30) | Reject placement beyond grid |  |
| Board: move to edge | Move to (29,29) within range |  |
| Board: move out of bounds | Move to (30,30) rejected |  |
| Board: corner valid moves | Unit at (0,0) with movement 2 |  |
| Turn: player 2 at y:29 | Test fixtures use far side |  |
| Turn: attack adjacency | Attacker at y:28 adjacent to y:29 |  |
| Hover: occupied cell | Returns UnitInstance |  |
| Hover: empty cell | Returns null |  |
| Hover: out of bounds | Returns null |  |
| Client: getUnitDisplayStats | Extracts all unit fields |  |
| Client: damaged unit HP | Reflects current HP |  |
| Client: zero cost ability | Handles ability cost 0 |  |
| Client: different ability types | HEAL, DAMAGE, etc. |  |
| Store: hoveredUnit null by default | Initial state null |  |
| Store: setHoveredUnit | Sets hovered unit |  |
| Store: clearHoveredUnit | Resets to null |  |
| Store: reset clears hoveredUnit | Reset includes hover |  |
| Store: rapid hover changes | Last hover wins |  |

### Phase 8: Initial Hand Draw & Starting Unit Selection
| Test | Description | Status |
|------|-------------|--------|
| Hand: draw 4 from 16 | Returns hand of 4, deck of 12 |  |
| Hand: insufficient cards | Error for < 4 cards |  |
| Hand: exact deck size | Handles 4-card deck |  |
| Hand: preserves order | Cards maintain deck order |  |
| Hand: does not mutate | Original deck unchanged |  |
| Selection: valid 6 units < 40 cost | Success validation |  |
| Selection: cost exceeds 40 | Error for cost >= 40 |  |
| Selection: wrong count | Error for != 6 units |  |
| Selection: non-unit cards | Error for sorceries |  |
| Placement: 3 active + 3 reserve | Correct placement |  |
| Placement: positions correct | Active units at (0,0), (1,0), (2,0) |  |
| Placement: unit instances | Proper UnitInstance creation |  |
| Placement: no mutation | Original player unchanged |  |
| UI: renders selection screen | Shows title and cost display |  |
| UI: displays deck units | Shows available units |  |
| UI: selection count | Updates selected count |  |
| UI: cost calculation | Shows total cost correctly |  |
| UI: cost warning | Shows error when over limit |  |
| UI: confirm button state | Enables/disables correctly |  |
| UI: unit click selection | Calls setStartingUnits |  |
| UI: confirm action | Calls confirmStartingUnits |  |

### Phase 9: Starting Card Visibility and Field Placement
| Test | Description | Status |
|------|-------------|--------|
| Active Cards: 3 appear on board | Exactly 3 active units visible on board |  |
| Active Cards: correct positioning | Units placed at (0,0), (1,0), (2,0) for player 0 |  |
| Active Cards: player 2 positioning | Units placed at (0,29), (1,29), (2,29) for player 2 |  |
| Active Cards: horizontal centering | Units centered on player's half of board |  |
| Benched Cards: 3 appear in reserve | Exactly 3 reserve units visible outside board |  |
| Benched Cards: correct positioning | Reserve units positioned in reserve area |  |
| Benched Cards: same orientation | Reserve units face same direction as active |  |
| Multiplayer: sync positions | Positions synchronized across clients |  |
| Multiplayer: state consistency | Game state consistent after placement |  |
| Edge Cases: empty board | Handles placement on empty board |  |
| Edge Cases: full board | Handles placement when board occupied |  |
| Edge Cases: invalid player | Handles invalid player indices |  |✅ PASS |
