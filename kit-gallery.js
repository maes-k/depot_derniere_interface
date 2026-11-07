/* Galerie partagée : défilement tactile natif, souris, clavier et miniatures. */
(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const allowed=src=>typeof src==='string'&&/^(\/?assets\/|\/uploads\/products\/|https:\/\/)/.test(src);
 let sequence=0;
 function photos(product){
  const list=Array.isArray(product.gallery)?product.gallery:[];
  return list.filter(item=>allowed(item.image)).map(item=>({image:item.image,label:item.label||product.name,description:item.description||''}));
 }
 function render(product,expanded=false){
  const list=photos(product);if(list.length<2)return '';
  const id='kit-gallery-'+(++sequence);
  return `<section class="kit-gallery ${expanded?'kit-gallery-expanded':'kit-gallery-card'}" aria-label="Photos de ${esc(product.name)}" data-kit-gallery><div class="kit-gallery-stage"><div class="kit-gallery-track" id="${id}" tabindex="0" role="region" aria-roledescription="carrousel" aria-label="Faites défiler les photos de ${esc(product.name)}" data-gallery-track>${list.map((photo,i)=>`<figure class="kit-gallery-slide" role="group" aria-roledescription="diapositive" aria-label="${i+1} sur ${list.length} : ${esc(photo.label)}"><img src="${esc(photo.image)}" alt="${esc(photo.label)} — ${esc(product.name)}" loading="${i?'lazy':'eager'}" decoding="async" draggable="false"><figcaption><strong>${esc(photo.label)}</strong>${expanded&&photo.description?`<span>${esc(photo.description)}</span>`:''}</figcaption></figure>`).join('')}</div><span class="kit-badge">${product.isKit?'KIT':'PHOTOS'}</span><div class="kit-gallery-controls"><button type="button" data-gallery-step="-1" aria-controls="${id}" aria-label="Image précédente" disabled>‹</button><span data-gallery-count aria-live="polite" aria-atomic="true">1 / ${list.length}</span><button type="button" data-gallery-step="1" aria-controls="${id}" aria-label="Image suivante">›</button></div></div>${expanded?`<div class="kit-gallery-thumbnails" aria-label="Choisir un élément du kit">${list.map((photo,i)=>`<button type="button" data-gallery-index="${i}" aria-controls="${id}" aria-label="Voir : ${esc(photo.label)}" aria-pressed="${i===0}"><img src="${esc(photo.image)}" alt="" loading="lazy"><span>${esc(photo.label)}</span></button>`).join('')}</div>`:'<p class="kit-gallery-hint">Glissez pour voir les éléments du kit <span aria-hidden="true">↔</span></p>'}</section>`;
 }
 function mount(root=document){root.querySelectorAll('[data-kit-gallery]').forEach(gallery=>{
  if(gallery.dataset.mounted)return;gallery.dataset.mounted='true';
  const track=gallery.querySelector('[data-gallery-track]'),slides=[...track.children],total=slides.length;
  let current=0,frame=0,drag=null;
  const motion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
  function update(){current=Math.max(0,Math.min(total-1,Math.round(track.scrollLeft/(track.clientWidth||1))));gallery.dataset.current=String(current);gallery.querySelector('[data-gallery-count]').textContent=`${current+1} / ${total}`;gallery.querySelector('[data-gallery-step="-1"]').disabled=current===0;gallery.querySelector('[data-gallery-step="1"]').disabled=current===total-1;gallery.querySelectorAll('[data-gallery-index]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));}
  function go(index){index=Math.max(0,Math.min(total-1,index));track.scrollTo({left:index*track.clientWidth,behavior:motion()});}
  gallery.addEventListener('click',event=>{const button=event.target.closest('[data-gallery-step],[data-gallery-index]');if(!button)return;event.preventDefault();event.stopPropagation();if(button.hasAttribute('data-gallery-index'))go(Number(button.dataset.galleryIndex));else go(current+Number(button.dataset.galleryStep));});
  track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);},{passive:true});
  track.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(current+(event.key==='ArrowRight'?1:-1));}if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:total-1);}});
  track.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'||event.button!==0)return;drag={x:event.clientX,left:track.scrollLeft};track.setPointerCapture(event.pointerId);track.classList.add('dragging');});
  track.addEventListener('pointermove',event=>{if(!drag)return;track.scrollLeft=drag.left+drag.x-event.clientX;});
  function release(event){if(!drag)return;const dx=drag.x-event.clientX;const start=Math.round(drag.left/(track.clientWidth||1));drag=null;track.classList.remove('dragging');go(Math.abs(dx)>35?start+(dx>0?1:-1):start);}
  track.addEventListener('pointerup',release);track.addEventListener('pointercancel',()=>{drag=null;track.classList.remove('dragging');go(current);});

  update();
 });}
 window.addEventListener('resize',()=>document.querySelectorAll('[data-kit-gallery]').forEach(gallery=>{const track=gallery.querySelector('[data-gallery-track]');track.scrollTo({left:Number(gallery.dataset.current||0)*track.clientWidth,behavior:'instant'});}));
 window.KitGallery={photos,render,mount};
})();
