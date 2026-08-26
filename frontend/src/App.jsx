import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import GameTable from './GameTable.jsx';
import LobbyList from './LobbyList.jsx';
import { SuitSpade } from './components/icons.jsx';
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-gradient)' }}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fadeIn"
        style={{
          background: 'var(--panel-bg)',
          border: '1px solid var(--panel-border)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        <div className="flex flex-col items-center mb-7">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(150deg, rgba(212,175,55,0.28), rgba(212,175,55,0.06))',
              border: '1px solid var(--accent-soft)',
              color: 'var(--accent)',
              boxShadow: '0 0 40px var(--accent-soft)',
            }}
          >
            <SuitSpade size={34} />
          </div>
          <h1
            className="text-3xl font-bold tracking-[0.18em] uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Elite Poker
          </h1>
          <p className="text-xs mt-2 tracking-[0.25em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Texas Hold&rsquo;em
          </p>
        </div>

        <input
          ref={nameInputRef}
          type="text"
          placeholder="Enter your username"
          className="w-full px-4 py-3 rounded-xl outline-none mb-4 transition-colors focus:border-[var(--accent)]"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-primary)',
            border: '1px solid var(--panel-border)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          maxLength={15}
        />
        <button
          onClick={handleSubmit}
          className="w-full font-bold py-3 rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'var(--button-primary)',
            color: '#10131c',
            boxShadow: '0 6px 20px var(--accent-soft)',
          }}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-gradient)', color: 'var(--text-muted)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm tracking-widest uppercase">Connecting</span>
        </div>
      </div>
    );
  }
  if (!isConnected || !playerName) {
    return <Navigate to="/" replace />;
  }
  return children;
}

const THEMES = ['midnight', 'emerald', 'crimson', 'frost', 'neon', 'aurora'];

function AppRoutes({ ws, playerId, playerName, setPlayerId, setPlayerName, setWs, theme, onThemeChange }) {
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
            theme={theme}
            onThemeChange={onThemeChange}
            handleReturnToLobby={handleReturnToLobby}
            handleLeaveLobby={handleLeaveLobby}
            handleLogout={handleLogout}
          />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function GamePage({ ws, playerId, playerName, theme, onThemeChange, handleReturnToLobby, handleLeaveLobby, handleLogout }) {
  const { lobbyId } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-gradient)', color: 'var(--text-muted)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          <span className="text-sm tracking-widest uppercase">Loading table</span>
        </div>
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
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('pokerTheme');
    return THEMES.includes(saved) ? saved : 'midnight';
  });

  const onThemeChange = useCallback((t) => {
    setTheme(t);
    localStorage.setItem('pokerTheme', t);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.className = root.className.replace(/theme-\w+/g, '').trim();
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes
        ws={ws}
        playerId={playerId}
        playerName={playerName}
        setPlayerId={setPlayerId}
        setPlayerName={setPlayerName}
        setWs={setWs}
        theme={theme}
        onThemeChange={onThemeChange}
      />
    </BrowserRouter>
  );
}