// frontend/src/components/Chat.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';

const QUICK_CHATS = {
  Emotions: [
    { emoji: '👏', text: 'Nice hand!' },
    { emoji: '😲', text: 'Wow!' },
    { emoji: '😅', text: 'Sorry' },
    { emoji: '😂', text: 'LOL' },
    { emoji: '😡', text: 'Angry!' },
    { emoji: '😢', text: 'So unlucky' },
    { emoji: '🤔', text: 'Hmm...' },
    { emoji: '🙄', text: 'Seriously?' }
  ],
  Game: [
    { emoji: '🚀', text: 'All in!' },
    { emoji: '⏩', text: 'Fold faster!' },
    { emoji: '🃏', text: 'What a bluff!' },
    { emoji: '🎯', text: 'Nice catch!' },
    { emoji: '💰', text: 'Take my chips!' },
    { emoji: '🤞', text: 'Good luck' },
    { emoji: '👀', text: 'I saw that' },
    { emoji: '🔄', text: 'Same again?' }
  ],
  Greetings: [
    { emoji: '👋', text: 'Hello!' },
    { emoji: '✌️', text: 'Good game!' },
    { emoji: '🍀', text: 'Good luck all' },
    { emoji: '🤝', text: 'Well played' },
    { emoji: '👑', text: 'Respect' },
    { emoji: '💪', text: 'Bring it on!' },
    { emoji: '🔥', text: 'On fire!' },
    { emoji: '❄️', text: 'Cold deck' }
  ]
};

const CATEGORIES = Object.keys(QUICK_CHATS);

export default function Chat({ messages, playerName, onSendMessage }) {
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [quickChatOpen, setQuickChatOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const hideTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!hovered) setIsVisible(false);
    }, 5000);
  }, [hovered]);

  const cancelHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(true);
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    resetActivity();
  };

  const sendQuickMessage = (text) => {
    onSendMessage(text);
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
      className={`fixed bottom-16 left-4 z-50 w-80 bg-black/70 backdrop-blur-md rounded-xl border border-amber-700/40 flex flex-col shadow-2xl transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="text-amber-400 font-bold text-center border-b border-amber-700/50 py-1 text-sm cursor-pointer" onClick={resetActivity}>
        💬 Table Chat
      </div>
      <div className="h-48 overflow-y-auto p-2 text-xs space-y-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${msg.sender === 'Dealer' ? 'dealer-chat' : msg.sender === playerName ? 'text-green-300' : 'text-white'} break-words`}
          >
            {msg.sender !== 'Dealer' && <span className="font-bold text-amber-400">[{msg.sender}]</span>}{' '}
            <span>{msg.text || msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-amber-700/50">
        <div
          className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-gray-800/50"
          onClick={() => setQuickChatOpen(!quickChatOpen)}
        >
          <span className="text-xs text-amber-300 font-medium">Quick Chat</span>
          <span className="text-xs text-amber-300">{quickChatOpen ? '▲' : '▼'}</span>
        </div>
        {quickChatOpen && (
          <div className="px-2 pb-2">
            <div className="flex gap-1 mb-2 overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 text-xs rounded-full transition-colors whitespace-nowrap ${
                    activeCategory === cat ? 'bg-amber-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_CHATS[activeCategory].map((item) => (
                <button
                  key={item.text}
                  onClick={() => sendQuickMessage(`${item.emoji} ${item.text}`)}
                  className="chat-quick-btn flex flex-col items-center justify-center p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 hover:border-amber-500/50"
                >
                  <span className="text-base chat-emoji-bounce">{item.emoji}</span>
                  <span className="text-[9px] text-gray-300 mt-0.5 leading-tight text-center">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
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