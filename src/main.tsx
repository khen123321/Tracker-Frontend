import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// This imports your Tailwind directives / global styles
import './index.css'; 

//  Import Redux Provider and your Store
import { Provider } from 'react-redux';
import { store } from './store';

// Notice the '!' after getElementById('root')
// This fixes the "HTMLElement | null" TypeScript error!
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);