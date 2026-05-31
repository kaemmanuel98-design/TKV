# THE KINGDOM'S VOICE (TKV)

Application web (PWA) pour explorer la foi : Bible Strong, agent IA, cellules mondiales (chat), communauté, cours, bibliothèque, carte du Royaume.

## Démarrage rapide (local)

```bash
npm install
npm run dev          # frontend → http://localhost:5173
npm run dev:api      # API Express → http://localhost:3001
```

Copiez `.env.example` vers `.env` et renseignez Supabase + OpenAI.

## Déploiement

- **Production** : [https://tkv-app.vercel.app](https://tkv-app.vercel.app)
- Guide : `DEPLOY_VERCEL.md`
- Variables d'environnement : dashboard Vercel (équipe **ae-mindset**, projet **tkv-app**)

## API (routes principales)

| Route | Description |
|-------|-------------|
| `GET /api/health` | Santé API |
| `GET /api/cells/capabilities` | Droits création de cellule |
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
12. `supabase_phase1b_patch.sql` (podcasts + modules de cours)
13. `supabase_course_progress.sql` (progression parcours)
14. `supabase_gamification_patch.sql` (badges + progression lecture sur profil)
15. `supabase_podcasts_seed.sql` (catalogue épisodes pour sync cloud)
16. `supabase_certificates_payments.sql` (certificats parcours + commandes Premium)
17. `supabase_profiles_location.sql` (pays/ville profil + cache carte)
18. `supabase_confessional.sql` (confessionnal — base)
19. `supabase_confessional_cdc.sql` (Confessionnal CdC : messages, prières, accompagnateurs, crise)
20. `supabase_companion_dashboard.sql` (dashboard accompagnateur + chat privé)
21. `supabase_confessional_phase_c.sql` (quota Confessionnal dédié)
22. `supabase_confessional_support_groups.sql` (cercles de soutien)
23. `supabase_confessional_support_messages.sql` (chat anonyme des cercles)
24. `supabase_confessional_support_groups_en.sql` (catalogue cercles EN, optionnel)
25. `supabase_companion_web_push.sql` (Web Push alertes crise accompagnateurs)
26. `supabase_companion_applications.sql` (candidatures accompagnateur + charte)

Paiements **PayPal** : voir [docs/PAYMENTS.md](docs/PAYMENTS.md).

**Cerveau de Mim (RAG)** — sources indexées par priorité :
1. Livres TKV (GYNOSKO, EIDO) — priorité doctrinale
2. Bible Strong (lexique complet, mots originaux)
3. Héritage (preuves historiques de Jésus, manuscrits, résurrection…)
4. Références pastorales (Chris Oyakhilome, Myles Munroe, Joseph Prince) — complément ; en cas de contradiction, les livres TKV priment.

```bash
npm run build:bible          # si lexicon.json absent
npm run ingest:knowledge:embed   # OPENAI_API_KEY dans .env — ~14k entrées + embeddings
npm run upload:chunks:embed      # idem si ingest sans --embed (génère puis envoie Supabase)
# ou recherche par mots-clés seule (sans vecteurs) : npm run upload:chunks:text
```

Dev rapide sans lexique : `node scripts/ingest-knowledge.mjs --skip-lexicon`

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
| `node scripts/mark-order-paid.mjs TKV-…` | Activer Premium manuellement (secours admin) |
| `node scripts/grant-premium.mjs votre@email.com` | Premium complet + cellules + accompagnateur |
