# Notifications email — Congés RH (mise en place)

L'app est une page statique hébergée sur GitHub : elle ne peut pas envoyer d'email elle-même. Mais chaque
sauvegarde est un commit de `data.json` sur le dépôt. Une **GitHub Action** se déclenche à chaque commit, repère
les notifications ajoutées (celles que l'app affiche déjà dans « 🔔 Notifications ») et les envoie par email
depuis un **compte Gmail dédié**. Pas de serveur, pas de nom de domaine, pas d'hébergeur à changer.

```
app (navigateur) ──sauvegarde data.json──▶ GitHub ──commit──▶ Action « Notifications email » ──Gmail──▶ boîtes des salariés
```

Fichiers concernés : `.github/workflows/notifications-email.yml` (déclencheur) et
`.github/scripts/send-notifications.mjs` (envoi). Rien à changer dans `Demande Congés.html`.

## 1. Créer le compte Gmail dédié (5 min)

1. Créer un compte Google, par exemple `rds.conges@gmail.com` (n'importe quel nom libre). Un compte séparé évite
   d'exposer le mot de passe d'une boîte personnelle.
2. Activer la **validation en deux étapes** : https://myaccount.google.com/security → « Validation en deux étapes ».
   Obligatoire pour l'étape suivante.
3. Créer un **mot de passe d'application** : https://myaccount.google.com/apppasswords → nom « GitHub congés » →
   Google affiche un code de 16 caractères. Le copier tout de suite (il n'est plus affiché ensuite). C'est ce code
   qui servira, jamais le mot de passe du compte.

## 2. Mettre les deux secrets sur GitHub (2 min)

Sur le dépôt de l'app (`RDS-Adam/app`) : **Settings → Secrets and variables → Actions → New repository secret**.

| Nom | Valeur |
|---|---|
| `MAIL_USER` | l'adresse Gmail créée, ex. `rds.conges@gmail.com` |
| `MAIL_PASS` | le mot de passe d'application de 16 caractères (les espaces affichés par Google peuvent être retirés) |

Optionnel, onglet **Variables** du même écran : `APP_URL` = adresse exacte de l'app, pour le bouton
« Ouvrir l'application » des emails. Sans cette variable, le lien est construit automatiquement
(`https://<compte>.github.io/<dépôt>/Demande%20Cong%C3%A9s.html`).

## 3. Envoyer les fichiers sur GitHub (2 min)

Mettre en ligne, en plus de `Demande Congés.html`, le dossier `.github` avec ses deux fichiers :

```
.github/workflows/notifications-email.yml
.github/scripts/send-notifications.mjs
```

Via l'interface web : **Add file → Upload files**, glisser le dossier `.github` entier (GitHub garde l'arborescence),
puis **Commit changes**. Dès ce commit, l'onglet **Actions** du dépôt affiche le workflow « Notifications email ».

> Si le dépôt est privé : les Actions sont gratuites jusqu'à 2 000 minutes par mois, un envoi prend environ 20 secondes.
> Si l'onglet Actions est vide : Settings → Actions → General → « Allow all actions and reusable workflows ».

## 4. Vérifier (2 min)

1. Dans l'app, se connecter avec un compte Direction ou Développeur → onglet **Direction** → **📧 Tester l'email**.
   L'app enregistre une notification de test pour vous.
2. Sous 1 à 2 minutes : email reçu sur votre adresse. La première fois, regarder aussi les spams et cliquer
   « Pas un spam ».
3. En cas de problème : onglet **Actions** du dépôt → dernier run « Notifications email » → le détail indique
   ce qui a été envoyé, ignoré ou refusé (identifiants Gmail incorrects, etc.).

## Ce qui déclenche un email

| Événement | Destinataires |
|---|---|
| Nouvelle demande | Direction (Administrateurs RH + Direction) |
| Validation / refus | Salarié + les autres membres de la direction |
| Décalage par la direction | Salarié + les autres membres de la direction |
| Proposition de dates / retrait | Salarié + les autres membres de la direction |
| Proposition acceptée / refusée par le salarié | Direction |
| Annulation par le salarié | Direction |
| Bouton « Tester l'email » | Vous-même |

Le rôle **Développeur** ne reçoit pas les emails RH. Les boutons Gmail restent disponibles en secours dans l'app.
Les destinataires sont trouvés via l'adresse renseignée dans l'onglet Équipe : un salarié sans adresse est ignoré
(indiqué dans le détail du run).

## Limites et sécurité

- Gmail autorise environ 500 emails par jour depuis un compte gratuit : très largement suffisant.
- Les notifications de plus de 6 heures ne sont jamais renvoyées (protection contre une rafale au premier lancement
  ou après une restauration de sauvegarde).
- Le mot de passe d'application reste dans les secrets GitHub, jamais dans le code. Pour le révoquer :
  https://myaccount.google.com/apppasswords → supprimer « GitHub congés ».
- Couper les emails : désactiver le workflow (onglet Actions → « Notifications email » → ⋯ → Disable workflow) et
  passer `EMAIL_NOTIFY.enabled` à `false` dans `Demande Congés.html` pour masquer les mentions dans l'interface.
