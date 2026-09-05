import type { Card, GameState } from '../types';

export interface RuleSet {
  startingHandSize: number;
  maxPlayers: number;
  initialPeekMax: number;
  allowSpecialEffects: boolean;
}

export const defaultRuleSet: RuleSet = {
  startingHandSize: 4,
  maxPlayers: 4,
  initialPeekMax: 2,
  allowSpecialEffects: true,
};

export const getStartingHandSize = (): number => defaultRuleSet.startingHandSize;

export const getMaxPlayers = (): number => defaultRuleSet.maxPlayers;

export const getInitialPeekMax = (): number => defaultRuleSet.initialPeekMax;

export const rulesAreDefined = (): boolean => true;

export const isSpecialCard = (card: Card): boolean =>
  card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';

export const getSpecialPower = (card: Card): 'J' | 'Q' | 'K' | null =>
  isSpecialCard(card) ? (card.rank as 'J' | 'Q' | 'K') : null;

/** True while the game is still in the first round (no special powers allowed). */
export const isFirstRound = (state: GameState): boolean => {
  const playerCount = state.players.length;
  if (playerCount === 0) return true;
  return state.turnNumber <= playerCount;
};

/** Numeric value used to decide discards / swaps (J/Q/K = 10, Joker = 0, A = 1). */
export const getCardValue = (card: Card): number => {
  if (card.rank === 'JOKER') return 0;
  if (card.rank === 'A') return 1;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  const parsed = Number.parseInt(card.rank as string, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const rankMatches = (a: Card, b: Card): boolean => a.rank === b.rank;

export const findPlayerIndex = (state: GameState, playerId: string): number =>
  state.players.findIndex((player) => player.id === playerId);

/** The player who will act next in clockwise order. */
export const getNextPlayerId = (state: GameState, fromPlayerId?: string): string => {
  const currentIndex = fromPlayerId
    ? findPlayerIndex(state, fromPlayerId)
    : findPlayerIndex(state, state.currentPlayerId);
  if (currentIndex === -1) {
    return state.currentPlayerId;
  }
  const nextIndex = (currentIndex + 1) % state.players.length;
  return state.players[nextIndex]?.id ?? state.currentPlayerId;
};
