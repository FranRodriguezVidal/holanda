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
