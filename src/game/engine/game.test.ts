import { describe, expect, it } from 'vitest';
import { createInitialGameState, drawCard, endTurn, getPlayerById, startPlaying } from './game';

describe('game engine', () => {
  it('creates a valid initial state with a shuffled deck and initial hands', () => {
    const state = createInitialGameState(['Ana', 'Bruno', 'Carmen'], { startingHandSize: 4 });

    expect(state.players).toHaveLength(3);
    expect(state.turnNumber).toBe(1);
    expect(state.players.every((player) => player.hand.length === 4)).toBe(true);
    expect(state.deck.length).toBe(54 - 12 - 1);
    expect(state.discardPile).toHaveLength(1);
    expect(state.phase).toBe('initial-peek');
  });

  it('draws a card for the active player once the game has started', () => {
    const initial = createInitialGameState(['Ana', 'Bruno'], { startingHandSize: 2 });
    const started = startPlaying(initial);
    const activePlayerId = started.currentPlayerId;
    const nextState = drawCard(started, activePlayerId, 'deck');

    expect(nextState.drawnCard).toBeDefined();
    expect(nextState.deck.length).toBeLessThan(started.deck.length);
  });

  it('moves the turn to the next player in clockwise order', () => {
    const state = startPlaying(createInitialGameState(['Ana', 'Bruno', 'Carmen']));
    const nextState = endTurn(state);
    const currentIndex = state.players.findIndex((player) => player.id === state.currentPlayerId);
    const expectedNext = state.players[(currentIndex + 1) % state.players.length];

    expect(nextState.currentPlayerId).toBe(expectedNext?.id);
    expect(nextState.turnNumber).toBe(2);
    expect(getPlayerById(nextState, expectedNext!.id)?.isActive).toBe(true);
  });
});
