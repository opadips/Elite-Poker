// frontend/src/hooks/useChatSync.js
import { useState, useEffect, useRef } from 'react';
import { TOAST_DURATION, SIDE_BET_WIN_DURATION, CHAT_AUTO_CLOSE_DELAY, SPEECH_BUBBLE_DURATION } from '../constants.js';

export function useChatSync(ws, gameState) {
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState([]);
  const [systemMessage, setSystemMessage] = useState(null);
  const [achievementToast, setAchievementToast] = useState(null);
  const [sideBetWin, setSideBetWin] = useState(null);

  const bubbleTimersRef = useRef({});
  const chatAutoCloseRef = useRef(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat') {
        setChatMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1].text === data.message && prev[prev.length - 1].sender === data.sender) {
            return prev;
          }
          return [...prev, { sender: data.sender, text: data.message, isSystem: false }];
        });
        const currentGameState = gameStateRef.current;
        const senderPlayer = currentGameState?.players?.find((p) => p.name === data.sender);
        if (senderPlayer) {
          const newBubble = { id: Date.now() + Math.random(), playerId: senderPlayer.id, text: data.message };
          setSpeechBubbles((prev) => [...prev.filter((b) => b.playerId !== senderPlayer.id), newBubble]);
          if (bubbleTimersRef.current[senderPlayer.id]) clearTimeout(bubbleTimersRef.current[senderPlayer.id]);
          bubbleTimersRef.current[senderPlayer.id] = setTimeout(() => {
            setSpeechBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
          }, SPEECH_BUBBLE_DURATION);
        }
      } else if (data.type === 'system') {
        setSystemMessage(data.text);
        setTimeout(() => setSystemMessage(null), TOAST_DURATION);
      } else if (data.type === 'achievement') {
        setAchievementToast({ player: data.playerName, name: data.name, desc: data.desc });
        setTimeout(() => setAchievementToast(null), SIDE_BET_WIN_DURATION);
      } else if (data.type === 'sideBetWin') {
        setSideBetWin({
          bettorName: data.bettorName,
          targetName: data.targetName,
          amount: data.amount,
          profit: data.profit,
          total: data.amount + data.profit,
        });
        setTimeout(() => setSideBetWin(null), SIDE_BET_WIN_DURATION);
      } else if (data.type === 'sitInSuccess') {
        setSystemMessage('You are now in the game!');
        setTimeout(() => setSystemMessage(null), 2000);
      } else if (data.type === 'privateMessage') {
        const msg = {
          sender: data.sender,
          text: data.message,
          isPrivate: true,
          sent: data.sent || false,
          target: data.target,
        };
        setChatMessages((prev) => [...prev, msg]);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const openChatTemporarily = () => {
    setShowChat(true);
    if (chatAutoCloseRef.current) clearTimeout(chatAutoCloseRef.current);
    chatAutoCloseRef.current = setTimeout(() => {
      setShowChat(false);
      chatAutoCloseRef.current = null;
    }, CHAT_AUTO_CLOSE_DELAY);
  };

  return { chatMessages, showChat, setShowChat, openChatTemporarily, speechBubbles, systemMessage, achievementToast, sideBetWin };
}