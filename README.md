# CRM frontend

Responsive React/JSX frontend with Tailwind CSS. The default API base is `/api/v1`, which works through the included Nginx same-origin proxy and through the Vite development proxy.

## Run locally

```powershell
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Set `VITE_API_BASE_URL` in `.env.local` only when the API is served at a different origin/path. For a separate development backend, set `VITE_DEV_API_PROXY` in the Vite process environment; the default target is `http://localhost:8080`.

Production build: `npm run build`; preview: `npm run preview`. For Docker deployment, `VITE_API_BASE_URL` is injected at image build time and should normally remain `/api/v1` behind the included Nginx proxy. This value is public and must not contain secrets.

The project currently uses JavaScript/JSX and has no separate lint or test script configured.
