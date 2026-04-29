import React, { useState, useEffect, useRef } from 'react';
import CreateLobbyModal from './CreateLobbyModal.jsx';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-amber-400">Poker Lobby</h1>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-gray-400">Logged in as: <span className="text-white">{playerName}</span></span>
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30 transition-all"
            >
              Logout
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30 transition-all font-bold"
            >
              + Create Table
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {lobbies.map(lobby => (
            <div
              key={lobby.id}
              className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-700 hover:border-amber-500/50 transition-all cursor-pointer shadow-lg"
              onClick={() => handleJoin(lobby)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{lobby.name}</h3>
                  {lobby.description && (
                    <p className="text-xs text-gray-400 mt-1">{lobby.description}</p>
                  )}
                </div>
                {lobby.hasPassword && <span className="text-lg">🔒</span>}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
                <div>👥 Players: <span className="text-white">{lobby.playerCount}/{lobby.maxPlayers}</span></div>
                <div>🃏 Active: <span className="text-white">{lobby.activePlayerCount}</span></div>
                <div>💵 Blinds: <span className="text-white">{lobby.smallBlind}/{lobby.bigBlind}</span></div>
                <div>💰 Chips: <span className="text-white">{formatChips(lobby.startingChips)}</span></div>
                {lobby.handInProgress && (
                  <div className="col-span-2 flex justify-between text-amber-400 mt-1">
                    <span>Pot: {formatChips(lobby.totalPot)}</span>
                    <span className="capitalize">{lobby.currentRound}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xs text-gray-400 mb-2">
                {lobby.waitingCount > 0 && <span className="text-amber-400">Queue: {lobby.waitingCount}</span>}
                <span className="uppercase text-[10px] bg-gray-800 px-2 py-0.5 rounded-full">{lobby.mode}</span>
              </div>

              {lobby.topScore && lobby.topScore.name && (
                <div className="text-xs text-yellow-400 flex items-center gap-1">
                  <span>👑</span> Top: {lobby.topScore.name} ({lobby.topScore.score} pts)
                </div>
              )}
            </div>
          ))}
          {lobbies.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12">
              No tables available. Create one!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700">
            <h3 className="text-sm font-bold text-amber-400 mb-3">General Chat</h3>
            <div
              ref={chatContainerRef}
              className="h-32 overflow-y-auto mb-3 text-sm space-y-1 pr-2"
            >
              {chatMessages.map((m, i) => (
                <div key={i} className="text-gray-300">
                  <span className="text-amber-400 font-bold">{m.sender}: </span>
                  {m.text || m.message}
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
                className="flex-1 bg-gray-800 rounded-xl px-4 py-2 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleSendChat}
                className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl font-bold text-black transition-all"
              >
                Send
              </button>
            </div>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 border border-gray-700">
            <h3 className="text-sm font-bold text-amber-400 mb-3">Online Players ({onlinePlayers.length})</h3>
            <div className="max-h-48 overflow-y-auto text-sm space-y-1">
              {onlinePlayers.map((name, i) => (
                <div key={i} className="text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400"></span>
                  {name}
                </div>
              ))}
              {onlinePlayers.length === 0 && (
                <div className="text-gray-500 text-xs">No players online</div>
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