# BORGDEE — MVP Build Document
### Browser-Based Multiplayer Physics Party Game

---

## 1. Executive Summary

**The game:** A browser-based multiplayer party game where 8–16 players compete on a collapsing tile arena. Every step destroys the tile beneath you. The floor shrinks in real time. Last player standing wins.

**The core fantasy:** You waddle across a disintegrating platform, panic-jumping over gaps, shoulder-checking strangers off the edge, cutting off escape routes, and watching your ridiculous custom character survive or spectacularly fail — all in under three minutes, shareable instantly via link.

**Why this MVP wins:** The collapsing-tile mechanic is self-explanatory, requires no tutorial, produces emergent strategy from simple rules, and generates constant screenshot and clip moments. The character builder gives players identity and a reason to return. Together they create the two flywheels: *gameplay virality* (every match is chaotic and funny) and *social identity virality* (your character is yours and worth showing off).

**Why this is the right first version:** It has one game mode, one core mechanic, one type of map, and a character builder scoped to modular presets. That is exactly enough to be genuinely fun. Everything else is post-launch. The disappearing-tile mechanic is the entire product until it proves itself.

**The character builder is not optional.** It is the reason players return after their first session and the reason they share screenshots. Build it in parallel with core gameplay, not after.

---

## 2. Product Pillars

| # | Pillar | What It Means |
|---|--------|---------------|
| 1 | **Instant Chaos** | Any player can join via link and be having fun within 60 seconds. No account required for first game. |
| 2 | **Collapsing-Floor Tension** | Every match has a clear mechanical arc: open floor → shrinking floor → desperate survival → winner. The tile destruction mechanic IS the game. |
| 3 | **Readable Movement** | Despite visual chaos, it is always clear what just happened, why you fell, and what the winner did right. Outcomes feel fair even when funny. |
| 4 | **Expressive Character Identity** | Your character is recognizable, ridiculous, and yours. Lobbies look like a costume party. Players develop attachment to their builds. |
| 5 | **Social Spectacle** | Matches are worth watching even when eliminated. The game produces clips, screenshots, and shareable moments naturally. |
| 6 | **Browser-First Accessibility** | No download, no install, no plugin. Works on any modern desktop browser. Low-end hardware is a first-class target. |

---

## 3. Core MVP Recommendation

### Include in MVP

| Parameter | Decision | Rationale |
|-----------|----------|-----------|
| Player count | 12 (target), 8 minimum, 16 maximum | 12 fits one map cleanly; 16 is achievable with good netcode |
| Game mode | Disappearing-tile survival only | One mode done well beats three modes done poorly |
| Control scheme | WASD + Space + Shift (dive) + E (grab) + mouse for camera | Simple, universal, no onboarding required |
| Maps | 2 maps at launch | 1 primary + 1 alternate keeps content fresh without bloating production |
| Rounds | Single-elimination round, no multi-round system at MVP | Keeps session short; add multi-round sequences post-launch |
| Art style | Stylized low-poly, toy-like, bright | Runs well in browser, ages well, readable at any resolution |
| Camera | Fixed isometric-ish perspective, slight tilt, follows the last surviving tile cluster | Simple to implement, maximizes readability |
| Session length | 90–180 seconds per match | Short enough to replay immediately |
| Progression | Unlock cosmetics via match completions, not paid gating | Simple XP bucket → cosmetic drops, no economy at MVP |
| Lobbies | Private lobbies (share link) + public matchmaking | Private lobbies are the viral vector; matchmaking fills public slots |
| Voice chat | No | Browser voice is complex, laggy, and a moderation surface; use emotes instead |
| Emotes | 3 emotes maximum (celebrate, taunt, fall over) mapped to keys | Expressive, cheap to build, socially rich |
| Character builder | Full modular builder at launch, ~8 preset archetypes, ~40 total parts | Non-negotiable pillar; must ship with the game |

### Explicitly Exclude from MVP

| Feature | Why Not Now |
|---------|-------------|
| Multi-round elimination sequences | Complexity with no proven need yet |
| Mobile support | Harms desktop focus; physics controls need mouse/keyboard |
| Voice proximity chat | Moderation risk, technical complexity |
| Battle pass / paid currency | Premature monetization before retention is proven |
| User-uploaded avatars | Moderation nightmare, performance unpredictability |
| Ranked matchmaking | Requires player pool you don't have yet |
| Spectator mode (full) | Skeleton spectator only; full replay system is later |
| Team modes | Single-player survival first |
| In-match team communication | Emotes are sufficient |
| Creator marketplace | Post-launch |

### On the two critical questions

**Should disappearing-tile survival be the first mode built?** Yes, unambiguously. Build nothing else until this is fun on its own. Every engineering hour spent on a second mode before the first mode is fun is wasted.

**How important is the character builder in MVP?** It is the second most important system after core gameplay. Ship them together. A character builder without fun gameplay is a dress-up game. Fun gameplay without character identity is a throwaway prototype. Both must ship.

---

## 4. Core Game Loop

```
LANDING PAGE
│
├── [Play Now] → Anonymous session (temp name assigned)
├── [Sign Up / Log In] → Full account + character persistence
├── [Create Private Room] → Get shareable link
└── [Join via Link] → Enter friend's room directly

CHARACTER BUILDER (accessible before matchmaking, always)
│
├── Browse modular parts (head, body, legs, arms, accessories)
├── Select preset archetype or build custom
├── Choose color palette
├── Save build (requires account) or play as guest
└── Preview character in idle animation

MATCHMAKING / LOBBY
│
├── Public queue → Waiting room while filling (min 8 players)
├── Private room → Lobby with visible player list
├── Lobby shows all characters idle + dancing, visible names
├── Room fills → 10-second countdown
└── Host can start early in private rooms (min 4 players)

ROUND INTRO (5 seconds)
│
├── Camera swoops across the arena
├── Player characters drop onto the platform from above
├── Tile grid fully visible and whole
└── "GO" → gameplay starts

GAMEPLAY LOOP
│
├── Players run, jump, grab, dive
├── Stepped tiles begin destruction sequence immediately
├── Tile visual: crack → shake → flash → drop (1.5–2.5 second sequence)
├── Falling players: ragdoll fall → eliminated
├── Eliminated players: brief death animation → cut to spectate cam
├── Arena shrinks as tiles drop → players forced into smaller space
├── Surviving 2–3 players → arena chaos intensifies
└── Last player standing → win

ELIMINATION
│
├── Player falls through tile or off edge
├── Ragdoll physics for 1 second
├── "ELIMINATED" banner
└── Spectator camera activates (follows nearest survivor cluster)

SPECTATING
│
├── Auto-follows action (nearest group of survivors)
├── Can tap to manually cycle between survivors
└── Emote reactions available even while spectating

RESULTS SCREEN (10 seconds)
│
├── Winner spotlighted on surviving tile
├── Winner does victory emote
├── All eliminated players shown with placement
├── XP earned shown
├── Cosmetic unlock revealed if applicable
└── [Play Again] / [Back to Lobby] / [Edit Character]

REPLAY LOOP
│
└── Private room → players stay together → replay immediately
```

---

## 5. Gameplay Design Breakdown

### Movement Model

| Parameter | Value | Feel Goal |
|-----------|-------|-----------|
| Run speed | 7 units/sec | Fast enough to be reactive, slow enough to feel chunky |
| Acceleration | 0.18 (lerp factor) | Slight buildup, not instant |
| Deceleration | 0.12 | Slides slightly, creates momentum |
| Turn speed | 270°/sec | Responsive but not instant |
| Air control | 60% of ground control | You can steer mid-jump, not fully |
| Dive distance | 4 units horizontal | Meaningful gap-crossing ability |
| Grab range | 1.2 units radius | Must be close; no long-range grabs |

**Philosophy:** Movement should feel like a confident drunk person — you mostly go where you intend, but momentum creates funny consequences near edges and while panicking.

### Jump Behavior

- **Jump height:** 3.5 units
- **Jump arc:** Slightly floaty on ascent, snappier descent (asymmetric gravity)
- **Coyote time:** 120ms window after walking off a tile edge where jump still registers
- **Jump buffer:** 100ms jump input before landing still fires jump on land
- **Double jump:** No — adds complexity, reduces edge tension
- **Jump-cancel:** Holding down reduces jump arc height by 20% (for precision)

Coyote time is mandatory. Without it, edge jumping feels random and unfair. With it, near-miss recoveries feel skilled.

### Dive Behavior

- **Trigger:** Shift key (or double-tap direction on controller)
- **Behavior:** Character launches forward at 45° angle, 4 unit horizontal distance, 1.5 second animation
- **During dive:** Player is a physical object, can collide and push others
- **Recovery:** 0.4 second standup animation after landing; vulnerable during this
- **Dive-grab:** Pressing E during dive launch initiates a grab attempt if near a player
- **Anti-spam:** 0.8 second cooldown between dives

Dive should feel committed and slightly risky. It's your panic move and your aggressive move.

### Grabbing Behavior

- **Range:** 1.2 unit sphere cast from player front
- **Trigger:** E key
- **Duration:** Grab holds for up to 1.5 seconds, then auto-releases
- **Grabbed player:** Can struggle (spam WASD + Space) to break free in 0.5–1.0 seconds
- **Grabber penalty:** Movement reduced to 60% while holding someone
- **Release:** Both players stumble for 0.3 seconds
- **Grab off edge:** Grabber can drag grabbed player toward edge, grabbed player resists
- **Anti-frustration:** Grab cooldown 0.6 seconds after release; cannot immediately re-grab same player

Grabs should be high-risk, high-reward. You slow down, you are vulnerable, but you can throw someone off.

### Collisions

- **Collision capsule:** Identical for all players regardless of visual size (see Section 6)
- **Bump physics:** Players push each other with velocity-scaled force transfer
- **Stack prevention:** Players cannot stand on top of each other; gentle upward separation force
- **Corner cases:** Players trying to occupy same tile get gentle lateral separation
- **Pile-ups:** Intentional — 3 players on one tile is funny and dangerous for everyone

### Stumble / Ragdoll-Lite Reactions

- **Stumble trigger:** Receiving a bump above threshold velocity (~5 units/sec impact)
- **Stumble:** 0.4 second stagger animation, movement speed halved
- **Ragdoll:** Full ragdoll only on tile-fall elimination; not during gameplay
- **Recovery:** Automatic; no button press required to stand up
- **Ragdoll on fall:** Player goes full ragdoll for 1 second, then freezes for elimination camera

True ragdoll during gameplay creates frustration and control loss too severe for a party game. Reserve it for elimination moments only — it makes death funny without making survival feel unfair.

### Tile Destruction Sequence

This is the most important system in the game. Define it precisely:

| Phase | Duration | Visual | Audio |
|-------|----------|--------|-------|
| **Untouched** | — | Full opacity, solid color | Ambient tile hum |
| **Stepped** (player lands) | — | Trigger starts | Click/thud |
| **Warning** | 0.4 sec | Cracks appear, slight wobble starts | Low creak |
| **Flash** | 0.6 sec | Tile flashes red/orange, shaking intensifies | Escalating creak |
| **Drop** | 0.5 sec | Tile drops away, particles burst | Crash/break sound |
| **Gone** | permanent | Void/fall zone below | Nothing |

**Total time from step to gone: 1.5 seconds.** This is non-negotiable. Shorter = feels random. Longer = reduces tension. 1.5 seconds is enough time to react if you're paying attention, not enough time if you're panicking.

**MVP should use a single floor layer.** Multiple layers dramatically increase complexity with limited payoff for MVP. Add a second layer in Phase 2.

**Tile grid layout:** Hexagonal tiles recommended over square tiles. Hexagons have no corner-shared ambiguity, create more natural movement pathing, and look better with destruction effects.

### Strategic Depth from Tile Destruction

Players can trap each other by:
- Running across tiles adjacent to a player's only escape path, triggering destruction ahead of them
- Grabbing a player and standing still, letting the tile beneath both players destroy while the grabber plans to dive clear
- Running "around" a player in a circle to destroy their surrounding tiles
- Baiting a player to chase you across a thinning section of the arena

This is all emergent from a single mechanic. Do not add explicit "trap" mechanics — the tile system creates them naturally.

### Randomness vs Skill

| Element | Skill Weight | Randomness Weight | Notes |
|---------|-------------|-------------------|-------|
| Tile destruction | 100% deterministic | 0% | All players see same info |
| Starting positions | 0% skill | 100% random | Fair random spawn |
| Player collisions | 70% skill | 30% chaos | Momentum creates unpredictability |
| Arena layout | Fixed per map | — | Both maps have known layouts |
| Tile state visibility | Full | — | No hidden information |

**Target:** 70% skill, 30% chaos.

### Anti-Frustration Rules

- No tile destroys the instant it is stepped on — always the 1.5 second window
- Respawn-in-place on disconnect not granted (this is a survival game; disconnects eliminate)
- Cannot fall through a tile mid-jump if you left before destruction completed
- Grab cannot be initiated while player is in stumble state
- A player's starting tile does not begin destruction until 2 seconds after round start

---

## 6. Character Builder System Design

### The Core Problem to Solve

Players need to look fat, tall, wide, or lanky while the game's physics treats them all identically. This requires a strict separation between two systems:

```
VISUAL MESH (what players see)
  └─ Any shape, any proportions, any size
  └─ Rendered as a child of the gameplay object
  └─ May clip, stretch, or deform — that is intentional style

GAMEPLAY CAPSULE (what physics sees)
  └─ Always: radius 0.5 units, height 1.8 units
  └─ Never changes regardless of visual appearance
  └─ All movement, collision, grab, jump calculated against this capsule
  └─ Invisible to players during normal play
```

The visual mesh is attached to the gameplay capsule but does **not** affect it. A character who looks enormous is still physically the same capsule as a character who looks tiny.

### Modular Slots

| Slot | Description | MVP Part Count |
|------|-------------|----------------|
| Head | Shape: round, square, helmet, animal, masked, oversized | 12 |
| Eyes | Stickers applied to head surface | 8 |
| Body / Torso | Proportions: wide, tall, stubby, bulky, lanky, normal | 8 |
| Arms | Short stumpy, long dangling, no arms, robotic, paws | 6 |
| Hands | Fists, gloves, claws, fins, mittens | 6 |
| Legs | Short, long, stumpy, springy, none (floats) | 6 |
| Feet | Boots, hooves, flippers, paws, shoes | 6 |
| Outfit / Skin | Base color/texture applied to body | 10 |
| Hat | Top hat, helmet, crown, flower, antennas, nothing | 8 |
| Accessory | Cape, backpack, tail, wings (non-functional), badge | 6 |
| Color Palette | Primary + secondary + accent, HSL slider | Full HSL |
| Material | Matte, glossy, metallic, fuzzy | 4 |

**Total MVP parts: ~80 parts across all slots.** Achievable in 6–8 weeks of focused art production.

### Visual Body Variation

| Body Type | Visual Scale (X, Y, Z) | Feel |
|-----------|------------------------|------|
| Normal | 1.0, 1.0, 1.0 | Default |
| Fat / Wide | 1.6, 0.85, 1.6 | Round, waddly |
| Tall / Lanky | 0.8, 1.4, 0.8 | Leggy, goofy |
| Stubby | 1.2, 0.7, 1.2 | Compact, potato |
| Bulky | 1.4, 1.1, 1.3 | Top-heavy |
| Tiny | 0.7, 0.7, 0.7 | Tiny bean |
| Oversized Head | 1.0 body + 1.8 head scale | Bobblehead |

Scale values affect **only the rendered mesh.** The physics capsule does not change.

### Preset Archetypes

| Preset Name | Description | Energy |
|-------------|-------------|--------|
| The Blob | Wide body, tiny legs, round head, matte finish | Goofy underdog |
| The Tower | Tall lanky body, tiny head, long arms | Awkward giant |
| The Tank | Bulky body, helmet head, big boots | Overconfident brute |
| The Spud | Stubby everything, huge eyes | Adorable chaos agent |
| The Weirdo | Oversized head, no arms, tiny legs | Pure absurdity |
| The Fancy | Normal proportions, top hat, cape, monocle | Distinguished idiot |
| The Beast | Animal head, paw hands, tail accessory | Mascot chaos |
| The Bot | Robotic arms, visor head, metallic material | Awkward machine |

### Saved Builds

- Up to 5 saved slots with free account
- Thumbnail preview generated on save
- Default name is auto-generated funny adjective + noun combo ("Lumpy Professor", "Angry Dumpling")
- Guest players get local storage only; account saves persist cross-device

### Unlockable Parts

- Earn parts through match completions (not skill, not paid)
- Every 3 matches completed → 1 cosmetic drop (weighted random from unlocked pool)
- No duplicate drops until pool exhausted
- All parts are purely cosmetic, zero gameplay impact

### UI Flow for Character Builder

```
1. [MY CHARACTER] tab in main menu
2. Default view: character rotating on pedestal, idle animation
3. Left panel: slot list (head, body, arms, etc.)
4. Click slot → opens part picker grid for that slot
5. Hover part → live preview on character
6. Click part → apply
7. Color picker accessible from outfit/material slots
8. Bottom bar: [Preset] [Save] [Randomize] [Play]
9. [Randomize] selects a random combination → instant funny result
10. [Play] → goes to matchmaking with current character
```

**[Randomize] is one of the most important buttons in the game.** It creates accidental hilarity and drives sharing.

---

## 7. Safe Customization / UGC Strategy

### Phase 1 — MVP (Launch)

**Approach: Fully curated modular parts, no user uploads.**

- All parts designed by the dev team
- Fixed color picker (HSL slider with material presets)
- ~80 parts at launch
- No ability for players to create or upload anything

### Phase 2 — 3–6 Months Post-Launch

**Approach: Controlled texture colorways + community preset packs.**

- Introduce 2–3 new part packs per month
- Allow players to share saved build codes (20-character alphanumeric string encoding their build)
- No moderation needed for build codes — all parts are already curated

### Phase 3 — 6–18 Months Post-Launch

**Approach: Controlled skin creation (texture layer only).**

- Allow players to draw on a 256×256 UV template for outfit layer
- Server-side moderation: auto-filter NSFW (image classifier) + human review queue
- Skins reviewed before public visibility

### On VRChat-Style Arbitrary Avatar Uploads

**Do not do this at MVP.** Here's why:

| Risk | Severity |
|------|----------|
| Copyright infringement | Critical — users will upload copyrighted characters immediately |
| Performance unpredictability | High — arbitrary poly counts crash browsers |
| Moderation impossibility | High — 3D model review is slow and expensive |
| NSFW/offensive content | High — impossible to auto-classify 3D models reliably |
| Hitbox/fairness consistency | High — breaks fundamental gameplay fairness promise |
| Competitive exploits | Medium — transparent textures, camera-blocking models |

**Verdict: No arbitrary 3D uploads without a dedicated trust and safety team, 3D content policy, automated mesh scanning, and a proven player base.**

---

## 8. Round / Mode Strategy

### Primary Mode: Tile Collapse Survival (MVP — Build This First)

**What it is:** All players on a tile grid. Stepped tiles destroy after 1.5 seconds. Last player standing wins.

**Technical complexity:** Medium. Requires authoritative tile state sync, collision, physics.

**Physics complexity:** Medium. Tile destruction is deterministic. Player physics is the main challenge.

**Replayability:** Very high. Each match plays differently based on player positions and decisions.

**MVP: Yes, this is the only mode.**

### Mode 2 (Post-Launch): Tile Rush

Players score points by being the last person on a tile before it drops. Why not now: requires scoring system, HUD changes, meta rebalance.

### Mode 3 (Post-Launch): Team Collapse

Two teams of 6. Team whose last player falls loses. Why not now: team balancing, matchmaking, communication infrastructure.

### Mode 4 (Post-Launch): Shrink Zone

Inward-moving "destroy zone" forces players toward center. Why not now: confusing overlap with organic tile destruction meta.

### Mode 5 (Post-Launch): Tile Builder

Players can temporarily regenerate tiles by holding a spot for 2 seconds. Why not now: changes the meta before the base meta is established.

**Recommendation: Ship survival mode only. Add Mode 2 only if survival shows 70%+ replay rate.**

---

## 9. Technical Architecture Recommendation

### Options Evaluated

#### Rendering Engine

| Option | Verdict |
|--------|---------|
| Three.js | **Winner** — lightweight (~300KB gzipped), massive ecosystem, full 3D, excellent AI tooling |
| Babylon.js | Runner-up — heavier, less flexible |
| PlayCanvas | Reject — editor-centric, proprietary feel |
| Phaser | Reject — 2D only |
| Unity WebGL | Reject — ~50MB+ bundle, slow load |
| Godot Web Export | Reject — large bundle, WASM perf issues |

#### Physics Engine

| Option | Verdict |
|--------|---------|
| Rapier (WASM) | **Winner** — deterministic, modern API, runs identically on client and server |
| Cannon.js | Reject — slow, poorly maintained, non-deterministic |
| Ammo.js | Reject — enormous bundle, complex API |
| Matter.js | Reject — 2D only |

#### Multiplayer / Networking

| Option | Verdict |
|--------|---------|
| Colyseus | **Winner** — purpose-built, room management, state sync, TypeScript-native |
| Socket.io custom | Runner-up — flexible but requires building all room/matchmaking logic |
| Nakama | Reject — too heavy for MVP |
| WebRTC P2P | Reject — no authoritative state, cheating surface |

#### Backend

| Option | Verdict |
|--------|---------|
| Node.js + Fastify | **Winner** — TypeScript throughout, shares code with Colyseus and client |
| Go | Later — great concurrency but harder AI code generation |
| Python / Django | Reject — wrong fit for real-time game server |

### Final Stack

```
Frontend:     React + Vite + TypeScript
3D Rendering: Three.js + @react-three/fiber + drei
Physics:      Rapier (WASM) — server-authoritative, client for prediction
Multiplayer:  Colyseus (Node.js) — rooms, matchmaking, state sync
REST API:     Fastify (Node.js + TypeScript)
Database:     PostgreSQL via Supabase
Auth:         Supabase Auth
Asset CDN:    Cloudflare R2 + CDN
Deploy:       Vercel (frontend) + Fly.io (game servers) + Supabase (DB)
Analytics:    PostHog
```

**Why this stack wins:** 100% TypeScript across every layer — AI agents can generate consistent code throughout. Rapier is deterministic so physics can be authoritative on server. Colyseus eliminates 80% of multiplayer boilerplate. Supabase eliminates 80% of backend boilerplate.

---

## 10. Multiplayer / Netcode Plan

### Architecture: Server-Authoritative Physics

```
CLIENT                          SERVER (Colyseus Room)
  │                                     │
  ├─ Input: {w,a,s,d,jump,dive,grab}   │
  ├─ Timestamp: client tick number      │
  │──────── send 20x per second ───────►│
  │                                     ├─ Validate input
  │                                     ├─ Apply to physics sim (Rapier)
  │                                     ├─ Run physics step
  │                                     ├─ Update authoritative state
  │◄──────── broadcast 20x/sec ─────────┤
  │                                     │
  ├─ Receive server state               │
  ├─ Compare to predicted state         │
  ├─ Reconcile if delta > threshold     │
  └─ Interpolate other players          │
```

### Client-Side Prediction

- Client immediately moves own player on local input without waiting for server
- Server state arrives ~50–150ms later (typical browser latency)
- If server position differs from predicted position by more than 0.3 units → snap/lerp correct

### Interpolation of Other Players

- Render at `now - 100ms` (two server ticks behind) to smooth between received states
- All players see remote players ~100ms in the past — acceptable for a party game

### Tile State Sync

- Server holds authoritative tile state array: `TileState[]`
- On player-tile contact: server updates state and broadcasts
- Delta sync: only changed tiles broadcast per tick, not full grid

### Lag Handling

| Latency | Behavior |
|---------|---------|
| 0–200ms RTT | Invisible with prediction + interpolation |
| 200–400ms RTT | Visible rubber-banding; acceptable degradation |
| 400ms+ | Warning shown to player |
| 500ms no input | Player freezes in place |
| 3 sec disconnect | Player automatically eliminated |

### Grab Validation

Server checks: Is grabber within 1.2 unit radius? Is grabber off cooldown? Is target not already grabbed? Client prediction that server rejects gets cancelled locally.

### Anti-Cheat Basics

| Check | Method |
|-------|--------|
| Speed hack | Server validates velocity ≤ run_speed × 1.3 per tick |
| Position teleport | Server rejects positions beyond (max_speed × tick_delta × 2) from last known |
| Tile state manipulation | All tile state computed server-side; client has no write authority |
| Grab spam | Server enforces grab cooldown regardless of client state |

### Physics Split

| Physics | Runs On |
|---------|---------|
| Player movement | Server (authoritative) + Client (predicted) |
| Tile destruction | Server only |
| Player collisions | Server (authoritative) + Client (visual effect) |
| Ragdoll elimination | Client only (visual) |
| Particle VFX | Client only |
| Camera | Client only |

---

## 11. Physics and Movement Feel

### Full Parameter Table

| Parameter | Value | Feel Note |
|-----------|-------|-----------|
| Run speed (max) | 7.0 units/sec | Snappy enough to feel agile |
| Acceleration | lerp 0.18 | Slight buildup, avoids ice-skating |
| Deceleration | lerp 0.12 | Slight slide, avoids instant stop |
| Turn speed | 270°/sec | Responsive but not pinpoint |
| Jump height | 3.5 units | Clears 2-tile gaps comfortably |
| Jump gravity (ascent) | 18 units/sec² | Floaty ascent |
| Jump gravity (descent) | 26 units/sec² | Snappier fall |
| Coyote time | 120ms | Forgiveness at tile edge |
| Jump buffer | 100ms | Prevents missed jumps |
| Air control | 60% of ground | Some steering, not full |
| Dive horizontal | 4.0 units | Clears 3-tile gap |
| Dive duration | 0.4 sec | Feels committed |
| Dive recovery | 0.4 sec | Vulnerable window post-dive |
| Grab range | 1.2 units | Requires genuine proximity |
| Grab hold max | 1.5 sec | Then auto-releases |
| Grab speed reduction | 40% | Real penalty for grabbing |
| Bump threshold | 5.0 units/sec impact | Below this: no stumble |
| Stumble duration | 0.4 sec | Brief but noticeable |
| Stumble speed | 50% of normal | Noticeable but not devastating |
| Recovery | automatic | No recovery button (frustration-free) |

### Asymmetric Gravity

The jump arc must use **higher descent gravity than ascent gravity**. This is the single most impactful feel improvement. Symmetric gravity makes characters feel like they're floating. Use: slow ascent + fast descent + slight overshoot on directional deceleration.

---

## 12. Content Pipeline

### Art Style: Stylized Low-Poly Toy Characters

**Target polycount per character:** 800–2,000 triangles. With 16 players: ~32,000 triangles total — trivially fast in modern WebGL.

**Reference energy:** Stumble Guys, Wobbly Life, Gang Beasts (softer, squashier).

### Character Rigging / Skeleton Strategy

Use a **single shared skeleton** for all characters. Every character part is skinned to this same rig.

- One animation set works for all visual combinations
- Body type scaling applied at the node level above the rig
- Bone count: ~20 bones total
- **No inverse kinematics at MVP** — simple forward kinematics only

### Animation Set (MVP)

| Animation | Priority |
|-----------|----------|
| Idle (standing, breathing) | MVP |
| Run | MVP |
| Jump (launch + airborne + land) | MVP |
| Dive | MVP |
| Stumble | MVP |
| Grab (holding pose) | MVP |
| Being-grabbed struggle | MVP |
| Fall / elimination ragdoll | MVP |
| Victory emote × 1 | MVP |
| Taunt emote × 1 | MVP |
| Reaction emote × 1 | MVP |

### Map / Tile Construction

- Tiles modeled as flat hexagonal prisms with slight bevel
- Three tile states as separate meshes or morph targets
- Map assembled from grid definition JSON (position, type, starting state)
- Two MVP maps: one symmetric, one asymmetric
- No procedural generation at MVP

### VFX/SFX Scope (MVP)

- Tile crack particle burst
- Tile fall dust cloud
- Player land puff
- Grab spark
- Elimination "fall into void"
- Winner confetti burst
- UI sound effects (clicks, timer)
- Background ambient
- 3 emote sounds

### Efficient Character Variety Math

12 heads × 8 bodies × 6 arms × 6 legs × 8 outfits = **27,648 unique visual combinations from ~40 total parts.**

Use texture atlases — all parts share a single texture atlas per character session. One draw call per character instead of one per part.

---

## 13. Anti-Cheat / Abuse / Moderation

### MVP Priority Stack

**Critical now:**

| System | Implementation |
|--------|---------------|
| Server-authoritative physics | Rapier on server, client cannot set position |
| Input validation | Server rejects impossible inputs |
| Rate limiting | Max 30 inputs/sec per player; API rate limits |
| Offensive display names | Wordlist filter on name set + character limit |
| Account rate limiting | IP + device fingerprint limits on account creation |

**Week 2:**

| System | Implementation |
|--------|---------------|
| Match report button | Logs match ID + reporter + reason to queue |
| Admin match replay | Server-side match state snapshots for review |
| Temporary ban system | Manual ban via admin tool |

**Not needed until you have users:** ML-based cheat detection, automated ban systems, appeal workflows, community moderation.

### Private Room Abuse

Private rooms with consenting players are not a moderation problem. Intervene only if:
- A private room link is publicly shared and used for griefing strangers
- Reports come in from players who joined without consent

No voice chat eliminates harassment surface by ~90%.

---

## 14. Cost / Complexity / Risk Assessment

| Rank | Risk | Why It Matters | Mitigation | MVP Threat |
|------|------|---------------|------------|-----------|
| 1 | **Physics feel is wrong** | Bad movement kills the product | Prototype + validate feel in week 1 | Critical |
| 2 | **Netcode latency makes gameplay unfair** | Grab/tile timing must feel fair | Rapier determinism + Colyseus + 4 weeks for netcode | Critical |
| 3 | **Browser performance with 16 players** | Low-end laptops can't run it | LOD, texture atlases, instanced meshes; test on integrated GPU week 2 | High |
| 4 | **Character builder too slow to build** | Blocks launch | Hire 3D generalist; target 4 parts/day | High |
| 5 | **Matchmaking pool too small at launch** | Can't fill public rooms | Private lobbies first; matchmaking secondary | High |
| 6 | **Fun risk: mechanic becomes repetitive** | One mode exhausts itself | Map variety + lobby social energy extend replayability | Medium |
| 7 | **Scope creep / overbuild** | Adding features before first mode is fun | Strict scope; any new feature requires removing one of equal weight | Medium |
| 8 | **Server costs at scale** | 10K CCU = ~$20K/month | Fly.io autoscaling; idle room shutdown; hard budget alerts | Medium |
| 9 | **Browser / device fragmentation** | Safari WebGL differences | Test Chrome + Firefox + Safari from week 1 | Medium |
| 10 | **Cosmetic production velocity** | Players exhaust 80 parts quickly | Part template pipeline; target 8 parts/month post-launch | Low-Medium |

---

## 15. Build Roadmap

### Phase 0 — Prototype (Weeks 1–2)

**Goal:** Prove movement and tile mechanic are fun, singleplayer.

**Must Have:** WASD movement, jump + dive, tile grid with destruction, basic collision, 60fps on laptop.

**Success criteria:** Developer plays alone for 5 minutes and finds it genuinely satisfying.

---

### Phase 1 — First Playable (Weeks 3–5)

**Goal:** Two people on the same server, same collapsing tile grid.

**Must Have:** Colyseus server locally, 2 players + shared tile state, server-authoritative tile destruction, basic collision, elimination, result screen.

**Success criteria:** Two developers play a round. One player falls due to the other's tile-stepping. Outcome feels fair.

---

### Phase 2 — Internal Multiplayer Alpha (Weeks 6–9)

**Goal:** 8–16 players, stable netcode, playable character builder, private lobbies.

**Must Have:** 8+ player rooms stable, grab mechanic, client prediction + interpolation, minimal character builder (4 presets), private lobby link sharing, full round loop.

**Success criteria:** Internal team of 8 plays a full match, 90–180 seconds, at least one emergent funny moment per match.

---

### Phase 3 — Private Test (Weeks 10–14)

**Goal:** 50–100 external testers in private beta.

**Must Have:** Public matchmaking, full character builder, progression, display name filter, both maps, 3 emotes, results + XP screen, PostHog analytics, basic report button.

**Success criteria:** 70%+ of testers complete 3+ matches in a session. NPS > 30. Replay rate > 50%.

---

### Phase 4 — Public MVP (Weeks 15–20)

**Goal:** Public launch.

**Must Have:** All Phase 3 features stable, 99.5%+ uptime infrastructure, auto-scaling game servers, landing page + onboarding, guest play, admin ban tool.

**Success criteria:** 500 CCU without server issues. D7 retention > 20%. Organic social sharing occurring.

---

### Phase 5 — Post-Launch Expansion (Month 4–12)

| Initiative | Month |
|-----------|-------|
| Second game mode (Tile Rush) | Month 4 |
| Monthly cosmetic pack drops | Month 4+ |
| Build code sharing system | Month 5 |
| Tournament / featured lobbies | Month 6 |
| Mobile exploration | Month 6 |
| Battle pass v1 | Month 7 |
| Creator preview program | Month 9 |
| Third map | Month 4 |
| Team mode | Month 8 |

---

## 16. PRD-Ready MVP Scope

### Target User

**Primary:** 18–30 year old desktop browser users who play casual multiplayer games with friends. Discord-native. Enjoy sharing funny clips. Play in groups of 2–6 people who join together.

**Secondary:** Streamers and content creators who need shareable moments and chaotic gameplay.

### Player Fantasy

*"I showed up looking like a giant frog in a top hat, survived until the last 3 tiles, grabbed someone off the edge, then fell myself — and my character's ragdoll was perfect."*

### User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 1 | New visitor | Click a shared link and join a game within 30 seconds | I can play with my friend immediately |
| 2 | Player | Customize my character before my first match | I feel like mine, not a default avatar |
| 3 | Player | Jump, dive, grab on disappearing tiles | I can compete and create funny moments |
| 4 | Player | See everyone's characters in the lobby | I can appreciate the chaos before the match |
| 5 | Player | Watch as a spectator after I'm eliminated | I stay engaged until the match ends |
| 6 | Player | See my XP earned and any unlocks after a match | I feel rewarded and motivated to replay |
| 7 | Player | Create a private room and share the link | I can play with specific friends |
| 8 | Host | Start the match when my friends have joined | I control when the game begins |
| 9 | Casual player | Use simple controls (WASD + Space + Shift + E) | I don't need to learn a complex control scheme |
| 10 | Content creator | Have funny emergent moments happen naturally | I have shareable content without extra tools |

### Gameplay Requirements

- Physics tick rate: 60Hz server, 60Hz client render
- State broadcast: 20Hz minimum, 30Hz target
- Max latency for fair gameplay: 400ms RTT
- Player count: 8–16 per room
- Tile destruction: deterministic, server-authoritative, 1.5 second total sequence
- Character builder: 7 slots minimum, 8 presets, ~80 parts, color picker
- Grab system: range-validated server-side, 1.5 second max hold
- Round length: 90–180 seconds target

### System Requirements

- **Client minimum:** Chrome 90+, 4GB RAM, integrated GPU, 5Mbps connection
- **Client target:** Chrome/Firefox/Safari latest, 8GB RAM, dedicated GPU
- **Server:** Colyseus rooms on Fly.io, horizontal scaling, auto-shutdown idle rooms
- **Availability target:** 99.5% uptime
- **Concurrent player target at launch:** 500 CCU

### Non-Functional Requirements

- Initial page load: < 3 seconds on 20Mbps connection (target < 5MB total bundle)
- Character builder preview: < 200ms response to part swap
- Room join: < 2 seconds from click to in-lobby
- Asset CDN: < 100ms latency for US/EU users

### Live Ops / Analytics Events

| Event | Properties |
|-------|-----------|
| `session_start` | user_id, device, browser, geo |
| `match_joined` | match_id, player_count, room_type |
| `match_completed` | match_id, placement, duration, tiles_stepped, grabs_attempted |
| `match_replayed` | match_id, same_room (bool) |
| `character_saved` | build_id, preset_used, parts_count |
| `cosmetic_unlocked` | item_id, rarity, method |
| `room_created` | room_type, created_by |
| `player_eliminated` | match_id, placement, cause |
| `grab_succeeded` | match_id, result |
| `session_end` | session_duration, matches_played |

### Launch Checklist

- [ ] Core gameplay loop working (movement + tiles + grab + elimination)
- [ ] 16-player room stable at 60fps target
- [ ] Character builder with 8 presets and 80 parts
- [ ] Private lobby link sharing working
- [ ] Public matchmaking filling rooms
- [ ] Account creation + guest play working
- [ ] Progression (XP + drops) functional
- [ ] Display name wordlist filter active
- [ ] Report button connected to queue
- [ ] Analytics events firing
- [ ] Auto-scaling game servers deployed
- [ ] CDN serving assets globally
- [ ] Landing page with game pitch and [Play Now] button
- [ ] Load tested to 500 CCU
- [ ] Safari + Firefox + Chrome tested
- [ ] Works on integrated GPU laptop tested

---

## 17. AI-Agent Execution Plan

### Workstream Overview

| # | Workstream | Depends On |
|---|-----------|-----------|
| A | Gameplay Prototype | Nothing |
| B | Multiplayer / Netcode | A |
| C | Backend / Lobbies | Nothing |
| D | Frontend Shell / Menus | Nothing |
| E | Character Builder | D |
| F | Cosmetics / Progression | C, E |
| G | Analytics | C |
| H | Moderation / Admin | C |
| I | Infrastructure / Deployment | B, C |
| J | QA / Test Automation | A, B |

---

### Workstream A: Gameplay Prototype

**Objective:** Working browser-based single-player movement + tile destruction demo.

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| A1 | Scaffold React + Vite + TypeScript project | `npm run dev` serves blank Three.js canvas |
| A2 | Implement hex tile grid generator | 8×8 hex grid visible in browser |
| A3 | Implement tile state machine (UNTOUCHED → CRACKING → FLASHING → GONE) | Clicking a tile triggers full destruction in 1.5 seconds |
| A4 | Implement player capsule (geometry + Rapier physics body) | Player object exists in physics scene |
| A5 | Implement WASD movement + camera follow | Player moves on grid; camera follows |
| A6 | Implement jump (with coyote time + jump buffer) | Jump works; coyote time recoverable at edge |
| A7 | Implement tile-step detection | Walking across grid destroys tiles under player |
| A8 | Implement dive mechanic with recovery window | Shift triggers dive; recovery animation plays |
| A9 | Implement fall detection → elimination | Falling through tile triggers elimination |
| A10 | Tune all movement parameters per Section 11 | Movement matches target feel |

**Success criteria:** Developer plays for 5 minutes without bugs. Movement feels "chunky but responsive."

---

### Workstream B: Multiplayer / Netcode

**Objective:** 2–16 players in a shared authoritative physics room.

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| B1 | Initialize Colyseus project, define Room schema | Colyseus server starts, room joins succeed |
| B2 | Port Rapier physics to server-side | Server physics step runs at 60Hz |
| B3 | Implement input message from client → server | Server receives and logs client inputs |
| B4 | Implement server-authoritative player movement | Server moves player in response to input |
| B5 | Implement state broadcast at 20Hz | Client receives position updates |
| B6 | Implement client-side prediction | Player movement feels instant locally |
| B7 | Implement interpolation for remote players (100ms buffer) | Remote players move smoothly |
| B8 | Implement reconciliation (correction if delta > 0.3 units) | Desync corrects without visible pop |
| B9 | Implement tile state as authoritative server state | All clients see same tile destruction timing |
| B10 | Implement grab: client request → server validate → broadcast | Grab works correctly in multiplayer |
| B11 | Implement disconnect handling (3 second timeout → eliminate) | Disconnected player eliminated cleanly |
| B12 | Implement anti-cheat: speed validation, position rejection | Speed hacks rejected server-side |
| B13 | Load test: 16 simulated clients in one room | No desync; < 100ms state lag |

---

### Workstream C: Backend / Lobbies

**Objective:** Auth, accounts, private rooms, public matchmaking, progression.

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| C1 | Set up Supabase project (Postgres + Auth + Storage) | DB accessible, auth endpoints working |
| C2 | Implement Fastify REST API skeleton | API server starts, health check passes |
| C3 | Implement user registration + login (email + Google OAuth) | Users can create accounts and log in |
| C4 | Implement guest session | Non-registered users can play once |
| C5 | Implement character build schema + CRUD endpoints | Character builds save and load per user |
| C6 | Implement private room creation endpoint | Room created, code returned |
| C7 | Implement room join by code endpoint | Player joins room via code |
| C8 | Implement public matchmaking queue (FIFO, fill to 8 minimum) | Public players matched into shared room |
| C9 | Implement match history logging | Match results stored in DB |
| C10 | Implement progression: XP award per match, cosmetic drop trigger | XP accumulates, drops trigger at thresholds |
| C11 | Implement cosmetic inventory per player | Player's unlocked parts stored and retrievable |
| C12 | Implement display name validation | Offensive names rejected with clear error |

---

### Workstream D: Frontend Shell / Menus

**Objective:** All non-game UI (landing page, menus, lobby, results).

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| D1 | Landing page: pitch + [Play Now] + [Create Room] | Loads < 3 seconds |
| D2 | Lobby screen: player list with character previews, countdown | Shows all players, characters, countdown |
| D3 | Matchmaking screen: "Finding players..." + cancel | Shows queue state; transitions to lobby |
| D4 | In-game HUD: player count remaining, timer, controls | HUD visible and correct during play |
| D5 | Elimination screen: "YOU FELL" + placement + spectate | Shows on elimination |
| D6 | Results screen: placement list, winner highlight, XP, unlock reveal | Shows after match; replay buttons work |
| D7 | Settings panel: volume, controls, display name edit | Accessible from main menu |
| D8 | Share button on lobby + results (copies invite link) | Copies correct URL to clipboard |

---

### Workstream E: Character Builder

**Objective:** Full character customization UI with preview, presets, and save.

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| E1 | 3D character preview component (rotating on pedestal, idle animation) | Character visible and animating in browser |
| E2 | Modular part loader (loads 3D parts by slot + ID, applies to shared skeleton) | Swapping head/body/legs works visually |
| E3 | Body type scale system (visual scale presets only, not physics capsule) | Fat/tall/stubby presets look correct |
| E4 | Color picker per slot (HSL slider, applies to material) | Color changes reflect on character preview |
| E5 | Part picker grid UI (scroll, hover preview, click to apply) | All parts browsable and selectable |
| E6 | Preset archetype loader (8 presets load full configurations) | All 8 presets load correctly |
| E7 | [Randomize] button | Produces valid random character |
| E8 | [Save Build] (backend if logged in, local storage if guest) | Build persists across sessions |
| E9 | Saved builds viewer (up to 5 slots, thumbnail, load, delete) | Saved builds load correctly |
| E10 | Unlocked parts gating (locked parts visible but dimmed) | Locked parts show unlock requirement |

---

### Workstream F: Cosmetics / Progression

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| F1 | Define cosmetic item catalog | Catalog loaded by backend |
| F2 | Implement XP award endpoint | XP updates in DB after each match |
| F3 | Implement drop trigger (every 3 match completions → weighted random drop) | Drop generated, no duplicates until pool exhausted |
| F4 | Implement drop reveal UI (animated reveal on results screen) | Drop shown with animation |
| F5 | Integrate inventory with character builder | Inventory state reflected in builder |

---

### Workstream G: Analytics

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| G1 | Initialize PostHog SDK on client | Events visible in PostHog dashboard |
| G2 | Implement all 10 analytics events from Section 16 | Each event fires with correct properties |
| G3 | Implement server-side event validation | Match events cannot be spoofed by client |
| G4 | Build basic retention dashboard (D1, D7, D30, replay rate) | Metrics visible without manual querying |

---

### Workstream H: Moderation / Admin

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| H1 | Display name wordlist filter | Violations rejected with helpful error |
| H2 | In-game report button → logs to DB | Reports stored, queryable |
| H3 | Admin panel: view reports, ban/unban user by ID | Admin can ban/unban without DB access |
| H4 | Banned user handling: ban check on session start | Banned users see clear message |

---

### Workstream I: Infrastructure / Deployment

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| I1 | Dockerize Colyseus game server | Docker image builds and runs |
| I2 | Deploy game server to Fly.io with auto-scale | Room spins up in < 2 seconds |
| I3 | Deploy Fastify API to Fly.io or Railway | API accessible via HTTPS |
| I4 | Configure Cloudflare R2 + CDN for assets | Assets load < 100ms in US/EU |
| I5 | Deploy frontend to Vercel | Frontend deploys on push to main |
| I6 | Configure idle room shutdown (disposes after 30 seconds empty) | No idle rooms consuming server resources |
| I7 | Configure budget alerts (alert at $100/day) | Alert fires before surprise bill |
| I8 | Set up uptime monitoring | Alert if API or game server is down |

---

### Workstream J: QA / Test Automation

| Task | Description | Acceptance Criteria |
|------|-------------|---------------------|
| J1 | Unit tests for tile state machine | All transitions tested, timing verified |
| J2 | Unit tests for player physics parameter validation | Speed limits, jump height within spec |
| J3 | Integration tests for grab validation logic | Valid and invalid grabs correctly handled |
| J4 | Load test script (16 simulated clients, 3 minutes) | No crashes, no desync at 16 players |
| J5 | Browser compatibility test (Chrome, Firefox, Safari via Playwright) | Game loads and runs on all three |
| J6 | Performance benchmark (16 characters on screen, integrated GPU) | 60fps on Intel Iris Xe equivalent |

---

## 18. Backlog of Nice-to-Haves

| Feature | Why It Should Wait |
|---------|-------------------|
| **Full avatar uploads** | Moderation cost, performance unpredictability, copyright risk. Requires dedicated trust & safety team. |
| **Creator marketplace** | Requires payment rails, content policy, creator vetting, revenue splits, legal review. Post-PMF only. |
| **Battle pass** | Requires content production pipeline, 70+ items, consistent dev cadence. Premature before retention is proven. |
| **Advanced team modes** | Team balancing, matchmaking, and communication design are significant systems. Prove survival mode first. |
| **Ranked matchmaking** | Requires ELO system, rank decay, and large enough player pool. Not viable until DAU is established. |
| **Tournament system** | Bracket management, scheduling, prize handling. Complex. Post-PMF. |
| **Replay editor** | Storing match state for user-editable replays requires storage and a playback engine. High effort, medium value. |
| **Mobile support** | Controls are fundamentally different. Don't fragment focus during MVP. |
| **Proximity voice chat** | WebRTC audio is complex, laggy, and a harassment surface. Use emotes instead. |
| **Level editor** | Requires validation, moderation, and storage infrastructure. Year 2. |
| **Second game mode** | Build once the first mode has proven replay rate. |
| **Clan / social graph** | Friend lists and social feeds are their own product. Add after core retention established. |
| **Seasonal events** | Plan for first season in Month 3. Not a launch requirement. |

---

## 19. My Best Shippable Version

### The Exact MVP

**12–16 players. One game mode: collapsing hex tile survival. Last player standing wins. Matches last 90–180 seconds. Two maps. Full modular character builder with 8 presets and ~80 parts. Private lobbies via shareable link. Public matchmaking. Simple progression: cosmetic drops every 3 matches. 3 emotes. No voice chat. No mobile. Guest play supported for first match.**

That is the entire product. Everything else is noise until this is working and fun.

### The Exact Stack

```
TypeScript everywhere.

Frontend:     React + Vite + Three.js + @react-three/fiber
Physics:      Rapier (WASM) — server-authoritative, client for visual prediction
Multiplayer:  Colyseus on Node.js
REST API:     Fastify on Node.js
Database:     Supabase (Postgres + Auth + Storage)
CDN:          Cloudflare R2
Deploy:       Vercel (frontend) + Fly.io (game servers + API)
Analytics:    PostHog
```

### The First Mode to Prototype

**Workstream A, Tasks A1–A10. Start there. Day 1.**

Before any networking, before any character builder, before any UI — get a single player moving on a hex tile grid in a browser. Make tiles disappear when stepped on. Make the player fall when tiles are gone. Make the movement feel chunky and satisfying.

**If this isn't fun solo in 2 weeks, everything else is on hold until it is.**

### The First 30 Days of Execution

| Days | Focus | Goal |
|------|-------|------|
| 1–3 | Project scaffold (React + Vite + Three.js + Rapier) | Blank 3D canvas in browser, physics world running |
| 4–7 | Hex grid + tile state machine | Grid visible, tiles destructible |
| 8–12 | Player movement (WASD, jump, coyote time, dive) | Player moves on grid, tiles destroy underfoot |
| 13–14 | Movement parameter tuning | Movement passes the "fun solo" test |
| 15–17 | Add Colyseus, port physics to server | 2 players in same room |
| 18–21 | Client prediction + interpolation | 2-player movement feels smooth |
| 22–24 | Grab mechanic (server-validated) | Grab works in 2-player test |
| 25–27 | Elimination + round loop | Full round plays start to finish |
| 28–30 | Scale to 8-player test | 8 players in room, no critical bugs |

*Character builder development starts in parallel around Day 10*, with a second developer building 3D parts while lead developer works on netcode.

### The Biggest Overbuild Trap to Avoid

**Do not build the character builder before the gameplay is fun.**

The character builder is visually exciting, easy to show to people, and feels like progress. It is not the game. If you spend weeks building beautiful character customization and the movement on collapsing tiles isn't fun, you have nothing.

**The order is fixed:**
1. Tiles destroy (fun solo)
2. Multiplayer tiles destroy (fun together)
3. Character builder ships (identity + retention)

Every hour spent on the character builder before Step 1 is validated is borrowed time with high default risk.

The second biggest trap: **adding a second game mode before the first is proven.** One mode, done extremely well, is a better game than four modes done mediocrely.

---

## Pitch Appendix

**One-sentence pitch:**
*A browser-based multiplayer party game where you and 15 strangers waddle across a collapsing hex tile arena — last ridiculous custom character standing wins.*

**Investor-style pitch:**
Party games are one of the most viral game categories, but browser-based entries are virtually nonexistent at quality. We're building the first genuinely fun, instantly-shareable, link-joinable multiplayer party game for desktop browsers — combining a deceptively simple collapsing-tile survival mechanic with a deep character builder that makes every player a walking meme. No download, no install, no friction. Matches are 90 seconds. The share loop is built into the product. We're targeting 18–30 year-olds who game casually with friends on Discord — the same demographic that made Fall Guys and Stumble Guys billion-dollar properties.

**Technical summary for engineers:**
Full TypeScript stack: React + Three.js + @react-three/fiber on the client, Colyseus game rooms running on Node.js with server-authoritative Rapier (WASM) physics, Fastify REST API, Postgres via Supabase. Client sends 20 inputs/sec, server runs 60Hz physics ticks and broadcasts 20Hz state delta. Client-side prediction with 100ms interpolation buffer for remote players. Tile state is fully authoritative on server — clients have no write access to tile state. Character customization is purely visual (mesh + material) layered over a fixed physics capsule; the server has no knowledge of character appearance. Deployed on Fly.io (game servers, auto-scaling), Vercel (frontend), Cloudflare R2 (assets).

**Explanation for a non-technical founder:**
Imagine a multiplayer game that runs in your web browser like a website — no download, no app store, just click a link and play. Players create goofy-looking characters (fat blobs, lanky weirdos, robots in hats) and drop into an arena made of breakable tiles. The floor starts collapsing the second players step on it. You're jumping over gaps, pushing people off edges, and panicking as the ground disappears beneath you. The last person standing wins. A match lasts about two minutes, and everyone immediately wants to play again. The technology makes everyone's character look completely different and hilarious while ensuring the game is perfectly fair for everyone — appearance is purely visual, and the game engine treats all characters identically.
