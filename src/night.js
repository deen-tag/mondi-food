import './style.css';
import './night.css';
import { icon } from './icons.js';
import { isNightOpen, nextOpeningDate, minutesUntilClose } from './night-schedule.js';
import { loadCatalog } from './menu-client.js';

const S = {route:'home',cat:null,cart:JSON.parse(localStorage.getItem('fd_cart')||'[]'),justAddedKey:null,catalog:null,loadError:false,contactOpen:false};
const formatPrice = n => n.toFixed(2).replace('.',',')+' €';
const count = () => S.cart.reduce((a,x)=>a+x.qty,0);
const total = () => S.cart.reduce((a,x)=>a+x.price*x.qty,0);
const save = () => localStorage.setItem('fd_cart',JSON.stringify(S.cart));

// Catégories affichées sur Mondi Night : celles marquées actives, de type "produits"
// (pas un configurateur), et dont la liste "sites" inclut 'night' — gérées par le
// gérant depuis l'admin, plus aucune n'est codée en dur ici.
function nightCategories(){
 if(!S.catalog)return [];
 return S.catalog.categories
  .filter(c=>c.active!==false && c.kind==='products' && Array.isArray(c.sites) && c.sites.includes('night'))
  .sort((a,b)=>(a.order||0)-(b.order||0));
}
// Un produit peut être rattaché à d'autres catégories en plus de sa catégorie
// principale (ex. un produit "Pizza" du site principal aussi listé dans une
// catégorie "Plats Night") — voir le champ extraCategoryIds géré depuis l'admin.
function productCategorySlugs(p){return [p.categoryId,...(p.extraCategoryIds||[])]}
function nightProducts(){
 if(!S.catalog)return [];
 const slugs=new Set(nightCategories().map(c=>c.slug));
 return S.catalog.products.filter(p=>p.active!==false && productCategorySlugs(p).some(id=>slugs.has(id)));
}

// ⚠️ Mêmes coordonnées placeholder que CONTACT dans main.js — à remplacer par les vraies avant mise en prod.
const CONTACT = {
 phone:'+33 7 48 54 52 95',
 phoneHref:'+33748545295',
 whatsapp:'33748545295',
 email:'contact@mondifood.fr',
};

// header — mêmes classes/dimensions que le site principal (logo 110px, icônes 28px)
function header(){return `<header><button class="hamb" data-contact>${icon('phone')}</button><a class="logo" href="/"><img src="/images/night/logo.png" alt="Mondi Night"></a><a class="cartIcon" href="/index.html?view=cart&from=night">${icon('cart')}<b>${count()}</b></a></header>`}

function hero(){
 const open=isNightOpen();
 let label;
 if(open){label='OUVERT MAINTENANT'}
 else{
  const diff=Math.max(0,nextOpeningDate()-new Date());
  const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000);
  label=`Ouvre dans ${h>0?`${h}h${String(m).padStart(2,'0')}`:`${m} min`}`;
 }
 return `<section class="homeHero nStars"><span class="statusPill ${open?'live':'wait'}"><b></b>${label}</span></section>`;
}

// Alerte affichée en fin de service pour éviter les commandes passées juste
// avant la coupure à 5h (le client ne s'en rendrait compte qu'au moment de payer).
function closingSoon(){
 const mins=minutesUntilClose();
 if(mins===null||mins>45)return '';
 return `<div class="closingSoon">${icon('moon')} Dernières commandes possibles dans ${mins} min (fermeture à 5h)</div>`;
}

// perks — identique au bloc "3 avantages" du site principal
function perks(){return `<section class="perks"><div><b>${icon('fire','',true)}</b><strong>Cuisson parfaite</strong><small>Doré & croustillant</small></div><div><b>${icon('check')}</b><strong>Ingrédients frais</strong><small>Sélectionnés avec soin</small></div><div><b>${icon('delivery')}</b><strong>Livraison rapide</strong><small>30–45 min</small></div></section>`}

// Image représentative d'une catégorie pour les blocs : celle choisie dans
// l'admin en priorité, sinon la photo du premier produit qu'elle contient
// (même logique de repli que typeMeta() côté site principal).
function catImg(c){
 if(c.img)return c.img;
 const first=S.catalog.products.find(p=>p.active!==false && productCategorySlugs(p).includes(c.slug));
 return first?.img||'/images/logo.png';
}
function catCount(c){return S.catalog.products.filter(p=>p.active!==false && productCategorySlugs(p).includes(c.slug)).length}

// même conteneur .menuTop que le site de jour : donne la marge gauche/haut du bouton retour
function backNav(){return `<div class="menuTop"><button class="back" data-go="home">${icon('arrow-left')} <span>Retour au menu</span></button></div>`}

function cats(){const list=nightCategories();return `<div class="switch">${list.map(c=>`<button class="${S.cat===c.slug?'active':''}" data-cat="${c.slug}">${c.label}</button>`).join('')}</div>`}

// blocs catégories — mêmes classes .homeTiles/.tile/.tileImg/.tileText que le site principal
// Bannière visuelle en haut de l'accueil Night (même rôle que la bannière "100% livraison" du jour)
function homeBanner(){return `<section class="nightHeroWrap"><img class="nightHeroImg" src="/images/night/banner-nuit.jpg" width="1000" height="375" alt="Mondi Night — Le goût de la nuit : tous nos produits à 8€, vendredi et samedi soir"></section>`}

// tuile catégorie — mêmes classes .tile/.tileImg/.tileText que le site principal.
// Toutes les catégories s'affichent en petites cartes côte à côte (grille .catGrid,
// définie dans style.css), comme sur le site de jour — aucune n'est mise en avant.
function catTile(c){return `<button class="tile" data-cat="${c.slug}"><div class="tileText"><i>${catCount(c)} AU MENU</i><h3>${c.label}</h3><p>Découvre notre sélection ${c.label.toLowerCase()}</p></div><div class="tileImg"><img src="${catImg(c)}" onerror="this.style.display='none'"></div><span>Découvrir ${icon('arrow-right')}</span></button>`}
function catBlocks(){
 const list=nightCategories();
 if(!list.length)return '';
 return `<section class="block tight catBlock"><div class="heading"><span><i>PARCOURIR</i><h2>Nos catégories</h2></span></div><div class="homeTiles catGrid">${list.map(catTile).join('')}</div></section>`;
}

// "Nos plats night" : produits marqués "populaire nuit" dans l'admin ; à défaut, les
// premiers produits Night, pour ne jamais afficher une section vide.
function featuredNight(){
 const all=nightProducts();
 const pop=all.filter(p=>p.popularNight);
 return (pop.length?pop:all).slice(0,8);
}
// mini carte — mêmes classes .mini/.miniMain/.miniAdd que le site principal ; hors
// horaires, le bouton "Ajouter" est remplacé par "Dès 23h" (comme le "+" des cartes).
function mini(p){
 const open=isNightOpen();
 const justAdded=S.justAddedKey===p.id;
 const badge=productBadge(p);
 const action=open
  ?`<button class="miniAdd${justAdded?' added':''}" data-add="${p.id}">${justAdded?icon('check')+' Ajouté':icon('plus')+' Ajouter'}</button>`
  :`<span class="miniAdd wait">${icon('moon')} Dès 23h</span>`;
 return `<article class="mini">${badge?`<em class="badge">${icon('star','',true)} ${badge}</em>`:''}<div class="miniMain"><img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'"><b>${p.name}</b><strong>${formatPrice(p.price)}</strong></div>${action}</article>`;
}
function platsNight(){
 const list=featuredNight();
 if(!list.length)return '';
 const first=nightCategories()[0];
 return `<section class="block tight"><div class="heading"><span><i>À LA CARTE</i><h2>Nos incontournables</h2></span>${first?`<button data-cat="${first.slug}">Tout voir ${icon('arrow-right')}</button>`:''}</div><div class="railWrap"><div class="rail">${list.map(mini).join('')}</div></div></section>`;
}

function cards(){const list=nightProducts().filter(p=>productCategorySlugs(p).includes(S.cat));return `<section class="menuSection"><div class="cards">${list.map(card).join('')}</div></section>`}

function productBadge(p){return p.badge || (p.popularNight ? 'POPULAIRE' : null)}

// carte produit — mêmes classes .card/.cardMain/.thumb/.copy/.badge/.plus que le site principal
function card(p){
 const open=isNightOpen();
 const justAdded=S.justAddedKey===p.id;
 const badge=productBadge(p);
 const action=open
  ?`<button class="plus${justAdded?' added':''}" data-add="${p.id}">${justAdded?icon('check'):icon('plus')}</button>`
  :`<span class="waitBadge" title="Disponible vendredi et samedi dès 23h">${icon('moon')}</span>`;
 return `<article class="card"><div class="cardMain"><div class="thumb">${badge?`<em class="badge">${icon('star','',true)} ${badge}</em>`:''}<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'"></div><div class="copy"><h3>${p.name}</h3><p>${p.desc}</p><strong>${formatPrice(p.price)}</strong>${open?'':'<small class="waitNote">Dispo ven & sam dès 23h</small>'}</div></div>${action}</article>`;
}

// barre panier collante — mêmes classes .sticky/.stickyBag/.stickyInfo/.cta.pill
function sticky(){return S.cart.length?`<div class="sticky"><span class="stickyBag">${icon('cart')}</span><span class="stickyInfo"><b>${count()} articles</b><small>${formatPrice(total())}</small></span><a class="cta pill" href="/index.html?view=cart&from=night">Voir le panier ${icon('arrow-right')}</a></div>`:''}

// barre d'onglets — mêmes classes/icônes que le site principal. "Accueil" reste
// sur Mondi Night ; "Infos" et "Suivi" n'ont pas d'équivalent ici, donc ce sont
// de simples liens vers le site principal (comme le fait déjà le panier), avec
// ?from=night pour que ces pages gardent le thème sombre côté site principal.
function navBar(){return `<nav>
<button data-go="home" class="${S.route==='home'?'on':''}"><i>${icon('home')}</i><small>Accueil</small></button>
<a href="/index.html?view=about&from=night"><i>${icon('info')}</i><small>Infos</small></a>
<a href="/index.html?view=cart&from=night"><i>${icon('cart')}<b>${count()}</b></i><small>Panier</small></a>
<a href="/index.html?view=track&from=night"><i>${icon('tracking')}</i><small>Suivi</small></a></nav>`}

// fiche contact — même markup/classes que la sheetWrap du site principal
function contactSheet(){
 if(!S.contactOpen)return '';
 return `<div class="sheetWrap"><div class="sheetBackdrop" data-contact-close></div><div class="sheetPanel"><div class="sheetHandle"></div><button class="sheetClose" data-contact-close>${icon('close')}</button><h2>NOUS <span class="accent">CONTACTER</span></h2><p class="sheetSub">Une question ? Une envie ?<br>Commandez facilement <b>par téléphone</b> ou via WhatsApp !</p><div class="callBadge">${icon('phone')}<span>Un appel et c'est parti !</span></div><div class="contactLinks">
<a class="contactRow" href="tel:${CONTACT.phoneHref}"><span class="contactIcon phoneIcon">${icon('phone')}</span><div class="contactInfo"><b>Téléphone</b><small>${CONTACT.phone}</small></div><span class="contactCta">${icon('phone')}Appeler</span></a>
<a class="contactRow waRow" href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener"><span class="contactIcon waIcon">${icon('whatsapp')}</span><div class="contactInfo"><b>WhatsApp</b><small>${CONTACT.phone}</small></div><span class="contactCta wa">${icon('phone')}Appeler</span></a>
</div><div class="contactFooter"><div>${icon('clock')}<span>Toujours à<br>vos côtés</span></div><div>${icon('fire')}<span>Commande<br>rapide</span></div></div></div></div>`;
}

function render(){
 const root=document.querySelector('#root');
 if(!S.catalog){
  root.innerHTML=`<div class="phone nightMode"><section class="simple"><i>MONDI NIGHT</i><h1>${S.loadError?'CONNEXION IMPOSSIBLE':'CHARGEMENT…'}</h1><p>${S.loadError?'Impossible de charger le menu, réessaie dans un instant.':'Un instant, on prépare le menu.'}</p></section></div>`;
  return;
 }
 const body = S.route==='category' ? `${backNav()}${cats()}${cards()}` : `${homeBanner()}${platsNight()}${catBlocks()}${perks()}`;
 root.innerHTML=`<div class="phone nightMode${S.cart.length?' hasSticky':''}">${header()}${hero()}${closingSoon()}<main id="screen">${body}</main>${navBar()}${sticky()}<div id="toast"></div>${contactSheet()}</div>`;
 bind();
 initReveal();
}

function add(id){
 if(!isNightOpen())return;
 const p=nightProducts().find(x=>x.id===id);
 if(!p)return;
 let x=S.cart.find(x=>x.key===id);
 x?x.qty++:S.cart.push({id:p.id,key:p.id,name:p.name,img:p.img,price:p.price,opts:[],qty:1});
 save();
 toast('Ajouté au panier');
 // Mise à jour ciblée (pas de render() complet) : redessiner toute la page à
 // chaque "+" rejouait les animations d'entrée (page, cartes, barre panier)
 // → effet de rebond bas/haut. On ne touche que ce qui change vraiment.
 const prev=S.justAddedKey;
 S.justAddedKey=id;
 if(prev&&prev!==id)setAddButton(prev,false);
 setAddButton(id,true);
 updateCartUI();
 setTimeout(()=>{if(S.justAddedKey===id){S.justAddedKey=null;setAddButton(id,false)}},1000);
}

// bouton "+" de la carte : passe en "✓" vert puis revient (classe .added)
function setAddButton(id,on){
 document.querySelectorAll('[data-add]').forEach(b=>{
  if(b.dataset.add!==id)return;
  b.classList.toggle('added',on);
  b.innerHTML=b.classList.contains('miniAdd')?(on?icon('check')+' Ajouté':icon('plus')+' Ajouter'):(on?icon('check'):icon('plus'));
 });
}

// pastilles du panier (header + onglets), barre panier collante, espace du bas
function updateCartUI(){
 const c=count();
 document.querySelectorAll('.cartIcon b, nav b').forEach(b=>{
  b.textContent=c;
  b.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});
 });
 document.querySelector('.phone')?.classList.toggle('hasSticky',S.cart.length>0);
 const info=document.querySelector('.sticky .stickyInfo');
 if(info){info.innerHTML=`<b>${c} articles</b><small>${formatPrice(total())}</small>`}
 else if(S.cart.length){document.querySelector('#toast')?.insertAdjacentHTML('beforebegin',sticky())}
}

function toast(t){
 const e=document.querySelector('#toast');if(!e)return;
 e.innerHTML=icon('check')+' '+t;e.className='toast';
 setTimeout(()=>e.className='',1500);
}

// même reveal au scroll que le site principal (.card apparaît en fondu)
function initReveal(){
 const els=document.querySelectorAll('.card:not(.in)');
 if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('in'));return}
 const io=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}})
 },{threshold:.15});
 els.forEach(el=>io.observe(el));
}

function bind(){
 document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{S.cat=b.dataset.cat;S.route='category';render()});
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{S.route=b.dataset.go;render()});
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
 document.querySelectorAll('[data-contact]').forEach(b=>b.onclick=()=>{S.contactOpen=true;render()});
 document.querySelectorAll('[data-contact-close]').forEach(b=>b.onclick=()=>{S.contactOpen=false;render()});
}

async function boot(){
 try{
  S.catalog=await loadCatalog();
  const list=nightCategories();
  if(S.cat&&!list.some(c=>c.slug===S.cat)){S.cat=null;S.route='home'}
 }catch{
  S.loadError=true;
 }
 render();
}
boot();
// La fenêtre d'ouverture peut basculer pendant que la page reste ouverte (ex. 5h
// du matin) : on revérifie régulièrement pour basculer vers l'écran "fermé".
let lastOpen=isNightOpen();
setInterval(()=>{
 const open=isNightOpen();
 if(!S.catalog||open!==lastOpen){lastOpen=open;render();return}
 refreshStatus();
},60000);

// Même contenu qu'avant (compte à rebours d'ouverture, alerte fin de service)
// mais en ne touchant au DOM que si le texte a changé : plus de redessin complet
// (et donc plus de saut d'animation) toutes les minutes.
function refreshStatus(){
 const tmp=document.createElement('div');
 tmp.innerHTML=hero();
 const pill=document.querySelector('.statusPill'),nextPill=tmp.querySelector('.statusPill');
 if(pill&&nextPill&&pill.textContent!==nextPill.textContent)pill.replaceWith(nextPill);
 const html=closingSoon(),cur=document.querySelector('.closingSoon');
 if(cur&&!html)cur.remove();
 else if(cur&&html){const t=document.createElement('div');t.innerHTML=html;if(cur.textContent!==t.firstChild.textContent)cur.replaceWith(t.firstChild)}
 else if(!cur&&html)document.querySelector('#screen')?.insertAdjacentHTML('beforebegin',html);
}
