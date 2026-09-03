import type { GameState } from '../../game';
import type { Locale } from '../../i18n/translations';
import { translations } from '../../i18n/translations';
import { Card } from '../cards/Card';

interface GameTableProps {
  state: GameState;
  locale: Locale;
}

export function GameTable({ state, locale }: GameTableProps) {
  const currentPlayer = state.players.find((player) => player.id === state.currentPlayerId);
  const topDeckCard = state.deck[0];
  const topDiscardCard = state.discardPile[0];
  const labels = translations[locale];
  const isTwoPlayerTable = state.players.length === 2;
  const isThreePlayerTable = state.players.length === 3;
  const isFourPlayerTable = state.players.length === 4;

  if (isFourPlayerTable) {
    const [localPlayer, topPlayer, leftPlayer, rightPlayer] = state.players;
    const visualDiscardCard = topDiscardCard ?? state.deck[1];

    if (!localPlayer || !topPlayer || !leftPlayer || !rightPlayer) {
      return null;
    }

    return (
      <section className="game-table game-table--four-player" aria-label={labels.gameTableAria}>
        <div className="four-player-table">
          <article className="four-player-seat four-player-seat--top">
            <h3>{topPlayer.name}</h3>
            <div className="four-player-hand" aria-label={`${topPlayer.name} hand`}>
              {topPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>

          <article className="four-player-seat four-player-seat--left">
            <h3>{leftPlayer.name}</h3>
            <div className="four-player-hand" aria-label={`${leftPlayer.name} hand`}>
              {leftPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>

          <article className="four-player-seat four-player-seat--right">
            <h3>{rightPlayer.name}</h3>
            <div className="four-player-hand" aria-label={`${rightPlayer.name} hand`}>
              {rightPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>

          <div className="four-player-piles" aria-label={labels.gameTableAria}>
            <div className="table__pile table__pile--deck" aria-label={labels.deckAria}>
              {topDeckCard ? <Card card={topDeckCard} faceUp={false} disabled /> : <div className="pile-empty">{labels.empty}</div>}
            </div>
            <div className="table__pile table__pile--discard" aria-label={labels.discardPile}>
              {visualDiscardCard ? (
                <Card card={visualDiscardCard} faceUp disabled />
              ) : (
                <div className="pile-empty">{labels.discardPile}</div>
              )}
            </div>
          </div>

          <article className="four-player-seat four-player-seat--local">
            <h3>{localPlayer.name}</h3>
            <div className="four-player-hand" aria-label={`${localPlayer.name} hand`}>
              {localPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (isThreePlayerTable) {
    const [localPlayer, leftPlayer, rightPlayer] = state.players;
    const visualDiscardCard = topDiscardCard ?? state.deck[1];

    if (!localPlayer || !leftPlayer || !rightPlayer) {
      return null;
    }

    return (
      <section className="game-table game-table--three-player" aria-label={labels.gameTableAria}>
        <div className="three-player-table">
          <article className="three-player-seat three-player-seat--left">
            <h3>{leftPlayer.name}</h3>
            <div className="three-player-hand" aria-label={`${leftPlayer.name} hand`}>
              {leftPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>

          <article className="three-player-seat three-player-seat--right">
            <h3>{rightPlayer.name}</h3>
            <div className="three-player-hand" aria-label={`${rightPlayer.name} hand`}>
              {rightPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>

          <div className="three-player-piles" aria-label={labels.gameTableAria}>
            <div className="table__pile table__pile--deck" aria-label={labels.deckAria}>
              {topDeckCard ? <Card card={topDeckCard} faceUp={false} disabled /> : <div className="pile-empty">{labels.empty}</div>}
            </div>
            <div className="table__pile table__pile--discard" aria-label={labels.discardPile}>
              {visualDiscardCard ? (
                <Card card={visualDiscardCard} faceUp disabled />
              ) : (
                <div className="pile-empty">{labels.discardPile}</div>
              )}
            </div>
          </div>

          <article className="three-player-seat three-player-seat--local">
            <h3>{localPlayer.name}</h3>
            <div className="three-player-hand" aria-label={`${localPlayer.name} hand`}>
              {localPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>
        </div>
      </section>
    );
  }

  if (isTwoPlayerTable) {
    const [localPlayer, opponent] = state.players;
    const visualDiscardCard = topDiscardCard ?? state.deck[1];

    if (!localPlayer || !opponent) {
      return null;
    }

    return (
      <section className="game-table game-table--two-player" aria-label={labels.gameTableAria}>
        <div className="two-player-table">
          <article className="two-player-seat two-player-seat--opponent">
            <h3>{opponent.name}</h3>
            <div className="two-player-hand" aria-label={`${opponent.name} hand`}>
              {opponent.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
          </article>

          <div className="two-player-piles" aria-label={labels.gameTableAria}>
            <div className="table__pile table__pile--deck" aria-label={labels.deckAria}>
              {topDeckCard ? <Card card={topDeckCard} faceUp={false} disabled /> : <div className="pile-empty">{labels.empty}</div>}
            </div>
            <div className="table__pile table__pile--discard" aria-label={labels.discardPile}>
              {visualDiscardCard ? (
                <Card card={visualDiscardCard} faceUp disabled />
              ) : (
                <div className="pile-empty">{labels.discardPile}</div>
              )}
            </div>
          </div>

          <article className="two-player-seat two-player-seat--local">
            <h3>{localPlayer.name}</h3>
            <div className="two-player-hand" aria-label={`${localPlayer.name} hand`}>
              {localPlayer.hand.slice(0, 4).map((card) => (
                <Card key={card.id} card={card} faceUp={false} disabled />
              ))}
            </div>
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
          <div className="table__pile table__pile--deck" aria-label={labels.deckAria}>
            {topDeckCard ? <Card card={topDeckCard} faceUp={false} /> : <div className="pile-empty">{labels.empty}</div>}
          </div>
          <div className="table__pile table__pile--discard" aria-label={labels.discardPile}>
            {topDiscardCard ? (
              <Card card={topDiscardCard} faceUp={true} />
            ) : (
              <div className="pile-empty">{labels.discardPile}</div>
            )}
          </div>
        </div>
      </div>

      <div className="players-grid">
        {state.players.map((player) => (
          <article
            key={player.id}
            className={['player-seat', player.id === currentPlayer?.id ? 'player-seat--active' : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className="player-seat__header">
              <h3>{player.name}</h3>
              <span>{player.id === state.currentPlayerId ? labels.current : labels.waiting}</span>
            </div>
            <div className="player-seat__hand" aria-label={`${player.name} hand`}>
              {player.hand.map((card) => (
                <Card key={card.id} card={card} faceUp={card.faceUp || player.id === state.currentPlayerId} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
