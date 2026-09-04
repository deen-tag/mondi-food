import crypto from 'crypto';

// Session admin : un cookie httpOnly contenant une expiration signée en HMAC.
// Pas de mot de passe ni de secret stocké côté client, pas de base de session à gérer.
// Nécessite deux variables d'environnement (jamais commitées) :
//   ADMIN_PASSWORD        -> le mot de passe que l'équipe utilise pour se connecter
//   ADMIN_SESSION_SECRET  -> une longue chaîne aléatoire, générée une fois (ex: openssl rand -hex 32)

const COOKIE_NAME = 'mf_admin_session';
const SESSION_HOURS = 12;

function sign(payload) {
  return crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(payload).digest('hex');
}

export function createSessionCookie() {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = String(exp);
  const value = `${payload}.${sign(payload)}`;
  const secure = process.env.VERCEL_ENV ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}${secure}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function parseCookies(req) {
  if (req.cookies) return req.cookies;
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').filter(Boolean).map((p) => {
    const i = p.indexOf('=');
    return [p.slice(0, i).trim(), decodeURIComponent(p.slice(i + 1))];
  }));
}

export function isAdminAuthed(req) {
  const value = parseCookies(req)[COOKIE_NAME];
  if (!value) return false;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;
  if (Date.now() > Number(payload)) return false;
  const expected = sign(payload);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

// À appeler en tout début de chaque endpoint admin. Renvoie false + répond 401 si non authentifié.
export function requireAdmin(req, res) {
  if (!isAdminAuthed(req)) {
    res.status(401).json({ error: 'Non autorisé' });
    return false;
  }
  return true;
}
