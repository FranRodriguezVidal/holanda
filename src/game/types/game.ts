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
  isBot?: boolean;
}

export type GamePhase =
  | 'lobby'
  | 'initial-peek'
  | 'playing'
  | 'special-power'
  | 'finished';

export type DrawSource = 'deck' | 'discard';

export interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentPlayerId: PlayerId;
  deck: Card[];
  discardPile: Card[];
  turnNumber: number;
  winnerId?: string;
  /**
   * 1-based index of the global turn order in which the game started.
   * Used to disable special powers during the very first round.
   */
  startingTurn: number;
  drawnCard?: Card;
  drawSource?: DrawSource;
  /** Player who must choose a card for the active special power. */
  pendingPowerPlayerId?: PlayerId;
  /** Which special power is pending (J / Q / K). */
  pendingPower?: 'J' | 'Q' | 'K';
  /** Free-form log of the last events, useful for debugging and UI messages. */
  lastEvent?: string;
  /** Player who called "Holanda" to trigger the final round, if any. */
  holandaCallerId?: PlayerId;
  /** True once every other player has taken their final turn after the Holanda call. */
  finalRoundComplete?: boolean;
  /**
   * How many cards (0, 1 or 2) everyone is allowed to peek at during the
   * initial-peek phase. Chosen once by the randomly selected starting player;
   * every other player must comply with the same limit.
   */
  peekAllowance?: number;
  /**
   * Id of the card the caster of a J power just received in a swap, kept
   * face-up briefly so they can see it before the turn passes on.
   */
  jackRevealCardId?: string;
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
