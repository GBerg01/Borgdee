import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CharacterMesh from '../game/CharacterMesh'
import {
  useCharacterStore,
  PRESETS,
  PALETTES,
  randomBuild,
  randomName,
} from '../store/characterStore'
import type {
  CharacterBuild,
  BodyType,
  HeadShape,
  HatType,
  EyeType,
  TorsoType,
  ArmType,
  LegType,
  FeetType,
  OutfitType,
  AccessoryType,
} from '../store/characterStore'

type Tab = 'presets' | 'body' | 'torso' | 'arms' | 'legs' | 'feet' | 'outfit' | 'hat' | 'accessories' | 'head' | 'eyes' | 'colors'
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'presets', icon: '⭐', label: 'Presets' },
  { id: 'body', icon: '🧍', label: 'Body' },
  { id: 'torso', icon: '🦺', label: 'Torso' },
  { id: 'arms', icon: '💪', label: 'Arms' },
  { id: 'legs', icon: '🦵', label: 'Legs' },
  { id: 'feet', icon: '👟', label: 'Feet' },
  { id: 'outfit', icon: '👕', label: 'Outfit' },
  { id: 'hat', icon: '🎩', label: 'Hat' },
  { id: 'accessories', icon: '🧿', label: 'Accessories' },
  { id: 'head', icon: '😶', label: 'Head' },
  { id: 'eyes', icon: '👁', label: 'Eyes' },
  { id: 'colors', icon: '🎨', label: 'Colors' },
]

function PreviewScene({ build }: { build: CharacterBuild }) {
  return (
    <>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        target={[0, 1.1, 0]}
        minPolarAngle={Math.PI * 0.25}
        maxPolarAngle={Math.PI * 0.6}
      />

      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 5]} intensity={1.5} castShadow />
      <pointLight position={[-3, 4, -3]} intensity={0.7} color="#aa66ff" />
      <pointLight position={[3, 1, 4]} intensity={0.5} color="#ff6633" />

      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[1.4, 1.3, 0.18, 6]} />
        <meshStandardMaterial color="#c040a0" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[1.48, 1.38, 0.06, 6]} />
        <meshStandardMaterial color="#ff80d0" emissive="#ff40b0" emissiveIntensity={0.7} />
      </mesh>

      <group position={[0, 0.9, 0]}>
        <CharacterMesh build={build} preview />
      </group>
    </>
  )
}

function TabBtn({ tab, active, onClick }: { tab: typeof TABS[0]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '3px', padding: '9px 12px', borderRadius: '12px',
      border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: active ? 700 : 500,
      background: active
        ? 'linear-gradient(135deg,rgba(255,107,53,.85),rgba(255,31,142,.85))'
        : 'rgba(255,255,255,0.1)',
      color: active ? '#fff' : 'rgba(255,255,255,.6)',
      outline: active ? '2px solid rgba(255,107,53,.7)' : '2px solid transparent',
      transition: 'all .15s', minWidth: '50px',
    }}>
      <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  )
}

function ItemCard({ label, active, onClick, color, emoji }: {
  label: string; active: boolean; onClick: () => void; color?: string; emoji?: string
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '6px', width: '88px', height: '78px', borderRadius: '14px',
      border: 'none', cursor: 'pointer',
      background: active
        ? 'linear-gradient(135deg,rgba(255,107,53,.7),rgba(255,31,142,.7))'
        : 'rgba(255,255,255,.09)',
      outline: active ? '2px solid #ff6b35' : '2px solid transparent', transition: 'all .12s', position: 'relative',
    }}>
      {color && (
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%', background: color,
          boxShadow: active ? `0 0 12px ${color}` : 'none',
        }} />
      )}
      {emoji && <span style={{ fontSize: '26px', lineHeight: 1 }}>{emoji}</span>}
      <span style={{
        fontSize: '11px', fontWeight: active ? 700 : 500,
        color: active ? '#fff' : 'rgba(255,255,255,.65)', textAlign: 'center', lineHeight: 1.2, padding: '0 4px',
      }}>{label}</span>
      {active && (
        <div style={{
          position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px',
          borderRadius: '50%', background: '#ffcc00',
        }} />
      )}
    </button>
  )
}

interface Props { onPlay: () => void; onBack: () => void }

export default function CharacterBuilder({ onPlay, onBack }: Props) {
  const { build, setBuild, updateField } = useCharacterStore()
  const [activeTab, setActiveTab] = useState<Tab>('presets')
  const [nameEdit, setNameEdit] = useState(build.name)

  const wrapRef = useRef<HTMLDivElement>(null)
  const [canvasH, setCanvasH] = useState(0)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([e]) => setCanvasH(e.contentRect.height))
    ro.observe(wrapRef.current)
    setCanvasH(wrapRef.current.clientHeight)
    return () => ro.disconnect()
  }, [])

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

  const bodyTypes: BodyType[] = ['normal', 'blob', 'tower', 'stubby', 'bulky', 'tiny', 'bighead']
  const torsoTypes: TorsoType[] = ['classic', 'barrel', 'wedge', 'pear']
  const armTypes: ArmType[] = ['noodle', 'mitt', 'chunky', 'robot']
  const legTypes: LegType[] = ['tube', 'stomp', 'spring', 'peg']
  const feetTypes: FeetType[] = ['sneakers', 'boots', 'flippers', 'hooves']
  const outfitTypes: OutfitType[] = ['none', 'wrestler', 'plumber', 'alien', 'frog', 'mascot']
  const accessoryTypes: AccessoryType[] = ['none', 'cape', 'fanny', 'floaty', 'spikes', 'bowtie']

  const BODY_EMOJI: Record<BodyType, string> = { normal: '🧍', blob: '🫃', tower: '🏗', stubby: '🥔', bulky: '💪', tiny: '🐣', bighead: '🧠' }
  const BODY_LABEL: Record<BodyType, string> = { normal: 'Normal', blob: 'Blob', tower: 'Tower', stubby: 'Stubby', bulky: 'Bulky', tiny: 'Tiny', bighead: 'Big Brain' }
  const TORSO_EMOJI: Record<TorsoType, string> = { classic: '🧸', barrel: '🛢', wedge: '🔻', pear: '🍐' }
  const ARM_EMOJI: Record<ArmType, string> = { noodle: '🪱', mitt: '🥊', chunky: '💪', robot: '🤖' }
  const LEG_EMOJI: Record<LegType, string> = { tube: '🧵', stomp: '🪵', spring: '🌀', peg: '🪛' }
  const FEET_EMOJI: Record<FeetType, string> = { sneakers: '👟', boots: '🥾', flippers: '🐟', hooves: '🐐' }
  const OUTFIT_EMOJI: Record<OutfitType, string> = { none: '🚫', wrestler: '🤼', plumber: '🪠', alien: '👽', frog: '🐸', mascot: '🎪' }
  const ACC_EMOJI: Record<AccessoryType, string> = { none: '❌', cape: '🦸', fanny: '🎒', floaty: '🛟', spikes: '📌', bowtie: '🎀' }
  const HEAD_EMOJI: Record<HeadShape, string> = { round: '🔵', square: '🟥', oval: '🥚' }
  const HAT_EMOJI: Record<HatType, string> = { none: '❌', tophat: '🎩', crown: '👑', antenna: '📡', helmet: '⛑' }
  const EYE_EMOJI: Record<EyeType, string> = { round: '👀', angry: '😠', wide: '😳', dot: '◉' }

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg,#2d1b69 0%,#11003a 40%,#001a3a 100%)',
      fontFamily: 'system-ui,sans-serif', color: '#fff', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px 10px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.07)',
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
          borderRadius: '10px', padding: '8px 14px', fontSize: '13px',
          color: 'rgba(255,255,255,.7)', cursor: 'pointer',
        }}>← Back</button>

        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '65vw', paddingBottom: '3px' }}>
          {TABS.map(tab => (
            <TabBtn key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={doRandom} title="Randomize" style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
            borderRadius: '10px', padding: '8px 12px', fontSize: '18px', cursor: 'pointer',
          }}>🎲</button>
          <button onClick={onPlay} style={{
            background: 'linear-gradient(135deg,#ff6b35,#ff1f8e)',
            border: 'none', borderRadius: '14px', padding: '12px 30px',
            fontSize: '16px', fontWeight: 800, color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255,80,150,.4)', letterSpacing: '.5px',
          }}>PLAY! →</button>
        </div>
      </div>

      <div ref={wrapRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div style={{
          position: 'absolute', top: '14px', left: 0, right: 0,
          display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(8px)', borderRadius: '100px', padding: '7px 16px', pointerEvents: 'all',
          }}>
            <input
              value={nameEdit}
              onChange={e => setNameEdit(e.target.value)}
              onBlur={e => commitName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && commitName((e.target as HTMLInputElement).value)}
              maxLength={24}
              style={{
                background: 'none', border: 'none', outline: 'none',
                color: '#fff', fontSize: '15px', fontWeight: 700, textAlign: 'center',
                width: `${Math.max(nameEdit.length, 8)}ch`,
              }}
            />
            <button onClick={() => { const n = randomName(); setNameEdit(n); updateField('name', n) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>🎲</button>
          </div>
        </div>

        {canvasH > 0 && (
          <Canvas
            style={{ width: '100%', height: `${canvasH}px`, display: 'block' }}
            camera={{ position: [0, 1.8, 4.2], fov: 42, near: 0.1, far: 100 }}
            gl={{ antialias: true }}
            shadows
          >
            <Suspense fallback={null}>
              <PreviewScene build={build} />
            </Suspense>
          </Canvas>
        )}

        {canvasH === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,.3)', fontSize: '14px',
          }}>Loading preview…</div>
        )}
      </div>

      <div style={{
        flexShrink: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(14px)',
        borderTop: '1px solid rgba(255,255,255,.08)', padding: '14px 20px 20px', maxHeight: '38%', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {activeTab === 'presets' && Object.entries(PRESETS).map(([key, preset]) => (
            <ItemCard key={key} label={key}
              active={build.name === preset.name}
              onClick={() => applyPreset(key)} color={preset.palette.primary} />
          ))}

          {activeTab === 'body' && bodyTypes.map(bt => (
            <ItemCard key={bt} label={BODY_LABEL[bt]} active={build.bodyType === bt}
              onClick={() => updateField('bodyType', bt)} emoji={BODY_EMOJI[bt]} />
          ))}

          {activeTab === 'torso' && torsoTypes.map(tt => (
            <ItemCard key={tt} label={tt.charAt(0).toUpperCase() + tt.slice(1)} active={build.torso === tt}
              onClick={() => updateField('torso', tt)} emoji={TORSO_EMOJI[tt]} />
          ))}

          {activeTab === 'arms' && armTypes.map(at => (
            <ItemCard key={at} label={at.charAt(0).toUpperCase() + at.slice(1)} active={build.arms === at}
              onClick={() => updateField('arms', at)} emoji={ARM_EMOJI[at]} />
          ))}

          {activeTab === 'legs' && legTypes.map(lt => (
            <ItemCard key={lt} label={lt.charAt(0).toUpperCase() + lt.slice(1)} active={build.legs === lt}
              onClick={() => updateField('legs', lt)} emoji={LEG_EMOJI[lt]} />
          ))}

          {activeTab === 'feet' && feetTypes.map(ft => (
            <ItemCard key={ft} label={ft.charAt(0).toUpperCase() + ft.slice(1)} active={build.feet === ft}
              onClick={() => updateField('feet', ft)} emoji={FEET_EMOJI[ft]} />
          ))}

          {activeTab === 'outfit' && outfitTypes.map(of => (
            <ItemCard key={of} label={of.charAt(0).toUpperCase() + of.slice(1)} active={build.outfit === of}
              onClick={() => updateField('outfit', of)} emoji={OUTFIT_EMOJI[of]} />
          ))}

          {activeTab === 'hat' && (['none', 'tophat', 'crown', 'antenna', 'helmet'] as HatType[]).map(h => (
            <ItemCard key={h} label={h === 'tophat' ? 'Top Hat' : h.charAt(0).toUpperCase() + h.slice(1)}
              active={build.hat === h} onClick={() => updateField('hat', h)} emoji={HAT_EMOJI[h]} />
          ))}

          {activeTab === 'accessories' && accessoryTypes.map(ac => (
            <ItemCard key={ac} label={ac.charAt(0).toUpperCase() + ac.slice(1)} active={build.accessory === ac}
              onClick={() => updateField('accessory', ac)} emoji={ACC_EMOJI[ac]} />
          ))}

          {activeTab === 'head' && (['round', 'square', 'oval'] as HeadShape[]).map(h => (
            <ItemCard key={h} label={h.charAt(0).toUpperCase() + h.slice(1)}
              active={build.headShape === h} onClick={() => updateField('headShape', h)} emoji={HEAD_EMOJI[h]} />
          ))}

          {activeTab === 'eyes' && (['round', 'angry', 'wide', 'dot'] as EyeType[]).map(e => (
            <ItemCard key={e} label={e.charAt(0).toUpperCase() + e.slice(1)}
              active={build.eyeType === e} onClick={() => updateField('eyeType', e)} emoji={EYE_EMOJI[e]} />
          ))}

          {activeTab === 'colors' && PALETTES.map(p => (
            <div key={p.name} onClick={() => updateField('palette', p)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '14px',
                background: `linear-gradient(135deg,${p.primary} 40%,${p.secondary})`,
                outline: build.palette.name === p.name ? '3px solid #fff' : '3px solid transparent',
                outlineOffset: '2px', transition: 'all .1s',
                boxShadow: build.palette.name === p.name ? `0 0 16px ${p.primary}88` : 'none',
              }} />
              <span style={{
                fontSize: '11px', fontWeight: build.palette.name === p.name ? 700 : 400,
                color: build.palette.name === p.name ? '#fff' : 'rgba(255,255,255,.5)',
              }}>{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
