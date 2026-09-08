import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { TEXTURE_VARS } from './lib/textures'
import './index.css'

// Textures are generated once at boot and handed to CSS as custom properties,
// so every panel can reference them without re-encoding the SVG per element.
for (const [prop, value] of Object.entries(TEXTURE_VARS)) {
  document.documentElement.style.setProperty(prop, value)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
