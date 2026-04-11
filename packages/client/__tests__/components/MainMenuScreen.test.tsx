import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainMenuScreen } from '../../src/components/MainMenuScreen.js';
import { useGameStore } from '../../src/store/game-store.js';

describe('MainMenuScreen', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('renders the game title', () => {
    render(<MainMenuScreen />);
    expect(screen.getByText('MUGEN')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<MainMenuScreen />);
    expect(screen.getByText('Strategy Card Game')).toBeInTheDocument();
  });

  it('renders Play button', () => {
    render(<MainMenuScreen />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders Deck Builder button', () => {
    render(<MainMenuScreen />);
    expect(screen.getByRole('button', { name: /deck builder/i })).toBeInTheDocument();
  });

  it('renders Card Library button', () => {
    render(<MainMenuScreen />);
    expect(screen.getByRole('button', { name: /card library/i })).toBeInTheDocument();
  });

  it('navigates to deck-select when Play is clicked', () => {
    render(<MainMenuScreen />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(useGameStore.getState().screen).toBe('deck-select');
  });

  it('navigates to deck-builder when Deck Builder is clicked', () => {
    render(<MainMenuScreen />);
    fireEvent.click(screen.getByRole('button', { name: /deck builder/i }));
    expect(useGameStore.getState().screen).toBe('deck-builder');
  });

  it('navigates to card-library when Card Library is clicked', () => {
    render(<MainMenuScreen />);
    fireEvent.click(screen.getByRole('button', { name: /card library/i }));
    expect(useGameStore.getState().screen).toBe('card-library');
  });
});
