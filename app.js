const currency=new Intl.NumberFormat('fr-FR');
const safe=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const readArray=(key,fallback=[])=>{try{const data=JSON.parse(localStorage.getItem(key));return Array.isArray(data)?data:fallback;}catch{return fallback;}};
const writeStore=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{notify('Le stockage de cet appareil est indisponible. Gardez cette page ouverte pour conserver votre sélection.');}};
let categories=[],products=[],catalogReady=false,catalogRevision=0,catalogFailed=false;
let cart=window.CatalogueCart.read(),favourites=readArray('ddb-favourites-postgres-v1').map(String);
let selectedCategory='all',showFavourites=false,toastTimer;
const grid=document.querySelector('#productGrid'),filters=document.querySelector('#filters'),details=document.querySelector('#productDetails');
const priceLabel=value=>value==null?'Prix sur demande':currency.format(value)+' F CFA';
function notify(message){if(details?.open){const feedback=document.querySelector('#detailFeedback');if(feedback)feedback.textContent=message;}const box=document.querySelector('#shopFeedback');box.textContent=message;box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>box.classList.remove('show'),3200);}
function imageForProduct(product){
 let image=String(product.image||product.imageUrl||window.CatalogueArt?.forProduct(product.name)||'');
 if(!/^(\/?assets\/|\/uploads\/products\/|https:\/\/|data:image\/(jpeg|png|webp);base64,)/.test(image))return '';
 image=image.replace(/^(\/?assets\/(?:materiaux|quincaillerie|videosurveillance|energie-solaire|promotion-camera|promotion-solaire))\.jpeg$/,'$1.webp');return image;
}
function stockLabel(product){const value=ShopTools.stock(product.stock);return value==null?'Disponibilité à confirmer':value>0?'En stock':'Indisponible';}
function visual(product,extra=''){const image=imageForProduct(product);return image?`<img class="product-image ${extra}" src="${safe(image)}" alt="${safe(product.name)}" loading="lazy" decoding="async">`:'<div class="shop-no-photo"><span aria-hidden="true">＋</span><strong>Photo à venir</strong><small>DEPOT DU BATIMENT</small></div>';}
async function loadCatalogFromDatabase(){
 const revision=++catalogRevision;
 catalogReady=false;catalogFailed=false;cart=window.CatalogueCart.read();renderCart();
 grid.innerHTML='<p class="no-results">Chargement du catalogue…</p>';
 try{
  const data=await window.CatalogueApi.load();
  if(revision!==catalogRevision)return;
  categories=data.categories;products=data.products;
  catalogReady=true;cart=ShopTools.cleanCart(window.CatalogueCart.read(),products);persistCart();
  renderFilters();renderProducts();renderCart();
  window.dispatchEvent(new Event('catalog:loaded'));
 }catch(error){
  if(revision!==catalogRevision)return;
  console.error('Catalogue indisponible',error);catalogReady=false;catalogFailed=true;renderCart();
  document.querySelector('#resultCount').textContent='Catalogue momentanément indisponible';
  grid.innerHTML='<div class="no-results"><strong>Le catalogue ne peut pas être chargé pour le moment.</strong><p>Réessayez dans quelques instants ou contactez notre équipe.</p><button type="button" class="button button-dark" data-retry>Réessayer</button><a href="contact.html">Nous contacter →</a></div>';
 }
}
function persistCart(){
 if(!window.CatalogueCart.set(cart))notify('Le stockage de cet appareil est indisponible. Gardez cette page ouverte pour conserver votre panier.');
}
function saveCart(){persistCart();renderCart();}
function categoryBranchIds(id){
 const ids=new Set([String(id)]);let changed=true;
 while(changed){changed=false;categories.forEach(c=>{if(c.parentId!=null&&ids.has(String(c.parentId))&&!ids.has(String(c.id))){ids.add(String(c.id));changed=true;}});}
 return [...ids];
}
function renderFilters(){
 const opened=new Set([...filters.querySelectorAll('details[open]')].map(el=>el.dataset.branch));
 if(selectedCategory!=='all'&&!categories.some(c=>c.id===selectedCategory))selectedCategory='all';
 const count=id=>id==='all'?products.length:products.filter(p=>categoryBranchIds(id).includes(String(p.categoryId))).length;
 const button=(c,label=c.name)=>`<button type="button" class="filter ${c.id===selectedCategory?'active':''}" data-category="${safe(c.name)}" data-category-id="${safe(c.id)}" aria-pressed="${c.id===selectedCategory}"><span>${safe(label)}</span><b>${count(c.id)}</b></button>`;
 function branch(c,ancestors=[]){
  if(ancestors.includes(c.id))return '';
  const children=categories.filter(x=>String(x.parentId)===String(c.id));
  if(!children.length)return button(c);
  const open=opened.has(c.id)||categoryBranchIds(c.id).includes(selectedCategory)||!filters.children.length;
  return `<details class="shop-category-branch" data-branch="${safe(c.id)}" ${open?'open':''}><summary><span>${safe(c.name)}</span><b>${count(c.id)}</b></summary><div class="shop-subcategories">${button(c,'Tout voir')}${children.map(child=>branch(child,[...ancestors,c.id])).join('')}</div></details>`;
 }
 filters.innerHTML=button({id:'all',name:'Tous les produits'})+categories.filter(c=>c.parentId==null||!categories.some(parent=>String(parent.id)===String(c.parentId))).map(c=>branch(c)).join('');
}
function renderProducts(){
 if(!catalogReady)return;
 const categoryName=categories.find(c=>c.id===selectedCategory)?.name;
 const min=document.querySelector('#minPrice'),max=document.querySelector('#maxPrice');
 max.setCustomValidity(min.value!==''&&max.value!==''&&Number(max.value)<Number(min.value)?'Le maximum doit être supérieur ou égal au minimum.':'');
 const options={categoryId:selectedCategory,categoryIds:selectedCategory==='all'?null:categoryBranchIds(selectedCategory),query:document.querySelector('#productSearch').value,min:min.value,max:max.value,inStock:document.querySelector('#stockOnly').checked,favouritesOnly:showFavourites,favourites,sort:document.querySelector('#sortProducts').value};
 const budgetError=document.querySelector('#budgetError');
 const invalidBudget=!min.validity.valid||!max.validity.valid;
 budgetError.hidden=!invalidBudget;
 budgetError.textContent=invalidBudget?'Vérifiez votre budget : utilisez des montants positifs, avec un maximum supérieur ou égal au minimum.':'';
 const chips=[];
 if(selectedCategory!=='all'&&categoryName)chips.push(['category',categoryName]);
 if(options.query.trim())chips.push(['query','Recherche : '+options.query.trim()]);
 if(options.min!=='')chips.push(['min','Dès '+options.min+' F CFA']);
 if(options.max!=='')chips.push(['max','Jusqu’à '+options.max+' F CFA']);
 if(options.inStock)chips.push(['stock','En stock']);
 if(showFavourites)chips.push(['favourites','Favoris']);
 document.querySelector('#activeFilters').innerHTML=chips.map(([key,label])=>`<button type="button" data-clear-filter="${key}" aria-label="Retirer le filtre : ${safe(label)}">${safe(label)} <span aria-hidden="true">×</span></button>`).join('');
 const view=invalidBudget?[]:ShopTools.filterProducts(products,options);
 document.querySelector('#selectionTitle').textContent=showFavourites?'Mes favoris':selectedCategory==='all'?'Tous les produits':categoryName;
 document.querySelector('#resultCount').textContent=invalidBudget?'Corrigez le budget pour afficher les produits.':`${view.length} produit${view.length!==1?'s':''} trouvé${view.length!==1?'s':''}`;
 grid.innerHTML=!products.length?'<div class="no-results shop-empty-results"><strong>Notre catalogue se prépare.</strong><p>Les premiers produits seront bientôt disponibles. Contactez notre équipe pour votre demande.</p><a href="contact.html">Nous contacter →</a></div>':view.length?view.map(p=>{const unavailable=ShopTools.stock(p.stock)===0,liked=favourites.includes(p.id);return `<article class="product-card"><div class="product-visual product-photo">${KitGallery.render(p)||visual(p)}<button type="button" class="wishlist ${liked?'liked':''}" data-favourite="${safe(p.id)}" aria-pressed="${liked}" aria-label="${liked?'Retirer des favoris :':'Ajouter aux favoris :'} ${safe(p.name)}">${liked?'♥':'♡'}</button></div><div class="product-info"><span class="product-category">${safe(p.category)}</span><div class="product-title-row"><h3><button type="button" class="shop-product-name" data-detail="${safe(p.id)}">${safe(p.name)}</button></h3></div><p class="shop-product-unit">${safe(p.unit||'Format à préciser')}</p><span class="shop-stock ${unavailable?'out':ShopTools.stock(p.stock)==null?'unknown':'available'}">${stockLabel(p)}</span><div class="product-meta"><span class="price">${priceLabel(p.price)}</span></div><div class="shop-card-actions"><button type="button" class="shop-detail-button" data-detail="${safe(p.id)}">${p.isKit?'Voir le kit':'Détails'}</button><button type="button" class="shop-add-button" data-add="${safe(p.id)}" ${unavailable?'disabled':''}>${unavailable?'Indisponible':'Ajouter ＋'}</button></div></div></article>`;}).join(''):'<div class="no-results shop-empty-results"><strong>Aucun produit ne correspond à votre sélection.</strong><p>Essayez un autre mot-clé ou élargissez vos filtres.</p><button type="button" class="button button-dark" data-reset>Réinitialiser les filtres</button></div>';
 KitGallery.mount(grid);
}
function resetFilters(){selectedCategory='all';showFavourites=false;document.querySelector('#productSearch').value='';document.querySelector('#minPrice').value='';document.querySelector('#maxPrice').value='';document.querySelector('#stockOnly').checked=false;document.querySelector('#sortProducts').value='featured';document.querySelector('#favouritesOnly').setAttribute('aria-pressed','false');renderFilters();renderProducts();}
function addToCart(id){
 if(!catalogReady){notify('Le catalogue est momentanément indisponible.');return;}
 const product=products.find(p=>p.id===String(id));if(!product)return;
 cart=window.CatalogueCart.read();
 const item=cart.find(p=>p.id===String(id)),limit=ShopTools.stock(product.stock);
 if(limit!=null&&(item?.qty||0)>=limit){notify('La quantité disponible est déjà dans votre panier.');return;}
 if(item)item.qty++;else cart.push({id:String(id),qty:1});saveCart();notify(product.name+' ajouté au panier.');
}
function showDetails(id){
 const p=products.find(p=>p.id===String(id));if(!p)return;
 const unavailable=ShopTools.stock(p.stock)===0;
 document.querySelector('#productDetailsContent').innerHTML=`<div class="shop-detail-layout"><div class="shop-detail-image">${KitGallery.render(p,true)||visual(p)}</div><div class="shop-detail-copy"><span class="product-category">${safe(p.category)}</span><h2 id="detailTitle">${safe(p.name)}</h2><span class="shop-stock ${unavailable?'out':'unknown'}">${stockLabel(p)}</span><p>${safe(p.description||'Contactez notre équipe pour obtenir les caractéristiques et choisir le modèle adapté à votre besoin.')}</p>${p.isKit&&Array.isArray(p.components)?`<section class="kit-composition"><h3>Les éléments du kit</h3><ul>${p.components.map(item=>`<li>${safe(item)}</li>`).join('')}</ul><p>Composition illustrative. Références et quantités à confirmer avant commande.</p></section>`:''}<dl><div><dt>Unité / format</dt><dd>${safe(p.unit||'À préciser avec l’équipe')}</dd></div><div><dt>Réception</dt><dd>Retrait au dépôt ou livraison selon la zone et la commande.</dd></div></dl><strong class="shop-detail-price">${priceLabel(p.price)}</strong><button type="button" class="button button-orange" id="detailAdd" ${unavailable?'disabled':''}>${unavailable?'Indisponible':'Ajouter au panier ＋'}</button><p id="detailFeedback" role="status"></p><a href="contact.html">Une question sur ce produit ? Contactez-nous →</a></div></div>`;
 document.querySelector('#detailAdd').addEventListener('click',()=>addToCart(p.id));details.showModal();KitGallery.mount(details);
}
function renderCart(failed=catalogFailed){
 window.CatalogueCart.mount();
 document.querySelector('#checkoutButton').disabled=!catalogReady||!cart.length;
 const count=cart.reduce((sum,item)=>sum+item.qty,0);document.querySelector('#drawerCount').textContent=`(${count})`;
 document.querySelector('#cartEmpty').hidden=count>0;document.querySelector('#drawerFoot').hidden=count===0||!catalogReady;
 if(!catalogReady){document.querySelector('#cartItems').innerHTML=count?`<p role="status">${failed?'Les articles sont momentanément indisponibles. Votre panier est conservé.':'Chargement de vos articles…'}</p>`:'';return;}
 document.querySelector('#cartItems').innerHTML=cart.map(item=>{const p=products.find(p=>p.id===item.id);if(!p)return '';const image=imageForProduct(p),limit=ShopTools.stock(p.stock);return `<div class="cart-line"><div class="cart-thumb">${image?`<img src="${safe(image)}" alt="${safe(p.name)}">`:'<span aria-hidden="true">＋</span>'}</div><div><h3>${safe(p.name)}</h3><small>${priceLabel(p.price)} · ${safe(p.unit||'Format à préciser')}</small><div class="quantity"><button type="button" data-qty="${safe(p.id)}" data-delta="-1" aria-label="Réduire la quantité de ${safe(p.name)}">−</button><span>${item.qty}</span><button type="button" data-qty="${safe(p.id)}" data-delta="1" aria-label="Augmenter la quantité de ${safe(p.name)}" ${limit!=null&&item.qty>=limit?'disabled':''}>＋</button></div></div><button type="button" class="remove-item" data-remove="${safe(p.id)}" aria-label="Retirer ${safe(p.name)}">×</button></div>`;}).join('');
 const known=cart.filter(item=>products.find(p=>p.id===item.id)?.price!=null),total=known.reduce((sum,item)=>sum+products.find(p=>p.id===item.id).price*item.qty,0);
 document.querySelector('#cartSubtotal').textContent=known.length?currency.format(total)+' F CFA':count?'À confirmer':'0 F CFA';
 const unknown=cart.length-known.length;document.querySelector('#cartPriceNote').textContent=unknown?`${unknown} produit${unknown>1?'s':''} sans prix affiché. Le sous-total inclut uniquement les prix connus, hors livraison.`:'Sous-total des produits affichés, hors frais de livraison.';
}
grid.addEventListener('click',event=>{
 const target=event.target.closest('button');if(!target)return;
 if(target.hasAttribute('data-retry'))loadCatalogFromDatabase();
 if(target.hasAttribute('data-reset'))resetFilters();
 if(target.dataset.add)addToCart(target.dataset.add);
 if(target.dataset.detail)showDetails(target.dataset.detail);
 if(target.dataset.favourite){const id=target.dataset.favourite;favourites=favourites.includes(id)?favourites.filter(x=>x!==id):[...favourites,id];writeStore('ddb-favourites-postgres-v1',favourites);renderProducts();[...grid.querySelectorAll('[data-favourite]')].find(button=>button.dataset.favourite===id)?.focus();}
});
document.querySelector('#activeFilters').addEventListener('click',event=>{
 const button=event.target.closest('[data-clear-filter]');if(!button)return;
 const key=button.dataset.clearFilter;
 if(key==='category'){selectedCategory='all';renderFilters();}
 if(key==='query')document.querySelector('#productSearch').value='';
 if(key==='min')document.querySelector('#minPrice').value='';
 if(key==='max')document.querySelector('#maxPrice').value='';
 if(key==='stock')document.querySelector('#stockOnly').checked=false;
 if(key==='favourites'){showFavourites=false;document.querySelector('#favouritesOnly').setAttribute('aria-pressed','false');}
 renderProducts();document.querySelector('#productSearch').focus();
});
filters.addEventListener('click',event=>{const button=event.target.closest('[data-category-id]');if(!button||!catalogReady)return;selectedCategory=button.dataset.categoryId;renderFilters();renderProducts();});
for(const id of ['productSearch','minPrice','maxPrice'])document.querySelector('#'+id).addEventListener('input',renderProducts);
for(const id of ['sortProducts','stockOnly'])document.querySelector('#'+id).addEventListener('change',renderProducts);
document.querySelector('#resetFilters').addEventListener('click',resetFilters);
document.querySelector('#favouritesOnly').addEventListener('click',event=>{showFavourites=!showFavourites;event.currentTarget.setAttribute('aria-pressed',String(showFavourites));renderProducts();});
document.querySelector('#closeDetails').addEventListener('click',()=>details.close());
details.addEventListener('click',event=>{if(event.target===details){const box=details.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)details.close();}});
document.querySelector('#cartItems').addEventListener('click',event=>{const qty=event.target.closest('[data-qty]'),remove=event.target.closest('[data-remove]');if(qty||remove)cart=window.CatalogueCart.read();if(qty){if(!catalogReady)return;if(Number(qty.dataset.delta)>0)addToCart(qty.dataset.qty);else{const item=cart.find(p=>p.id===qty.dataset.qty);if(item){item.qty--;cart=cart.filter(p=>p.qty>0);saveCart();}}}if(remove){cart=cart.filter(p=>p.id!==remove.dataset.remove);saveCart();}});
const drawer=document.querySelector('#cartDrawer'),overlay=document.querySelector('#overlay');drawer.inert=true;let previousCartFocus;
function openCart(){cart=window.CatalogueCart.read();renderCart();previousCartFocus=document.activeElement;drawer.inert=false;document.querySelectorAll('body>header,body>main,body>footer').forEach(el=>el.inert=true);drawer.classList.add('open');overlay.classList.add('show');drawer.setAttribute('aria-hidden','false');document.body.classList.add('shop-cart-open');document.querySelector('#closeCart').focus();}
function closeCart(){drawer.inert=true;document.querySelectorAll('body>header,body>main,body>footer').forEach(el=>el.inert=false);drawer.classList.remove('open');overlay.classList.remove('show');drawer.setAttribute('aria-hidden','true');document.body.classList.remove('shop-cart-open');previousCartFocus?.focus();}
document.querySelector('#openCart').addEventListener('click',openCart);document.querySelector('#closeCart').addEventListener('click',closeCart);document.querySelector('#continueShopping').addEventListener('click',closeCart);overlay.addEventListener('click',closeCart);
const admin=document.querySelector('#adminModal'),checkout=document.querySelector('#checkoutModal');
document.querySelector('#closeAdmin').addEventListener('click',()=>admin.classList.remove('show'));admin.addEventListener('click',e=>{if(e.target===admin)admin.classList.remove('show');});
document.querySelector('#checkoutButton').addEventListener('click',()=>{if(!catalogReady||!cart.length)return;closeCart();checkout.classList.add('show');});document.querySelector('#closeCheckout').addEventListener('click',()=>checkout.classList.remove('show'));checkout.addEventListener('click',e=>{if(e.target===checkout)checkout.classList.remove('show');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(drawer.classList.contains('open'))closeCart();admin.classList.remove('show');checkout.classList.remove('show');}if(e.key==='Tab'&&drawer.classList.contains('open')){const focusable=[...drawer.querySelectorAll('button:not(:disabled),a[href]')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
document.querySelector('#menuToggle').addEventListener('click',event=>{const open=document.querySelector('.main-nav').classList.toggle('show');event.currentTarget.setAttribute('aria-expanded',String(open));event.currentTarget.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');});
document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('.main-nav').classList.remove('show');document.querySelector('#menuToggle').setAttribute('aria-expanded','false');}));
document.querySelector('.search-toggle').addEventListener('click',()=>{document.querySelector('#productSearch').scrollIntoView({block:'center'});document.querySelector('#productSearch').focus({preventScroll:true});});
renderCart();
window.addEventListener('cart:change',event=>{
 cart=window.CatalogueCart.read();
 if(event.detail?.source==='storage'){loadCatalogFromDatabase();return;}
 renderCart();
});
if(matchMedia('(max-width:900px)').matches)document.querySelectorAll('.shop-filter-group').forEach(group=>group.open=false);
loadCatalogFromDatabase();window.addEventListener('catalog:refresh',loadCatalogFromDatabase);

window.addEventListener('pageshow',event=>{if(event.persisted)loadCatalogFromDatabase();});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadCatalogFromDatabase();});
