import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './pages/pages.css'
import './i18n' // Initialize i18n
import { preloadSpeechVoices } from './lib/speech'

preloadSpeechVoices()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
