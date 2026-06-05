import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './pages/pages.css';
import i18n from './i18n';
import { loadPrimaryI18n, loadSecondaryI18n } from './i18n/loadI18nLayers';
import { preloadSpeechVoices } from './lib/speech';
import { prefetchAllNavRoutes, prefetchRoute, scheduleIdleTask } from './lib/prefetchRoutes';

const PRIMARY_I18N_BUDGET_MS = 2500;

async function bootstrap() {
  const primaryI18n = loadPrimaryI18n().catch((err) => {
    console.error('TKV i18n primary load failed', err);
  });

  await Promise.race([
    primaryI18n,
    new Promise((resolve) => {
      window.setTimeout(resolve, PRIMARY_I18N_BUDGET_MS);
    }),
  ]);

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
    prefetchAllNavRoutes();
    prefetchRoute('/book/gynosko');
    prefetchRoute('/book/eido');
  });
}

bootstrap();
