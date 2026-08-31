import type { Card, CardRank, CardSuit } from '../types';

const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (): Card[] => {
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
        isSelected: false,
      });
    }
  }

  return deck;
};

export const shuffleDeck = (cards: Card[]): Card[] => {
  const nextDeck = [...cards];

  for (let index = nextDeck.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentCard = nextDeck[index];
    const randomCard = nextDeck[randomIndex];

    if (currentCard && randomCard) {
      [nextDeck[index], nextDeck[randomIndex]] = [randomCard, currentCard];
    }
  }

  return nextDeck;
};
