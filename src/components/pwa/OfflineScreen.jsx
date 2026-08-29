import './OnlineOnlyGuard.css';

function OfflineScreen({ isChecking, reason, onRetry }) {
  const isServiceUnavailable = reason === 'unavailable';

  return (
    <main className="offline-screen" aria-live="assertive">
      <section className="offline-screen__panel" role="alert">
        <div className="offline-screen__mark" aria-hidden="true">
          !
        </div>
        <h1>{isServiceUnavailable ? 'Service unavailable' : 'Internet connection required'}</h1>
        <p>
          {isServiceUnavailable
            ? 'The service is temporarily unavailable. Please try again.'
            : 'Please check your connection and try again.'}
        </p>
        <button
          className="offline-screen__button"
          type="button"
          onClick={onRetry}
          disabled={isChecking}
        >
          {isChecking ? 'Checking...' : 'Retry'}
        </button>
      </section>
    </main>
  );
}

export default OfflineScreen;
