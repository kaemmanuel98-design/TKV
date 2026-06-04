import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './pages/pages.css';
import './i18n';
import { loadPrimaryI18n, loadSecondaryI18n } from './i18n/loadI18nLayers';
import { preloadSpeechVoices } from './lib/speech';
import { prefetchAllNavRoutes, prefetchRoute, scheduleIdleTask } from './lib/prefetchRoutes';

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  try {
    await loadPrimaryI18n();
  } catch (err) {
    console.error('TKV i18n primary load failed', err);
  }

  scheduleIdleTask(() => {
    void loadSecondaryI18n();
    preloadSpeechVoices();
    prefetchAllNavRoutes();
    prefetchRoute('/book/gynosko');
    prefetchRoute('/book/eido');
  });
}

bootstrap();
