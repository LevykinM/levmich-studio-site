/* Info page: reading progress, document switching and final CTA. */
(() => {
  'use strict';

  if (!document.body.classList.contains('info-page')) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldStartAtTop = !window.location.hash || window.location.hash === '#info-top';
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  if (shouldStartAtTop) {
    window.scrollTo(0, 0);
  }

  const docs = Array.from(document.querySelectorAll('.info-doc'));
  const sideItems = Array.from(document.querySelectorAll('.info-side__item'));
  const mobileStatus = document.getElementById('info-mobile-status');
  const mobileLabel = mobileStatus?.querySelector('.info-mobile-status__label');
  const dockProgress = document.getElementById('dock-info-progress');
  const dock = document.getElementById('dock');
  const completeCard = document.getElementById('info-complete');

  if (!docs.length || !sideItems.length) return;

  const docMeta = docs.map(doc => ({
    id: doc.dataset.docId,
    title: sideItems.find(item => item.dataset.doc === doc.dataset.docId)?.querySelector('.info-side__label')?.textContent?.trim() || '',
    doc,
  }));

  let read = {};
  let activeId = docMeta[0].id;
  let ticking = false;
  let lastScrollY = window.scrollY || window.pageYOffset || 0;
  let settleTimer = 0;
  let labelTimer = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  let scrollFrame = 0;

  function animateScrollTo(top, duration = 420) {
    window.cancelAnimationFrame(scrollFrame);
    if (reduceMotion || duration <= 0) {
      window.scrollTo(0, top);
      return;
    }

    const start = window.scrollY || window.pageYOffset || 0;
    const distance = top - start;
    const started = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 4);

    const step = now => {
      const p = clamp((now - started) / duration);
      window.scrollTo(0, start + distance * ease(p));
      if (p < 1) scrollFrame = window.requestAnimationFrame(step);
    };

    scrollFrame = window.requestAnimationFrame(step);
  }

  function docProgress(doc) {
    const top = doc.offsetTop;
    const height = Math.max(doc.offsetHeight, 1);
    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const y = window.scrollY || window.pageYOffset || 0;
    const start = top - viewport * 0.35;
    const end = top + height - viewport * 0.72;
    return clamp((y - start) / Math.max(end - start, 1));
  }

  function scrollToDoc(id) {
    const target = docMeta.find(meta => meta.id === id)?.doc;
    if (!target) return;
    const offset = window.matchMedia('(orientation: portrait)').matches ? 26 : 36;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    animateScrollTo(top, window.matchMedia('(orientation: portrait)').matches ? 340 : 460);
  }

  function nextDocId() {
    const index = Math.max(0, docMeta.findIndex(meta => meta.id === activeId));
    return docMeta[(index + 1) % docMeta.length].id;
  }

  function setRing(ring, progress, done) {
    if (!ring) return;
    const value = done ? 1 : clamp(progress);
    ring.style.setProperty('--dash', String(100 - value * 100));
    ring.classList.toggle('is-complete', !!done);
  }

  function setCurrentRings(progress, done) {
    document.querySelectorAll('[data-progress-current], [data-progress-dock]').forEach(ring => {
      setRing(ring, progress, done);
    });
  }

  // Measure the rendered width of a label string inside the live status
  // pill, without disturbing the visible content. We clone the existing
  // label, hide it, write the new text, read offsetWidth, then drop it.
  function measureLabelWidth(text) {
    if (!mobileLabel || !mobileStatus) return 0;
    const clone = mobileLabel.cloneNode(false);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.visibility = 'hidden';
    clone.style.whiteSpace = 'nowrap';
    clone.style.opacity = '0';
    clone.style.pointerEvents = 'none';
    clone.textContent = text;
    mobileStatus.appendChild(clone);
    const w = clone.offsetWidth;
    mobileStatus.removeChild(clone);
    return w;
  }

  // Pre-compute the pill width that should hug each new label string and
  // animate min-width to it. The pill itself has `width: auto` and a CSS
  // transition on min-width, so setting min-width here gives a smooth,
  // slightly bouncy width morph between document states.
  function applyPillWidth(text) {
    if (!mobileStatus) return;
    // Pill = label width + ring (18) + gap (10) + padding (16*2)
    const labelW = measureLabelWidth(text);
    if (!labelW) return;
    const pillW = labelW + 18 + 10 + 32;
    // Floor the value a hair so floating-point pixels don't cause a
    // 1-frame layout jitter on every label tick.
    mobileStatus.style.minWidth = Math.max(168, Math.round(pillW)) + 'px';
  }

  function setMobileLabel(text) {
    if (!mobileLabel) return;
    if (mobileLabel.textContent === text) {
      applyPillWidth(text);
      return;
    }
    if (reduceMotion) {
      mobileLabel.textContent = text;
      applyPillWidth(text);
      return;
    }

    window.clearTimeout(labelTimer);
    // Width morphs IMMEDIATELY in sync with the label fade-out, so the
    // pill stretches/shrinks alongside the text crossfade — one smooth
    // motion, no perceptible pause.
    applyPillWidth(text);
    mobileStatus?.classList.add('is-label-out');
    // 96ms ≈ the label opacity transition, so the swap happens right
    // at opacity 0 and the reverse transition takes the new text back
    // in immediately. No keyframe animation, no idle gap.
    labelTimer = window.setTimeout(() => {
      mobileLabel.textContent = text;
      mobileStatus?.classList.remove('is-label-out');
    }, 96);
  }

  function currentLang() {
    return document.body.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
  }

  function servicesLabel() {
    return currentLang() === 'en' ? 'To services' : 'К услугам';
  }

  function updateCompleteCard() {
    const allRead = docMeta.every(meta => read[meta.id]);
    if (completeCard) {
      completeCard.classList.toggle('is-visible', allRead);
      completeCard.setAttribute('aria-hidden', String(!allRead));
    }
    if (mobileStatus) {
      const wasAllRead = mobileStatus.classList.contains('is-all-read');
      mobileStatus.classList.toggle('is-all-read', allRead);
      mobileStatus.setAttribute(
        'aria-label',
        allRead
          ? servicesLabel()
          : (currentLang() === 'en' ? 'Switch document' : 'Переключить документ')
      );
      // When the pill morphs to the compact orange CTA we don't want it
      // to keep an inflated min-width from a long doc title — let the
      // CTA hug the "К услугам / To services" copy instead.
      if (allRead && !wasAllRead) {
        applyPillWidth(servicesLabel());
      }
    }
  }

  function syncDockState() {
    document.body.classList.toggle('is-info-dock-open', dock?.dataset.state === 'open');
  }

  function update() {
    ticking = false;
    syncDockState();
    const viewport = window.innerHeight || document.documentElement.clientHeight || 1;
    const midline = viewport * 0.34;
    let nextActive = docMeta[0].id;

    docMeta.forEach(meta => {
      const rect = meta.doc.getBoundingClientRect();
      if (rect.top <= midline) nextActive = meta.id;
    });
    activeId = nextActive;

    const state = { ...read };

    docMeta.forEach(meta => {
      const progress = docProgress(meta.doc);
      if (progress >= 0.995) state[meta.id] = true;

      const done = !!state[meta.id];
      const item = sideItems.find(side => side.dataset.doc === meta.id);
      item?.classList.toggle('is-active', meta.id === activeId);
      item?.classList.toggle('is-read', done);
      item?.style.setProperty('--dash', String(100 - (done ? 100 : progress * 100)));

      document.querySelectorAll(`[data-progress-ring][data-doc="${meta.id}"]`).forEach(ring => {
        setRing(ring, progress, done);
      });
    });

    read = state;

    const current = docMeta.find(meta => meta.id === activeId) || docMeta[0];
    const currentProgress = docProgress(current.doc);
    const currentDone = !!read[current.id];

    const allRead = docMeta.every(meta => read[meta.id]);
    setMobileLabel(allRead ? servicesLabel() : current.title);
    setCurrentRings(currentProgress, currentDone);
    updateCompleteCard();
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function initTextReel() {
    const blocks = Array.from(document.querySelectorAll(
      '.info-doc__head, .info-subsection__title, .info-p, .info-list li'
    ));
    if (!blocks.length) return;

    blocks.forEach((block, index) => {
      block.classList.add('info-reel');
      block.style.setProperty('--info-reel-delay', `${Math.min(index * 24, 140)}ms`);
    });

    if (reduceMotion || !('IntersectionObserver' in window)) {
      blocks.forEach(block => block.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -8% 0px',
    });

    blocks.forEach(block => observer.observe(block));
  }

  function applyScrollBounce() {
    if (reduceMotion) return;
    const y = window.scrollY || window.pageYOffset || 0;
    const delta = y - lastScrollY;
    lastScrollY = y;
    if (Math.abs(delta) < 1) return;

    const direction = delta > 0 ? -1 : 1;
    document.documentElement.style.setProperty('--info-bounce-y', `${direction * 3}px`);
    document.documentElement.style.setProperty('--info-bounce-tilt', `${direction * 0.45}deg`);

    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      document.documentElement.style.setProperty('--info-bounce-y', '0px');
      document.documentElement.style.setProperty('--info-bounce-tilt', '0deg');
    }, 74);
  }

  sideItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      scrollToDoc(item.dataset.doc);
    });
  });

  [mobileStatus, dockProgress].forEach(button => {
    button?.addEventListener('click', () => {
      // Once all three docs are read, the mobile pill becomes the
      // "К услугам / To services" CTA and routes to the Services section.
      if (button === mobileStatus && docMeta.every(meta => read[meta.id])) {
        window.location.href = 'index.html#services';
        return;
      }
      scrollToDoc(nextDocId());
    });
  });

  // Re-sync the pill label when the language toggles, so "К услугам"
  // becomes "To services" (and vice versa) without a scroll event.
  new MutationObserver(requestUpdate).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-lang'],
  });

  document.querySelectorAll('.footer__info-card').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      read = {};
      activeId = docMeta[0].id;
      window.history.replaceState(null, '', 'info.html#info-top');
      animateScrollTo(0, 0);
      requestUpdate();
    });
  });

  if (dock) {
    syncDockState();
    new MutationObserver(syncDockState).observe(dock, { attributes: true, attributeFilter: ['data-state'] });
  }

  initTextReel();
  update();
  if (shouldStartAtTop) {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      requestUpdate();
    });
  }
  window.addEventListener('scroll', () => {
    applyScrollBounce();
    requestUpdate();
  }, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
})();
