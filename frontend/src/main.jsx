import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
if (!clientId) {
  const msg =
    'Missing VITE_GOOGLE_CLIENT_ID. Set it in frontend/.env so Google OAuth can initialize (student login).'

  if (import.meta.env.DEV) {
    // Fail fast in dev to avoid silent Google login failures.
    throw new Error(msg)
  } else {
    // In production builds, do not mount the OAuth provider without a client id.
    // (Student login will not work until configured.)
    // eslint-disable-next-line no-console
    console.error(msg)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {clientId ? (
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </StrictMode>,
)

