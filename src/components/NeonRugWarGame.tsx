'use client'

import { CSSProperties, PointerEvent, useEffect, useRef, useState } from 'react'
import { HudSnapshot, NeonRugWarEngine, UpgradeId } from '@/lib/game/NeonRugWarEngine'

const initialHud: HudSnapshot = {
  phase: 'menu',
  wave: 1,
  rugHp: 140,
  rugMax: 140,
  playerHp: 100,
  score: 0,
  coins: 0,
  highScore: 0,
  combo: 0,
  threat: 0,
  enemies: 0,
  ammoMode: 'SINGLE',
  shoutReady: true,
  mineReady: true,
  dashReady: true,
  message: 'Defend the Persian rug.',
  upgrades: [],
}

const format = (n: number) => Math.floor(n).toLocaleString('en-US')
const pct = (value: number, max: number) => `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%`
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function NeonRugWarGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<NeonRugWarEngine | null>(null)
  const stickRef = useRef<HTMLDivElement | null>(null)
  const activeStickPointer = useRef<number | null>(null)
  const [hud, setHud] = useState<HudSnapshot>(initialHud)
  const [muted, setMuted] = useState(true)
  const [stickStyle, setStickStyle] = useState<CSSProperties>({ '--jx': '0px', '--jy': '0px' } as CSSProperties)
  const [mobileUrl, setMobileUrl] = useState('http://YOUR-PC-IP:3000')

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new NeonRugWarEngine(canvasRef.current, setHud)
    engineRef.current = engine

    const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'YOUR-PC-IP' : window.location.hostname
    setMobileUrl(`http://${host}:3000`)

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator && window.location.protocol !== 'file:') {
      navigator.serviceWorker.register(`${basePath}/sw.js`, { scope: `${basePath || ''}/` }).catch(() => undefined)
    }

    return () => {
      engine.dispose()
      engineRef.current = null
    }
  }, [])


  function startGame() {
    engineRef.current?.start()
  }

  function restartGame() {
    engineRef.current?.restart()
  }

  function nextWave() {
    engineRef.current?.nextWave()
  }

  function pauseGame() {
    engineRef.current?.togglePause()
  }

  function toggleMute() {
    const next = !muted
    setMuted(next)
    engineRef.current?.setMuted(next)
  }

  function buy(id: UpgradeId) {
    engineRef.current?.buyUpgrade(id)
  }

  function updateStick(ev: PointerEvent<HTMLDivElement>) {
    const el = stickRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const max = rect.width * 0.34
    const dx = ev.clientX - cx
    const dy = ev.clientY - cy
    const len = Math.hypot(dx, dy)
    const k = len > max ? max / len : 1
    const x = dx * k
    const y = dy * k
    engineRef.current?.setMoveAxis(x / max, y / max)
    setStickStyle({ '--jx': `${x}px`, '--jy': `${y}px` } as CSSProperties)
  }

  function stickDown(ev: PointerEvent<HTMLDivElement>) {
    ev.preventDefault()
    activeStickPointer.current = ev.pointerId
    ev.currentTarget.setPointerCapture(ev.pointerId)
    updateStick(ev)
  }

  function stickMove(ev: PointerEvent<HTMLDivElement>) {
    if (activeStickPointer.current !== ev.pointerId) return
    updateStick(ev)
  }

  function stickUp(ev: PointerEvent<HTMLDivElement>) {
    if (activeStickPointer.current !== ev.pointerId) return
    activeStickPointer.current = null
    engineRef.current?.setMoveAxis(0, 0)
    setStickStyle({ '--jx': '0px', '--jy': '0px' } as CSSProperties)
  }

  function pressButton(button: 'fire' | 'shout' | 'mine' | 'dash', down: boolean) {
    engineRef.current?.setButton(button, down)
  }

  return (
    <main className="gameShell">
      <canvas ref={canvasRef} className="gameCanvas" aria-label="Saman Neon Rug War game canvas" />

      <section className="topHud" aria-label="Game HUD">
        <div className="hudCard">
          <div className="hudLabel">Rug Core</div>
          <div className="hudValue">{Math.ceil(hud.rugHp)} / {Math.ceil(hud.rugMax)}</div>
          <div className="barOuter"><div className="barInner" style={{ width: pct(hud.rugHp, hud.rugMax) }} /></div>
        </div>
        <div className="hudCard">
          <div className="hudLabel">Wave</div>
          <div className="hudValue">{hud.wave} · {hud.enemies} left</div>
        </div>
        <div className="hudCard">
          <div className="hudLabel">Score</div>
          <div className="hudValue">{format(hud.score)}</div>
        </div>
        <div className="hudCard hideMobile">
          <div className="hudLabel">Money / Combo</div>
          <div className="hudValue">◎ {format(hud.coins)} · x{hud.combo}</div>
        </div>
        <button className="pauseButton" onClick={pauseGame}>{hud.phase === 'paused' ? 'PLAY' : 'PAUSE'}</button>
      </section>

      <section className="cornerPanel" aria-label="Status chips">
        <div className="chip">{hud.message}</div>
        <div className="chip">Threat {Math.round(hud.threat)}%</div>
        <div className="chip">{hud.ammoMode}</div>
        <div className="chip">Best {format(hud.highScore)}</div>
      </section>

      <section className="mobileControls" aria-label="Mobile controls">
        <div
          ref={stickRef}
          className="stickZone"
          onPointerDown={stickDown}
          onPointerMove={stickMove}
          onPointerUp={stickUp}
          onPointerCancel={stickUp}
        >
          <div className="stickKnob" style={stickStyle} />
        </div>

        <div className="actionCluster">
          <button
            className="actionButton big"
            onPointerDown={(e) => { e.preventDefault(); pressButton('fire', true) }}
            onPointerUp={(e) => { e.preventDefault(); pressButton('fire', false) }}
            onPointerCancel={() => pressButton('fire', false)}
          >
            Fire
          </button>
          <button
            className="actionButton"
            onPointerDown={(e) => { e.preventDefault(); pressButton('shout', true) }}
            onPointerUp={(e) => { e.preventDefault(); pressButton('shout', false) }}
            disabled={!hud.shoutReady}
          >
            Shout
          </button>
          <button
            className="actionButton"
            onPointerDown={(e) => { e.preventDefault(); pressButton('mine', true) }}
            onPointerUp={(e) => { e.preventDefault(); pressButton('mine', false) }}
            disabled={!hud.mineReady}
          >
            Mine
          </button>
          <button
            className="actionButton"
            onPointerDown={(e) => { e.preventDefault(); pressButton('dash', true) }}
            onPointerUp={(e) => { e.preventDefault(); pressButton('dash', false) }}
            disabled={!hud.dashReady}
          >
            Dash
          </button>
        </div>
      </section>

      {hud.phase === 'menu' && (
        <section className="startOverlay">
          <div className="startPanel">
            <div className="kicker">Universal Next.js Edition</div>
            <h1 className="title">Neon Rug War</h1>
            <p className="subtitle">
              Defend the sacred Persian rug from waves of shoes, drones, brutes, thieves, and boss attacks.
              Desktop uses keyboard/mouse. Mobile uses joystick, auto-aim fire, shout, mines, and dash.
            </p>
            <div className="featureGrid">
              <div className="feature">1–10 upgrade ladder: weapons, money engine, crits, turrets, drones, shields.</div>
              <div className="feature">Weapon evolution: split fire, explosive plasma, homing, chain lightning, rug storm.</div>
              <div className="feature">Phone-ready: joystick, action buttons, responsive canvas, installable PWA shell.</div>
            </div>
            <div className="buttonRow">
              <button className="primaryButton" onClick={startGame}>Start Chaos</button>
              <button className="primaryButton secondary" onClick={toggleMute}>{muted ? 'Sound Off' : 'Sound On'}</button>
            </div>
            <p className="subtitle" style={{ marginTop: 18 }}>
              Phone LAN URL after running on PC: <strong>{mobileUrl}</strong>
            </p>
          </div>
        </section>
      )}

      {hud.phase === 'paused' && (
        <section className="startOverlay">
          <div className="startPanel">
            <div className="kicker">Paused</div>
            <h2 className="title">Breathe, Boss</h2>
            <p className="subtitle">Controls: WASD/Arrows move, mouse aim, click shoot, Space shout, Q mine, Shift dash, P pause.</p>
            <div className="buttonRow">
              <button className="primaryButton" onClick={pauseGame}>Resume</button>
              <button className="primaryButton secondary" onClick={toggleMute}>{muted ? 'Sound Off' : 'Sound On'}</button>
              <button className="primaryButton secondary" onClick={restartGame}>Restart</button>
            </div>
          </div>
        </section>
      )}

      {hud.phase === 'shop' && (
        <section className="shopOverlay">
          <div className="shop">
            <div className="shopHeader">
              <div>
                <div className="kicker">Wave {hud.wave} Cleared</div>
                <h2 className="shopTitle">Upgrade Lab · 1 to 10 Levels</h2>
              </div>
              <div className="shopMeta">Coins ◎ {format(hud.coins)}</div>
            </div>
            <div className="upgradeGrid">
              {hud.upgrades.map((upgrade) => (
                <article className="upgradeCard" key={upgrade.id} style={{ '--upgrade-color': upgrade.color } as CSSProperties}>
                  <div className="upgradeTopline">
                    <h3>{upgrade.name}</h3>
                    <span className="shopMeta">Lv {upgrade.level}/{upgrade.max}</span>
                  </div>
                  <div className="levelTrack" aria-hidden="true">
                    {Array.from({ length: upgrade.max }).map((_, i) => (
                      <span className={i < upgrade.level ? 'levelPip on' : 'levelPip'} key={i} />
                    ))}
                  </div>
                  <div className="tierBadge">{upgrade.tier}</div>
                  <p>{upgrade.description}</p>
                  <button className="shopButton" disabled={!upgrade.canBuy} onClick={() => buy(upgrade.id)}>
                    {upgrade.level >= upgrade.max ? 'MAXED' : `Buy ◎ ${format(upgrade.cost)}`}
                  </button>
                </article>
              ))}
            </div>
            <div className="buttonRow" style={{ marginTop: 16 }}>
              <button className="primaryButton" onClick={nextWave}>Next Wave</button>
              <button className="primaryButton secondary" onClick={toggleMute}>{muted ? 'Sound Off' : 'Sound On'}</button>
            </div>
          </div>
        </section>
      )}

      {hud.phase === 'gameover' && (
        <section className="gameOverOverlay">
          <div className="startPanel">
            <div className="kicker">Game Over</div>
            <h2 className="title">Rug Report</h2>
            <p className="subtitle">
              Score {format(hud.score)} · Wave {hud.wave} · Best {format(hud.highScore)}. The shoes were disrespectful.
            </p>
            <div className="buttonRow">
              <button className="primaryButton" onClick={restartGame}>Run It Again</button>
              <button className="primaryButton secondary" onClick={toggleMute}>{muted ? 'Sound Off' : 'Sound On'}</button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
