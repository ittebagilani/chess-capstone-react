import { useState, useRef, useEffect } from "react"
import { Chess, type Square } from "chess.js"
import { Chessboard } from "react-chessboard"
import type { Difficulty, PlayerColor } from "./types"
import { getBotMove } from "./bot"

interface RoomProps {
  playerName: string
  difficulty: Difficulty
  gameMode: "pvbot" | "pvp"
  roomId: string
}

const Room = ({ playerName, difficulty, gameMode, roomId }: RoomProps) => {
  const chessGameRef = useRef(new Chess())
  const chessGame = chessGameRef.current
  
  const [chessPosition, setChessPosition] = useState(chessGame.fen())
  const [moveFrom, setMoveFrom] = useState("")
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})
  const [isBotThinking, setIsBotThinking] = useState(false)
  const [myColor, setMyColor] = useState<PlayerColor | null>(null)
  const [opponentName, setOpponentName] = useState<string>("")
  const [waitingForOpponent, setWaitingForOpponent] = useState(gameMode === "pvp")

  const displayName = playerName || "You"

  // Initialize or join room
  useEffect(() => {
    if (gameMode === "pvp") {
      initializeRoom()
    } else {
      // PvBot mode - player is always white
      setMyColor("white")
      setWaitingForOpponent(false)
    }
  }, [])

  // Poll for game updates in PvP mode
  useEffect(() => {
    if (gameMode === "pvp" && myColor) {
      const interval = setInterval(pollGameState, 1000)
      return () => clearInterval(interval)
    }
  }, [gameMode, myColor])

  async function initializeRoom() {
    try {
      // Try to get existing room data
      const roomData = localStorage.getItem(`room:${roomId}`)
      
      if (!roomData) {
        // Create new room - I'm player 1 (white)
        localStorage.setItem(`room:${roomId}`, JSON.stringify({
          fen: chessGame.fen(),
          player1: playerName,
          player2: null,
          turn: "w"
        }))
        setMyColor("white")
        setWaitingForOpponent(true)
      } else {
        // Join existing room - I'm player 2 (black)
        const room = JSON.parse(roomData)
        
        if (!room.player2) {
          room.player2 = playerName
          localStorage.setItem(`room:${roomId}`, JSON.stringify(room))
          setMyColor("black")
          setOpponentName(room.player1)
          setWaitingForOpponent(false)
          chessGame.load(room.fen)
          setChessPosition(room.fen)
        } else {
          alert("Room is full!")
        }
      }
    } catch (error) {
      console.error("Error initializing room:", error)
    }
  }

  async function pollGameState() {
    try {
      const roomData = localStorage.getItem(`room:${roomId}`)
      
      if (!roomData) return
      
      const room = JSON.parse(roomData)
      
      // Update opponent name if we're player 1 and player 2 joined
      if (myColor === "white" && room.player2 && !opponentName) {
        setOpponentName(room.player2)
        setWaitingForOpponent(false)
      }
      
      // Update board if it's a different position
      if (room.fen !== chessGame.fen()) {
        chessGame.load(room.fen)
        setChessPosition(room.fen)
      }
    } catch (error) {
      // Room might not exist yet
    }
  }

  async function updateRoomState(newFen: string) {
    try {
      const roomData = localStorage.getItem(`room:${roomId}`)
      if (!roomData) return
      
      const room = JSON.parse(roomData)
      room.fen = newFen
      room.turn = chessGame.turn()
      
      localStorage.setItem(`room:${roomId}`, JSON.stringify(room))
    } catch (error) {
      console.error("Error updating room:", error)
    }
  }

  // Make bot move
  function makeBotMove() {
    if (chessGame.isGameOver() || chessGame.turn() !== "b") {
      return
    }

    setIsBotThinking(true)
    setTimeout(() => {
      const botMoveStr = getBotMove(chessGame, difficulty)
      chessGame.move(botMoveStr)
      setChessPosition(chessGame.fen())
      setIsBotThinking(false)
    }, 500)
  }

  // Get move options for a square
  function getMoveOptions(square: string) {
    const moves = chessGame.moves({
      square: square as Square,
      verbose: true
    })

    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }

    const newSquares: Record<string, React.CSSProperties> = {}

    for (const move of moves) {
      newSquares[move.to] = {
        background:
          chessGame.get(move.to as Square) && chessGame.get(move.to as Square)?.color !== chessGame.get(square as Square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%"
      }
    }

    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)"
    }

    setOptionSquares(newSquares)
    return true
  }

  function canMove(): boolean {
    if (gameMode === "pvbot") {
      return !isBotThinking && chessGame.turn() === "w"
    } else {
      // PvP mode
      if (waitingForOpponent) return false
      const isMyTurn = (myColor === "white" && chessGame.turn() === "w") ||
                       (myColor === "black" && chessGame.turn() === "b")
      return isMyTurn
    }
  }

  function onSquareClick({ square, piece }: any) {
    if (!canMove()) return

    // Piece clicked to move
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square)
      if (hasMoveOptions) {
        setMoveFrom(square)
      }
      return
    }

    // Square clicked to move to
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    })
    
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square)

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square)
      setMoveFrom(hasMoveOptions ? square : "")
      return
    }

    // Make the move
    try {
      chessGame.move({
        from: moveFrom as Square,
        to: square as Square,
        promotion: "q"
      })
    } catch {
      const hasMoveOptions = getMoveOptions(square)
      if (hasMoveOptions) {
        setMoveFrom(square)
      }
      return
    }

    const newFen = chessGame.fen()
    setChessPosition(newFen)
    setMoveFrom("")
    setOptionSquares({})

    // Update room or make bot move
    if (gameMode === "pvp") {
      updateRoomState(newFen)
    } else {
      makeBotMove()
    }
  }

  function onPieceDrop({ sourceSquare, targetSquare }: any) {
    if (!canMove()) return false

    if (!targetSquare) {
      return false
    }

    try {
      chessGame.move({
        from: sourceSquare as Square,
        to: targetSquare as Square,
        promotion: "q"
      })

      const newFen = chessGame.fen()
      setChessPosition(newFen)
      setMoveFrom("")
      setOptionSquares({})

      // Update room or make bot move
      if (gameMode === "pvp") {
        updateRoomState(newFen)
      } else {
        makeBotMove()
      }

      return true
    } catch {
      return false
    }
  }

  const isWhiteTurn = chessGame.turn() === "w"
  const isMyTurn = gameMode === "pvbot" 
    ? isWhiteTurn 
    : (myColor === "white" && isWhiteTurn) || (myColor === "black" && !isWhiteTurn)

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    customSquareStyles: optionSquares,
    arePiecesDraggable: canMove() && !chessGame.isGameOver(),
    boardOrientation: (myColor || "white") as "white" | "black"
  }

  const opponent = gameMode === "pvbot" ? `Bot (${difficulty})` : (opponentName || "Waiting...")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: 16,
        minHeight: "100vh",
        boxSizing: "border-box"
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>
        {displayName} vs {opponent}
      </h2>
      
      {gameMode === "pvp" && (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Room: {roomId} | You are: {myColor || "..."}
        </div>
      )}
      
      {waitingForOpponent && (
        <div style={{ 
          padding: 12, 
          background: "#ffeaa7", 
          borderRadius: 8,
          fontSize: 14
        }}>
          Waiting for opponent to join... Share this link!
        </div>
      )}
      
      <div style={{ fontWeight: 500, fontSize: 14 }}>
        Turn:{" "}
        <span style={{ color: isWhiteTurn ? "#2ecc71" : "#e74c3c" }}>
          {isWhiteTurn ? "White" : "Black"}
        </span>
        {isMyTurn && " (Your turn)"}
        {isBotThinking && " (Bot is thinking...)"}
      </div>

      <div style={{ width: "100%", maxWidth: 500, aspectRatio: "1/1" }}>
        <Chessboard options={chessboardOptions} />
      </div>
    </div>
  )
}

export default Room