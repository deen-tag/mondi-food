import './night.css';
import { icon } from './icons.js';
import { isNightOpen, nextOpeningLabel } from './night-schedule.js';
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

function render(){
 const root=document.querySelector('#root');
 if(!S.catalog){
  root.innerHTML=`<div class="nightApp"><section class="nHero"><img class="nLogo" src="/images/night/logo.png" alt="Mondi Night"><p>${S.loadError?'Impossible de charger le menu, réessaie dans un instant.':'Chargement du menu…'}</p></section></div>`;
  return;
 }
 const body = S.route==='category' ? `${backNav()}${cats()}${cards()}` : `${catBlocks()}${perks()}`;
 root.innerHTML=`<div class="nightApp">${header()}${hero()}${body}${sticky()}<div id="nToast"></div></div>${nContactSheet()}`;
 bind();
}

// ⚠️ Mêmes coordonnées placeholder que CONTACT dans main.js — à remplacer par les vraies avant mise en prod.
const CONTACT = {
 phone:'+33 6 00 00 00 00',
 phoneHref:'+33600000000',
 whatsapp:'33600000000',
 email:'contact@mondifood.fr',
};
function header(){return `<header class="nHeader"><button class="nPhone" data-contact>${icon('phone')}</button><a class="nHomeLogo" href="/"><img src="/images/night/logo.png" alt="Mondi Night"></a><a class="nCart" href="/index.html?view=cart">${icon('cart')}<b>${count()}</b></a></header>`}

function hero(){const open=isNightOpen();return `<section class="nHero"><p>Vendredi &amp; samedi · 23h → 05h</p><span class="nPill ${open?'live':'wait'}"><b></b>${open?'OUVERT MAINTENANT':nextOpeningLabel()}</span></section>`}

function perks(){return `<section class="nPerks"><div><b>${icon('fire','',true)}</b><strong>Cuisson parfaite</strong><small>Doré & croustillant</small></div><div><b>${icon('check')}</b><strong>Ingrédients frais</strong><small>Sélectionnés avec soin</small></div><div><b>${icon('delivery')}</b><strong>Livraison rapide</strong><small>30–45 min</small></div></section>`}

// Image représentative d'une catégorie pour les blocs : celle choisie dans
// l'admin en priorité, sinon la photo du premier produit qu'elle contient
// (même logique de repli que typeMeta() côté site principal).
function catImg(c){
 if(c.img)return c.img;
 const first=S.catalog.products.find(p=>p.active!==false && productCategorySlugs(p).includes(c.slug));
 return first?.img||'/images/logo.png';
}
function catCount(c){return S.catalog.products.filter(p=>p.active!==false && productCategorySlugs(p).includes(c.slug)).length}

function backNav(){return `<button class="nBack" data-go="home">${icon('arrow-left')} <span>Retour au menu</span></button>`}

function cats(){const list=nightCategories();return `<nav class="nCats">${list.map(c=>`<button class="${S.cat===c.slug?'active':''}" data-cat="${c.slug}">${c.label}</button>`).join('')}</nav>`}

function catBlocks(){
 const list=nightCategories();
 return `<section class="nTiles">${list.map(c=>`<button class="nTile${S.cat===c.slug?' active':''}" data-cat="${c.slug}"><div class="nTileText"><h3>${c.label}</h3><p>${catCount(c)} au menu</p></div><div class="nTileImg"><img src="${catImg(c)}" onerror="this.style.display='none'"></div><span>${S.cat===c.slug?'Sélectionné':'Voir'} ${icon('arrow-right')}</span></button>`).join('')}</section>`;
}

function cards(){const list=nightProducts().filter(p=>productCategorySlugs(p).includes(S.cat));return `<section class="nCards">${list.map(card).join('')}</section>`}

function card(p){
 const open=isNightOpen();
 const justAdded=S.justAddedKey===p.id;
 const action=open
  ?`<button class="nPlus${justAdded?' added':''}" data-add="${p.id}">${justAdded?icon('check'):icon('plus')}</button>`
  :`<span class="nWaitBadge" title="Disponible vendredi et samedi dès 23h">${icon('moon')}</span>`;
 return `<article class="nCard"><div class="nThumb"><img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'"></div><div class="nCopy"><h3>${p.name}</h3><p>${p.desc}</p><strong>${formatPrice(p.price)}</strong>${open?'':'<small class="nWaitNote">Dispo ven & sam dès 23h</small>'}</div>${action}</article>`;
}

function sticky(){return S.cart.length?`<div class="nSticky"><span class="nStickyBag">${icon('cart')}</span><span class="nStickyInfo"><b>${count()} articles</b><small>${formatPrice(total())}</small></span><a href="/index.html?view=cart">Voir le panier ${icon('arrow-right')}</a></div>`:''}

function nContactSheet(){
 if(!S.contactOpen)return '';
 return `<div class="nSheetWrap"><div class="nSheetBackdrop" data-contact-close></div><div class="nSheetPanel"><div class="nSheetHandle"></div><button class="nSheetClose" data-contact-close>${icon('close')}</button><h2>NOUS CONTACTER</h2><p class="nSheetSub">Une question sur ta commande ? On te répond vite.</p><div class="nContactLinks">
<a class="nContactRow" href="tel:${CONTACT.phoneHref}">${icon('phone')}<div><b>Téléphone</b><small>${CONTACT.phone}</small></div></a>
<a class="nContactRow" href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener">${icon('phone')}<div><b>WhatsApp</b><small>Réponse rapide</small></div></a>
<a class="nContactRow" href="mailto:${CONTACT.email}">${icon('mail')}<div><b>Email</b><small>${CONTACT.email}</small></div></a>
</div></div></div>`;
}

function add(id){
 if(!isNightOpen())return;
 const p=nightProducts().find(x=>x.id===id);
 if(!p)return;
 let x=S.cart.find(x=>x.key===id);
 x?x.qty++:S.cart.push({id:p.id,key:p.id,name:p.name,img:p.img,price:p.price,opts:[],qty:1});
 save();
 toast('Ajouté au panier');
 S.justAddedKey=id;
 render();
 setTimeout(()=>{if(S.justAddedKey===id){S.justAddedKey=null;render()}},1000);
}

function toast(t){
 const e=document.querySelector('#nToast');if(!e)return;
 e.innerHTML=icon('check')+' '+t;e.className='nToast';
 setTimeout(()=>e.className='',1500);
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
setInterval(render,60000);
