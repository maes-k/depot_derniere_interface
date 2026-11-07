(() => {
  function openLinkedPanel() {
    if (location.hash === '#gestion') document.querySelector('#openAdmin')?.click();
    if (location.hash === '#panier') document.querySelector('#openCart')?.click();
  }
  openLinkedPanel(); window.addEventListener('hashchange', openLinkedPanel);
  const params = new URLSearchParams(location.search);
  const id = params.get('categorieId'), name = params.get('categorie'), productId = params.get('produitId');
  let applied = !id && !name;
  function selectCategory() {
    if (applied) return;
    const button = [...document.querySelectorAll('#filters [data-category-id]')].find(item => id ? item.dataset.categoryId === id : item.dataset.category === name);
    if (button) { applied = true; button.click(); }
  }
  selectCategory();
  let productOpened=false;
  function openProduct(){if(productOpened||!productId)return;const button=[...document.querySelectorAll('[data-detail]')].find(b=>b.dataset.detail===productId);if(button){productOpened=true;button.click();}}
  openProduct();
  window.addEventListener('catalog:loaded', () => { selectCategory(); applied = true; openProduct(); });
})();
