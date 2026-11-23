(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coverTime = 250;
  const revealTime = 520;
  let navigating = false;
  let revealTimer;
  let recoveryTimer;

  function reveal() {
    window.clearTimeout(revealTimer);
    if (reduceMotion.matches) {
      delete root.dataset.pageTransition;
      return;
    }
    root.dataset.pageTransition = 'reveal';
    revealTimer = window.setTimeout(() => {
      if (root.dataset.pageTransition === 'reveal') delete root.dataset.pageTransition;
    }, revealTime);
  }

  function canAnimate(url) {
    if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return false;
    if (/^\/admin(?:\/|$)/.test(url.pathname)) return false;
    const filename = url.pathname.split('/').pop();
    if (filename.includes('.') && !/\.html?$/i.test(filename)) return false;
    return url.pathname !== window.location.pathname || url.search !== window.location.search;
  }

  function navigate(href) {
    const url = new URL(href, document.baseURI);
    if (!canAnimate(url) || reduceMotion.matches) {
      window.location.assign(url.href);
      return;
    }
    if (navigating) return;
    navigating = true;
    root.dataset.pageTransition = 'cover';
    window.setTimeout(() => {
      window.location.assign(url.href);
      // The original page is still active if the browser cancels navigation.
      recoveryTimer = window.setTimeout(() => {
        navigating = false;
        reveal();
      }, 2400);
    }, coverTime);
  }

  async function swap(change) {
    if (reduceMotion.matches) {
      change();
      return;
    }
    root.dataset.pageTransition = 'cover';
    await new Promise(resolve => window.setTimeout(resolve, coverTime));
    try {
      change();
    } finally {
      reveal();
    }
  }

  window.levmichPageTransition = { navigate, swap };
  reveal();

  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    window.clearTimeout(recoveryTimer);
    navigating = false;
    reveal();
  });

  window.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || (link.target && link.target.toLowerCase() !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.href, document.baseURI);
    if (!canAnimate(url) || reduceMotion.matches) return;
    event.preventDefault();
    navigate(url.href);
  });
})();
