# THE KINGDOM'S VOICE (TKV)

Application web (PWA) pour explorer la foi : Bible Strong, agent IA, cellules mondiales (chat + visio), communauté, cours, bibliothèque, carte du Royaume.

## Démarrage rapide (local)

```bash
npm install
npm run dev          # frontend → http://localhost:5173
npm run dev:api      # API Express → http://localhost:3001
```

Copiez `.env.example` vers `.env` et renseignez Supabase + OpenAI. Pour la visio locale, voir `docs/JITSI_INSTALL_WINDOWS.md` et `jitsi-local-credentials.txt`.

## Déploiement

- **Production** : [https://tkv-app.vercel.app](https://tkv-app.vercel.app)
- Guide : `DEPLOY_VERCEL.md`
- Variables d'environnement : dashboard Vercel (équipe **ae-mindset**, projet **tkv-app**)

## API (routes principales)

| Route | Description |
|-------|-------------|
| `GET /api/health` | Santé API |
| `GET /api/jitsi/status` | Visio disponible |
| `POST /api/jitsi/join` | URL visio (JWT) |
| `POST /api/agent/chat` | Agent IA |
| `POST /api/agent/perspectives` | Perspectives |
| `POST /api/tts` | Synthèse vocale |

## Base de données (Supabase)

Exécuter les scripts SQL dans cet ordre :

1. `supabase_init.sql`
2. `supabase_migration_v3.sql`
3. `supabase_cells.sql`
4. `supabase_community_patch.sql`
5. `supabase_community_antispam.sql` (anti-flood + anti-doublon côté serveur)
6. `supabase_community_delete.sql` (suppression de ses propres posts)
7. `supabase_friends.sql` (demandes d’ami + présence + alertes in-app)
8. `supabase_friend_chat.sql` (chat privé entre amis)
9. `supabase_map_patch.sql`
10. `supabase_pgvector.sql`
11. `supabase_security_patch.sql` (réactions communauté + quota IA en lecture seule côté client)

Agent RAG (optionnel) : `npm run ingest:knowledge:embed` puis `npm run upload:chunks`.

## Structure

- `src/` — React (pages, composants, i18n)
- `server/` — API Express
- `api/` — handler Vercel (serverless)
- `public/bible/` — chapitres Bible (JSON)
- `docs/` — Jitsi, sécurité

## Scripts utiles

| Commande | Usage |
|----------|--------|
| `npm run build` | Build production (Vite) |
| `npm run build:bible` | Régénérer Bible Strong (local, Windows) |
| `npm run ingest:knowledge` | Préparer chunks RAG |
| `npm run lint` | ESLint |
