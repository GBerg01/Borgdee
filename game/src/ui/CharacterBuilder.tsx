import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import CharacterMesh from '../game/CharacterMesh'
import {
  useCharacterStore,
  PRESETS, PALETTES, BODY_SCALES,
  randomBuild, randomName,
} from '../store/characterStore'
import type { BodyType, HeadShape, HatType, EyeType } from '../store/characterStore'

// ─── Styles ───────────────────────────────────────────────────────────────────
const root: React.CSSProperties = {
  width: '100%', height: '100%',
  display: 'flex', flexDirection: 'column',
  background: 'radial-gradient(ellipse at 30% 20%, #1a0830 0%, #0a0a0f 60%)',
  color: '#fff', fontFamily: 'system-ui, sans-serif',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)',
  flexShrink: 0,
}

const body: React.CSSProperties = {
  display: 'flex', flex: 1, minHeight: 0,
}

const previewPane: React.CSSProperties = {
  width: '340px', flexShrink: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  borderRight: '1px solid rgba(255,255,255,0.07)',
  padding: '16px',
  gap: '12px',
}

const controlsPane: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '20px 28px',
  display: 'flex', flexDirection: 'column', gap: '20px',
}

const section: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '10px',
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
  color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
}

const chipRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '8px',
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
    fontWeight: active ? 700 : 500, cursor: 'pointer', border: 'none',
    background: active ? 'rgba(255,107,53,0.85)' : 'rgba(255,255,255,0.08)',
    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
    outline: active ? '2px solid #ff6b35' : '2px solid transparent',
    transition: 'all 0.12s',
  }
}

function swatchStyle(color: string, active: boolean): React.CSSProperties {
  return {
    width: '36px', height: '36px', borderRadius: '50%',
    background: color, cursor: 'pointer', border: 'none',
    outline: active ? '3px solid #fff' : '3px solid transparent',
    outlineOffset: '2px', transition: 'outline 0.1s',
  }
}

const nameRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '10px',
}

const nameInput: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px', padding: '8px 12px', color: '#fff',
  fontSize: '15px', fontWeight: 600, flex: 1, outline: 'none',
}

const playBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, #ff6b35, #ff3399)',
  border: 'none', borderRadius: '14px', padding: '14px 0',
  fontSize: '17px', fontWeight: 800, color: '#fff', cursor: 'pointer',
  width: '100%', letterSpacing: '0.5px', flexShrink: 0,
}

const randBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px', padding: '6px 12px', color: 'rgba(255,255,255,0.7)',
  fontSize: '13px', cursor: 'pointer',
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { onPlay: () => void; onBack: () => void }

export default function CharacterBuilder({ onPlay, onBack }: Props) {
  const { build, setBuild, updateField } = useCharacterStore()
  const [nameEdit, setNameEdit] = useState(build.name)

  function applyPreset(key: string) {
    const p = PRESETS[key]
    setBuild(p)
    setNameEdit(p.name)
  }

  function doRandomize() {
    const rb = randomBuild()
    setBuild(rb)
    setNameEdit(rb.name)
  }

  function commitName() {
    updateField('name', nameEdit || randomName())
  }

  const BODY_LABELS: Record<BodyType, string> = {
    normal: 'Normal', blob: 'Blob 🫃', tower: 'Tower 🏗',
    stubby: 'Stubby', bulky: 'Bulky 💪', tiny: 'Tiny 🐣', bighead: 'Big Brain 🧠',
  }
  const HEAD_LABELS: Record<HeadShape, string> = { round: 'Round', square: 'Square', oval: 'Oval' }
  const HAT_LABELS: Record<HatType, string> = {
    none: 'None', tophat: 'Top Hat 🎩', crown: 'Crown 👑', antenna: 'Antenna 📡', helmet: 'Helmet ⛑',
  }
  const EYE_LABELS: Record<EyeType, string> = {
    round: 'Round', angry: 'Angry 😠', wide: 'Wide 👀', dot: 'Dot •',
  }

  return (
    <div style={root}>
      {/* Header */}
      <div style={header}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}>
          ← Back
        </button>
        <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
          Character Builder
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={body}>
        {/* ── Left: 3D Preview ── */}
        <div style={previewPane}>
          <div style={{ width: '100%', height: '260px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
            <Canvas camera={{ position: [0, 2.2, 5.5], fov: 38 }} gl={{ antialias: true }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[5, 8, 5]} intensity={1.4} />
              <pointLight position={[-4, 3, -4]} intensity={0.5} color="#8866ff" />
              <Suspense fallback={null}>
                <group position={[0, -0.9, 0]}>
                  <CharacterMesh build={build} preview />
                </group>
              </Suspense>
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0} target={[0, 0.9, 0]} />
            </Canvas>
          </div>

          {/* Name */}
          <div style={{ width: '100%' }}>
            <div style={{ ...label, marginBottom: '6px' }}>Name</div>
            <div style={nameRow}>
              <input
                style={nameInput}
                value={nameEdit}
                onChange={e => setNameEdit(e.target.value)}
                onBlur={commitName}
                onKeyDown={e => e.key === 'Enter' && commitName()}
                maxLength={24}
              />
              <button style={randBtn} onClick={() => { const n = randomName(); setNameEdit(n); updateField('name', n) }}>
                🎲
              </button>
            </div>
          </div>

          {/* Colour preview bar */}
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {[build.palette.primary, build.palette.secondary, build.palette.accent].map((c, i) => (
              <div key={i} style={{ flex: 1, height: '8px', borderRadius: '4px', background: c }} />
            ))}
          </div>

          <button style={playBtn} onClick={onPlay}>Play! →</button>
        </div>

        {/* ── Right: Controls ── */}
        <div style={controlsPane}>

          {/* Presets */}
          <div style={section}>
            <div style={label}>Quick Presets</div>
            <div style={chipRow}>
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  style={chip(build.name === PRESETS[key].name && build.bodyType === PRESETS[key].bodyType)}
                  onClick={() => applyPreset(key)}
                >
                  {key}
                </button>
              ))}
              <button style={{ ...chip(false), background: 'rgba(255,200,50,0.15)', color: '#ffcc00' }} onClick={doRandomize}>
                🎲 Randomize
              </button>
            </div>
          </div>

          <Divider />

          {/* Body Type */}
          <div style={section}>
            <div style={label}>Body Type</div>
            <div style={chipRow}>
              {(Object.keys(BODY_SCALES) as BodyType[]).map((bt) => (
                <button key={bt} style={chip(build.bodyType === bt)} onClick={() => updateField('bodyType', bt)}>
                  {BODY_LABELS[bt]}
                </button>
              ))}
            </div>
          </div>

          {/* Colour Palette */}
          <div style={section}>
            <div style={label}>Color Palette</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              {PALETTES.map((p) => (
                <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <button
                    style={swatchStyle(p.primary, build.palette.name === p.name)}
                    onClick={() => updateField('palette', p)}
                    title={p.name}
                  />
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.secondary }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.accent }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          {/* Head Shape */}
          <div style={section}>
            <div style={label}>Head Shape</div>
            <div style={chipRow}>
              {(['round', 'square', 'oval'] as HeadShape[]).map((h) => (
                <button key={h} style={chip(build.headShape === h)} onClick={() => updateField('headShape', h)}>
                  {HEAD_LABELS[h]}
                </button>
              ))}
            </div>
          </div>

          {/* Eyes */}
          <div style={section}>
            <div style={label}>Eyes</div>
            <div style={chipRow}>
              {(['round', 'angry', 'wide', 'dot'] as EyeType[]).map((e) => (
                <button key={e} style={chip(build.eyeType === e)} onClick={() => updateField('eyeType', e)}>
                  {EYE_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          {/* Hat */}
          <div style={section}>
            <div style={label}>Hat</div>
            <div style={chipRow}>
              {(['none', 'tophat', 'crown', 'antenna', 'helmet'] as HatType[]).map((h) => (
                <button key={h} style={chip(build.hat === h)} onClick={() => updateField('hat', h)}>
                  {HAT_LABELS[h]}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '2px 0' }} />
}
