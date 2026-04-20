import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useGameStore } from '../store/game-store.js';
import * as network from '../network/socket-client.js';
import { Users, Play, Check, Plus, LogIn } from 'lucide-react';
export function LobbyScreen() {
    const [name, setName] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [mode, setMode] = useState('menu');
    const playerId = useGameStore((s) => s.playerId);
    const lobbyCode = useGameStore((s) => s.lobbyCode);
    const lobbyPlayers = useGameStore((s) => s.lobbyPlayers);
    const error = useGameStore((s) => s.error);
    const myPlayer = lobbyPlayers.find((p) => p.id === playerId);
    const isHost = lobbyPlayers.length > 0 && lobbyPlayers[0]?.id === playerId;
    const allReady = lobbyPlayers.length >= 2 && lobbyPlayers.every((p) => p.isReady);
    const handleCreate = () => {
        if (!name.trim())
            return;
        network.connect('http://localhost:3001');
        setTimeout(() => network.createLobby(name), 300);
    };
    const handleJoin = () => {
        if (!name.trim() || !joinCode.trim())
            return;
        network.connect('http://localhost:3001');
        setTimeout(() => network.joinLobby(joinCode.toUpperCase(), name), 300);
    };
    const handleReady = () => {
        network.setReady(!myPlayer?.isReady);
    };
    const handleStart = () => {
        network.startGame();
    };
    if (!lobbyCode) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-mugen-bg", children: _jsxs("div", { className: "bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5", children: [_jsx("h1", { className: "text-4xl font-bold text-center mb-2 bg-gradient-to-r from-mugen-accent to-mugen-mana bg-clip-text text-transparent", children: "MUGEN" }), _jsx("p", { className: "text-gray-400 text-center mb-8 text-sm", children: "Strategy Card Game" }), mode === 'menu' && (_jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Your name", value: name, onChange: (e) => setName(e.target.value), className: "w-full px-4 py-3 bg-mugen-bg border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition" }), _jsxs("button", { onClick: () => setMode('create'), disabled: !name.trim(), className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 disabled:opacity-40 rounded-lg font-medium transition", children: [_jsx(Plus, { size: 18 }), " Create Game"] }), _jsxs("button", { onClick: () => setMode('join'), disabled: !name.trim(), className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-surface border border-white/10 hover:border-mugen-accent/50 disabled:opacity-40 rounded-lg font-medium transition", children: [_jsx(LogIn, { size: 18 }), " Join Game"] })] })), mode === 'create' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-gray-300 text-sm", children: ["Creating as ", _jsx("span", { className: "text-white font-semibold", children: name })] }), _jsxs("button", { onClick: handleCreate, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 rounded-lg font-medium transition", children: [_jsx(Plus, { size: 18 }), " Create Lobby"] }), _jsx("button", { onClick: () => setMode('menu'), className: "w-full text-gray-400 hover:text-white text-sm transition", children: "\u2190 Back" })] })), mode === 'join' && (_jsxs("div", { className: "space-y-4", children: [_jsx("input", { type: "text", placeholder: "Lobby code", value: joinCode, onChange: (e) => setJoinCode(e.target.value.toUpperCase()), maxLength: 6, className: "w-full px-4 py-3 bg-mugen-bg border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-mugen-accent transition text-center tracking-widest text-lg font-mono" }), _jsxs("button", { onClick: handleJoin, disabled: joinCode.length < 4, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-accent hover:bg-mugen-accent/80 disabled:opacity-40 rounded-lg font-medium transition", children: [_jsx(LogIn, { size: 18 }), " Join"] }), _jsx("button", { onClick: () => setMode('menu'), className: "w-full text-gray-400 hover:text-white text-sm transition", children: "\u2190 Back" })] })), error && (_jsx("p", { className: "mt-4 text-mugen-danger text-sm text-center", children: error }))] }) }));
    }
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-mugen-bg", children: _jsxs("div", { className: "bg-mugen-surface rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/5", children: [_jsx("h2", { className: "text-2xl font-bold mb-1", children: "Lobby" }), _jsxs("p", { className: "text-gray-400 text-sm mb-6 font-mono", children: ["Code: ", _jsx("span", { className: "text-mugen-gold", children: lobbyCode })] }), _jsxs("div", { className: "space-y-3 mb-6", children: [_jsxs("div", { className: "flex items-center gap-2 text-gray-400 text-sm", children: [_jsx(Users, { size: 16 }), " Players (", lobbyPlayers.length, "/4)"] }), lobbyPlayers.map((p) => (_jsxs("div", { className: "flex items-center justify-between bg-mugen-bg rounded-lg px-4 py-3 border border-white/5", children: [_jsx("span", { className: "font-medium", children: p.name }), p.isReady ? (_jsxs("span", { className: "flex items-center gap-1 text-mugen-success text-sm", children: [_jsx(Check, { size: 14 }), " Ready"] })) : (_jsx("span", { className: "text-gray-500 text-sm", children: "Waiting..." }))] }, p.id)))] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("button", { onClick: handleReady, className: `w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition ${myPlayer?.isReady
                                ? 'bg-mugen-success/20 border border-mugen-success text-mugen-success'
                                : 'bg-mugen-accent hover:bg-mugen-accent/80'}`, children: [_jsx(Check, { size: 18 }), " ", myPlayer?.isReady ? 'Ready!' : 'Ready Up'] }), isHost && (_jsxs("button", { onClick: handleStart, disabled: !allReady, className: "w-full flex items-center justify-center gap-2 px-4 py-3 bg-mugen-gold hover:bg-mugen-gold/80 disabled:opacity-40 text-black rounded-lg font-bold transition", children: [_jsx(Play, { size: 18 }), " Start Game"] }))] }), error && (_jsx("p", { className: "mt-4 text-mugen-danger text-sm text-center", children: error }))] }) }));
}
//# sourceMappingURL=LobbyScreen.js.map