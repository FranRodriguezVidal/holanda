import type { Card as GameCard } from '../../game';

export type CardAnimationVariant = 'draw' | 'flip' | 'swap' | 'discard' | 'punish';

interface CardProps {
  card: GameCard;
  faceUp?: boolean;
  disabled?: boolean;
  selected?: boolean;
  animationVariant?: CardAnimationVariant;
  onClick?: () => void;
  className?: string;
}

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
  wild: '?',
};

export function Card({
  card,
  faceUp = card.faceUp,
  disabled = false,
  selected = card.isSelected,
  animationVariant,
  onClick,
  className = '',
}: CardProps) {
  const revealed = faceUp;
  const label = revealed ? `${card.rank} of ${card.suit}` : 'Hidden card';

  return (
    <button
      type="button"
      className={[
        'card',
        revealed ? 'card--face-up' : 'card--face-down',
        selected ? 'card--selected' : '',
        animationVariant ? `card--anim-${animationVariant}` : '',
        disabled ? 'card--disabled' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {revealed ? (
        <>
          <span className="card__value card__value--top">{card.rank}</span>
          <span className="card__suit">{suitSymbols[card.suit] ?? card.suit}</span>
          <span className="card__value card__value--bottom">{card.rank}</span>
        </>
      ) : (
        <span aria-hidden="true">?</span>
      )}
    </button>
  );
}
