(() => {
 const carousel=document.querySelector('.promo-carousel');if(!carousel)return;
 const track=carousel.querySelector('.promo-track'),slides=[...carousel.querySelectorAll('.promo-slide')],dots=[...carousel.querySelectorAll('.promo-dots button')],pause=carousel.querySelector('.promo-pause');
 let index=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false;
 const syncPause=()=>{pause.textContent=paused?'Lecture ▶':'Pause ❚❚';pause.setAttribute('aria-label',paused?'Lire les publicités':'Mettre les publicités en pause');};
 const show=next=>{index=(next+slides.length)%slides.length;track.style.transform=`translateX(-${index*100}%)`;slides.forEach((slide,i)=>{slide.inert=i!==index;slide.setAttribute('aria-hidden',String(i!==index));});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));carousel.querySelector('.promo-counter').textContent=String(index+1).padStart(2,'0')+' / 03';};
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));carousel.querySelector('.promo-prev').addEventListener('click',()=>show(index-1));carousel.querySelector('.promo-next').addEventListener('click',()=>show(index+1));pause.addEventListener('click',()=>{paused=!paused;syncPause();});carousel.addEventListener('mouseenter',()=>hover=true);carousel.addEventListener('mouseleave',()=>hover=false);
 carousel.querySelectorAll('[data-promo-category]').forEach(link=>link.addEventListener('click',()=>{const filter=[...document.querySelectorAll('#filters [data-category]')].find(button=>button.dataset.category===link.dataset.promoCategory);filter?.click();}));
 syncPause();setInterval(()=>{if(!paused&&!hover&&!document.hidden&&!carousel.contains(document.activeElement))show(index+1);},6500);
})();
