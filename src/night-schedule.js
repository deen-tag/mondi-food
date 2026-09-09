// Fenêtre d'ouverture de "Mondi Night" : vendredi et samedi soir, 23h → 5h du matin.
// Centralisé ici pour que la bannière de l'accueil (main.js) et la page night.html
// (night.js) appliquent exactement les mêmes horaires — à modifier à un seul endroit
// si les horaires changent un jour.
const OPEN_HOUR = 23; // ouverture à 23h
const CLOSE_HOUR = 5; // fermeture à 5h du matin

export function isNightOpen(date = new Date()) {
  const day = date.getDay(); // 0=dimanche … 5=vendredi, 6=samedi
  const hour = date.getHours();
  if (day === 5 && hour >= OPEN_HOUR) return true; // vendredi soir
  if (day === 6 && (hour < CLOSE_HOUR || hour >= OPEN_HOUR)) return true; // nuit ven→sam + samedi soir
  if (day === 0 && hour < CLOSE_HOUR) return true; // nuit sam→dim
  return false;
}

// Message affiché quand c'est fermé (bannière accueil + écran "fermé" de night.html).
export function nextOpeningLabel(date = new Date()) {
  const day = date.getDay();
  const hour = date.getHours();
  const opensTonight = (day === 5 && hour < OPEN_HOUR) || (day === 6 && hour >= CLOSE_HOUR && hour < OPEN_HOUR);
  return opensTonight ? 'Ouvre ce soir à 23h' : 'Ouvre vendredi à 23h';
}
