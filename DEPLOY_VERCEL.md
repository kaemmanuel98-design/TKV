# Déployer TKV sur Vercel (smartphone + mises à jour auto)

## 1. Préparer le dépôt Git

```powershell
cd C:\Users\Ange\Documents\TKV-APP
git add vercel.json api/ server/app.js DEPLOY_VERCEL.md
git commit -m "Configure Vercel deployment with API and PWA"
git push origin main
```

(Si pas encore sur GitHub : créez un repo vide sur github.com, puis `git remote add origin …` et `git push -u origin main`.)

## 2. Importer sur Vercel

1. Allez sur [https://vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → choisissez `TKV-APP`
3. Framework : **Vite** (détecté automatiquement)
4. Ne changez pas : Build = `npm run build`, Output = `dist`

## 3. Variables d’environnement (Vercel → Settings → Environment Variables)

Ajoutez pour **Production**, **Preview** et **Development** :

| Variable | Valeur |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://votre-projet.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | clé anon Supabase |
| `SUPABASE_URL` | même URL que ci-dessus |
| `SUPABASE_ANON_KEY` | même clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service role (secrète) |
| `OPENAI_API_KEY` | votre clé OpenAI |
| `OPENAI_CHAT_MODEL` | `gpt-4o-mini` (optionnel) |

**Ne définissez pas** `VITE_API_URL` en production : l’API est sur le même domaine (`/api/...`).

## 4. Supabase — URLs autorisées

Dans **Supabase → Authentication → URL Configuration** :

- **Site URL** : `https://votre-projet.vercel.app`
- **Redirect URLs** : ajoutez  
  `https://votre-projet.vercel.app/**`  
  et chaque URL de preview Vercel si besoin (`https://*-votre-equipe.vercel.app/**`)

## 5. Déployer

Cliquez **Deploy**. Après 1–2 min vous obtenez :

**https://votre-projet.vercel.app**

Chaque `git push` sur `main` redéploie automatiquement (voir l’app évoluer sur le téléphone).

## 6. Installer sur smartphone (PWA)

### Android (Chrome)

1. Ouvrez votre URL Vercel
2. Menu ⋮ → **Installer l’application** ou **Ajouter à l’écran d’accueil**

### iPhone (Safari)

1. Ouvrez l’URL dans **Safari**
2. Partager → **Sur l’écran d’accueil**

L’icône TKV apparaît comme une application native.

## 7. Vérifier que l’API fonctionne

Ouvrez dans le navigateur :

`https://votre-projet.vercel.app/api/health`

Réponse attendue : `{"ok":true,"openai":true,"chunks":…,"supabase":true}`

## 8. Déploiement en ligne de commande (optionnel)

```powershell
npm i -g vercel
cd C:\Users\Ange\Documents\TKV-APP
vercel login
vercel
vercel --prod
```

## 9. Domaine Hostinger → Vercel (ex. `tkv.fr`)

L’app reste hébergée sur **Vercel** ; Hostinger ne sert qu’à pointer le **nom de domaine** vers Vercel. Le SSL (cadenas HTTPS) est géré automatiquement par Vercel.

### Étape A — Déployer d’abord sur Vercel

Terminez les sections 1 à 5 ci-dessus. Vous devez avoir une URL du type `https://tkv-app.vercel.app` qui fonctionne.

### Étape B — Ajouter le domaine dans Vercel

1. [vercel.com](https://vercel.com) → votre projet TKV  
2. **Settings** → **Domains**  
3. Ajoutez **les deux** (recommandé) :
   - `votredomaine.com` (racine, sans www)
   - `www.votredomaine.com`
4. Vercel affiche les enregistrements DNS à créer (notez-les).

### Étape C — DNS chez Hostinger (hPanel)

1. [hpanel.hostinger.com](https://hpanel.hostinger.com)  
2. **Domaines** → votre domaine → **DNS / Zone DNS**  
3. Supprimez ou modifiez les anciens enregistrements **A** / **CNAME** qui pointent vers l’hébergement Hostinger (page parking, WordPress, etc.).

**Configuration habituelle Vercel + Hostinger :**

| Type | Nom / Host | Pointe vers | TTL |
|------|------------|-------------|-----|
| **A** | `@` | `76.76.21.21` | 14400 (ou par défaut) |
| **CNAME** | `www` | `cname.vercel-dns.com` | 14400 |

> Si Vercel propose une autre valeur (ex. `216.150.x.x`), utilisez **exactement** ce qu’affiche Vercel dans Domains.

4. Enregistrez. La propagation peut prendre **5 min à 48 h** (souvent &lt; 1 h).

### Étape D — Valider sur Vercel

Retournez dans **Domains** : le statut passe à **Valid** avec un certificat SSL actif.

Définissez le domaine principal (ex. `www.votredomaine.com`) comme **Primary** si proposé ; configurez la redirection `votredomaine.com` → `www` (ou l’inverse) selon votre préférence.

### Étape E — Mettre à jour Supabase

**Authentication → URL Configuration** :

- **Site URL** : `https://www.votredomaine.com` (ou sans www, selon votre choix)
- **Redirect URLs** — ajoutez :
  - `https://votredomaine.com/**`
  - `https://www.votredomaine.com/**`

### Étape F — Tester sur smartphone

- `https://www.votredomaine.com`
- `https://www.votredomaine.com/api/health`
- Installer la PWA depuis Safari / Chrome (même procédure qu’à la section 6)

### Option : nameservers Vercel (avancé)

Au lieu des enregistrements A/CNAME dans Hostinger, vous pouvez changer les **nameservers** du domaine vers ceux indiqués par Vercel (Domains → DNS). Toute la zone DNS est alors gérée chez Vercel. Utile si vous n’utilisez pas l’hébergement web Hostinger pour autre chose.

### Hostinger : garder l’hébergement pour autre chose ?

- **E-mail** Hostinger : ne changez pas les enregistrements **MX** existants.  
- **Sous-domaine** (ex. `app.votredomaine.com` uniquement) : créez seulement un **CNAME** `app` → `cname.vercel-dns.com` et ajoutez `app.votredomaine.com` dans Vercel Domains.

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche après refresh | `vercel.json` rewrites SPA — déjà configuré |
| Agent / voix ne répond pas | Vérifier `OPENAI_API_KEY` + `/api/health` |
| Connexion Supabase échoue | URLs redirect + clés `VITE_*` |
| `chunks: 0` | Normal si `chunks.json` absent ; l’agent utilise Supabase ou fallback |
| Domaine Hostinger « Invalid Configuration » | Vérifier A `@` → `76.76.21.21` et CNAME `www` → `cname.vercel-dns.com` |
| SSL en attente | Attendre 10–30 min après DNS validé ; forcer refresh dans Vercel Domains |
| Ancien site Hostinger s’affiche encore | Vider cache navigateur ; vérifier qu’aucun A record ne pointe encore vers Hostinger |
