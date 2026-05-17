import {
  CardType,
  HIDDEN_CARD_ID_PREFIX,
  createDefaultCardFramework,
  type Card,
  type GameState,
  type PlayerState,
} from '@mugen/shared';

type HiddenZone = 'hand' | 'deck' | 'mainDeck';

function toHiddenCards(ownerId: string, zone: HiddenZone, count: number): Card[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${HIDDEN_CARD_ID_PREFIX}:${ownerId}:${zone}:${index}`,
    name: 'Hidden Card',
    cardType: CardType.SORCERY,
    cost: 0,
    effect: '',
    framework: createDefaultCardFramework({
      borderTheme: 'hidden',
      frameworkCompliant: true,
    }),
  }));
}

export function sanitizeForPlayer(state: GameState, playerId: string): GameState {
  const sanitizedPlayers = state.players.map((p): PlayerState => {
    if (p.id === playerId) {
      return p;
    }

    const handCount = p.hand.cards.length;
    const deckCount = p.deck.cards.length;
    const mainDeckCount = p.mainDeck.cards.length;
    return {
      ...p,
      hand: { cards: toHiddenCards(p.id, 'hand', handCount) },
      deck: { cards: toHiddenCards(p.id, 'deck', deckCount) },
      mainDeck: { cards: toHiddenCards(p.id, 'mainDeck', mainDeckCount) },
    };
  });

  return {
    ...state,
    players: sanitizedPlayers,
  };
}
