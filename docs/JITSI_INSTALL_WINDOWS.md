# Installer Jitsi Meet sur Windows (PowerShell + Docker)

Jitsi ne s’installe pas comme une application Windows classique : on utilise **Docker Desktop**, qui lance Linux dans des conteneurs. PowerShell sert à **préparer** et **démarrer** cette stack.

## 1. Prérequis

| Outil | Lien |
|--------|------|
| **Docker Desktop** | https://www.docker.com/products/docker-desktop/ |
| **Git** | https://git-scm.com/download/win |

Après installation :

1. Ouvrir **Docker Desktop** et attendre « Docker is running ».
2. Redémarrer le PC si Docker le demande (WSL2).

Vérifier dans PowerShell :

```powershell
docker version
docker compose version
```

Les deux commandes doivent répondre sans erreur.

## 2. Installation automatique (recommandé)

### Option A — Windows PowerShell (recommandé)

Ouvrir **PowerShell** (pas Git Bash) :

```powershell
cd C:\Users\Ange\Documents\TKV-APP
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\setup-jitsi-windows.ps1
```

### Option B — Depuis Git Bash (MINGW64)

Les commandes `Set-ExecutionPolicy` et `.\fichier.ps1` ne fonctionnent **pas** dans Bash.
Utiliser le chemin Unix et le script relais :

```bash
cd /c/Users/Ange/Documents/TKV-APP
bash scripts/setup-jitsi-windows.sh
```

Ou en une ligne :

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:/Users/Ange/Documents/TKV-APP/scripts/setup-jitsi-windows.ps1"
```

Le script :

- clone `jitsi/docker-jitsi-meet` dans `%USERPROFILE%\jitsi-docker-meet`
- configure **JWT** (`APP_ID=tkv`) pour TKV
- génère les mots de passe
- lance `docker compose up -d`
- crée `jitsi-local-credentials.txt` à la racine du projet

**Durée :** 5–20 minutes la première fois (téléchargement des images).

## 3. Après l’installation

### A. Tester Jitsi dans le navigateur

Ouvrir : **https://localhost:8443**

Le navigateur affiche un avertissement de **certificat non reconnu** → normal en local :

- Chrome / Edge : « Avancé » → « Continuer vers localhost (non sécurisé) »

Sans cette étape, la visio dans TKV peut rester bloquée dans l’iframe.

### B. Brancher TKV

1. Ouvrir `jitsi-local-credentials.txt`.
2. Copier les lignes `JITSI_*` dans le fichier **`.env`** de TKV-APP.
3. Redémarrer l’API :

```powershell
cd C:\Users\Ange\Documents\TKV-APP
npm run dev:api
```

4. Lancer le frontend : `npm run dev`
5. Se **connecter** à TKV → **Cellules mondiales** → **Rejoindre la prière en visio**

## 4. Commandes utiles

Toujours dans `%USERPROFILE%\jitsi-docker-meet` :

```powershell
cd $env:USERPROFILE\jitsi-docker-meet

docker compose ps          # état des conteneurs
docker compose logs -f     # voir les erreurs en direct
docker compose restart     # redémarrer
docker compose down        # tout arrêter
docker compose up -d       # relancer
```

## 5. Installation manuelle (si le script échoue)

```powershell
cd $env:USERPROFILE
git clone https://github.com/jitsi/docker-jitsi-meet.git
cd jitsi-docker-meet
copy env.example .env
notepad .env
```

Dans `.env`, définir au minimum :

```env
CONFIG=C:\Users\VotreNom\.jitsi-meet-cfg
PUBLIC_URL=https://localhost:8443
HTTP_PORT=8000
HTTPS_PORT=8443
ENABLE_AUTH=1
ENABLE_GUESTS=0
AUTH_TYPE=jwt
JWT_APP_ID=tkv
JWT_APP_SECRET=une_longue_chaine_aleatoire
JWT_ACCEPTED_ISSUERS=tkv
JWT_ACCEPTED_AUDIENCES=jitsi
```

Générer les mots de passe XMPP (Git Bash dans le dossier jitsi) :

```bash
./gen-passwords.sh
```

Ou remplir à la main `JICOFO_AUTH_PASSWORD`, `JVB_AUTH_PASSWORD`, etc. dans `.env`.

Puis :

```powershell
docker compose up -d
```

## 6. Problèmes fréquents

### « Docker n’est pas disponible »

- Docker Desktop n’est pas lancé.
- WSL2 non installé : Docker Desktop → Settings → proposer l’installation WSL2.

### Ports 8000 / 8443 déjà utilisés

Modifier dans `.env` : `HTTP_PORT=18000` et `HTTPS_PORT=18443`, puis :

```env
PUBLIC_URL=https://localhost:18443
```

Et dans TKV : `JITSI_DOMAIN=localhost` (le port est dans l’URL d’embed côté API — pour ports custom, ajuster `PUBLIC_URL` et redémarrer Jitsi).

### « Visio indisponible » dans TKV

- `npm run dev:api` doit tourner.
- Variables `JITSI_*` dans `.env` identiques à Jitsi.
- Utilisateur **connecté** à TKV.
- Certificat `https://localhost:8443` accepté une fois dans le navigateur.

### PC lent / peu de RAM

Jitsi demande environ **4 Go RAM** libres. Fermer d’autres apps ou installer Jitsi sur un **VPS Linux** (OVH, Hetzner, etc.) et mettre `JITSI_DOMAIN=meet.votredomaine.fr`.

## 7. Production (plus tard)

Sur un vrai serveur Linux + nom de domaine :

- `PUBLIC_URL=https://meet.tkv.fr`
- `ENABLE_LETSENCRYPT=1`
- `LETSENCRYPT_DOMAIN=meet.tkv.fr`
- `LETSENCRYPT_EMAIL=votre@email.com`

Voir aussi [JITSI_SECURITE.md](./JITSI_SECURITE.md).
