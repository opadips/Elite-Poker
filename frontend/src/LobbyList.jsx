import React, { useState, useEffect, useRef } from 'react';
import CreateLobbyModal from './CreateLobbyModal.jsx';
import {
  IconUsers,
  IconCards,
  IconCoins,
  IconLock,
  IconCrown,
  IconPlus,
  IconLogout,
  SuitSpade,
} from './components/icons.jsx';

function formatChips(amount) {
  if (amount >= 1_000_000) return (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (amount >= 1_000) return (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return amount.toString();
}

export default function LobbyList({ ws, playerName, onCreateLobby, onJoinLobby, onLogout }) {
  const [lobbies, setLobbies] = useState([]);
  const [onlinePlayers, setOnlinePlayers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (!ws) return;

    const handleMessages = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'lobbyList') {
        setLobbies(data.lobbies || []);
      } else if (data.type === 'onlinePlayers') {
        setOnlinePlayers(data.players || []);
      } else if (data.type === 'chat' && data.sender !== 'SYSTEM') {
        setChatMessages(prev => [...prev, { sender: data.sender, text: data.message, isSystem: false }]);
        setTimeout(() => {
          chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
        }, 10);
      } else if (data.type === 'generalChatHistory') {
        setChatMessages((data.messages || []).map(m => ({ ...m, isSystem: false })));
      }
    };

    const requestLobbyList = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'listLobbies' }));
      }
    };

    ws.addEventListener('message', handleMessages);

    if (ws.readyState === WebSocket.OPEN) {
      requestLobbyList();
    } else {
      ws.addEventListener('open', requestLobbyList, { once: true });
    }

    return () => {
      ws.removeEventListener('message', handleMessages);
      ws.removeEventListener('open', requestLobbyList);
    };
  }, [ws]);

  const handleCreate = (settings) => {
    onCreateLobby(settings);
    setShowCreateModal(false);
  };

  const handleJoin = (lobby) => {
    if (lobby.hasPassword) {
      const password = prompt('This lobby is password protected. Enter password:');
      if (password === null) return;
      onJoinLobby(lobby.id, password);
    } else {
      onJoinLobby(lobby.id);
    }
  };

  const handleSendChat = () => {
    if (chatInput.trim() && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'lobbyChat', message: chatInput.trim() }));
      setChatInput('');
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'var(--bg-gradient)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: 'linear-gradient(150deg, rgba(212,175,55,0.25), rgba(212,175,55,0.05))',
                border: '1px solid var(--accent-soft)',
                color: 'var(--accent)',
              }}
            >
              <SuitSpade size={24} />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-wide"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
              >
                Elite Poker
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Table Lobby</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span
              className="text-sm px-3 py-2 rounded-lg"
              style={{ color: 'var(--text-muted)', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
            >
              <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{playerName}</span>
            </span>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-125"
              style={{
                background: 'rgba(220, 70, 70, 0.12)',
                color: '#e07a7a',
                border: '1px solid rgba(220, 70, 70, 0.35)',
              }}
            >
              <IconLogout /> Logout
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all hover:brightness-110"
              style={{
                background: 'var(--button-primary)',
                color: '#10131c',
                boxShadow: '0 4px 14px var(--accent-soft)',
              }}
            >
              <IconPlus /> Create Table
            </button>
          </div>
        </div>

        {/* Table cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {lobbies.map(lobby => (
            <div
              key={lobby.id}
              className="rounded-xl p-5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
              style={{
                background: 'var(--panel-bg)',
                border: '1px solid var(--panel-border)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              }}
              onClick={() => handleJoin(lobby)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{lobby.name}</h3>
                  {lobby.description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{lobby.description}</p>
                  )}
                </div>
                {lobby.hasPassword && (
                  <span title="Password protected" style={{ color: 'var(--accent)' }}>
                    <IconLock size={16} />
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1.5">
                  <IconUsers size={13} />
                  <span>Players:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{lobby.playerCount}/{lobby.maxPlayers}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCards size={13} />
                  <span>Active:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{lobby.activePlayerCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCoins size={13} />
                  <span>Blinds:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{lobby.smallBlind}/{lobby.bigBlind}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCoins size={13} />
                  <span>Stack:</span>
                  <span style={{ color: 'var(--text-primary)' }} className="font-semibold">{formatChips(lobby.startingChips)}</span>
                </div>
                {lobby.handInProgress && (
                  <div className="col-span-2 flex justify-between mt-1 px-2 py-1 rounded-md" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <span>Pot: {formatChips(lobby.totalPot)}</span>
                    <span className="capitalize font-semibold">{lobby.currentRound}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                {lobby.waitingCount > 0 && <span style={{ color: 'var(--accent)' }}>Queue: {lobby.waitingCount}</span>}
                <span
                  className="uppercase text-[10px] tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--panel-border)' }}
                >
                  {lobby.mode}
                </span>
              </div>

              {lobby.topScore && lobby.topScore.name && (
                <div className="text-xs flex items-center gap-1.5 pt-2" style={{ borderTop: '1px solid var(--panel-border)', color: 'var(--accent)' }}>
                  <IconCrown size={13} />
                  Top: {lobby.topScore.name} ({lobby.topScore.score} pts)
                </div>
              )}
            </div>
          ))}
          {lobbies.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: 'var(--text-muted)' }}>
              No tables available. Create one!
            </div>
          )}
        </div>

        {/* Chat & players */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-4" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
            <h3 className="text-sm font-bold mb-3 tracking-wide uppercase" style={{ color: 'var(--accent)' }}>General Chat</h3>
            <div
              ref={chatContainerRef}
              className="h-32 overflow-y-auto mb-3 text-sm space-y-1 pr-2"
            >
              {chatMessages.map((m, i) => (
                <div key={i} style={{ color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--accent)' }} className="font-bold">{m.sender}: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{m.text || m.message}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 rounded-lg px-4 py-2 outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--panel-border)',
                }}
              />
              <button
                onClick={handleSendChat}
                className="px-4 py-2 rounded-lg font-semibold transition-all hover:brightness-110"
                style={{ background: 'var(--button-primary)', color: '#10131c' }}
              >
                Send
              </button>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
            <h3 className="text-sm font-bold mb-3 tracking-wide uppercase" style={{ color: 'var(--accent)' }}>
              Online Players ({onlinePlayers.length})
            </h3>
            <div className="max-h-48 overflow-y-auto text-sm space-y-1.5">
              {onlinePlayers.map((name, i) => (
                <div key={i} className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 shadow shadow-green-400/60"></span>
                  {name}
                </div>
              ))}
              {onlinePlayers.length === 0 && (
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No players online</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateLobbyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
