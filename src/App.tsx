import { useEffect, useState, type CSSProperties } from 'react';
import { GameTable } from './components/game/GameTable';
import { Button } from './components/ui/Button';
import { InstallInstructions } from './components/ui/InstallInstructions';
import { InstallPromptModal } from './components/ui/InstallPromptModal';
import { getDefaultLocale, translations, type Locale } from './i18n/translations';
import { useGameStore } from './store/useGameStore';
import { isMobileDevice, isStandaloneDisplayMode } from './utils/device';
import { getRandomBotName } from './utils/botNames';
import { getRandomExitPhrase } from './utils/exitPhrases';

const SETTINGS_KEY = 'holanda.settings';
const INSTALL_PROMPT_DISMISSED_KEY = 'holanda.installPromptDismissed';
const WHATS_NEW_KEY = 'holanda.whatsNewSeen';
const WHATS_NEW_VERSION = '2026-09-03-2';

type Theme = 'dark' | 'light';

interface AppSettings {
  brightness: number;
  musicVolume: number;
  theme: Theme;
}

const defaultSettings: AppSettings = {
  brightness: 100,
  musicVolume: 50,
  theme: 'dark',
};
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

function getInitialSettings(): AppSettings {
  const savedSettings = localStorage.getItem(SETTINGS_KEY);
  if (!savedSettings) {
    return defaultSettings;
  }

  try {
    const parsedSettings: unknown = JSON.parse(savedSettings);
    if (
      typeof parsedSettings === 'object' &&
      parsedSettings !== null &&
      'brightness' in parsedSettings &&
      'musicVolume' in parsedSettings &&
      'theme' in parsedSettings &&
      typeof parsedSettings.brightness === 'number' &&
      typeof parsedSettings.musicVolume === 'number' &&
      (parsedSettings.theme === 'dark' || parsedSettings.theme === 'light')
    ) {
      return {
        brightness: Math.min(100, Math.max(0, parsedSettings.brightness)),
        musicVolume: Math.min(100, Math.max(0, parsedSettings.musicVolume)),
        theme: parsedSettings.theme,
      };
    }
  } catch (error) {
    console.warn('Unable to read HOLANDA settings from local storage.', error);
  }

  return defaultSettings;
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

function HomeScreen({
  locale,
  onStart,
  onLanguageChange,
  isMobileBrowser,
}: {
  locale: Locale;
  onStart: () => void;
  onLanguageChange: (nextLocale: Locale) => void;
  isMobileBrowser: boolean;
}) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA home screen">
      <div className="falling-cards" aria-hidden="true">
        {fallingCards.map(({ id, image, style }) => (
          <img key={id} className="falling-card" src={image} alt="" style={style} />
        ))}
      </div>
      <section className={isMobileBrowser ? 'hero-panel hero-panel--compact' : 'hero-panel'}>
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

type MenuScreen =
  | 'home'
  | 'mode-select'
  | 'offline-difficulty'
  | 'offline-participants'
  | 'offline-soon'
  | 'game';

type BotDifficulty = 'beginner' | 'amateur' | 'professional' | 'legend';
type ParticipantCount = 2 | 3 | 4;

function ModeSelectScreen({
  locale,
  onBack,
  onOffline,
  isMobileBrowser,
}: {
  locale: Locale;
  onBack: () => void;
  onOffline: () => void;
  isMobileBrowser: boolean;
}) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA game modes">
      <section className={isMobileBrowser ? 'hero-panel hero-panel--compact' : 'hero-panel'}>
        <h1>H♦L♥ND♠</h1>
        <p>{text.chooseMode}</p>
        <p id="online-mode-notice" className="beta-notice" role="status">
          {text.betaNotice}
        </p>
        <div className="mode-actions">
          <button className="mode-button" type="button" onClick={onOffline}>
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

function OfflineDifficultyScreen({
  locale,
  onBack,
  onSelectDifficulty,
  isMobileBrowser,
}: {
  locale: Locale;
  onBack: () => void;
  onSelectDifficulty: (difficulty: BotDifficulty) => void;
  isMobileBrowser: boolean;
}) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA bot difficulty">
      <section className={isMobileBrowser ? 'hero-panel hero-panel--compact' : 'hero-panel'}>
        <h1>H♦L♥ND♠</h1>
        <p>{text.chooseDifficulty}</p>
        <div className="mode-actions">
          <button className="mode-button" type="button" onClick={() => onSelectDifficulty('beginner')}>
            <strong>{text.difficultyBeginner}</strong>
            <span>{text.difficultyBeginnerDescription}</span>
          </button>
          <button className="mode-button" type="button" onClick={() => onSelectDifficulty('amateur')}>
            <strong>{text.difficultyAmateur}</strong>
            <span>{text.difficultyAmateurDescription}</span>
          </button>
          <button className="mode-button" type="button" onClick={() => onSelectDifficulty('professional')}>
            <strong>{text.difficultyProfessional}</strong>
            <span>{text.difficultyProfessionalDescription}</span>
          </button>
          <button className="mode-button" type="button" onClick={() => onSelectDifficulty('legend')}>
            <strong>{text.difficultyLegend}</strong>
            <span>{text.difficultyLegendDescription}</span>
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

function OfflineParticipantsScreen({
  locale,
  onBack,
  onSelectParticipants,
  isMobileBrowser,
}: {
  locale: Locale;
  onBack: () => void;
  onSelectParticipants: (participantCount: ParticipantCount) => void;
  isMobileBrowser: boolean;
}) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA participant selection">
      <section className={isMobileBrowser ? 'hero-panel hero-panel--compact' : 'hero-panel'}>
        <h1>H♦L♥ND♠</h1>
        <p>{text.chooseParticipants}</p>
        <div className="mode-actions">
          <button className="mode-button" type="button" onClick={() => onSelectParticipants(2)}>
            <strong>2</strong>
            <span>{text.participants}</span>
          </button>
          <button className="mode-button" type="button" onClick={() => onSelectParticipants(3)}>
            <strong>3</strong>
            <span>{text.participants}</span>
          </button>
          <button className="mode-button" type="button" onClick={() => onSelectParticipants(4)}>
            <strong>4</strong>
            <span>{text.participants}</span>
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

function OfflineSoonScreen({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const text = translations[locale];

  return (
    <main className="screen screen--home" aria-label="HOLANDA offline mode">
      <section className="hero-panel">
        <h1>H♦L♥ND♠</h1>
        <p>{text.offlineComingSoon}</p>
        <div className="hero-panel__actions">
          <Button variant="secondary" onClick={onBack}>
            {text.back}
          </Button>
        </div>
      </section>
    </main>
  );
}

const difficultyLabelKey: Record<BotDifficulty, 'matchBeginner' | 'matchAmateur' | 'matchProfessional' | 'matchLegend'> = {
  beginner: 'matchBeginner',
  amateur: 'matchAmateur',
  professional: 'matchProfessional',
  legend: 'matchLegend',
};

function GameScreen({
  locale,
  difficulty,
  onBack,
}: {
  locale: Locale;
  difficulty: BotDifficulty | null;
  onBack: () => void;
}) {
  const { game } = useGameStore();
  const text = translations[locale];
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitPhrase, setExitPhrase] = useState('');
  const [showRules, setShowRules] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const matchLabel = difficulty ? text[difficultyLabelKey[difficulty]] : text.match;

  return (
    <main className="screen screen--game" aria-label="HOLANDA game table">
      <header className="topbar topbar--game">
        <p className="eyebrow eyebrow--inline">{matchLabel}</p>
        <div className="topbar__actions">
          <button
            type="button"
            className="utility-button"
            aria-label={text.rulesButton}
            title={text.rulesButton}
            onClick={() => setShowRules(true)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 7v4M8 4.5v.1" />
            </svg>
          </button>
          <button
            type="button"
            className="utility-button"
            aria-label={text.reportButton}
            title={text.reportButton}
            onClick={() => setShowReport(true)}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="icon--wrench">
              <path d="M10.6 2.2a3.1 3.1 0 0 0-3.9 3.7L2.4 10.2a1.5 1.5 0 0 0 2.1 2.1l4.3-4.3a3.1 3.1 0 0 0 3.7-3.9l-1.7 1.7-1.5-.4-.4-1.5z" />
            </svg>
          </button>
          <Button
            variant="secondary"
            onClick={() => {
              setExitPhrase(getRandomExitPhrase(locale));
              setShowExitConfirm(true);
            }}
          >
            {text.exit}
          </Button>
        </div>
      </header>

      <GameTable state={game} locale={locale} />

      {showRules && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowRules(false)}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="rules-modal-title">{text.rulesTitle}</h2>
            <p>{text.rulesBody}</p>
            <div className="modal-actions">
              <Button onClick={() => setShowRules(false)}>{text.installDismiss}</Button>
            </div>
          </section>
        </div>
      )}

      {showReport && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowReport(false)}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="report-modal-title">{text.reportTitle}</h2>
            <p>{text.reportBody}</p>
            <div className="modal-actions">
              <Button onClick={() => setShowReport(false)}>{text.installDismiss}</Button>
            </div>
          </section>
        </div>
      )}

      {showExitConfirm && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowExitConfirm(false)}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="exit-modal-title">{text.exitConfirmTitle}</h2>
            <p>{exitPhrase}</p>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)}>
                {text.exitConfirmCancel}
              </Button>
              <Button onClick={onBack}>{text.exitConfirmAccept}</Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<MenuScreen>('home');
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [isMobileBrowser] = useState<boolean>(() => isMobileDevice() && !isStandaloneDisplayMode());
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(() => {
    const alreadyDismissed = localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === 'true';
    return isMobileDevice() && !isStandaloneDisplayMode() && !alreadyDismissed;
  });
  const [showInfo, setShowInfo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [selectedDifficulty, setSelectedDifficulty] = useState<BotDifficulty | null>(null);
  const [showSettingsReport, setShowSettingsReport] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState<boolean>(
    () => localStorage.getItem(WHATS_NEW_KEY) !== WHATS_NEW_VERSION,
  );
  const { resetGame } = useGameStore();

  useEffect(() => {
    localStorage.setItem('holanda.locale', locale);
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty(
      '--app-brightness',
      `${Math.max(0.35, settings.brightness / 100)}`,
    );
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const markUpdateAvailable = () => setUpdateAvailable(true);
    window.addEventListener('holanda-update-available', markUpdateAvailable);
    return () => window.removeEventListener('holanda-update-available', markUpdateAvailable);
  }, []);

  const handleOffline = () => {
    setScreen('offline-difficulty');
  };

  const handleSelectDifficulty = (difficulty: BotDifficulty) => {
    setSelectedDifficulty(difficulty);
    setScreen('offline-participants');
  };

  const handleSelectParticipants = (participantCount: ParticipantCount) => {
    if (participantCount === 2) {
      resetGame(locale === 'es' ? ['Tú', getRandomBotName()] : ['You', getRandomBotName()]);
      setScreen('game');
      return;
    }

    if (participantCount === 3) {
      const localName = locale === 'es' ? 'Tú' : 'You';
      const botOne = getRandomBotName();
      let botTwo = getRandomBotName();
      while (botTwo === botOne) {
        botTwo = getRandomBotName();
      }
      resetGame([localName, botOne, botTwo]);
      setScreen('game');
      return;
    }

    setScreen('offline-soon');
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
  };

  const dismissInstallPromptForever = () => {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    setShowInstallPrompt(false);
  };

  const applyUpdate = () => {
    window.dispatchEvent(new Event('holanda-apply-update'));
  };

  const dismissWhatsNew = () => {
    localStorage.setItem(WHATS_NEW_KEY, WHATS_NEW_VERSION);
    setShowWhatsNew(false);
  };

  return (
    <>
      {showWhatsNew && (
        <div className="modal-overlay" role="presentation" onClick={dismissWhatsNew}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="whats-new-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="whats-new-modal-title">{translations[locale].whatsNewTitle}</h2>
            <ul className="whats-new-list">
              <li>{translations[locale].whatsNewBoard}</li>
              <li>{translations[locale].whatsNewSettings}</li>
              <li>{translations[locale].whatsNewMore}</li>
            </ul>
            <div className="modal-actions">
              <Button onClick={dismissWhatsNew}>{translations[locale].installDismiss}</Button>
            </div>
          </section>
        </div>
      )}
      <nav className="app-utilities" aria-label="Application utilities">
        <button
          type="button"
          className="utility-button"
          aria-label="Information"
          title="Information"
          onClick={() => setShowInfo(true)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 7v4M8 4.5v.1" />
          </svg>
        </button>
        <button
          type="button"
          className="utility-button"
          aria-label="Settings"
          title="Settings"
          onClick={() => setShowSettings(true)}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6.3 1.8h3.4l.5 1.5 1.4.6 1.5-.5 1.7 2.9-1.1 1.1v1.2l1.1 1.1-1.7 2.9-1.5-.5-1.4.6-.5 1.5H6.3l-.5-1.5-1.4-.6-1.5.5-1.7-2.9 1.1-1.1V7.4L2.2 6.3l1.7-2.9 1.5.5 1.4-.6z" />
            <circle cx="8" cy="8" r="2.1" />
          </svg>
        </button>
      </nav>
      {screen === 'home' ? (
        <HomeScreen
          locale={locale}
          onStart={() => setScreen('mode-select')}
          onLanguageChange={setLocale}
          isMobileBrowser={isMobileBrowser}
        />
      ) : screen === 'mode-select' ? (
        <ModeSelectScreen
          locale={locale}
          onBack={() => setScreen('home')}
          onOffline={handleOffline}
          isMobileBrowser={isMobileBrowser}
        />
      ) : screen === 'offline-difficulty' ? (
        <OfflineDifficultyScreen
          locale={locale}
          onBack={() => setScreen('mode-select')}
          onSelectDifficulty={handleSelectDifficulty}
          isMobileBrowser={isMobileBrowser}
        />
      ) : screen === 'offline-participants' ? (
        <OfflineParticipantsScreen
          locale={locale}
          onBack={() => setScreen('offline-difficulty')}
          onSelectParticipants={handleSelectParticipants}
          isMobileBrowser={isMobileBrowser}
        />
      ) : screen === 'offline-soon' ? (
        <OfflineSoonScreen locale={locale} onBack={() => setScreen('offline-participants')} />
      ) : (
        <GameScreen
          locale={locale}
          difficulty={selectedDifficulty}
          onBack={() => setScreen('offline-participants')}
        />
      )}
      {showInstallPrompt && (
        <InstallPromptModal
          locale={locale}
          onDismiss={dismissInstallPrompt}
          onDontShowAgain={dismissInstallPromptForever}
        />
      )}
      {updateAvailable && (
        <div className="update-notice" role="status">
          <span>{translations[locale].updateAvailable}</span>
          <Button onClick={applyUpdate}>{translations[locale].update}</Button>
        </div>
      )}
      {showSettings && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowSettings(false)}>
          <section
            className="modal-panel settings-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="settings-modal-title">{translations[locale].settingsTitle}</h2>
            <div className="settings-control">
              <label htmlFor="brightness">
                {translations[locale].brightness}
                <output htmlFor="brightness">{settings.brightness}%</output>
              </label>
              <input
                id="brightness"
                type="range"
                min="0"
                max="100"
                value={settings.brightness}
                onChange={(event) =>
                  setSettings((currentSettings) => ({
                    ...currentSettings,
                    brightness: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="settings-control">
              <label htmlFor="music-volume">
                {translations[locale].musicVolume}
                <output htmlFor="music-volume">{settings.musicVolume}%</output>
              </label>
              <input
                id="music-volume"
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(event) =>
                  setSettings((currentSettings) => ({
                    ...currentSettings,
                    musicVolume: Number(event.target.value),
                  }))
                }
              />
            </div>
            <fieldset className="theme-selector">
              <legend>{translations[locale].theme}</legend>
              <label>
                <input
                  type="radio"
                  name="theme"
                  checked={settings.theme === 'dark'}
                  onChange={() => setSettings((currentSettings) => ({ ...currentSettings, theme: 'dark' }))}
                />
                {translations[locale].darkTheme}
              </label>
              <label>
                <input
                  type="radio"
                  name="theme"
                  checked={settings.theme === 'light'}
                  onChange={() => setSettings((currentSettings) => ({ ...currentSettings, theme: 'light' }))}
                />
                {translations[locale].lightTheme}
              </label>
            </fieldset>
            <div className="modal-actions">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowSettings(false);
                  setShowSettingsReport(true);
                }}
              >
                {translations[locale].reportButton}
              </Button>
              <Button variant="secondary" onClick={() => setShowSettings(false)}>
                {translations[locale].installDismiss}
              </Button>
            </div>
          </section>
        </div>
      )}
      {showSettingsReport && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowSettingsReport(false)}>
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-report-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="settings-report-modal-title">{translations[locale].reportTitle}</h2>
            <p>{translations[locale].reportBody}</p>
            <div className="modal-actions">
              <Button onClick={() => setShowSettingsReport(false)}>{translations[locale].installDismiss}</Button>
            </div>
          </section>
        </div>
      )}
      {showInfo && (
        <div className="modal-overlay" role="presentation" onClick={() => setShowInfo(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="info-modal-title">{translations[locale].infoTitle}</h2>
            <p className="modal-section-title">{translations[locale].infoInstallSectionTitle}</p>
            <InstallInstructions locale={locale} />
            <h3 className="modal-section-title">{translations[locale].licenseTitle}</h3>
            <p className="modal-license-text">{translations[locale].licenseBody}</p>
            <div className="modal-actions">
              <Button onClick={() => setShowInfo(false)}>{translations[locale].installDismiss}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
