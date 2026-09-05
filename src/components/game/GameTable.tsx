import type { Card as GameCard, GameState } from '../../game';
import type { Locale } from '../../i18n/translations';
import { translations } from '../../i18n/translations';
import { Card } from '../cards/Card';

interface GameTableProps {
  state: GameState;
  locale: Locale;
  localPlayerId: string;
  onDrawDeck?: () => void;
  onDrawDiscard?: () => void;
  onCardClick?: (playerId: string, card: GameCard) => void;
  onDiscardDrawn?: () => void;
}

const renderHand = (
  cards: GameCard[],
  playerId: string,
  localPlayerId: string,
  onCardClick: GameTableProps['onCardClick'],
  extraClass = '',
  allowOpponentClicks = false,
) => (
  <div className={`game-hand ${extraClass}`} aria-label={`${playerId} hand`}>
    {cards.map((card) => {
      const isLocal = playerId === localPlayerId;
      const clickable = Boolean(onCardClick) && (isLocal || allowOpponentClicks);
      return (
        <Card
          key={card.id}
          card={card}
          faceUp={card.faceUp}
          disabled={!clickable}
          onClick={clickable ? () => onCardClick!(playerId, card) : undefined}
        />
      );
    })}
  </div>
);

export function GameTable({
  state,
  locale,
  localPlayerId,
  onDrawDeck,
  onDrawDiscard,
  onCardClick,
  onDiscardDrawn,
}: GameTableProps) {
  const labels = translations[locale];
  const isTwoPlayerTable = state.players.length === 2;
  const isThreePlayerTable = state.players.length === 3;
  const isFourPlayerTable = state.players.length === 4;
  const topDiscardCard = state.discardPile[0];
  const allowOpponentClicks =
    state.phase === 'special-power' &&
    state.pendingPowerPlayerId === localPlayerId &&
    (state.pendingPower === 'Q' ||
      (state.pendingPower === 'J' &&
        Boolean(
          state.players
            .find((player) => player.id === localPlayerId)
            ?.hand.some((card) => card.isSelected),
        )));

  const deckPile = (
    <div className="table__pile table__pile--deck" aria-label={labels.deckAria}>
      {state.deck.length > 0 ? (
        <Card
          card={state.deck[0]!}
          faceUp={false}
          onClick={onDrawDeck}
          disabled={!onDrawDeck}
        />
      ) : (
        <div className="pile-empty">{labels.empty}</div>
      )}
    </div>
  );

  const discardPile = (
    <div className="table__pile table__pile--discard" aria-label={labels.discardPile}>
      {topDiscardCard ? (
        <Card
          card={topDiscardCard}
          faceUp
          onClick={onDrawDiscard}
          disabled={!onDrawDiscard}
        />
      ) : (
        <div className="pile-empty">{labels.discardPile}</div>
      )}
    </div>
  );

  const drawnCardNode = state.drawnCard ? (
    <div className="drawn-card-area">
      <Card card={state.drawnCard} faceUp onClick={onDiscardDrawn} disabled={!onDiscardDrawn} />
      <p className="drawn-card-hint">{labels.discardPile}</p>
    </div>
  ) : null;

  if (isFourPlayerTable) {
    const [localPlayer, topPlayer, leftPlayer, rightPlayer] = state.players;

    if (!localPlayer || !topPlayer || !leftPlayer || !rightPlayer) {
      return null;
    }

    return (
      <section className="game-table game-table--four-player" aria-label={labels.gameTableAria}>
        <div className="four-player-table">
          <article className="four-player-seat four-player-seat--top">
            <h3>{topPlayer.name}</h3>
            {renderHand(topPlayer.hand, topPlayer.id, localPlayerId, onCardClick, 'four-player-hand', allowOpponentClicks)}
          </article>

          <article className="four-player-seat four-player-seat--left">
            <h3>{leftPlayer.name}</h3>
            {renderHand(leftPlayer.hand, leftPlayer.id, localPlayerId, onCardClick, 'four-player-hand', allowOpponentClicks)}
          </article>

          <article className="four-player-seat four-player-seat--right">
            <h3>{rightPlayer.name}</h3>
            {renderHand(rightPlayer.hand, rightPlayer.id, localPlayerId, onCardClick, 'four-player-hand', allowOpponentClicks)}
          </article>

          <div className="four-player-piles" aria-label={labels.gameTableAria}>
            {deckPile}
            {discardPile}
            {drawnCardNode}
          </div>

          <article className="four-player-seat four-player-seat--local">
            <h3>{localPlayer.name}</h3>
            {renderHand(localPlayer.hand, localPlayer.id, localPlayerId, onCardClick, 'four-player-hand', allowOpponentClicks)}
          </article>
        </div>
      </section>
    );
  }

  if (isThreePlayerTable) {
    const [localPlayer, leftPlayer, rightPlayer] = state.players;

    if (!localPlayer || !leftPlayer || !rightPlayer) {
      return null;
    }

    return (
      <section className="game-table game-table--three-player" aria-label={labels.gameTableAria}>
        <div className="three-player-table">
          <article className="three-player-seat three-player-seat--left">
            <h3>{leftPlayer.name}</h3>
            {renderHand(leftPlayer.hand, leftPlayer.id, localPlayerId, onCardClick, 'three-player-hand', allowOpponentClicks)}
          </article>

          <article className="three-player-seat three-player-seat--right">
            <h3>{rightPlayer.name}</h3>
            {renderHand(rightPlayer.hand, rightPlayer.id, localPlayerId, onCardClick, 'three-player-hand', allowOpponentClicks)}
          </article>

          <div className="three-player-piles" aria-label={labels.gameTableAria}>
            {deckPile}
            {discardPile}
            {drawnCardNode}
          </div>

          <article className="three-player-seat three-player-seat--local">
            <h3>{localPlayer.name}</h3>
            {renderHand(localPlayer.hand, localPlayer.id, localPlayerId, onCardClick, 'three-player-hand', allowOpponentClicks)}
          </article>
        </div>
      </section>
    );
  }

  if (isTwoPlayerTable) {
    const [localPlayer, opponent] = state.players;

    if (!localPlayer || !opponent) {
      return null;
    }

    return (
      <section className="game-table game-table--two-player" aria-label={labels.gameTableAria}>
        <div className="two-player-table">
          <article className="two-player-seat two-player-seat--opponent">
            <h3>{opponent.name}</h3>
            {renderHand(opponent.hand, opponent.id, localPlayerId, onCardClick, 'two-player-hand', allowOpponentClicks)}
          </article>

          <div className="two-player-piles" aria-label={labels.gameTableAria}>
            {deckPile}
            {discardPile}
            {drawnCardNode}
          </div>

          <article className="two-player-seat two-player-seat--local">
            <h3>{localPlayer.name}</h3>
            {renderHand(localPlayer.hand, localPlayer.id, localPlayerId, onCardClick, 'two-player-hand', allowOpponentClicks)}
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="game-table" aria-label={labels.gameTableAria}>
      <header className="game-table__header">
        <div>
          <p className="game-table__label">{labels.phase}</p>
          <h2>{state.phase}</h2>
        </div>
        <div>
          <p className="game-table__label">{labels.turn}</p>
          <h2>#{state.turnNumber}</h2>
        </div>
      </header>

      <div className="table" aria-live="polite">
        <div className="table__center">
          {deckPile}
          {discardPile}
          {drawnCardNode}
        </div>
      </div>

      <div className="players-grid">
        {state.players.map((player) => (
          <article
            key={player.id}
            className={['player-seat', player.id === state.currentPlayerId ? 'player-seat--active' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className="player-seat__header">
              <h3>{player.name}</h3>
              <span>{player.id === state.currentPlayerId ? labels.current : labels.waiting}</span>
            </div>
            {renderHand(player.hand, player.id, localPlayerId, onCardClick)}
          </article>
        ))}
      </div>
    </section>
  );
}