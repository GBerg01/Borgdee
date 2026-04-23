import { useGameStore } from '../store/gameStore'

const hud: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '24px',
  gap: '12px',
  fontFamily: 'system-ui, sans-serif',
  color: '#fff',
}

const controls: React.CSSProperties = {
  background: 'rgba(0,0,0,0.45)',
  borderRadius: '10px',
  padding: '10px 18px',
  fontSize: '13px',
  letterSpacing: '0.5px',
  display: 'flex',
  gap: '20px',
  backdropFilter: 'blur(4px)',
}

const badge: React.CSSProperties = {
  background: 'rgba(0,0,0,0.55)',
  borderRadius: '12px',
  padding: '6px 16px',
  fontSize: '14px',
  fontWeight: 600,
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(6px)',
}

const bigText: React.CSSProperties = {
  fontSize: '64px',
  fontWeight: 900,
  letterSpacing: '-2px',
  textShadow: '0 4px 24px rgba(0,0,0,0.6)',
}

const restartBtn: React.CSSProperties = {
  pointerEvents: 'all',
  background: '#ff6b35',
  border: 'none',
  borderRadius: '12px',
  padding: '14px 36px',
  fontSize: '18px',
  fontWeight: 700,
  color: '#fff',
  cursor: 'pointer',
  letterSpacing: '0.5px',
}

function TileCounter() {
  const tiles = useGameStore((s) => s.tiles)
  const remaining = Array.from(tiles.values()).filter(
    (t) => t.state !== 'gone'
  ).length
  const total = tiles.size
  return (
    <div style={badge}>
      🟦 {remaining} / {total} tiles
    </div>
  )
}

export default function HUD() {
  const phase     = useGameStore((s) => s.phase)
  const resetGame = useGameStore((s) => s.resetGame)
  const initTiles = useGameStore((s) => s.initTiles)

  function handleRestart() {
    // Reload page for clean prototype restart
    window.location.reload()
  }

  return (
    <div style={hud}>
      {/* Eliminated overlay */}
      {phase === 'eliminated' && (
        <div style={overlay}>
          <div style={{ ...bigText, color: '#ff4444' }}>YOU FELL 💀</div>
          <div style={{ fontSize: '20px', opacity: 0.8 }}>Better luck next time</div>
          <button style={restartBtn} onClick={handleRestart}>Play Again</button>
        </div>
      )}

      {/* Won overlay */}
      {phase === 'won' && (
        <div style={overlay}>
          <div style={{ ...bigText, color: '#ffcc00' }}>YOU WIN 🏆</div>
          <div style={{ fontSize: '20px', opacity: 0.8 }}>Last one standing!</div>
          <button style={restartBtn} onClick={handleRestart}>Play Again</button>
        </div>
      )}

      {/* Bottom bar */}
      {phase === 'playing' && (
        <>
          <TileCounter />
          <div style={controls}>
            <span><b>WASD</b> move</span>
            <span><b>SPACE</b> jump</span>
            <span><b>SHIFT</b> dive</span>
            <span><b>E</b> grab</span>
          </div>
        </>
      )}
    </div>
  )
}
