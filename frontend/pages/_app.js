import '../styles/globals.css';
import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useSocket } from '../hooks/useSocket';

// We keep socket status in _app so Navbar always shows the live indicator
export default function App({ Component, pageProps }) {
  const [socketStatus, setSocketStatus] = useState('connecting');

  const handleStatusChange = useCallback((s) => setSocketStatus(s), []);

  // Connect once at app level — pages receive events via context or props
  // For simplicity we expose a global event bus via window.__syncup
  useSocket(
    (feed) => { window.__syncup?.onNewFeed?.(feed); },
    (id) => { window.__syncup?.onDeleteFeed?.(id); },
    handleStatusChange,
    (feed) => { window.__syncup?.onUpdateFeed?.(feed); }
  );

  return (
    <>
      <Navbar socketStatus={socketStatus} />
      <Component {...pageProps} />
    </>
  );
}
