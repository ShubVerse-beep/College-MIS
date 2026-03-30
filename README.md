# College MIS Backend

Express + MongoDB API for the College MIS application.

## Local Setup

1. Copy `.env.example` to `.env`.
2. Fill in MongoDB, JWT, and mail settings.
3. Run `npm install`.
4. Run `npm run dev`.

The API runs on `http://localhost:5000` by default and exposes health checks at `/api/v1/health`.

## Render Deploy

This folder is ready to be used as its own repo on Render.

1. Push this `backend/` folder as the root of your backend repo.
2. Create a Render Web Service from that repo, or use the included `render.yaml`.
3. Use:
   - Build command: `npm install`
   - Start command: `npm start`
   - Health check path: `/api/v1/health`
4. Add these environment variables in Render:
   - `NODE_ENV=production`
   - `MONGODB_URI=...`
   - `JWT_ACCESS_SECRET=...`
   - `JWT_REFRESH_SECRET=...`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `COOKIE_SECURE=true`
   - `COOKIE_SAME_SITE=none`

`FRONTEND_URLS` is optional and lets you add extra comma-separated origins if you also want preview deployments to work.

## Frontend Pairing

When your Vercel frontend is live, update `FRONTEND_URL` to that exact Vercel URL. Because auth uses cookies across different domains, production should keep `COOKIE_SECURE=true` and `COOKIE_SAME_SITE=none`.

If a browser blocks third-party cookies aggressively, cross-site login refresh can still be affected. The most reliable long-term setup is using the same site with custom subdomains, but Render + Vercel will now work with the correct cookie settings.
