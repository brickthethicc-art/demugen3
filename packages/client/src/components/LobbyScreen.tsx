import { useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import * as network from '../network/socket-client.js';
import { Users, Play, Check, Plus, LogIn } from 'lucide-react';

export function LobbyScreen() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const playerId = useGameStore((s) => s.playerId);
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const lobbyPlayers = useGameStore((s) => s.lobbyPlayers);
  const error = useGameStore((s) => s.error);

  const myPlayer = lobbyPlayers.find((p) => p.id === playerId);
  const isHost = lobbyPlayers.length > 0 && lobbyPlayers[0]?.id === playerId;
  const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every((p) => p.isReady);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    console.log('=== DEBUG: Creating lobby ===');
    console.log('Server URL:', serverUrl);
    console.log('Player name:', name);
    
    network.connect(serverUrl);
    
    // Wait for socket connection before creating lobby
    const maxWaitTime = 5000;
    const checkInterval = 100;
    let elapsed = 0;
    
    const waitForConnection = () => {
      return new Promise<boolean>((resolve) => {
        const interval = setInterval(() => {
          const socket = (network as any).getSocket?.();
          if (socket?.connected) {
            clearInterval(interval);
            console.log('Socket connected, creating lobby');
            resolve(true);
          } else if (elapsed >= maxWaitTime) {
            clearInterval(interval);
            console.error('Socket connection timeout');
            resolve(false);
          } else {
            elapsed += checkInterval;
          }
        }, checkInterval);
      });
    };
    
    const connected = await waitForConnection();
    if (connected) {
      network.createLobby(name);
    } else {
      console.error('Failed to connect to server');
      // Error will be set by socket error handler
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !joinCode.trim()) return;
    const serverUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    console.log('=== DEBUG: Joining lobby ===');
    console.log('Server URL:', serverUrl);
    console.log('Lobby code:', joinCode);
    console.log('Player name:', name);
    
    network.connect(serverUrl);
    
    // Wait for socket connection before joining lobby
    const maxWaitTime = 5000;
    const checkInterval = 100;
    let elapsed = 0;
    
    const waitForConnection = () => {
      return new Promise<boolean>((resolve) => {
        const interval = setInterval(() => {
          const socket = (network as any).getSocket?.();
          if (socket?.connected) {
            clearInterval(interval);
            console.log('Socket connected, joining lobby');
            resolve(true);
          } else if (elapsed >= maxWaitTime) {
            clearInterval(interval);
            console.error('Socket connection timeout');
            resolve(false);
          } else {
            elapsed += checkInterval;
          }
        }, checkInterval);
      });
    };
    
    const connected = await waitForConnection();
    if (connected) {
      network.joinLobby(joinCode.toUpperCase(), name);
    } else {
      console.error('Failed to connect to server');
      // Error will be set by socket error handler
    }
  };

  const handleReady = () => {
    network.setReady(!myPlayer?.isReady);
  };

  const handleStart = () => {
    network.startGame();
  };

  if (!lobbyCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mugen-bg">
        <div className="bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent">
            MUGEN
          </h1>
          <p className="text-gray-400 text-center mb-8 text-sm">Strategy Card Game</p>

          {mode === 'menu' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-mugen-bg border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition"
              />
              <button
                onClick={() => setMode('create')}
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 disabled:opacity-40 rounded-lg font-medium transition"
              >
                <Plus size={18} /> Create Game
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={!name.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 disabled:opacity-40 rounded-lg font-medium transition"
              >
                <LogIn size={18} /> Join Game
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">Creating as <span className="text-white font-semibold">{name}</span></p>
              <button
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-medium transition"
              >
                <Plus size={18} /> Create Lobby
              </button>
              <button onClick={() => setMode('menu')} className="w-full text-gray-400 hover:text-white text-sm transition">
                ← Back
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Lobby code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full px-4 py-3 bg-mugen-bg border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition text-center tracking-widest text-lg font-mono"
              />
              <button
                onClick={handleJoin}
                disabled={joinCode.length < 4}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 disabled:opacity-40 rounded-lg font-medium transition"
              >
                <LogIn size={18} /> Join
              </button>
              <button onClick={() => setMode('menu')} className="w-full text-gray-400 hover:text-white text-sm transition">
                ← Back
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-mugen-danger text-sm text-center">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mugen-bg">
      <div className="bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5">
        <h2 className="text-2xl font-bold mb-1">Lobby</h2>
        <p className="text-gray-400 text-sm mb-6 font-mono">Code: <span className="text-mugen-gold">{lobbyCode}</span></p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users size={16} /> Players ({lobbyPlayers.length}/4)
          </div>
          {lobbyPlayers.map((p) => (
            <div key={p.id} className="flex items-center justify-between bg-mugen-bg rounded-lg px-4 py-3 border border-white/5">
              <span className="font-medium">{p.name}</span>
              {p.isReady ? (
                <span className="flex items-center gap-1 text-mugen-success text-sm"><Check size={14} /> Ready</span>
              ) : (
                <span className="text-gray-500 text-sm">Waiting...</span>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleReady}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${
              myPlayer?.isReady
                ? 'bg-mugen-success/20 border border-mugen-success text-mugen-success'
                : 'bg-mugen-accent hover:bg-mugen-accent/80'
            }`}
          >
            <Check size={18} /> {myPlayer?.isReady ? 'Ready!' : 'Ready Up'}
          </button>

          {isHost && (
            <button
              onClick={handleStart}
              disabled={!allReady}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-gold hover:bg-mugen-gold/80 disabled:opacity-40 text-black rounded-lg font-bold transition"
            >
              <Play size={18} /> Start Game
            </button>
          )}
        </div>

        {error && (
          <p className="mt-4 text-mugen-danger text-sm text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
