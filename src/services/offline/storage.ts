import type { GameState } from '../../game';

const STORAGE_KEY = 'holanda.local-game';

export const saveLocalGame = (state: GameState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadLocalGame = (): GameState | null => {
  const rawValue = localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as GameState;
  } catch {
    return null;
  }
};

export const clearLocalGame = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
