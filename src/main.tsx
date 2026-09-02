import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/index.css';

const updateServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new Event('holanda-update-available'));
  },
});

window.addEventListener('holanda-apply-update', () => {
  void updateServiceWorker(true);
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
