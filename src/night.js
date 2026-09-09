import './night.css';
import { icon } from './icons.js';
import { isNightOpen, nextOpeningLabel } from './night-schedule.js';
import { loadCatalog } from './menu-client.js';

const S = {cat:null,cart:JSON.parse(localStorage.getItem('fd_cart')||'[]'),justAddedKey:null,catalog:null,loadError:false};
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
function nightProducts(){
 if(!S.catalog)return [];
 const slugs=new Set(nightCategories().map(c=>c.slug));
 return S.catalog.products.filter(p=>p.active!==false && slugs.has(p.categoryId));
}

function render(){
 const root=document.querySelector('#root');
 if(!S.catalog){
  root.innerHTML=`<div class="nightApp"><section class="nHero"><img class="nLogo" src="/images/night/logo.png" alt="Mondi Night"><p>${S.loadError?'Impossible de charger le menu, réessaie dans un instant.':'Chargement du menu…'}</p></section></div>`;
  return;
 }
 root.innerHTML=`<div class="nightApp">${header()}${hero()}${cats()}${cards()}${sticky()}<div id="nToast"></div></div>`;
 bind();
}

function header(){return `<header class="nHeader"><a href="/">${icon('arrow-left')}</a><span></span><a class="nCart" href="/index.html?view=cart">${icon('cart')}<b>${count()}</b></a></header>`}

function hero(){const open=isNightOpen();return `<section class="nHero"><img class="nLogo" src="/images/night/logo.png" alt="Mondi Night"><p>Vendredi &amp; samedi · 23h → 05h</p><span class="nPill ${open?'live':'wait'}"><b></b>${open?'OUVERT MAINTENANT':nextOpeningLabel()}</span></section>`}

function cats(){const list=nightCategories();return `<nav class="nCats">${list.map(c=>`<button class="${S.cat===c.slug?'active':''}" data-cat="${c.slug}">${c.label}</button>`).join('')}</nav>`}

function cards(){const list=nightProducts().filter(p=>p.categoryId===S.cat);return `<section class="nCards">${list.map(card).join('')}</section>`}

function card(p){
 const open=isNightOpen();
 const justAdded=S.justAddedKey===p.id;
 const action=open
  ?`<button class="nPlus${justAdded?' added':''}" data-add="${p.id}">${justAdded?icon('check'):icon('plus')}</button>`
  :`<span class="nWaitBadge" title="Disponible vendredi et samedi dès 23h">${icon('moon')}</span>`;
 return `<article class="nCard"><div class="nThumb"><img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'"></div><div class="nCopy"><h3>${p.name}</h3><p>${p.desc}</p><strong>${formatPrice(p.price)}</strong>${open?'':'<small class="nWaitNote">Dispo ven & sam dès 23h</small>'}</div>${action}</article>`;
}

function sticky(){return S.cart.length?`<div class="nSticky"><span class="nStickyBag">${icon('cart')}</span><span class="nStickyInfo"><b>${count()} articles</b><small>${formatPrice(total())}</small></span><a href="/index.html?view=cart">Voir le panier ${icon('arrow-right')}</a></div>`:''}

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
 document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{S.cat=b.dataset.cat;render()});
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>add(b.dataset.add));
}

async function boot(){
 try{
  S.catalog=await loadCatalog();
  const list=nightCategories();
  if(!S.cat||!list.some(c=>c.slug===S.cat))S.cat=list[0]?.slug||null;
 }catch{
  S.loadError=true;
 }
 render();
}
boot();
// La fenêtre d'ouverture peut basculer pendant que la page reste ouverte (ex. 5h
// du matin) : on revérifie régulièrement pour basculer vers l'écran "fermé".
setInterval(render,60000);
