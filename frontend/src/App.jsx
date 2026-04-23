import React, { useState } from 'react';
import GameTable from './GameTable.jsx';

export default function App() {
  const [playerName, setPlayerName] = useState('');
  const [ws, setWs] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [error, setError] = useState('');

  const joinGame = () => {
    if (!playerName.trim()) return;
    if (playerName.length > 15) {
      setError('Name must be 15 characters or less');
      return;
    }
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${wsProtocol}//${window.location.hostname}:3000`);
    
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', name: playerName }));
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 App message:', data);
      if (data.type === 'error') setError(data.message);
      if (data.type === 'joined') {
        setPlayerId(data.playerId);
        setWs(socket);
      }
    };
    socket.onerror = () => setError('Connection failed. Make sure server is running on port 3000.');
  };

  if (!ws) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-96">
          <h1 className="text-white text-3xl font-bold mb-6 text-center">♠️ Texas Hold'em ♥️</h1>
          <input
            type="text"
            placeholder="Enter your name (max 15 chars)"
            className="w-full p-3 rounded-lg border border-gray-600 bg-gray-700 text-white mb-4"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
            maxLength="15"
          />
          <button
            onClick={joinGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
          >
            Join Table
          </button>
          {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  return <GameTable ws={ws} playerId={playerId} />;
}