import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { IconChevronDown, IconSend } from './icons.jsx';

const QUICK_CHATS = [
  { text: 'Nice hand' },
  { text: 'Wow' },
  { text: 'Sorry' },
  { text: 'LOL' },
  { text: 'Angry' },
  { text: 'Unlucky' },
  { text: 'Hmm...' },
  { text: 'Seriously?' },
  { text: 'All in' },
  { text: 'Fold faster' },
  { text: 'What a bluff' },
  { text: 'Nice catch' },
  { text: 'Take my chips' },
  { text: 'Good luck' },
  { text: 'I saw that' },
  { text: 'Same again' },
  { text: 'Hello' },
  { text: 'Good game' },
  { text: 'Good luck all' },
  { text: 'Well played' },
  { text: 'Respect' },
  { text: 'Bring it on' },
  { text: 'On fire' },
  { text: 'Cold deck' },
];

export default function Chat({ messages, playerName, onSendMessage }) {
  const [input, setInput] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [quickChatOpen, setQuickChatOpen] = useState(false);
  const hideTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!hovered) setIsVisible(false);
    }, 3000);
  }, [hovered]);

  const cancelHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(true);
  }, []);

  const resetActivity = useCallback(() => {
    cancelHideTimer();
    startHideTimer();
  }, [cancelHideTimer, startHideTimer]);

  const handleMouseEnter = () => {
    setHovered(true);
    cancelHideTimer();
  };

  const handleMouseLeave = () => {
    setHovered(false);
    startHideTimer();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const text = input.trim();
    if (text.startsWith('/w ') || text.startsWith('/msg ')) {
      const parts = text.split(' ');
      if (parts.length >= 3) {
        const target = parts[1];
        const msg = parts.slice(2).join(' ');
        onSendMessage({ type: 'private', targetName: target, message: msg });
        setInput('');
        resetActivity();
        return;
      }
    }
    onSendMessage({ type: 'chat', message: text });
    setInput('');
    resetActivity();
  };

  const sendQuickMessage = (text) => {
    onSendMessage({ type: 'chat', message: text });
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
  }, [startHideTimer]);

  useEffect(() => {
    resetActivity();
  }, [messages, resetActivity]);

  const chatElement = (
    <div
      className={`fixed bottom-16 left-4 w-80 backdrop-blur-md rounded-xl flex flex-col shadow-2xl transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{
        zIndex: 2147483647,
        isolation: 'isolate',
        pointerEvents: 'auto',
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="font-bold text-center py-1.5 text-xs cursor-pointer tracking-widest uppercase"
        style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--accent)' }}
        onClick={resetActivity}
      >
        Table Chat
      </div>
      <div className="h-48 overflow-y-auto p-2 text-xs space-y-1 settings-scroll">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${
              msg.isPrivate
                ? 'bg-purple-900/60 text-purple-200 break-words px-1 py-0.5 rounded'
                : msg.sender === 'Dealer'
                ? 'dealer-chat'
                : msg.sender === playerName
                ? ''
                : ''
            } break-words`}
            style={
              !msg.isPrivate && msg.sender !== 'Dealer' && msg.sender === playerName
                ? { color: '#5fd08a' }
                : !msg.isPrivate && msg.sender !== 'Dealer'
                ? { color: 'var(--text-primary)' }
                : undefined
            }
          >
            {msg.isPrivate ? (
              <>
                <span className="font-bold text-purple-400">
                  {msg.sent ? `To ${msg.target}` : `From ${msg.sender}`}
                </span>{' '}
                <span>{msg.text}</span>
              </>
            ) : (
              <>
                {msg.sender !== 'Dealer' && <span className="font-bold" style={{ color: 'var(--accent)' }}>[{msg.sender}]</span>}{' '}
                <span>{msg.text || msg.message}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ borderTop: '1px solid var(--panel-border)' }}>
        <div
          className="flex items-center justify-between px-2 py-1 cursor-pointer transition-colors hover:bg-white/5"
          onClick={() => setQuickChatOpen(!quickChatOpen)}
        >
          <span className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Quick Chat</span>
          <span
            className="transition-transform duration-200"
            style={{ color: 'var(--text-muted)', transform: quickChatOpen ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex' }}
          >
            <IconChevronDown size={13} />
          </span>
        </div>
        {quickChatOpen && (
          <div className="px-2 pb-2">
            <div className="grid grid-cols-4 gap-2">
              {QUICK_CHATS.map((item) => (
                <button
                  key={item.text}
                  onClick={() => sendQuickMessage(item.text)}
                  className="chat-quick-btn flex items-center justify-center p-1.5 rounded-lg border text-xs font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 flex gap-2" style={{ borderTop: '1px solid var(--panel-border)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={resetActivity}
          placeholder="/w name msg"
          className="flex-1 rounded-lg px-3 py-1 text-sm outline-none focus:ring-1"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-primary)',
            ['--tw-ring-color']: 'var(--accent)',
          }}
        />
        <button
          onClick={sendMessage}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold transition-all hover:brightness-110"
          style={{ background: 'var(--button-primary)', color: '#10131c' }}
        >
          <IconSend size={13} /> Send
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(chatElement, document.getElementById('chat-root'));
}