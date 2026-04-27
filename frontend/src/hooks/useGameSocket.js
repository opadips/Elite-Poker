import { useEffect, useState, useRef } from 'react';
import { cardDeal, winnerFanfare, allInSound, timerBeep } from './useSound';

export function useGameSocket(ws, soundEnabledRef) {
  const [gameState, setGameState] = useState(null);
  const [winnerEffect, setWinnerEffect] = useState(null);
  const [winningHandName, setWinningHandName] = useState(null);
  const [animatingChips, setAnimatingChips] = useState([]);
  const [systemMessage, setSystemMessage] = useState(null);
  const [sideBetWin, setSideBetWin] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [newCardIndices, setNewCardIndices] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [achievementToast, setAchievementToast] = useState(null);
  const [speechBubbles, setSpeechBubbles] = useState([]);
  const [turnRemainingSec, setTurnRemainingSec] = useState(0);
  const [turnCurrentPlayerId, setTurnCurrentPlayerId] = useState(null);
  const [handHistory, setHandHistory] = useState([]);

  const gameStateRef = useRef(null);
  const prevCommunityLengthRef = useRef(0);
  const lastWinnerRef = useRef(null);
  const bubbleTimersRef = useRef({});
  const chatAutoCloseRef = useRef(null);
  const lastBeepSecond = useRef(0);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat') {
        setChatMessages(prev => [...prev, { sender: data.sender, text: data.message, isSystem: false }]);
        const currentGameState = gameStateRef.current;
        const senderPlayer = currentGameState?.players?.find(p => p.name === data.sender);
        if (senderPlayer) {
          const newBubble = {
            id: Date.now() + Math.random(),
            playerId: senderPlayer.id,
            text: data.message
          };
          setSpeechBubbles(prev => [...prev.filter(b => b.playerId !== senderPlayer.id), newBubble]);
          clearTimeout(bubbleTimersRef.current[senderPlayer.id]);
          bubbleTimersRef.current[senderPlayer.id] = setTimeout(() => {
            setSpeechBubbles(prev => prev.filter(b => b.id !== newBubble.id));
          }, 5000);
        }
      } else if (data.type === 'system') {
        setChatMessages(prev => [...prev, { sender: 'SYSTEM', text: data.text, isSystem: true }]);
        setSystemMessage(data.text);
        setTimeout(() => setSystemMessage(null), 3000);
        if (!showChat) {
          setShowChat(true);
          if (chatAutoCloseRef.current) clearTimeout(chatAutoCloseRef.current);
          chatAutoCloseRef.current = setTimeout(() => {
            setShowChat(false);
            chatAutoCloseRef.current = null;
          }, 5000);
        }
      } else if (data.type === 'achievement') {
        setAchievementToast({ player: data.playerName, name: data.name, desc: data.desc });
        setTimeout(() => setAchievementToast(null), 4000);
      } else if (data.type === 'allInSound') {
        if (soundEnabledRef.current) allInSound();
      } else if (data.type === 'turnTimer') {
        setTurnRemainingSec(data.remaining);
        setTurnCurrentPlayerId(data.currentPlayerId);
      } else if (data.type === 'handHistory') {
        setHandHistory(data.history || []);
      } else if (data.type === 'gameState') {
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

        if (data.state.handInProgress) lastWinnerRef.current = null;

        setGameState(data.state);
        setIsPaused(data.state.paused || false);

        if (data.state.winner && data.state.winner.names !== lastWinnerRef.current) {
          lastWinnerRef.current = data.state.winner.names;
          const winnerPlayer = data.state.players?.find(p => p.name === data.state.winner.names);
          if (winnerPlayer) {
            setWinnerEffect({
              winnerId: winnerPlayer.id,
              winnerCards: winnerPlayer.holeCards,
              winnerName: winnerPlayer.name
            });
            setWinningHandName(data.state.winner.handName);
            if (soundEnabledRef.current) winnerFanfare();
            setTimeout(() => {
              setWinnerEffect(null);
              setWinningHandName(null);
            }, 3000);
          }
        }
      } else if (data.type === 'sideBetWin') {
        setSideBetWin({
          bettorName: data.bettorName,
          targetName: data.targetName,
          amount: data.amount,
          profit: data.profit,
          total: data.amount + data.profit
        });
        setTimeout(() => setSideBetWin(null), 4000);
      } else if (data.type === 'sitInSuccess') {
        setSystemMessage('You are now in the game!');
        setTimeout(() => setSystemMessage(null), 2000);
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

  return {
    gameState,
    winnerEffect,
    winningHandName,
    animatingChips,
    setAnimatingChips,
    systemMessage,
    sideBetWin,
    showChat,
    setShowChat,
    newCardIndices,
    chatMessages,
    setChatMessages,
    isPaused,
    achievementToast,
    speechBubbles,
    turnRemainingSec,
    turnCurrentPlayerId,
    handHistory,
  };
}