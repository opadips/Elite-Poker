import { useState, useEffect, useRef } from 'react';
import { timerBeep } from './useSound';

export function useTimerSync(ws, soundEnabledRef) {
  const [turnRemainingSec, setTurnRemainingSec] = useState(0);
  const [turnCurrentPlayerId, setTurnCurrentPlayerId] = useState(null);
  const lastBeepSecond = useRef(0);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'turnTimer') {
        setTurnRemainingSec(data.remaining);
        setTurnCurrentPlayerId(data.currentPlayerId);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  useEffect(() => {
    if (turnRemainingSec > 0 && soundEnabledRef.current) {
      const currentSec = Math.ceil(turnRemainingSec);
      if (currentSec <= 5 && currentSec !== lastBeepSecond.current) {
        timerBeep();
        lastBeepSecond.current = currentSec;
      }
    } else {
      lastBeepSecond.current = 0;
    }
  }, [turnRemainingSec, soundEnabledRef]);

  return { turnRemainingSec, turnCurrentPlayerId };
}