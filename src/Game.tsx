import { useState, useRef } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"
import type { Difficulty } from "./types"
import { getBotMove } from "./bot"

interface GameProps {
  playerName: string
  difficulty: Difficulty
}

const Game = ({ playerName, difficulty }: GameProps) => {
  const chessGameRef = useRef(new Chess())
  const chessGame = chessGameRef.current
  
  const [chessPosition, setChessPosition] = useState(chessGame.fen())
  const [moveFrom, setMoveFrom] = useState("")
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})
  const [isBotThinking, setIsBotThinking] = useState(false)

  const displayName = playerName || "You"

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
      square: square as any,
      verbose: true
    }) as any[]

    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }

    const newSquares: Record<string, React.CSSProperties> = {}

    for (const move of moves) {
      const targetSquare = move.to as any
      const fromSquare = square as any

      newSquares[move.to] = {
        background:
          chessGame.get(targetSquare) &&
          chessGame.get(targetSquare)?.color !== chessGame.get(fromSquare)?.color
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

  function onSquareClick({ square, piece }: any) {
    // Don't allow moves during bot's turn
    if (isBotThinking || chessGame.turn() !== "w") return

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
      square: moveFrom as any,
      verbose: true
    }) as any[]
    
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square)

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square)
      setMoveFrom(hasMoveOptions ? square : "")
      return
    }

    // Make the move
    try {
      chessGame.move({
        from: moveFrom,
        to: square,
        promotion: "q"
      })
    } catch {
      const hasMoveOptions = getMoveOptions(square)
      if (hasMoveOptions) {
        setMoveFrom(square)
      }
      return
    }

    setChessPosition(chessGame.fen())
    setMoveFrom("")
    setOptionSquares({})

    // Make bot move
    makeBotMove()
  }

  function onPieceDrop({ sourceSquare, targetSquare }: any) {
    // Don't allow moves during bot's turn
    if (isBotThinking || chessGame.turn() !== "w") return false

    if (!targetSquare) {
      return false
    }

    try {
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q"
      })

      setChessPosition(chessGame.fen())
      setMoveFrom("")
      setOptionSquares({})

      // Make bot move
      makeBotMove()

      return true
    } catch {
      return false
    }
  }

  const isWhiteTurn = chessGame.turn() === "w"

  const chessboardOptions = {
    onPieceDrop,
    onSquareClick,
    position: chessPosition,
    customSquareStyles: optionSquares,
    arePiecesDraggable: !chessGame.isGameOver() && !isBotThinking && chessGame.turn() === "w"
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: 16,
        minHeight: "100vh",
        boxSizing: "border-box",
        backgroundColor: "#F0D9B5",
       
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>
        {displayName} vs Bot{" "}
        <span style={{ fontSize: 12, opacity: 0.8 }}>({difficulty})</span>
      </h2>
      <div style={{ fontWeight: 500, fontSize: 14 }}>
        Turn:{" "}
        <span style={{ color: isWhiteTurn ? "#2ecc71" : "#e74c3c" }}>
          {isWhiteTurn ? `${displayName} (White)` : "Bot (Black)"}
        </span>
        {isBotThinking && " (Bot is thinking...)"}
      </div>

      <div style={{ width: "100%", maxWidth: 700, aspectRatio: "1/1",  border: "1px solid black"}}>
        <Chessboard options={chessboardOptions} />
      </div>
    </div>
  )
}

export default Game