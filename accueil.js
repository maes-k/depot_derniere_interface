(() => {
  const menu = document.querySelector('#menuToggle'), nav = document.querySelector('.main-nav');
  function closeMenu() {
    nav?.classList.remove('show'); menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Ouvrir le menu');
  }
  if (menu && nav) {
    closeMenu();
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('show');
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  }
  const grid = document.querySelector('#homeProducts'), universes = document.querySelector('.universe-grid');
  const domains = document.querySelector('.about-domain-list');
  if (!grid && !universes && !domains) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const categoryPictures = {};
  // Les images éditoriales existantes sont des illustrations ; la liste vient de l'API.
  universes?.querySelectorAll('.universe-card').forEach(card => {
    categoryPictures[card.querySelector('h3').textContent.trim()] = card.querySelector('img').getAttribute('src');
  });
  const categoryImage = category => typeof category.imageUrl === 'string' && /^(\/?assets\/|\/uploads\/categories\/|https:\/\/)/.test(category.imageUrl) ? category.imageUrl : categoryPictures[category.name] || 'assets/materiaux.webp';
  const categoryLink = category => `boutique.html?categorieId=${encodeURIComponent(category.id)}`;
  let revision = 0;
  async function load() {
    const ticket = ++revision;
    if (grid) grid.setAttribute('aria-busy', 'true');
    try {
      const { categories, products } = grid && !universes && !domains
        ? { categories: [], products: await window.CatalogueApi.request('/api/products') }
        : await window.CatalogueApi.load();
      if (!Array.isArray(products) || !Array.isArray(categories)) throw new Error('Catalogue invalide.');
      if (ticket !== revision) return;
      if (universes) universes.innerHTML = categories.length ? categories.map(category => `<a class="universe-card" href="${categoryLink(category)}"><div class="universe-photo"><img src="${escape(categoryImage(category))}" alt="${escape(category.name)}" loading="lazy" decoding="async"></div><div class="universe-copy"><small>${escape(category.description || 'Découvrir les produits du dépôt')}</small><h3>${escape(category.name)}</h3><span aria-hidden="true">↗</span></div></a>`).join('') : '<p>Nos catégories seront bientôt disponibles.</p>';
      if (domains) domains.innerHTML = categories.length ? categories.filter(c => c.parentId == null).map((category, index) => `<a class="about-domain" href="${categoryLink(category)}"><span class="domain-number">${String(index + 1).padStart(2, '0')}</span><div><h3>${escape(category.name)}</h3><p>${escape(category.description || 'Consultez les produits de cette catégorie dans notre boutique.')}</p></div><span class="domain-arrow" aria-hidden="true">↗</span></a>`).join('') : '<p>Nos catégories seront bientôt disponibles.</p>';
      const count = document.querySelector('#homeProductCount');
      if (count) count.textContent = `${products.length} produit${products.length === 1 ? '' : 's'}`;
      if (grid) grid.innerHTML = products.length ? products.map(product => {
        const image = product.image || product.imageUrl || window.CatalogueArt?.forProduct(product.name);
        const allowed = image && /^(assets\/|\/assets\/|\/uploads\/products\/|https:\/\/)/.test(image);
        const link = categoryLink({id:product.categoryId}) + '&produitId=' + encodeURIComponent(product.id);
        const gallery=window.KitGallery?.render(product)||'';
        return `<article class="home-product">${gallery||`<div class="universe-photo">${allowed?`<img src="${escape(image)}" alt="${escape(product.name)}" loading="lazy">`:'<div style="padding:45px 20px;text-align:center">Photo à venir</div>'}</div>`}<h3><a href="${link}">${escape(product.name)}</a></h3><strong>${product.price==null?'Prix sur demande':new Intl.NumberFormat('fr-FR').format(product.price)+' F CFA'}</strong><a class="home-product-action" href="${link}">${product.isKit?'Voir le kit':'Voir en boutique'} ↗</a></article>`;
      }).join('') : '<p>La sélection arrive bientôt. <a href="boutique.html">Découvrir la boutique</a></p>';
      if(grid) window.KitGallery?.mount(grid);
      document.querySelectorAll('.promo a[href*="categorie="], .promo-slide a[href*="categorie="]').forEach(link => {
        const name = new URL(link.href).searchParams.get('categorie');
        const category = categories.find(item => item.name === name);
        if (category) link.href = categoryLink(category);
      });
    } catch {
      if (ticket !== revision) return;
      const count = document.querySelector('#homeProductCount');
      if (count) count.textContent = 'Catalogue indisponible';
      for (const element of [grid, universes, domains]) if (element) element.innerHTML = '<p>Le catalogue est momentanément indisponible. <a href="boutique.html">Accéder à la boutique</a></p>';
    } finally {
      if (grid && ticket === revision) grid.setAttribute('aria-busy', 'false');
    }
  }
  load();
  window.addEventListener('pageshow', event => { if (event.persisted) load(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
