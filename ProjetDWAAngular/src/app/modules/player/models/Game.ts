import { GameRules } from './GameRules';

export interface Game {
  idG: number;
  winner: string | null;
  player1: string;
  player2: string | null;
  score1: number;
  score2: number;
  grid: number;
  gameRules?: GameRules;
}