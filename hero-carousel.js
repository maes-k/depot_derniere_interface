(() => {
 const box=document.querySelector('.photo-slider');const slides=[...box.querySelectorAll('.hero-slide')];const dots=[...box.querySelectorAll('.slider-dots button')];const pause=box.querySelector('.slider-pause');
 const captions=['Des matériaux pour bâtir solide.','Les bons outils pour vos travaux.','Gardez un œil sur ce qui compte.','Faites place à l’énergie solaire.'];
 let current=0,paused=document.body.classList.contains('modele-two')||matchMedia('(prefers-reduced-motion: reduce)').matches,hover=false;
 const show=index=>{current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>slide.classList.toggle('is-active',i===current));dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===current)));document.querySelector('#slideCaption').textContent=captions[current];document.querySelector('#slideNumber').textContent=String(current+1).padStart(2,'0');};
 const sync=()=>{pause.textContent=paused?'Lecture ▶':'Pause ❚❚';pause.setAttribute('aria-label',paused?'Lire le diaporama':'Mettre le diaporama en pause');};
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));document.querySelector('.hero-pagination button').addEventListener('click',()=>show(current+1));pause.addEventListener('click',()=>{paused=!paused;sync();});box.addEventListener('mouseenter',()=>hover=true);box.addEventListener('mouseleave',()=>hover=false);sync();
 setInterval(()=>{if(!paused&&!hover&&!document.hidden&&!box.contains(document.activeElement))show(current+1);},5500);
})();
