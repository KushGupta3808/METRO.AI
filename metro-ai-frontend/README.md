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

## What's fully wired vs. stubbed

| Feature | Status |
|---|---|
| Routing, layout, protected routes | Done |
| Mobile nav (hamburger menu) | Done — the previous navbar hid links below `md` with no fallback; fixed |
| Intro video → loader → app boot sequence | Done — needs your video file, see below |
| Auth state (Zustand, persisted) | Done — UI complete; `authService.js` mocks the network call |
| Currency onboarding | Done, persisted |
| 3D loader | Done |
| Dashboard (full-width rate graph + stats, market feed, ambient network) | Done — `marketService.js` mocks `/market/*` |
| Compare engine | Done — calls your real `/api/v1/compare`, falls back to labeled sample data if the backend isn't running |
| Ledger / Recipients | Done — call your real endpoints, same sample-data fallback; ledger has a mobile card view instead of a squeezed table |
| Footer | Done |
| AI chatbot widget | UI + service layer done; `chatService.js` returns canned replies until `/api/v1/chat` exists |
| Error boundary | Done — a crash now shows a recover screen instead of a blank page |

Every stubbed service file has a comment at the top pointing at exactly which future endpoint
replaces the mock — the function signatures the rest of the app calls already match.

## Adding your intro video

Drop your file at `public/intro-video.mp4`. That's the only wiring needed — `IntroVideo.jsx`
autoplays it muted (required for autoplay on mobile browsers), with a mute toggle and a skip
button, then hands off to the loader and the app. It only plays once per browser session
(`sessionStorage`), not on every page refresh.

If the file isn't there, the `<video>` element's `error` event fires and the component skips
itself automatically — nothing breaks, you just go straight to the loader.

## Dashboard redesign

The rate graph is now full-width with a stat row (30D high/low/avg/change) instead of sharing
half the screen with a short bulletin list. Below it, `NewsFeed.jsx` replaces the old headline
list with card-style entries: tag, headline, summary, a source label, and a "Read more" link
that opens a real, relevant external page (a central bank, an economic calendar, the World
Bank's remittance page, etc.) in a new tab.

Thumbnails are gradient-and-icon placeholders in the brand palette, not hotlinked stock photos
— pulling arbitrary images from the web into a real product is a genuine reliability and
licensing risk. Each card already supports an optional `imageUrl` field: once `/market/bulletin`
returns real article thumbnails, drop the URL in and the card renders that image instead of the
placeholder automatically.

## Getting started

```bash
npm install
cp .env.example .env   # point this at your FastAPI backend
npm run dev
```

`npm run build` was run against this exact codebase before delivery — it compiles clean.

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
