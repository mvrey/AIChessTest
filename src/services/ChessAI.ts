import { Chess } from 'chess.js';
import { ChessEvaluator } from './ChessEvaluator';
import { ChessMove } from '../models/ChessPosition';

export class ChessAI {
  private evaluator: ChessEvaluator;

  constructor() {
    this.evaluator = new ChessEvaluator();
  }

  getDepthFromElo(elo: number): number {
    if (elo <= 800) return 1;
    if (elo <= 1000) return 2;
    if (elo <= 1200) return 3;
    return 4; // Para ELO 1500
  }

  findBestMove(board: Chess, depth: number, randomFactor = 0): ChessMove {
    const legalMoves = board.moves({ verbose: true });
    let bestMove = legalMoves[0];
    let bestEval = -Infinity;

    for (const move of legalMoves) {
      const newBoard = new Chess(board.fen());
      newBoard.move(move);
      const evaluation = this.minimax(newBoard, depth - 1, -Infinity, Infinity, false) + randomFactor;
      
      if (evaluation > bestEval) {
        bestEval = evaluation;
        bestMove = move;
      }
    }

    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion || 'q'
    };
  }

  private minimax(board: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || board.isGameOver()) {
      return this.evaluator.evaluatePosition(board);
    }

    const moves = board.moves({ verbose: true });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = new Chess(board.fen());
        newBoard.move(move);
        const evaluation = this.minimax(newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = new Chess(board.fen());
        newBoard.move(move);
        const evaluation = this.minimax(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
