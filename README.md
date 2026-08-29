# XGame

XGame is an online multiplayer gaming client built with React and Vite. It is available as a web application, an installable Progressive Web App (PWA), and native Android/iOS shells powered by Capacitor.

The client connects to the XGame REST API and SignalR hubs for authentication, player data, wallet operations, support, and real-time gameplay. A compatible backend is required for the full application experience.

## Features

- Seven multiplayer games: Okey, Seka, Poker, Backgammon, Loto, Domino, and Durak
- Account registration, login, protected routes, and profile management
- Real-time game sessions and support messaging through SignalR
- Wallet balance, deposit, withdrawal, and transaction history flows
- English, Turkish, Hindi, Arabic, Russian, and Uzbek translations
- Installable, online-only PWA with update prompts and connection-state handling
- Capacitor projects for Android and iOS
- Responsive layouts with mobile safe-area support

## Tech Stack

- React 19 and React Router
- Vite 7 with SWC
- Axios for HTTP requests
- Microsoft SignalR for real-time communication
- `vite-plugin-pwa` and Workbox
- Capacitor 8 for Android and iOS
- ESLint 9

## Requirements

- Node.js `20.19+` or `22.12+`
- npm
- A running XGame-compatible API and SignalR backend
- Android Studio and JDK 17 for Android builds
- macOS and Xcode for iOS builds

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Update the environment values if your backend does not use the production endpoints.

4. Start the development server:

   ```bash
   npm run dev
   ```

The development server runs at `https://localhost:5173`. Because it uses a locally generated certificate, the browser may display a certificate warning during development.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No | REST API base URL. Defaults to `https://api.xgame.game`. |
| `VITE_HEALTHCHECK_URL` | No | Public health endpoint used by the global availability check. Leave empty to rely only on browser online/offline state. |
| `VITE_SUPPORT_HUB_URL` | No | Support SignalR hub URL. Defaults to `<API_BASE_URL>/hubs/support`. |

Use `.env.example` as the configuration template. Do not commit real credentials, signing files, or machine-specific environment files.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local HTTPS development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint across the project. |

## Production Build

```bash
npm run build
npm run preview
```

The application uses browser history routing. The production server must send unknown application routes to `index.html`. The included `vercel.json` contains the required routing and caching rules for Vercel.

## PWA Behavior

XGame is intentionally online-only. The service worker precaches the application shell and selected static assets, but it does not cache API, authentication, wallet, support, gameplay, or SignalR responses. Static game pages and audio files are also excluded from eager precaching.

When a health-check URL is configured, the app renders only after that endpoint returns an HTTP success response with JSON status `"Healthy"`. Without it, the global offline screen follows the browser's network state.

See [PWA and Capacitor readiness](docs/pwa-capacitor-readiness.md) for implementation details.

## Native Android and iOS

Build the web application and synchronize it with the native projects:

```bash
npm run build
npx cap sync
```

Open a native project:

```bash
npx cap open android
npx cap open ios
```

The app name is `XGame` and the web output directory is `dist`. The current native identifiers differ: Capacitor and iOS use `com.xgame.xgame.app`, while Android uses `com.xgame.app`. Confirm and align these identifiers before a store release if the difference is not intentional.

Signing identities, Apple Developer teams, Android keystores, and provisioning profiles are intentionally not stored in the repository. Configure them locally in Android Studio or Xcode.

See [Capacitor manual builds](docs/capacitor-manual-builds.md) for APK, AAB, device-testing, and iOS archive instructions.

## Project Structure

```text
.
├── .github/workflows/   # CI/CD workflow
├── android/             # Capacitor Android project
├── docs/                # PWA and native build documentation
├── ios/                 # Capacitor iOS project
├── public/              # Static assets and standalone game clients
├── scripts/             # App icon generation utilities
└── src/
    ├── components/      # Pages, layouts, games, auth, wallet, and support UI
    ├── config/          # Runtime endpoint configuration
    ├── context/         # Shared application state and routing helpers
    ├── hooks/           # Reusable React hooks
    └── i18n/            # Translation dictionaries
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys pushes from `main` to a VPS over SSH. It expects these repository secrets:

- `VPS_SSH_KEY`
- `VPS_KNOWN_HOSTS`
- `VPS_HOST`
- `VPS_USER`
- `VPS_PORT`

The workflow synchronizes the frontend to `/opt/xgame/gameZone/` and invokes the server-side `xgame-deploy` command. The target server must already provide that deployment command and the required permissions.

## License

No license file is currently included. Add an appropriate license before distributing the source publicly.
