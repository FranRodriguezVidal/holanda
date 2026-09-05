import { create } from 'zustand';
import {
  createInitialGameState,
  discardDrawnCard,
  drawCard,
  endTurn,
  peekCard,
  setPeekAllowance,
  skipSpecialPower,
  startPlaying,
  swapDrawnCard,
  attemptSnap,
  activateSpecialPower,
  swapWithJack,
  endJackReveal,
  applyKingPunishment,
  callHolanda,
} from '../game';
import type { DrawSource, GameState } from '../game';

const defaultPlayers = ['Ana', 'Bruno', 'Carmen', 'Diego'];

interface GameStore {
  game: GameState;
  setGame: (nextState: GameState) => void;
  resetGame: (players?: string[]) => void;
  choosePeekAllowance: (playerId: string, allowance: number) => void;
  peek: (playerId: string, cardId: string) => void;
  beginPlay: () => void;
  draw: (playerId: string, source: DrawSource) => void;
  discardDrawn: (playerId: string) => void;
  swapDrawn: (playerId: string, handCardId: string) => void;
  snap: (playerId: string, cardId: string) => void;
  activatePower: (playerId: string, targetCardId: string) => void;
  skipPower: (playerId: string) => void;
  jackSwap: (playerId: string, targetCardId: string) => void;
  finishJackReveal: (playerId: string) => void;
  kingPunish: (playerId: string, targetPlayerId: string) => void;
  endCurrentTurn: () => void;
  declareHolanda: (playerId: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: createInitialGameState(defaultPlayers),
  setGame: (nextState) => set({ game: nextState }),
  resetGame: (players = defaultPlayers) => set({ game: createInitialGameState(players) }),
  choosePeekAllowance: (playerId, allowance) =>
    set((state) => ({ game: setPeekAllowance(state.game, playerId, allowance) })),
  peek: (playerId, cardId) => set((state) => ({ game: peekCard(state.game, playerId, cardId) })),
  beginPlay: () => set((state) => ({ game: startPlaying(state.game) })),
  draw: (playerId, source) => set((state) => ({ game: drawCard(state.game, playerId, source) })),
  discardDrawn: (playerId) => set((state) => ({ game: discardDrawnCard(state.game, playerId) })),
  swapDrawn: (playerId, handCardId) =>
    set((state) => ({ game: swapDrawnCard(state.game, playerId, handCardId) })),
  snap: (playerId, cardId) => set((state) => ({ game: attemptSnap(state.game, playerId, cardId) })),
  activatePower: (playerId, targetCardId) =>
    set((state) => ({ game: activateSpecialPower(state.game, playerId, targetCardId) })),
  skipPower: (playerId) => set((state) => ({ game: skipSpecialPower(state.game, playerId) })),
  jackSwap: (playerId, targetCardId) =>
    set((state) => ({ game: swapWithJack(state.game, playerId, targetCardId) })),
  finishJackReveal: (playerId) =>
    set((state) => ({ game: endJackReveal(state.game, playerId) })),
  kingPunish: (playerId, targetPlayerId) =>
    set((state) => ({ game: applyKingPunishment(state.game, playerId, targetPlayerId) })),
  endCurrentTurn: () => set((state) => ({ game: endTurn(state.game) })),
  declareHolanda: (playerId) => set((state) => ({ game: callHolanda(state.game, playerId) })),
}));
