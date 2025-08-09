import { Chess } from 'chess.js';

export class Chess960Generator {
  generatePosition(): string {
    try {
      // Generar posiciones para las piezas
      let positions = Array(8).fill(null);
      
      // 1. Colocar alfiles en casillas de diferente color
      const darkBishopPos = Math.floor(Math.random() * 4) * 2; // 0, 2, 4, o 6
      const lightBishopPos = Math.floor(Math.random() * 4) * 2 + 1; // 1, 3, 5, o 7
      positions[darkBishopPos] = 'b';
      positions[lightBishopPos] = 'b';
      
      // 2. Colocar el rey entre las torres
      let emptySquares = positions.map((p, i) => p === null ? i : null).filter((i): i is number => i !== null);
      
      // Función auxiliar para encontrar posiciones consecutivas
      const findConsecutivePositions = (squares: number[]): { rook1: number, king: number, rook2: number } | null => {
        for (let i = 0; i < squares.length - 2; i++) {
          if (squares[i + 1] === squares[i] + 1 && 
              squares[i + 2] === squares[i] + 2) {
            return {
              rook1: squares[i],
              king: squares[i + 1],
              rook2: squares[i + 2]
            };
          }
        }
        return null;
      };

      // Encontrar tres posiciones consecutivas para las torres y el rey
      const kingPosition = findConsecutivePositions(emptySquares);
      
      if (!kingPosition) {
        throw new Error("No se pudo encontrar una posición válida para las torres y el rey");
      }
      
      positions[kingPosition.rook1] = 'r';
      positions[kingPosition.king] = 'k';
      positions[kingPosition.rook2] = 'r';
      
      // 3. Colocar reina y caballos en las posiciones restantes
      emptySquares = positions.map((p, i) => p === null ? i : null).filter((i): i is number => i !== null);
      
      // Colocar reina
      const queenIndex = Math.floor(Math.random() * emptySquares.length);
      positions[emptySquares[queenIndex]] = 'q';
      emptySquares.splice(queenIndex, 1);

      // Colocar caballos
      const knight1Index = Math.floor(Math.random() * emptySquares.length);
      positions[emptySquares[knight1Index]] = 'n';
      emptySquares.splice(knight1Index, 1);

      positions[emptySquares[0]] = 'n';
      
      // Validar que todas las posiciones están ocupadas
      if (positions.some(p => p === null)) {
        throw new Error("Algunas posiciones quedaron sin asignar");
      }
      
      // Retornar la posición en notación FEN
      return positions.join('').toUpperCase();
    } catch (error) {
      console.error('Error generating Chess960 position:', error);
      // En caso de error, retornar la posición estándar
      return 'RNBQKBNR';
    }
  }

  setupPosition(game: Chess, firstRank: string): void {
    // Primero limpiar el tablero
    game.clear();
    
    // Función auxiliar para convertir tipo de pieza
    const getPieceType = (char: string): 'p' | 'n' | 'b' | 'r' | 'q' | 'k' => {
      const mapping: { [key: string]: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' } = {
        'P': 'p', 'N': 'n', 'B': 'b', 'R': 'r', 'Q': 'q', 'K': 'k',
        'p': 'p', 'n': 'n', 'b': 'b', 'r': 'r', 'q': 'q', 'k': 'k'
      };
      return mapping[char] || 'p';
    };
    
    // Función auxiliar para convertir coordenadas a notación algebraica
    const toSquare = (file: number, rank: number): string => {
      return `${'abcdefgh'[file]}${rank}`;
    };
    
    // Colocar las piezas una por una
    for (let i = 0; i < 8; i++) {
      // Colocar piezas blancas
      game.put({ 
        type: getPieceType(firstRank[i]), 
        color: 'w' 
      }, toSquare(i, 1) as any);
      
      // Colocar peones blancos
      game.put({ 
        type: 'p' as const, 
        color: 'w' 
      }, toSquare(i, 2) as any);
      
      // Colocar peones negros
      game.put({ 
        type: 'p' as const, 
        color: 'b' 
      }, toSquare(i, 7) as any);
      
      // Colocar piezas negras
      game.put({ 
        type: getPieceType(firstRank[i]), 
        color: 'b' 
      }, toSquare(i, 8) as any);
    }
    
    // Establecer el turno y los derechos de enroque
    const fen = game.fen().split(' ')[0] + ' w KQkq - 0 1';
    game.load(fen);
  }
}
