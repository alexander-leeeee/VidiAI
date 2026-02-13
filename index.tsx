import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Повідомляємо Telegram, що додаток завантажився
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand(); // Розгортаємо на весь екран
  
  // Для тесту: виведіть у консоль (Eruda), чи бачить він вас
  console.log("User Data:", window.Telegram.WebApp.initDataUnsafe?.user);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);