export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface GuessResult {
  letter: string;
  state: LetterState;
}

export function evaluateGuess(guess: string, answer: string): GuessResult[] {
  const result: GuessResult[] = guess.split('').map(letter => ({ letter, state: 'absent' as LetterState }));
  const answerArr = answer.split('');
  const guessArr = guess.split('');

  // First pass: mark correct positions
  guessArr.forEach((letter, i) => {
    if (letter === answerArr[i]) {
      result[i].state = 'correct';
      answerArr[i] = '#'; // mark as used
    }
  });

  // Second pass: mark present letters
  guessArr.forEach((letter, i) => {
    if (result[i].state === 'correct') return;
    const idx = answerArr.indexOf(letter);
    if (idx !== -1) {
      result[i].state = 'present';
      answerArr[idx] = '#'; // mark as used
    }
  });

  return result;
}

export function getBestLetterState(states: LetterState[]): LetterState {
  if (states.includes('correct')) return 'correct';
  if (states.includes('present')) return 'present';
  if (states.includes('absent')) return 'absent';
  return 'empty';
}
