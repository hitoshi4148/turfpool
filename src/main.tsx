import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  document.body.innerHTML =
    '<p style="padding:1rem;font-family:system-ui">#root がありません</p>'
} else {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (e) {
    rootEl.innerHTML = `<pre style="padding:1rem;color:#fecaca;background:#450a0a;font-size:13px;white-space:pre-wrap">${String(e)}</pre>`
  }
}
