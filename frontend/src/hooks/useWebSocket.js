import { useState, useEffect, useCallback } from 'react';

export function useWebSocket(url) {
  const [ws, setWs] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [readyState, setReadyState] = useState(WebSocket.CONNECTING);

  useEffect(() => {
    if (!url) return;
    const socket = new WebSocket(url);
    setWs(socket);
    socket.onopen = () => setReadyState(WebSocket.OPEN);
    socket.onclose = () => setReadyState(WebSocket.CLOSED);
    socket.onmessage = (event) => setLastMessage(JSON.parse(event.data));
    return () => socket.close();
  }, [url]);

  const sendMessage = useCallback((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }, [ws]);

  return { sendMessage, lastMessage, readyState };
}