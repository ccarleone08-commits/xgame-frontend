import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import OnlineOnlyGuard from './components/pwa/OnlineOnlyGuard.jsx'
import PWAUpdatePrompt from './components/pwa/PWAUpdatePrompt.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OnlineOnlyGuard>
      <App />
    </OnlineOnlyGuard>
    <PWAUpdatePrompt />
  </StrictMode>
)
