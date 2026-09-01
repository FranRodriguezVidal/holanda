export type Locale = 'en' | 'es';

export const translations = {
  en: {
    description: 'Enjoy the HOLANDA game experience.',
    createTable: 'Play',
    chooseMode: 'Choose how you want to play',
    offlineBot: 'OFFLINE',
    offlineBotDescription: 'Play against bots',
    createPrivateRoom: 'Create private room',
    createPrivateRoomDescription: 'Invite your friends with a room code',
    createMatch: 'Create match',
    joinMatch: 'Join a match',
    joinMatchDescription: 'Connect to an online game',
    joinWithCode: 'Join with code',
    joinOnlineMatch: 'Join online match',
    onlineComingSoon: 'Online games will be available soon.',
    offlineComingSoon: 'Game under development. Coming soon!',
    betaNotice: 'HOLANDA is in beta. Online mode is still in development; currently, only matches against bots are available.',
    back: 'Back',
    joinCode: 'Join with code',
    match: 'Match',
    resetTable: 'Reset table',
    exit: 'Exit',
    phase: 'Phase',
    turn: 'Turn',
    current: 'Current',
    waiting: 'Waiting',
    empty: 'Empty',
    discardPile: 'Discard pile',
    gameTableAria: 'Game table',
    deckAria: 'Deck',
    play: 'Play',
  },
  es: {
    description: 'Disfruta la experiencia del juego de HOLANDA.',
    createTable: 'Jugar',
    chooseMode: 'Elige cómo quieres jugar',
    offlineBot: 'OFFLINE',
    offlineBotDescription: 'Juega contra bots',
    createPrivateRoom: 'Crear sala privada',
    createPrivateRoomDescription: 'Invita a tus amigos con un código de sala',
    createMatch: 'Crear partida',
    joinMatch: 'Unirse a una partida',
    joinMatchDescription: 'Conéctate a una partida online',
    joinWithCode: 'Unirse mediante código',
    joinOnlineMatch: 'Unirse a una partida online',
    onlineComingSoon: 'Las partidas online estarán disponibles próximamente.',
    offlineComingSoon: 'Juego en desarrollo. ¡Muy pronto disponible!',
    betaNotice: 'HOLANDA está en beta. El modo online sigue en desarrollo; por ahora, solo están disponibles las partidas contra bots.',
    back: 'Volver',
    joinCode: 'Unirse con código',
    match: 'Partida',
    resetTable: 'Reiniciar mesa',
    exit: 'Salir',
    phase: 'Fase',
    turn: 'Turno',
    current: 'Actual',
    waiting: 'Esperando',
    empty: 'Vacío',
    discardPile: 'Pila de descarte',
    gameTableAria: 'Mesa de juego',
    deckAria: 'Mazo',
    play: 'Jugar',
  },
} as const;

export const getDefaultLocale = (): Locale => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const browserLanguage = navigator.language.toLowerCase();
  return browserLanguage.startsWith('es') ? 'es' : 'en';
};
