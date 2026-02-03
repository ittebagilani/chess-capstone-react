import { v4 as uuid } from "uuid"

export function getGameId(): string {
  const params = new URLSearchParams(window.location.search)
  let id = params.get("game")

  if (!id) {
    id = uuid()
    window.history.replaceState({}, "", `?game=${id}`)
  }

  return id
}

export function saveGame(id: string, fen: string): void {
  localStorage.setItem(id, fen)
}

export function loadGame(id: string): string | null {
  return localStorage.getItem(id)
}
