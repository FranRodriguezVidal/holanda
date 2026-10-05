import type { Card } from '../../game';

const suitFileNames = {
  hearts: 'CORAZON',
  diamonds: 'DIAMANTE',
  clubs: 'TREBOL',
  spades: 'PICAS',
} as const;

const rankFileNames = ['AS', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const suitNames = Object.values(suitFileNames);
const jokerFileNames = ['JOKER_1.webp', 'JOKER_1RED.webp', 'JOKER_2.webp', 'JOKER_2RED.webp'];

export const classicCardBackImage = '/cardsclasic/DORSO.webp';

export const classicCardArtImages = [
  ...rankFileNames.flatMap((rank) =>
    suitNames.map((suit) => `/cardsclasic/${rank}_${suit}.webp`),
  ),
  ...jokerFileNames.map((fileName) => `/cardsclasic/${fileName}`),
  classicCardBackImage,
];

export function getClassicCardArtByRank(rank: string, suit = 'CORAZON'): string {
  const fileRank = rank === 'A' ? 'AS' : rank;
  return `/cardsclasic/${fileRank}_${suit}.webp`;
}

export function getClassicCardArt(card: Card): string | undefined {
  if (card.suit === 'wild') {
    const jokerIndex = Number(card.id.replace('joker-', '')) - 1;
    return `/cardsclasic/${jokerFileNames[jokerIndex] ?? jokerFileNames[0]}`;
  }

  const suit = suitFileNames[card.suit];
  const rank = card.rank === 'A' ? 'AS' : card.rank;
  if (!suit || !rankFileNames.includes(rank)) {
    return undefined;
  }

  return `/cardsclasic/${rank}_${suit}.webp`;
}
