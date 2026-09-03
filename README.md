# Food Dark Kitchen — V2 premium

Cette version rapproche volontairement le frontend des maquettes générées :
- identité noir/violet
- typographies Barlow Condensed + Inter
- hero et cartes visuelles
- vraies images issues des maquettes de référence
- navigation mobile
- menu Pizza / Pannuezo
- fiche produit
- panier
- checkout livraison
- choix paiement en ligne / à la livraison
- confirmation et suivi
- localStorage pour le panier

Lancer :
`npm install`
`npm run dev`

Le paiement en ligne reste une simulation frontend : il faudra connecter un prestataire côté backend avant mise en production.

## Effets premium V2+
- animations d’entrée des écrans et des cartes
- micro-interactions sur boutons, cartes et filtres
- zoom subtil des photos
- glow/hover sur CTA
- badge panier animé
- animation du logo
- panier flottant animé
- feedback animé lors d’un ajout au panier
- écran de confirmation animé
- respect de `prefers-reduced-motion`

## UX finale
Aucun compte, profil ou connexion : la navigation mobile est volontairement limitée à
**Accueil · Menu · Panier · Suivi**. La commande reste possible sans créer de compte.
