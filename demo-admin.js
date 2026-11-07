// Le nom du fichier est conservé pour rester compatible avec le serveur installé.
// Toutes les opérations passent désormais par l'API authentifiée.
(() => {
  const modal = document.querySelector('#adminModal');
  if (!modal) return;
  const $ = selector => document.querySelector(selector);
  const loginView = $('#adminLoginView'), workspace = $('#adminWorkspace');
  const loginForm = $('#adminLoginForm'), loginFeedback = $('#adminLoginFeedback');
  const productForm = $('#productAdminForm'), categoryForm = $('#categoryAdminForm');
  const productFeedback = $('#productAdminFeedback'), categoryFeedback = $('#categoryAdminFeedback');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let categories = [], products = [], epoch = 0, working = false, checkingSession = false;

  function feedback(element, message = '', error = false) {
    element.textContent = message;
    element.classList.toggle('is-error', error);
    element.classList.toggle('is-success', Boolean(message) && !error);
  }
  function resetProduct() {
    productForm.reset(); productForm.elements.id.value = '';
    productForm.elements.isActive.checked = true; productForm.hidden = true;
    populateCategories();
  }
  function resetCategory() {
    categoryForm.reset(); categoryForm.elements.id.value = '';
    categoryForm.elements.isActive.checked = true; categoryForm.hidden = true;
  }
  function setLoggedIn(admin) {
    epoch++;
    loginView.hidden = Boolean(admin); workspace.hidden = !admin;
    resetProduct(); resetCategory();
    feedback(productFeedback); feedback(categoryFeedback);
    if (admin) $('#adminWelcome').textContent = `Connecté : ${admin.full_name || admin.fullName || admin.email}`;
    else {
      categories = []; products = [];
      $('#adminProductList').replaceChildren(); $('#adminCategoryList').replaceChildren();
      $('#adminWelcome').textContent = '';
    }
  }
  async function api(url, options) {
    try { return await window.CatalogueApi.request(url, options); }
    catch (error) {
      if (error.status === 401 && url !== '/api/admin/login' && url !== '/api/admin/me') {
        setLoggedIn(null); feedback(loginFeedback, 'Votre session a expiré. Reconnectez-vous.', true);
      }
      throw error;
    }
  }
  function populateCategories(selected = '') {
    productForm.elements.categoryId.innerHTML = categories.map(category => `<option value="${escape(category.id)}" ${String(category.id) === String(selected) ? 'selected' : ''}>${escape(category.name)}${category.isActive ? '' : ' (masquée)'}</option>`).join('');
  }
  function renderLists() {
    $('#adminProductList').innerHTML = products.length ? products.map(product => `<article class="admin-row ${product.isActive ? '' : 'is-archived'}"><div class="admin-row-main"><b>${escape(product.name)}</b><span>${escape(product.category)} · ${product.price == null ? 'Prix sur demande' : `${Number(product.price).toLocaleString('fr-FR')} F CFA`}</span><small>${escape(product.unit || 'Unité à préciser')} · ${product.stock == null ? 'stock non renseigné' : `${escape(product.stock)} en stock`}${product.isActive ? '' : ' · masqué'}${product.categoryActive === false ? ' · catégorie masquée' : ''}</small></div><div class="admin-row-actions"><button type="button" data-edit-product="${escape(product.id)}">Modifier</button><button type="button" data-toggle-product="${escape(product.id)}">${product.isActive ? 'Retirer' : 'Réactiver'}</button></div></article>`).join('') : '<p class="admin-empty">Aucun produit enregistré. Ajoutez votre premier produit.</p>';
    $('#adminCategoryList').innerHTML = categories.length ? categories.map(category => `<article class="admin-row ${category.isActive ? '' : 'is-archived'}"><div class="admin-row-main">${category.imageUrl ? `<img src="${escape(category.imageUrl)}" alt="" loading="lazy" style="width:64px;height:64px;object-fit:cover;border-radius:10px;margin-bottom:8px">` : ''}<b>${escape(category.name)}</b><span>${escape(category.description || 'Sans description')}</span><small>${category.isActive ? 'Active sur la boutique' : 'Masquée sur la boutique'}</small></div><div class="admin-row-actions"><button type="button" data-edit-category="${escape(category.id)}">Modifier</button><button type="button" data-toggle-category="${escape(category.id)}">${category.isActive ? 'Retirer' : 'Réactiver'}</button></div></article>`).join('') : '<p class="admin-empty">Créez une première catégorie.</p>';
  }
  async function loadAdminCatalog() {
    const ticket = epoch;
    const rows = await Promise.all([api('/api/admin/categories'), api('/api/admin/products')]);
    if (ticket !== epoch) return;
    [categories, products] = rows;
    renderLists(); populateCategories(productForm.elements.categoryId.value);
  }
  async function mutate(task, element, message, reset) {
    if (working) return;
    working = true; workspace.inert = true; feedback(element, 'Enregistrement…');
    try {
      await task();
      if (reset) reset();
      window.dispatchEvent(new Event('catalog:refresh'));
      try { await loadAdminCatalog(); feedback(element, message); }
      catch { feedback(element, `${message} Rechargez l’espace de gestion pour actualiser la liste.`, true); }
    } catch (error) { feedback(element, error.message, true); }
    finally { working = false; workspace.inert = false; }
  }

  window.addEventListener('admin:expired', () => { setLoggedIn(null); feedback(loginFeedback, 'Votre session a expiré. Reconnectez-vous.', true); });
  $('#openAdmin').addEventListener('click', async () => {
    modal.classList.add('show');
    if (checkingSession || working) return;
    checkingSession = true;
    feedback(loginFeedback);
    try {
      const admin = await api('/api/admin/me');
      setLoggedIn(admin);
      try { await loadAdminCatalog(); } catch (error) { feedback(productFeedback, error.message, true); }
    } catch (error) {
      setLoggedIn(null);
      if (error.status !== 401) feedback(loginFeedback, error.message, true);
    } finally { checkingSession = false; }
  });
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = loginForm.querySelector('[type=submit]');
    if (button.disabled || checkingSession) return;
    button.disabled = true; feedback(loginFeedback, 'Vérification…');
    const data = Object.fromEntries(new FormData(loginForm));
    try {
      const admin = await api('/api/admin/login', { method: 'POST', body: JSON.stringify(data) });
      loginForm.reset(); setLoggedIn(admin); feedback(loginFeedback);
      try { await loadAdminCatalog(); } catch (error) { feedback(productFeedback, error.message, true); }
    } catch (error) { feedback(loginFeedback, error.message, true); }
    finally { button.disabled = false; }
  });
  $('#adminLogout').addEventListener('click', async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    button.disabled = true;
    try { await api('/api/admin/logout', { method: 'POST', body: '{}' }); setLoggedIn(null); }
    catch (error) { feedback(productFeedback, error.message, true); }
    finally { button.disabled = false; }
  });
  document.querySelectorAll('[data-admin-tab]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-admin-tab]').forEach(tab => tab.classList.toggle('active', tab === button));
    $('#adminProductsPanel').hidden = button.dataset.adminTab !== 'products';
    $('#adminCategoriesPanel').hidden = button.dataset.adminTab !== 'categories';
  }));
  $('#newProduct').addEventListener('click', () => {
    resetProduct();
    if (!categories.length) return feedback(productFeedback, 'Créez une catégorie avant d’ajouter un produit.', true);
    populateCategories(categories.find(category => category.isActive)?.id || categories[0].id);
    productForm.hidden = false; productForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('#cancelProductEdit').addEventListener('click', resetProduct);
  productForm.addEventListener('submit', event => {
    event.preventDefault();
    if (productForm.dataset.uploading === 'true') return feedback(productFeedback, 'Patientez pendant l’enregistrement de la photo.', true);
    const data = Object.fromEntries(new FormData(productForm));
    data.isActive = productForm.elements.isActive.checked;
    const id = data.id; delete data.id;
    // Garder les identifiants bigint sous forme de chaînes.
    mutate(() => api(id ? `/api/admin/products/${id}` : '/api/admin/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }), productFeedback, 'Produit enregistré dans le catalogue.', resetProduct);
  });
  $('#adminProductList').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-product]'), toggle = event.target.closest('[data-toggle-product]');
    const product = products.find(item => String(item.id) === (edit?.dataset.editProduct || toggle?.dataset.toggleProduct));
    if (!product) return;
    if (edit) {
      resetProduct();
      for (const field of ['id', 'name', 'description', 'unit', 'price', 'stock', 'imageUrl']) productForm.elements[field].value = product[field] ?? '';
      productForm.elements.isActive.checked = product.isActive;
      populateCategories(product.categoryId); productForm.hidden = false;
      productForm.dispatchEvent(new Event('product:edit'));
      productForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (toggle) {
      const active = !product.isActive;
      if (!active && !confirm(`Retirer « ${product.name} » de la boutique ?`)) return;
      mutate(() => api(`/api/admin/products/${product.id}`, { method: 'PUT', body: JSON.stringify({ ...product, isActive: active, imageUrl: product.imageUrl || '' }) }), productFeedback, active ? 'Produit réactivé.' : 'Produit masqué.');
    }
  });
  $('#newCategory').addEventListener('click', () => { resetCategory(); categoryForm.hidden = false; categoryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  $('#cancelCategoryEdit').addEventListener('click', resetCategory);
  categoryForm.addEventListener('submit', event => {
    event.preventDefault();
    if (categoryForm.dataset.uploading === 'true') return feedback(categoryFeedback, 'Patientez pendant l’enregistrement de la photo.', true);
    const data = Object.fromEntries(new FormData(categoryForm)); data.isActive = categoryForm.elements.isActive.checked;
    const id = data.id; delete data.id;
    mutate(() => api(id ? `/api/admin/categories/${id}` : '/api/admin/categories', { method: id ? 'PUT' : 'POST', body: JSON.stringify(data) }), categoryFeedback, 'Catégorie enregistrée dans le catalogue.', resetCategory);
  });
  $('#adminCategoryList').addEventListener('click', event => {
    const edit = event.target.closest('[data-edit-category]'), toggle = event.target.closest('[data-toggle-category]');
    const category = categories.find(item => String(item.id) === (edit?.dataset.editCategory || toggle?.dataset.toggleCategory));
    if (!category) return;
    if (edit) {
      resetCategory();
      for (const field of ['id', 'name', 'description', 'imageUrl']) categoryForm.elements[field].value = category[field] ?? '';
      categoryForm.elements.isActive.checked = category.isActive; categoryForm.hidden = false;
      categoryForm.dispatchEvent(new Event('category:edit'));
      categoryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (toggle) {
      const active = !category.isActive;
      if (!active && !confirm(`Masquer « ${category.name} » et ses produits sur la boutique ?`)) return;
      mutate(() => api(`/api/admin/categories/${category.id}`, { method: 'PUT', body: JSON.stringify({ ...category, isActive: active }) }), categoryFeedback, active ? 'Catégorie réactivée.' : 'Catégorie masquée.');
    }
  });
})();
