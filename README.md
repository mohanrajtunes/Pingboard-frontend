# PingBoard — frontend

The web app for [PingBoard](https://github.com/mohanrajtunes/Pingboard-backend), an uptime monitor: it checks your websites on a schedule, waits for a second failed check, then emails you once when something is down and once when it's back.

**Live demo:** _add your Vercel link here_ · **Backend repo:** [Pingboard-backend](https://github.com/mohanrajtunes/Pingboard-backend)

## What it does

- **Monitors:** add any public URL, pick an interval (1 to 60 minutes) and the expected status code.
- **Incidents:** two failed checks in a row open an incident; the next good check closes it. Each incident has a start, an end and a duration.
- **Charts:** uptime and response time per monitor over 24 hours, 7 days or 30 days, with incidents marked on the line.
- **Email alerts:** one email when a site goes down, one when it recovers.
- **Public status page:** a shareable page showing which of your systems are up, without revealing their addresses.
- **Landing page:** a working simulation of a monitor you can break and fix, light and dark mode.

## Stack

React 18 · Vite · React Router · Axios (JWT login with refresh) · GSAP + ScrollTrigger · Lenis smooth scroll · plain CSS with light/dark tokens

The backend is Django REST Framework + PostgreSQL, with Celery/Redis or an external scheduler for the checks.

## Run it locally

You need Node 18+ and the backend running on port 8000 (see the backend README).

```bash
npm install
cp .env.example .env      # on Windows: copy .env.example .env
npm run dev
```

Open http://localhost:5173.

`.env` holds one value:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

## Build and deploy

```bash
npm run build      # outputs to dist/
npm run preview    # serves the production build locally
```

Deployed on Vercel. Set `VITE_API_URL` to your backend's `/api` URL in the project settings. `vercel.json` rewrites every path to `index.html` so refreshing `/app` works.

## Project layout

```
src/
  pages/        Landing, Auth (login/register), Dashboard, MonitorDetail, StatusPageSettings, PublicStatus
  components/   Shell (sidebar), ui (charts, status), Fragments, LiquidMark
  lib/          api client with token refresh, auth context, theme (light/dark), formatters
  landing.css   landing page styles
  app.css       app + auth styles
  index.css     shared tokens and components
```

## Notes

- The landing page's demo is a simulation: one check per second stands for one minute. No real site is being probed.
- Fonts: Bricolage Grotesque and JetBrains Mono, bundled via Fontsource (no external font requests).

Built by [Mohanraj S](https://github.com/mohanrajtunes).
