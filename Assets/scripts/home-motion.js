(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const active = new Map();
  const registered = new WeakSet();
  const entryLine = .8;
  let frame = 0;

  function splitWords(element) {
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
    for (const element of elements) {
      if (element.querySelector('.home-motion-word')) continue;
      const words = splitWords(element);
      const stagger = Math.min(55, 260 / Math.max(1, words.length - 1));
      words.forEach((word, index) => {
        word.style.setProperty('--home-word-delay', `${stagger * index}ms`);
      });
    }
  }

  function register(anchor, layers, text) {
    if (registered.has(anchor)) return;
    registered.add(anchor);
    prepareText(text);
    layers.forEach(layer => layer.classList.add('home-motion-layer'));
    anchor.dataset.homeRevealing = 'waiting';
    active.set(anchor, layers);
    requestCheck();
  }

  function finish(anchor) {
    delete anchor.dataset.homeRevealing;
    active.get(anchor).forEach(layer => layer.classList.remove('home-motion-layer'));
    active.delete(anchor);
  }

  function requestCheck() {
    if (!frame && active.size) frame = requestAnimationFrame(checkEntries);
  }

  function checkEntries() {
    frame = 0;
    const viewport = window.innerHeight;
    const atBottom = window.scrollY + viewport >= document.documentElement.scrollHeight - 2;
    const started = [];
    for (const [anchor, layers] of active) {
      if (anchor.dataset.homeRevealing !== 'waiting') continue;
      const bounds = anchor.getBoundingClientRect();
      // Use the layout position even when the block itself starts 30 px lower.
      const top = bounds.top - (layers.includes(anchor) ? 30 : 0);
      if (bounds.height && (top <= viewport * entryLine || (atBottom && top < viewport))) {
        started.push(anchor);
      }
    }
    started.forEach(anchor => { anchor.dataset.homeRevealing = 'playing'; });
  }

  const about = document.querySelector('.studio-intro');
  if (about) {
    const intro = about.querySelector('.studio-intro__inner');
    const portraits = intro.querySelector('.studio-intro__portraits');
    const bio = intro.querySelector('.studio-intro__text');
    register(intro, [portraits, bio], [...bio.querySelectorAll('h2, li, p')]);

    const pointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const resetPortraits = () => {
      portraits.style.removeProperty('--portrait-motion-x');
      portraits.style.removeProperty('--portrait-motion-y');
    };
    about.addEventListener('pointermove', event => {
      if (!pointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
      const bounds = intro.getBoundingClientRect();
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
        else if (!title.querySelector('.home-motion-word')) prepareText([title]);
      });
    }
    prepareCases();
    // The published case list can replace a title or add a card after the page loads.
    new MutationObserver(prepareCases).observe(gallery, { childList: true, subtree: true });
  }

  document.querySelectorAll('.footer__consult, .footer__nav, .footer__media, .footer__logo-link, .footer__info-card').forEach(block => {
    register(block, [block], [...block.querySelectorAll('h2, p, .footer__button, .footer__nav-item, .footer__info-card-title, .footer__info-card-list > span')]);
  });

  window.addEventListener('scroll', requestCheck, { passive: true });
  window.addEventListener('resize', requestCheck, { passive: true });
  window.addEventListener('pageshow', requestCheck);
  window.addEventListener('load', requestCheck, { once: true });
  document.fonts?.ready.then(requestCheck);
  document.addEventListener('animationend', event => {
    if (event.animationName !== 'home-block-reveal') return;
    const anchor = event.target.closest('[data-home-revealing]');
    if (anchor) finish(anchor);
  });
  document.addEventListener('focusin', event => {
    const anchor = event.target.closest('[data-home-revealing]');
    if (anchor) finish(anchor);
  });
  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) return;
    for (const anchor of active.keys()) finish(anchor);
  });
})();
