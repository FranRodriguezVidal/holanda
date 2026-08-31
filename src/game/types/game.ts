export type PlayerId = string;
export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'wild';
export type CardRank = string;

export interface Card {
  id: string;
  suit: CardSuit;
  rank: CardRank;
  faceUp: boolean;
  isSelected: boolean;
}

export interface Player {
  id: PlayerId;
  name: string;
  hand: Card[];
  isActive: boolean;
}

export type GamePhase = 'lobby' | 'dealing' | 'playing' | 'finished';

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerId: PlayerId;
  deck: Card[];
  discardPile: Card[];
  turnNumber: number;
  winnerId?: string;
}

export type GameActionType = 'drawCard' | 'playCard' | 'discardCard' | 'swapCard' | 'endTurn';

export interface GameAction {
  type: GameActionType;
  playerId: PlayerId;
  payload?: Record<string, unknown>;
}

export interface EngineOptions {
  startingHandSize?: number;
  initialPhase?: GamePhase;
}
