import { translations, type Locale } from '../../i18n/translations';
import { Button } from './Button';
import { InstallInstructions } from './InstallInstructions';

interface InstallPromptModalProps {
  locale: Locale;
  onDismiss: () => void;
  onDontShowAgain: () => void;
}

export function InstallPromptModal({ locale, onDismiss, onDontShowAgain }: InstallPromptModalProps) {
  const text = translations[locale];

  return (
    <div className="modal-overlay" role="presentation" onClick={onDismiss}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="install-modal-title">{text.installTitle}</h2>
        <p>{text.installBody}</p>

        <InstallInstructions locale={locale} />

        <div className="modal-actions">
          <Button variant="secondary" onClick={onDontShowAgain}>
            {text.installDontShowAgain}
          </Button>
          <Button onClick={onDismiss}>{text.installDismiss}</Button>
        </div>
      </div>
    </div>
  );
}
