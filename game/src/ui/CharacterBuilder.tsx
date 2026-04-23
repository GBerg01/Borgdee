import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import CharacterMesh from '../game/CharacterMesh'
import {
  useCharacterStore,
  PRESETS, PALETTES, BODY_SCALES,
  randomBuild, randomName,
} from '../store/characterStore'
import type { BodyType, HeadShape, HatType, EyeType } from '../store/characterStore'

type Tab = 'presets' | 'body' | 'colors' | 'hat' | 'head' | 'eyes'
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'presets', icon: '⭐', label: 'Presets' },
  { id: 'body',    icon: '🫃', label: 'Body'    },
  { id: 'colors',  icon: '🎨', label: 'Colors'  },
  { id: 'hat',     icon: '🎩', label: 'Hat'      },
  { id: 'head',    icon: '😶', label: 'Head'     },
  { id: 'eyes',    icon: '👁',  label: 'Eyes'     },
]

// ─── 3D Preview ───────────────────────────────────────────────────────────────
function PreviewScene({ build }: { build: ReturnType<typeof useCharacterStore>['build'] }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 5]} intensity={1.5} castShadow />
      <pointLight position={[-3, 4, -3]} intensity={0.7} color="#aa66ff" />
      <pointLight position={[3, 1, 4]}   intensity={0.5} color="#ff6633" />

      {/* Hex platform */}
      <mesh position={[0, -0.07, 0]}>
        <cylinderGeometry args={[1.4, 1.3, 0.18, 6]} />
        <meshStandardMaterial color="#c040a0" metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[1.48, 1.38, 0.06, 6]} />
        <meshStandardMaterial color="#ff80d0" emissive="#ff40b0" emissiveIntensity={0.7} />
      </mesh>

      {/* Character: feet at y=0, so offset by CAPSULE_HEIGHT/2 = 0.9 */}
      <group position={[0, 0.9, 0]}>
        <CharacterMesh build={build} preview />
      </group>
    </>
  )
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ tab, active, onClick }: { tab: typeof TABS[0]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '3px', padding: '9px 14px', borderRadius: '12px',
      border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: active ? 700 : 500,
      background: active
        ? 'linear-gradient(135deg,rgba(255,107,53,.85),rgba(255,31,142,.85))'
        : 'rgba(255,255,255,0.1)',
      color: active ? '#fff' : 'rgba(255,255,255,.6)',
      outline: active ? '2px solid rgba(255,107,53,.7)' : '2px solid transparent',
      transition: 'all .15s', minWidth: '50px',
    }}>
      <span style={{ fontSize: '19px', lineHeight: 1 }}>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  )
}

// ─── Item card ────────────────────────────────────────────────────────────────
function ItemCard({ label, active, onClick, color, emoji }: {
  label: string; active: boolean; onClick: () => void; color?: string; emoji?: string
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '6px',
      width: '88px', height: '78px', borderRadius: '14px',
      border: 'none', cursor: 'pointer',
      background: active
        ? 'linear-gradient(135deg,rgba(255,107,53,.7),rgba(255,31,142,.7))'
        : 'rgba(255,255,255,.09)',
      outline: active ? '2px solid #ff6b35' : '2px solid transparent',
      transition: 'all .12s', position: 'relative',
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
        color: active ? '#fff' : 'rgba(255,255,255,.65)',
        textAlign: 'center', lineHeight: 1.2, padding: '0 4px',
      }}>{label}</span>
      {active && (
        <div style={{
          position: 'absolute', top: '6px', right: '6px',
          width: '8px', height: '8px', borderRadius: '50%', background: '#ffcc00',
        }} />
      )}
    </button>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface Props { onPlay: () => void; onBack: () => void }

export default function CharacterBuilder({ onPlay, onBack }: Props) {
  const { build, setBuild, updateField } = useCharacterStore()
  const [activeTab, setActiveTab] = useState<Tab>('presets')
  const [nameEdit,  setNameEdit]  = useState(build.name)

  // Measure canvas wrap so we give the Canvas explicit pixel height
  const wrapRef     = useRef<HTMLDivElement>(null)
  const [canvasH, setCanvasH] = useState(0)
  useEffect(() => {
    if (!wrapRef.current) return
    const ro = new ResizeObserver(([e]) => setCanvasH(e.contentRect.height))
    ro.observe(wrapRef.current)
    setCanvasH(wrapRef.current.clientHeight)
    return () => ro.disconnect()
  }, [])

  function applyPreset(key: string) {
    const p = PRESETS[key]; setBuild(p); setNameEdit(p.name)
  }
  function doRandom() {
    const rb = randomBuild(); setBuild(rb); setNameEdit(rb.name)
  }
  function commitName(v: string) {
    const clean = v.trim() || randomName()
    setNameEdit(clean); updateField('name', clean)
  }

  const bodyTypes: BodyType[]  = ['normal','blob','tower','stubby','bulky','tiny','bighead']
  const BODY_EMOJI: Record<BodyType,   string> = { normal:'🧍', blob:'🫃', tower:'🏗', stubby:'🥔', bulky:'💪', tiny:'🐣', bighead:'🧠' }
  const BODY_LABEL: Record<BodyType,   string> = { normal:'Normal', blob:'Blob', tower:'Tower', stubby:'Stubby', bulky:'Bulky', tiny:'Tiny', bighead:'Big Brain' }
  const HEAD_EMOJI: Record<HeadShape,  string> = { round:'🔵', square:'🟥', oval:'🥚' }
  const HAT_EMOJI:  Record<HatType,    string> = { none:'❌', tophat:'🎩', crown:'👑', antenna:'📡', helmet:'⛑' }
  const EYE_EMOJI:  Record<EyeType,    string> = { round:'👀', angry:'😠', wide:'😳', dot:'◉' }

  return (
    <div style={{
      width:'100%', height:'100%',
      display:'flex', flexDirection:'column',
      background:'linear-gradient(160deg,#2d1b69 0%,#11003a 40%,#001a3a 100%)',
      fontFamily:'system-ui,sans-serif', color:'#fff', overflow:'hidden',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 20px 10px', flexShrink:0,
        borderBottom:'1px solid rgba(255,255,255,.07)',
      }}>
        <button onClick={onBack} style={{
          background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)',
          borderRadius:'10px', padding:'8px 14px', fontSize:'13px',
          color:'rgba(255,255,255,.7)', cursor:'pointer',
        }}>← Back</button>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'6px' }}>
          {TABS.map(tab => (
            <TabBtn key={tab.id} tab={tab} active={activeTab===tab.id} onClick={() => setActiveTab(tab.id)} />
          ))}
        </div>

        <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
          <button onClick={doRandom} title="Randomize" style={{
            background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)',
            borderRadius:'10px', padding:'8px 12px', fontSize:'18px', cursor:'pointer',
          }}>🎲</button>
          <button onClick={onPlay} style={{
            background:'linear-gradient(135deg,#ff6b35,#ff1f8e)',
            border:'none', borderRadius:'14px', padding:'12px 30px',
            fontSize:'16px', fontWeight:800, color:'#fff', cursor:'pointer',
            boxShadow:'0 4px 20px rgba(255,80,150,.4)', letterSpacing:'.5px',
          }}>PLAY! →</button>
        </div>
      </div>

      {/* ── Canvas area — uses flex:1, and we measure it so Canvas gets a real px height ── */}
      <div ref={wrapRef} style={{ flex:1, position:'relative', minHeight:0 }}>

        {/* Name badge overlay */}
        <div style={{
          position:'absolute', top:'14px', left:0, right:0,
          display:'flex', justifyContent:'center', zIndex:10, pointerEvents:'none',
        }}>
          <div style={{
            display:'flex', alignItems:'center', gap:'8px',
            background:'rgba(0,0,0,.5)', backdropFilter:'blur(8px)',
            borderRadius:'100px', padding:'7px 16px', pointerEvents:'all',
          }}>
            <input
              value={nameEdit}
              onChange={e => setNameEdit(e.target.value)}
              onBlur={e  => commitName(e.target.value)}
              onKeyDown={e => e.key==='Enter' && commitName((e.target as HTMLInputElement).value)}
              maxLength={24}
              style={{
                background:'none', border:'none', outline:'none',
                color:'#fff', fontSize:'15px', fontWeight:700,
                textAlign:'center', width:`${Math.max(nameEdit.length,8)}ch`,
              }}
            />
            <button onClick={() => { const n=randomName(); setNameEdit(n); updateField('name',n) }}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:'16px' }}>🎲</button>
          </div>
        </div>

        {/* The Canvas — give it an explicit pixel height once we've measured the wrapper */}
        {canvasH > 0 && (
          <Canvas
            style={{ width:'100%', height:`${canvasH}px`, display:'block' }}
            camera={{ position:[0, 2.2, 4.8], fov:40, near:0.1, far:100 }}
            gl={{ antialias:true }}
            shadows
          >
            <Suspense fallback={null}>
              <PreviewScene build={build} />
            </Suspense>
          </Canvas>
        )}

        {/* Loading placeholder while canvasH is 0 */}
        {canvasH === 0 && (
          <div style={{
            position:'absolute', inset:0, display:'flex',
            alignItems:'center', justifyContent:'center',
            color:'rgba(255,255,255,.3)', fontSize:'14px',
          }}>Loading preview…</div>
        )}
      </div>

      {/* ── Bottom item picker ── */}
      <div style={{
        flexShrink:0,
        background:'rgba(0,0,0,.55)', backdropFilter:'blur(14px)',
        borderTop:'1px solid rgba(255,255,255,.08)',
        padding:'14px 20px 20px', maxHeight:'38%', overflowY:'auto',
      }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>

          {activeTab==='presets' && Object.entries(PRESETS).map(([key,preset]) => (
            <ItemCard key={key} label={key}
              active={build.bodyType===preset.bodyType && build.palette.name===preset.palette.name && build.hat===preset.hat}
              onClick={() => applyPreset(key)} color={preset.palette.primary} />
          ))}

          {activeTab==='body' && bodyTypes.map(bt => (
            <ItemCard key={bt} label={BODY_LABEL[bt]} active={build.bodyType===bt}
              onClick={() => updateField('bodyType',bt)} emoji={BODY_EMOJI[bt]} />
          ))}

          {activeTab==='colors' && PALETTES.map(p => (
            <div key={p.name} onClick={() => updateField('palette',p)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px', cursor:'pointer' }}>
              <div style={{
                width:'58px', height:'58px', borderRadius:'14px',
                background:`linear-gradient(135deg,${p.primary} 40%,${p.secondary})`,
                outline: build.palette.name===p.name ? '3px solid #fff' : '3px solid transparent',
                outlineOffset:'2px', transition:'all .1s',
                boxShadow: build.palette.name===p.name ? `0 0 16px ${p.primary}88` : 'none',
              }} />
              <span style={{
                fontSize:'11px', fontWeight: build.palette.name===p.name ? 700 : 400,
                color: build.palette.name===p.name ? '#fff' : 'rgba(255,255,255,.5)',
              }}>{p.name}</span>
            </div>
          ))}

          {activeTab==='hat' && (['none','tophat','crown','antenna','helmet'] as HatType[]).map(h => (
            <ItemCard key={h} label={h==='tophat'?'Top Hat':h.charAt(0).toUpperCase()+h.slice(1)}
              active={build.hat===h} onClick={() => updateField('hat',h)} emoji={HAT_EMOJI[h]} />
          ))}

          {activeTab==='head' && (['round','square','oval'] as HeadShape[]).map(h => (
            <ItemCard key={h} label={h.charAt(0).toUpperCase()+h.slice(1)}
              active={build.headShape===h} onClick={() => updateField('headShape',h)} emoji={HEAD_EMOJI[h]} />
          ))}

          {activeTab==='eyes' && (['round','angry','wide','dot'] as EyeType[]).map(e => (
            <ItemCard key={e} label={e.charAt(0).toUpperCase()+e.slice(1)}
              active={build.eyeType===e} onClick={() => updateField('eyeType',e)} emoji={EYE_EMOJI[e]} />
          ))}

        </div>
      </div>
    </div>
  )
}
