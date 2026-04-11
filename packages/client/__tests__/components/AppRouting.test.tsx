import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../../src/App.js';
import { useGameStore } from '../../src/store/game-store.js';

describe('App Routing', () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it('renders MainMenu by default', () => {
    render(<App />);
    expect(screen.getByText('MUGEN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders DeckBuilder placeholder when screen is deck-builder', () => {
    useGameStore.getState().setScreen('deck-builder');
    render(<App />);
    expect(screen.getByText(/deck builder/i)).toBeInTheDocument();
  });

  it('renders CardLibrary placeholder when screen is card-library', () => {
    useGameStore.getState().setScreen('card-library');
    render(<App />);
    expect(screen.getByText(/card library/i)).toBeInTheDocument();
  });

  it('renders DeckSelect placeholder when screen is deck-select', () => {
    useGameStore.getState().setScreen('deck-select');
    render(<App />);
    expect(screen.getByText(/select.*deck/i)).toBeInTheDocument();
  });

  it('renders LobbyScreen when screen is lobby', () => {
    useGameStore.getState().setScreen('lobby');
    render(<App />);
    // LobbyScreen has name input and Create Game button
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
  });
});
