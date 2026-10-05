import { describe, expect, it, vi } from 'vitest';
import {
  createInitialGameState,
  drawCard,
  endTurn,
  getBotAction,
  getBotPeekAllowance,
  getPlayerById,
  peekCard,
  setPeekAllowance,
  startPlaying,
  swapDrawnCard,
} from './game';

describe('game engine', () => {
  it('creates a valid initial state with a shuffled deck and initial hands', () => {
    const state = createInitialGameState(['Ana', 'Bruno', 'Carmen'], {
      startingHandSize: 4,
      difficulty: 'amateur',
    });

    expect(state.players).toHaveLength(3);
    expect(state.turnNumber).toBe(1);
    expect(state.players.every((player) => player.hand.length === 4)).toBe(true);
    expect(state.deck.length).toBe(52 + 3 - 12 - 1);
    expect(state.discardPile).toHaveLength(1);
    expect(state.phase).toBe('initial-peek');
  });

  it.each([
    ['beginner', 4],
    ['amateur', 3],
    ['professional', 2],
    ['legend', 1],
  ] as const)('includes the configured number of Jokers for %s', (difficulty, expectedCount) => {
    const state = createInitialGameState(['Ana', 'Bruno'], { difficulty });
    const allCards = [...state.deck, ...state.discardPile, ...state.players.flatMap((player) => player.hand)];

    expect(allCards.filter((card) => card.rank === 'JOKER')).toHaveLength(expectedCount);
  });

  it('chooses the initial peek allowance according to bot difficulty', () => {
    expect(getBotPeekAllowance('beginner', 0)).toBe(1);
    expect(getBotPeekAllowance('beginner', 0.9)).toBe(2);
    expect(getBotPeekAllowance('amateur', 0.1)).toBe(0);
    expect(getBotPeekAllowance('amateur', 0.4)).toBe(1);
    expect(getBotPeekAllowance('amateur', 0.8)).toBe(2);
    expect(getBotPeekAllowance('professional', 0.1)).toBe(0);
    expect(getBotPeekAllowance('professional', 0.8)).toBe(1);
    expect(getBotPeekAllowance('legend', 0.8)).toBe(0);
  });

  it('tracks only the cards bots and the local player peeked at initially', () => {
    const initial = createInitialGameState(['Ana', 'Bot Uno', 'Bot Dos'], {
      difficulty: 'beginner',
    });
    const starting = initial.currentPlayerId;
    const allowanceSet = setPeekAllowance(initial, starting, 2);
    const bots = allowanceSet.players.filter((player) => player.isBot);

    expect(bots.every((bot) => bot.knownCardIds.length >= 1 && bot.knownCardIds.length <= 2)).toBe(true);

    const local = allowanceSet.players[0]!;
    const peeked = peekCard(allowanceSet, local.id, local.hand[0]!.id);
    expect(peeked.players[0]!.knownCardIds).toContain(local.hand[0]!.id);
    expect(peeked.players[0]!.knownCardIds).toHaveLength(1);

    const started = startPlaying(peeked);
    expect(started.players[0]!.knownCardIds).toEqual(peeked.players[0]!.knownCardIds);
    expect(started.players[0]!.hand[0]!.faceUp).toBe(false);

    const legendGame = createInitialGameState(['Ana', 'Bot Leyenda'], {
      difficulty: 'legend',
    });
    const legendStart = setPeekAllowance(legendGame, legendGame.currentPlayerId, 2);
    expect(legendStart.players[1]!.knownCardIds).toHaveLength(0);
  });

  it('remembers a drawn card that replaces one of the bot hand cards', () => {
    const initial = createInitialGameState(['Ana', 'Bot Uno'], { difficulty: 'beginner' });
    const bot = initial.players[1]!;
    const outgoing = bot.hand[0]!;
    const incoming = initial.deck[0]!;
    const state = {
      ...startPlaying(initial),
      currentPlayerId: bot.id,
      drawnCard: { ...incoming, faceUp: true },
      drawSource: 'deck' as const,
      players: initial.players.map((player) =>
        player.id === bot.id
          ? { ...player, knownCardIds: [outgoing.id] }
          : player,
      ),
    };

    const swapped = swapDrawnCard(state, bot.id, outgoing.id);
    const updatedBot = getPlayerById(swapped, bot.id)!;
    expect(updatedBot.knownCardIds).not.toContain(outgoing.id);
    expect(updatedBot.knownCardIds).toContain(incoming.id);
  });

  it('does not snap a matching card unless the bot knows its rank', () => {
    const initial = createInitialGameState(['Ana', 'Bot Uno'], { difficulty: 'amateur' });
    const bot = initial.players[1]!;
    const hiddenMatch = { ...bot.hand[0]!, rank: '8' };
    const state = {
      ...startPlaying(initial),
      currentPlayerId: bot.id,
      discardPile: [{ ...initial.deck[0]!, rank: '8', faceUp: true }],
      players: initial.players.map((player) =>
        player.id === bot.id ? { ...player, hand: [hiddenMatch], knownCardIds: [] } : player,
      ),
    };

    expect(getBotAction(state, bot.id, 'amateur')).toEqual({
      kind: 'draw',
      source: 'deck',
    });
  });

  it('estimates the value of an unknown card instead of reading its actual rank', () => {
    const initial = createInitialGameState(['Ana', 'Bot Uno'], { difficulty: 'amateur' });
    const bot = initial.players[1]!;
    const hiddenAce = { ...bot.hand[0]!, rank: 'A' };
    const drawnFive = { ...initial.deck[0]!, rank: '5', faceUp: true };
    const state = {
      ...startPlaying(initial),
      currentPlayerId: bot.id,
      drawnCard: drawnFive,
      drawSource: 'deck' as const,
      players: initial.players.map((player) =>
        player.id === bot.id
          ? { ...player, hand: [hiddenAce], knownCardIds: [] }
          : player,
      ),
    };

    expect(getBotAction(state, bot.id, 'amateur')).toEqual({
      kind: 'swap',
      handCardId: hiddenAce.id,
    });
  });

  it('uses difficulty target groups and reserves perfect Jack targeting for Legend', () => {
    const initial = createInitialGameState(['Ana', 'Bot Uno', 'Bot Dos'], {
      difficulty: 'amateur',
    });
    const human = initial.players[0]!;
    const bot = initial.players[1]!;
    const otherBot = initial.players[2]!;
    const card = (id: string, rank: string, isSelected = false) => ({
      id,
      rank,
      suit: 'hearts' as const,
      faceUp: false,
      isSelected,
    });
    const state = {
      ...initial,
      phase: 'special-power' as const,
      pendingPower: 'J' as const,
      pendingPowerPlayerId: bot.id,
      currentPlayerId: bot.id,
      players: [
        { ...human, hand: [card('human-four', '4'), card('human-nine', '9')] },
        { ...bot, hand: [card('bot-own', 'K', true)] },
        { ...otherBot, hand: [card('other-bot-two', '2'), card('other-bot-eight', '8')] },
      ],
    };

    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(getBotAction(state, bot.id, 'beginner')).toEqual({
      kind: 'use-power',
      targetCardId: 'other-bot-two',
    });
    expect(getBotAction(state, bot.id, 'amateur')).toEqual({
      kind: 'use-power',
      targetCardId: 'human-four',
    });

    random.mockReturnValue(0.1);
    expect(getBotAction(state, bot.id, 'professional')).toEqual({
      kind: 'use-power',
      targetCardId: 'human-four',
    });
    expect(getBotAction(state, bot.id, 'legend')).toEqual({
      kind: 'use-power',
      targetCardId: 'human-four',
    });
    random.mockRestore();
  });

  it('increases bot King punishment chance with difficulty', () => {
    const initial = createInitialGameState(['Ana', 'Bot Uno', 'Bot Dos'], {
      difficulty: 'amateur',
    });
    const bot = initial.players[1]!;
    const state = {
      ...initial,
      phase: 'special-power' as const,
      pendingPower: 'K' as const,
      pendingPowerPlayerId: bot.id,
      currentPlayerId: bot.id,
    };
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.3);

    expect(getBotAction(state, bot.id, 'beginner')).toEqual({ kind: 'skip-power' });
    expect(getBotAction(state, bot.id, 'amateur').kind).toBe('punish');
    expect(getBotAction(state, bot.id, 'professional').kind).toBe('punish');
    expect(getBotAction(state, bot.id, 'legend').kind).toBe('punish');
    random.mockRestore();
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
