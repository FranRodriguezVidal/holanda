import { getStartingHandSize } from '../rules';
import type { Card, EngineOptions, GameState, Player, PlayerId } from '../types';
import { createDeck, shuffleDeck } from './deck';

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  hand: [],
  isActive: false,
});

const dealInitialHands = (state: GameState, startingHandSize: number): GameState => {
  const remainingDeck = [...state.deck];
  const players = state.players.map((player) => {
    const hand: Card[] = [];

    for (let index = 0; index < startingHandSize; index += 1) {
      const nextCard = remainingDeck.shift();

      if (nextCard) {
        hand.push({
          ...nextCard,
          faceUp: true,
          isSelected: false,
        });
      }
    }

    return {
      ...player,
      hand,
    };
  });

  return {
    ...state,
    players,
    deck: remainingDeck,
  };
};

export const createInitialGameState = (
  playerNames: string[],
  options: EngineOptions = {},
): GameState => {
  const startingHandSize = options.startingHandSize ?? getStartingHandSize();
  const players = playerNames.map((name, index) => ({
    ...createPlayer(`${name.toLowerCase()}-${index + 1}`, name),
    isActive: index === 0,
  }));

  const deck = shuffleDeck(createDeck());
  const gameState: GameState = {
    id: `game-${Date.now()}`,
    phase: options.initialPhase ?? 'lobby',
    players,
    currentPlayerId: players[0]?.id ?? 'player-1',
    deck,
    discardPile: [],
    turnNumber: 1,
  };

  return dealInitialHands(gameState, startingHandSize);
};

const withActivePlayer = (state: GameState, playerId: PlayerId, updater: (player: Player) => Player): GameState => ({
  ...state,
  players: state.players.map((player) => (player.id === playerId ? updater(player) : player)),
});

export const drawCard = (state: GameState, playerId: PlayerId): GameState => {
  if (state.phase === 'finished' || state.deck.length === 0) {
    return state;
  }

  const nextCard = state.deck[0];

  if (!nextCard) {
    return state;
  }

  const nextDeck = [...state.deck];
  const drawnCard = nextDeck.shift();

  if (!drawnCard) {
    return state;
  }

  return {
    ...state,
    phase: state.phase === 'lobby' ? 'playing' : state.phase,
    deck: nextDeck,
    players: state.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            hand: [...player.hand, { ...drawnCard, faceUp: true, isSelected: false }],
          }
        : player,
    ),
  };
};

export const playCard = (state: GameState, playerId: PlayerId, cardId: string): GameState => {
  const player = state.players.find((entry) => entry.id === playerId);

  if (!player) {
    return state;
  }

  const cardToPlay = player.hand.find((card) => card.id === cardId);

  if (!cardToPlay) {
    return state;
  }

  return {
    ...state,
    players: state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hand: entry.hand.filter((card) => card.id !== cardId) } : entry,
    ),
    discardPile: [{ ...cardToPlay, faceUp: true }, ...state.discardPile],
  };
};

export const discardCard = (state: GameState, playerId: PlayerId, cardId: string): GameState => {
  const player = state.players.find((entry) => entry.id === playerId);

  if (!player) {
    return state;
  }

  const cardToDiscard = player.hand.find((card) => card.id === cardId);

  if (!cardToDiscard) {
    return state;
  }

  return {
    ...state,
    players: state.players.map((entry) =>
      entry.id === playerId ? { ...entry, hand: entry.hand.filter((card) => card.id !== cardId) } : entry,
    ),
    discardPile: [{ ...cardToDiscard, faceUp: true }, ...state.discardPile],
  };
};

export const swapCard = (state: GameState, playerId: PlayerId, fromCardId: string, toCardId: string): GameState => {
  const player = state.players.find((entry) => entry.id === playerId);

  if (!player) {
    return state;
  }

  const fromIndex = player.hand.findIndex((card) => card.id === fromCardId);
  const toIndex = player.hand.findIndex((card) => card.id === toCardId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return state;
  }

  const nextHand = [...player.hand];
  const fromCard = nextHand[fromIndex];
  const toCard = nextHand[toIndex];

  if (!fromCard || !toCard) {
    return state;
  }

  [nextHand[fromIndex], nextHand[toIndex]] = [toCard, fromCard];

  return withActivePlayer(state, playerId, (entry) => ({
    ...entry,
    hand: nextHand,
  }));
};

export const endTurn = (state: GameState): GameState => {
  const currentIndex = state.players.findIndex((player) => player.id === state.currentPlayerId);
  const nextIndex = (currentIndex + 1) % state.players.length;
  const nextPlayerId = state.players[nextIndex]?.id ?? state.currentPlayerId;

  return {
    ...state,
    currentPlayerId: nextPlayerId,
    turnNumber: state.turnNumber + 1,
    players: state.players.map((player, index) => ({
      ...player,
      isActive: index === nextIndex,
    })),
  };
};

export const getDealableCards = (state: GameState): Card[] => state.deck.slice(0, 5);

export const getPlayerById = (state: GameState, playerId: PlayerId): Player | undefined =>
  state.players.find((player) => player.id === playerId);
