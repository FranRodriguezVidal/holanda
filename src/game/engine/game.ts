import {
  getCardValue,
  getInitialPeekMax,
  getNextPlayerId,
  getSpecialPower,
  isFirstRound,
  rankMatches,
} from '../rules';
import type {
  Card,
  DrawSource,
  EngineOptions,
  GameState,
  Player,
  PlayerId,
} from '../types';
import { createDeck, shuffleDeck } from './deck';

const createPlayer = (id: string, name: string, isBot: boolean): Player => ({
  id,
  name,
  hand: [],
  isActive: false,
  isBot,
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
          faceUp: false,
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

const flipInitialDiscard = (state: GameState): GameState => {
  const [first, ...rest] = state.deck;
  if (!first) {
    return state;
  }
  return {
    ...state,
    deck: rest,
    discardPile: [{ ...first, faceUp: true }],
  };
};

const withPlayer = (
  state: GameState,
  playerId: PlayerId,
  updater: (player: Player) => Player,
): GameState => ({
  ...state,
  players: state.players.map((player) => (player.id === playerId ? updater(player) : player)),
});

export const createInitialGameState = (
  playerNames: string[],
  options: EngineOptions = {},
): GameState => {
  const startingHandSize = options.startingHandSize ?? 4;
  const localName = playerNames[0] ?? 'You';
  const players = playerNames.map((name, index) =>
    createPlayer(
      `${name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}`,
      name,
      name !== localName,
    ),
  );

  const deck = shuffleDeck(createDeck());
  const startingIndex = Math.floor(Math.random() * players.length);
  const startingPlayer = players[startingIndex];

  const baseState: GameState = {
    id: `game-${Date.now()}`,
    phase: options.initialPhase ?? 'initial-peek',
    players,
    currentPlayerId: startingPlayer?.id ?? players[0]?.id ?? 'player-1',
    deck,
    discardPile: [],
    turnNumber: 1,
    startingTurn: startingIndex + 1,
  };

  const withHands = dealInitialHands(baseState, startingHandSize);
  const withDiscard = flipInitialDiscard(withHands);

  return {
    ...withDiscard,
    players: withDiscard.players.map((player, index) => ({
      ...player,
      isActive: index === startingIndex,
    })),
    lastEvent: `match-start:${startingPlayer?.name ?? ''}`,
  };
};

export const getCurrentPlayer = (state: GameState): Player | undefined =>
  state.players.find((player) => player.id === state.currentPlayerId);

export const getPlayerById = (state: GameState, playerId: PlayerId): Player | undefined =>
  state.players.find((player) => player.id === playerId);

/**
 * The randomly chosen starting player decides how many cards (0, 1 or 2)
 * everyone may peek at before play begins. Every other player must then
 * comply with this same limit.
 */
export const setPeekAllowance = (
  state: GameState,
  playerId: PlayerId,
  allowance: number,
): GameState => {
  if (state.phase !== 'initial-peek' || state.currentPlayerId !== playerId) {
    return state;
  }
  if (state.peekAllowance !== undefined) {
    return state;
  }

  const max = getInitialPeekMax();
  const clamped = Math.max(0, Math.min(max, Math.round(allowance)));

  return {
    ...state,
    peekAllowance: clamped,
    lastEvent: `peek-allowance:${playerId}:${clamped}`,
  };
};

/**
 * Local player toggles a peek on up to the agreed `peekAllowance` of their
 * own cards at the start of the game. Clicking an already face-up card hides
 * it again. Only allowed while the game is in the `initial-peek` phase, and
 * only once the starting player has set the allowance.
 */
export const peekCard = (state: GameState, playerId: PlayerId, cardId: string): GameState => {
  if (state.phase !== 'initial-peek' || state.peekAllowance === undefined) {
    return state;
  }

  const player = getPlayerById(state, playerId);
  if (!player) {
    return state;
  }

  const target = player.hand.find((card) => card.id === cardId);
  if (!target) {
    return state;
  }

  // Toggle off if already face up.
  if (target.faceUp) {
    return withPlayer(state, playerId, (current) => ({
      ...current,
      hand: current.hand.map((card) =>
        card.id === cardId ? { ...card, faceUp: false } : card,
      ),
    }));
  }

  const peekedCount = player.hand.filter((card) => card.faceUp).length;
  if (peekedCount >= state.peekAllowance) {
    return state;
  }

  return withPlayer(state, playerId, (current) => ({
    ...current,
    hand: current.hand.map((card) =>
      card.id === cardId ? { ...card, faceUp: true } : card,
    ),
  }));
};

/** Ends the initial peek phase and starts normal play. */
export const startPlaying = (state: GameState): GameState => {
  if (state.phase !== 'initial-peek') {
    return state;
  }
  return {
    ...state,
    phase: 'playing',
    players: state.players.map((player) => ({
      ...player,
      hand: player.hand.map((card) => ({ ...card, faceUp: false, isSelected: false })),
    })),
  };
};

/** The current player draws a card either from the deck or from the discard pile. */
export const drawCard = (state: GameState, playerId: PlayerId, source: DrawSource): GameState => {
  if (state.phase !== 'playing' || state.currentPlayerId !== playerId || state.drawnCard) {
    return state;
  }

  if (source === 'deck') {
    const [drawn, ...rest] = state.deck;
    if (!drawn) {
      return state;
    }
    return {
      ...state,
      deck: rest,
      drawnCard: { ...drawn, faceUp: true, isSelected: false },
      drawSource: 'deck',
      lastEvent: `draw:deck:${playerId}`,
    };
  }

  const [drawn, ...rest] = state.discardPile;
  if (!drawn) {
    return state;
  }
  return {
    ...state,
    discardPile: rest,
    drawnCard: { ...drawn, faceUp: true, isSelected: false },
    drawSource: 'discard',
    lastEvent: `draw:discard:${playerId}`,
  };
};

/** Discard the drawn card without swapping it into the hand. */
export const discardDrawnCard = (state: GameState, playerId: PlayerId): GameState => {
  if (state.phase !== 'playing' || state.currentPlayerId !== playerId || !state.drawnCard) {
    return state;
  }

  const discarded = state.drawnCard;
  const nextState: GameState = {
    ...state,
    drawnCard: undefined,
    drawSource: undefined,
    discardPile: [{ ...discarded, faceUp: true, isSelected: false }, ...state.discardPile],
    lastEvent: `discard-drawn:${playerId}:${discarded.id}`,
  };

  return maybeTriggerSpecial(nextState, playerId, discarded);
};

/** Swap the drawn card with one of the player's own cards, then discard the old one. */
export const swapDrawnCard = (
  state: GameState,
  playerId: PlayerId,
  handCardId: string,
): GameState => {
  if (state.phase !== 'playing' || state.currentPlayerId !== playerId || !state.drawnCard) {
    return state;
  }

  const player = getPlayerById(state, playerId);
  if (!player) {
    return state;
  }

  const handCard = player.hand.find((card) => card.id === handCardId);
  if (!handCard) {
    return state;
  }

  const incoming: Card = { ...state.drawnCard, faceUp: false, isSelected: false };
  const outgoing: Card = { ...handCard, faceUp: true, isSelected: false };

  const nextState: GameState = {
    ...state,
    drawnCard: undefined,
    drawSource: undefined,
    players: state.players.map((entry) =>
      entry.id === playerId
        ? {
            ...entry,
            hand: entry.hand.map((card) => (card.id === handCardId ? incoming : card)),
          }
        : entry,
    ),
    discardPile: [outgoing, ...state.discardPile],
    lastEvent: `swap:${playerId}:${handCardId}->${incoming.id}`,
  };

  return maybeTriggerSpecial(nextState, playerId, outgoing);
};

const maybeTriggerSpecial = (state: GameState, playerId: PlayerId, card: Card): GameState => {
  if (isFirstRound(state)) {
    return finishTurn(state);
  }

  const power = getSpecialPower(card);
  if (!power) {
    return finishTurn(state);
  }

  return {
    ...state,
    phase: 'special-power',
    pendingPower: power,
    pendingPowerPlayerId: playerId,
    lastEvent: `power:${power}:${playerId}`,
  };
};

/** Skip the pending special power and end the turn. */
export const skipSpecialPower = (state: GameState, playerId: PlayerId): GameState => {
  if (state.phase !== 'special-power' || state.pendingPowerPlayerId !== playerId) {
    return state;
  }
  return finishTurn({
    ...state,
    phase: 'playing',
    pendingPower: undefined,
    pendingPowerPlayerId: undefined,
  });
};

/** Use the pending special power on a chosen card. */
export const activateSpecialPower = (
  state: GameState,
  playerId: PlayerId,
  targetCardId: string,
): GameState => {
  if (state.phase !== 'special-power' || state.pendingPowerPlayerId !== playerId) {
    return state;
  }

  const power = state.pendingPower;
  const player = getPlayerById(state, playerId);
  if (!power || !player) {
    return state;
  }

  if (power === 'Q') {
    // Look at any card you want (yours or a rival's).
    const targetPlayer = state.players.find((entry) =>
      entry.hand.some((card) => card.id === targetCardId),
    );
    if (!targetPlayer) {
      return state;
    }
    return {
      ...withPlayer(state, targetPlayer.id, (current) => ({
        ...current,
        hand: current.hand.map((card) =>
          card.id === targetCardId ? { ...card, faceUp: true } : card,
        ),
      })),
      lastEvent: `power-used:Q:${playerId}:${targetCardId}`,
    };
  }

  // J: swap your card with any rival's card of your choosing (two-step selection).
  const ownCard = player.hand.find((card) => card.id === targetCardId);
  if (ownCard) {
    // First click on own card: mark it as selected.
    if (!ownCard.isSelected) {
      return {
        ...withPlayer(state, playerId, (current) => ({
          ...current,
          hand: current.hand.map((card) =>
            card.id === targetCardId ? { ...card, isSelected: true } : { ...card, isSelected: false },
          ),
        })),
        lastEvent: `power-j-select:${playerId}:${targetCardId}`,
      };
    }
    return state;
  }

  return state;
};

/** Second step of the J power: swap the selected own card with another player's card. */
export const swapWithJack = (
  state: GameState,
  playerId: PlayerId,
  targetCardId: string,
): GameState => {
  if (state.phase !== 'special-power' || state.pendingPowerPlayerId !== playerId) {
    return state;
  }
  if (state.pendingPower !== 'J') {
    return state;
  }

  const player = getPlayerById(state, playerId);
  if (!player) {
    return state;
  }

  const selectedOwn = player.hand.find((card) => card.isSelected);
  if (!selectedOwn) {
    return state;
  }

  const targetPlayer = state.players.find((entry) =>
    entry.hand.some((card) => card.id === targetCardId),
  );
  if (!targetPlayer || targetPlayer.id === playerId) {
    return state;
  }

  const targetCard = targetPlayer.hand.find((card) => card.id === targetCardId);
  if (!targetCard) {
    return state;
  }

  const nextState: GameState = {
    ...state,
    players: state.players.map((entry) => {
      if (entry.id === playerId) {
        // The caster gets to see the card they received in the swap.
        return {
          ...entry,
          hand: entry.hand.map((card) =>
            card.id === selectedOwn.id
              ? { ...targetCard, faceUp: true, isSelected: false }
              : card,
          ),
        };
      }
      if (entry.id === targetPlayer.id) {
        // The rival never gets to see the new card they received.
        return {
          ...entry,
          hand: entry.hand.map((card) =>
            card.id === targetCardId
              ? { ...selectedOwn, faceUp: false, isSelected: false }
              : card,
          ),
        };
      }
      return entry;
    }),
    jackRevealCardId: targetCard.id,
    lastEvent: `power-used:J:${playerId}:${selectedOwn.id}<->${targetCardId}`,
  };

  // Keep the swapped-in card visible to the caster for a moment; the UI calls
  // `endJackReveal` after a short delay to hide it and advance the turn.
  return nextState;
};

/** Hides the card revealed by a J swap and advances the turn. */
export const endJackReveal = (state: GameState, playerId: PlayerId): GameState => {
  if (state.pendingPowerPlayerId !== playerId || !state.jackRevealCardId) {
    return state;
  }
  const revealId = state.jackRevealCardId;
  const nextState: GameState = {
    ...state,
    jackRevealCardId: undefined,
    players: state.players.map((entry) => ({
      ...entry,
      hand: entry.hand.map((card) =>
        card.id === revealId ? { ...card, faceUp: false } : card,
      ),
    })),
  };
  return finishTurn(nextState);
};

/**
 * K power (punishment): the caster picks a rival, who must draw one extra
 * card from the deck into their hand face-down.
 */
export const applyKingPunishment = (
  state: GameState,
  playerId: PlayerId,
  targetPlayerId: PlayerId,
): GameState => {
  if (state.phase !== 'special-power' || state.pendingPowerPlayerId !== playerId) {
    return state;
  }
  if (state.pendingPower !== 'K' || targetPlayerId === playerId) {
    return state;
  }

  const targetPlayer = getPlayerById(state, targetPlayerId);
  if (!targetPlayer) {
    return state;
  }

  const remainingDeck = [...state.deck];
  const extraCard = remainingDeck.shift();
  if (!extraCard) {
    return finishTurn({ ...state, phase: 'playing', pendingPower: undefined, pendingPowerPlayerId: undefined });
  }

  const nextState: GameState = {
    ...state,
    deck: remainingDeck,
    players: state.players.map((entry) =>
      entry.id === targetPlayerId
        ? { ...entry, hand: [...entry.hand, { ...extraCard, faceUp: false, isSelected: false }] }
        : entry,
    ),
    lastEvent: `power-used:K:${playerId}:punish:${targetPlayerId}`,
  };

  return finishTurn(nextState);
};

/** End the special-power phase without using it and move to the next player. */
export const endSpecialPower = (state: GameState, playerId: PlayerId): GameState =>
  skipSpecialPower(state, playerId);

const revealAllHands = (state: GameState): GameState => ({
  ...state,
  players: state.players.map((player) => ({
    ...player,
    hand: player.hand.map((card) => ({ ...card, faceUp: true, isSelected: false })),
  })),
});

const computeWinnerId = (state: GameState): PlayerId | undefined => {
  let bestPlayerId: PlayerId | undefined;
  let bestScore = Infinity;

  for (const player of state.players) {
    const score = player.hand.reduce((total, card) => total + getCardValue(card), 0);
    if (score < bestScore) {
      bestScore = score;
      bestPlayerId = player.id;
    }
  }

  return bestPlayerId;
};

/**
 * A player calls "Holanda" to trigger the last round: every other player gets
 * exactly one more turn, then all hands are revealed and the lowest total
 * value wins.
 */
export const callHolanda = (state: GameState, playerId: PlayerId): GameState => {
  if (state.phase !== 'playing' || state.currentPlayerId !== playerId || state.holandaCallerId) {
    return state;
  }

  return finishTurn({
    ...state,
    holandaCallerId: playerId,
    lastEvent: `holanda-called:${playerId}`,
  });
};

const finishTurn = (state: GameState): GameState => {
  const nextPlayerId = getNextPlayerId(state);

  if (state.holandaCallerId && nextPlayerId === state.holandaCallerId) {
    const revealed = revealAllHands({
      ...state,
      phase: 'finished',
      currentPlayerId: nextPlayerId,
      turnNumber: state.turnNumber + 1,
      drawnCard: undefined,
      drawSource: undefined,
      pendingPower: undefined,
      pendingPowerPlayerId: undefined,
      finalRoundComplete: true,
      players: state.players.map((player) => ({ ...player, isActive: false })),
    });

    return {
      ...revealed,
      winnerId: computeWinnerId(revealed),
      lastEvent: `game-finished:${state.holandaCallerId}`,
    };
  }

  return {
    ...state,
    phase: 'playing',
    currentPlayerId: nextPlayerId,
    turnNumber: state.turnNumber + 1,
    drawnCard: undefined,
    drawSource: undefined,
    pendingPower: undefined,
    pendingPowerPlayerId: undefined,
    players: state.players.map((player) => ({
      ...player,
      isActive: player.id === nextPlayerId,
      hand: player.hand.map((card) => ({ ...card, faceUp: false, isSelected: false })),
    })),
    lastEvent: `turn:${nextPlayerId}`,
  };
};

/** Public helper to end the current turn directly (used by tests / future UI). */
export const endTurn = (state: GameState): GameState => finishTurn(state);

/**
 * Snap rule: any player may discard one of their own cards if it matches the
 * top card of the discard pile. If the rank does not match, the player draws a
 * penalty card from the deck instead.
 */
export const attemptSnap = (state: GameState, playerId: PlayerId, cardId: string): GameState => {
  if (state.phase !== 'playing') {
    return state;
  }

  const player = getPlayerById(state, playerId);
  if (!player) {
    return state;
  }

  const card = player.hand.find((entry) => entry.id === cardId);
  if (!card) {
    return state;
  }

  const topDiscard = state.discardPile[0];
  if (!topDiscard || !rankMatches(card, topDiscard)) {
    // Wrong snap: draw a penalty card from the deck.
    const [penalty, ...rest] = state.deck;
    if (!penalty) {
      return state;
    }
    return {
      ...withPlayer(state, playerId, (current) => ({
        ...current,
        hand: [...current.hand, { ...penalty, faceUp: false, isSelected: false }],
      })),
      deck: rest,
      lastEvent: `snap-penalty:${playerId}:${cardId}`,
    };
  }

  return {
    ...withPlayer(state, playerId, (current) => ({
      ...current,
      hand: current.hand.filter((entry) => entry.id !== cardId),
    })),
    discardPile: [{ ...card, faceUp: true, isSelected: false }, ...state.discardPile],
    lastEvent: `snap:${playerId}:${cardId}`,
  };
};

/** Simple beginner-level bot: draws, discards or swaps, and uses powers naively. */
export const getBotAction = (
  state: GameState,
  botId: PlayerId,
):
  | { kind: 'draw'; source: DrawSource }
  | { kind: 'discard-drawn' }
  | { kind: 'swap'; handCardId: string }
  | { kind: 'snap'; cardId: string }
  | { kind: 'use-power'; targetCardId: string }
  | { kind: 'punish'; targetPlayerId: string }
  | { kind: 'skip-power' } => {
  const bot = getPlayerById(state, botId);
  if (!bot) {
    return { kind: 'draw', source: 'deck' };
  }

  if (state.phase === 'special-power' && state.pendingPowerPlayerId === botId) {
    if (state.pendingPower === 'Q') {
      const others = state.players.filter((player) => player.id !== botId);
      const target = others.flatMap((player) => player.hand)[0] ?? bot.hand[0];
      return target ? { kind: 'use-power', targetCardId: target.id } : { kind: 'skip-power' };
    }
    if (state.pendingPower === 'J') {
      const selectedOwn = bot.hand.find((card) => card.isSelected);
      if (!selectedOwn) {
        const highestOwn = [...bot.hand].sort((a, b) => getCardValue(b) - getCardValue(a))[0];
        return highestOwn
          ? { kind: 'use-power', targetCardId: highestOwn.id }
          : { kind: 'skip-power' };
      }
      const others = state.players.filter((player) => player.id !== botId);
      const target = others.flatMap((player) => player.hand)[0];
      return target ? { kind: 'use-power', targetCardId: target.id } : { kind: 'skip-power' };
    }
    if (state.pendingPower === 'K') {
      const others = state.players.filter((player) => player.id !== botId);
      const target = others[0];
      return target ? { kind: 'punish', targetPlayerId: target.id } : { kind: 'skip-power' };
    }
  }

  if (state.drawnCard) {
    const handValues = bot.hand.map((card) => getCardValue(card));
    const drawnValue = getCardValue(state.drawnCard);
    const maxHandValue = Math.max(...handValues, 0);

    if (drawnValue >= maxHandValue - 1 && state.drawSource === 'deck') {
      return { kind: 'discard-drawn' };
    }

    const highestCard = bot.hand.reduce<Card | null>((highest, card) => {
      if (!highest || getCardValue(card) > getCardValue(highest)) {
        return card;
      }
      return highest;
    }, null);

    return highestCard ? { kind: 'swap', handCardId: highestCard.id } : { kind: 'discard-drawn' };
  }

  const topDiscard = state.discardPile[0];
  if (topDiscard) {
    const matching = bot.hand.find((card) => rankMatches(card, topDiscard));
    if (matching && Math.random() < 0.75) {
      return { kind: 'snap', cardId: matching.id };
    }
  }

  if (topDiscard && getCardValue(topDiscard) <= 2 && Math.random() < 0.5) {
    return { kind: 'draw', source: 'discard' };
  }

  return { kind: 'draw', source: 'deck' };
};

export const getSpecialPowerTargets = (state: GameState, playerId: PlayerId): Card[] => {
  if (state.phase !== 'special-power' || state.pendingPowerPlayerId !== playerId) {
    return [];
  }
  const player = getPlayerById(state, playerId);
  if (!player) {
    return [];
  }

  if (state.pendingPower === 'Q') {
    return state.players.flatMap((entry) => entry.hand);
  }
  if (state.pendingPower === 'J') {
    const selected = player.hand.find((card) => card.isSelected);
    if (!selected) {
      return player.hand;
    }
    return state.players.filter((entry) => entry.id !== playerId).flatMap((entry) => entry.hand);
  }
  if (state.pendingPower === 'K') {
    // Punishment target is a player, not a card; UI should offer rival players directly.
    return [];
  }
  return [];
};

/** Rivals the caster may choose to punish with the K power (draw an extra card). */
export const getKingPunishmentTargets = (state: GameState, playerId: PlayerId): Player[] => {
  if (
    state.phase !== 'special-power' ||
    state.pendingPowerPlayerId !== playerId ||
    state.pendingPower !== 'K'
  ) {
    return [];
  }
  return state.players.filter((entry) => entry.id !== playerId);
};