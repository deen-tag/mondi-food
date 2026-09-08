
import './style.css';
import { icon, stars } from './icons.js';

const P = [
 {id:'m1',type:'pannuezo',name:'L’Original',price:12.90,desc:'Sauce tomate maison, mozzarella fondante, jambon fumé, origan',img:'/images/pannuezo-original.png',badge:'LE PLUS POPULAIRE',tag:'Classiques'},
 {id:'m2',type:'pannuezo',name:'Poulet Crémeux',price:13.90,desc:'Crème fraîche, mozzarella, poulet rôti, champignons, oignons caramélisés',img:'/images/pannuezo-poulet.png',tag:'Gourmands'},
 {id:'m3',type:'pannuezo',name:'Diavolo',price:13.50,desc:'Sauce tomate épicée, mozzarella, chorizo, poivrons, piment',img:'/images/pannuezo-diavolo.png',hot:true,tag:'Épicés'},
 {id:'m4',type:'pannuezo',name:'Végétarien',price:12.90,desc:'Sauce tomate, mozzarella, courgettes grillées, poivrons, champignons, roquette',img:'/images/pannuezo-vege.png',veg:true,tag:'Végétariens'},
 {id:'p1',type:'pizza',name:'Margherita',price:11.90,desc:'Sauce tomate maison, mozzarella fior di latte, basilic frais, huile d’olive',img:'/images/margherita.png',badge:'LA PLUS POPULAIRE',tag:'Classiques'},
 {id:'p2',type:'pizza',name:'Pepperoni',price:12.90,desc:'Sauce tomate, mozzarella, pepperoni, origan',img:'/images/pepperoni.png',tag:'Classiques'},
 {id:'p3',type:'pizza',name:'4 Fromages',price:12.90,desc:'Mozzarella, gorgonzola, chèvre, parmesan, emmental',img:'/images/four-cheese.png',tag:'Gourmandes'},
 {id:'p4',type:'pizza',name:'Légumes Rôtis',price:12.50,desc:'Sauce tomate, mozzarella, poivrons, courgettes, aubergines, oignons rouges',img:'/images/veggie.png',veg:true,tag:'Végétariennes'},
 {id:'p5',type:'pizza',name:'Diavolo',price:13.50,desc:'Sauce tomate épicée, mozzarella, chorizo, poivrons, piment',img:'/images/diavolo.png',hot:true,tag:'Épicées'},
];

// Catalogue du configurateur "Compose ta recette" — copie volontairement
// séparée du backend (api/_menu.js), pour la même raison que P/MENU : le
// prix affiché ici est indicatif, le prix payé est recalculé côté serveur.
const CUSTOM_CONFIG = {
 pizza:{label:'Pizza',img:'/images/pizza-card.png',basePrice:8.90,
  bases:[{id:'fine',name:'Pâte fine',extra:0},{id:'epaisse',name:'Pâte épaisse',extra:0},{id:'sans-gluten',name:'Pâte sans gluten',extra:2}],
  sauces:[{id:'tomate',name:'Sauce tomate',extra:0},{id:'creme',name:'Crème fraîche',extra:0},{id:'sans-sauce',name:'Sans sauce',extra:0}],
  ingredients:[
   {id:'mozzarella',name:'Mozzarella',price:1.5},{id:'chevre',name:'Chèvre',price:1.8},
   {id:'gorgonzola',name:'Gorgonzola',price:1.8},{id:'jambon',name:'Jambon',price:1.8},
   {id:'chorizo',name:'Chorizo',price:1.8},{id:'poulet',name:'Poulet rôti',price:2},
   {id:'champignons',name:'Champignons',price:1},{id:'poivrons',name:'Poivrons',price:1},
   {id:'oignons',name:'Oignons rouges',price:1},{id:'olives',name:'Olives',price:1},
   {id:'roquette',name:'Roquette',price:1},{id:'piment',name:'Piment frais',price:0.8},
  ]},
 pannuezo:{label:'Pannuezo',img:'/images/pannuezo-card.png',basePrice:9.90,
  bases:[{id:'classique',name:'Pain classique',extra:0},{id:'complet',name:'Pain complet',extra:0.8}],
  sauces:[{id:'tomate',name:'Sauce tomate',extra:0},{id:'creme',name:'Crème fraîche',extra:0},{id:'epicee',name:'Sauce épicée',extra:0},{id:'sans-sauce',name:'Sans sauce',extra:0}],
  ingredients:[
   {id:'mozzarella',name:'Mozzarella',price:1.5},{id:'jambon',name:'Jambon fumé',price:1.8},
   {id:'poulet',name:'Poulet rôti',price:2},{id:'chorizo',name:'Chorizo',price:1.8},
   {id:'champignons',name:'Champignons',price:1},{id:'oignons',name:'Oignons caramélisés',price:1},
   {id:'poivrons',name:'Poivrons',price:1},{id:'courgettes',name:'Courgettes grillées',price:1},
   {id:'roquette',name:'Roquette',price:1},{id:'piment',name:'Piment',price:0.8},
  ]},
};

// ⚠️ À REMPLACER par les vraies coordonnées avant mise en prod — voir bottom sheet "Nous contacter".
// phone/whatsapp au format international. whatsapp sans "+" ni espaces (format attendu par wa.me).
const CONTACT = {
 phone:'+33 6 00 00 00 00',
 phoneHref:'+33600000000',
 whatsapp:'33600000000',
 email:'contact@mondifood.fr',
};

const S = {route:'home',type:'pizza',filter:'Toutes',selected:null,cart:JSON.parse(localStorage.getItem('fd_cart')||'[]'),trackData:null,promo:null,promoChecking:false,promoDraft:'',justAddedKey:null,orderForm:{},opts:{cheese:false,spicy:false},contactOpen:false,builder:{type:'pizza',base:'fine',sauce:'tomate',ingredients:[]}};

// Réinitialise le configurateur pour un type donné (appelé à l'ouverture ou
// au changement d'onglet Pizza/Pannuezo, pour éviter un id de base/sauce
// orphelin d'un autre type, ex. 'fine' choisi puis bascule sur Pannuezo).
function initBuilder(type){
 const cfg=CUSTOM_CONFIG[type];
 S.builder={type,base:cfg.bases[0].id,sauce:cfg.sauces[0].id,ingredients:[]};
}
function builderPrice(){
 const cfg=CUSTOM_CONFIG[S.builder.type];
 const base=cfg.bases.find(b=>b.id===S.builder.base);
 const sauce=cfg.sauces.find(s=>s.id===S.builder.sauce);
 const ing=S.builder.ingredients.map(id=>cfg.ingredients.find(i=>i.id===id)).filter(Boolean);
 return Math.round((cfg.basePrice+base.extra+sauce.extra+ing.reduce((a,i)=>a+i.price,0))*100)/100;
}
let prevRoute=S.route,prevCount=null;
const formatPrice = n => n.toFixed(2).replace('.',',')+' €';
const count=()=>S.cart.reduce((a,x)=>a+x.qty,0);
const total=()=>S.cart.reduce((a,x)=>a+x.price*x.qty,0);
const discountAmount=()=>S.promo&&S.promo.valid?S.promo.discount:0;
const finalTotal=()=>{const d=total()+(total()>=25?0:2.5)-discountAmount();return Math.max(0,Math.round(d*100)/100)};

async function loadTrack(){
 const last=JSON.parse(localStorage.getItem('fd_last')||'{}');
 const oid=last.orderId||last.id;
 if(!oid){S.trackData=null;return}
 try{
  const res=await fetch(`/api/track?orderId=${encodeURIComponent(oid)}`);
  const data=await res.json();
  S.trackData=res.ok?data:null;
 }catch{S.trackData=null}
 if(S.route==='track')render();
}
const save=()=>localStorage.setItem('fd_cart',JSON.stringify(S.cart));

function shell(){document.querySelector('#root').innerHTML=`
<div class="phone">
<header><button class="hamb" data-contact>${icon('phone')}</button><button class="logo" data-go="home"><img src="/logo.png"></button>
<button class="cartIcon" data-go="cart">${icon('cart')}<b>${count()}</b></button></header>
<main id="screen"></main>${nav()}<div id="toast"></div><div id="contactSheet"></div></div>`;render()}

function contactSheet(){
 const c=document.querySelector('#contactSheet');
 if(!c)return;
 if(!S.contactOpen){c.className='';c.innerHTML='';return}
 c.className='sheetWrap';
 c.innerHTML=`<div class="sheetBackdrop" data-contact-close></div><div class="sheetPanel"><div class="sheetHandle"></div><button class="sheetClose" data-contact-close>${icon('close')}</button><h2>NOUS CONTACTER</h2><p class="sheetSub">Une question sur ta commande ? On te répond vite.</p><div class="contactLinks">
<a class="contactRow" href="tel:${CONTACT.phoneHref}">${icon('phone')}<div><b>Téléphone</b><small>${CONTACT.phone}</small></div></a>
<a class="contactRow" href="https://wa.me/${CONTACT.whatsapp}" target="_blank" rel="noopener">${icon('phone')}<div><b>WhatsApp</b><small>Réponse rapide</small></div></a>
<a class="contactRow" href="mailto:${CONTACT.email}">${icon('mail')}<div><b>Email</b><small>${CONTACT.email}</small></div></a>
</div></div>`;
 c.querySelectorAll('[data-contact-close]').forEach(b=>b.onclick=()=>{S.contactOpen=false;contactSheet()});
}

function nav(){return `<nav>
<button data-go="home" class="${S.route==='home'?'on':''}"><i>${icon('home')}</i><small>Accueil</small></button>
<button data-go="about" class="${S.route==='about'?'on':''}"><i>${icon('info')}</i><small>Infos</small></button>
<button data-go="cart" class="${S.route==='cart'?'on':''}"><i>${icon('cart')}<b>${count()}</b></i><small>Panier</small></button>
<button data-go="track" class="${S.route==='track'?'on':''}"><i>${icon('tracking')}</i><small>Suivi</small></button></nav>`}

function render(){
 const s=document.querySelector('#screen');
 if(S.route==='home')s.innerHTML=home();
 if(S.route==='menu'||S.route==='category')s.innerHTML=menu();
 if(S.route==='product')s.innerHTML=product();
 if(S.route==='cart')s.innerHTML=cart();
 if(S.route==='checkout')s.innerHTML=checkout();
 if(S.route==='confirmation')s.innerHTML=confirmation();
 if(S.route==='track')s.innerHTML=track();
 if(S.route==='about')s.innerHTML=about();
 if(S.route==='builder')s.innerHTML=builder();

 document.querySelector('nav')?.replaceWith(new DOMParser().parseFromString(nav(),'text/html').body.firstChild);
 if(S.route!==prevRoute){
  document.querySelector('nav .on i')?.animate([{transform:'scale(1)'},{transform:'scale(1.3)'},{transform:'scale(1)'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
  prevRoute=S.route;
 }
 const c=count();
 if(prevCount!==null&&c!==prevCount){
  document.querySelectorAll('.cartIcon b, nav b').forEach(b=>b.animate([{transform:'scale(1)'},{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'}));
 }
 prevCount=c;
 const headerCartB=document.querySelector('.cartIcon b');
 if(headerCartB)headerCartB.textContent=c;
 bind();initReveal();scrollTo(0,0);
}

function home(){return `
<section class="homeHero">
<span class="kicker">PANNUEZO & PIZZA</span><h1>100%<br>LIVRAISON</h1>
<p>Dark kitchen · saveurs intenses · livré chez vous</p>
<button class="cta" data-scroll="categories">VOIR LA CARTE <span>${icon('arrow-right')}</span></button>
<div class="delivery">${icon('delivery')} Livraison rapide <em></em> 30–45 min</div>
</section>
<section class="welcome"><div><span>OFFRE DE BIENVENUE</span><h3>-10% SUR VOTRE 1ÈRE COMMANDE</h3><div class="promoCopyRow"><b>WELCOME10</b><button class="copyBtn" data-copy="WELCOME10">${icon('copy')} COPIER</button></div></div><strong>%</strong></section>
<section class="homeTiles" id="categories">
${tile('pannuezo','/images/pannuezo-card.png','PANNUEZO','Ultra fondant · généreusement garni')}
${tile('pizza','/images/pizza-card.png','PIZZA','Pâte artisanale · ingrédients frais')}</section>
<section class="builderPromoWrap"><button class="builderPromo" data-open-builder="pizza"><span class="builderPromoTag">NOUVEAU</span><h3>COMPOSE TA RECETTE</h3><p>Pâte, sauce et garnitures : choisis chaque ingrédient toi-même.</p><em>Créer ma recette ${icon('arrow-right')}</em></button></section>
<section class="perks"><div><b>${icon('fire','',true)}</b><strong>Cuisson parfaite</strong><small>Doré & croustillant</small></div><div><b>${icon('check')}</b><strong>Ingrédients frais</strong><small>Sélectionnés avec soin</small></div><div><b>${icon('delivery')}</b><strong>Livraison rapide</strong><small>30–45 min</small></div></section>
<section class="block"><div class="heading"><span><i>À LA CARTE</i><h2>Nos incontournables</h2></span><button data-go="menu">Tout voir ${icon('arrow-right')}</button></div><div class="railWrap"><div class="rail">${P.slice(0,4).map(mini).join('')}</div></div></section>
<section class="nightBannerWrap"><button class="nightBanner" data-night><img src="/images/mondi-night-banner.jpg" alt="Mondi Night — Burgers & Pâtes, vendredi et samedi soir de 23h à 5h"><em class="soon">Bientôt disponible</em></button></section>`}

function tile(type,img,title,sub){return `<button class="tile" data-type="${type}" data-go="category"><div class="tileText"><i>${type==='pizza'?'PÂTE ARTISANALE':'SIGNATURE'}</i><h3>${title}</h3><p>${sub}</p></div><div class="tileImg"><img src="${img}"></div><span>Découvrir <i>${icon('arrow-right')}</i></span></button>`}
function mini(p){return `<article class="mini">${p.badge?`<em class="badge">${icon('star','',true)} ${p.badge}</em>`:''}<button class="miniMain" data-product="${p.id}"><img src="${p.img}"><b>${p.name}</b><strong>${formatPrice(p.price)}</strong></button><button class="miniAdd${S.justAddedKey===p.id?' added':''}" data-add="${p.id}">${S.justAddedKey===p.id?icon('check')+' Ajouté':icon('plus')+' Ajouter'}</button></article>`}

function menu(){
 const list=P.filter(x=>x.type===S.type).filter(x=>S.filter==='Toutes'||x.tag===S.filter);
 const filters=S.type==='pizza'?['Toutes','Classiques','Gourmandes','Épicées','Végétariennes']:['Toutes','Classiques','Gourmands','Épicés','Végétariens'];
 return `<section class="menuTop"><button class="back" data-go="home">${icon('arrow-left')}</button><div class="crumb"><span class="crumbHome">Accueil</span><span class="crumbSep">›</span><span class="crumbCurrent">${S.type==='pizza'?'Pizza':'Pannuezo'}</span></div><div class="menuHero"><div><h1>${S.type==='pizza'?'PIZZA':'PANNUEZO'}</h1><span class="uline"></span><p>${S.type==='pizza'?'Pizzas artisanales cuites à la perfection avec des ingrédients frais et une pâte maison moelleuse et croustillante.':'Découvrez nos Pannuezo ultra fondants, généreusement garnis et préparés avec des ingrédients de qualité.'}</p></div><div class="menuHeroImg"><img src="${S.type==='pizza'?'/images/pizza-card.png':'/images/pannuezo-card.png'}"></div></div>
<div class="featureRow"><span>${icon('fire','',true)} <b>Cuisson ${S.type==='pizza'?'au four':'parfaite'}</b><small>${S.type==='pizza'?'haute température':'Doré & croustillant'}</small></span><span>${icon('check')} <b>Ingrédients frais</b><small>Sélectionnés avec soin</small></span><span>${icon('clock')} <b>Livraison rapide</b><small>30–45 min</small></span></div></section>
<div class="switch"><button class="${S.type==='pizza'?'active':''}" data-type="pizza" data-go="category">Pizza</button><button class="${S.type==='pannuezo'?'active':''}" data-type="pannuezo" data-go="category">Pannuezo</button></div>
<section class="menuSection"><div class="heading"><span><i>NOS ${S.type==='pizza'?'PIZZAS':'PANNUEZO'}</i><h2>Choisis ton préféré</h2></span></div><div class="filters">${filters.map(f=>`<button class="${S.filter===f?'active':''}" data-filter="${f}">${f}</button>`).join('')}</div><button class="builderCard" data-open-builder="${S.type}"><span class="builderCardIcon">${icon('plus')}</span><div><b>CRÉE TA RECETTE</b><small>Pâte, sauce et garnitures 100% personnalisées</small></div><em>${icon('arrow-right')}</em></button><div class="cards">${list.map(card).join('')}</div></section>${sticky()}`}

function card(p){return `<article class="card"><button data-product="${p.id}" class="cardMain"><div class="thumb">${p.badge?`<em class="badge">${icon('star','',true)} ${p.badge}</em>`:''}<img src="${p.img}"></div><div class="copy"><h3>${p.name}</h3><p>${p.desc}</p><strong>${formatPrice(p.price)}</strong></div></button><button class="plus${S.justAddedKey===p.id?' added':''}" data-add="${p.id}">${S.justAddedKey===p.id?icon('check'):icon('plus')}</button></article>`}

function product(){
 const p=P.find(x=>x.id===S.selected); if(!p)return '';
 return `<section class="detail"><button class="back" data-go="menu">${icon('arrow-left')} <span>Retour au menu</span></button><div class="detailImg"><img src="${p.img}"><span>FRAIS · PRÉPARÉ À LA COMMANDE</span></div><div class="detailBody"><i>${p.type.toUpperCase()} · SIGNATURE</i><h1>${p.name}</h1><div class="stars">${stars(5)} <small>4,9 · Nos clients adorent</small></div><p class="desc">${p.desc}.</p><div class="detailPerks"><span>${icon('fire','',true)} Cuisson minute</span><span>${icon('check')} Ingrédients frais</span><span>${icon('delivery')} Livraison 30–45 min</span></div><div class="options"><h3>PERSONNALISE TA COMMANDE</h3><small>Ajoute une touche en plus</small><label>Fromage supplémentaire <b>+1,00 € <input type=checkbox id="optCheese" ${S.opts.cheese?'checked':''}></b></label><label>Base épicée <b>+0,50 € <input type=checkbox id="optSpicy" ${S.opts.spicy?'checked':''}></b></label></div><div class="buy"><div><small>Prix</small><strong>${formatPrice(p.price)}</strong></div><button class="cta${S.justAddedKey===p.id?' added':''}" data-add="${p.id}">${S.justAddedKey===p.id?icon('check')+' AJOUTÉ':'AJOUTER AU PANIER '+icon('arrow-right')}</button></div></div></section>`}

function builder(){
 const cfg=CUSTOM_CONFIG[S.builder.type];
 const price=builderPrice();
 return `<section class="builderPage"><button class="back" data-go="home">${icon('arrow-left')} <span>Retour</span></button>
<i>FAIT MAISON, À TA FAÇON</i><h1>COMPOSE TA RECETTE</h1>
<p class="builderIntro">Choisis ta base, ta sauce et tes garnitures. On prépare exactement comme tu veux.</p>
<div class="switch"><button class="${S.builder.type==='pizza'?'active':''}" data-builder-type="pizza">Pizza</button><button class="${S.builder.type==='pannuezo'?'active':''}" data-builder-type="pannuezo">Pannuezo</button></div>
<div class="builderGroup"><h3>1. LA BASE</h3><div class="filters builderOptions">${cfg.bases.map(b=>`<button class="${S.builder.base===b.id?'active':''}" data-builder-base="${b.id}">${b.name}${b.extra?` +${formatPrice(b.extra)}`:''}</button>`).join('')}</div></div>
<div class="builderGroup"><h3>2. LA SAUCE</h3><div class="filters builderOptions">${cfg.sauces.map(s=>`<button class="${S.builder.sauce===s.id?'active':''}" data-builder-sauce="${s.id}">${s.name}${s.extra?` +${formatPrice(s.extra)}`:''}</button>`).join('')}</div></div>
<div class="builderGroup"><h3>3. LES GARNITURES</h3><small class="builderHint">Sélectionne autant d'ingrédients que tu veux</small><div class="builderIngredients">${cfg.ingredients.map(i=>`<label class="builderIng${S.builder.ingredients.includes(i.id)?' checked':''}"><input type="checkbox" data-builder-ing="${i.id}" ${S.builder.ingredients.includes(i.id)?'checked':''}><span>${i.name}</span><b>+${formatPrice(i.price)}</b></label>`).join('')}</div></div>
<div class="builderSummary"><div><small>Prix</small><strong>${formatPrice(price)}</strong></div><button class="cta" data-builder-add>AJOUTER AU PANIER ${icon('arrow-right')}</button></div>
</section>`}

function cart(){
 if(!S.cart.length)return `<section class="empty"><div>${icon('cart')}</div><i>TON PANIER</i><h1>IL EST VIDE.</h1><p>Ajoute une pizza ou un pannuezo et on s’occupe du reste.</p><button class="cta" data-go="menu">DÉCOUVRIR LE MENU ${icon('arrow-right')}</button></section>`;
 const delivery=total()>=25?0:2.5;return `<section class="cartPage"><button class="back" data-go="menu">${icon('arrow-left')} <span>Retour au menu</span></button><i>COMMANDE</i><h1>TON PANIER</h1><p>${count()} articles · livraison uniquement</p><div class="cartItems">${S.cart.map(x=>`<article><img src="${x.img}"><div><h3>${x.name}</h3>${x.opts&&x.opts.length?`<small class="opts">${x.opts.join(' · ')}</small>`:''}<small>${formatPrice(x.price)}</small><div class="qty"><button data-qty="${x.key}" data-d="-1">${icon('minus')}</button><b>${x.qty}</b><button data-qty="${x.key}" data-d="1">${icon('plus')}</button></div></div><strong>${formatPrice(x.price*x.qty)}</strong></article>`).join('')}</div><div class="summary"><p>Sous-total <b>${formatPrice(total())}</b></p><p>Livraison <b>${delivery?'2,50 €':'OFFERTE'}</b></p><hr><h3>Total <b>${formatPrice(total()+delivery)}</b></h3></div><button class="cta wide" data-go="checkout">PASSER LA COMMANDE ${icon('arrow-right')}</button><small class="secure">${icon('lock')} Paiement sécurisé · carte ou paiement à la livraison</small></section>`}

function checkout(){
 const t=finalTotal();const f=S.orderForm;return `<section class="checkout"><button class="back" data-go="cart">${icon('arrow-left')} <span>Retour au panier</span></button><i>DERNIÈRE ÉTAPE</i><h1>ON TE LIVRE OÙ ?</h1><div class="steps"><b>${icon('check')}</b><span></span><b>2</b><span></span><b>3</b></div><form id="order"><div class="form"><h3>INFORMATIONS</h3><label>Prénom<input required name=firstName placeholder="Ex. Alex" value="${f.firstName||''}"></label><label>Téléphone<input required name=phone placeholder="06 00 00 00 00" value="${f.phone||''}"></label></div><div class="form"><h3>ADRESSE DE LIVRAISON</h3><label>Adresse<input required name=address placeholder="12 rue des Lilas" value="${f.address||''}"></label><div class=two><label>Code postal<input required name=zip placeholder="75000" value="${f.zip||''}"></label><label>Ville<input required name=city placeholder="Paris" value="${f.city||''}"></label></div><label>Instructions<textarea name=note placeholder="Digicode, étage, précision pour le livreur...">${f.note||''}</textarea></label></div><div class="form"><h3>CODE PROMO</h3><div class="promoRow"><input id="promoInput" placeholder="Ex. WELCOME10" value="${S.promo?.code||S.promoDraft||''}"><button type="button" class="ghost small" id="applyPromo" ${S.promoChecking?'disabled':''}>${S.promoChecking?'…':'APPLIQUER'}</button></div>${S.promo?S.promo.valid?`<small class="promoOk">${icon('check')} Code appliqué : -${formatPrice(S.promo.discount)}</small>`:`<small class="promoErr">${S.promo.error}</small>`:''}</div><div class="form"><h3>MODE DE PAIEMENT</h3><label class=pay><input type=radio name=payment value=online ${f.payment!=='delivery'?'checked':''}><span>${icon('payment-card')} <b>Paiement en ligne</b><small>Carte bancaire · sécurisé</small></span><em>RECOMMANDÉ</em></label><label class=pay><input type=radio name=payment value=delivery ${f.payment==='delivery'?'checked':''}><span>${icon('cash')} <b>Paiement à la livraison</b><small>Selon les moyens acceptés</small></span></label></div>${discountAmount()>0?`<p class="promoLine">Réduction <b class="promoOk">-${formatPrice(discountAmount())}</b></p>`:''}<p class="promoLine">Livraison <b>${total()>=25?'OFFERTE':formatPrice(2.5)}</b></p><div class="checkoutTotal">TOTAL À PAYER <b>${formatPrice(t)}</b></div><button class="cta wide" type=submit>CONFIRMER LA COMMANDE ${icon('arrow-right')}</button><small class=secure>${icon('lock')} Tes données sont utilisées uniquement pour traiter la commande.</small></form></section>`}

function confirmation(){let o=JSON.parse(localStorage.getItem('fd_last')||'{}');return `<section class="confirm"><div class="ok">${icon('check')}</div><i>COMMANDE CONFIRMÉE</i><h1>MERCI ${o.firstName||''} !</h1><p>Ta commande <b>#${o.orderId||'DK-2048'}</b> est bien enregistrée.</p><div class="status"><div><b>${icon('fire','',true)}</b><strong>En préparation</strong><small>Notre cuisine prépare ta commande.</small></div><span>${icon('arrow-right')}</span><div><b>${icon('delivery')}</b><strong>30–45 min</strong><small>Livraison estimée chez toi.</small></div></div><div class="recap">${o.discount?`<span>Réduction</span><b class="promoOk">-${formatPrice(o.discount)}</b>`:''}<span>Total</span><b>${formatPrice(o.total||0)}</b><span>Paiement</span><b>${o.payment==='online'?'En ligne':'À la livraison'}</b></div><button class=cta data-go=track>SUIVRE MA COMMANDE ${icon('arrow-right')}</button><button class=ghost data-go=home>Retour à l’accueil</button></section>`}

function track(){
 const last=JSON.parse(localStorage.getItem('fd_last')||'{}');
 const d=S.trackData;
 const steps=[['received',icon('check'),'Commande reçue','Nous avons bien reçu ta commande.'],['preparing',icon('fire','',true),'En préparation','La cuisine prépare ton repas.'],['delivering',icon('delivery'),'En livraison','Un livreur prend bientôt la route.'],['delivered',icon('home'),'Livrée','Bon appétit !']];
 const order=['received','preparing','delivering','delivered'];
 if(!last.orderId&&!last.id)return `<section class="simple"><i>SUIVI</i><h1>AUCUNE COMMANDE</h1><p>Tu n'as pas encore de commande en cours.</p><button class=cta data-go=menu>COMMANDER ${icon('arrow-right')}</button></section>`;
 if(!d)return `<section class="simple"><i>SUIVI</i><h1>${last.orderId||last.id}</h1><p>Chargement du statut…</p></section>`;
 if(d.status==='cancelled')return `<section class="simple"><i>SUIVI</i><h1>COMMANDE ANNULÉE</h1><p>Ta commande <b>#${d.orderId}</b> a été annulée${d.cancelReason?` — ${d.cancelReason}`:''}. Contacte-nous si besoin.</p><button class=cta data-go=menu>COMMANDER AUTRE CHOSE ${icon('arrow-right')}</button></section>`;
 const idx=order.indexOf(d.status);
 return `<section class="simple"><i>SUIVI</i><h1>#${d.orderId}</h1><p>${d.driverName?`Livreur : ${d.driverName}. `:''}Mise à jour en direct par notre équipe.</p><div class=timeline>${steps.map((x,i)=>`<div class="${i<=idx?'done':''}"><b>${x[1]}</b><span><strong>${x[2]}</strong><small>${x[3]}</small></span></div>`).join('')}</div><button class=cta data-go=menu>COMMANDER AUTRE CHOSE ${icon('arrow-right')}</button></section>`}
function about(){return `<section class="aboutPage">
<i>NOTRE HISTOIRE</i><h1>L'APPEL DES SAVEURS</h1>
<p class="lead">Imaginez une pâte fine et croustillante, tout juste sortie du four, qui craque sous la première bouchée. La chaleur du fromage fondu qui s'étire, le parfum des herbes qui remonte avant même que vous ayez goûté. C'est ça, l'expérience Pannuezo & Pizza signée Mondi Food.</p>
<p>Mondi Food, c'est une dark kitchen basée à Vannes, entièrement tournée vers la livraison. Pas de salle, pas de comptoir — juste une cuisine qui prépare, avec soin, des plats généreux pensés pour voyager chauds jusqu'à chez vous.</p>
<p>Chaque plat est pensé pour réveiller les papilles : des garnitures généreuses, des saveurs qui claquent, un équilibre entre le croustillant et le fondant. Fermez les yeux, imaginez le carton qui s'ouvre, la vapeur qui s'échappe, cette odeur qui remplit la pièce... et cette première bouchée qui vous fait dire « encore un peu ».</p>
<div class="aboutGrid">
<div><b>${icon('check')}</b><div><strong>Pensée pour la livraison</strong><small>Pas un restaurant classique adapté après coup</small></div></div>
<div><b>${icon('fire','',true)}</b><div><strong>Recettes maison</strong><small>Préparées avec soin, ingrédients frais</small></div></div>
<div><b>${icon('delivery')}</b><div><strong>Vannes et environs</strong><small>Livraison en 30–45 min</small></div></div>
</div>
<button class="cta wide" data-go="menu">DÉCOUVRIR LE MENU ${icon('arrow-right')}</button>
<button class="ghost" data-contact>${icon('phone')} NOUS CONTACTER</button>
</section>`}
function account(){return `<section class="simple left"><i>ESPACE CLIENT</i><h1>TON COMPTE</h1><div class=account><span>👤</span><div><b>Connexion à venir</b><small>Le backend pourra gérer comptes, adresses et historique.</small></div></div><div class=links><button>${icon('location')} Mes adresses <b>›</b></button><button>🧾 Mes commandes <b>›</b></button><button>⚙️ Préférences <b>›</b></button></div></section>`}
function sticky(){return S.cart.length?`<div class=sticky><span class="stickyBag">${icon('cart')}</span><span class="stickyInfo"><b>${count()} articles</b><small>${formatPrice(total())}</small></span><button class="cta pill" data-go=cart>VOIR LE PANIER ${icon('arrow-right')}</button></div>`:''}

function add(id){
 let p=P.find(x=>x.id===id);
 let extra=0,opts=[];
 // Les options (fromage/épicé) ne s'appliquent que depuis la fiche produit du même
 // article — pas depuis un "+" rapide sur une carte du menu, sinon une option cochée
 // sur un produit précédemment consulté se collerait à tort sur un autre article.
 if(S.route==='product'&&S.selected===id){
  if(S.opts.cheese){extra+=1;opts.push('Fromage supplémentaire')}
  if(S.opts.spicy){extra+=0.5;opts.push('Base épicée')}
 }
 const key=id+(opts.length?':'+opts.join('+'):'');
 const price=p.price+extra;
 let x=S.cart.find(x=>x.key===key);
 x?x.qty++:S.cart.push({...p,key,price,opts,qty:1});
 save();
 toast('Ajouté au panier');
 const cartIconEl=document.querySelector('.cartIcon');
 if(cartIconEl){cartIconEl.animate([{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'})}
 S.justAddedKey=id;
 render();
 setTimeout(()=>{if(S.justAddedKey===id){S.justAddedKey=null;render()}},1000);
}
function addCustom(){
 const {type,base,sauce,ingredients}=S.builder;
 const cfg=CUSTOM_CONFIG[type];
 const baseObj=cfg.bases.find(b=>b.id===base);
 const sauceObj=cfg.sauces.find(s=>s.id===sauce);
 const ingObjs=ingredients.map(id=>cfg.ingredients.find(i=>i.id===id)).filter(Boolean);
 const price=Math.round((cfg.basePrice+baseObj.extra+sauceObj.extra+ingObjs.reduce((a,i)=>a+i.price,0))*100)/100;
 const opts=[baseObj.name,sauceObj.name,...ingObjs.map(i=>i.name)];
 const sortedIng=[...ingredients].sort();
 // Une même combinaison base+sauce+ingrédients regroupe la quantité au lieu de
 // dupliquer la ligne dans le panier (même logique que add() pour les options).
 const key=`custom-${type}:${base}:${sauce}:${sortedIng.join(',')}`;
 let x=S.cart.find(x=>x.key===key);
 if(x){x.qty++}
 else{
  S.cart.push({id:`custom-${type}`,key,name:`${cfg.label} personnalisée`,img:cfg.img,type,price,opts,qty:1,custom:{baseId:base,sauceId:sauce,ingredientIds:sortedIng}});
 }
 save();
 toast('Ajouté au panier');
 S.route='cart';
 render();
}
function qty(key,d){let x=S.cart.find(x=>x.key===key);if(!x)return;x.qty+=d;if(x.qty<1)S.cart=S.cart.filter(y=>y.key!==key);if(S.promo){S.promo=null;toast('Code promo retiré (panier modifié), réapplique-le si besoin')}save();render()}
function toast(t){
 let e=document.querySelector('#toast');if(!e)return;
 e.innerHTML=icon('check')+' '+t;e.className='toast';
 setTimeout(()=>e.className='',1500)
}

function initReveal(){
 const els=document.querySelectorAll('.card:not(.in), .mini:not(.in)');
 if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('in'));return}
 const io=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}})
 },{threshold:.15});
 els.forEach(el=>io.observe(el));
}

function bind(){
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{S.route=b.dataset.go; if(b.dataset.type)S.type=b.dataset.type;if(S.route==='category')S.filter='Toutes';render();if(S.route==='track')loadTrack()});
 document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{S.type=b.dataset.type;S.filter='Toutes';S.route='category';render()});
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{S.filter=b.dataset.filter;render()});
 document.querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>{S.selected=b.dataset.product;S.opts={cheese:false,spicy:false};S.route='product';render()});
 document.querySelector('#optCheese')?.addEventListener('change',e=>{S.opts.cheese=e.target.checked});
 document.querySelector('#optSpicy')?.addEventListener('change',e=>{S.opts.spicy=e.target.checked});
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();add(b.dataset.add)});
 document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>qty(b.dataset.qty,+b.dataset.d));
 // .onclick= (pas addEventListener) car le header n'est jamais recréé — bind() tourne
 // après chaque navigation, un addEventListener empilerait les gestionnaires à l'infini.
 document.querySelectorAll('[data-contact]').forEach(b=>b.onclick=()=>{S.contactOpen=true;contactSheet()});
 document.querySelectorAll('[data-night]').forEach(b=>b.onclick=()=>toast('Bientôt disponible — reviens vite !'));
 document.querySelectorAll('[data-open-builder]').forEach(b=>b.onclick=()=>{initBuilder(b.dataset.openBuilder);S.route='builder';render()});
 document.querySelectorAll('[data-builder-type]').forEach(b=>b.onclick=()=>{initBuilder(b.dataset.builderType);render()});
 document.querySelectorAll('[data-builder-base]').forEach(b=>b.onclick=()=>{S.builder.base=b.dataset.builderBase;render()});
 document.querySelectorAll('[data-builder-sauce]').forEach(b=>b.onclick=()=>{S.builder.sauce=b.dataset.builderSauce;render()});
 document.querySelectorAll('[data-builder-ing]').forEach(cb=>cb.addEventListener('change',e=>{
  const id=cb.dataset.builderIng;
  if(e.target.checked){if(!S.builder.ingredients.includes(id))S.builder.ingredients.push(id)}
  else S.builder.ingredients=S.builder.ingredients.filter(x=>x!==id);
  render();
 }));
 document.querySelector('[data-builder-add]')?.addEventListener('click',()=>addCustom());
 document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'})});
 document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{
  const code=b.dataset.copy;
  try{await navigator.clipboard.writeText(code)}catch{}
  S.promoDraft=code;
  const original=b.innerHTML;
  b.innerHTML=`${icon('check')} Copié`;
  b.classList.add('copied');
  setTimeout(()=>{b.innerHTML=original;b.classList.remove('copied')},1500);
 });
 // On sauvegarde chaque frappe dans S.orderForm pour que les infos client survivent
 // aux re-render du formulaire (ex: application d'un code promo, qui redessine tout le HTML).
 document.querySelector('#order')?.addEventListener('input',e=>{
  const el=e.target;
  if(!el.name||el.name==='payment')return;
  S.orderForm[el.name]=el.value;
 });
 document.querySelectorAll('#order input[name=payment]').forEach(r=>r.addEventListener('change',e=>{S.orderForm.payment=e.target.value}));
 document.querySelector('#applyPromo')?.addEventListener('click',async()=>{
  const input=document.querySelector('#promoInput');
  const code=(input?.value||'').trim();
  if(!code){S.promo=null;render();return}
  S.promoChecking=true;render();
  try{
   const res=await fetch(`/api/orders?validatePromo=${encodeURIComponent(code)}&subtotal=${total()}`);
   const data=await res.json();
   S.promo=data.valid?{code:data.code,valid:true,discount:data.discount}:{code,valid:false,error:data.error||'Code invalide'};
  }catch{
   S.promo={code,valid:false,error:'Impossible de vérifier le code, réessaie.'};
  }
  S.promoChecking=false;render();
  document.querySelector('#promoInput')?.focus();
 });
 document.querySelector('#order')?.addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target;
  const d=Object.fromEntries(new FormData(form));
  const t=finalTotal();
  const promoCode=S.promo&&S.promo.valid?S.promo.code:undefined;
  if(d.payment==='delivery'){
   const submitBtn=form.querySelector('button[type=submit]');
   if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='ENVOI DE LA COMMANDE…'}
   try{
    const res=await fetch('/api/orders',{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({cart:S.cart.map(x=>({id:x.id,opts:x.opts,qty:x.qty,custom:x.custom})),customer:d,promoCode})
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Commande refusée');
    localStorage.setItem('fd_last',JSON.stringify({...d,total:data.total,discount:data.discount||0,orderId:data.orderId,payment:'delivery'}));
    S.cart=[];S.promo=null;S.orderForm={};save();S.route='confirmation';render();
   }catch(err){
    toast(err.message||'Impossible d’enregistrer la commande, réessaie.');
    if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='CONFIRMER LA COMMANDE'}
   }
   return;
  }
  // Paiement en ligne : on part sur Stripe Checkout via l'API serverless.
  const submitBtn=form.querySelector('button[type=submit]');
  if(submitBtn){submitBtn.disabled=true;submitBtn.textContent='REDIRECTION VERS LE PAIEMENT…'}
  try{
   localStorage.setItem('fd_pending',JSON.stringify(d));
   const res=await fetch('/api/create-checkout-session',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     cart:S.cart.map(x=>({id:x.id,opts:x.opts,qty:x.qty,custom:x.custom})),
     customer:d,
     promoCode
    })
   });
   const data=await res.json();
   if(!res.ok||!data.url)throw new Error(data.error||'Erreur de paiement');
   window.location.href=data.url;
  }catch(err){
   toast(err.message||'Paiement indisponible, réessaie.');
   if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='CONFIRMER LA COMMANDE'}
  }
 });
}
// Retour depuis Stripe Checkout : on vérifie la session côté serveur avant
// d'afficher la confirmation (ne jamais faire confiance à l'URL seule).
async function handleStripeReturn(){
 const params=new URLSearchParams(window.location.search);
 const sessionId=params.get('session_id');
 if(!sessionId)return false;
 try{
  const res=await fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`);
  const data=await res.json();
  if(data.paid){
   const pending=JSON.parse(localStorage.getItem('fd_pending')||'{}');
   const o={...pending,payment:'online',total:data.total,discount:data.discount||0,orderId:data.orderId||('DK-'+Math.floor(1000+Math.random()*9000)),firstName:data.firstName||pending.firstName};
   localStorage.setItem('fd_last',JSON.stringify(o));
   localStorage.removeItem('fd_pending');
   S.cart=[];save();S.route='confirmation';
  }else{
   toast('Paiement non confirmé, réessaie.');
   S.route='checkout';
  }
 }catch(err){
  toast('Impossible de vérifier le paiement.');
  S.route='checkout';
 }
 window.history.replaceState({},'',window.location.pathname);
 return true;
}

handleStripeReturn().then(()=>shell());
