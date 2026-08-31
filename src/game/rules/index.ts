import type { GameActionType, GameState } from '../types';

export interface RuleSet {
  startingHandSize: number;
  maxPlayers: number;
  allowSpecialEffects: boolean;
  supportedActions: GameActionType[];
}

export const defaultRuleSet: RuleSet = {
  startingHandSize: 5,
  maxPlayers: 4,
  allowSpecialEffects: false,
  supportedActions: ['drawCard', 'playCard', 'discardCard', 'swapCard', 'endTurn'],
};

export const getSupportedActions = (_state: GameState): GameActionType[] =>
  defaultRuleSet.supportedActions;

export const getStartingHandSize = (): number => defaultRuleSet.startingHandSize;

export const getMaxPlayers = (): number => defaultRuleSet.maxPlayers;

export const rulesAreDefined = (): boolean => false;

export const rulesTodo = `Rules are intentionally left as placeholders for future game-specific implementation.`;
