export type GamePhase = 'menu' | 'playing' | 'shop' | 'paused' | 'gameover'

export type HudSnapshot = {
  phase: GamePhase
  wave: number
  rugHp: number
  rugMax: number
  playerHp: number
  score: number
  coins: number
  highScore: number
  combo: number
  threat: number
  enemies: number
  ammoMode: string
  shoutReady: boolean
  mineReady: boolean
  dashReady: boolean
  message: string
  upgrades: UpgradeView[]
}

export type UpgradeView = {
  id: UpgradeId
  name: string
  description: string
  tier: string
  color: string
  level: number
  max: number
  cost: number
  canBuy: boolean
}

export type UpgradeId =
  | 'damage'
  | 'rate'
  | 'weapon'
  | 'crit'
  | 'economy'
  | 'speed'
  | 'spread'
  | 'magnet'
  | 'mine'
  | 'shout'
  | 'turret'
  | 'drone'
  | 'shield'
  | 'regen'
  | 'dash'

type Vec = { x: number; y: number }
type FloatingText = { x: number; y: number; text: string; color: string; age: number; life: number; size: number }
type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number; age: number; color: string; glow: number }
type Coin = { x: number; y: number; vx: number; vy: number; value: number; age: number; life: number }
type Bullet = {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  life: number
  age: number
  damage: number
  pierce: number
  spin: number
  color: string
  splash: number
  homing: number
  chain: number
  slow: number
  critical: boolean
}
type Mine = { x: number; y: number; r: number; power: number; armed: number; age: number; life: number }
type Turret = { x: number; y: number; angle: number; cooldown: number; level: number }

type EnemyKind = 'sneaker' | 'runner' | 'brute' | 'drone' | 'thief' | 'boss'
type EnemyAffix = 'none' | 'shielded' | 'splitter' | 'frenzy' | 'toxic'
type Enemy = {
  id: number
  kind: EnemyKind
  affix: EnemyAffix
  name: string
  x: number
  y: number
  vx: number
  vy: number
  r: number
  hp: number
  maxHp: number
  speed: number
  damage: number
  reward: number
  score: number
  color: string
  phase: number
  hit: number
  slow: number
  biteCd: number
  boss: boolean
  shield: number
  split: number
  rage: number
}

type TouchButton = 'fire' | 'shout' | 'mine' | 'dash'

type InputState = {
  keys: Set<string>
  mouse: { x: number; y: number; down: boolean; active: boolean }
  move: Vec
  touchAim: Vec | null
  buttons: Record<TouchButton, boolean>
}

type AudioPack = {
  ctx: AudioContext
  master: GainNode
}

type UpgradeState = Record<UpgradeId, number>

const TAU = Math.PI * 2
const STORAGE_KEY = 'saman-neon-rug-war-next-save-v2'
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const dist2 = (ax: number, ay: number, bx: number, by: number) => {
  const dx = ax - bx
  const dy = ay - by
  return dx * dx + dy * dy
}
const mag = (x: number, y: number) => Math.hypot(x, y)
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const norm = (x: number, y: number): Vec => {
  const m = Math.hypot(x, y) || 1
  return { x: x / m, y: y / m }
}

const UPGRADE_META: Record<UpgradeId, { name: string; description: string; max: number; baseCost: number; scale: number; color: string }> = {
  damage: { name: 'Slipper Damage', description: '+9 damage each level. Lv10 turns hits into heavy rug justice.', max: 10, baseCost: 24, scale: 1.34, color: '#ff496d' },
  rate: { name: 'Fire Rate', description: 'Less cooldown every level. Lv10 becomes near bullet-hell.', max: 10, baseCost: 28, scale: 1.34, color: '#22e8ff' },
  weapon: { name: 'Weapon Evolution', description: 'Evolves SINGLE → SPLIT → PLASMA → HOMING → CHAIN → STORM.', max: 10, baseCost: 38, scale: 1.42, color: '#c084fc' },
  crit: { name: 'Critical Slippers', description: 'Adds crit chance and crit damage. Big white impact bursts.', max: 10, baseCost: 32, scale: 1.36, color: '#ffffff' },
  economy: { name: 'Money Engine', description: 'More coin value, wave bonus, and loot drops every level.', max: 10, baseCost: 22, scale: 1.33, color: '#ffd166' },
  speed: { name: 'Move Speed', description: 'Faster dodging and better mobile control.', max: 10, baseCost: 22, scale: 1.30, color: '#4dff9d' },
  spread: { name: 'Throw Pattern', description: 'Adds extra shots, wider arcs, and more pierce.', max: 10, baseCost: 34, scale: 1.38, color: '#ff2bd6' },
  magnet: { name: 'Coin Magnet', description: 'Pull coins from further away and faster.', max: 10, baseCost: 20, scale: 1.30, color: '#ffd166' },
  mine: { name: 'Tea Mines', description: 'Bigger mines, more mine slots, lower cooldown, stronger blasts.', max: 10, baseCost: 30, scale: 1.34, color: '#ffd166' },
  shout: { name: 'Uncle Shout', description: 'Bigger AOE blast, stun, knockback, and screen-shake power.', max: 10, baseCost: 32, scale: 1.34, color: '#ffdd88' },
  turret: { name: 'Rug Turrets', description: 'More turrets and stronger automatic defense around the rug.', max: 10, baseCost: 48, scale: 1.40, color: '#4dff9d' },
  drone: { name: 'Orbit Drones', description: 'Orbiting guardians fire automatically. Lv10 creates a kill halo.', max: 10, baseCost: 46, scale: 1.39, color: '#22e8ff' },
  shield: { name: 'Rug Shield', description: 'Adds rug max HP and emergency armor each wave.', max: 10, baseCost: 30, scale: 1.33, color: '#4dff9d' },
  regen: { name: 'Tea Regeneration', description: 'Recover rug HP between waves. Higher levels also heal you.', max: 10, baseCost: 26, scale: 1.32, color: '#4dff9d' },
  dash: { name: 'Dash Engine', description: 'Longer dash, lower cooldown, more invulnerability, shock trail.', max: 10, baseCost: 25, scale: 1.32, color: '#c084fc' },
}

export class NeonRugWarEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private onSnapshot: (snapshot: HudSnapshot) => void
  private width = 1280
  private height = 720
  private dpr = 1
  private frame = 0
  private last = 0
  private raf = 0
  private enemyId = 1
  private audio: AudioPack | null = null
  private muted = true
  private disposed = false

  private phase: GamePhase = 'menu'
  private previousPhase: GamePhase = 'menu'
  private wave = 1
  private score = 0
  private coins = 0
  private highScore = 0
  private combo = 0
  private comboTimer = 0
  private threat = 0
  private message = 'Defend the Persian rug.'
  private screenShake = 0
  private screenFlash = 0
  private hitStop = 0
  private waveBudget = 0
  private spawnTimer = 0
  private waveClearTimer = 0
  private bossIntro = 0
  private stormCd = 0
  private droneCd = 0
  private droneAngle = 0

  private upgrades: UpgradeState = this.emptyUpgrades()

  private player = {
    x: 640,
    y: 360,
    r: 17,
    hp: 100,
    maxHp: 100,
    angle: 0,
    shootCd: 0,
    shoutCd: 0,
    mineCd: 0,
    dashCd: 0,
    invulnerable: 0,
    trail: [] as Vec[],
  }

  private rug = {
    x: 640,
    y: 360,
    w: 330,
    h: 210,
    hp: 140,
    maxHp: 140,
    armor: 0,
    pulse: 0,
  }

  private input: InputState = {
    keys: new Set<string>(),
    mouse: { x: 640, y: 360, down: false, active: false },
    move: { x: 0, y: 0 },
    touchAim: null,
    buttons: { fire: false, shout: false, mine: false, dash: false },
  }

  private stars: Array<{ x: number; y: number; z: number; s: number; drift: number }> = []
  private enemies: Enemy[] = []
  private bullets: Bullet[] = []
  private particles: Particle[] = []
  private coinsDropped: Coin[] = []
  private mines: Mine[] = []
  private turrets: Turret[] = []
  private floating: FloatingText[] = []

  constructor(canvas: HTMLCanvasElement, onSnapshot: (snapshot: HudSnapshot) => void) {
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.canvas = canvas
    this.ctx = ctx
    this.onSnapshot = onSnapshot
    this.highScore = this.safeLoadHighScore()
    this.bindEvents()
    this.resize()
    this.seedStars()
    this.publish()
    this.raf = requestAnimationFrame(this.loop)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
    this.canvas.removeEventListener('pointermove', this.pointerMove)
    this.canvas.removeEventListener('pointerdown', this.pointerDown)
    window.removeEventListener('pointerup', this.pointerUp)
    window.removeEventListener('blur', this.onBlur)
  }

  start() {
    this.tryAudio()
    this.phase = 'playing'
    this.wave = 1
    this.score = 0
    this.coins = 0
    this.combo = 0
    this.comboTimer = 0
    this.threat = 0
    this.message = 'Wave 1. Protect the rug.'
    this.enemyId = 1
    this.upgrades = this.emptyUpgrades()
    this.stormCd = 0
    this.droneCd = 0
    this.droneAngle = 0
    this.player.x = this.width * 0.5
    this.player.y = this.height * 0.66
    this.player.hp = this.player.maxHp
    this.player.shootCd = 0
    this.player.shoutCd = 0
    this.player.mineCd = 0
    this.player.dashCd = 0
    this.player.invulnerable = 0
    this.player.trail = []
    this.rug.x = this.width * 0.5
    this.rug.y = this.height * 0.45
    this.rug.maxHp = 140
    this.rug.hp = this.rug.maxHp
    this.rug.armor = 0
    this.enemies = []
    this.bullets = []
    this.particles = []
    this.coinsDropped = []
    this.mines = []
    this.turrets = []
    this.floating = []
    this.createTurrets()
    this.startWave()
    this.publish()
  }

  togglePause() {
    if (this.phase === 'playing') {
      this.previousPhase = this.phase
      this.phase = 'paused'
      this.message = 'Paused.'
    } else if (this.phase === 'paused') {
      this.phase = this.previousPhase === 'menu' ? 'playing' : this.previousPhase
      this.message = 'Back to chaos.'
    }
    this.publish()
  }

  restart() {
    this.start()
  }

  nextWave() {
    if (this.phase !== 'shop') return
    this.wave += 1
    this.phase = 'playing'
    this.rug.maxHp = 140 + this.upgrades.shield * 38
    this.rug.hp = clamp(this.rug.hp + 18 + this.upgrades.regen * 20, 0, this.rug.maxHp)
    this.player.hp = clamp(this.player.hp + this.upgrades.regen * 2.2, 0, this.player.maxHp)
    this.rug.armor = this.upgrades.shield > 0 ? 18 + this.upgrades.shield * 12 : 0
    this.createTurrets()
    this.startWave()
    this.publish()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (!muted) this.tryAudio()
    if (this.audio) this.audio.master.gain.value = muted ? 0 : 0.18
  }

  getMuted() {
    return this.muted
  }

  setMoveAxis(x: number, y: number) {
    this.input.move = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) }
  }

  setTouchAim(x: number, y: number) {
    this.input.touchAim = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) }
  }

  clearTouchAim() {
    this.input.touchAim = null
  }

  setButton(button: TouchButton, down: boolean) {
    this.input.buttons[button] = down
    if (down) {
      if (button === 'shout') this.uncleShout()
      if (button === 'mine') this.dropMine()
      if (button === 'dash') this.dash()
      if (button === 'fire') this.tryAudio()
    }
  }

  buyUpgrade(id: UpgradeId) {
    if (this.phase !== 'shop') return
    const meta = UPGRADE_META[id]
    if (!meta) return
    const level = this.upgrades[id]
    if (level >= meta.max) return
    const cost = this.cost(id)
    if (this.coins < cost) {
      this.message = 'Not enough coins.'
      this.floatText('NEED MORE COINS', this.rug.x, this.rug.y - 130, '#ffd166', 22)
      this.publish()
      return
    }
    this.coins -= cost
    this.upgrades[id] += 1
    const newLevel = this.upgrades[id]
    this.message = `${meta.name} Lv ${newLevel}/10: ${this.upgradeTierName(id, newLevel)}`
    if (id === 'shield') {
      this.rug.maxHp = 140 + this.upgrades.shield * 38
      this.rug.hp = clamp(this.rug.hp + 34 + this.upgrades.shield * 4, 0, this.rug.maxHp)
      this.rug.armor = 18 + this.upgrades.shield * 12
    }
    if (id === 'regen') this.player.hp = clamp(this.player.hp + 6, 0, this.player.maxHp)
    if (id === 'turret') this.createTurrets()
    this.upgradeBurst(id, newLevel)
    this.beep(620 + newLevel * 42, 0.075, 'sine', 0.09)
    this.publish()
  }

  private loop = (time: number) => {
    if (this.disposed) return
    const dt = Math.min(0.033, Math.max(0, (time - this.last) / 1000 || 0.016))
    this.last = time
    this.frame++
    if (this.phase === 'playing') this.update(dt)
    else this.updateMenu(dt)
    this.render()
    if (this.frame % 6 === 0) this.publish()
    this.raf = requestAnimationFrame(this.loop)
  }

  private update(dtRaw: number) {
    let dt = dtRaw
    if (this.hitStop > 0) {
      this.hitStop -= dtRaw
      dt *= 0.16
    }
    this.screenShake = Math.max(0, this.screenShake - dtRaw * 34)
    this.screenFlash = Math.max(0, this.screenFlash - dtRaw * 2.8)
    this.bossIntro = Math.max(0, this.bossIntro - dtRaw)
    this.comboTimer = Math.max(0, this.comboTimer - dt)
    if (this.comboTimer <= 0) this.combo = 0

    this.updateInput(dt)
    this.updatePlayer(dt)
    this.updateWave(dt)
    this.updateTurrets(dt)
    this.updateBullets(dt)
    this.updateMines(dt)
    this.updateEnemies(dt)
    this.updateCoins(dt)
    this.updateParticles(dt)
    this.updateFloating(dt)
    this.checkWaveClear(dt)

    if (this.rug.hp <= 0 || this.player.hp <= 0) this.gameOver()
  }

  private updateMenu(dt: number) {
    this.screenShake = Math.max(0, this.screenShake - dt * 34)
    this.screenFlash = Math.max(0, this.screenFlash - dt * 2.8)
    this.updateParticles(dt)
    this.updateFloating(dt)
    if (this.frame % 8 === 0) {
      this.particles.push({
        x: rand(this.width * 0.15, this.width * 0.85),
        y: this.height + 20,
        vx: rand(-15, 15),
        vy: rand(-100, -30),
        r: rand(1, 3),
        life: rand(1, 2.4),
        age: 0,
        color: pick(['#22e8ff', '#ff2bd6', '#ffd166', '#4dff9d']),
        glow: 1,
      })
    }
  }

  private updateInput(dt: number) {
    const keyX = (this.input.keys.has('KeyD') || this.input.keys.has('ArrowRight') ? 1 : 0) - (this.input.keys.has('KeyA') || this.input.keys.has('ArrowLeft') ? 1 : 0)
    const keyY = (this.input.keys.has('KeyS') || this.input.keys.has('ArrowDown') ? 1 : 0) - (this.input.keys.has('KeyW') || this.input.keys.has('ArrowUp') ? 1 : 0)
    const moveX = Math.abs(this.input.move.x) > Math.abs(keyX) ? this.input.move.x : keyX
    const moveY = Math.abs(this.input.move.y) > Math.abs(keyY) ? this.input.move.y : keyY
    const n = mag(moveX, moveY) > 1 ? norm(moveX, moveY) : { x: moveX, y: moveY }
    const speed = 290 + this.upgrades.speed * 38 + this.upgrades.dash * 4
    this.player.x = clamp(this.player.x + n.x * speed * dt, this.player.r + 5, this.width - this.player.r - 5)
    this.player.y = clamp(this.player.y + n.y * speed * dt, this.player.r + 5, this.height - this.player.r - 5)

    if (this.input.touchAim && mag(this.input.touchAim.x, this.input.touchAim.y) > 0.1) {
      this.player.angle = Math.atan2(this.input.touchAim.y, this.input.touchAim.x)
    } else if (this.input.mouse.active) {
      this.player.angle = Math.atan2(this.input.mouse.y - this.player.y, this.input.mouse.x - this.player.x)
    } else {
      const target = this.nearestEnemy(this.player.x, this.player.y, 900)
      if (target) this.player.angle = Math.atan2(target.y - this.player.y, target.x - this.player.x)
    }

    if (this.input.keys.has('Space')) this.uncleShout()
    if (this.input.keys.has('KeyQ')) this.dropMine()
    if (this.input.keys.has('ShiftLeft') || this.input.keys.has('ShiftRight')) this.dash()
    if (this.input.mouse.down || this.input.buttons.fire) this.shoot()
    this.player.shootCd = Math.max(0, this.player.shootCd - dt)
    this.player.shoutCd = Math.max(0, this.player.shoutCd - dt)
    this.player.mineCd = Math.max(0, this.player.mineCd - dt)
    this.player.dashCd = Math.max(0, this.player.dashCd - dt)
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt)
    this.player.trail.unshift({ x: this.player.x, y: this.player.y })
    this.player.trail.length = Math.min(this.player.trail.length, 16 + this.upgrades.dash)
    this.updateDroneGuardians(dt)
    this.updateStormWeapon(dt)
  }

  private updatePlayer(dt: number) {
    for (const enemy of this.enemies) {
      if (dist2(enemy.x, enemy.y, this.player.x, this.player.y) < (enemy.r + this.player.r) ** 2) {
        if (this.player.invulnerable <= 0) {
          this.player.hp = clamp(this.player.hp - Math.max(4, enemy.damage * 0.45), 0, this.player.maxHp)
          this.player.invulnerable = 0.75
          this.screenShake = 12
          this.spark(this.player.x, this.player.y, '#ff496d', 16, 1.8)
          this.beep(140, 0.08, 'sawtooth', 0.08)
        }
        const away = norm(this.player.x - enemy.x, this.player.y - enemy.y)
        this.player.x = clamp(this.player.x + away.x * 180 * dt, this.player.r, this.width - this.player.r)
        this.player.y = clamp(this.player.y + away.y * 180 * dt, this.player.r, this.height - this.player.r)
      }
    }
  }

  private updateWave(dt: number) {
    if (this.waveBudget <= 0) return
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      const batch = this.wave >= 14 ? 3 : this.wave >= 8 ? 2 : this.wave >= 4 ? (Math.random() < 0.45 ? 2 : 1) : 1
      for (let i = 0; i < batch; i++) {
        if (this.waveBudget <= 0) break
        this.spawnEnemy(this.directorPickEnemy())
        this.waveBudget--
      }
      const pressure = clamp(this.threat / 100, 0, 1)
      this.spawnTimer = rand(0.38, 1.0) * (1 - pressure * 0.36) * Math.max(0.46, 1 - this.wave * 0.018)
    }
  }

  private updateTurrets(dt: number) {
    for (const turret of this.turrets) {
      turret.cooldown = Math.max(0, turret.cooldown - dt)
      const target = this.nearestEnemy(turret.x, turret.y, 560 + turret.level * 80)
      if (!target) continue
      turret.angle = Math.atan2(target.y - turret.y, target.x - turret.x)
      if (turret.cooldown <= 0) {
        const speed = 760 + turret.level * 70
        this.bullets.push({
          x: turret.x + Math.cos(turret.angle) * 18,
          y: turret.y + Math.sin(turret.angle) * 18,
          vx: Math.cos(turret.angle) * speed,
          vy: Math.sin(turret.angle) * speed,
          r: 5,
          life: 0.78,
          age: 0,
          damage: 12 + turret.level * 8 + this.upgrades.damage * 2,
          pierce: Math.floor(turret.level / 4),
          spin: 0,
          color: '#4dff9d',
          splash: turret.level >= 7 ? 42 + turret.level * 3 : 0,
          homing: turret.level >= 5 ? 0.16 : 0,
          chain: turret.level >= 9 ? 1 : 0,
          slow: turret.level >= 6 ? 0.28 : 0,
          critical: false,
        })
        turret.cooldown = Math.max(0.09, 0.52 - turret.level * 0.04)
        this.beep(820, 0.025, 'square', 0.025)
      }
    }
  }

  private updateBullets(dt: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]
      b.age += dt

      if (b.homing > 0) {
        const target = this.nearestEnemy(b.x, b.y, 480 + b.homing * 900)
        if (target) {
          const speed = Math.max(80, Math.hypot(b.vx, b.vy))
          const want = Math.atan2(target.y - b.y, target.x - b.x)
          const current = Math.atan2(b.vy, b.vx)
          let delta = want - current
          while (delta > Math.PI) delta -= TAU
          while (delta < -Math.PI) delta += TAU
          const next = current + clamp(delta, -b.homing, b.homing) * dt * 8
          b.vx = Math.cos(next) * speed
          b.vy = Math.sin(next) * speed
        }
      }

      b.x += b.vx * dt
      b.y += b.vy * dt
      b.spin += dt * (18 + this.upgrades.weapon)
      let remove = b.age >= b.life || b.x < -120 || b.y < -120 || b.x > this.width + 120 || b.y > this.height + 120
      for (const enemy of this.enemies) {
        if (remove) break
        if (dist2(b.x, b.y, enemy.x, enemy.y) < (b.r + enemy.r) ** 2) {
          this.damageEnemy(enemy, b.damage)
          if (b.slow > 0) enemy.slow = Math.max(enemy.slow, b.slow)
          this.spark(b.x, b.y, b.critical ? '#ffffff' : b.color, b.critical ? 18 : 8, b.critical ? 1.8 : 1)
          this.hitStop = Math.max(this.hitStop, b.critical ? 0.032 : 0.018)
          if (b.splash > 0) this.explode(b.x, b.y, b.splash, b.damage * 0.42, b.color)
          if (b.chain > 0) this.chainLightning(enemy, b.chain, b.damage * 0.56, b.color)
          if (b.pierce > 0) b.pierce--
          else remove = true
        }
      }
      if (remove) this.bullets.splice(i, 1)
    }
  }

  private updateMines(dt: number) {
    for (let i = this.mines.length - 1; i >= 0; i--) {
      const mine = this.mines[i]
      mine.age += dt
      mine.armed = Math.max(0, mine.armed - dt)
      const trigger = mine.armed <= 0 && this.enemies.some((enemy) => dist2(mine.x, mine.y, enemy.x, enemy.y) < (mine.r + enemy.r) ** 2)
      if (trigger || mine.age > mine.life) {
        this.explode(mine.x, mine.y, mine.r * 2.15, mine.power, '#ffd166')
        this.mines.splice(i, 1)
      }
    }
  }

  private updateEnemies(dt: number) {
    this.threat = lerp(this.threat, clamp(this.enemies.length * 5.5 + this.wave * 3, 0, 100), 0.04)

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i]
      e.hit = Math.max(0, e.hit - dt * 8)
      e.slow = Math.max(0, e.slow - dt)
      e.biteCd = Math.max(0, e.biteCd - dt)
      e.phase += dt * (e.kind === 'drone' ? 4 : 2)
      this.updateBossPhases(e)

      const tx = this.rug.x
      const ty = this.rug.y
      let angle = Math.atan2(ty - e.y, tx - e.x)
      if (e.kind === 'drone') angle += Math.sin(e.phase) * 0.55
      if (e.kind === 'thief') {
        const nearestCoin = this.nearestCoin(e.x, e.y, 500)
        if (nearestCoin) angle = Math.atan2(nearestCoin.y - e.y, nearestCoin.x - e.x)
      }
      const speedMod = e.slow > 0 ? 0.42 : 1
      e.vx = Math.cos(angle) * e.speed * speedMod
      e.vy = Math.sin(angle) * e.speed * speedMod
      e.x += e.vx * dt
      e.y += e.vy * dt

      const inRug = Math.abs(e.x - this.rug.x) < this.rug.w * 0.5 + e.r && Math.abs(e.y - this.rug.y) < this.rug.h * 0.5 + e.r
      if (inRug && e.biteCd <= 0) {
        const armorBlock = Math.min(this.rug.armor, e.damage * 0.7)
        this.rug.armor = Math.max(0, this.rug.armor - armorBlock)
        this.rug.hp = clamp(this.rug.hp - (e.damage - armorBlock), 0, this.rug.maxHp)
        e.biteCd = e.boss ? 0.52 : 0.82
        this.rug.pulse = 1
        this.screenShake = Math.max(this.screenShake, e.boss ? 20 : 9)
        this.spark(e.x, e.y, '#ff496d', e.boss ? 28 : 12, 1.5)
        this.floatText('-' + Math.ceil(e.damage - armorBlock), e.x, e.y - e.r, '#ff496d', e.boss ? 26 : 18)
        this.beep(e.boss ? 90 : 180, 0.08, 'sawtooth', 0.06)
      }

      if (e.hp <= 0) {
        this.killEnemy(e)
        this.enemies.splice(i, 1)
      }
    }
  }

  private updateCoins(dt: number) {
    const magnetRange = 100 + this.upgrades.magnet * 82 + this.upgrades.economy * 16
    for (let i = this.coinsDropped.length - 1; i >= 0; i--) {
      const c = this.coinsDropped[i]
      c.age += dt
      c.vx *= 0.965
      c.vy *= 0.965
      const d = Math.sqrt(dist2(c.x, c.y, this.player.x, this.player.y))
      if (d < magnetRange) {
        const pull = norm(this.player.x - c.x, this.player.y - c.y)
        const force = 800 * (1 - d / magnetRange)
        c.vx += pull.x * force * dt
        c.vy += pull.y * force * dt
      }
      c.x += c.vx * dt
      c.y += c.vy * dt
      if (d < this.player.r + 16) {
        const pickup = Math.ceil(c.value * (1 + this.upgrades.economy * 0.045))
        this.coins += pickup
        this.score += pickup * 8
        this.coinsDropped.splice(i, 1)
        this.beep(980, 0.035, 'sine', 0.035)
      } else if (c.age > c.life) {
        this.coinsDropped.splice(i, 1)
      }
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.age += dt
      p.vx *= 0.988
      p.vy *= 0.988
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.r *= 0.992
      if (p.age >= p.life) this.particles.splice(i, 1)
    }
  }

  private updateFloating(dt: number) {
    for (let i = this.floating.length - 1; i >= 0; i--) {
      const f = this.floating[i]
      f.age += dt
      f.y -= dt * 38
      if (f.age >= f.life) this.floating.splice(i, 1)
    }
  }

  private checkWaveClear(dt: number) {
    if (this.phase !== 'playing') return
    if (this.waveBudget <= 0 && this.enemies.length === 0) {
      this.waveClearTimer += dt
      if (this.waveClearTimer > 1.0) {
        this.phase = 'shop'
        const bonus = 30 + Math.floor(this.wave * 10 + this.rug.hp * 0.1 + this.upgrades.economy * 18 + this.combo * 1.5)
        this.coins += bonus
        this.score += bonus * 20
        this.message = `Wave ${this.wave} cleared. Upgrade before the next attack.`
        this.floatText(`WAVE CLEAR +${bonus}`, this.rug.x, this.rug.y - 160, '#4dff9d', 30)
        this.pulse(this.rug.x, this.rug.y, 250, '#4dff9d')
        this.beep(560, 0.13, 'sine', 0.08)
        this.publish()
      }
    } else {
      this.waveClearTimer = 0
    }
  }

  private startWave() {
    this.waveClearTimer = 0
    this.spawnTimer = 0.18
    this.waveBudget = Math.floor(10 + this.wave * 4.8 + Math.pow(this.wave, 1.26))
    if (this.wave % 5 === 0) {
      this.waveBudget += 6
      this.spawnEnemy('boss')
      this.bossIntro = 2
      this.screenShake = 22
      this.message = 'Boss wave. The Big Shoe has entered.'
    } else {
      this.message = `Wave ${this.wave}. Don't let them touch the rug.`
    }
    this.floatText(`WAVE ${this.wave}`, this.rug.x, Math.max(100, this.rug.y - 190), '#22e8ff', 42)
    this.pulse(this.rug.x, this.rug.y, 180, '#22e8ff')
  }

  private directorPickEnemy(): EnemyKind {
    if (this.wave % 5 === 0 && Math.random() < 0.05) return 'brute'
    const pool: EnemyKind[] = ['sneaker', 'sneaker', 'runner']
    if (this.wave >= 3) pool.push('brute')
    if (this.wave >= 4) pool.push('drone')
    if (this.wave >= 6) pool.push('runner', 'thief')
    if (this.wave >= 9) pool.push('brute', 'drone')
    if (this.threat < 38 && this.rug.hp > this.rug.maxHp * 0.55) pool.push('runner', 'brute')
    if (this.threat > 72 || this.rug.hp < this.rug.maxHp * 0.33) pool.push('sneaker', 'sneaker')
    return pick(pool)
  }

  private spawnEnemy(kind: EnemyKind) {
    const side = Math.floor(Math.random() * 4)
    let x = 0
    let y = 0
    if (side === 0) { x = rand(-80, this.width + 80); y = -70 }
    if (side === 1) { x = this.width + 70; y = rand(-80, this.height + 80) }
    if (side === 2) { x = rand(-80, this.width + 80); y = this.height + 70 }
    if (side === 3) { x = -70; y = rand(-80, this.height + 80) }
    const bp = this.blueprint(kind)
    const eliteChance = kind !== 'boss' ? clamp((this.wave - 3) * 0.028, 0, 0.32) : 0
    const affix: EnemyAffix = Math.random() < eliteChance ? pick(['shielded', 'splitter', 'frenzy', 'toxic']) : 'none'
    let hp = bp.hp
    let speed = bp.speed
    let shield = 0
    let split = 0
    if (affix === 'shielded') { hp *= 1.25; shield = hp * 0.35 }
    if (affix === 'frenzy') speed *= 1.24
    if (affix === 'splitter') split = 2
    if (affix === 'toxic') hp *= 0.9
    this.enemies.push({
      id: this.enemyId++,
      kind,
      affix,
      name: bp.name,
      x,
      y,
      vx: 0,
      vy: 0,
      r: bp.r,
      hp,
      maxHp: hp,
      speed,
      damage: bp.damage,
      reward: bp.reward,
      score: bp.score,
      color: bp.color,
      phase: rand(0, TAU),
      hit: 0,
      slow: 0,
      biteCd: 0,
      boss: kind === 'boss',
      shield,
      split,
      rage: 0,
    })
  }

  private blueprint(kind: EnemyKind) {
    const scale = 1 + this.wave * 0.075
    const values: Record<EnemyKind, { name: string; hp: number; speed: number; r: number; damage: number; reward: number; score: number; color: string }> = {
      sneaker: { name: 'Shoe Goblin', hp: 42 * scale, speed: 76 + this.wave * 2.4, r: 15, damage: 7, reward: 4, score: 70, color: '#ff2bd6' },
      runner: { name: 'Fast Auntie', hp: 28 * scale, speed: 132 + this.wave * 3.2, r: 12, damage: 5, reward: 5, score: 90, color: '#22e8ff' },
      brute: { name: 'Mud Brute', hp: 128 * scale, speed: 47 + this.wave * 1.8, r: 24, damage: 15, reward: 10, score: 170, color: '#ffd166' },
      drone: { name: 'Dust Drone', hp: 36 * scale, speed: 104 + this.wave * 2.4, r: 13, damage: 6, reward: 7, score: 110, color: '#4dff9d' },
      thief: { name: 'Coin Thief', hp: 58 * scale, speed: 118 + this.wave * 2.5, r: 14, damage: 4, reward: 12, score: 160, color: '#c084fc' },
      boss: { name: 'THE BIG SHOE', hp: 980 * (1 + this.wave * 0.13), speed: 36 + this.wave * 0.8, r: 52, damage: 34, reward: 90, score: 1800, color: '#ff496d' },
    }
    return values[kind]
  }

  private shoot() {
    if (this.player.shootCd > 0 || this.phase !== 'playing') return
    const target = !this.input.mouse.down && this.input.buttons.fire ? this.nearestEnemy(this.player.x, this.player.y, 9999) : null
    const a = target ? Math.atan2(target.y - this.player.y, target.x - this.player.x) : this.player.angle
    this.player.angle = a

    const weapon = this.upgrades.weapon
    const spread = this.upgrades.spread
    const critLevel = this.upgrades.crit
    const shotCount = clamp(1 + Math.floor(weapon / 2) + Math.floor(spread / 3), 1, 8)
    const arc = shotCount === 1 ? 0 : clamp(0.1 + shotCount * 0.085 + spread * 0.014, 0.16, 0.78)
    const baseDamage = 20 + this.upgrades.damage * 9 + weapon * 2.4
    const critChance = clamp(0.04 + critLevel * 0.036, 0, 0.46)
    const critMult = 1.65 + critLevel * 0.12
    const speed = 870 + this.upgrades.damage * 18 + weapon * 20
    const pierce = Math.floor(spread / 2) + Math.floor(weapon / 4)
    const splash = weapon >= 4 ? 32 + weapon * 7 : 0
    const homing = weapon >= 6 ? clamp(0.12 + weapon * 0.026, 0, 0.42) : 0
    const chain = weapon >= 8 ? 1 + Math.floor((weapon - 8) / 2) : 0
    const slow = weapon >= 5 ? 0.18 + weapon * 0.025 : 0
    const color = this.weaponColor(weapon)

    for (let i = 0; i < shotCount; i++) {
      const t = shotCount === 1 ? 0 : i / (shotCount - 1) - 0.5
      const angle = a + t * arc + rand(-0.012, 0.012)
      const critical = Math.random() < critChance
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 23,
        y: this.player.y + Math.sin(angle) * 23,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: critical ? 9 + weapon * 0.18 : 7.2 + weapon * 0.16,
        life: 0.82 + weapon * 0.035,
        age: 0,
        damage: baseDamage * (critical ? critMult : 1),
        pierce,
        spin: 0,
        color: critical ? '#ffffff' : color,
        splash: critical ? splash * 1.28 : splash,
        homing,
        chain: critical ? chain + 1 : chain,
        slow,
        critical,
      })
    }

    this.player.shootCd = Math.max(0.052, 0.23 - this.upgrades.rate * 0.017 - weapon * 0.004)
    this.spark(this.player.x, this.player.y, color, 5 + Math.ceil(weapon / 2), 1 + weapon * 0.05)
    this.beep(430 + this.upgrades.rate * 24 + weapon * 18, 0.028, weapon >= 7 ? 'sawtooth' : 'triangle', 0.045)
  }

  private uncleShout() {
    if (this.player.shoutCd > 0 || this.phase !== 'playing') return
    const radius = 170 + this.upgrades.shout * 38
    const power = 70 + this.upgrades.shout * 27
    this.player.shoutCd = Math.max(2.15, 7.2 - this.upgrades.shout * 0.48)
    this.screenShake = 20
    this.screenFlash = 0.42
    this.pulse(this.player.x, this.player.y, radius, '#ffd166')
    this.spark(this.player.x, this.player.y, '#ffd166', 55, 2.4)
    for (const enemy of this.enemies) {
      const d = Math.sqrt(dist2(enemy.x, enemy.y, this.player.x, this.player.y))
      if (d < radius) {
        const falloff = 1 - d / radius
        this.damageEnemy(enemy, power * (0.55 + falloff))
        enemy.slow = Math.max(enemy.slow, 1.1 + this.upgrades.shout * 0.12)
        const away = norm(enemy.x - this.player.x, enemy.y - this.player.y)
        enemy.x += away.x * 24 * falloff
        enemy.y += away.y * 24 * falloff
      }
    }
    this.floatText('UNCLE SHOUT', this.player.x, this.player.y - 55, '#ffd166', 24)
    this.beep(92, 0.18, 'sawtooth', 0.1)
  }

  private dropMine() {
    if (this.player.mineCd > 0 || this.phase !== 'playing') return
    const cap = 2 + Math.floor(this.upgrades.mine / 2)
    if (this.mines.length >= cap) this.mines.shift()
    this.mines.push({
      x: this.player.x,
      y: this.player.y,
      r: 42 + this.upgrades.mine * 8,
      power: 82 + this.upgrades.mine * 28,
      armed: 0.36,
      age: 0,
      life: 12,
    })
    this.player.mineCd = Math.max(1.75, 6.1 - this.upgrades.mine * 0.48)
    this.floatText('TEA MINE', this.player.x, this.player.y - 36, '#ffd166', 18)
    this.beep(260, 0.07, 'square', 0.05)
  }

  private dash() {
    if (this.player.dashCd > 0 || this.phase !== 'playing') return
    const vx = Math.cos(this.player.angle)
    const vy = Math.sin(this.player.angle)
    const dashDistance = 128 + this.upgrades.dash * 18
    this.player.x = clamp(this.player.x + vx * dashDistance, this.player.r, this.width - this.player.r)
    this.player.y = clamp(this.player.y + vy * dashDistance, this.player.r, this.height - this.player.r)
    this.player.dashCd = Math.max(1.55, 3.6 - this.upgrades.dash * 0.18)
    this.player.invulnerable = Math.max(this.player.invulnerable, 0.25 + this.upgrades.dash * 0.035)
    if (this.upgrades.dash >= 5) this.explode(this.player.x, this.player.y, 70 + this.upgrades.dash * 8, 18 + this.upgrades.dash * 6, '#c084fc')
    this.spark(this.player.x, this.player.y, '#c084fc', 24 + this.upgrades.dash * 2, 2)
    this.pulse(this.player.x, this.player.y, 100, '#c084fc')
    this.beep(760, 0.05, 'sine', 0.06)
  }

  private explode(x: number, y: number, radius: number, damage: number, color: string) {
    this.pulse(x, y, radius, color)
    this.spark(x, y, color, 44, 2.2)
    this.screenShake = Math.max(this.screenShake, 18)
    this.screenFlash = Math.max(this.screenFlash, 0.18)
    for (const enemy of this.enemies) {
      const d = Math.sqrt(dist2(x, y, enemy.x, enemy.y))
      if (d < radius) {
        const falloff = 1 - d / radius
        this.damageEnemy(enemy, damage * (0.4 + falloff))
        enemy.slow = Math.max(enemy.slow, 1.25)
      }
    }
    this.beep(110, 0.12, 'triangle', 0.1)
  }

  private damageEnemy(enemy: Enemy, amount: number) {
    let dmg = amount
    if (enemy.shield > 0) {
      const blocked = Math.min(enemy.shield, dmg * 0.75)
      enemy.shield -= blocked
      dmg -= blocked * 0.55
    }
    enemy.hp -= dmg
    enemy.hit = 1
    if (enemy.affix === 'toxic' && Math.random() < 0.08) {
      this.spark(enemy.x, enemy.y, '#4dff9d', 3, 0.8)
    }
  }

  private killEnemy(enemy: Enemy) {
    const comboMul = 1 + Math.min(3.6, this.combo * 0.035) + this.upgrades.economy * 0.018
    const gained = Math.floor(enemy.score * comboMul)
    this.score += gained
    this.combo += 1
    this.comboTimer = 2.2
    this.floatText(`+${gained}`, enemy.x, enemy.y - enemy.r, enemy.color, enemy.boss ? 26 : 17)
    const drops = (enemy.boss ? 18 : enemy.kind === 'brute' ? 4 : 2) + Math.floor(this.upgrades.economy / 3)
    for (let i = 0; i < drops; i++) this.dropCoin(enemy.x, enemy.y, Math.ceil((enemy.reward + this.upgrades.economy * 0.8) / Math.max(1, drops / 2)))
    this.spark(enemy.x, enemy.y, enemy.color, enemy.boss ? 80 : 20, enemy.boss ? 3 : 1.5)
    this.pulse(enemy.x, enemy.y, enemy.boss ? 220 : 75, enemy.color)
    this.beep(enemy.boss ? 180 : 650, enemy.boss ? 0.22 : 0.045, enemy.boss ? 'sawtooth' : 'sine', enemy.boss ? 0.12 : 0.04)
    if (enemy.affix === 'splitter' && enemy.split > 0 && enemy.kind !== 'boss') {
      for (let i = 0; i < enemy.split; i++) {
        const child = this.blueprint('runner')
        this.enemies.push({
          id: this.enemyId++,
          kind: 'runner',
          affix: 'none',
          name: 'Split Shoe',
          x: enemy.x + rand(-18, 18),
          y: enemy.y + rand(-18, 18),
          vx: 0,
          vy: 0,
          r: 10,
          hp: child.hp * 0.55,
          maxHp: child.hp * 0.55,
          speed: child.speed * 1.12,
          damage: child.damage,
          reward: 2,
          score: 40,
          color: '#ff2bd6',
          phase: rand(0, TAU),
          hit: 0,
          slow: 0,
          biteCd: 0,
          boss: false,
          shield: 0,
          split: 0,
          rage: 0,
        })
      }
    }
  }

  private dropCoin(x: number, y: number, value: number) {
    const a = rand(0, TAU)
    const speed = rand(70, 230)
    const boosted = Math.ceil(value * (1 + this.upgrades.economy * 0.12))
    this.coinsDropped.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, value: boosted, age: 0, life: 10 + this.upgrades.magnet * 0.35 })
  }

  private createTurrets() {
    this.turrets = []
    const level = this.upgrades.turret
    if (level <= 0) return
    const slots = Math.min(6, Math.ceil(level / 1.7))
    for (let i = 0; i < slots; i++) {
      const a = -Math.PI / 2 + (i - (slots - 1) / 2) * clamp(0.86 - level * 0.025, 0.58, 0.92)
      const rx = this.rug.w * 0.52
      const ry = this.rug.h * 0.58
      this.turrets.push({
        x: this.rug.x + Math.cos(a) * rx,
        y: this.rug.y + Math.sin(a) * ry,
        angle: -Math.PI / 2,
        cooldown: rand(0.1, 0.5),
        level,
      })
    }
  }

  private updateDroneGuardians(dt: number) {
    const level = this.upgrades.drone
    if (level <= 0 || this.phase !== 'playing') return
    this.droneAngle += dt * (1.6 + level * 0.12)
    this.droneCd = Math.max(0, this.droneCd - dt)
    const count = Math.min(6, Math.ceil(level / 2))
    if (this.droneCd <= 0) {
      for (let i = 0; i < count; i++) {
        const a = this.droneAngle + (i / count) * TAU
        const x = this.player.x + Math.cos(a) * (54 + level * 4)
        const y = this.player.y + Math.sin(a) * (54 + level * 4)
        const target = this.nearestEnemy(x, y, 620 + level * 28)
        if (!target) continue
        const aim = Math.atan2(target.y - y, target.x - x)
        const speed = 720 + level * 32
        this.bullets.push({
          x,
          y,
          vx: Math.cos(aim) * speed,
          vy: Math.sin(aim) * speed,
          r: 4.8 + level * 0.18,
          life: 0.72 + level * 0.03,
          age: 0,
          damage: 10 + level * 5 + this.upgrades.damage * 1.4,
          pierce: level >= 6 ? 1 : 0,
          spin: 0,
          color: '#22e8ff',
          splash: level >= 8 ? 30 + level * 3 : 0,
          homing: level >= 4 ? 0.12 + level * 0.012 : 0,
          chain: level >= 10 ? 1 : 0,
          slow: level >= 5 ? 0.18 : 0,
          critical: false,
        })
      }
      this.droneCd = Math.max(0.12, 0.58 - level * 0.035)
    }
  }

  private updateStormWeapon(dt: number) {
    if (this.upgrades.weapon < 10 || this.phase !== 'playing') return
    this.stormCd = Math.max(0, this.stormCd - dt)
    if (this.stormCd > 0) return
    const count = 10
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * TAU + this.frame * 0.015
      this.bullets.push({
        x: this.player.x + Math.cos(angle) * 18,
        y: this.player.y + Math.sin(angle) * 18,
        vx: Math.cos(angle) * 610,
        vy: Math.sin(angle) * 610,
        r: 6.5,
        life: 0.92,
        age: 0,
        damage: 22 + this.upgrades.damage * 3,
        pierce: 1,
        spin: 0,
        color: '#c084fc',
        splash: 44,
        homing: 0.16,
        chain: 1,
        slow: 0.18,
        critical: false,
      })
    }
    this.stormCd = 0.82
    this.pulse(this.player.x, this.player.y, 92, '#c084fc')
  }

  private updateBossPhases(e: Enemy) {
    if (!e.boss) return
    const hpPct = e.hp / Math.max(1, e.maxHp)
    if (hpPct < 0.66 && e.rage < 1) {
      e.rage = 1
      e.speed *= 1.14
      this.message = 'Boss rage phase one. Shoes incoming.'
      this.floatText('BOSS RAGE I', e.x, e.y - e.r - 25, '#ffd166', 30)
      this.pulse(e.x, e.y, 220, '#ffd166')
      for (let i = 0; i < 5; i++) this.spawnEnemy(i % 2 === 0 ? 'runner' : 'drone')
    }
    if (hpPct < 0.33 && e.rage < 2) {
      e.rage = 2
      e.damage *= 1.2
      e.speed *= 1.12
      this.message = 'Boss final phase. Finish it.'
      this.floatText('FINAL PHASE', e.x, e.y - e.r - 25, '#ff496d', 34)
      this.explode(e.x, e.y, 210, 36 + this.wave * 3, '#ff496d')
      for (let i = 0; i < 6; i++) this.spawnEnemy(i % 3 === 0 ? 'brute' : 'runner')
    }
  }

  private chainLightning(origin: Enemy, jumps: number, damage: number, color: string) {
    let current = origin
    const hit = new Set<number>([origin.id])
    for (let i = 0; i < jumps; i++) {
      let next: Enemy | null = null
      let bestD = 210 * 210
      for (const enemy of this.enemies) {
        if (hit.has(enemy.id)) continue
        const d = dist2(current.x, current.y, enemy.x, enemy.y)
        if (d < bestD) {
          bestD = d
          next = enemy
        }
      }
      if (!next) break
      this.damageEnemy(next, damage * Math.pow(0.78, i))
      next.slow = Math.max(next.slow, 0.32)
      this.spark(next.x, next.y, color, 10, 1.25)
      this.lightning(current.x, current.y, next.x, next.y, color)
      hit.add(next.id)
      current = next
    }
  }

  private lightning(x1: number, y1: number, x2: number, y2: number, color: string) {
    const steps = 7
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      this.particles.push({
        x: lerp(x1, x2, t) + rand(-8, 8),
        y: lerp(y1, y2, t) + rand(-8, 8),
        vx: rand(-15, 15),
        vy: rand(-15, 15),
        r: rand(2, 4),
        life: 0.18,
        age: 0,
        color,
        glow: 2,
      })
    }
  }

  private nearestEnemy(x: number, y: number, range: number): Enemy | null {
    let best: Enemy | null = null
    let bestD = range * range
    for (const enemy of this.enemies) {
      const d = dist2(x, y, enemy.x, enemy.y)
      if (d < bestD) {
        best = enemy
        bestD = d
      }
    }
    return best
  }

  private nearestCoin(x: number, y: number, range: number): Coin | null {
    let best: Coin | null = null
    let bestD = range * range
    for (const coin of this.coinsDropped) {
      const d = dist2(x, y, coin.x, coin.y)
      if (d < bestD) {
        best = coin
        bestD = d
      }
    }
    return best
  }

  private gameOver() {
    this.phase = 'gameover'
    this.message = this.rug.hp <= 0 ? 'The rug has fallen.' : 'You got overwhelmed.'
    this.screenShake = 34
    this.screenFlash = 0.72
    this.pulse(this.rug.x, this.rug.y, 350, '#ff496d')
    this.spark(this.rug.x, this.rug.y, '#ff496d', 120, 4)
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.safeSaveHighScore()
      this.message = 'New high score. The rug remembers.'
    }
    this.publish()
  }

  private cost(id: UpgradeId) {
    const meta = UPGRADE_META[id]
    const level = this.upgrades[id]
    return Math.floor(meta.baseCost * Math.pow(meta.scale, level) + level * 4)
  }

  private getUpgradeViews(): UpgradeView[] {
    return (Object.keys(UPGRADE_META) as UpgradeId[]).map((id) => {
      const meta = UPGRADE_META[id]
      const level = this.upgrades[id]
      const cost = this.cost(id)
      return {
        id,
        name: meta.name,
        description: meta.description,
        tier: this.upgradeTierName(id, level),
        color: meta.color,
        level,
        max: meta.max,
        cost,
        canBuy: level < meta.max && this.coins >= cost,
      }
    })
  }

  private publish() {
    const snapshot: HudSnapshot = {
      phase: this.phase,
      wave: this.wave,
      rugHp: Math.max(0, this.rug.hp),
      rugMax: this.rug.maxHp,
      playerHp: Math.max(0, this.player.hp),
      score: this.score,
      coins: this.coins,
      highScore: this.highScore,
      combo: this.combo,
      threat: this.threat,
      enemies: this.enemies.length + this.waveBudget,
      ammoMode: this.weaponTierLabel(),
      shoutReady: this.player.shoutCd <= 0,
      mineReady: this.player.mineCd <= 0,
      dashReady: this.player.dashCd <= 0,
      message: this.message,
      upgrades: this.getUpgradeViews(),
    }
    this.onSnapshot(snapshot)
  }

  private render() {
    const ctx = this.ctx
    const shakeX = this.screenShake > 0 ? rand(-this.screenShake, this.screenShake) : 0
    const shakeY = this.screenShake > 0 ? rand(-this.screenShake, this.screenShake) : 0
    ctx.save()
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.clearRect(0, 0, this.width, this.height)
    ctx.translate(shakeX, shakeY)
    this.drawBackground(ctx)
    this.drawRug(ctx)
    this.drawMines(ctx)
    this.drawTurrets(ctx)
    this.drawCoins(ctx)
    this.drawBullets(ctx)
    this.drawEnemies(ctx)
    this.drawDrones(ctx)
    this.drawPlayer(ctx)
    this.drawParticles(ctx)
    this.drawFloating(ctx)
    if (this.bossIntro > 0) this.drawBossIntro(ctx)
    if (this.screenFlash > 0) {
      ctx.globalAlpha = this.screenFlash * 0.28
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-80, -80, this.width + 160, this.height + 160)
    }
    ctx.restore()
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const grd = ctx.createRadialGradient(this.width * 0.5, this.height * 0.45, 0, this.width * 0.5, this.height * 0.45, Math.max(this.width, this.height) * 0.9)
    grd.addColorStop(0, '#111a36')
    grd.addColorStop(0.45, '#070b18')
    grd.addColorStop(1, '#02030a')
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.save()
    ctx.globalAlpha = 0.42
    for (const s of this.stars) {
      s.y += 0.05 * s.z + s.drift
      if (s.y > this.height + 4) s.y = -4
      ctx.fillStyle = s.z > 0.65 ? '#22e8ff' : '#b8dfff'
      ctx.globalAlpha = 0.18 + s.z * 0.45
      ctx.fillRect(s.x, s.y, s.s, s.s)
    }
    ctx.restore()

    const grid = 64
    ctx.save()
    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(34, 232, 255, 0.055)'
    for (let x = (this.frame * -0.23) % grid; x < this.width; x += grid) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, this.height)
      ctx.stroke()
    }
    for (let y = (this.frame * -0.12) % grid; y < this.height; y += grid) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.width, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawRug(ctx: CanvasRenderingContext2D) {
    const pulse = this.rug.pulse
    this.rug.pulse = Math.max(0, this.rug.pulse - 0.045)
    ctx.save()
    ctx.translate(this.rug.x, this.rug.y)
    ctx.shadowBlur = 30 + pulse * 30
    ctx.shadowColor = pulse > 0 ? '#ff496d' : '#22e8ff'
    const gradient = ctx.createLinearGradient(-this.rug.w / 2, -this.rug.h / 2, this.rug.w / 2, this.rug.h / 2)
    gradient.addColorStop(0, '#1b0d26')
    gradient.addColorStop(0.45, '#4d123d')
    gradient.addColorStop(1, '#0c2748')
    ctx.fillStyle = gradient
    this.roundRect(ctx, -this.rug.w / 2, -this.rug.h / 2, this.rug.w, this.rug.h, 26)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.strokeStyle = '#ffd166'
    ctx.lineWidth = 5
    this.roundRect(ctx, -this.rug.w / 2 + 8, -this.rug.h / 2 + 8, this.rug.w - 16, this.rug.h - 16, 20)
    ctx.stroke()
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(34,232,255,0.55)'
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath()
      ctx.moveTo(i * 28, -this.rug.h / 2 + 20)
      ctx.lineTo(-i * 28, this.rug.h / 2 - 20)
      ctx.stroke()
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.font = '900 23px Consolas, monospace'
    ctx.textAlign = 'center'
    ctx.fillText('SACRED RUG CORE', 0, 8)
    if (this.rug.armor > 0) {
      ctx.strokeStyle = 'rgba(77,255,157,0.55)'
      ctx.lineWidth = 8
      this.roundRect(ctx, -this.rug.w / 2 - 8, -this.rug.h / 2 - 8, this.rug.w + 16, this.rug.h + 16, 32)
      ctx.stroke()
    }
    ctx.restore()
  }

  private drawDrones(ctx: CanvasRenderingContext2D) {
    const level = this.upgrades.drone
    if (level <= 0) return
    const count = Math.min(6, Math.ceil(level / 2))
    for (let i = 0; i < count; i++) {
      const a = this.droneAngle + (i / count) * TAU
      const x = this.player.x + Math.cos(a) * (54 + level * 4)
      const y = this.player.y + Math.sin(a) * (54 + level * 4)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a + this.frame * 0.04)
      ctx.shadowBlur = 20
      ctx.shadowColor = '#22e8ff'
      ctx.fillStyle = 'rgba(34,232,255,0.22)'
      ctx.strokeStyle = '#22e8ff'
      ctx.lineWidth = 2
      this.roundRect(ctx, -11, -7, 22, 14, 6)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    ctx.save()
    for (let i = this.player.trail.length - 1; i >= 0; i--) {
      const t = this.player.trail[i]
      ctx.globalAlpha = (1 - i / this.player.trail.length) * 0.16
      ctx.fillStyle = '#22e8ff'
      ctx.beginPath()
      ctx.arc(t.x, t.y, Math.max(0.5, this.player.r * (1 - i / Math.max(1, this.player.trail.length))), 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.translate(this.player.x, this.player.y)
    ctx.rotate(this.player.angle)
    ctx.shadowBlur = 22
    ctx.shadowColor = this.player.invulnerable > 0 ? '#ffd166' : '#22e8ff'
    ctx.fillStyle = this.player.invulnerable > 0 ? '#ffd166' : '#eaf8ff'
    ctx.beginPath()
    ctx.moveTo(27, 0)
    ctx.lineTo(-14, -17)
    ctx.lineTo(-7, 0)
    ctx.lineTo(-14, 17)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#22e8ff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.rotate(-this.player.angle)
    ctx.shadowBlur = 0
    ctx.strokeStyle = 'rgba(34,232,255,0.35)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, Math.max(1, this.player.r + 8), -Math.PI / 2, -Math.PI / 2 + TAU * clamp(this.player.hp / Math.max(1, this.player.maxHp), 0, 1))
    ctx.stroke()
    ctx.restore()
  }

  private drawEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save()
      ctx.translate(e.x, e.y)
      ctx.rotate(e.phase * 0.4)
      ctx.globalAlpha = e.hit > 0 ? 0.72 : 1
      ctx.shadowBlur = e.boss ? 32 : 20
      ctx.shadowColor = e.color
      ctx.fillStyle = e.hit > 0 ? '#ffffff' : e.color
      if (e.kind === 'runner') {
        ctx.beginPath()
        ctx.moveTo(e.r, 0)
        ctx.lineTo(-e.r * 0.8, -e.r * 0.72)
        ctx.lineTo(-e.r * 0.5, 0)
        ctx.lineTo(-e.r * 0.8, e.r * 0.72)
        ctx.closePath()
        ctx.fill()
      } else if (e.kind === 'brute' || e.kind === 'boss') {
        this.roundRect(ctx, -e.r * 1.1, -e.r * 0.72, e.r * 2.2, e.r * 1.44, e.r * 0.35)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'
        ctx.lineWidth = e.boss ? 4 : 2
        ctx.stroke()
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, e.r, 0, TAU)
        ctx.fill()
      }
      if (e.affix !== 'none') {
        ctx.shadowBlur = 12
        ctx.strokeStyle = e.affix === 'shielded' ? '#4dff9d' : e.affix === 'splitter' ? '#ff2bd6' : e.affix === 'frenzy' ? '#ffd166' : '#22e8ff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(0, 0, e.r + 8 + Math.sin(e.phase * 2) * 2, 0, TAU)
        ctx.stroke()
      }
      ctx.shadowBlur = 0
      const hpPct = clamp(e.hp / e.maxHp, 0, 1)
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(-e.r, -e.r - 14, e.r * 2, 4)
      ctx.fillStyle = e.shield > 0 ? '#4dff9d' : '#ff496d'
      ctx.fillRect(-e.r, -e.r - 14, e.r * 2 * hpPct, 4)
      ctx.restore()
    }
  }

  private drawBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(Math.atan2(b.vy, b.vx) + Math.sin(b.spin) * 0.7)
      ctx.shadowBlur = b.critical ? 30 : b.splash > 0 ? 24 : 18
      ctx.shadowColor = b.color
      ctx.fillStyle = b.color
      if (b.chain > 0) {
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.arc(0, 0, b.r * 1.85, 0, TAU)
        ctx.strokeStyle = b.color
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      this.roundRect(ctx, -b.r, -b.r * 0.55, b.r * (b.critical ? 3.2 : 2.5), b.r * 1.1, 4)
      ctx.fill()
      if (b.splash > 0) {
        ctx.globalAlpha = 0.18
        ctx.strokeStyle = b.color
        ctx.beginPath()
        ctx.arc(0, 0, Math.min(30, b.splash * 0.32), 0, TAU)
        ctx.stroke()
      }
      ctx.restore()
    }
  }

  private drawMines(ctx: CanvasRenderingContext2D) {
    for (const mine of this.mines) {
      ctx.save()
      ctx.globalAlpha = mine.armed > 0 ? 0.5 : 0.9
      ctx.strokeStyle = '#ffd166'
      ctx.fillStyle = 'rgba(255,209,102,0.12)'
      ctx.shadowBlur = 18
      ctx.shadowColor = '#ffd166'
      ctx.beginPath()
      ctx.arc(mine.x, mine.y, mine.r, 0, TAU)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ffd166'
      ctx.beginPath()
      ctx.arc(mine.x, mine.y, 7 + Math.sin(this.frame * 0.2) * 2, 0, TAU)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawTurrets(ctx: CanvasRenderingContext2D) {
    for (const turret of this.turrets) {
      ctx.save()
      ctx.translate(turret.x, turret.y)
      ctx.rotate(turret.angle)
      ctx.shadowBlur = 22
      ctx.shadowColor = '#4dff9d'
      ctx.fillStyle = '#102a22'
      ctx.strokeStyle = '#4dff9d'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 17, 0, TAU)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#4dff9d'
      this.roundRect(ctx, 5, -4, 28, 8, 4)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawCoins(ctx: CanvasRenderingContext2D) {
    for (const coin of this.coinsDropped) {
      ctx.save()
      ctx.globalAlpha = 1 - clamp((coin.age - coin.life + 1.5) / 1.5, 0, 1)
      ctx.shadowBlur = 14
      ctx.shadowColor = '#ffd166'
      ctx.fillStyle = '#ffd166'
      ctx.beginPath()
      ctx.arc(coin.x, coin.y, 6 + Math.sin(this.frame * 0.2 + coin.x) * 1.4, 0, TAU)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const t = 1 - p.age / p.life
      ctx.save()
      ctx.globalAlpha = clamp(t, 0, 1)
      ctx.shadowBlur = 18 * p.glow
      ctx.shadowColor = p.color
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, Math.max(0.4, p.r * t), 0, TAU)
      ctx.fill()
      ctx.restore()
    }
  }

  private drawFloating(ctx: CanvasRenderingContext2D) {
    for (const f of this.floating) {
      const t = 1 - f.age / f.life
      ctx.save()
      ctx.globalAlpha = clamp(t, 0, 1)
      ctx.fillStyle = f.color
      ctx.shadowBlur = 14
      ctx.shadowColor = f.color
      ctx.font = `900 ${f.size}px Consolas, monospace`
      ctx.textAlign = 'center'
      ctx.fillText(f.text, f.x, f.y)
      ctx.restore()
    }
  }

  private drawBossIntro(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalAlpha = clamp(this.bossIntro / 2, 0, 1)
    ctx.fillStyle = 'rgba(255, 73, 109, 0.16)'
    ctx.fillRect(0, this.height * 0.42, this.width, 90)
    ctx.fillStyle = '#ff496d'
    ctx.shadowBlur = 28
    ctx.shadowColor = '#ff496d'
    ctx.font = `1000 ${Math.min(56, this.width / 14)}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('THE BIG SHOE IS HERE', this.width / 2, this.height * 0.42 + 58)
    ctx.restore()
  }

  private spark(x: number, y: number, color: string, count = 8, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU)
      const speed = rand(45, 260) * power
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: rand(1.2, 4.6) * power,
        life: rand(0.28, 0.85),
        age: 0,
        color,
        glow: power,
      })
    }
  }

  private pulse(x: number, y: number, radius: number, color: string) {
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU
      const speed = radius * rand(0.9, 1.2)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: rand(2, 5),
        life: rand(0.35, 0.7),
        age: 0,
        color,
        glow: 1.6,
      })
    }
  }

  private floatText(text: string, x: number, y: number, color: string, size: number) {
    this.floating.push({ x, y, text, color, size, age: 0, life: 1.25 })
  }

  private seedStars() {
    this.stars = []
    for (let i = 0; i < 210; i++) {
      this.stars.push({ x: Math.random() * this.width, y: Math.random() * this.height, z: rand(0.15, 1), s: rand(0.6, 2.4), drift: rand(0, 0.08) })
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
  }

  private emptyUpgrades(): UpgradeState {
    return {
      damage: 0,
      rate: 0,
      weapon: 0,
      crit: 0,
      economy: 0,
      speed: 0,
      spread: 0,
      magnet: 0,
      mine: 0,
      shout: 0,
      turret: 0,
      drone: 0,
      shield: 0,
      regen: 0,
      dash: 0,
    }
  }

  private weaponColor(level: number) {
    if (level >= 10) return '#c084fc'
    if (level >= 8) return '#ff2bd6'
    if (level >= 6) return '#4dff9d'
    if (level >= 4) return '#ffd166'
    if (level >= 2) return '#22e8ff'
    return '#9be7ff'
  }

  private weaponTierLabel() {
    const level = this.upgrades.weapon
    if (level >= 10) return 'RUG STORM'
    if (level >= 8) return 'CHAIN PLASMA'
    if (level >= 6) return 'HOMING'
    if (level >= 4) return 'EXPLOSIVE'
    if (level >= 2) return 'SPLIT FIRE'
    return this.upgrades.spread >= 3 ? 'TRIPLE' : this.upgrades.spread >= 1 ? 'DOUBLE' : 'SINGLE'
  }

  private upgradeTierName(id: UpgradeId, level: number) {
    if (level <= 0) return 'Locked'
    if (id === 'weapon') {
      const names = ['Single', 'Double Split', 'Triad', 'Piercer', 'Explosive', 'Cryo Plasma', 'Homing', 'Heavy Homing', 'Chain Shock', 'Chain Plasma', 'Rug Storm']
      return names[clamp(level, 0, 10)]
    }
    if (id === 'economy' && level >= 10) return 'Money Printer'
    if (id === 'drone' && level >= 10) return 'Kill Halo'
    if (id === 'dash' && level >= 10) return 'Ghost Dash'
    if (level >= 10) return 'Godmode'
    if (level >= 7) return 'Elite'
    if (level >= 4) return 'Advanced'
    return 'Basic'
  }

  private upgradeBurst(id: UpgradeId, level: number) {
    const meta = UPGRADE_META[id]
    const color = meta.color
    const x = id === 'speed' || id === 'dash' || id === 'weapon' || id === 'crit' || id === 'drone' ? this.player.x : this.rug.x
    const y = id === 'speed' || id === 'dash' || id === 'weapon' || id === 'crit' || id === 'drone' ? this.player.y : this.rug.y
    this.pulse(x, y, 120 + level * 11, color)
    this.spark(x, y, color, 22 + level * 4, 1.2 + level * 0.08)
    this.screenFlash = Math.max(this.screenFlash, 0.12 + level * 0.018)
    this.screenShake = Math.max(this.screenShake, 6 + level * 0.75)
    if (level === 10) {
      this.floatText('MAX LEVEL', x, y - 80, color, 32)
      this.pulse(x, y, 270, color)
    }
  }

  private bindEvents() {
    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.keyDown)
    window.addEventListener('keyup', this.keyUp)
    this.canvas.addEventListener('pointermove', this.pointerMove)
    this.canvas.addEventListener('pointerdown', this.pointerDown)
    window.addEventListener('pointerup', this.pointerUp)
    window.addEventListener('blur', this.onBlur)
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    this.width = Math.max(320, rect.width || window.innerWidth)
    this.height = Math.max(240, rect.height || window.innerHeight)
    this.dpr = Math.min(2, window.devicePixelRatio || 1)
    this.canvas.width = Math.floor(this.width * this.dpr)
    this.canvas.height = Math.floor(this.height * this.dpr)
    this.rug.x = this.width * 0.5
    this.rug.y = this.height < 600 ? this.height * 0.48 : this.height * 0.45
    this.rug.w = clamp(this.width * 0.28, 230, 360)
    this.rug.h = clamp(this.height * 0.24, 150, 230)
    this.player.x = clamp(this.player.x, this.player.r + 5, this.width - this.player.r - 5)
    this.player.y = clamp(this.player.y, this.player.r + 5, this.height - this.player.r - 5)
    this.createTurrets()
    this.seedStars()
  }

  private pointerMove = (ev: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect()
    this.input.mouse.x = (ev.clientX - rect.left) * (this.width / rect.width)
    this.input.mouse.y = (ev.clientY - rect.top) * (this.height / rect.height)
    this.input.mouse.active = ev.pointerType !== 'touch'
  }

  private pointerDown = (ev: PointerEvent) => {
    if (ev.pointerType !== 'touch') {
      this.input.mouse.down = true
      this.pointerMove(ev)
      this.tryAudio()
    }
  }

  private pointerUp = () => {
    this.input.mouse.down = false
  }

  private keyDown = (ev: KeyboardEvent) => {
    if (ev.code === 'KeyP' || ev.code === 'Escape') {
      ev.preventDefault()
      this.togglePause()
      return
    }
    this.input.keys.add(ev.code)
  }

  private keyUp = (ev: KeyboardEvent) => {
    this.input.keys.delete(ev.code)
  }

  private onBlur = () => {
    this.input.keys.clear()
    this.input.mouse.down = false
    this.input.move = { x: 0, y: 0 }
    this.input.buttons = { fire: false, shout: false, mine: false, dash: false }
    if (this.phase === 'playing') this.togglePause()
  }

  private tryAudio() {
    if (this.audio || typeof window === 'undefined') return
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) return
    const ctx = new AudioCtor()
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 0.18
    master.connect(ctx.destination)
    this.audio = { ctx, master }
  }

  private beep(freq: number, duration: number, type: OscillatorType, gain: number) {
    if (this.muted) return
    this.tryAudio()
    if (!this.audio) return
    const { ctx, master } = this.audio
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    g.gain.value = gain
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(g)
    g.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  }

  private safeLoadHighScore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return 0
      const parsed = JSON.parse(saved) as { highScore?: number }
      return Number(parsed.highScore || 0)
    } catch {
      return 0
    }
  }

  private safeSaveHighScore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore: this.highScore, savedAt: new Date().toISOString() }))
    } catch {
      // ignore private-mode storage failures
    }
  }
}
