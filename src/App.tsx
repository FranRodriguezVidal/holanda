import { useEffect, useState, type CSSProperties } from 'react';
import { GameTable } from './components/game/GameTable';
import { Button } from './components/ui/Button';
import { getDefaultLocale, translations, type Locale } from './i18n/translations';
import { useGameStore } from './store/useGameStore';

const players = ['Ana', 'Bruno', 'Carmen', 'Diego'];
const fallingCardImages = [
  '/inicio_animacion/trebol.png',
  '/inicio_animacion/picas.jpg',
  '/inicio_animacion/joker.jpg',
] as const;

const fallingCards = Array.from({ length: 14 }, (_, index) => ({
  id: `falling-card-${index}`,
  image: fallingCardImages[index % fallingCardImages.length]!,
  style: {
    '--fall-left': `${(index * 29 + 7) % 100}%`,
    '--fall-delay': `${-((index * 1.37) % 12)}s`,
    '--fall-duration': `${10 + ((index * 1.91) % 7)}s`,
    '--fall-rotation': `${((index * 47) % 70) - 35}deg`,
    '--fall-size': `${72 + ((index * 13) % 42)}px`,
  } as CSSProperties,
}));

function getInitialLocale(): Locale {
  const storedValue = localStorage.getItem('holanda.locale');
  if (storedValue === 'en' || storedValue === 'es') {
    return storedValue;
  }

  return getDefaultLocale();
}

function LanguageSelector({
  locale,
  onLanguageChange,
}: {
  locale: Locale;
  onLanguageChange: (nextLocale: Locale) => void;
}) {
  return (
    <div className="language-switcher" aria-label="Language selector">
      <button
        type="button"
        className={locale === 'en' ? 'language-switcher__button is-active' : 'language-switcher__button'}
        aria-label="English"
        aria-pressed={locale === 'en'}
        onClick={() => onLanguageChange('en')}
        title="English"
      >
        <img src="/icon/english.svg" alt="English" />

      </button>
      <button
        type="button"
        className={locale === 'es' ? 'language-switcher__button is-active' : 'language-switcher__button'}
        aria-label="Español"
        aria-pressed={locale === 'es'}
        onClick={() => onLanguageChange('es')}
        title="Español"
      >
        <img src="/icon/spain.webp" alt="Español" />
      </button>
    </div>
  );
}

function HomeScreen({ locale, onStart, onLanguageChange }: { locale: Locale; onStart: () => void; onLanguageChange: (nextLocale: Locale) => void }) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA home screen">
      <div className="falling-cards" aria-hidden="true">
        {fallingCards.map(({ id, image, style }) => (
          <img key={id} className="falling-card" src={image} alt="" style={style} />
        ))}
      </div>
      <section className="hero-panel">
        <LanguageSelector locale={locale} onLanguageChange={onLanguageChange} />

        <h1>H♦L♥ND♠</h1>
        <p>{text.description}</p>

        <div className="hero-panel__actions">
          <Button onClick={onStart}>{text.createTable}</Button>
        </div>
      </section>
    </main>
  );
}

type MenuScreen = 'home' | 'mode-select' | 'game';

function ModeSelectScreen({
  locale,
  onBack,
  onOffline,
}: {
  locale: Locale;
  onBack: () => void;
  onOffline: () => void;
}) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA game modes">
      <section className="hero-panel">
        <h1>H♦L♥ND♠</h1>
        <p>{text.chooseMode}</p>
        <p id="online-mode-notice" className="beta-notice" role="status">
          {text.betaNotice}
        </p>
        <div className="mode-actions">
          <button className="mode-button" type="button" disabled aria-describedby="online-mode-notice">
          {/*<button className="mode-button" type="button" onClick={onOffline}> */}
            <strong>{text.offlineBot}</strong>
            <span>{text.offlineBotDescription}</span>
          </button>
          <button className="mode-button" type="button" disabled aria-describedby="online-mode-notice">
            <strong>{text.createPrivateRoom}</strong>
            <span>{text.createPrivateRoomDescription}</span>
          </button>
          <button className="mode-button" type="button" disabled aria-describedby="online-mode-notice">
            <strong>{text.joinMatch}</strong>
            <span>{text.joinMatchDescription}</span>
          </button>
        </div>
        <div className="hero-panel__actions">
          <Button variant="secondary" onClick={onBack}>
            {text.back}
          </Button>
        </div>
      </section>
    </main>
  );
}

function GameScreen({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const { game, resetGame } = useGameStore();
  const text = translations[locale];

  return (
    <main className="screen screen--game" aria-label="HOLANDA game table">
      <header className="topbar">
        <div>
          <p className="eyebrow">{text.match}</p>
          <h2>{game.id}</h2>
        </div>
        <div className="topbar__actions">
          <Button variant="secondary" onClick={() => resetGame(players)}>
            {text.resetTable}
          </Button>
          <Button variant="secondary" onClick={onBack}>
            {text.exit}
          </Button>
        </div>
      </header>

      <GameTable state={game} locale={locale} />
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<MenuScreen>('home');
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const { resetGame } = useGameStore();

  useEffect(() => {
    localStorage.setItem('holanda.locale', locale);
  }, [locale]);

  const handleStart = () => {
    resetGame(players);
    setScreen('game');
  };

  return (
    <>
      <nav className="app-utilities" aria-label="Application utilities">
        <button type="button" className="utility-button" aria-label="Information" title="Information">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 7v4M8 4.5v.1" />
          </svg>
        </button>
        <button type="button" className="utility-button" aria-label="Settings" title="Settings">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6.3 1.8h3.4l.5 1.5 1.4.6 1.5-.5 1.7 2.9-1.1 1.1v1.2l1.1 1.1-1.7 2.9-1.5-.5-1.4.6-.5 1.5H6.3l-.5-1.5-1.4-.6-1.5.5-1.7-2.9 1.1-1.1V7.4L2.2 6.3l1.7-2.9 1.5.5 1.4-.6z" />
            <circle cx="8" cy="8" r="2.1" />
          </svg>
        </button>
      </nav>
      {screen === 'home' ? (
        <HomeScreen locale={locale} onStart={() => setScreen('mode-select')} onLanguageChange={setLocale} />
      ) : screen === 'mode-select' ? (
        <ModeSelectScreen locale={locale} onBack={() => setScreen('home')} onOffline={handleStart} />
      ) : (
        <GameScreen locale={locale} onBack={() => setScreen('mode-select')} />
      )}
    </>
  );
}
