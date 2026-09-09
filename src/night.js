import './night.css';
import { icon } from './icons.js';
import { BOISSONS, DESSERTS } from './shared-products.js';
import { isNightOpen, nextOpeningLabel } from './night-schedule.js';

// ⚠️ Aucune photo dédiée n'existe encore pour les burgers/pâtes/galettes : les
// chemins ci-dessous (/images/night/...) sont à préparer et déposer dans
// public/images/night/ avant mise en prod. En attendant, l'image ne s'affichera
// pas si le fichier est absent (le cadre reste propre grâce au fond de .nImg).
const N = [
 {id:'nb1',type:'burger',name:'Le Classique',price:11.90,desc:'Steak haché, salade, tomate, oignons, sauce burger maison',img:'/images/night/burger-classique.jpg'},
 {id:'nb2',type:'burger',name:'Le Cheese',price:12.90,desc:'Steak haché, cheddar fondant, salade, tomate, sauce burger maison',img:'/images/night/burger-cheese.jpg'},
 {id:'nb3',type:'burger',name:'Le Bacon',price:13.90,desc:'Steak haché, bacon grillé, cheddar, oignons caramélisés, sauce fumée',img:'/images/night/burger-bacon.jpg'},
 {id:'nb4',type:'burger',name:'Le Chicken',price:13.90,desc:'Poulet croustillant, salade, tomate, sauce burger maison',img:'/images/night/burger-chicken.jpg'},
 {id:'nb5',type:'burger',name:'Le Montagnard',price:14.90,desc:'Steak haché, reblochon fondant, oignons caramélisés, sauce montagnarde',img:'/images/night/burger-montagnard.jpg'},
 {id:'nb6',type:'burger',name:'Le Spécial Mondi',price:15.90,desc:'Double steak, cheddar, bacon, oignons frits, sauce signature Mondi',img:'/images/night/burger-special-mondi.jpg',badge:'SIGNATURE'},
 {id:'np1',type:'pate',name:'Penne Bolognaise',price:11.90,desc:'Sauce tomate mijotée, viande hachée, parmesan',img:'/images/night/pates-bolognaise.jpg'},
 {id:'np2',type:'pate',name:'Penne Carbonara',price:12.90,desc:'Crème, lardons, parmesan, poivre',img:'/images/night/pates-carbonara.jpg'},
 {id:'np3',type:'pate',name:'Penne Poulet Crème',price:13.90,desc:'Poulet rôti, crème, champignons, parmesan',img:'/images/night/pates-poulet-creme.jpg'},
 {id:'np4',type:'pate',name:'Penne 4 Fromages',price:13.90,desc:'Mozzarella, gorgonzola, chèvre, parmesan',img:'/images/night/pates-4-fromages.jpg'},
 {id:'np5',type:'pate',name:'Penne Épicées',price:13.90,desc:'Sauce tomate relevée, piment, chorizo',img:'/images/night/pates-epicees.jpg',hot:true},
 {id:'ng1',type:'galette',name:'La Complète',price:11.90,desc:'Jambon, œuf, fromage, roulée dans une galette de sarrasin',img:'/images/night/galette-complete.jpg'},
 {id:'ng2',type:'galette',name:'Jambon Fromage',price:10.90,desc:'Jambon, emmental fondant, galette de sarrasin roulée',img:'/images/night/galette-jambon-fromage.jpg'},
 {id:'ng3',type:'galette',name:'Poulet Fromage',price:12.90,desc:'Poulet rôti, emmental fondant, galette de sarrasin roulée',img:'/images/night/galette-poulet-fromage.jpg'},
 {id:'ng4',type:'galette',name:'Poulet Curry',price:13.90,desc:'Poulet, sauce curry, oignons, galette de sarrasin roulée',img:'/images/night/galette-poulet-curry.jpg'},
 {id:'ng5',type:'galette',name:'3 Fromages',price:12.90,desc:'Emmental, chèvre, gorgonzola, galette de sarrasin roulée',img:'/images/night/galette-3-fromages.jpg'},
 ...BOISSONS,
 ...DESSERTS,
];

const CATS = [
 {type:'burger',label:'Burgers'},
 {type:'pate',label:'Pâtes'},
 {type:'galette',label:'Galettes'},
 {type:'boisson',label:'Boissons'},
 {type:'dessert',label:'Desserts'},
];

const S = {cat:'burger',cart:JSON.parse(localStorage.getItem('fd_cart')||'[]'),justAddedKey:null};
const formatPrice = n => n.toFixed(2).replace('.',',')+' €';
const count = () => S.cart.reduce((a,x)=>a+x.qty,0);
const total = () => S.cart.reduce((a,x)=>a+x.price*x.qty,0);
const save = () => localStorage.setItem('fd_cart',JSON.stringify(S.cart));

function render(){
 const root=document.querySelector('#root');
 root.innerHTML=`<div class="nightApp">${header()}${hero()}${cats()}${cards()}${sticky()}<div id="nToast"></div></div>`;
 bind();
}

function header(){return `<header class="nHeader"><a href="/">${icon('arrow-left')}</a><span></span><a class="nCart" href="/index.html?view=cart">${icon('cart')}<b>${count()}</b></a></header>`}

function hero(){const open=isNightOpen();return `<section class="nHero"><img class="nLogo" src="/images/night/logo.png" alt="Mondi Night"><p>Vendredi &amp; samedi · 23h → 05h</p><span class="nPill ${open?'live':'wait'}"><b></b>${open?'OUVERT MAINTENANT':nextOpeningLabel()}</span></section>`}

function cats(){return `<nav class="nCats">${CATS.map(c=>`<button class="${S.cat===c.type?'active':''}" data-cat="${c.type}">${c.label}</button>`).join('')}</nav>`}

function cards(){const list=N.filter(p=>p.type===S.cat);return `<section class="nCards">${list.map(card).join('')}</section>`}

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
 const p=N.find(x=>x.id===id);
 if(!p)return;
 let x=S.cart.find(x=>x.key===id);
 x?x.qty++:S.cart.push({id:p.id,key:p.id,name:p.name,img:p.img,type:p.type,price:p.price,opts:[],qty:1});
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

render();
// La fenêtre d'ouverture peut basculer pendant que la page reste ouverte (ex. 5h
// du matin) : on revérifie régulièrement pour basculer vers l'écran "fermé".
setInterval(render,60000);
