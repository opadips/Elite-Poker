import React, { useState, useEffect, useRef } from 'react';
import GameTable from './GameTable.jsx';
import LobbyList from './LobbyList.jsx';
import { WS_PORT } from './constants.js';

function App() {
  const [page, setPage] = useState('login');
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [currentLobbyId, setCurrentLobbyId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pokerTheme') || 'classic');
  const [ws, setWs] = useState(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (page === 'login' && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [page]);

  const connectAndJoin = (name) => {
    const host = window.location.hostname;
    const socket = new WebSocket(`ws://${host}:${WS_PORT}`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', name }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined') {
        setPlayerId(data.playerId);
        setPage('lobbyList');
      } else if (data.type === 'error') {
        alert(data.message);
      }
    };
    socket.onclose = () => {
      console.log('WebSocket disconnected');
    };
    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
    setWs(socket);
  };

  const handleLogin = (name) => {
    if (!name || name.trim() === '') return;
    setPlayerName(name.trim());
    connectAndJoin(name.trim());
  };

  const handleCreateLobby = (settings) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'createLobby', settings }));
  };

  const handleJoinLobby = (lobbyId, password = '') => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'joinLobby', lobbyId, password }));
  };

  const handleReturnToLobby = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'returnToLobby' }));
    }
    setCurrentLobbyId(null);
    setIsAdmin(false);
    setPage('lobbyList');
  };

  const handleLeaveLobby = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leaveLobby' }));
    }
    setCurrentLobbyId(null);
    setIsAdmin(false);
    setPage('lobbyList');
  };

  useEffect(() => {
    if (!ws) return;
    const onMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'lobbyCreated' || data.type === 'joinedLobby') {
        setCurrentLobbyId(data.lobbyId);
        setIsAdmin(data.isAdmin || false);
        setPage('game');
      } else if (data.type === 'leftLobby') {
        setCurrentLobbyId(null);
        setIsAdmin(false);
        setPage('lobbyList');
      } else if (data.type === 'error') {
        alert(data.message);
      } else if (data.type === 'waitlisted') {
        alert('Lobby is full. You have been added to the waiting list.');
      }
    };
    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [ws]);

  const onThemeChange = (t) => {
    setTheme(t);
    localStorage.setItem('pokerTheme', t);
  };

  useEffect(() => {
    const root = document.documentElement;
    const themeClass = `theme-${theme}`;
    root.className = root.className.replace(/theme-\w+/g, '').trim();
    root.classList.add(themeClass);
  }, [theme]);

  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700 w-96">
          <h1 className="text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
            ♠️ Elite Poker ♠️
          </h1>
          <input
            ref={nameInputRef}
            type="text"
            placeholder="Enter your username"
            className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin(e.target.value);
              }
            }}
            maxLength={15}
          />
          <button
            onClick={() => {
              const input = nameInputRef.current?.value || '';
              handleLogin(input);
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold py-3 rounded-xl transition-all shadow-lg"
          >
            Enter Lobby
          </button>
        </div>
      </div>
    );
  }

  if (page === 'lobbyList') {
    return (
      <LobbyList
        ws={ws}
        playerName={playerName}
        onCreateLobby={handleCreateLobby}
        onJoinLobby={handleJoinLobby}
        onLogout={() => setPage('login')}
      />
    );
  }

  if (page === 'game') {
    return (
      <GameTable
        ws={ws}
        playerId={playerId}
        lobbyId={currentLobbyId}
        isAdmin={isAdmin}
        theme={theme}
        onThemeChange={onThemeChange}
        onReturnToLobby={handleReturnToLobby}
        onLeaveLobby={handleLeaveLobby}
      />
    );
  }

  return null;
}

export default App;