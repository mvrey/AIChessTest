import { useState, useCallback, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ChessAI } from './services/ChessAI';
import { Chess960Generator } from './services/Chess960Generator';
import { GameStatus } from './models/ChessPosition';
import './App.css';

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



  const aiRef = useRef(new ChessAI());

  const makeAiMove = useCallback(() => {
    const legalMoves = gameRef.current.moves({ verbose: true });
    
    if (legalMoves && legalMoves.length > 0) {
      setIsThinking(true);
      const depth = aiRef.current.getDepthFromElo(aiLevel);
      const randomFactor = aiLevel < 1000 ? Math.random() * 2 - 1 : 0;

      // Usar setTimeout para no bloquear la interfaz
      setTimeout(() => {
        const bestMove = aiRef.current.findBestMove(gameRef.current, depth, randomFactor);
        makeMove(bestMove);
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

  const chess960Ref = useRef(new Chess960Generator());
  // Función para resetear el juego
  const resetGame = useCallback(() => {
    try {
      // Siempre crear una nueva instancia de Chess con la posición inicial estándar
      gameRef.current = new Chess();
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
      console.error('Error resetting game:', error);
    }
  }, [playerColor, makeAiMove]);

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
                const newValue = e.target.checked;
                setIsChess960(newValue);
                if (newValue) {
                  // Solo generar nueva posición Chess960 cuando se activa
                  const firstRank = chess960Ref.current.generatePosition();
                  gameRef.current = new Chess();
                  chess960Ref.current.setupPosition(gameRef.current, firstRank);
                  setFen(gameRef.current.fen());
                  if (playerColor === 'black') {
                    setTimeout(makeAiMove, 300);
                  }
                } else {
                  // Al desactivar, volver a posición inicial estándar
                  resetGame();
                }
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
