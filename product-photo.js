// Même sélecteur de photo pour les produits et les catégories.
(() => {
  function setup(kind, formId, endpoint, noun) {
    const form = document.querySelector(formId);
    if (!form) return;
    const file = document.querySelector(`#${kind}ImageFile`), value = form.elements.imageUrl;
    const image = document.querySelector(`#${kind}PhotoImage`), empty = document.querySelector(`#${kind}PhotoEmpty`);
    const remove = document.querySelector(`#remove${kind[0].toUpperCase() + kind.slice(1)}Photo`);
    const status = document.querySelector(`#${kind}PhotoStatus`), submit = form.querySelector('[type=submit]');
    const hint = 'JPG, PNG ou WebP · 8 Mo maximum. Image optimisée automatiquement.';
    let revision = 0;
    function render() {
      const src = value.value.trim();
      image.hidden = !src; empty.hidden = Boolean(src); remove.hidden = !src;
      if (src) image.src = src; else image.removeAttribute('src');
    }
    function reset() {
      revision++; file.value = ''; status.textContent = hint;
      form.dataset.uploading = 'false'; submit.disabled = false;
      queueMicrotask(render);
    }
    file.addEventListener('change', async () => {
      const selected = file.files[0]; if (!selected) return;
      const ticket = ++revision;
      // Une nouvelle sélection, même invalide, annule l'effet de la précédente.
      form.dataset.uploading = 'false'; submit.disabled = false;
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
        status.textContent = 'Choisissez une image JPG, PNG ou WebP.'; file.value = ''; return;
      }
      if (selected.size > 8 * 1024 * 1024) {
        status.textContent = 'Cette image dépasse 8 Mo.'; file.value = ''; return;
      }
      submit.disabled = true; form.dataset.uploading = 'true';
      status.textContent = 'Enregistrement de la photo…';
      let url;
      try {
        url = URL.createObjectURL(selected);
        const photo = new Image(); photo.src = url; await photo.decode();
        if (ticket !== revision) return;
        const scale = Math.min(1, 1200 / photo.naturalWidth, 1200 / photo.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(photo, 0, 0, canvas.width, canvas.height);
        let dataUrl = canvas.toDataURL('image/jpeg', .82);
        if (dataUrl.length > 1400000) dataUrl = canvas.toDataURL('image/jpeg', .62);
        if (dataUrl.length > 2000000) throw new Error('Photo trop lourde après optimisation. Choisissez une autre image.');
        const result = await window.CatalogueApi.request(endpoint, { method: 'POST', body: JSON.stringify({ dataUrl }) });
        if (ticket !== revision) return;
        value.value = result.imageUrl; render();
        status.textContent = `Photo enregistrée. Enregistrez ${noun} pour lui associer cette photo.`;
      } catch (error) {
        if (ticket === revision) status.textContent = error.message || 'Cette image ne peut pas être enregistrée.';
        if (error.status === 401) window.dispatchEvent(new Event('admin:expired'));
      } finally {
        if (url) URL.revokeObjectURL(url);
        if (ticket === revision) { submit.disabled = false; form.dataset.uploading = 'false'; }
      }
    });
    remove.addEventListener('click', () => {
      value.value = ''; reset();
      status.textContent = `Photo retirée. Enregistrez ${noun} pour confirmer.`;
    });
    form.addEventListener('reset', reset);
    form.addEventListener(`${kind}:edit`, () => { reset(); render(); });
    render();
  }
  setup('product', '#productAdminForm', '/api/admin/product-image', 'le produit');
  setup('category', '#categoryAdminForm', '/api/admin/category-image', 'la catégorie');
})();
