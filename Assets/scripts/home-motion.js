(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const active = new Map();
  const registered = new WeakSet();
  let frame = 0;
  let lastTick = 0;
  let measurePending = true;

  function splitWords(element) {
    if (element.querySelector('.home-motion-word')) return [...element.querySelectorAll('.home-motion-word')];

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim()) textNodes.push(walker.currentNode);
    }

    return textNodes.flatMap(node => {
      const phrase = document.createElement('span');
      const words = [];
      // Keep non-breaking spaces inside a word group so prices and typography wrap as before.
      for (const part of node.nodeValue.split(/([ \t\n\r\f]+)/u)) {
        if (!part) continue;
        if (!part.trim()) {
          phrase.append(part);
          continue;
        }
        const word = document.createElement('span');
        word.className = 'home-motion-word';
        word.textContent = part;
        phrase.append(word);
        words.push(word);
      }
      node.replaceWith(phrase);
      return words;
    });
  }

  function prepareText(elements) {
    const words = elements.flatMap(splitWords);
    words.forEach((word, index) => {
      word.style.setProperty('--home-word-delay', String(0.58 * index / Math.max(1, words.length - 1)));
    });
  }

  function register(anchor, layers, text) {
    if (registered.has(anchor)) return;
    registered.add(anchor);
    prepareText(text);
    layers.forEach(layer => layer.classList.add('home-motion-layer'));
    anchor.dataset.homeRevealing = '';
    active.set(anchor, { layers, movesAnchor: layers.includes(anchor), current: 0, target: 0 });
    requestMeasurement();
  }

  function finish(anchor, entry) {
    delete anchor.dataset.homeRevealing;
    anchor.style.removeProperty('--home-reveal');
    entry.layers.forEach(layer => layer.classList.remove('home-motion-layer'));
    active.delete(anchor);
  }

  function requestFrame() {
    if (!frame && active.size) frame = requestAnimationFrame(update);
  }

  function requestMeasurement() {
    measurePending = true;
    requestFrame();
  }

  function update(time) {
    frame = 0;
    const elapsed = lastTick ? Math.min(time - lastTick, 64) : 16;
    lastTick = time;
    if (measurePending) {
      measurePending = false;
      const viewport = window.innerHeight;
      for (const [anchor, entry] of active) {
        const bounds = anchor.getBoundingClientRect();
        // Own translation affects the rect but not when the block should enter.
        const offset = entry.movesAnchor ? 30 * (1 - entry.current) ** 2 : 0;
        const distance = Math.min(viewport * .4, Math.max(116, bounds.height * .68));
        const progress = (viewport * .985 - bounds.top + offset) / distance;
        entry.target = Math.max(entry.target, clamp(progress));
      }
    }

    const settle = 1 - Math.exp(-elapsed / 88);
    let needsFrame = false;
    for (const [anchor, entry] of active) {
      if (entry.current === entry.target) continue;
      entry.current += (entry.target - entry.current) * settle;
      if (entry.target - entry.current < .003) entry.current = entry.target;
      if (entry.current === 1) finish(anchor, entry);
      else anchor.style.setProperty('--home-reveal', String(entry.current));
      needsFrame ||= entry.current < entry.target;
    }
    if (needsFrame) requestFrame();
    else lastTick = 0;
  }

  const about = document.querySelector('.studio-intro__inner');
  if (about) {
    const portraits = about.querySelector('.studio-intro__portraits');
    const bio = about.querySelector('.studio-intro__text');
    register(about, [portraits, bio], [...bio.querySelectorAll('h2, li, p')]);

    const pointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const resetPortraits = () => {
      portraits.style.removeProperty('--portrait-motion-x');
      portraits.style.removeProperty('--portrait-motion-y');
    };
    about.addEventListener('pointermove', event => {
      if (!pointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
      const bounds = about.getBoundingClientRect();
      const x = clamp((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = clamp((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      portraits.style.setProperty('--portrait-motion-x', `${x * 17}px`);
      portraits.style.setProperty('--portrait-motion-y', `${y * 13}px`);
    }, { passive: true });
    about.addEventListener('pointerleave', resetPortraits);
    about.addEventListener('pointercancel', resetPortraits);
    window.addEventListener('blur', resetPortraits);
    pointer.addEventListener('change', resetPortraits);
    reducedMotion.addEventListener('change', resetPortraits);
  }

  document.querySelectorAll('.home-section-title, .portfolio__title').forEach(title => register(title, [title], [title]));
  document.querySelectorAll('.home-service').forEach(card => {
    register(card, [card], [...card.querySelectorAll('h3, .home-service__description, .home-service__price, .studio-button')]);
  });

  const gallery = document.querySelector('.portfolio__grid');
  if (gallery) {
    function prepareCases() {
      if (reducedMotion.matches) return;
      gallery.querySelectorAll('.portfolio-case').forEach(card => {
        const title = card.querySelector('.portfolio-case__title');
        const layers = [...card.querySelectorAll('.portfolio-case__media, .portfolio-case__meta')];
        if (!title || !layers.length) return;
        if (!registered.has(card)) register(card, layers, [title]);
        else if (active.has(card) && !title.querySelector('.home-motion-word')) prepareText([title]);
      });
    }
    prepareCases();
    // The published case list can replace a title or add a card after the page loads.
    new MutationObserver(prepareCases).observe(gallery, { childList: true, subtree: true });
  }

  document.querySelectorAll('.footer__consult, .footer__nav, .footer__media, .footer__logo-link, .footer__info-card').forEach(block => {
    register(block, [block], [...block.querySelectorAll('h2, p, .footer__button, .footer__nav-item, .footer__info-card-title, .footer__info-card-list > span')]);
  });

  window.addEventListener('scroll', requestMeasurement, { passive: true });
  window.addEventListener('resize', requestMeasurement, { passive: true });
  window.addEventListener('pageshow', requestMeasurement);
  window.addEventListener('load', requestMeasurement, { once: true });
  document.fonts?.ready.then(requestMeasurement);
  document.addEventListener('focusin', event => {
    const anchor = event.target.closest('[data-home-revealing]');
    if (anchor) finish(anchor, active.get(anchor));
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    for (const [anchor, entry] of active) finish(anchor, entry);
  });
})();
