import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/clinicausuarios.css'
import './styles/clinicausuarios-inline.css'
import './index.css'
import App from './App.jsx'
import './firebase.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
