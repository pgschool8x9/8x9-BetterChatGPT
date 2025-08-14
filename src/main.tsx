import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css';
await import('katex/dist/katex.min.css');

import './i18n';
import { createStorageGuard } from './utils/mobileStorageGuard';

// モバイルでのPull-to-Refresh対策を初期化
const storageGuard = createStorageGuard('free-chat-gpt');

// アプリ起動前にストレージ復旧を試行
if (storageGuard.attemptRecovery()) {
  console.log('Mobile storage recovered successfully');
}

// ガード機能を開始
storageGuard.startGuard();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
