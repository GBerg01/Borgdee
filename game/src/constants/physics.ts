// Movement
export const RUN_SPEED = 7.0
export const ACCEL = 0.18
export const DECEL = 0.12
export const TURN_SPEED_DEG = 270

// Jump
export const JUMP_HEIGHT = 3.5
export const JUMP_VELOCITY = 9.5        // initial upward impulse
export const GRAVITY_ASCENT = 18        // m/s² while rising
export const GRAVITY_DESCENT = 26       // m/s² while falling
export const COYOTE_TIME_MS = 120
export const JUMP_BUFFER_MS = 100

// Air control
export const AIR_CONTROL = 0.6

// Dive
export const DIVE_HORIZONTAL = 4.0
export const DIVE_DURATION_S = 0.4
export const DIVE_RECOVERY_S = 0.4
export const DIVE_COOLDOWN_S = 0.8

// Grab
export const GRAB_RANGE = 1.2
export const GRAB_MAX_HOLD_S = 1.5
export const GRAB_SPEED_MULT = 0.6
export const GRAB_COOLDOWN_S = 0.6

// Collision / bumping
export const BUMP_THRESHOLD = 5.0
export const STUMBLE_DURATION_S = 0.4
export const STUMBLE_SPEED_MULT = 0.5

// Capsule dimensions (gameplay — never changes)
export const CAPSULE_RADIUS = 0.5
export const CAPSULE_HEIGHT = 1.8

// Tile destruction timings (seconds)
export const TILE_WARN_S = 0.4
export const TILE_FLASH_S = 0.6
export const TILE_DROP_S = 0.5
export const TILE_SAFE_GRACE_S = 2.0   // starting tile grace period

// Fall elimination threshold
export const FALL_Y = -3.0
