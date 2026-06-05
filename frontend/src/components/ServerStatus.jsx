import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ServerStatus() {
  const [status, setStatus] = useState('connecting'); // 'connected', 'offline', 'connecting'

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.get('/health', { timeout: 3000 });
        setStatus('connected');
      } catch (error) {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    connected: 'bg-green-500',
    offline: 'bg-red-500',
    connecting: 'bg-yellow-500'
  };

  const statusText = {
    connected: 'Backend Online',
    offline: 'Backend Offline',
    connecting: 'Connecting...'
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm text-xs font-medium" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', transition: 'background 0.3s, border-color 0.3s, color 0.3s' }}>
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'connected' ? 'animate-pulse' : ''}`}></div>
      {statusText[status]}
    </div>
  );
}
