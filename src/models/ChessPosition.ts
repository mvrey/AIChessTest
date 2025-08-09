import { Chess } from 'chess.js';

export interface ChessSquare {
  type: string;
  color: string;
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface GameStatus {
  isCheck: boolean;
  isGameOver: boolean;
  isDraw: boolean;
  isCheckmate: boolean;
  winner: 'white' | 'black' | null;
}

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type ChessColor = 'w' | 'b';

export interface PieceValues {
  [key: string]: number;
  p: number;
  n: number;
  b: number;
  r: number;
  q: number;
  k: number;
}

export const DEFAULT_PIECE_VALUES: PieceValues = {
  p: 100,   // Peón
  n: 320,   // Caballo
  b: 330,   // Alfil
  r: 500,   // Torre
  q: 900,   // Dama
  k: 20000  // Rey
};
