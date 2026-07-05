# Saman Neon Rug War Next v3

A universal Next.js version of the neon Persian rug defense game. It runs on desktop and mobile browser with one codebase.


## V3 upgrade systems

This version is a heavier arcade upgrade pass:

- Every upgrade path now goes from **level 1 to level 10**.
- New **Weapon Evolution** path: Single → Split Fire → Explosive → Homing → Chain Plasma → Rug Storm.
- New **Money Engine** path: better coin drops, coin value, and wave-clear bonus.
- New **Critical Slippers** path: crit chance, crit damage, white impact bursts.
- New **Orbit Drones** path: orbiting auto-fire guardians.
- New **Dash Engine** path: longer dash, shorter cooldown, invulnerability, shock blast at high levels.
- Stronger turrets, mines, shout, shield, regen, magnet, spread, damage, fire-rate, and speed.
- Bosses now have rage phases and spawn backup enemies as HP drops.
- Bullets can now splash, slow, home, pierce, crit, and chain-lightning.

## What changed from the static version

- Next.js App Router + TypeScript structure.
- Responsive canvas engine that adapts to desktop, phone portrait, and phone landscape.
- Mobile controls: left joystick, Fire, Shout, Mine, Dash.
- Desktop controls: WASD/Arrow keys, mouse aim, click fire, Space shout, Q mine, Shift dash, P pause.
- Smart enemy director: wave mix changes based on pressure, rug HP, and wave number.
- Boss waves every 5 waves.
- Enemy affixes: shielded, splitter, frenzy, toxic.
- Shop upgrades: damage, fire rate, speed, spread/pierce, magnet, mines, shout, turrets, shield, regen.
- Local high score saved in browser storage.
- PWA shell: manifest, icon, basic service worker cache.
- No database, Docker, login, API keys, or external services.

## Folder path for Windows

Use:

```powershell
C:\Projects\Saman\10-Learning\saman-neon-rug-war-next
```

## Run on Windows

```powershell
cd "C:\Projects\Saman\10-Learning\saman-neon-rug-war-next"
npm install
npm run dev
```

Open on the PC:

```text
http://localhost:3000
```

## Run with the included script

```powershell
cd "C:\Projects\Saman\10-Learning\saman-neon-rug-war-next"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\RUN_WINDOWS.ps1
```

The script prints your phone URL, usually like:

```text
http://192.168.1.25:3000
```

Open that URL on your phone while the PC and phone are on the same Wi-Fi.

## Run on Android Termux directly

```bash
cd ~/Saman/saman-neon-rug-war-next
chmod +x RUN_TERMUX.sh
./RUN_TERMUX.sh
```

Then open Chrome on the phone:

```text
http://localhost:3000
```

## Build test

```powershell
npm run typecheck
npm run build
npm run start
```

## Controls

Desktop:

```text
WASD / Arrow Keys = Move
Mouse = Aim
Left Click = Fire
Space = Uncle Shout AOE
Q = Tea Mine
Shift = Dash
P / Esc = Pause
```

Mobile:

```text
Left joystick = Move
Fire = auto-aim nearest enemy
Shout = AOE blast
Mine = drop tea mine
Dash = quick dodge in facing direction
```

## File structure

```text
saman-neon-rug-war-next/
  src/app/layout.tsx
  src/app/page.tsx
  src/app/globals.css
  src/components/NeonRugWarGame.tsx
  src/lib/game/NeonRugWarEngine.ts
  public/manifest.webmanifest
  public/icon.svg
  public/sw.js
  package.json
  next.config.ts
  tsconfig.json
  .env.example
  RUN_WINDOWS.ps1
  RUN_TERMUX.sh
  README.md
```

## Security notes

- This is local-only by default.
- It uses no secrets and no backend.
- When running with `-H 0.0.0.0`, devices on your LAN can access the dev server. That is fine at home, but do not expose it publicly.
- For public sharing, deploy it to Vercel or export/build it properly instead of opening your PC ports to the internet.

## Upgrade ideas

- Add online leaderboard with Supabase/Postgres.
- Add skins and unlockable weapons.
- Add map rooms and roguelike perks.
- Add multiplayer co-op.
- Add hand-tracking control mode from your MediaPipe base.


## V3.1 HOTFIX

Fixed a browser canvas `IndexSizeError` caused by player trail circles becoming negative after the trail grew longer than the old radius formula expected. Trail and HP ring radii are now clamped safely.

## GitHub Pages deploy

This project is ready for GitHub Pages through the included workflow:

```text
.github/workflows/pages.yml
```

The workflow builds the Next.js static export into `out/` and deploys that folder to GitHub Pages.

### First-time setup

1. Push the project to a public GitHub repository named:

```text
saman-neon-rug-war-next
```

2. Open the repository on GitHub.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to `main`, then open the **Actions** tab and wait for the deployment to finish.

Your URL will look like:

```text
https://YOUR-GITHUB-USERNAME.github.io/saman-neon-rug-war-next/
```

### Important

GitHub Pages serves project sites under `/repo-name/`, not `/`. The included `next.config.ts`, manifest, and service worker are patched for that path.
