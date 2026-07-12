# METRO AI — Frontend Scaffold

A working Vite + React build of the METRO AI master prompt: a dark, neon, AI-driven
cross-border remittance dashboard that talks to your existing FastAPI backend.

This is a real, runnable project — not a single-file chat preview — because the brief
called for React Router, Zustand, Framer Motion, and React Three Fiber, none of which are
available in Claude's in-chat live-preview sandbox. Run it locally to see the real thing.

## Stack

- **React 18 + Vite** — fast dev server, simple build
- **Tailwind CSS v3** — pinned to v3 for config stability (v4 changes the config format)
- **React Router v6** — routing, with auth + onboarding route guards
- **Zustand (+ persist)** — global auth and currency-preference state, persisted to
  localStorage so a refresh doesn't log you out or reset your corridor
- **Framer Motion** — page transitions, hover states, the loader sequence
- **React Three Fiber + drei** — the 3D loader globe and the ambient dashboard network
- **Recharts** — the rate graph, kept as a real 2D chart for accurate data, with a
  brand-colored glow/gradient treatment (true 3D axes trade readability for not much payoff)

## Brand

The palette is pulled straight from your logo, not invented: navy `#0E1A30` and green
`#0FB87F`/`#08976B`, sampled directly from the PNG. Amber and sapphire are the functional
accents the brief specifies for HOLD and neutral-AI states — they're not in the mark itself,
so they're kept a step back from the brand green.

The logo's navy line art has too little contrast to sit directly on a dark background, so
rather than faking transparency, it's shown on its native light background inside a small
white `brand-card` — a deliberate, common pattern for a light mark in a dark product.
`public/logo-full.png` (icon + wordmark) and `public/logo-icon.png` (mark only) were cropped
from your upload for this purpose.

## Getting started

```bash
npm install
cp .env.example .env   # point this at your FastAPI backend
npm run dev
```

`npm run build` was run against this exact codebase before delivery — it compiles clean.

## What's fully wired vs. stubbed

| Feature | Status |
|---|---|
| Routing, layout, protected routes | Done |
| Auth state (Zustand, persisted) | Done — UI complete; `authService.js` mocks the network call |
| Currency onboarding | Done, persisted |
| 3D loader | Done |
| Dashboard (bulletin, rate graph, network background) | Done — `marketService.js` mocks `/market/*` |
| Compare engine | Done — calls your real `/api/v1/compare`, falls back to labeled sample data if the backend isn't running |
| Ledger / Recipients | Done — call your real endpoints, same sample-data fallback |
| AI chatbot widget | UI + service layer done; `chatService.js` returns canned replies until `/api/v1/chat` exists |

Every stubbed service file has a comment at the top pointing at exactly which future endpoint
replaces the mock — the function signatures the rest of the app calls already match.

## Folder structure

```
src/
  store/       Zustand stores (auth, currency)
  services/    One file per backend resource - swap mocks for real fetches here
  components/  Grouped by feature (loader, dashboard, compare, chatbot, layout, common)
  pages/       One file per route
  router/      Route table + auth/onboarding guards
public/        logo-full.png, logo-icon.png, favicon.png - cropped from your upload
```

## Suggested next steps

1. Point `.env`'s `VITE_API_BASE_URL` at your running FastAPI server and confirm
   `/compare`, `/recipients`, `/transfers` return in the shapes the services expect.
2. Wire `RouteCard`'s selection state in `CompareEngine.jsx` to POST to `/api/v1/transfers`
   via `transfersService.createTransfer()` once you're ready to lock in a route.
3. Build the real `/auth/*`, `/market/bulletin`, `/market/graphs`, and `/chat` endpoints,
   then delete the mock logic in the matching service file — nothing else needs to change.
