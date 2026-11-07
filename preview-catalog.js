// Panier commun aux quatre pages. Initialisation synchrone, sans appel API.
(() => {
  const key = 'ddb-cart-postgres-v1';
  let memory = [], storageAvailable = true;
  function normalize(value) {
    if (!Array.isArray(value)) return [];
    const items = new Map();
    for (const item of value) {
      if (!item || !['string', 'number'].includes(typeof item.id)) continue;
      const id = String(item.id), qty = Number(item.qty);
      if (!id || !Number.isSafeInteger(qty) || qty <= 0) continue;
      items.set(id, Math.min(Number.MAX_SAFE_INTEGER, (items.get(id) || 0) + qty));
    }
    return [...items].map(([id, qty]) => ({ id, qty }));
  }
  function read() {
    if (storageAvailable) {
      try { memory = normalize(JSON.parse(localStorage.getItem(key) || '[]')); }
      catch (error) {
        if (error instanceof SyntaxError) memory = [];
        else storageAvailable = false;
      }
    }
    return memory.map(item => ({ ...item }));
  }
  function mount() {
    const count = read().reduce((sum, item) => Math.min(Number.MAX_SAFE_INTEGER, sum + item.qty), 0);
    document.querySelectorAll('.site-header [data-cart-count]').forEach(badge => {
      badge.textContent = String(count);
      badge.style.removeProperty('visibility');
      badge.closest('.cart-button')?.setAttribute('aria-label', `Mon panier : ${count} article${count === 1 ? '' : 's'}`);
    });
  }
  function announce(source) {
    mount();
    window.dispatchEvent(new CustomEvent('cart:change', { detail: { source } }));
  }
  function set(items) {
    const next = normalize(items);
    const previous = JSON.stringify(read());
    const encoded = JSON.stringify(next);
    memory = next;
    if (previous === encoded) { mount(); return storageAvailable; }
    if (storageAvailable) {
      try { localStorage.setItem(key, encoded); }
      catch { storageAvailable = false; }
    }
    announce('local');
    return storageAvailable;
  }
  read();
  window.CatalogueCart = Object.freeze({ read, set, mount });
  window.addEventListener('pageshow', () => announce('pageshow'));
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) announce('storage');
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) announce('visibility');
  });
})();

// Accès au catalogue du serveur : aucune donnée de démonstration.
(() => {
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
        headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Ouvrez le site depuis son serveur Node.js : http://localhost:3000.');
      }
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error || 'La demande n’a pas abouti. Réessayez.');
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Le serveur met trop de temps à répondre. Réessayez.');
      if (error instanceof TypeError) throw new Error('Le serveur est inaccessible. Réessayez dans quelques instants.');
      throw error;
    } finally { clearTimeout(timeout); }
  }

  async function load() {
    const [categories, products] = await Promise.all([request('/api/categories'), request('/api/products')]);
    if (!Array.isArray(categories) || !Array.isArray(products)) throw new Error('Réponse du catalogue invalide.');
    return {
      categories: categories.map(category => ({ ...category, id: String(category.id) })),
      products: products.map(product => ({ ...product, id: String(product.id), categoryId: String(product.categoryId), price: product.price == null || product.price === '' ? null : Number(product.price) }))
    };
  }
  window.CatalogueApi = Object.freeze({ request, load });
})();

(()=>{const entries=[["Peinture acrylique", "assets/visuels-20261107/peinture-acrylique.webp"], ["Treillis soudés", "assets/visuels-20261107/treillis-soudes.webp"], ["Fer à béton", "assets/visuels-20261107/fer-a-beton.webp"], ["Tuyaux PVC", "assets/visuels-20261107/tuyaux-pvc.webp"], ["Tôles de couverture", "assets/visuels-20261107/toles-couverture.webp"], ["Sanitaires", "assets/visuels-20261107/sanitaires.webp"], ["Gravier", "assets/visuels-20261107/gravier.webp"], ["Sable", "assets/visuels-20261107/sable.webp"], ["Ciment", "assets/visuels-20261107/ciment.webp"], ["Clôture électrique", "assets/visuels-20261107/cloture-electrique.webp"], ["Caméra IP", "assets/visuels-20261107/camera-ip.webp"], ["Kit solaire", "assets/visuels-20261107/kit-solaire.webp"], ["Panneaux solaires", "assets/visuels-20261107/panneaux-solaires.webp"], ["Caméra analogique", "assets/visuels-20261107/camera-analogique.webp"], ["Enregistreur vidéo", "assets/visuels-20261107/enregistreur-video.webp"], ["Accessoires vidéosurveillance", "assets/visuels-20261107/accessoires-video.webp"], ["Caméra de surveillance", "assets/visuels-20261107/camera-ip.webp"], ["Outillage", "assets/visuels-20261107/outillage.webp"]];const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();window.CatalogueArt={forProduct(name){const n=norm(name);return entries.find(([key])=>n.includes(norm(key)))?.[1]||'';}};})();
