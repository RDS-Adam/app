/**
 * Envoie par email (Gmail, SMTP) les notifications ajout√©es dans data.json depuis le commit pr√©c√©dent.
 *
 * L'application √©crit d√©j√† chaque √©v√©nement dans db.notifications :
 *   { id, ts, to: ["Camille", "Nicolas"], kind, text (HTML l√©ger : <strong> uniquement), reqId }
 * Ce script compare data.json avec sa version pr√©c√©dente (HEAD~1), convertit les pr√©noms en
 * adresses (db.employees) et envoie un email par notification depuis le compte Gmail d√©di√©.
 *
 * Variables d'environnement : MAIL_USER, MAIL_PASS (secrets GitHub : adresse Gmail + mot de passe
 * d'application), APP_URL (optionnel), SENDER_NAME (optionnel), DRY_RUN=1 pour afficher sans envoyer.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const DATA_FILE = 'data.json';
const MAX_AGE_MS = 6 * 60 * 60 * 1000;   // ignore les notifications de plus de 6 h (anti-rafale au premier lancement)
const KIND_LABELS = {
  demande: 'Nouvelle demande de cong√©s',
  decision: 'R√©ponse √† une demande de cong√©s',
  annulation: 'Annulation de cong√©s',
  decalage: 'Cong√©s d√©cal√©s',
  proposition: 'Proposition de dates',
  reset: 'R√©initialisation de votre mot de passe',
  test: 'Test des notifications'
};
// Sujets sans r√©sum√© pour ces types (le texte contient un lien ou une date, inutile dans le sujet)
const FIXED_SUBJECT = new Set(['reset', 'test']);

function loadJSON(text) {
  try { const d = JSON.parse(text); return Array.isArray(d) ? {} : (d || {}); } catch { return {}; }
}
function previousVersion() {
  try { return loadJSON(execSync(`git show HEAD~1:${DATA_FILE}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })); }
  catch { return null; } // premier commit ou historique indisponible
}
function stripHtml(s) {
  return String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Conserve uniquement les balises <strong> de l'app, neutralise tout le reste, rend les URL cliquables
function safeHtml(s) {
  return String(s || '').split(/(<\/?strong>)/i)
    .map(part => /^<\/?strong>$/i.test(part) ? part.toLowerCase() : linkify(escapeHtml(stripHtml(part))).replace(/\n/g, '<br>'))
    .join('');
}
function linkify(escaped) {
  return escaped.replace(/https?:\/\/[^\s<]+/g, u => `<a href="${u}" style="color:#25737d;word-break:break-all;">${u}</a>`);
}
function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const [owner, name] = (process.env.GITHUB_REPOSITORY || '').split('/');
  return owner && name ? `https://${owner.toLowerCase()}.github.io/${name}/Demande%20Cong%C3%A9s.html` : '';
}
function emailHtml(subject, bodyHtml, url) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6f7;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f7;padding:24px 12px;"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e6e6e6;">
      <tr><td style="padding:18px 24px;border-bottom:1px solid #eeeeee;"><span style="font-size:14px;font-weight:700;letter-spacing:1px;color:#25737d;text-transform:uppercase;">Cong√©s <span style="color:#ff7200;">|</span> Rue du Store</span></td></tr>
      <tr><td style="padding:22px 24px;font-size:15px;line-height:1.6;">
        <div style="font-size:17px;font-weight:700;margin-bottom:14px;">${escapeHtml(subject)}</div>
        ${bodyHtml}
        ${url ? `<div style="margin-top:22px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#25737d;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;font-size:14px;">Ouvrir l'application Cong√©s</a></div>` : ''}
      </td></tr>
      <tr><td style="padding:12px 24px 18px;font-size:11px;color:#999999;border-top:1px solid #eeeeee;">Notification automatique de l'application Cong√©s RH. Merci de ne pas r√©pondre √† cet email.</td></tr>
    </table></td></tr></table></body></html>`;
}

async function main() {
  const current = loadJSON(readFileSync(DATA_FILE, 'utf8'));
  const previous = previousVersion();
  const now = Date.now();
  const seen = new Set(((previous && previous.notifications) || []).map(n => n.id));
  const fresh = (current.notifications || []).filter(n => !seen.has(n.id) && now - (n.ts || 0) < MAX_AGE_MS);
  if (!fresh.length) { console.log('Aucune nouvelle notification √† envoyer.'); return; }

  const dry = process.env.DRY_RUN === '1';
  let transporter = null;
  if (!dry) {
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) { console.error('Configuration manquante : secrets MAIL_USER / MAIL_PASS.'); process.exit(1); }
    const nodemailer = (await import('nodemailer')).default;
    transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } });
  }
  const employees = current.employees || [];
  const emailOf = name => { const e = employees.find(x => (x.name || '').trim().toLowerCase() === String(name).trim().toLowerCase()); return e && e.email ? e.email : null; };
  const url = appUrl();
  const from = `"${(process.env.SENDER_NAME || 'Cong√©s RH').replace(/"/g, '')}" <${process.env.MAIL_USER || 'test@example.com'}>`;

  let sent = 0, skipped = 0, failed = 0;
  for (const n of [...fresh].sort((a, b) => (a.ts || 0) - (b.ts || 0))) {
    const to = [...new Set((n.to || []).map(emailOf).filter(Boolean))];
    if (!to.length) { skipped++; console.log(`¬∑ ignor√©e (aucune adresse pour ${JSON.stringify(n.to)}) : ${stripHtml(n.text).slice(0, 80)}`); continue; }
    const plain = stripHtml(n.text);
    const summary = plain.replace(/^[^\p{L}\p{N}]+/u, '').split(/ ¬∑ |\. /)[0].slice(0, 80);
    const subject = FIXED_SUBJECT.has(n.kind) ? (KIND_LABELS[n.kind] + ' ‚Äî Cong√©s RH') : `${KIND_LABELS[n.kind] || 'Cong√©s RH'} ‚Äî ${summary}`;
    const message = {
      from,
      to: to.join(', '),
      subject,
      text: plain + (url ? `\n\nOuvrir l'application : ${url}` : ''),
      html: emailHtml(subject, safeHtml(n.text), url)
    };
    if (dry) { console.log(`[DRY RUN] ‚Üí ${to.join(', ')}\n  Sujet : ${subject}\n  ${plain.replace(/\n/g, '\n  ')}`); sent++; continue; }
    try { await transporter.sendMail(message); sent++; console.log(`‚úì envoy√© √† ${to.join(', ')} : ${subject}`); }
    catch (e) { failed++; console.error(`‚úï √©chec pour ${to.join(', ')} : ${e.message}`); }
  }
  console.log(`Termin√© : ${sent} envoy√©(s), ${skipped} ignor√©e(s), ${failed} √©chec(s).`);
  if (failed) process.exit(1);
}
main().catch(e => { console.error(e); process.exit(1); });
