import { create } from 'zustand';
import { createInitialGameState } from '../game';
import type { GameState } from '../game';

const defaultPlayers = ['Ana', 'Bruno', 'Carmen', 'Diego'];

interface GameStore {
  game: GameState;
  setGame: (nextState: GameState) => void;
  resetGame: (players?: string[]) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: createInitialGameState(defaultPlayers),
  setGame: (nextState) => set({ game: nextState }),
  resetGame: (players = defaultPlayers) => set({ game: createInitialGameState(players) }),
}));
