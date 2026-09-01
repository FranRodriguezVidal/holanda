import { translations, type Locale } from '../../i18n/translations';

interface InstallInstructionsProps {
  locale: Locale;
}

const shareIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="install-instructions__icon">
    <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const menuIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="install-instructions__icon">
    <circle cx="12" cy="5" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="12" cy="19" r="1.6" />
  </svg>
);

export function InstallInstructions({ locale }: InstallInstructionsProps) {
  const text = translations[locale];

  return (
    <div className="install-instructions">
      <div className="install-instructions__group">
        <h3>
          {shareIcon}
          {text.installIosTitle}
        </h3>
        <ol>
          <li>{text.installIosStep1}</li>
          <li>{text.installIosStep2}</li>
          <li>{text.installIosStep3}</li>
          <li>{text.installIosStep4}</li>
          <li>{text.installIosStep5}</li>
        </ol>
      </div>
      <div className="install-instructions__group">
        <h3>
          {menuIcon}
          {text.installAndroidTitle}
        </h3>
        <ol>
          <li>{text.installAndroidStep1}</li>
          <li>{text.installAndroidStep2}</li>
          <li>{text.installAndroidStep3}</li>
          <li>{text.installAndroidStep4}</li>
          <li>{text.installAndroidStep5}</li>
        </ol>
      </div>
    </div>
  );
}
