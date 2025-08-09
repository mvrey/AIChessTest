import { Chess } from 'chess.js';
import { 
  pawnTable, 
  knightTable, 
  bishopTable, 
  rookTable, 
  queenTable, 
  kingMiddleGameTable 
} from '../constants/ChessTables';
import { ChessSquare, PieceType, ChessColor, DEFAULT_PIECE_VALUES } from '../models/ChessPosition';

export class ChessEvaluator {
  private pieceValues = DEFAULT_PIECE_VALUES;

  evaluatePosition(board: Chess): number {
    const position = board.board();
    const isEndgame = this.isEndgamePhase(position);
    const moveCount = Math.floor(board.moveNumber() / 2);
    const isOpening = moveCount < 10;

    let score = 0;
    let whitePawnCount = 0;
    let blackPawnCount = 0;
    let whiteCenterPawns = 0;
    let blackCenterPawns = 0;
    let whiteDevPieces = 0;
    let blackDevPieces = 0;

    // Evaluar material y posición
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = position[i][j];
        if (piece) {
          const value = this.pieceValues[piece.type];
          let positionBonus = this.getPositionBonus(piece.type, i, j, isEndgame);
          
          this.updatePieceCounts(piece, i, j, {
            whitePawnCount, blackPawnCount,
            whiteCenterPawns, blackCenterPawns,
            whiteDevPieces, blackDevPieces
          });

          // Penalizaciones específicas
          positionBonus += this.calculateSpecificPenalties(piece, i, isOpening);
          
          if (piece.color === 'w') {
            score += value + positionBonus;
          } else {
            score -= value + positionBonus;
          }
        }
      }
    }

    // Ajustes de apertura
    if (isOpening) {
      score = this.applyOpeningAdjustments(score, {
        whiteCenterPawns, blackCenterPawns,
        whiteDevPieces, blackDevPieces,
        moveCount, position
      });
    }

    // Evaluar seguridad del rey y movilidad
    score = this.evaluateKingAndMobility(board, score, isOpening);

    return score;
  }

  private isEndgamePhase(position: (ChessSquare | null)[][]): boolean {
    let majorPieces = 0;
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = position[i][j];
        if (piece && (piece.type === 'q' || piece.type === 'r')) {
          majorPieces++;
        }
      }
    }
    return majorPieces <= 2;
  }

  private getPositionBonus(pieceType: string, row: number, col: number, isEndgame: boolean): number {
    const r = row;
    const c = col;
    
    switch (pieceType) {
      case 'p': return pawnTable[r][c];
      case 'n': return knightTable[r][c];
      case 'b': return bishopTable[r][c];
      case 'r': return rookTable[r][c];
      case 'q': return queenTable[r][c];
      case 'k': return isEndgame ? -kingMiddleGameTable[r][c] : kingMiddleGameTable[r][c];
      default: return 0;
    }
  }

  private updatePieceCounts(
    piece: ChessSquare, 
    row: number, 
    col: number, 
    counts: {
      whitePawnCount: number,
      blackPawnCount: number,
      whiteCenterPawns: number,
      blackCenterPawns: number,
      whiteDevPieces: number,
      blackDevPieces: number
    }
  ): void {
    if (piece.type === 'p') {
      if (piece.color === 'w') {
        counts.whitePawnCount++;
        if (col >= 3 && col <= 4) counts.whiteCenterPawns++;
      } else {
        counts.blackPawnCount++;
        if (col >= 3 && col <= 4) counts.blackCenterPawns++;
      }
    }

    if (['n', 'b'].includes(piece.type)) {
      const startRow = piece.color === 'w' ? 7 : 0;
      if (row !== startRow) {
        if (piece.color === 'w') counts.whiteDevPieces++;
        else counts.blackDevPieces++;
      }
    }
  }

  private calculateSpecificPenalties(piece: ChessSquare, row: number, isOpening: boolean): number {
    let penalty = 0;
    
    if (isOpening) {
      // Penalizar movimiento temprano de la dama
      if (piece.type === 'q') {
        const startRow = piece.color === 'w' ? 7 : 0;
        if (row !== startRow) {
          penalty -= 30;
        }
      }

      // Penalizar movimiento temprano del rey (anti-bongcloud)
      if (piece.type === 'k') {
        const startRow = piece.color === 'w' ? 7 : 0;
        if (row !== startRow) {
          penalty -= 100;
        }
      }
    }

    return penalty;
  }

  private applyOpeningAdjustments(
    score: number, 
    params: {
      whiteCenterPawns: number,
      blackCenterPawns: number,
      whiteDevPieces: number,
      blackDevPieces: number,
      moveCount: number,
      position: (ChessSquare | null)[][]
    }
  ): number {
    let adjustedScore = score;

    // Penalizar exceso de movimientos de peones
    if (params.whiteCenterPawns > 2) adjustedScore -= (params.whiteCenterPawns - 2) * 20;
    if (params.blackCenterPawns > 2) adjustedScore += (params.blackCenterPawns - 2) * 20;

    // Bonus por desarrollo
    adjustedScore += params.whiteDevPieces * 15;
    adjustedScore -= params.blackDevPieces * 15;

    // Penalizar por no desarrollar
    if (params.moveCount > 4) {
      adjustedScore -= (4 - params.whiteDevPieces) * 10;
      adjustedScore += (4 - params.blackDevPieces) * 10;
    }

    // Bonus por control del centro
    adjustedScore += this.evaluateCenterControl(params.position);

    return adjustedScore;
  }

  private evaluateCenterControl(position: (ChessSquare | null)[][]): number {
    let score = 0;
    for (let i = 2; i <= 5; i++) {
      for (let j = 2; j <= 5; j++) {
        const piece = position[i][j];
        if (piece && ['n', 'b'].includes(piece.type)) {
          score += piece.color === 'w' ? 10 : -10;
        }
      }
    }
    return score;
  }

  private evaluateKingSafety(board: Chess, color: ChessColor): number {
    const position = board.board();
    let kingRow = -1;
    let kingCol = -1;
    
    // Encontrar posición del rey
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = position[i][j];
        if (piece && piece.type === 'k' && piece.color === color) {
          kingRow = i;
          kingCol = j;
          break;
        }
      }
      if (kingRow !== -1) break;
    }

    let safety = 0;
    
    // Verificar peones protectores
    const pawnDirection = color === 'w' ? 1 : -1;
    if (kingRow + pawnDirection >= 0 && kingRow + pawnDirection < 8) {
      if (kingCol > 0) {
        const piece = position[kingRow + pawnDirection][kingCol - 1];
        if (piece && piece.type === 'p' && piece.color === color) safety += 3;
      }
      if (kingCol < 7) {
        const piece = position[kingRow + pawnDirection][kingCol + 1];
        if (piece && piece.type === 'p' && piece.color === color) safety += 3;
      }
    }

    // Penalizar rey expuesto
    safety -= Math.abs(kingCol - 4) * 2;
    safety -= (color === 'w' ? kingRow - 7 : kingRow) * 3;

    return safety;
  }

  private evaluateKingAndMobility(board: Chess, score: number, isOpening: boolean): number {
    // Evaluar seguridad del rey
    const whiteKingSafety = this.evaluateKingSafety(board, 'w');
    const blackKingSafety = this.evaluateKingSafety(board, 'b');
    score += (whiteKingSafety - blackKingSafety) * (isOpening ? 1.0 : 0.5);

    // Evaluar movilidad
    const whiteMobility = board.moves().length;
    const tempBoard = new Chess(board.fen());
    const fenParts = tempBoard.fen().split(' ');
    fenParts[1] = 'b';
    tempBoard.load(fenParts.join(' '));
    const blackMobility = tempBoard.moves().length;
    
    score += (whiteMobility - blackMobility) * 0.1;

    return score;
  }
}
