// Écriture d'images dans le dépôt GitHub via l'API Contents.
// Fichier partagé (préfixe _) : ne compte pas dans la limite de 12 fonctions
// Vercel Hobby, comme _admin-auth.js, _menu.js, etc.
//
// Nécessite une variable d'environnement (jamais commitée) :
//   GITHUB_TOKEN -> Personal Access Token GitHub avec le scope "repo"
//                   (ou un fine-grained token limité à ce repo, permission
//                   "Contents: Read and write")

const GITHUB_REPO = 'deen-tag/mondi-food';
const GITHUB_BRANCH = 'main';
const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

// path attendu au format "public/images/uploads/xxx.png" (relatif à la racine du repo)
// base64Content : le contenu du fichier encodé en base64 (sans le préfixe data:...;base64,)
export async function uploadImageToGithub(path, base64Content, message) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error("Upload indisponible : variable d'environnement GITHUB_TOKEN manquante sur Vercel.");
  }

  // Si un fichier existe déjà à ce chemin exact, GitHub exige son sha pour
  // le mettre à jour plutôt que de refuser l'écriture. En pratique on génère
  // des noms uniques (timestamp), donc ce cas ne devrait pas arriver, mais on
  // le gère proprement au cas où.
  let sha;
  const existing = await fetch(`${API_BASE}/${path}?ref=${GITHUB_BRANCH}`, { headers: authHeaders() });
  if (existing.ok) {
    const data = await existing.json();
    sha = data.sha;
  }

  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message || `Ajout image ${path} (upload admin)`,
      content: base64Content,
      branch: GITHUB_BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('GITHUB_TOKEN invalide ou expiré.');
    if (res.status === 403) throw new Error("Le token GitHub n'a pas les droits d'écriture sur ce dépôt.");
    throw new Error(err.message || `Échec de l'upload GitHub (${res.status})`);
  }

  return {
    sitePath: '/' + path.replace(/^public\//, ''),
    raw: `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`,
  };
}
