import { useRegisterSW } from 'virtual:pwa-register/react';
import './PWAUpdatePrompt.css';

function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      window.setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  return (
    <aside className="pwa-update" role="status" aria-live="polite">
      <div>
        <strong>New version available</strong>
        <span>Reload to update</span>
      </div>
      <div className="pwa-update__actions">
        <button type="button" onClick={handleDismiss} className="pwa-update__secondary">
          Later
        </button>
        <button type="button" onClick={handleUpdate} className="pwa-update__primary">
          Reload
        </button>
      </div>
    </aside>
  );
}

export default PWAUpdatePrompt;
