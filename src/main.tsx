import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { interceptFetch } from './utils/fetchInterceptor.js';

// Activate transparent client-side fallback for serverless/static hosts (e.g. Hostinger Shared Linux plans)
interceptFetch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

