// src/components/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';

export default function Chat({ messages, playerName, onSendMessage }) {
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const hideTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const startHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!hovered) setIsVisible(false);
    }, 5000);
  };

  const cancelHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(true);
  };

  const handleMouseEnter = () => {
    setHovered(true);
    cancelHideTimer();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    startHideTimer();
  };

  const resetActivity = () => {
    cancelHideTimer();
    startHideTimer();
  };

  // اسکرول خودکار وقتی پیام‌ها تغییر کنند
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    resetActivity();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  useEffect(() => {
    startHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div
      className={`fixed top-4 left-24 z-30 w-80 bg-black/70 backdrop-blur-md rounded-xl border border-amber-700/40 flex flex-col shadow-2xl transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-20px] pointer-events-none'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="text-amber-400 font-bold text-center border-b border-amber-700/50 py-1 text-sm cursor-pointer" onClick={resetActivity}>
        💬 Table Chat
      </div>
      <div className="h-48 overflow-y-auto p-2 text-xs space-y-1">
        {messages.map((msg, idx) => (
          <div key={idx} className={`${msg.isSystem ? 'text-yellow-400' : msg.sender === playerName ? 'text-green-300' : 'text-white'} break-words`}>
            {!msg.isSystem && <span className="font-bold text-amber-400">[{msg.sender}]</span>}{' '}
            <span>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 border-t border-amber-700/50 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={resetActivity}
          placeholder="Say something..."
          className="flex-1 bg-gray-800/80 rounded-lg px-3 py-1 text-white text-sm outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          onClick={sendMessage}
          className="bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded-lg text-sm font-bold"
        >
          Send
        </button>
      </div>
    </div>
  );
}