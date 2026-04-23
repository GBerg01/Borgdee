const root: React.CSSProperties = {
  width: '100%', height: '100%',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'radial-gradient(ellipse at 50% 40%, #1a1040 0%, #0a0a0f 70%)',
  color: '#fff', fontFamily: 'system-ui, sans-serif',
  gap: '0px',
  overflow: 'hidden',
}

const title: React.CSSProperties = {
  fontSize: 'clamp(52px, 9vw, 100px)',
  fontWeight: 900,
  letterSpacing: '-3px',
  background: 'linear-gradient(135deg, #ff6b35 0%, #ffcc00 50%, #ff3399 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '8px',
  textShadow: 'none',
  lineHeight: 1,
}

const tagline: React.CSSProperties = {
  fontSize: '18px',
  opacity: 0.65,
  letterSpacing: '0.5px',
  marginBottom: '52px',
}

const pill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '10px',
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '100px', padding: '7px 18px',
  fontSize: '13px', color: 'rgba(255,255,255,0.55)',
  marginBottom: '40px',
}

const playBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ff6b35, #ff3399)',
  border: 'none', borderRadius: '16px',
  padding: '18px 52px', fontSize: '20px', fontWeight: 800,
  color: '#fff', cursor: 'pointer',
  letterSpacing: '0.5px',
  boxShadow: '0 8px 32px rgba(255, 80, 80, 0.35)',
  transition: 'transform 0.1s, box-shadow 0.1s',
}

const features: React.CSSProperties = {
  display: 'flex', gap: '32px', marginTop: '48px',
  flexWrap: 'wrap', justifyContent: 'center',
}

const feat: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: '6px', fontSize: '13px', opacity: 0.55, maxWidth: '90px', textAlign: 'center',
}

interface Props { onPlay: () => void }

export default function StartScreen({ onPlay }: Props) {
  return (
    <div style={root}>
      <div style={title}>BORGDEE</div>
      <div style={tagline}>Last one standing on the crumbling arena wins.</div>

      <div style={pill}>
        <span>🟦</span>
        <span>Hex tile arena · Physics chaos · Custom characters</span>
      </div>

      <button
        style={playBtn}
        onMouseEnter={e => {
          (e.target as HTMLElement).style.transform = 'scale(1.05)'
          ;(e.target as HTMLElement).style.boxShadow = '0 12px 40px rgba(255,80,80,0.5)'
        }}
        onMouseLeave={e => {
          (e.target as HTMLElement).style.transform = 'scale(1)'
          ;(e.target as HTMLElement).style.boxShadow = '0 8px 32px rgba(255,80,80,0.35)'
        }}
        onClick={onPlay}
      >
        Customize & Play →
      </button>

      <div style={features}>
        {[
          { icon: '💥', label: 'Tiles collapse under you' },
          { icon: '🤸', label: 'Jump, dive & grab' },
          { icon: '🎭', label: 'Build your character' },
          { icon: '🤖', label: '7 bots to compete with' },
          { icon: '🏆', label: 'Last one standing wins' },
        ].map(({ icon, label }) => (
          <div key={label} style={feat}>
            <span style={{ fontSize: '26px' }}>{icon}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '48px', fontSize: '12px', opacity: 0.25 }}>
        WASD to move · SPACE to jump · SHIFT to dive · E to grab
      </div>
    </div>
  )
}
