import { useGameStore } from '../store/gameStore'

const hud: React.CSSProperties = {
  position: 'absolute', inset: 0,
  pointerEvents: 'none',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'flex-end',
  padding: '20px', gap: '10px',
  fontFamily: 'system-ui, sans-serif', color: '#fff',
}

const overlay: React.CSSProperties = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: '20px',
  background: 'rgba(0,0,0,0.55)',
  backdropFilter: 'blur(6px)',
}

const bigText: React.CSSProperties = {
  fontSize: 'clamp(52px, 8vw, 80px)',
  fontWeight: 900, letterSpacing: '-2px',
  textShadow: '0 4px 24px rgba(0,0,0,0.6)',
  lineHeight: 1,
}

const restartBtn: React.CSSProperties = {
  pointerEvents: 'all',
  background: 'linear-gradient(135deg, #ff6b35, #ff3399)',
  border: 'none', borderRadius: '14px',
  padding: '14px 38px', fontSize: '18px',
  fontWeight: 800, color: '#fff', cursor: 'pointer',
}

const editBtn: React.CSSProperties = {
  pointerEvents: 'all',
  background: 'rgba(255,255,255,0.1)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '14px', padding: '12px 28px',
  fontSize: '15px', fontWeight: 600, color: '#fff', cursor: 'pointer',
}

const pill: React.CSSProperties = {
  background: 'rgba(0,0,0,0.5)',
  borderRadius: '100px', padding: '7px 18px',
  fontSize: '14px', fontWeight: 600,
  backdropFilter: 'blur(4px)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const controls: React.CSSProperties = {
  background: 'rgba(0,0,0,0.4)',
  borderRadius: '10px', padding: '8px 18px',
  fontSize: '12px', letterSpacing: '0.3px',
  display: 'flex', gap: '18px',
  backdropFilter: 'blur(4px)',
  color: 'rgba(255,255,255,0.7)',
}

const topBar: React.CSSProperties = {
  position: 'absolute', top: '16px', left: 0, right: 0,
  display: 'flex', justifyContent: 'center', gap: '16px',
  pointerEvents: 'none',
}

// ─── Countdown overlay ────────────────────────────────────────────────────────
function CountdownOverlay() {
  const countdown = useGameStore((s) => s.countdown)
  const label = countdown === 0 ? 'GO! 🏃' : String(countdown)
  const color = countdown === 0 ? '#ffcc00' : '#ffffff'
  return (
    <div style={overlay}>
      <div style={{ ...bigText, color, fontSize: 'clamp(80px, 14vw, 140px)' }}>
        {label}
      </div>
      {countdown > 0 && (
        <div style={{ fontSize: '16px', opacity: 0.65 }}>Get ready...</div>
      )}
    </div>
  )
}

// ─── Top bar during play ───────────────────────────────────────────────────────
function TopBar() {
  const tiles     = useGameStore((s) => s.tiles)
  const aliveCount= useGameStore((s) => s.aliveCount)
  const remaining = Array.from(tiles.values()).filter(t => t.state !== 'gone').length
  const total     = tiles.size

  return (
    <div style={topBar}>
      <div style={pill}>👥 {aliveCount} alive</div>
      <div style={pill}>🟦 {remaining}/{total} tiles</div>
    </div>
  )
}

// ─── Main HUD ─────────────────────────────────────────────────────────────────
interface HUDProps {
  onRestart: () => void
  onEditCharacter: () => void
}

export default function HUD({ onRestart, onEditCharacter }: HUDProps) {
  const phase = useGameStore((s) => s.phase)

  return (
    <div style={hud}>

      {/* Countdown */}
      {phase === 'countdown' && <CountdownOverlay />}

      {/* Eliminated */}
      {phase === 'eliminated' && (
        <div style={{ ...overlay, pointerEvents: 'all' }}>
          <div style={{ ...bigText, color: '#ff4444' }}>YOU FELL 💀</div>
          <div style={{ fontSize: '18px', opacity: 0.65 }}>Better luck next time</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button style={restartBtn} onClick={onRestart}>Play Again</button>
            <button style={editBtn} onClick={onEditCharacter}>Edit Character</button>
          </div>
        </div>
      )}

      {/* Won */}
      {phase === 'won' && (
        <div style={{ ...overlay, pointerEvents: 'all' }}>
          <div style={{ ...bigText, color: '#ffcc00' }}>YOU WIN! 🏆</div>
          <div style={{ fontSize: '18px', opacity: 0.65 }}>Last one standing!</div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button style={restartBtn} onClick={onRestart}>Play Again</button>
            <button style={editBtn} onClick={onEditCharacter}>Edit Character</button>
          </div>
        </div>
      )}

      {/* Playing state UI */}
      {phase === 'playing' && (
        <>
          <TopBar />
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
