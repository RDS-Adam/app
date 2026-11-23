# Rapport SAV Terrain — dictée vocale résumée par l'IA (mise en place)

Dans la section **02 Problème constaté**, le bloc **Dicter le rapport** permet de :

1. toucher **Dicter** et raconter l'intervention à voix haute (le texte s'écrit en direct, corrigeable) ;
2. toucher **Résumer avec l'IA** : l'IA remet le texte au propre et remplit **Description du problème**,
   **Actions réalisées** et **Pièces à commander / suite à donner**.

Ce qui est déjà saisi n'est jamais effacé (le résumé est ajouté à la suite), et **Annuler le remplissage**
remet les champs comme avant. Le texte dicté est gardé dans le brouillon.

```
téléphone ──dictée (reconnaissance vocale du navigateur)──▶ texte
texte ──▶ script Google (action "resume") ──▶ IA Claude ──▶ 3 champs remplis
```

La clé de l'IA est stockée dans le script Google, jamais dans la page (la page est publique sur GitHub).

## 1. Créer une clé API Anthropic (5 min)

1. Aller sur https://console.anthropic.com → créer un compte (ou se connecter).
2. **Billing** : ajouter un moyen de paiement et un peu de crédit (5 € suffisent pour beaucoup de rapports :
   un résumé coûte environ un centime).
3. **API Keys → Create Key** → nom « Rapport SAV » → copier la clé (`sk-ant-…`), elle n'est plus affichée ensuite.

## 2. Ajouter le code au script Google existant (5 min)

C'est le même projet Apps Script que celui de l'envoi des vidéos (l'adresse `UPLOAD_URL` de `rapport-sav.html`).

1. Ouvrir le projet sur https://script.google.com.
2. **Fichiers → +  → Script**, le nommer `resume-ia`, y coller tout le contenu de `apps-script/resume-ia.gs`.
3. Dans la fonction `doPost` existante, juste **après la vérification du code** (`code`), ajouter :

   ```js
   if (body.action === "resume") {
     return ContentService.createTextOutput(JSON.stringify(resumeSav_(body)))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```

   (adapter `body` au nom de la variable qui contient le JSON reçu dans votre `doPost`, souvent
   `JSON.parse(e.postData.contents)`).
4. **Paramètres du projet (roue dentée) → Propriétés du script → Ajouter** :
   nom `ANTHROPIC_API_KEY`, valeur = la clé copiée à l'étape 1.
5. **Déployer → Gérer les déploiements → crayon ✎ → Version : Nouvelle version → Déployer.**
   Important : garder le même déploiement pour que l'adresse ne change pas.
   La première fois, Google demande d'autoriser « se connecter à un service externe » : accepter.

## 3. Vérifier

Ouvrir le Rapport SAV sur le téléphone, dicter deux phrases, toucher **Résumer avec l'IA**.
Si un message rouge apparaît, il donne la cause (clé absente, crédit épuisé, etc.).

## Bon à savoir

- **Dictée** : utilise la reconnaissance vocale du téléphone (Chrome sur Android, Safari sur iPhone), il faut du
  réseau. Si le navigateur ne la propose pas, la page invite à utiliser le **micro du clavier** dans la zone de
  texte : le bouton « Résumer avec l'IA » fonctionne pareil.
- Le premier usage demande l'autorisation du micro : répondre **Autoriser**.
- Modèle utilisé : `claude-opus-5-5` (réglable en haut de `resume-ia.gs`, variable `RESUME_MODEL`), avec un
  modèle de secours automatique si l'IA refuse une demande.
