export interface GameMessage {
  type: 'QUESTION' | 'ANSWER' | 'SYSTEM' | 'GUESS' | 'SELECTED_CHARACTER' | 'GUESS_RESULT' | 'SCORE_UPDATE' | 'TURN_UPDATE';
  content: string;
  sender?: string;
  timestamp?: Date;
}
