
import './style.css';

const P = [
 {id:'m1',type:'pannuezo',name:'L’Original',price:12.90,desc:'Sauce tomate maison, mozzarella fondante, jambon fumé, origan',img:'/images/pannuezo-original.jpg',badge:'LE PLUS POPULAIRE',tag:'Classiques'},
 {id:'m2',type:'pannuezo',name:'Poulet Crémeux',price:13.90,desc:'Crème fraîche, mozzarella, poulet rôti, champignons, oignons caramélisés',img:'/images/pannuezo-poulet.jpg',tag:'Gourmands'},
 {id:'m3',type:'pannuezo',name:'Diavolo',price:13.50,desc:'Sauce tomate épicée, mozzarella, chorizo, poivrons, piment',img:'/images/pannuezo-diavolo.jpg',hot:true,tag:'Épicés'},
 {id:'m4',type:'pannuezo',name:'Végétarien',price:12.90,desc:'Sauce tomate, mozzarella, courgettes grillées, poivrons, champignons, roquette',img:'/images/pannuezo-vege.jpg',veg:true,tag:'Végétariens'},
 {id:'p1',type:'pizza',name:'Margherita',price:11.90,desc:'Sauce tomate maison, mozzarella fior di latte, basilic frais, huile d’olive',img:'/images/margherita.jpg',badge:'LA PLUS POPULAIRE',tag:'Classiques'},
 {id:'p2',type:'pizza',name:'Pepperoni',price:12.90,desc:'Sauce tomate, mozzarella, pepperoni, origan',img:'/images/pepperoni.jpg',tag:'Classiques'},
 {id:'p3',type:'pizza',name:'4 Fromages',price:12.90,desc:'Mozzarella, gorgonzola, chèvre, parmesan, emmental',img:'/images/four-cheese.jpg',tag:'Gourmandes'},
 {id:'p4',type:'pizza',name:'Légumes Rôtis',price:12.50,desc:'Sauce tomate, mozzarella, poivrons, courgettes, aubergines, oignons rouges',img:'/images/veggie.jpg',veg:true,tag:'Végétariennes'},
 {id:'p5',type:'pizza',name:'Diavolo',price:13.50,desc:'Sauce tomate épicée, mozzarella, chorizo, poivrons, piment',img:'/images/diavolo.jpg',hot:true,tag:'Épicées'},
];

const S = {route:'home',type:'pizza',filter:'Toutes',selected:null,cart:JSON.parse(localStorage.getItem('fd_cart')||'[]')};
const formatPrice = n => n.toFixed(2).replace('.',',')+' €';
const count=()=>S.cart.reduce((a,x)=>a+x.qty,0);
const total=()=>S.cart.reduce((a,x)=>a+x.price*x.qty,0);
const save=()=>localStorage.setItem('fd_cart',JSON.stringify(S.cart));

function shell(){document.querySelector('#root').innerHTML=`
<div class="phone">
<header><button class="hamb" data-menu>☰</button><button class="logo" data-go="home"><img src="/logo.png"></button>
<button class="cartIcon" data-go="cart">♧<b>${count()}</b></button></header>
<main id="screen"></main>${nav()}<div id="toast"></div></div>`;render()}

function nav(){return `<nav>
<button data-go="home" class="${S.route==='home'?'on':''}"><i>⌂</i><small>Accueil</small></button>
<button data-go="menu" class="${['menu','category'].includes(S.route)?'on':''}"><i>▦</i><small>Menu</small></button>
<button data-go="cart" class="${S.route==='cart'?'on':''}"><i>♧<b>${count()}</b></i><small>Panier</small></button>
<button data-go="track" class="${S.route==='track'?'on':''}"><i>⌁</i><small>Suivi</small></button></nav>`}

function render(){
 const s=document.querySelector('#screen');
 if(S.route==='home')s.innerHTML=home();
 if(S.route==='menu'||S.route==='category')s.innerHTML=menu();
 if(S.route==='product')s.innerHTML=product();
 if(S.route==='cart')s.innerHTML=cart();
 if(S.route==='checkout')s.innerHTML=checkout();
 if(S.route==='confirmation')s.innerHTML=confirmation();
 if(S.route==='track')s.innerHTML=track();

 document.querySelector('nav')?.replaceWith(new DOMParser().parseFromString(nav(),'text/html').body.firstChild);
 bind();scrollTo(0,0);
}

function home(){return `
<section class="homeHero">
<span class="kicker">PANNUEZO & PIZZA</span><h1>100%<br>LIVRAISON</h1>
<p>Dark kitchen · saveurs intenses · livré chez vous</p>
<button class="cta" data-type="pizza" data-go="menu">COMMANDER MAINTENANT <span>→</span></button>
<div class="delivery">♧ Livraison rapide <em></em> 30–45 min</div>
</section>
<section class="welcome"><div><span>OFFRE DE BIENVENUE</span><h3>-10% SUR VOTRE 1ÈRE COMMANDE</h3><small>Code : <b>WELCOME10</b></small></div><strong>%</strong></section>
<section class="homeTiles">
${tile('pannuezo','/images/pannuezo-original.jpg','PANNUEZO','Ultra fondant · généreusement garni')}
${tile('pizza','/images/margherita.jpg','PIZZA','Pâte artisanale · ingrédients frais')}</section>
<section class="perks"><div><b>♨</b><strong>Cuisson parfaite</strong><small>Doré & croustillant</small></div><div><b>♧</b><strong>Ingrédients frais</strong><small>Sélectionnés avec soin</small></div><div><b>♧</b><strong>Livraison rapide</strong><small>30–45 min</small></div></section>
<section class="block"><div class="heading"><span><i>À LA CARTE</i><h2>Nos incontournables</h2></span><button data-go="menu">Tout voir →</button></div><div class="rail">${P.slice(0,4).map(mini).join('')}</div></section>`}

function tile(type,img,title,sub){return `<button class="tile" data-type="${type}" data-go="category"><div class="tileText"><i>${type==='pizza'?'PÂTE ARTISANALE':'SIGNATURE'}</i><h3>${title}</h3><p>${sub}</p></div><div class="tileImg"><img src="${img}"></div><span>→</span></button>`}
function mini(p){return `<button class="mini" data-product="${p.id}"><img src="${p.img}"><b>${p.name}</b><strong>${formatPrice(p.price)}</strong></button>`}

function menu(){
 const list=P.filter(x=>x.type===S.type).filter(x=>S.filter==='Toutes'||x.tag===S.filter);
 const filters=S.type==='pizza'?['Toutes','Classiques','Gourmandes','Épicées','Végétariennes']:['Toutes','Classiques','Gourmands','Épicés','Végétariens'];
 return `<section class="menuTop"><button class="back" data-go="home">←</button><div class="crumb">Accueil　›　${S.type==='pizza'?'Pizza':'Pannuezo'}</div><div class="menuHero"><div><i>${S.type==='pizza'?'PIZZA':'PANNUEZO'}</i><h1>${S.type==='pizza'?'PIZZA':'PANNUEZO'}</h1><span class="uline"></span><p>${S.type==='pizza'?'Pizzas artisanales cuites à la perfection avec des ingrédients frais et une pâte maison moelleuse et croustillante.':'Découvrez nos Pannuezo ultra fondants, généreusement garnis et préparés avec des ingrédients de qualité.'}</p></div><div class="menuHeroImg"><img src="${S.type==='pizza'?'/images/pizza-hero.jpg':'/images/pannuezo-hero.jpg'}"></div></div>
<div class="featureRow"><span>♨ <b>Cuisson ${S.type==='pizza'?'au four':'parfaite'}</b><small>${S.type==='pizza'?'haute température':'Doré & croustillant'}</small></span><span>♧ <b>Ingrédients frais</b><small>Sélectionnés avec soin</small></span><span>◷ <b>Livraison rapide</b><small>30–45 min</small></span></div></section>
<div class="switch"><button class="${S.type==='pizza'?'active':''}" data-type="pizza" data-go="category">Pizza</button><button class="${S.type==='pannuezo'?'active':''}" data-type="pannuezo" data-go="category">Pannuezo</button></div>
<section class="menuSection"><div class="heading"><span><i>NOS ${S.type==='pizza'?'PIZZAS':'PANNUEZO'}</i><h2>Choisis ton préféré</h2></span></div><div class="filters">${filters.map(f=>`<button class="${S.filter===f?'active':''}" data-filter="${f}">${f}</button>`).join('')}</div><div class="cards">${list.map(card).join('')}</div></section>${sticky()}`}

function card(p){return `<article class="card"><button data-product="${p.id}" class="cardMain"><div class="thumb"><img src="${p.img}"></div><div class="copy">${p.badge?`<em class="badge">✦ ${p.badge}</em>`:''}<h3>${p.name}</h3><p>${p.desc}</p><strong>${formatPrice(p.price)}</strong></div></button><button class="plus" data-add="${p.id}">+</button></article>`}

function product(){
 const p=P.find(x=>x.id===S.selected); if(!p)return '';
 return `<section class="detail"><button class="back" data-go="menu">← <span>Retour au menu</span></button><div class="detailImg"><img src="${p.img}"><span>FRAIS · PRÉPARÉ À LA COMMANDE</span></div><div class="detailBody"><i>${p.type.toUpperCase()} · SIGNATURE</i><h1>${p.name}</h1><div class="stars">★★★★★ <small>4,9 · Nos clients adorent</small></div><p class="desc">${p.desc}.</p><div class="detailPerks"><span>♨ Cuisson minute</span><span>♧ Ingrédients frais</span><span>♧ Livraison 30–45 min</span></div><div class="options"><h3>PERSONNALISE TA COMMANDE</h3><small>Ajoute une touche en plus</small><label>Fromage supplémentaire <b>+1,00 € <input type=checkbox id="optCheese"></b></label><label>Base épicée <b>+0,50 € <input type=checkbox id="optSpicy"></b></label></div><div class="buy"><div><small>Prix</small><strong>${formatPrice(p.price)}</strong></div><button class="cta" data-add="${p.id}">AJOUTER AU PANIER →</button></div></div></section>`}

function cart(){
 if(!S.cart.length)return `<section class="empty"><div>♧</div><i>TON PANIER</i><h1>IL EST VIDE.</h1><p>Ajoute une pizza ou un pannuezo et on s’occupe du reste.</p><button class="cta" data-go="menu">DÉCOUVRIR LE MENU →</button></section>`;
 const delivery=total()>=25?0:2.5;return `<section class="cartPage"><button class="back" data-go="menu">← <span>Retour au menu</span></button><i>COMMANDE</i><h1>TON PANIER</h1><p>${count()} articles · livraison uniquement</p><div class="cartItems">${S.cart.map(x=>`<article><img src="${x.img}"><div><h3>${x.name}</h3>${x.opts&&x.opts.length?`<small class="opts">${x.opts.join(' · ')}</small>`:''}<small>${formatPrice(x.price)}</small><div class="qty"><button data-qty="${x.key}" data-d="-1">−</button><b>${x.qty}</b><button data-qty="${x.key}" data-d="1">+</button></div></div><strong>${formatPrice(x.price*x.qty)}</strong></article>`).join('')}</div><div class="summary"><p>Sous-total <b>${formatPrice(total())}</b></p><p>Livraison <b>${delivery?'2,50 €':'OFFERTE'}</b></p><hr><h3>Total <b>${formatPrice(total()+delivery)}</b></h3></div><button class="cta wide" data-go="checkout">PASSER LA COMMANDE →</button><small class="secure">🔒 Paiement sécurisé · carte ou paiement à la livraison</small></section>`}

function checkout(){
 const t=total()+(total()>=25?0:2.5);return `<section class="checkout"><button class="back" data-go="cart">← <span>Retour au panier</span></button><i>DERNIÈRE ÉTAPE</i><h1>ON TE LIVRE OÙ ?</h1><div class="steps"><b>✓</b><span></span><b>2</b><span></span><b>3</b></div><form id="order"><div class="form"><h3>INFORMATIONS</h3><label>Prénom<input required name=firstName placeholder="Ex. Alex"></label><label>Téléphone<input required name=phone placeholder="06 00 00 00 00"></label></div><div class="form"><h3>ADRESSE DE LIVRAISON</h3><label>Adresse<input required name=address placeholder="12 rue des Lilas"></label><div class=two><label>Code postal<input required name=zip placeholder="75000"></label><label>Ville<input required name=city placeholder="Paris"></label></div><label>Instructions<textarea name=note placeholder="Digicode, étage, précision pour le livreur..."></textarea></label></div><div class="form"><h3>MODE DE PAIEMENT</h3><label class=pay><input type=radio name=payment value=online checked><span>💳 <b>Paiement en ligne</b><small>Carte bancaire · sécurisé</small></span><em>RECOMMANDÉ</em></label><label class=pay><input type=radio name=payment value=delivery><span>💵 <b>Paiement à la livraison</b><small>Selon les moyens acceptés</small></span></label></div><div class="checkoutTotal">TOTAL À PAYER <b>${formatPrice(t)}</b></div><button class="cta wide" type=submit>CONFIRMER LA COMMANDE →</button><small class=secure>🔒 Tes données sont utilisées uniquement pour traiter la commande.</small></form></section>`}

function confirmation(){let o=JSON.parse(localStorage.getItem('fd_last')||'{}');return `<section class="confirm"><div class="ok">✓</div><i>COMMANDE CONFIRMÉE</i><h1>MERCI ${o.firstName||''} !</h1><p>Ta commande <b>#${o.id||'DK-2048'}</b> est bien enregistrée.</p><div class="status"><div><b>♨</b><strong>En préparation</strong><small>Notre cuisine prépare ta commande.</small></div><span>→</span><div><b>♧</b><strong>30–45 min</strong><small>Livraison estimée chez toi.</small></div></div><div class="recap"><span>Total</span><b>${formatPrice(o.total||0)}</b><span>Paiement</span><b>${o.payment==='online'?'En ligne':'À la livraison'}</b></div><button class=cta data-go=track>SUIVRE MA COMMANDE →</button><button class=ghost data-go=home>Retour à l’accueil</button></section>`}

function track(){return `<section class="simple"><i>SUIVI</i><h1>TA COMMANDE</h1><p>Suivi en temps réel — prêt à être relié à ton backend.</p><div class=timeline>${[['✓','Commande reçue','Nous avons bien reçu ta commande.'],['♨','En préparation','La cuisine prépare ton repas.'],['♧','En livraison','Un livreur prend bientôt la route.'],['⌂','Livrée','Bon appétit !']].map((x,i)=>`<div class="${i<2?'done':''}"><b>${x[0]}</b><span><strong>${x[1]}</strong><small>${x[2]}</small></span></div>`).join('')}</div><button class=cta data-go=menu>COMMANDER AUTRE CHOSE →</button></section>`}
function account(){return `<section class="simple left"><i>ESPACE CLIENT</i><h1>TON COMPTE</h1><div class=account><span>👤</span><div><b>Connexion à venir</b><small>Le backend pourra gérer comptes, adresses et historique.</small></div></div><div class=links><button>📍 Mes adresses <b>›</b></button><button>🧾 Mes commandes <b>›</b></button><button>⚙️ Préférences <b>›</b></button></div></section>`}
function sticky(){return S.cart.length?`<div class=sticky><span><b>${count()} articles</b><small>${formatPrice(total())}</small></span><button class=cta data-go=cart>VOIR LE PANIER →</button></div>`:''}

function add(id){
 let p=P.find(x=>x.id===id);
 let extra=0,opts=[];
 const cheese=document.querySelector('#optCheese'),spicy=document.querySelector('#optSpicy');
 if(cheese?.checked){extra+=1;opts.push('Fromage supplémentaire')}
 if(spicy?.checked){extra+=0.5;opts.push('Base épicée')}
 const key=id+(opts.length?':'+opts.join('+'):'');
 const price=p.price+extra;
 let x=S.cart.find(x=>x.key===key);
 x?x.qty++:S.cart.push({...p,key,price,opts,qty:1});
 save();
 toast('Ajouté au panier');
 const icon=document.querySelector('.cartIcon');
 if(icon){icon.animate([{transform:'scale(1)'},{transform:'scale(1.16)'},{transform:'scale(1)'}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)'})}
 render();
}
function qty(key,d){let x=S.cart.find(x=>x.key===key);if(!x)return;x.qty+=d;if(x.qty<1)S.cart=S.cart.filter(y=>y.key!==key);save();render()}
function toast(t){
 let e=document.querySelector('#toast');if(!e)return;
 e.textContent='✓ '+t;e.className='toast';
 setTimeout(()=>e.className='',1500)
}

function bind(){
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{S.route=b.dataset.go; if(b.dataset.type)S.type=b.dataset.type;if(S.route==='category')S.filter='Toutes';render()});
 document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{S.type=b.dataset.type;S.filter='Toutes';S.route='category';render()});
 document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{S.filter=b.dataset.filter;render()});
 document.querySelectorAll('[data-product]').forEach(b=>b.onclick=()=>{S.selected=b.dataset.product;S.route='product';render()});
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();add(b.dataset.add)});
 document.querySelectorAll('[data-qty]').forEach(b=>b.onclick=()=>qty(b.dataset.qty,+b.dataset.d));
 document.querySelector('[data-menu]')?.addEventListener('click',()=>toast('Navigation : Accueil · Menu · Panier · Suivi'));
 document.querySelector('#order')?.addEventListener('submit',e=>{e.preventDefault();let d=Object.fromEntries(new FormData(e.target)),t=total()+(total()>=25?0:2.5);let o={...d,total:t,id:'DK-'+Math.floor(1000+Math.random()*9000)};localStorage.setItem('fd_last',JSON.stringify(o));S.cart=[];save();S.route='confirmation';render()});
}
shell();
