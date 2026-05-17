import { useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import * as network from '../network/socket-client.js';
import { Users, Play, Check, Plus, LogIn, ArrowLeft } from 'lucide-react';

export function LobbyScreen() {
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const setScreen = useGameStore((s) => s.setScreen);
  const setLobbyCode = useGameStore((s) => s.setLobbyCode);
  const setLobbyPlayers = useGameStore((s) => s.setLobbyPlayers);
  const playerId = useGameStore((s) => s.playerId);
  const lobbyCode = useGameStore((s) => s.lobbyCode);
  const lobbyPlayers = useGameStore((s) => s.lobbyPlayers);
  const error = useGameStore((s) => s.error);

  const myPlayer = lobbyPlayers.find((p) => p.id === playerId);
  const isHost = lobbyPlayers.length > 0 && lobbyPlayers[0]?.id === playerId;
  const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every((p) => p.isReady);

  const handleCreate = async () => {
    if (!name.trim()) return;
    console.log('=== DEBUG: Creating lobby ===');
    console.log('Server URL: same-origin');
    console.log('Player name:', name);
    
    network.connect();
    
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
    console.log('=== DEBUG: Joining lobby ===');
    console.log('Server URL: same-origin');
    console.log('Lobby code:', joinCode);
    console.log('Player name:', name);
    
    network.connect();
    
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

  const handleLeaveLobby = () => {
    network.leaveLobby();
    setLobbyCode(null);
    setLobbyPlayers([]);
    setScreen('main-menu');
  };

  if (!lobbyCode) {
    return (
      <div className="min-h-[100dvh] bg-mugen-bg px-3 py-4 sm:min-h-screen sm:flex sm:items-center sm:justify-center">
        <div className="w-full max-w-md rounded-xl border border-white/5 bg-mugen-surface p-4 shadow-2xl sm:rounded-2xl sm:p-8">
          <h1 className="mb-2 text-center text-3xl font-bold bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent sm:text-4xl">
            MUGEN
          </h1>
          <p className="mb-6 text-center text-sm text-gray-400 sm:mb-8">Strategy Card Game</p>

          {mode === 'menu' && (
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-mugen-bg px-4 py-3 text-base text-white placeholder-gray-500 transition focus:border-mugen-accent focus:outline-none"
              />
              <button
                onClick={() => setMode('create')}
                disabled={!name.trim()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-mugen-accent px-4 py-3 font-medium transition hover:bg-mugen-accent/80 disabled:opacity-40"
              >
                <Plus size={18} /> Create Game
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={!name.trim()}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-mugen-surface px-4 py-3 font-medium transition hover:border-mugen-accent/50 disabled:opacity-40"
              >
                <LogIn size={18} /> Join Game
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-3 sm:space-y-4">
              <p className="text-gray-300 text-sm">Creating as <span className="text-white font-semibold">{name}</span></p>
              <button
                onClick={handleCreate}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-mugen-accent px-4 py-3 font-medium transition hover:bg-mugen-accent/80"
              >
                <Plus size={18} /> Create Lobby
              </button>
              <button onClick={() => setMode('menu')} className="w-full rounded-md py-2 text-sm text-gray-400 transition hover:text-white">
                ← Back
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-3 sm:space-y-4">
              <input
                type="text"
                placeholder="Lobby code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full rounded-lg border border-white/10 bg-mugen-bg px-4 py-3 text-center font-mono text-lg tracking-widest text-white placeholder-gray-500 transition focus:border-mugen-accent focus:outline-none"
              />
              <button
                onClick={handleJoin}
                disabled={joinCode.length < 4}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-mugen-accent px-4 py-3 font-medium transition hover:bg-mugen-accent/80 disabled:opacity-40"
              >
                <LogIn size={18} /> Join
              </button>
              <button onClick={() => setMode('menu')} className="w-full rounded-md py-2 text-sm text-gray-400 transition hover:text-white">
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
    <div className="min-h-[100dvh] bg-mugen-bg px-3 py-4 sm:min-h-screen sm:flex sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-xl border border-white/5 bg-mugen-surface p-4 shadow-2xl sm:rounded-2xl sm:p-8">
        <div className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Lobby</h2>
            <p className="text-xs text-gray-400 font-mono sm:text-sm">Code: <span className="text-mugen-gold">{lobbyCode}</span></p>
          </div>
          <button
            type="button"
            onClick={handleLeaveLobby}
            className="inline-flex min-h-11 items-center gap-1 rounded-md border border-white/15 bg-white/5 px-3 text-xs font-semibold text-gray-200 transition hover:border-mugen-danger/60 hover:text-white"
          >
            <ArrowLeft size={14} /> Leave
          </button>
        </div>

        <div className="mb-4 space-y-2.5 sm:mb-6 sm:space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} /> Players ({lobbyPlayers.length}/4)
          </div>
          <div className="max-h-[38dvh] space-y-2 overflow-y-auto pr-1 sm:max-h-[42dvh]">
            {lobbyPlayers.map((p) => (
              <div key={p.id} className="flex min-h-11 items-center justify-between rounded-lg border border-white/5 bg-mugen-bg px-3 py-2.5 sm:px-4 sm:py-3">
                <span className="font-medium text-sm sm:text-base">{p.name}</span>
                {p.isReady ? (
                  <span className="flex items-center gap-1 text-mugen-success text-xs sm:text-sm"><Check size={14} /> Ready</span>
                ) : (
                  <span className="text-gray-500 text-xs sm:text-sm">Waiting...</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          <button
            onClick={handleReady}
            className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition ${
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
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-mugen-gold px-4 py-3 font-bold text-black transition hover:bg-mugen-gold/80 disabled:opacity-40"
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
