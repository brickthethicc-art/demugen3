import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LobbyScreen } from '../../src/components/LobbyScreen.js';
import { useGameStore } from '../../src/store/game-store.js';
import * as network from '../../src/network/socket-client.js';

vi.mock('../../src/network/socket-client.js', () => ({
  leaveLobby: vi.fn(),
  setReady: vi.fn(),
  startGame: vi.fn(),
  connect: vi.fn(),
  createLobby: vi.fn(),
  joinLobby: vi.fn(),
  getSocket: vi.fn(() => ({ connected: true })),
}));

describe('LobbyScreen', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
    vi.clearAllMocks();
  });

  it('leaves lobby without disconnecting client flow state', () => {
    useGameStore.setState({
      playerId: 'host-1',
      lobbyCode: 'ABC123',
      lobbyPlayers: [{ id: 'host-1', name: 'Host', isReady: false }],
      screen: 'lobby',
    });

    render(<LobbyScreen />);

    fireEvent.click(screen.getByRole('button', { name: /leave/i }));

    expect(network.leaveLobby).toHaveBeenCalledTimes(1);
    expect(useGameStore.getState().lobbyCode).toBeNull();
    expect(useGameStore.getState().lobbyPlayers).toEqual([]);
    expect(useGameStore.getState().screen).toBe('main-menu');
  });
});
