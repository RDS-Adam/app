/**
 * Rapport SAV Terrain : résumé par l'IA (Claude) de la dictée vocale du technicien.
 *
 * À coller dans le MÊME projet Google Apps Script que l'envoi des vidéos (celui dont l'adresse
 * est UPLOAD_URL dans rapport-sav.html). Voir RAPPORT-SAV-IA.md pour la mise en place.
 *
 * La page envoie : { code, action: "resume", text, context: { product, cats, client } }
 * Le script répond : { ok: true, problem, actions, next } ou { ok: false, error }
 *
 * La clé API Anthropic est lue dans les propriétés du script (ANTHROPIC_API_KEY) :
 * elle n'apparaît jamais dans la page web.
 */

var RESUME_MODEL = "claude-opus-5-5";

var RESUME_SYSTEM = [
  "Tu aides un technicien SAV (stores, volets, fermetures) à remplir son rapport d'intervention.",
  "Tu reçois la transcription brute de ce qu'il a dicté sur place : elle peut contenir des hésitations,",
  "des répétitions et des erreurs de reconnaissance vocale. Corrige-les avec bon sens.",
  "Répartis l'information dans trois champs, en français, style rapport professionnel, phrases courtes :",
  "- problem : ce que le client signale et ce que le technicien constate.",
  "- actions : le diagnostic et ce qui a été fait sur place (réglages, pièces remplacées, tests).",
  "- next : pièces à commander (référence et quantité si dictées), nouveau rendez-vous, suite à donner.",
  "N'invente rien : un champ sans information dans la dictée reste une chaîne vide.",
  "Garde les références, mesures, quantités et noms exactement comme dictés.",
  "Pas de titre, pas de formule de politesse ; des tirets en début de ligne si plusieurs points."
].join("\n");

/** Appelée depuis doPost quand body.action === "resume". Renvoie un objet JS (à transformer en JSON). */
function resumeSav_(body) {
  var text = String(body.text || "").trim();
  if (!text) return { ok: false, error: "dictée vide" };
  if (text.length > 20000) text = text.slice(0, 20000);

  var key = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY");
  if (!key) return { ok: false, error: "clé ANTHROPIC_API_KEY absente des propriétés du script" };

  var ctx = body.context || {};
  var ctxLines = [];
  if (ctx.product) ctxLines.push("Produit concerné : " + ctx.product);
  if (ctx.cats && ctx.cats.length) ctxLines.push("Type de problème coché : " + ctx.cats.join(", "));

  var payload = {
    model: RESUME_MODEL,
    max_tokens: 4000,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            problem: { type: "string" },
            actions: { type: "string" },
            next: { type: "string" }
          },
          required: ["problem", "actions", "next"],
          additionalProperties: false
        }
      }
    },
    fallbacks: "default",
    system: RESUME_SYSTEM,
    messages: [{
      role: "user",
      content: (ctxLines.length ? ctxLines.join("\n") + "\n\n" : "") +
        "Dictée du technicien :\n<dictee>\n" + text + "\n</dictee>"
    }]
  };

  var res = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2026-10-21",
      "anthropic-beta": "server-side-fallback-2026-07-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var codeHttp = res.getResponseCode();
  var data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { data = null; }
  if (codeHttp !== 200 || !data) {
    var msg = data && data.error && data.error.message ? data.error.message : ("HTTP " + codeHttp);
    return { ok: false, error: "IA indisponible (" + msg + ")" };
  }
  if (data.stop_reason === "refusal") return { ok: false, error: "l'IA a refusé de traiter ce texte" };
  if (data.stop_reason === "max_tokens") return { ok: false, error: "dictée trop longue pour être résumée" };

  var out = "";
  (data.content || []).forEach(function (b) { if (b.type === "text") out += b.text; });
  var parsed;
  try { parsed = JSON.parse(out); } catch (e) { return { ok: false, error: "réponse de l'IA illisible" }; }

  return {
    ok: true,
    problem: String(parsed.problem || "").trim(),
    actions: String(parsed.actions || "").trim(),
    next: String(parsed.next || "").trim()
  };
}
