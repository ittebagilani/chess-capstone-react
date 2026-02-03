import { useState } from "react"
import Room from "./Room"
import type { Difficulty, GameMode } from "./types"

const App = () => {
  const [started, setStarted] = useState<boolean>(false)
  const [name, setName] = useState<string>("")
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [gameMode, setGameMode] = useState<GameMode>("pvbot")
  const [roomId, setRoomId] = useState<string>("")

  // Get room ID from URL or generate new one
  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleStart = () => {
    if (gameMode === "pvp" && !roomId) {
      const newRoomId = generateRoomId()
      setRoomId(newRoomId)
      // Update URL
      window.history.pushState({}, "", `?room=${newRoomId}`)
    }
    setStarted(true)
  }

  // Check if there's a room ID in URL on mount
  useState(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRoomId = params.get("room")
    if (urlRoomId) {
      setRoomId(urlRoomId)
      setGameMode("pvp")
    }
  })

  if (!started) {
    return (
      <div style={{ 
        padding: 40,
        maxWidth: 400,
        margin: "0 auto"
      }}>
        <h1>Play Chess</h1>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>Your name:</label>
          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              fontSize: 16,
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8 }}>Game mode:</label>
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as GameMode)}
            style={{
              width: "100%",
              padding: 8,
              fontSize: 16
            }}
          >
            <option value="pvbot">Player vs Bot</option>
            <option value="pvp">Player vs Player</option>
          </select>
        </div>

        {gameMode === "pvbot" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 8 }}>Difficulty:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              style={{
                width: "100%",
                padding: 8,
                fontSize: 16
              }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}

        {gameMode === "pvp" && roomId && (
          <div style={{ 
            marginBottom: 16,
            padding: 12,
            background: "#e8f8f5",
            borderRadius: 8
          }}>
            <strong>Joining room:</strong> {roomId}
          </div>
        )}

        <button 
          onClick={handleStart}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            background: "#2ecc71",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          {gameMode === "pvp" && !roomId ? "Create Room" : "Start Game"}
        </button>
      </div>
    )
  }

  return <Room 
    playerName={name} 
    difficulty={difficulty} 
    gameMode={gameMode}
    roomId={roomId}
  />
}

export default App