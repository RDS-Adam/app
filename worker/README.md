# Worker Cloudflare sécurisé — mise en place (10 min, annulable en 1 clic)

Aujourd'hui le worker `rds-github` accepte n'importe quelle requête : n'importe qui peut modifier ou supprimer les
fichiers du dépôt. `worker.js` fait exactement la même chose pour les outils, mais refuse tout le reste :

- uniquement les 6 fichiers de données des outils (`data.json`, `data-test.json`, `config-outils.json`,
  `tarifs-pose.json`, `messages-type.json`, `commerciaux.json`) ;
- uniquement lecture et enregistrement : aucune suppression, aucun accès au reste de GitHub ;
- enregistrement accepté seulement depuis `rds-adam.github.io` et `*.ruedustore.fr` ;
- un contenu vide ou corrompu est refusé : un fichier de données ne peut plus être écrasé par erreur.

Rien ne change pour les salariés : mêmes pages, mêmes adresses, pas de connexion en plus.

## Étapes

1. **Sauvegarder l'ancien code** : Cloudflare → Workers & Pages → `rds-github` → **Edit code** → tout copier dans
   un fichier texte sur votre ordinateur.
2. **Vérifier le nom du jeton** : onglet **Settings → Variables and Secrets**. Le nouveau code attend un secret
   nommé `GITHUB_TOKEN`. Si le vôtre porte un autre nom (ex. `TOKEN`), remplacer `env.GITHUB_TOKEN` dans le code
   par ce nom.
3. **Coller le nouveau code** (`worker.js`) à la place de l'ancien → **Deploy**.
4. **Tester** (2 min) : ouvrir la boîte à outils, Congés, le calculateur et les messages types ; faire un
   enregistrement dans l'un d'eux (ex. modifier puis remettre un message type). Tout doit fonctionner comme avant.

**Si quelque chose ne marche plus** : Cloudflare → `rds-github` → onglet **Deployments** → sur la version
précédente, **Rollback**. Tout redevient comme avant immédiatement. Cause la plus probable : le site WordPress qui
affiche la boîte à outils n'est pas sur `ruedustore.fr` — ajouter son adresse dans `ALLOWED_ORIGINS`.

## Profiter de l'occasion : un jeton GitHub limité (5 min)

GitHub → photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens →
Generate new token** :

- Repository access : **Only select repositories** → `RDS-Adam/app`
- Permissions → Repository permissions → **Contents : Read and write** (rien d'autre)

Coller ce jeton dans le secret du worker (étape 2), tester, puis supprimer l'ancien jeton dans GitHub.

## Ce que ce worker ne règle pas

Il bloque les robots et les accès extérieurs, mais une personne qui connaît les outils peut encore imiter la page
et enregistrer des données. La protection complète est une connexion par email avant d'ouvrir les outils
(Cloudflare Access, gratuit jusqu'à 50 personnes) — à envisager plus tard.

Ajouter un nouvel outil qui enregistre un fichier : ajouter son nom dans `FILES` et redéployer.
