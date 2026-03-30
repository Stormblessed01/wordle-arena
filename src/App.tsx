import { useState, useEffect, useCallback } from 'react';
import './App.css';
import { WORD_LIST } from './wordList';
import { evaluateGuess, getBestLetterState } from './gameLogic';
import type { GuessResult, LetterState } from './gameLogic';

const WORD_LENGTH = 5;
const MAX_GUESSES = 6;
const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Enter','Z','X','C','V','B','N','M','Backspace'],
];

function pickRandomWord(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)].toUpperCase();
}

type GameStatus = 'playing' | 'won' | 'lost';

export default function App() {
  const [answer, setAnswer] = useState<string>(pickRandomWord);
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [revealRow, setRevealRow] = useState<number>(-1);

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 2000);
  };

  const submitGuess = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length !== WORD_LENGTH) {
      showError('Not enough letters');
      return;
    }
    if (!WORD_LIST.includes(currentGuess.toLowerCase())) {
      showError('Not in word list');
      return;
    }

    const result = evaluateGuess(currentGuess, answer);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    setRevealRow(newGuesses.length - 1);
    setCurrentGuess('');

    if (currentGuess === answer) {
      setGameStatus('won');
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost');
    }
  }, [gameStatus, currentGuess, answer, guesses]);

  const handleKey = useCallback((key: string) => {
    if (gameStatus !== 'playing') return;
    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess(prev => prev + key);
    }
  }, [gameStatus, currentGuess, submitGuess]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key === 'Enter' ? 'Enter'
        : e.key === 'Backspace' ? 'Backspace'
        : e.key.toUpperCase();
      handleKey(key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  const newGame = () => {
    setAnswer(pickRandomWord());
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setErrorMessage('');
    setRevealRow(-1);
  };

  // Build letter state map for keyboard coloring
  const letterStates: Record<string, LetterState> = {};
  guesses.forEach(guess => {
    guess.forEach(({ letter, state }) => {
      const existing = letterStates[letter];
      letterStates[letter] = getBestLetterState([existing ?? 'empty', state]);
    });
  });

  // Build board rows
  const boardRows: Array<{ letters: Array<{ char: string; state: LetterState }>, isRevealing: boolean }> = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    const isRevealing = i === revealRow;
    if (i < guesses.length) {
      boardRows.push({
        letters: guesses[i].map(g => ({ char: g.letter, state: g.state })),
        isRevealing,
      });
    } else if (i === guesses.length && gameStatus === 'playing') {
      const letters = Array.from({ length: WORD_LENGTH }, (_, j) => ({
        char: currentGuess[j] ?? '',
        state: (currentGuess[j] ? 'tbd' : 'empty') as LetterState,
      }));
      boardRows.push({ letters, isRevealing: false });
    } else {
      boardRows.push({
        letters: Array.from({ length: WORD_LENGTH }, () => ({ char: '', state: 'empty' as LetterState })),
        isRevealing: false,
      });
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Wordle Arena</h1>
      </header>

      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {gameStatus === 'won' && (
        <div className="status-message won">Brilliant! You got it! 🎉</div>
      )}
      {gameStatus === 'lost' && (
        <div className="status-message lost">Game over! The word was: <strong>{answer}</strong></div>
      )}

      <div className="board-container">
        <div className="board">
          {boardRows.map((row, rowIdx) => (
            <div key={rowIdx} className="row">
              {row.letters.map((tile, colIdx) => (
                <div
                  key={colIdx}
                  className={`tile tile--${tile.state}${row.isRevealing ? ' tile--reveal' : ''}`}
                  style={row.isRevealing ? { animationDelay: `${colIdx * 0.1}s` } : undefined}
                >
                  {tile.char}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="keyboard">
        {KEYBOARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="keyboard-row">
            {row.map(key => {
              const state = key.length === 1 ? (letterStates[key] ?? 'empty') : 'empty';
              return (
                <button
                  key={key}
                  className={`key key--${state}${key.length > 1 ? ' key--wide' : ''}`}
                  onClick={() => handleKey(key)}
                  aria-label={key}
                >
                  {key === 'Backspace' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <button className="new-game-btn" onClick={newGame}>New Game</button>
    </div>
  );
}
