(() => {
  const selector = 'main h1, main h2, main h3';
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter('fr', { granularity: 'grapheme' }) : null;
  function enhance(element) {
    if (element.dataset.letterHover) return;
    element.dataset.letterHover = 'true';
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (!node.textContent.trim()) continue;
      const fragment = document.createDocumentFragment();
      for (const part of node.textContent.split(/(\s+)/u)) {
        if (!part || /^\s+$/u.test(part)) {
          fragment.append(document.createTextNode(part));
          continue;
        }
        const word = document.createElement('span');
        word.className = 'letter-word';
        const letters = segmenter ? [...segmenter.segment(part)].map(s => s.segment) : Array.from(part);
        for (const letter of letters) {
          const span = document.createElement('span');
          span.className = 'letter-glyph';
          span.textContent = letter;
          word.append(span);
        }
        fragment.append(word);
      }
      node.replaceWith(fragment);
    }
  }
  document.querySelectorAll(selector).forEach(enhance);
  // Include product titles inserted after the catalogue has loaded.
  const main = document.querySelector('main');
  if (main && !document.body.classList.contains('shop-page')) new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (node.matches(selector)) enhance(node);
      node.querySelectorAll(selector).forEach(enhance);
    }
  }).observe(main, { childList: true, subtree: true });
})();
