/**
 * Worker Cloudflare « rds-github » — version sécurisée.
 *
 * Même fonctionnement que l'actuel pour les outils (mêmes URL, mêmes réponses GitHub),
 * mais il refuse tout ce dont les outils n'ont pas besoin :
 *   - seulement le dépôt RDS-Adam/app, et seulement les fichiers de la liste FILES ci-dessous ;
 *   - seulement GET (lecture) et PUT (enregistrement) : aucune suppression, aucun autre point de l'API GitHub ;
 *   - PUT seulement depuis nos sites (en-tête Origin), avec un contenu JSON valide et de taille raisonnable
 *     (un fichier corrompu ou vidé par erreur n'est jamais enregistré).
 *
 * Variable secrète attendue : GITHUB_TOKEN (voir worker/README.md pour le nom exact utilisé aujourd'hui).
 */
const OWNER = 'RDS-Adam';
const REPO = 'app';

// Fichiers lus ou enregistrés par les outils — ajouter ici tout nouveau fichier de données
const FILES = new Set([
  'data.json',            // Demande Congés
  'data-test.json',       // Demande Congés — TEST
  'config-outils.json',   // Boîte à outils (espaces, ordre)
  'tarifs-pose.json',     // Calculateur prix pose
  'messages-type.json',   // Messages types
  'commerciaux.json'      // Générateur courrier échantillons
]);

// Sites autorisés à enregistrer (les pages GitHub Pages et le site WordPress qui les affiche)
const ALLOWED_ORIGINS = [
  /^https:\/\/rds-adam\.github\.io$/,
  /^https:\/\/([a-z0-9-]+\.)*ruedustore\.fr$/
];

const MAX_BYTES = 3 * 1024 * 1024;   // data.json fait environ 50 Ko aujourd'hui

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function reply(status, message, origin) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) }
  });
}

function decodeBase64Utf8(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const originOk = ALLOWED_ORIGINS.some(re => re.test(origin));

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== 'GET' && request.method !== 'PUT') return reply(405, 'Méthode non autorisée', origin);

    // Seul chemin accepté : /repos/RDS-Adam/app/contents/<fichier autorisé>
    const url = new URL(request.url);
    const prefix = `/repos/${OWNER}/${REPO}/contents/`;
    if (!url.pathname.startsWith(prefix)) return reply(403, 'Accès refusé', origin);
    let file;
    try { file = decodeURIComponent(url.pathname.slice(prefix.length)).normalize('NFC'); }
    catch { return reply(400, 'Chemin invalide', origin); }
    if (!FILES.has(file)) return reply(403, 'Fichier non autorisé', origin);

    let body;
    if (request.method === 'PUT') {
      if (!originOk) return reply(403, 'Origine non autorisée', origin);
      const text = await request.text();
      if (text.length > MAX_BYTES * 1.4) return reply(413, 'Contenu trop volumineux', origin);
      let payload;
      try { payload = JSON.parse(text); } catch { return reply(400, 'Requête invalide', origin); }
      if (!payload || typeof payload.content !== 'string' || typeof payload.message !== 'string') {
        return reply(400, 'Requête invalide', origin);
      }
      // Le fichier enregistré doit rester un objet JSON valide
      try {
        const json = JSON.parse(decodeBase64Utf8(payload.content));
        if (!json || typeof json !== 'object' || Array.isArray(json)) throw new Error();
      } catch { return reply(400, 'Contenu JSON invalide : enregistrement refusé', origin); }
      // On ne transmet que les champs utiles à GitHub (pas de branche ni d'auteur imposés par la page)
      body = JSON.stringify({ message: payload.message.slice(0, 200), content: payload.content, ...(payload.sha ? { sha: String(payload.sha) } : {}) });
    }

    const gh = await fetch(`https://api.github.com${prefix}${encodeURIComponent(file)}`, {
      method: request.method,
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'rds-github-worker',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body
    });
    const out = new Response(gh.body, gh);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => out.headers.set(k, v));
    out.headers.set('Cache-Control', 'no-store');
    return out;
  }
};
