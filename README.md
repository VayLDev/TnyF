# Tiny Frontier

A first-person, low-poly island survival prototype. The gameplay core is written in Rust and compiled to WebAssembly; Next.js provides the web shell and server-side integration points; Three.js renders the island.

## Requirements
- Node.js 20 or newer (Node 22 recommended)
- npm 10+
- Rust stable and `wasm32-unknown-unknown` target
- `wasm-pack`
- A browser with WebGL support

## Run locally
From the repository root:
```bash
npm install
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
npm run dev
```
The `predev` script builds the Rust crate to `apps/web/wasm/` before starting Next.js. Generated WASM files are build artifacts and are intentionally git-ignored.

Production build:
```bash
npm run build
npm run start
```

## Controls
- `W A S D` — move
- Mouse — look around (click the game to capture the pointer)
- `Space` — jump
- `Shift` — sprint
- `E` — gather nearby resources
- `I` or `Tab` — inventory
- `1`–`5` — select hotbar slot
- Touch devices — on-screen movement, look and action controls

## Environment
Copy `apps/web/.env.example` to `apps/web/.env.local` and set `MONGODB_URI` and optionally `MONGODB_DB`. Keep database credentials server-side; do not prefix them with `NEXT_PUBLIC_`.

## Current implementation status
Included: procedural island terrain and ocean, trees/rocks/resource nodes, first-person movement and jumping, mouse/touch controls, day/night lighting, gathering, inventory/hotbar HUD, and a Rust/WASM survival-state core (health, hunger, thirst, stamina, body temperature).

Not yet implemented: full crafting/building, wildlife and combat, chunk streaming, complete weather simulation, Android packaging, Montenyon authentication, and owner-scoped cloud saves. The `/api/worlds` endpoint intentionally returns HTTP 501 until server-side Montenyon session verification and per-user authorization are implemented. Do not expose it as a production save API yet.

The GitHub Actions workflow checks the Rust/WASM build and Next.js production build on pushes and pull requests. A successful CI run is the source of truth for build readiness.
