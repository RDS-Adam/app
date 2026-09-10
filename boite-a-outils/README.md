# Boîte à outils Rue du Store

Page d'accueil qui regroupe tous les outils des commerciaux : recherche, catégories, favoris et outils ouverts récemment.

Deux onglets en haut de la page :

- **Outils** : la page commune, ouverte par défaut, pour tous les commerciaux.
- **Espace Adam** : Devis Sotexpro, Suivi des devis, Pix'Côtes mobile, Messages types et Épaisseurs maxi des toiles.
  Adresse directe à mettre en favori : `https://<compte>.github.io/<dépôt>/#espace/adam`.
  L'onglet n'est pas protégé par un mot de passe : il est simplement séparé de la page commune.

## Fichiers ajoutés

| Fichier | Rôle |
|---|---|
| `index.html` | La page d'accueil de la boîte à outils |
| `outils.js` | Le catalogue : nom, description, catégorie et icône de chaque outil |
| `.nojekyll` | Demande à GitHub Pages de publier les fichiers tels quels |
| `robots.txt` | Demande aux moteurs de recherche de ne pas indexer le site |

Les outils existants n'ont pas été modifiés.

## Mettre en ligne sur GitHub Pages

1. Envoyez tout le contenu de ce dossier à la racine d'un dépôt GitHub (par exemple le dépôt `app` existant).
2. Sur GitHub, ouvrez **Settings → Pages**.
3. Dans **Build and deployment**, choisissez **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`.
4. Après une ou deux minutes, le site est en ligne à l'adresse `https://<compte>.github.io/<dépôt>/`
   (avec le dépôt actuel : `https://rds-adam.github.io/app/`).

En ligne de commande, depuis ce dossier :

```bash
git init
git add .
git commit -m "Boîte à outils"
git branch -M main
git remote add origin https://github.com/<compte>/<dépôt>.git
git push -u origin main
```

## Ajouter ou modifier un outil

1. Déposez le fichier HTML de l'outil dans le dépôt.
2. Ouvrez `outils.js` et ajoutez une entrée dans la liste `outils` (le format est expliqué en haut du fichier).
3. Pour placer l'outil dans l'onglet Espace Adam, ajoutez `espace: "adam"` à son entrée (sans ce champ, il va sur la page commune).
4. Pour retirer un outil de la page sans le supprimer, ajoutez `masque: true` à son entrée.

Les deux abaques « Store mini coffre – tube 26 » et « Store universal coffre – tube 36 » sont masqués,
comme dans la configuration d'origine (`config-outils.json`). Passez `masque` à `false` pour les afficher.

## Bon à savoir

- **Favoris et récents** sont enregistrés dans le navigateur de chaque commercial : chacun a les siens,
  mais ils ne suivent pas d'un ordinateur à l'autre.
- **Les données partagées** (congés, messages types, tarifs de pose, liste des commerciaux) continuent de passer
  par le worker Cloudflare vers le dépôt `RDS-Adam/app`, quel que soit le dépôt qui héberge la page.
- **GitHub Pages est public** : toute personne qui connaît l'adresse peut ouvrir les outils et télécharger les
  fichiers du dépôt, y compris `data.json` (e-mails et empreintes de mots de passe) et `tarifs-pose.json`
  (prix d'achat). La balise `noindex` évite l'apparition dans Google, mais ne protège pas l'accès.
