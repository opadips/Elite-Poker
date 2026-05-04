import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import GameTable from './GameTable.jsx';
import LobbyList from './LobbyList.jsx';
import { WS_PORT } from './constants.js';

function LoginPage({ onLogin }) {
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const name = nameInputRef.current?.value?.trim();
    if (name) onLogin(name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="bg-gray-900/90 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full mx-4">
        <h1 className="text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
          Elite Poker
        </h1>
        <input
          ref={nameInputRef}
          type="text"
          placeholder="Enter your username"
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          maxLength={15}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-black font-bold py-3 rounded-xl transition-all shadow-lg"
        >
          Enter Lobby
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ isConnected, isConnecting, playerName, children }) {
  if (isConnecting && playerName) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Connecting...
      </div>
    );
  }
  if (!isConnected || !playerName) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes({ ws, playerId, playerName, setPlayerId, setPlayerName, setWs }) {
  const navigate = useNavigate();
  const location = useLocation();
  const reconnectAttempted = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectAndJoin = useCallback((name) => {
    setIsConnecting(true);
    const host = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${host}:${WS_PORT}`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', name }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'joined') {
        setPlayerId(data.playerId);
        localStorage.setItem('pokerPlayerName', name);
        setIsConnecting(false);

        const currentPath = location.pathname;
        if (currentPath.startsWith('/game/')) {
          const lobbyId = currentPath.split('/game/')[1];
          if (lobbyId) {
            socket.send(JSON.stringify({ type: 'joinLobby', lobbyId }));
          } else {
            navigate('/lobby');
          }
        } else {
          navigate('/lobby');
        }
      } else if (data.type === 'error') {
        alert(data.message);
        setIsConnecting(false);
      }
    };
    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
      setPlayerId(null);
      setIsConnecting(false);
    };
    socket.onerror = (err) => {
      console.error('WebSocket error:', err);
      setIsConnecting(false);
    };
    setWs(socket);
  }, [navigate, setPlayerId, setWs, location.pathname]);

  const disconnect = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
    setWs(null);
    setPlayerId(null);
    setPlayerName('');
    localStorage.removeItem('pokerPlayerName');
    setIsConnecting(false);
  }, [ws, setWs, setPlayerId, setPlayerName]);

  useEffect(() => {
    if (!ws && !playerId && !reconnectAttempted.current) {
      const savedName = localStorage.getItem('pokerPlayerName');
      if (savedName) {
        reconnectAttempted.current = true;
        setPlayerName(savedName);
        connectAndJoin(savedName);
      }
    }
  }, [ws, playerId, connectAndJoin, setPlayerName]);

  const handleLogin = useCallback((name) => {
    if (!name || name.trim() === '') return;
    setPlayerName(name.trim());
    connectAndJoin(name.trim());
  }, [connectAndJoin, setPlayerName]);

  const handleCreateLobby = useCallback((settings) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'createLobby', settings }));
    }
  }, [ws]);

  const handleJoinLobby = useCallback((lobbyId, password = '') => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'joinLobby', lobbyId, password }));
    }
  }, [ws]);

  const handleReturnToLobby = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'returnToLobby' }));
    }
    navigate('/lobby');
  }, [ws, navigate]);

  const handleLeaveLobby = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leaveLobby' }));
    }
    navigate('/lobby');
  }, [ws, navigate]);

  const handleLogout = useCallback(() => {
    disconnect();
    navigate('/');
  }, [disconnect, navigate]);

  const onMessage = useCallback((event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'lobbyCreated' || data.type === 'joinedLobby') {
      navigate(`/game/${data.lobbyId}`);
    } else if (data.type === 'leftLobby') {
      navigate('/lobby');
    } else if (data.type === 'error') {
      alert(data.message);
    } else if (data.type === 'waitlisted') {
      alert('Lobby is full. You have been added to the waiting list.');
    }
  }, [navigate]);

  useEffect(() => {
    if (!ws) return;
    ws.addEventListener('message', onMessage);
    return () => ws.removeEventListener('message', onMessage);
  }, [ws, onMessage]);

  const isConnected = ws && ws.readyState === WebSocket.OPEN && playerId;

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/lobby" element={
        <ProtectedRoute isConnected={isConnected} isConnecting={isConnecting} playerName={playerName}>
          <LobbyList
            ws={ws}
            playerName={playerName}
            onCreateLobby={handleCreateLobby}
            onJoinLobby={handleJoinLobby}
            onLogout={handleLogout}
          />
        </ProtectedRoute>
      } />
      <Route path="/game/:lobbyId" element={
        <ProtectedRoute isConnected={isConnected} isConnecting={isConnecting} playerName={playerName}>
          <GamePage
            ws={ws}
            playerId={playerId}
            playerName={playerName}
            handleReturnToLobby={handleReturnToLobby}
            handleLeaveLobby={handleLeaveLobby}
            handleLogout={handleLogout}
          />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function GamePage({ ws, playerId, playerName, handleReturnToLobby, handleLeaveLobby, handleLogout }) {
  const { lobbyId } = useParams();
  const [theme, setTheme] = useState(() => localStorage.getItem('pokerTheme') || 'classic');
  const [isAdmin, setIsAdmin] = useState(false);

  const onThemeChange = useCallback((t) => {
    setTheme(t);
    localStorage.setItem('pokerTheme', t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const themeClass = `theme-${theme}`;
    root.className = root.className.replace(/theme-\w+/g, '').trim();
    root.classList.add(themeClass);
  }, [theme]);

  useEffect(() => {
    if (!ws) return;
    const checkAdmin = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'gameState' && data.state?.adminId === playerId) {
        setIsAdmin(true);
      }
    };
    ws.addEventListener('message', checkAdmin);
    return () => ws.removeEventListener('message', checkAdmin);
  }, [ws, playerId]);

  if (!ws || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Connecting...
      </div>
    );
  }

  return (
    <GameTable
      ws={ws}
      playerId={playerId}
      lobbyId={lobbyId}
      isAdmin={isAdmin}
      theme={theme}
      onThemeChange={onThemeChange}
      onReturnToLobby={handleReturnToLobby}
      onLeaveLobby={handleLeaveLobby}
    />
  );
}

export default function App() {
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [ws, setWs] = useState(null);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes
        ws={ws}
        playerId={playerId}
        playerName={playerName}
        setPlayerId={setPlayerId}
        setPlayerName={setPlayerName}
        setWs={setWs}
      />
    </BrowserRouter>
  );
}