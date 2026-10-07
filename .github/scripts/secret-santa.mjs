/**
 * Secret Santa — tire au sort qui offre un cadeau à qui, puis envoie à chacun son tirage par email (Gmail, SMTP).
 *
 * Les participants sont les salariés de data.json (db.employees) qui ont une adresse email.
 * Le tirage n'est écrit nulle part : ni dans data.json, ni dans le journal du run (le dépôt est public).
 * Seul le destinataire de chaque email connaît la personne qu'il doit gâter.
 *
 * Le tirage est dérivé du secret MAIL_PASS, de l'année et de la liste des participants : relancer le
 * workflow redonne exactement le même tirage (renvoi sans risque après un échec ou un email perdu).
 * Attention : ajouter ou retirer un salarié dans l'onglet Équipe change le tirage.
 *
 * Variables d'environnement : MAIL_USER, MAIL_PASS (secrets GitHub), SENDER_NAME (optionnel),
 * DRY_RUN=1 pour simuler sans envoyer, ONLY=Prénom pour ne renvoyer qu'à une personne,
 * BUDGET et EVENT_DATE (optionnels, repris dans l'email).
 */
import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATA_FILE = process.env.DATA_FILE || 'data.json';
const YEAR = new Date().getFullYear();

function loadJSON(text) {
  try { const d = JSON.parse(text); return Array.isArray(d) ? {} : (d || {}); } catch { return {}; }
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fullName(e) { return `${(e.name || '').trim()}${e.lastname ? ' ' + e.lastname.trim() : ''}`; }

// Générateur pseudo-aléatoire reproductible : flux HMAC-SHA256 indexé par un compteur
function seededInt(key, seed) {
  let counter = 0;
  return max => {
    const limit = Math.floor(0x100000000 / max) * max;   // rejet des valeurs hors limite : pas de biais
    for (;;) {
      const v = createHmac('sha256', key).update(`${seed}|${counter++}`).digest().readUInt32BE(0);
      if (v < limit) return v % max;
    }
  };
}
// Renvoie receivers[i] = personne à qui people[i] offre son cadeau. Personne ne se tire soi-même.
export function draw(people, key, year = YEAR) {
  if (people.length < 2) throw new Error('Il faut au moins 2 participants.');
  const sorted = [...people].sort((a, b) => a.email.localeCompare(b.email));
  const rand = seededInt(key, `secret-santa|${year}|${sorted.map(p => p.email.toLowerCase()).join(',')}`);
  for (;;) {
    const shuffled = [...sorted];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = rand(i + 1); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    if (sorted.every((p, i) => p !== shuffled[i])) return people.map(p => shuffled[sorted.indexOf(p)]);
  }
}
// Garde-fou avant tout envoi : chacun offre une fois, reçoit une fois, et jamais à soi-même
function checkDraw(people, receivers) {
  const ok = receivers.length === people.length
    && new Set(receivers).size === people.length
    && receivers.every((r, i) => people.includes(r) && r !== people[i]);
  if (!ok) throw new Error('Tirage invalide, aucun email envoyé.');
}

function details() {
  const lines = [];
  if (process.env.BUDGET) lines.push(['Budget', process.env.BUDGET.trim()]);
  if (process.env.EVENT_DATE) lines.push(['Remise des cadeaux', process.env.EVENT_DATE.trim()]);
  return lines;
}
function emailText(giver, receiver) {
  return [
    `Bonjour ${giver.name},`,
    '',
    `Le tirage au sort du Secret Santa ${YEAR} est fait. Tu offres ton cadeau à : ${fullName(receiver)}`,
    '',
    ...details().map(([k, v]) => `${k} : ${v}`),
    ...(details().length ? [''] : []),
    'Chut, c\'est un secret : ne dis à personne qui tu as tiré.',
    '',
    'Tirage automatique : personne ne connaît les autres tirages, pas même l\'organisateur.'
  ].join('\n');
}
function emailHtml(giver, receiver) {
  const rows = details().map(([k, v]) => `<div style="margin-top:6px;"><strong>${escapeHtml(k)} :</strong> ${escapeHtml(v)}</div>`).join('');
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f7;padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e6e6e6;">
      <tr><td style="padding:18px 24px;border-bottom:1px solid #eeeeee;"><span style="font-size:14px;font-weight:700;letter-spacing:1px;color:#25737d;text-transform:uppercase;">Secret Santa <span style="color:#ff7200;">|</span> Rue du Store</span></td></tr>
      <tr><td style="padding:22px 24px;font-size:15px;line-height:1.6;">
        <div style="font-size:17px;font-weight:700;margin-bottom:14px;">🎅 Bonjour ${escapeHtml(giver.name)},</div>
        Le tirage au sort du Secret Santa ${YEAR} est fait. Tu offres ton cadeau à :
        <div style="margin:18px 0;padding:18px;border-radius:10px;background:#f4f6f7;text-align:center;font-size:22px;font-weight:700;color:#25737d;">🎁 ${escapeHtml(fullName(receiver))}</div>
        ${rows}
        <div style="margin-top:14px;">Chut, c'est un secret : ne dis à personne qui tu as tiré.</div>
      </td></tr>
      <tr><td style="padding:12px 24px 18px;font-size:11px;color:#999999;border-top:1px solid #eeeeee;">Tirage automatique : personne ne connaît les autres tirages, pas même l'organisateur. Merci de ne pas répondre à cet email.</td></tr>
    </table></td></tr></table></body></html>`;
}

async function main() {
  let raw = ''; try { raw = readFileSync(DATA_FILE, 'utf8'); } catch { console.error(`${DATA_FILE} absent.`); process.exit(1); }
  const employees = loadJSON(raw).employees || [];
  const people = employees.filter(e => (e.name || '').trim() && (e.email || '').trim());
  const missing = employees.filter(e => !people.includes(e));
  console.log(`${people.length} participant(s) : ${people.map(p => p.name).join(', ')}`);
  // Un salarié sans adresse fausserait le tirage (il offrirait sans le savoir) : on arrête tout
  if (missing.length) { console.error(`Adresse email manquante pour : ${missing.map(e => e.name || '(sans prénom)').join(', ')}. Complétez l'onglet Équipe puis relancez.`); process.exit(1); }
  if (new Set(people.map(p => p.email.trim().toLowerCase())).size !== people.length) { console.error('Deux participants ont la même adresse email.'); process.exit(1); }

  const dry = process.env.DRY_RUN === '1';
  if (!dry && (!process.env.MAIL_USER || !process.env.MAIL_PASS)) { console.error('Configuration manquante : secrets MAIL_USER / MAIL_PASS.'); process.exit(1); }
  const receivers = draw(people, process.env.MAIL_PASS || randomBytes(32));
  checkDraw(people, receivers);

  const only = (process.env.ONLY || '').trim().toLowerCase();
  const targets = people.map((giver, i) => ({ giver, receiver: receivers[i] })).filter(t => !only || t.giver.name.trim().toLowerCase() === only);
  if (only && !targets.length) { console.error(`Aucun participant ne s'appelle « ${process.env.ONLY} ».`); process.exit(1); }

  if (dry) { console.log(`[SIMULATION] Tirage valide. ${targets.length} email(s) seraient envoyés à : ${targets.map(t => t.giver.name).join(', ')}. Rien n'a été envoyé.`); return; }

  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
  // Vérifie la connexion Gmail avant le premier envoi : en cas d'identifiants refusés, personne ne reçoit rien
  await transporter.verify();
  const from = `"${(process.env.SENDER_NAME || 'Secret Santa').replace(/"/g, '')}" <${process.env.MAIL_USER}>`;

  const sent = [], failed = [];
  for (const { giver, receiver } of targets) {
    try {
      await transporter.sendMail({ from, to: giver.email.trim(), subject: `🎅 Secret Santa ${YEAR} — ton tirage au sort`, text: emailText(giver, receiver), html: emailHtml(giver, receiver) });
      sent.push(giver.name); console.log(`✓ envoyé à ${giver.name}`);
    } catch (e) { failed.push(giver.name); console.error(`✕ échec pour ${giver.name} : ${e.message}`); }
  }
  console.log(`Terminé : ${sent.length} envoyé(s), ${failed.length} échec(s).`);
  if (failed.length) { console.error(`À renvoyer : ${failed.join(', ')} (relancer le workflow avec ce prénom dans « uniquement » : le tirage reste le même).`); process.exit(1); }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message || e); process.exit(1); });
