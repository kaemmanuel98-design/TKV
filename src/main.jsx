import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './pages/pages.css';
import './styles/harmony.css';
import i18n from './i18n';
import { loadPrimaryI18n, loadSecondaryI18n } from './i18n/loadI18nLayers';
import { preloadSpeechVoices } from './lib/speech';
import { scheduleIdleTask } from './lib/prefetchRoutes';

async function bootstrap() {
  const primaryI18n = loadPrimaryI18n().catch((err) => {
    console.error('TKV i18n primary load failed', err);
  });

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  void primaryI18n.then(() => {
    if (i18n.isInitialized) {
      i18n.emit('languageChanged', i18n.language);
    }
  });

  void loadSecondaryI18n();

  scheduleIdleTask(() => {
    preloadSpeechVoices();
  });
}

bootstrap();
