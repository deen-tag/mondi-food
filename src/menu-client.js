// Chargement du catalogue (site principal + Mondi Night) depuis /api/menu.
// Une seule requête réseau par visite : le résultat est gardé en mémoire tant que
// la page n'est pas rechargée (le SPA ne fait jamais de vrai rechargement en
// naviguant, donc ça suffit pour refléter les modifs faites par le gérant dès la
// prochaine visite/rechargement).

let cached = null;
let pending = null;

export async function loadCatalog() {
  if (cached) return cached;
  if (pending) return pending;
  pending = fetch('/api/menu')
    .then((r) => { if (!r.ok) throw new Error('Impossible de charger le menu'); return r.json(); })
    .then((data) => { cached = data; pending = null; return data; })
    .catch((err) => { pending = null; throw err; });
  return pending;
}
