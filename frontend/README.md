# FoodBridge — Frontend (React + TypeScript + Vite)

## Run it

```bash
npm install
npm run dev
```

Opens on <http://localhost:5173>. The backend must be running on port 8000 —
`vite.config.ts` proxies `/api` to it, which keeps the browser on one origin
so the httpOnly refresh cookie is treated as first-party.

## Structure

```
src/
├── components/     presentational pieces (ListingCard, RequestList, …)
├── context/        AuthContext — session state, backed by localStorage
├── hooks/          useListings, useRequests — fetching and local state
├── layouts/        AppLayout — nav shell shared by every signed-in page
├── pages/          one folder per route
├── services/api.ts every HTTP call in the app, plus the auth interceptors
├── types/          shapes mirroring the backend response schemas
└── ui/primitives/  UiButton, UiTextInput, UiSelect, …
```

## Two things worth knowing

**All HTTP goes through `services/api.ts`.** Components never import axios.
A URL or payload change is a one-line edit in one file.

**The response interceptor refreshes tokens silently.** When any request
returns 401, it calls `/auth/refresh`, stores the new access token, and
replays the original request. Concurrent failures are queued so five 401s
trigger one refresh, not five.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | dev server with hot reload |
| `npm run build` | typecheck then production build |
| `npm run preview` | serve the production build locally |
| `npm run lint` | ESLint |
