# Jitsi en production (TKV + Vercel)

L’API TKV sur Vercel **ne héberge pas** Jitsi : elle signe des JWT et renvoie l’URL d’embed. Il vous faut un **serveur Jitsi** (VPS) avec HTTPS sur votre domaine, ex. `https://meet.votredomaine.org`.

## Architecture

```
Utilisateur TKV (tkv-app.vercel.app)
    → POST /api/jitsi/join (auth Supabase)
    → JWT signé par l’API
    → iframe → meet.votredomaine.org/tkv-fr-xxxxxxxx#jwt=...
```

- Salles **non devinables** (`tkv-{langue}-{hash}`), renouvelées chaque jour.
- **Pas de meet.jit.si** en production (fallback désactivé automatiquement).
- **localhost** refusé en production.

---

## Étape 1 — VPS (recommandé)

**Prérequis** : Ubuntu 22.04+, 4 Go RAM, domaine `meet.votredomaine.org` → IP du VPS.

### 1.1 DNS

| Type | Nom | Valeur |
|------|-----|--------|
| A | `meet` | IP du VPS |

### 1.2 Installer Jitsi (Docker officiel)

Sur le VPS :

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin
git clone https://github.com/jitsi/docker-jitsi-meet.git
cd docker-jitsi-meet
cp env.example .env
./gen-passwords.sh
```

Éditez `.env` (extraits importants) :

```env
PUBLIC_URL=https://meet.votredomaine.org
DOCKER_HOST_ADDRESS=<IP_PUBLIQUE_VPS>

# JWT (obligatoire pour TKV)
ENABLE_AUTH=1
AUTH_TYPE=jwt
JWT_APP_ID=tkv_jitsi
JWT_APP_SECRET=<générez_une_longue_clé_aléatoire>
JWT_ACCEPTED_ISSUERS=tkv_jitsi
JWT_ACCEPTED_AUDIENCES=tkv_jitsi
JWT_ASAP_KEYSERVER=

# Autoriser l’embed depuis TKV (iframe)
ENABLE_XFRAME_OPTIONS=0
# ou, selon version :
# ENABLE_XFRAME_LINES=frame-ancestors 'self' https://tkv-app.vercel.app https://*.vercel.app

TZ=Europe/Paris
```

Lancez :

```bash
docker compose up -d
```

Vérifiez : `https://meet.votredomaine.org` s’ouvre (certificat Let’s Encrypt via le script Docker).

> Guide Windows local : [JITSI_INSTALL_WINDOWS.md](./JITSI_INSTALL_WINDOWS.md)

---

## Étape 2 — Variables Vercel (API TKV)

**Vercel → tkv-app → Settings → Environment Variables** (Production) :

| Variable | Exemple |
|----------|---------|
| `JITSI_DOMAIN` | `meet.votredomaine.org` |
| `JITSI_PUBLIC_URL` | `https://meet.votredomaine.org` |
| `JITSI_JWT_SUB` | `meet.votredomaine.org` |
| `JITSI_APP_ID` | `tkv_jitsi` (identique à `JWT_APP_ID`) |
| `JITSI_APP_SECRET` | même secret que `JWT_APP_SECRET` sur le VPS |
| `JITSI_ROOM_SECRET` | longue chaîne aléatoire (noms de salles TKV) |
| `CORS_ORIGINS` | `https://tkv-app.vercel.app` |
| `APP_PUBLIC_URL` | `https://tkv-app.vercel.app` |

**Ne pas définir** `JITSI_ALLOW_PUBLIC_FALLBACK` en production.

Redéployez après ajout des variables.

---

## Étape 3 — Vérifications

### API

```text
GET https://tkv-app.vercel.app/api/jitsi/status
```

Réponse attendue :

```json
{
  "mode": "secured",
  "configured": true,
  "productionReady": true,
  "available": true,
  "publicUrl": "https://meet.votredomaine.org"
}
```

### Local

```powershell
node scripts/check-jitsi-env.mjs
npm run dev:api
```

Au démarrage : `jitsi: oui — secured (https://...)`

### Application

1. Connexion → **Cellules**
2. **Démarrer la visio** → iframe dans TKV (pas d’onglet meet.jit.si)
3. Autoriser caméra / micro dans le navigateur

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `jitsi_production_not_configured` | Domaine public HTTPS + JWT ; pas `localhost` sur Vercel |
| iframe vide / refusée | `ENABLE_XFRAME_OPTIONS=0` ou `frame-ancestors` avec l’URL Vercel |
| JWT invalid | `JITSI_APP_ID` / `SECRET` identiques VPS ↔ Vercel |
| Caméra bloquée | Autoriser permissions sur `tkv-app.vercel.app` ; HTTPS obligatoire |
| `mode: fallback` en prod | Impossible — fallback coupé ; configurez le VPS |

---

## Sécurité (CdC)

- Visio réservée aux **utilisateurs connectés** (`POST /api/jitsi/join`).
- **Premium+** ou profil avec `can_host_visio = true` (fondateur) : JWT modérateur → peut **créer** la réunion.
- **Gratuit / Premium** : JWT participant → peut **rejoindre** si un animateur a déjà ouvert la salle.
- Migration : `supabase_profiles_can_host_visio.sql` puis `UPDATE profiles SET can_host_visio = true WHERE id = '…';`
- Voir aussi [JITSI_SECURITE.md](./JITSI_SECURITE.md).

---

## Coût indicatif

- VPS 4 Go (Hetzner, OVH, etc.) : ~5–15 €/mois
- Vercel : plan existant (API serverless incluse)
