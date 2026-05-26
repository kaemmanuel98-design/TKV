# Visio cellules — sécurité et intégration Jitsi

## Situation actuelle (à éviter en production)

- Salles **publiques** sur `meet.jit.si` avec noms **prévisibles** (`TKV_Cell_FR`, etc.).
- Toute personne connaissant l’URL peut entrer **sans compte TKV**.
- L’utilisateur voit l’interface **Jitsi** (marque, parfois ouverture dans un nouvel onglet).

## Objectif TKV

1. **Rester dans l’application** : visio en iframe plein écran dans la page Cellules (pas de lien externe obligatoire).
2. **Accès contrôlé** : seuls les utilisateurs **connectés** reçoivent l’URL de la salle via l’API (`POST /api/jitsi/join`).
3. **Salles non devinables** : nom recalculé chaque jour (`tkv-fr-a1b2c3…`), pas de liste publique.
4. **Production** : **Jitsi auto-hébergé** sur votre domaine (ex. `meet.votredomaine.org`) + **JWT** signé par votre API.

## Intégration « l’utilisateur ne voit pas une autre app »

| Approche | Ressenti utilisateur | Sécurité |
|----------|----------------------|----------|
| `meet.jit.si` en iframe | Voit souvent le logo Jitsi | Faible |
| **Jitsi sur votre domaine** + iframe + JWT | Comme une fonctionnalité TKV | Forte |
| SDK `lib-jitsi-meet` (avancé) | Très intégré, plus de dev | Forte |

Une visio Web utilise toujours **WebRTC** (caméra/micro) : le navigateur affichera une demande d’autorisation — c’est normal et ne signifie pas qu’on « quitte » TKV.

## Configuration production (recommandée)

1. Déployer **Jitsi Meet** sur un sous-domaine (Docker officiel ou hébergeur).
2. Activer **JWT** dans Prosody (`JITSI_APP_ID` / `JITSI_APP_SECRET`).
3. Dans `.env` de l’API TKV :

```env
JITSI_DOMAIN=meet.votredomaine.org
JITSI_PUBLIC_URL=https://meet.votredomaine.org
JITSI_APP_ID=votre_app_id
JITSI_APP_SECRET=votre_secret
JITSI_ROOM_SECRET=une_longue_chaine_aleatoire
```

En local avec Docker (`https://localhost:8443`), ajoutez `JITSI_PUBLIC_URL=https://localhost:8443` (le port n’est pas dans `JITSI_DOMAIN`, utilisé pour le JWT).

4. **Ne pas** définir `JITSI_ALLOW_PUBLIC_FALLBACK` en production.

5. CORS / iframe : autoriser votre domaine TKV dans la config Jitsi.

## Développement local

1. Lancez `scripts/setup-jitsi-windows.ps1` (ou `.bat`), puis **copiez** `jitsi-local-credentials.txt` dans **`.env`** (pas seulement `.env.example`).
2. Ou : `.\scripts\sync-jitsi-to-env.ps1` puis redémarrez l’API.
3. Redémarrez l’API : `npm run dev:api` — au démarrage vous devez voir `jitsi: oui (https://localhost:8443)`.

En développement, si Jitsi n’est pas configuré, l’API bascule automatiquement sur `meet.jit.si` (repli public, non sécurisé).

Pour tester sans serveur Jitsi dédié (⚠️ non sécurisé) :

```env
JITSI_ALLOW_PUBLIC_FALLBACK=true
```

L’API renverra une salle sur `meet.jit.si` avec un nom **non devinable**, mais sans JWT — réservé au dev.

## Ce que l’app fait déjà

- Bouton visio **réservé aux membres connectés**.
- URL de visio **jamais codée en dur** dans le client : uniquement via `POST /api/jitsi/join`.
- Paramètres d’embed pour limiter partage / deep links Jitsi.

## Suite possible

- Salle d’attente (lobby) modérée par un animateur.
- Durée de vie du JWT plus courte (15 min) + renouvellement.
- Enregistrement désactivé côté config Jitsi.
- Remplacer Jitsi par **Livekit** si vous voulez une UI 100 % custom sans marque tierce.
