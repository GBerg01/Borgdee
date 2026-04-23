import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import CharacterMesh from '../game/CharacterMesh'
import {
  useCharacterStore,
  PRESETS, PALETTES, BODY_SCALES,
  randomBuild, randomName,
} from '../store/characterStore'
import type { BodyType, HeadShape, HatType, EyeType } from '../store/characterStore'

// ─── Tab definitions ─────────────────────────────────────────────────────────
type Tab = 'presets' | 'body' | 'colors' | 'hat' | 'head' | 'eyes'
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'presets', icon: '⭐', label: 'Presets'  },
  { id: 'body',    icon: '🫃', label: 'Body'     },
  { id: 'colors',  icon: '🎨', label: 'Colors'   },
  { id: 'hat',     icon: '🎩', label: 'Hat'       },
  { id: 'head',    icon: '😶', label: 'Head'      },
  { id: 'eyes',    icon: '👁',  label: 'Eyes'      },
]

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  root: {
    width: '100%', height: '100%',
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(160deg, #2d1b69 0%, #11003a 40%, #001a3a 100%)',
    fontFamily: 'system-ui, sans-serif', color: '#fff',
    overflow: 'hidden', userSelect: 'none',
  } as React.CSSProperties,

  // Top bar: tabs + play button
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px 0',
    flexShrink: 0, zIndex: 10,
  } as React.CSSProperties,

  tabGroup: {
    display: 'flex', gap: '6px',
  } as React.CSSProperties,

  playBtn: {
    background: 'linear-gradient(135deg, #ff6b35, #ff1f8e)',
    border: 'none', borderRadius: '14px',
    padding: '13px 32px', fontSize: '16px',
    fontWeight: 800, color: '#fff', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(255,80,150,0.4)',
    letterSpacing: '0.5px',
    transition: 'transform 0.1s',
  } as React.CSSProperties,

  backBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px', padding: '8px 14px',
    fontSize: '13px', color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
  } as React.CSSProperties,

  // Canvas area
  canvasWrap: {
    flex: 1, minHeight: 0,
    position: 'relative',
  } as React.CSSProperties,

  // Name row over canvas
  nameOverlay: {
    position: 'absolute', top: '14px', left: 0, right: 0,
    display: 'flex', justifyContent: 'center', zIndex: 5,
    pointerEvents: 'none',
  } as React.CSSProperties,

  nameInner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    borderRadius: '100px', padding: '7px 16px',
    pointerEvents: 'all',
  } as React.CSSProperties,

  nameInput: {
    background: 'none', border: 'none', outline: 'none',
    color: '#fff', fontSize: '15px', fontWeight: 700,
    textAlign: 'center' as const, minWidth: '80px', maxWidth: '180px',
  } as React.CSSProperties,

  randBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: '16px', lineHeight: 1,
  } as React.CSSProperties,

  // Bottom item picker
  bottomPanel: {
    flexShrink: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '14px 20px 20px',
    maxHeight: '42%',
    overflowY: 'auto' as const,
  } as React.CSSProperties,

  itemGrid: {
    display: 'flex', flexWrap: 'wrap', gap: '10px',
    justifyContent: 'flex-start',
  } as React.CSSProperties,
} as const

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ tab, active, onClick }: { tab: typeof TABS[0]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '3px', padding: '10px 16px', borderRadius: '12px',
        border: 'none', cursor: 'pointer', fontSize: '11px',
        fontWeight: active ? 700 : 500,
        background: active
          ? 'linear-gradient(135deg, rgba(255,107,53,0.8), rgba(255,31,142,0.8))'
          : 'rgba(255,255,255,0.1)',
        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
        outline: active ? '2px solid rgba(255,107,53,0.6)' : '2px solid transparent',
        transition: 'all 0.15s',
        minWidth: '52px',
      }}
    >
      <span style={{ fontSize: '20px', lineHeight: 1 }}>{tab.icon}</span>
      <span style={{ letterSpacing: '0.3px' }}>{tab.label}</span>
    </button>
  )
}

// ─── Item card ────────────────────────────────────────────────────────────────
function ItemCard({
  label, active, onClick, color, emoji,
}: {
  label: string; active: boolean; onClick: () => void
  color?: string; emoji?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '6px',
        width: '90px', height: '80px',
        borderRadius: '14px', border: 'none', cursor: 'pointer',
        background: active
          ? 'linear-gradient(135deg, rgba(255,107,53,0.7), rgba(255,31,142,0.7))'
          : 'rgba(255,255,255,0.08)',
        outline: active ? '2px solid #ff6b35' : '2px solid transparent',
        transition: 'all 0.12s',
        position: 'relative',
      }}
    >
      {color && (
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: color,
          boxShadow: active ? `0 0 12px ${color}` : 'none',
        }} />
      )}
      {emoji && <span style={{ fontSize: '28px', lineHeight: 1 }}>{emoji}</span>}
      {!color && !emoji && (
        <span style={{ fontSize: '22px', lineHeight: 1, opacity: 0.6 }}>◻</span>
      )}
      <span style={{
        fontSize: '11px', fontWeight: active ? 700 : 500,
        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
        textAlign: 'center', lineHeight: 1.2, padding: '0 4px',
      }}>
        {label}
      </span>
      {active && (
        <div style={{
          position: 'absolute', top: '6px', right: '6px',
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#ffcc00',
        }} />
      )}
    </button>
  )
}

// ─── 3D Preview scene ─────────────────────────────────────────────────────────
function PreviewScene({ build }: { build: ReturnType<typeof useCharacterStore>['build'] }) {
  return (
    <>
      <color attach="background" args={['#00000000']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 8, 5]} intensity={1.6} castShadow />
      <pointLight position={[-3, 4, -3]} intensity={0.6} color="#aa66ff" />
      <pointLight position={[3, 1, 3]}  intensity={0.4} color="#ff6633" />

      {/* Platform hex */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[1.4, 1.3, 0.18, 6]} />
        <meshStandardMaterial color="#c040a0" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Platform rim glow */}
      <mesh position={[0, -0.13, 0]}>
        <cylinderGeometry args={[1.45, 1.35, 0.06, 6]} />
        <meshStandardMaterial color="#ff80d0" emissive="#ff40b0" emissiveIntensity={0.6} />
      </mesh>

      {/* Character — feet at y=0, so group at CAPSULE_HEIGHT/2 = 0.9 */}
      <group position={[0, 0.9, 0]}>
        <CharacterMesh build={build} preview />
      </group>

      {/* Floor shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]} receiveShadow>
        <circleGeometry args={[2.5, 32]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { onPlay: () => void; onBack: () => void }

export default function CharacterBuilder({ onPlay, onBack }: Props) {
  const { build, setBuild, updateField } = useCharacterStore()
  const [activeTab, setActiveTab] = useState<Tab>('presets')
  const [nameEdit, setNameEdit] = useState(build.name)

  function applyPreset(key: string) {
    const p = PRESETS[key]
    setBuild(p)
    setNameEdit(p.name)
  }

  function doRandom() {
    const rb = randomBuild()
    setBuild(rb)
    setNameEdit(rb.name)
  }

  function commitName(v: string) {
    const clean = v.trim() || randomName()
    setNameEdit(clean)
    updateField('name', clean)
  }

  // ── Item lists per tab ──────────────────────────────────────────────────
  const bodyTypes: BodyType[] = ['normal', 'blob', 'tower', 'stubby', 'bulky', 'tiny', 'bighead']
  const BODY_EMOJI: Record<BodyType, string> = {
    normal: '🧍', blob: '🫃', tower: '🏗', stubby: '🥔',
    bulky: '💪', tiny: '🐣', bighead: '🧠',
  }
  const BODY_LABEL: Record<BodyType, string> = {
    normal: 'Normal', blob: 'Blob', tower: 'Tower', stubby: 'Stubby',
    bulky: 'Bulky', tiny: 'Tiny', bighead: 'Big Brain',
  }
  const HEAD_EMOJI: Record<HeadShape, string> = { round: '🔵', square: '🟥', oval: '🥚' }
  const HAT_EMOJI:  Record<HatType,   string> = {
    none: '❌', tophat: '🎩', crown: '👑', antenna: '📡', helmet: '⛑',
  }
  const EYE_EMOJI:  Record<EyeType,   string> = {
    round: '👀', angry: '😠', wide: '😳', dot: '◉',
  }

  return (
    <div style={S.root}>
      {/* ── Top bar: tabs + controls ── */}
      <div style={S.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={S.backBtn} onClick={onBack}>← Back</button>
        </div>

        <div style={S.tabGroup}>
          {TABS.map(tab => (
            <TabBtn
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            style={{ ...S.backBtn, fontSize: '18px', padding: '8px 12px' }}
            onClick={doRandom}
            title="Randomize"
          >
            🎲
          </button>
          <button
            style={S.playBtn}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            onClick={onPlay}
          >
            PLAY! →
          </button>
        </div>
      </div>

      {/* ── 3D Canvas ── */}
      <div style={S.canvasWrap}>
        {/* Name overlay */}
        <div style={S.nameOverlay}>
          <div style={S.nameInner}>
            <input
              style={S.nameInput}
              value={nameEdit}
              onChange={e => setNameEdit(e.target.value)}
              onBlur={e => commitName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitName((e.target as HTMLInputElement).value)}
              maxLength={24}
              size={nameEdit.length || 8}
            />
            <button
              style={S.randBtn}
              onClick={() => { const n = randomName(); setNameEdit(n); updateField('name', n) }}
              title="Random name"
            >
              🎲
            </button>
          </div>
        </div>

        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 2.0, 4.5], fov: 42, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true }}
          shadows
        >
          <Suspense fallback={null}>
            <PreviewScene build={build} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Bottom item picker ── */}
      <div style={S.bottomPanel}>
        <div style={S.itemGrid}>

          {/* PRESETS */}
          {activeTab === 'presets' && Object.entries(PRESETS).map(([key, preset]) => (
            <ItemCard
              key={key}
              label={key}
              active={build.bodyType === preset.bodyType && build.palette.name === preset.palette.name && build.hat === preset.hat}
              onClick={() => applyPreset(key)}
              color={preset.palette.primary}
            />
          ))}

          {/* BODY */}
          {activeTab === 'body' && bodyTypes.map(bt => (
            <ItemCard
              key={bt}
              label={BODY_LABEL[bt]}
              active={build.bodyType === bt}
              onClick={() => updateField('bodyType', bt)}
              emoji={BODY_EMOJI[bt]}
            />
          ))}

          {/* COLORS */}
          {activeTab === 'colors' && PALETTES.map(p => (
            <div
              key={p.name}
              onClick={() => updateField('palette', p)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '5px', cursor: 'pointer',
              }}
            >
              <div style={{
                width: '58px', height: '58px', borderRadius: '14px',
                background: `linear-gradient(135deg, ${p.primary} 40%, ${p.secondary})`,
                outline: build.palette.name === p.name ? '3px solid #fff' : '3px solid transparent',
                outlineOffset: '2px', transition: 'outline 0.1s',
                boxShadow: build.palette.name === p.name ? `0 0 14px ${p.primary}` : 'none',
              }} />
              <div style={{
                fontSize: '11px',
                color: build.palette.name === p.name ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: build.palette.name === p.name ? 700 : 400,
              }}>
                {p.name}
              </div>
            </div>
          ))}

          {/* HAT */}
          {activeTab === 'hat' && (['none', 'tophat', 'crown', 'antenna', 'helmet'] as HatType[]).map(h => (
            <ItemCard
              key={h}
              label={h === 'none' ? 'None' : h === 'tophat' ? 'Top Hat' : h.charAt(0).toUpperCase() + h.slice(1)}
              active={build.hat === h}
              onClick={() => updateField('hat', h)}
              emoji={HAT_EMOJI[h]}
            />
          ))}

          {/* HEAD */}
          {activeTab === 'head' && (['round', 'square', 'oval'] as HeadShape[]).map(h => (
            <ItemCard
              key={h}
              label={h.charAt(0).toUpperCase() + h.slice(1)}
              active={build.headShape === h}
              onClick={() => updateField('headShape', h)}
              emoji={HEAD_EMOJI[h]}
            />
          ))}

          {/* EYES */}
          {activeTab === 'eyes' && (['round', 'angry', 'wide', 'dot'] as EyeType[]).map(e => (
            <ItemCard
              key={e}
              label={e.charAt(0).toUpperCase() + e.slice(1)}
              active={build.eyeType === e}
              onClick={() => updateField('eyeType', e)}
              emoji={EYE_EMOJI[e]}
            />
          ))}

        </div>
      </div>
    </div>
  )
}
