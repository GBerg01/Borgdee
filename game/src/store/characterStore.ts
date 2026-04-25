import { create } from 'zustand'

export type BodyType  = 'normal' | 'blob' | 'tower' | 'stubby' | 'bulky' | 'tiny' | 'bighead'
export type HeadShape = 'round' | 'square' | 'oval'
export type HatType   = 'none' | 'tophat' | 'crown' | 'antenna' | 'helmet'
export type EyeType   = 'round' | 'angry' | 'wide' | 'dot'
export type TorsoType = 'classic' | 'barrel' | 'wedge' | 'pear'
export type ArmType   = 'noodle' | 'mitt' | 'chunky' | 'robot'
export type LegType   = 'tube' | 'stomp' | 'spring' | 'peg'
export type FeetType  = 'sneakers' | 'boots' | 'flippers' | 'hooves'
export type OutfitType = 'none' | 'wrestler' | 'plumber' | 'alien' | 'frog' | 'mascot'
export type AccessoryType = 'none' | 'cape' | 'fanny' | 'floaty' | 'spikes' | 'bowtie'

export interface ColorPalette {
  name: string
  primary: string   // body
  secondary: string // head
  accent: string    // hat / accessories
}

export interface CharacterBuild {
  name: string
  bodyType: BodyType
  torso: TorsoType
  arms: ArmType
  legs: LegType
  feet: FeetType
  outfit: OutfitType
  headShape: HeadShape
  hat: HatType
  accessory: AccessoryType
  eyeType: EyeType
  palette: ColorPalette
}

// ─── Visual scale for each body type ─────────────────────────────────────────
// ONLY affects the rendered mesh. Physics capsule never changes.
export const BODY_SCALES: Record<BodyType, {
  body: [number, number, number]
  head: [number, number, number]
}> = {
  normal:  { body: [1.00, 1.00, 1.00], head: [1.00, 1.00, 1.00] },
  blob:    { body: [1.60, 0.82, 1.60], head: [1.30, 1.00, 1.30] },
  tower:   { body: [0.68, 1.50, 0.68], head: [0.72, 0.72, 0.72] },
  stubby:  { body: [1.30, 0.62, 1.30], head: [1.15, 1.15, 1.15] },
  bulky:   { body: [1.40, 1.12, 1.30], head: [1.05, 1.05, 1.05] },
  tiny:    { body: [0.60, 0.60, 0.60], head: [0.60, 0.60, 0.60] },
  bighead: { body: [0.88, 0.95, 0.88], head: [2.00, 2.00, 2.00] },
}

// ─── Colour palettes ──────────────────────────────────────────────────────────
export const PALETTES: ColorPalette[] = [
  { name: 'Tangerine', primary: '#ff6b35', secondary: '#ffcc00', accent: '#ff3333' },
  { name: 'Ocean',     primary: '#2196f3', secondary: '#00bcd4', accent: '#ffffff' },
  { name: 'Forest',    primary: '#4caf50', secondary: '#8bc34a', accent: '#ffeb3b' },
  { name: 'Royal',     primary: '#9c27b0', secondary: '#e040fb', accent: '#ff9800' },
  { name: 'Cherry',    primary: '#e91e63', secondary: '#f06292', accent: '#ffffff' },
  { name: 'Midnight',  primary: '#283593', secondary: '#1565c0', accent: '#e94560' },
  { name: 'Lime',      primary: '#c6ef39', secondary: '#76c442', accent: '#ff5722' },
  { name: 'Peach',     primary: '#ff8a65', secondary: '#ffb74d', accent: '#f06292' },
]

// ─── Preset archetypes ────────────────────────────────────────────────────────
export const PRESETS: Record<string, CharacterBuild> = {
  'The Blob': {
    name: 'The Blob',
    torso: 'pear', arms: 'chunky', legs: 'stomp', feet: 'flippers', outfit: 'frog',
    bodyType: 'blob', headShape: 'round', hat: 'none',
    accessory: 'floaty', eyeType: 'wide', palette: PALETTES[0],
  },
  'The Tower': {
    name: 'The Tower',
    torso: 'wedge', arms: 'robot', legs: 'tube', feet: 'boots', outfit: 'none',
    bodyType: 'tower', headShape: 'oval', hat: 'antenna',
    accessory: 'cape', eyeType: 'dot', palette: PALETTES[1],
  },
  'The Tank': {
    name: 'The Tank',
    torso: 'barrel', arms: 'chunky', legs: 'stomp', feet: 'boots', outfit: 'wrestler',
    bodyType: 'bulky', headShape: 'square', hat: 'helmet',
    accessory: 'spikes', eyeType: 'angry', palette: PALETTES[5],
  },
  'The Spud': {
    name: 'The Spud',
    torso: 'pear', arms: 'mitt', legs: 'peg', feet: 'hooves', outfit: 'none',
    bodyType: 'stubby', headShape: 'round', hat: 'none',
    accessory: 'none', eyeType: 'wide', palette: PALETTES[7],
  },
  'Big Brain': {
    name: 'Big Brain',
    torso: 'classic', arms: 'noodle', legs: 'spring', feet: 'sneakers', outfit: 'alien',
    bodyType: 'bighead', headShape: 'round', hat: 'tophat',
    accessory: 'bowtie', eyeType: 'round', palette: PALETTES[6],
  },
  'The Fancy': {
    name: 'The Fancy',
    torso: 'classic', arms: 'mitt', legs: 'tube', feet: 'sneakers', outfit: 'mascot',
    bodyType: 'normal', headShape: 'oval', hat: 'tophat',
    accessory: 'bowtie', eyeType: 'round', palette: PALETTES[3],
  },
  'The Tiny': {
    name: 'The Tiny',
    torso: 'wedge', arms: 'noodle', legs: 'spring', feet: 'flippers', outfit: 'frog',
    bodyType: 'tiny', headShape: 'round', hat: 'crown',
    accessory: 'fanny', eyeType: 'wide', palette: PALETTES[4],
  },
  'The Bot': {
    name: 'The Bot',
    torso: 'barrel', arms: 'robot', legs: 'tube', feet: 'boots', outfit: 'alien',
    bodyType: 'bulky', headShape: 'square', hat: 'antenna',
    accessory: 'spikes', eyeType: 'angry', palette: PALETTES[1],
  },
}

// ─── Funny name generator ─────────────────────────────────────────────────────
const ADJ = ['Lumpy','Grumpy','Wobbly','Angry','Chunky','Sneaky','Dizzy','Fluffy','Soggy','Bouncy','Wiggly','Plump']
const NOU  = ['Dumpling','Professor','Blob','Potato','Goblin','Noodle','Muffin','Pancake','Nugget','Donut','Pickle','Gremlin']

export function randomName() {
  return `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOU[Math.floor(Math.random() * NOU.length)]}`
}

export function randomBuild(): CharacterBuild {
  const bodyTypes: BodyType[]  = ['normal','blob','tower','stubby','bulky','tiny','bighead']
  const torsos: TorsoType[]    = ['classic', 'barrel', 'wedge', 'pear']
  const arms: ArmType[]        = ['noodle', 'mitt', 'chunky', 'robot']
  const legs: LegType[]        = ['tube', 'stomp', 'spring', 'peg']
  const feet: FeetType[]       = ['sneakers', 'boots', 'flippers', 'hooves']
  const outfits: OutfitType[]  = ['none', 'wrestler', 'plumber', 'alien', 'frog', 'mascot']
  const headShapes: HeadShape[] = ['round','square','oval']
  const hats: HatType[]         = ['none','tophat','crown','antenna','helmet']
  const accessories: AccessoryType[] = ['none', 'cape', 'fanny', 'floaty', 'spikes', 'bowtie']
  const eyes: EyeType[]         = ['round','angry','wide','dot']
  return {
    name:      randomName(),
    bodyType:  bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
    torso:     torsos[Math.floor(Math.random() * torsos.length)],
    arms:      arms[Math.floor(Math.random() * arms.length)],
    legs:      legs[Math.floor(Math.random() * legs.length)],
    feet:      feet[Math.floor(Math.random() * feet.length)],
    outfit:    outfits[Math.floor(Math.random() * outfits.length)],
    headShape: headShapes[Math.floor(Math.random() * headShapes.length)],
    hat:       hats[Math.floor(Math.random() * hats.length)],
    accessory: accessories[Math.floor(Math.random() * accessories.length)],
    eyeType:   eyes[Math.floor(Math.random() * eyes.length)],
    palette:   PALETTES[Math.floor(Math.random() * PALETTES.length)],
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────
interface CharacterStore {
  build: CharacterBuild
  setBuild: (b: CharacterBuild) => void
  updateField: <K extends keyof CharacterBuild>(key: K, value: CharacterBuild[K]) => void
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  build: PRESETS['The Blob'],
  setBuild: (build) => set({ build }),
  updateField: (key, value) =>
    set((s) => ({ build: { ...s.build, [key]: value } })),
}))
