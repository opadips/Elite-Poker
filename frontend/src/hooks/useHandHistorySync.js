import { useState, useEffect } from 'react';

export function useHandHistorySync(ws) {
  const [handHistory, setHandHistory] = useState([]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'handHistory') {
        setHandHistory(data.history || []);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  return { handHistory };
}