import { describe, expect, it } from 'vitest';
import { createInitialGameState, drawCard, endTurn, getPlayerById } from './game';

describe('game engine', () => {
  it('creates a valid initial state with a shuffled deck and initial hands', () => {
    const state = createInitialGameState(['Ana', 'Bruno', 'Carmen'], { startingHandSize: 5 });

    expect(state.players).toHaveLength(3);
    expect(state.currentPlayerId).toBe('ana-1');
    expect(state.turnNumber).toBe(1);
    expect(state.players.every((player) => player.hand.length === 5)).toBe(true);
    expect(state.deck.length).toBe(37);
  });

  it('draws a card for the active player', () => {
    const state = createInitialGameState(['Ana', 'Bruno'], { startingHandSize: 2 });
    const nextState = drawCard(state, 'ana-1');

    expect(nextState.players[0]?.hand.length).toBe(3);
    expect(nextState.players[0]?.hand.at(-1)?.faceUp).toBe(true);
    expect(nextState.deck.length).toBeLessThan(state.deck.length);
  });

  it('moves the turn to the next player', () => {
    const state = createInitialGameState(['Ana', 'Bruno', 'Carmen']);
    const nextState = endTurn(state);

    expect(nextState.currentPlayerId).toBe('bruno-2');
    expect(nextState.turnNumber).toBe(2);
    expect(getPlayerById(nextState, 'bruno-2')?.isActive).toBe(true);
  });
});
