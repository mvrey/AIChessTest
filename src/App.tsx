import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import './App.css';

interface GameStatus {
  isCheck: boolean;
  isGameOver: boolean;
  isDraw: boolean;
  isCheckmate: boolean;
  winner: 'white' | 'black' | null;
}

// Definir los diferentes sets de piezas disponibles
const pieceSets = {
  'default': 'default',
  'neo': 'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/',
  'glass': 'https://images.chesscomfiles.com/chess-themes/pieces/glass/150/',
  'metal': 'https://images.chesscomfiles.com/chess-themes/pieces/metal/150/'
} as const;

type PieceSet = keyof typeof pieceSets;

// Función para generar las piezas personalizadas
const getPieceComponents = (pieceSet: PieceSet) => {
  if (pieceSet === 'default') return {};

  const baseUrl = pieceSets[pieceSet];
  return {
    wP: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}wp.png`} alt="wP" style={{ width: squareWidth, height: squareWidth }} />
    ),
    wN: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}wn.png`} alt="wN" style={{ width: squareWidth, height: squareWidth }} />
    ),
    wB: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}wb.png`} alt="wB" style={{ width: squareWidth, height: squareWidth }} />
    ),
    wR: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}wr.png`} alt="wR" style={{ width: squareWidth, height: squareWidth }} />
    ),
    wQ: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}wq.png`} alt="wQ" style={{ width: squareWidth, height: squareWidth }} />
    ),
    wK: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}wk.png`} alt="wK" style={{ width: squareWidth, height: squareWidth }} />
    ),
    bP: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}bp.png`} alt="bP" style={{ width: squareWidth, height: squareWidth }} />
    ),
    bN: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}bn.png`} alt="bN" style={{ width: squareWidth, height: squareWidth }} />
    ),
    bB: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}bb.png`} alt="bB" style={{ width: squareWidth, height: squareWidth }} />
    ),
    bR: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}br.png`} alt="bR" style={{ width: squareWidth, height: squareWidth }} />
    ),
    bQ: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}bq.png`} alt="bQ" style={{ width: squareWidth, height: squareWidth }} />
    ),
    bK: ({ squareWidth }: { squareWidth: number }) => (
      <img src={`${baseUrl}bk.png`} alt="bK" style={{ width: squareWidth, height: squareWidth }} />
    ),
  };
};

function App() {
  const [isChess960, setIsChess960] = useState(false);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [aiLevel, setAiLevel] = useState(1000);
  const [pieceSet, setPieceSet] = useState<PieceSet>('default');
  const [gameStatus, setGameStatus] = useState<GameStatus>({
    isCheck: false,
    isGameOver: false,
    isDraw: false,
    isCheckmate: false,
    winner: null
  });
  const [isThinking, setIsThinking] = useState(false);
  const gameRef = useRef(new Chess());

  const updateGameStatus = useCallback(() => {
    const inCheck = gameRef.current.inCheck();
    const inCheckmate = gameRef.current.isCheckmate();
    const inDraw = gameRef.current.isDraw();
    const gameOver = inCheckmate || inDraw;
    
    let winner: 'white' | 'black' | null = null;
    if (inCheckmate) {
      winner = gameRef.current.turn() === 'w' ? 'black' : 'white';
    }

    setGameStatus({
      isCheck: inCheck,
      isGameOver: gameOver,
      isDraw: inDraw,
      isCheckmate: inCheckmate,
      winner
    });
  }, []);

  const makeMove = useCallback((move: any) => {
    try {
      const result = gameRef.current.move(move);
      if (result) {
        setFen(gameRef.current.fen());
        updateGameStatus();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error making move:', e);
      return false;
    }
  }, [updateGameStatus]);

  // Tablas de posición para cada pieza
  const pawnTable = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.0,  2.0,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  1.5,  1.5,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0, -1.0, -1.0, -1.0, -0.5,  0.5],
    [0.5,  1.0,  1.0,  -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
  ];

  const knightTable = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
  ];

  const bishopTable = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
    [-1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
    [-1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
    [-1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
    [-1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
  ];

  const rookTable = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [0.5,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [-0.5,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -0.5],
    [0.0,   0.0,  0.0,  0.5,  0.5,  0.0,  0.0,  0.0]
  ];

  const queenTable = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [-1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
  ];

  const kingMiddleGameTable = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0],
    [2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0]
  ];

  // Función de evaluación de posición
  const evaluatePosition = (board: Chess) => {
    const pieceValues = {
      p: 100,   // Peón
      n: 320,   // Caballo
      b: 330,   // Alfil
      r: 500,   // Torre
      q: 900,   // Dama
      k: 20000  // Rey (valor alto para protegerlo)
    };

    let score = 0;
    const position = board.board();
    const isEndgame = isEndgamePhase(position);
    const moveCount = Math.floor(board.moveNumber() / 2);
    const isOpening = moveCount < 10;

    // Evaluar material y posición
    let whitePawnCount = 0;
    let blackPawnCount = 0;
    let whiteCenterPawns = 0;
    let blackCenterPawns = 0;
    let whiteDevPieces = 0;
    let blackDevPieces = 0;

    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = position[i][j];
        if (piece) {
          const value = pieceValues[piece.type as keyof typeof pieceValues];
          let positionBonus = getPositionBonus(piece.type, i, j, isEndgame);
          
          // Conteo de peones y piezas desarrolladas
          if (piece.type === 'p') {
            if (piece.color === 'w') {
              whitePawnCount++;
              if (j >= 3 && j <= 4) whiteCenterPawns++;
            } else {
              blackPawnCount++;
              if (j >= 3 && j <= 4) blackCenterPawns++;
            }
          }

          // Penalizar movimiento temprano de la dama
          if (isOpening && piece.type === 'q') {
            const startRow = piece.color === 'w' ? 7 : 0;
            if (i !== startRow) {
              positionBonus -= 30;
            }
          }

          // Penalizar movimiento temprano del rey (anti-bongcloud)
          if (isOpening && piece.type === 'k') {
            const startRow = piece.color === 'w' ? 7 : 0;
            if (i !== startRow) {
              positionBonus -= 100;
            }
          }

          // Contar piezas desarrolladas
          if (['n', 'b'].includes(piece.type)) {
            const startRow = piece.color === 'w' ? 7 : 0;
            if (i !== startRow) {
              if (piece.color === 'w') whiteDevPieces++;
              else blackDevPieces++;
            }
          }
          
          if (piece.color === 'w') {
            score += value + positionBonus;
          } else {
            score -= value + positionBonus;
          }
        }
      }
    }

    // Penalizaciones y bonus específicos para la apertura
    if (isOpening) {
      // Penalizar exceso de movimientos de peones en la apertura
      if (whiteCenterPawns > 2) score -= (whiteCenterPawns - 2) * 20;
      if (blackCenterPawns > 2) score += (blackCenterPawns - 2) * 20;

      // Bonus por desarrollo de piezas menores
      score += whiteDevPieces * 15;
      score -= blackDevPieces * 15;

      // Penalizar por no desarrollar piezas
      if (moveCount > 4) {
        score -= (4 - whiteDevPieces) * 10;
        score += (4 - blackDevPieces) * 10;
      }

      // Bonus por control del centro con piezas menores
      for (let i = 2; i <= 5; i++) {
        for (let j = 2; j <= 5; j++) {
          const piece = position[i][j];
          if (piece && ['n', 'b'].includes(piece.type)) {
            if (piece.color === 'w') score += 10;
            else score -= 10;
          }
        }
      }
    }

    // Penalizar al rey expuesto
    const whiteKingSafety = evaluateKingSafety(board, 'w');
    const blackKingSafety = evaluateKingSafety(board, 'b');
    score += (whiteKingSafety - blackKingSafety) * (isOpening ? 1.0 : 0.5);

    // Bonus por movilidad
    const whiteMobility = board.moves().length;
    // Crear una nueva instancia para verificar movilidad del negro
    const tempBoard = new Chess(board.fen());
    // Forzar el turno del negro cambiando el FEN
    const fenParts = tempBoard.fen().split(' ');
    fenParts[1] = 'b';
    tempBoard.load(fenParts.join(' '));
    const blackMobility = tempBoard.moves().length;
    score += (whiteMobility - blackMobility) * 0.1;

    return score;
  };

  // Función auxiliar para determinar si estamos en el final del juego
  const isEndgamePhase = (position: ({ type: string, color: string } | null)[][]) => {
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
  };

  // Función para obtener el bonus de posición según la pieza
  const getPositionBonus = (pieceType: string, row: number, col: number, isEndgame: boolean) => {
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
  };

  // Función para evaluar la seguridad del rey
  const evaluateKingSafety = (board: Chess, color: 'w' | 'b') => {
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
    safety -= Math.abs(kingCol - 4) * 2; // Penalización por distancia del centro horizontal
    safety -= (color === 'w' ? kingRow - 7 : kingRow) * 3; // Penalización por distancia de la fila base

    return safety;
  };

  // Función minimax con poda alfa-beta
  const minimax = (board: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number => {
    if (depth === 0 || board.isGameOver()) {
      return evaluatePosition(board);
    }

    const moves = board.moves({ verbose: true });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = new Chess(board.fen());
        newBoard.move(move);
        const evaluation = minimax(newBoard, depth - 1, alpha, beta, false);
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
        const evaluation = minimax(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  // Función para obtener la profundidad según el nivel ELO
  const getDepthFromElo = (elo: number): number => {
    if (elo <= 800) return 1;
    if (elo <= 1000) return 2;
    if (elo <= 1200) return 3;
    return 4; // Para ELO 1500
  };

  const makeAiMove = useCallback(() => {
    const legalMoves = gameRef.current.moves({ verbose: true });
    
    if (legalMoves && legalMoves.length > 0) {
      setIsThinking(true);
      const depth = getDepthFromElo(aiLevel);
      let bestMove = legalMoves[0];

      // Usar setTimeout para no bloquear la interfaz
      setTimeout(() => {
        let bestEval = -Infinity;
        const randomFactor = aiLevel < 1000 ? Math.random() * 2 - 1 : 0;

        for (const move of legalMoves) {
          const newBoard = new Chess(gameRef.current.fen());
          newBoard.move(move);
          const evaluation = minimax(newBoard, depth - 1, -Infinity, Infinity, false) + randomFactor;
          
          if (evaluation > bestEval) {
            bestEval = evaluation;
            bestMove = move;
          }
        }
        
        makeMove({
          from: bestMove.from,
          to: bestMove.to,
          promotion: bestMove.promotion || 'q'
        });
        setIsThinking(false);
      }, 100);
    }
  }, [makeMove, aiLevel]);

  const onDrop = useCallback((sourceSquare: string, targetSquare: string) => {
    // Verificar si es el turno del jugador
    if (gameRef.current.turn() !== (playerColor === 'white' ? 'w' : 'b')) {
      return false;
    }

    // Intentar hacer el movimiento del jugador
    const moveSuccess = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    // Si el movimiento fue exitoso, hacer el movimiento de la IA
    if (moveSuccess) {
      makeAiMove();
      return true;
    }

    return false;
  }, [playerColor, makeMove, makeAiMove]);

  // Función para generar una posición inicial válida de Chess960
  const generateChess960Position = () => {
    try {
      // Generar posiciones para las piezas
      let positions = Array(8).fill(null);
      
      // 1. Colocar alfiles en casillas de diferente color
      const darkBishopPos = Math.floor(Math.random() * 4) * 2; // 0, 2, 4, o 6
      const lightBishopPos = Math.floor(Math.random() * 4) * 2 + 1; // 1, 3, 5, o 7
      positions[darkBishopPos] = 'b';
      positions[lightBishopPos] = 'b';
      
      // 2. Colocar el rey entre las torres
      let emptySquares = positions.map((p, i) => p === null ? i : null).filter(i => i !== null);
      
      // Encontrar tres posiciones consecutivas para las torres y el rey
      let foundPosition = false;
      let rookPos1, kingPos, rookPos2;
      
      while (!foundPosition && emptySquares.length >= 3) {
        const startIdx = Math.floor(Math.random() * (emptySquares.length - 2));
        if (emptySquares[startIdx + 1] === emptySquares[startIdx] + 1 &&
            emptySquares[startIdx + 2] === emptySquares[startIdx] + 2) {
          rookPos1 = emptySquares[startIdx];
          kingPos = emptySquares[startIdx + 1];
          rookPos2 = emptySquares[startIdx + 2];
          foundPosition = true;
        }
      }
      
      if (!foundPosition) {
        throw new Error("No se pudo encontrar una posición válida para las torres y el rey");
      }
      
      positions[rookPos1] = 'r';
      positions[kingPos] = 'k';
      positions[rookPos2] = 'r';
      
      // 3. Colocar reina y caballos en las posiciones restantes
      emptySquares = positions.map((p, i) => p === null ? i : null).filter(i => i !== null);
      const queenPos = emptySquares[Math.floor(Math.random() * emptySquares.length)];
      positions[queenPos] = 'q';
      
      emptySquares = positions.map((p, i) => p === null ? i : null).filter(i => i !== null);
      const knight1Pos = emptySquares[Math.floor(Math.random() * emptySquares.length)];
      positions[knight1Pos] = 'n';
      
      emptySquares = positions.map((p, i) => p === null ? i : null).filter(i => i !== null);
      const knight2Pos = emptySquares[0];
      positions[knight2Pos] = 'n';
      
      // Validar que todas las posiciones están ocupadas
      if (positions.some(p => p === null)) {
        throw new Error("Algunas posiciones quedaron sin asignar");
      }
      
      // Retornar solo la primera fila en mayúsculas
      return positions.join('').toUpperCase();
    } catch (error) {
      console.error('Error generating Chess960 position:', error);
      // En caso de error, retornar la posición estándar
      return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    }
  };
  // Función para resetear el juego
  const resetGame = useCallback(() => {
    try {
      // Crear una nueva instancia de Chess con la posición inicial estándar
      gameRef.current = new Chess();
      
      // Si es Chess960, configurar una nueva posición
      if (isChess960) {
        // Primero limpiar el tablero
        gameRef.current.clear();
        
        // Generar la posición de Chess960
        const positions = generateChess960Position();
        const firstRank = positions.substring(0, 8);
        
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
          gameRef.current.put({ 
            type: getPieceType(firstRank[i]), 
            color: 'w' 
          }, toSquare(i, 1) as any);
          
          // Colocar peones blancos
          gameRef.current.put({ 
            type: 'p' as const, 
            color: 'w' 
          }, toSquare(i, 2) as any);
          
          // Colocar peones negros
          gameRef.current.put({ 
            type: 'p' as const, 
            color: 'b' 
          }, toSquare(i, 7) as any);
          
          // Colocar piezas negras
          gameRef.current.put({ 
            type: getPieceType(firstRank[i]), 
            color: 'b' 
          }, toSquare(i, 8) as any);
        }
      }
      
      setFen(gameRef.current.fen());
      setGameStatus({
        isCheck: false,
        isGameOver: false,
        isDraw: false,
        isCheckmate: false,
        winner: null
      });
      
      if (playerColor === 'black') {
        setTimeout(makeAiMove, 300);
      }
    } catch (error) {
      console.error('Error setting up Chess960 position:', error);
    }
  }, [playerColor, makeAiMove, isChess960]);

  // Effect para reiniciar el juego cuando cambia el color del jugador
  useEffect(() => {
    resetGame();
  }, [playerColor]);

  return (
    <div className="app">
      <div className="settings">
        <div className="color-select">
          <label>Play as: </label>
          <select 
            value={playerColor} 
            onChange={(e) => setPlayerColor(e.target.value as 'white' | 'black')}
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
        <div className="difficulty-select">
          <label>AI Level (ELO): </label>
          <select 
            value={aiLevel} 
            onChange={(e) => setAiLevel(Number(e.target.value))}
          >
            <option value="800">Beginner (800)</option>
            <option value="1000">Intermediate (1000)</option>
            <option value="1200">Advanced (1200)</option>
            <option value="1500">Expert (1500)</option>
          </select>
        </div>
        <div className="chess960-select">
          <label>
            <input 
              type="checkbox" 
              checked={isChess960}
              onChange={(e) => {
                setIsChess960(e.target.checked);
                // Reiniciar el juego cuando se cambia el modo
                setTimeout(resetGame, 0);
              }}
            />
            Chess960
          </label>
        </div>
        <div className="piece-set-select">
          <label>Piece Style: </label>
          <select 
            value={pieceSet} 
            onChange={(e) => setPieceSet(e.target.value as PieceSet)}
          >
            <option value="default">Default</option>
            <option value="neo">Neo</option>
            <option value="glass">Glass</option>
            <option value="metal">Metal</option>
          </select>
        </div>
        <button onClick={resetGame}>New Game</button>
      </div>
      <div className="board-container">
        <div className="game-status">
          {isThinking && (
            <div className="alert thinking">La IA está pensando...</div>
          )}
          {gameStatus.isCheck && !gameStatus.isCheckmate && (
            <div className="alert check">¡JAQUE!</div>
          )}
          {gameStatus.isGameOver && (
            <div className="alert game-over">
              {gameStatus.isDraw ? (
                "¡TABLAS!"
              ) : gameStatus.isCheckmate ? (
                <>
                  ¡JAQUE MATE! - 
                  {gameStatus.winner === playerColor ? "¡Has ganado!" : "¡La IA ha ganado!"}
                </>
              ) : null}
            </div>
          )}
        </div>
        <div className="board">
          <Chessboard 
            position={fen}
            onPieceDrop={onDrop}
            boardWidth={600}
            boardOrientation={playerColor}
            customDarkSquareStyle={{ backgroundColor: '#779952' }}
            customLightSquareStyle={{ backgroundColor: '#edeed1' }}
            customPieces={getPieceComponents(pieceSet)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
