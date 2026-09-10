/*
 * Catalogue de la boîte à outils Rue du Store.
 *
 * Pour ajouter un outil : déposez le fichier HTML dans le dépôt, puis ajoutez une entrée dans "outils".
 *   id          identifiant unique, sans espace (sert aux favoris et aux liens directs)
 *   nom         nom affiché
 *   description une phrase : à quoi sert l'outil
 *   fichier     chemin relatif du fichier (ex. "Mon-outil.html" ou "Dossier/page.html")
 *   url         à la place de "fichier" pour un site externe (s'ouvre dans un nouvel onglet)
 *   categorie   id d'une des catégories ci-dessous
 *   icone       un emoji
 *   motsCles    mots supplémentaires pour la recherche
 *   espace      "adam" pour placer l'outil dans l'onglet Espace Adam (sans ce champ : page commune)
 *   masque      true pour retirer l'outil de la page sans supprimer l'entrée
 */
window.RDS_BOITE = {
  // Onglets en haut de la page. Le premier est la page commune, ouverte par défaut.
  // L'Espace Adam a aussi son adresse directe : …/#espace/adam
  espaces: [
    { id: "commun", nom: "Outils",      icone: "🧰" },
    { id: "adam",   nom: "Espace Adam", icone: "⚙️", titre: "Espace Adam",
      sousTitre: "Devis, messages types et référentiels." }
  ],

  categories: [
    { id: "devis",      nom: "Devis & chiffrage",    icone: "💶", teinte: "#fff0e3" },
    { id: "technique",  nom: "Calculs techniques",   icone: "📐", teinte: "#e4f1f2" },
    { id: "terrain",    nom: "Terrain & chantier",   icone: "🛠️", teinte: "#ebf3e6" },
    { id: "courriers",  nom: "Courriers & messages", icone: "✉️", teinte: "#f0ebf8" },
    { id: "references", nom: "Référentiels",         icone: "📚", teinte: "#f3efe6" },
    { id: "rh",         nom: "RH & organisation",    icone: "🗓️", teinte: "#e8eefa" }
  ],

  outils: [
    /* ── Devis & chiffrage ── */
    { id: "configurateur", nom: "Configurateur RDS", categorie: "devis", icone: "🏠",
      url: "https://prod.seriousframes.com/Configurateur_RDS/",
      description: "Configurer un store et obtenir son prix dans le configurateur en ligne Rue du Store.",
      motsCles: ["configurateur", "prix", "store", "tarif", "seriousframes"] },
    { id: "prix-pose", nom: "Calculateur prix de pose", categorie: "devis", icone: "🧮",
      fichier: "calculateur-prix-pose.html",
      description: "Chiffrer une pose : produits, mise en place, déplacement, prise de mesures et marge achat / vente.",
      motsCles: ["pose", "tarif", "marge", "déplacement", "devis", "installation"] },
    { id: "devis-sotexpro", espace: "adam", nom: "Devis Sotexpro", categorie: "devis", icone: "🧵",
      fichier: "Devis-Sotexpro.html",
      description: "Devis rideaux sur rail : gamme de tissu, type de tête, dimensions, coefficient de vente, remise et commande usine.",
      motsCles: ["sotexpro", "rideau", "voilage", "rail", "tissu", "commande usine"] },
    { id: "suivi-devis", espace: "adam", nom: "Suivi des devis", categorie: "devis", icone: "📋",
      fichier: "devis-Adam.html",
      description: "Tableau Kanban des devis en cours : clients, montants, priorités, statistiques et export.",
      motsCles: ["kanban", "suivi", "relance", "pipeline", "statistiques"] },

    /* ── Calculs techniques ── */
    { id: "stores-inclines", nom: "Stores inclinés (trapèze / triangle)", categorie: "technique", icone: "📐",
      fichier: "trapèze triangle.html",
      description: "Calculer un store trapèze ou triangle et générer le schéma de fabrication plissé ou californien, avec les limites de fabrication.",
      motsCles: ["trapèze", "triangle", "incliné", "plissé", "californien", "schéma", "abaque"] },
    { id: "triangles-trapezes", nom: "Triangles et trapèzes", categorie: "technique", icone: "🔺",
      fichier: "Calcul-trapeze-triangle/triangles.html",
      description: "Saisir les cotes connues sur le dessin du store et obtenir les dimensions et l'angle manquants.",
      motsCles: ["triangle", "trapèze", "angle", "rail", "dimensions", "cotes"] },
    { id: "encombrement-sbv", nom: "Encombrement SBV", categorie: "technique", icone: "↔️",
      fichier: "Encombrement SBV2.html",
      description: "Calculer l'encombrement d'un store à bandes verticales selon la baie, le rail, le type de lame et le refoulement.",
      motsCles: ["sbv", "bandes verticales", "lame", "refoulement", "rail", "baie"] },
    { id: "panachage-sbv", nom: "Panachage SBV", categorie: "technique", icone: "🎨",
      fichier: "Panachage-californien.html",
      description: "Composer un panachage de lames pour store à bandes verticales et imprimer le bon de fabrication.",
      motsCles: ["panachage", "californien", "sbv", "lames", "couleurs", "bon de fabrication"] },
    { id: "encombrement-toile", nom: "Encombrement toile", categorie: "technique", icone: "🌀",
      fichier: "enroulement-toile.html",
      description: "Diamètre enroulé et nombre de tours d'une toile selon le tube, l'épaisseur et la hauteur, avec accès aux abaques.",
      motsCles: ["enroulement", "tube", "toile", "tours", "abaque", "coffre", "enroulé"] },
    { id: "diametre-enroulement", nom: "Diamètre d'enroulement", categorie: "technique", icone: "⭕",
      fichier: "Calcul-diametre-enroulement.html",
      description: "Estimer le diamètre final d'une toile enroulée à partir du tube nu, de la qualité de toile et de l'avancée.",
      motsCles: ["enroulement", "diamètre", "banne", "avancée", "tube"] },
    { id: "expertise-thermique", nom: "Expertise thermique", categorie: "technique", icone: "🌡️",
      fichier: "Calcul-gain-de-temperature.html",
      description: "Estimer le gain de confort apporté par une toile selon le vitrage et la position du store, puis exporter un rapport client en PDF.",
      motsCles: ["thermique", "température", "chaleur", "confort", "vitrage", "rapport", "pdf", "argumentaire"] },

    /* ── Terrain & chantier ── */
    { id: "pix-cotes", nom: "Pix'Côtes", categorie: "terrain", icone: "📸",
      fichier: "Pix-cotes.html",
      description: "Annoter les photos de chantier avec flèches, cotes et notes, puis exporter en JPG, ZIP ou PDF.",
      motsCles: ["photo", "cotes", "annotation", "métré", "pdf", "pc"] },
    { id: "pix-cotes-mobile", espace: "adam", nom: "Pix'Côtes (mobile)", categorie: "terrain", icone: "📱",
      fichier: "Pix'côtes mobile.html",
      description: "La version téléphone de Pix'Côtes, pour annoter les photos directement chez le client.",
      motsCles: ["photo", "cotes", "mobile", "téléphone", "smartphone", "annotation"] },
    { id: "bon-fin-chantier", nom: "Bon de fin de chantier", categorie: "terrain", icone: "✍️",
      fichier: "Bon-fin-chantier.html",
      description: "Faire signer la réception des travaux au client, avec ou sans réserves, puis télécharger le bon ou l'envoyer au siège.",
      motsCles: ["réception", "signature", "réserves", "chantier", "pose", "pv"] },
    { id: "tournees", nom: "Gestion des tournées", categorie: "terrain", icone: "🚚",
      fichier: "Gestion des tournees.html",
      description: "Organiser la tournée de chantiers de la journée : ordre de passage, temps de trajet et feuille de route.",
      motsCles: ["tournée", "planning", "rendez-vous", "itinéraire", "agenda"] },

    /* ── Courriers & messages ── */
    { id: "courrier-echantillons", nom: "Courrier échantillons", categorie: "courriers", icone: "✉️",
      fichier: "Générateur courrier échantillons.html",
      description: "Générer le courrier qui accompagne un envoi d'échantillons, prêt à imprimer ou à enregistrer en PDF.",
      motsCles: ["échantillons", "courrier", "lettre", "client", "pdf"] },
    { id: "messages-types", espace: "adam", nom: "Messages types", categorie: "courriers", icone: "💬",
      fichier: "messages-type.html",
      description: "Bibliothèque partagée de textes prêts à copier : prestations incluses, descriptifs de pose, réponses clients.",
      motsCles: ["message", "texte", "modèle", "email", "prestations", "copier"] },

    /* ── Référentiels ── */
    { id: "epaisseurs-toiles", espace: "adam", nom: "Épaisseurs maxi des toiles", categorie: "references", icone: "📏",
      fichier: "Tableau des Epaisseurs Maxi TOILES (Fournisseurs).html",
      description: "Tableau des épaisseurs et des poids des toiles, par fournisseur.",
      motsCles: ["épaisseur", "toile", "fournisseur", "screen", "poids"] },
    // Masqués dans la configuration d'origine (config-outils.json) : passez masque à false pour les afficher.
    { id: "mini-coffre-26", nom: "Store mini coffre – tube 26", categorie: "references", icone: "📊",
      fichier: "STORE MINI COFFRE DIA TUBE 26.html", masque: true,
      description: "Abaque des hauteurs de toile maximales par épaisseur et par manœuvre (cordon, sangle, treuil, moteur).",
      motsCles: ["abaque", "coffre", "tube 26", "hauteur", "manœuvre"] },
    { id: "universal-coffre-36", nom: "Store universal coffre – tube 36", categorie: "references", icone: "📊",
      fichier: "STORE UNIVERSAL COFFRE DIA TUBE 36.html", masque: true,
      description: "Abaque des hauteurs de toile maximales par épaisseur et par manœuvre.",
      motsCles: ["abaque", "coffre", "tube 36", "hauteur", "manœuvre"] },

    /* ── RH & organisation ── */
    { id: "conges", nom: "Demande de congés", categorie: "rh", icone: "🏖️",
      fichier: "Demande Congés.html",
      description: "Poser une demande de congés, suivre son solde et le calendrier de l'équipe.",
      motsCles: ["congés", "vacances", "absence", "rh", "solde", "rtt"] }
  ]
};
