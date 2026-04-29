import { useState, useEffect, useCallback, useRef } from 'react';

export function usePlayerPositions(gameState, playerId, seatViewFixed) {
  const [playerPositions, setPlayerPositions] = useState({});
  const [orderedPlayerIds, setOrderedPlayerIds] = useState([]);
  const tableRef = useRef(null);
  const containerRef = useRef(null);

  const setContainerRef = useCallback((el) => {
    containerRef.current = el;
  }, []);

  const updatePositions = useCallback(() => {
    if (!gameState || !tableRef.current) return;
    const tableRect = tableRef.current.getBoundingClientRect();
    const a = tableRect.width / 2;
    const b = tableRect.height / 2;
    const centerX_abs = tableRect.left + a;
    const centerY_abs = tableRect.top + b;

    let containerX = 0, containerY = 0;
    if (containerRef.current) {
      const cRect = containerRef.current.getBoundingClientRect();
      containerX = cRect.left;
      containerY = cRect.top;
    }

    const activePlayers = gameState.players.filter(p => !p.isSpectator);
    let orderedPlayers = activePlayers;
    if (seatViewFixed) {
      const selfIndex = orderedPlayers.findIndex(p => p.id === playerId);
      if (selfIndex >= 0) orderedPlayers = [...orderedPlayers.slice(selfIndex), ...orderedPlayers.slice(0, selfIndex)];
    }

    const total = orderedPlayers.length;
    const newPositions = {};
    const ids = [];
    orderedPlayers.forEach((p, idx) => {
      const angle = (idx / total) * 2 * Math.PI + Math.PI / 2;
      newPositions[p.id] = {
        x: centerX_abs - containerX + a * Math.cos(angle),
        y: centerY_abs - containerY + b * Math.sin(angle)
      };
      ids.push(p.id);
    });
    setPlayerPositions(newPositions);
    setOrderedPlayerIds(ids);
  }, [gameState, playerId, seatViewFixed]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  return { playerPositions, tableRef, setContainerRef, orderedPlayerIds };
}