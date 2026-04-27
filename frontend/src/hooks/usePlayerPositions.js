import { useState, useEffect, useCallback, useRef } from 'react';

export function usePlayerPositions(gameState, playerId, seatViewFixed) {
  const [playerPositions, setPlayerPositions] = useState({});
  const tableRef = useRef(null);

  const updatePositions = useCallback(() => {
    if (!gameState || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const a = tableRect.width / 2;
    const b = tableRect.height / 2;
    const centerX = tableRect.left + a;
    const centerY = tableRect.top + b;

    const activePlayers = gameState.players.filter(p => !p.isSpectator);
    let orderedPlayers = activePlayers;
    if (seatViewFixed) {
      const selfIndex = orderedPlayers.findIndex(p => p.id === playerId);
      if (selfIndex >= 0) orderedPlayers = [...orderedPlayers.slice(selfIndex), ...orderedPlayers.slice(0, selfIndex)];
    }

    const total = orderedPlayers.length;
    const newPositions = {};
    orderedPlayers.forEach((p, idx) => {
      const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
      newPositions[p.id] = {
        x: centerX + a * Math.cos(angle),
        y: centerY + b * Math.sin(angle)
      };
    });
    setPlayerPositions(newPositions);
  }, [gameState, playerId, seatViewFixed]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  return { playerPositions, tableRef };
}