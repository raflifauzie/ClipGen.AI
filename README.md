# ClipGen.AI

Generate videos from the Veo models with a small React + TypeScript + Vite front end.

## Requirements

- Node.js 20 or newer
- A Google AI API key with access to the Veo models (create one in [Google AI Studio](https://aistudio.google.com/apikey))

## Run locally

```bash
npm install
npm run dev
```

Open the URL that Vite prints (default <http://127.0.0.1:3000>).

The dev server binds to loopback only. Set `DEV_HOST=0.0.0.0` when you really need access from another device.

## Where the API key comes from

The key is **never bundled into the build**. You can provide it in two ways:

1. Paste it into the app. It is kept in `sessionStorage`, so it disappears when the tab closes.
2. For local development only, put it in `.env.local` as `VITE_GEMINI_API_KEY`. Anything in a `VITE_` variable ends up in the
   browser bundle, so never use a production key this way.

```bash
cp .env.example .env.local
```

For a public deployment you need a backend that holds the key and proxies the API. That is infrastructure work and is not
part of this repository yet.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type check, then build for production |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | `tsc --noEmit` with strict mode enabled |
| `npm run lint` | ESLint over the whole project |
| `npm run test` | Run the unit tests with Vitest |
| `npm run check` | Type check, lint and test in one go |

## Project structure

```
src/
  App.tsx                 composition and app level state
  main.tsx                entry point, mounts the error boundary
  components/             presentational components
  hooks/                  useApiKey, useHistory, useVideoGeneration, useOutsideClick
  services/               API client, request builder, polling, IndexedDB storage
  utils/                  base64, audio decoding, credit maths
  *.test.ts               unit tests for the pure logic
```

## What is stored where

- The API key: `sessionStorage` in the browser tab, never sent to a server by this app.
- The generation history: IndexedDB in the browser, so it survives a reload. Videos are stored as blobs and object URLs
  are revoked when an entry is deleted.
- The local profile (name and email): `localStorage`. It is a label for your history, not a sign-in.

## Known limitations

- Checkout and real accounts are not implemented. The pricing panel shows the price list but cannot take payments.
- There is no backend, so there is no server side quota, no rate limiting and no shared history.
- Downloading a finished video sends the API key as a query parameter, because that is what the file endpoint expects.
  A backend proxy removes that need.
