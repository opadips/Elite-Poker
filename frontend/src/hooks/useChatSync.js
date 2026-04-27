import { useState, useEffect, useRef } from 'react';

export function useChatSync(ws, gameState) {
  const [chatMessages, setChatMessages] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState([]);
  const [systemMessage, setSystemMessage] = useState(null);
  const [achievementToast, setAchievementToast] = useState(null);
  const [sideBetWin, setSideBetWin] = useState(null);

  const bubbleTimersRef = useRef({});
  const chatAutoCloseRef = useRef(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'chat') {
        setChatMessages((prev) => [...prev, { sender: data.sender, text: data.message, isSystem: false }]);
        const senderPlayer = gameState?.players?.find((p) => p.name === data.sender);
        if (senderPlayer) {
          const newBubble = { id: Date.now() + Math.random(), playerId: senderPlayer.id, text: data.message };
          setSpeechBubbles((prev) => [...prev.filter((b) => b.playerId !== senderPlayer.id), newBubble]);
          if (bubbleTimersRef.current[senderPlayer.id]) clearTimeout(bubbleTimersRef.current[senderPlayer.id]);
          bubbleTimersRef.current[senderPlayer.id] = setTimeout(() => {
            setSpeechBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
          }, 5000);
        }
      } else if (data.type === 'system') {
        setChatMessages((prev) => [...prev, { sender: 'SYSTEM', text: data.text, isSystem: true }]);
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
      } else if (data.type === 'sideBetWin') {
        setSideBetWin({
          bettorName: data.bettorName,
          targetName: data.targetName,
          amount: data.amount,
          profit: data.profit,
          total: data.amount + data.profit,
        });
        setTimeout(() => setSideBetWin(null), 4000);
      } else if (data.type === 'sitInSuccess') {
        setSystemMessage('You are now in the game!');
        setTimeout(() => setSystemMessage(null), 2000);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, gameState]);

  return {
    chatMessages,
    showChat,
    setShowChat,
    speechBubbles,
    systemMessage,
    achievementToast,
    sideBetWin,
  };
}