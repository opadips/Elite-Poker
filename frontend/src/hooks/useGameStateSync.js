import { useState, useEffect, useRef } from 'react';
import { cardDeal, winnerFanfare, allInSound } from './useSound';

export function useGameStateSync(ws, soundEnabledRef) {
  const [gameState, setGameState] = useState(null);
  const [winnerEffect, setWinnerEffect] = useState(null);
  const [winningHandName, setWinningHandName] = useState(null);
  const [newCardIndices, setNewCardIndices] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  const prevCommunityLengthRef = useRef(0);
  const lastWinnerRef = useRef(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'gameState') {
        const newCommLength = data.state.communityCards?.length || 0;
        const oldLength = prevCommunityLengthRef.current;
        if (newCommLength > oldLength) {
          const newIndices = [];
          for (let i = oldLength; i < newCommLength; i++) newIndices.push(i);
          setNewCardIndices(newIndices);
          if (soundEnabledRef.current) cardDeal();
          setTimeout(() => setNewCardIndices([]), 600);
        }
        prevCommunityLengthRef.current = newCommLength;

        if (data.state.handInProgress) {
          lastWinnerRef.current = null;
        }

        setGameState(data.state);
        setIsPaused(data.state.paused || false);

        if (data.state.winner && data.state.winner.names !== lastWinnerRef.current) {
          lastWinnerRef.current = data.state.winner.names;
          const winnerPlayer = data.state.players?.find((p) => p.name === data.state.winner.names);
          if (winnerPlayer) {
            setWinnerEffect({
              winnerId: winnerPlayer.id,
              winnerCards: winnerPlayer.holeCards,
              winnerName: winnerPlayer.name,
            });
            setWinningHandName(data.state.winner.handName);
            if (soundEnabledRef.current) winnerFanfare();
            setTimeout(() => {
              setWinnerEffect(null);
              setWinningHandName(null);
            }, 3000);
          }
        }
      } else if (data.type === 'allInSound') {
        if (soundEnabledRef.current) allInSound();
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  return {
    gameState,
    winnerEffect,
    winningHandName,
    newCardIndices,
    isPaused,
  };
}