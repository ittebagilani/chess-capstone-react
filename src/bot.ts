import { Chess } from "chess.js"
import type { Difficulty } from "./types"

export function getBotMove(game: Chess, difficulty: Difficulty): string {
  const moves = game.moves()

  if (difficulty === "easy") {
    return moves[Math.floor(Math.random() * moves.length)]
  }

  if (difficulty === "medium") {
    return moves.find((m) => m.includes("x")) ?? moves[0]
  }

  // hard (placeholder)
  return moves[Math.floor(Math.random() * moves.length)]
}
