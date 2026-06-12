# Jali frontend

React + TypeScript + Vite client for the Jali family tree app.

Full project docs, backend setup, and deployment: **[../README.md](../README.md)** and **[../DEPLOY.md](../DEPLOY.md)**.

## Quick start

```bash
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open http://localhost:5173 (backend must be running on the URL in `VITE_API_URL`, default `http://localhost:8080`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |

## Stack

- **React Router** — `/login`, `/signup`, `/tree`
- **Apollo Client** — GraphQL tree data and mutations
- **React Flow** — interactive family tree canvas
- **CSS modules** — component-scoped styles + shared `jali-theme.css`
