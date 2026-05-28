/* ============================================================
   case-animations.js — анимации для кейс-страниц.
   Подключается ТОЛЬКО на case-three / case-front / case-wedding.
   Требует: GSAP 3.x + ScrollTrigger (загружены в HTML).
   Lenis инициализируется в main-v2.js — мы лишь привязываем
   ScrollTrigger к смешанному скроллу, если Lenis есть.
   ============================================================ */

(() => {
  'use strict';

  // Гварды
  if (!document.body.classList.contains('case-page')) return;
  if (!window.gsap || !window.ScrollTrigger) {
    // Снимаем стартовые состояния — иначе контент останется невидимым
    document.querySelectorAll('.case-anim, .case-anim--banner, .case-anim--title')
      .forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    return;
  }
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // CSS перебивает старт-состояния

  gsap.registerPlugin(ScrollTrigger);

  const EASE = 'power2.out';

  gsap.set('.case-anim, .case-anim--banner, .case-anim--title', {
    force3D: true,
    willChange: 'transform, opacity',
  });

  const settle = (targets) => {
    gsap.set(targets, { willChange: 'auto' });
  };

  // ----- 1. ЗАГОЛОВОК страницы: появление при загрузке -----
  //   Без clearProps — иначе GSAP снимает inline opacity, и CSS-класс
  //   .case-anim--title { opacity: 0 } возвращает элемент в невидимое
  //   состояние, и заголовок пропадает после появления.
  const title = document.querySelector('.case-layout__title');
  if (title) {
    gsap.to(title, {
      opacity: 1,
      y: 0,
      duration: 0.78,
      delay: 0.05,
      ease: EASE,
      onComplete: () => settle(title),
    });
  }

  // ----- 2. БАННЕРЫ: появление при входе в viewport -----
  gsap.utils.toArray('.case-banner').forEach((banner) => {
    gsap.to(banner, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.78,
      ease: EASE,
      onComplete: () => settle(banner),
      scrollTrigger: {
        trigger: banner,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  });

  // ----- 3. СЕКЦИЯ Описание / Решение / Результат -----
  gsap.utils.toArray('.case-section').forEach((sec) => {
    const items = sec.querySelectorAll('.case-section__title, .case-section__text');
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.72,
      ease: EASE,
      stagger: 0.08,
      onComplete: () => settle(items),
      scrollTrigger: {
        trigger: sec,
        start: 'top 90%',
        toggleActions: 'play none none none',
      },
    });
  });

  // ----- 4. БЛОК «Было разработано» — заголовок + 3 карточки stagger -----
  gsap.utils.toArray('.case-components').forEach((block) => {
    const heading = block.querySelector('.case-components__title');
    const cards   = block.querySelectorAll('.case-component');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: block,
        start: 'top 82%',
        toggleActions: 'play none none none',
      },
      defaults: { ease: EASE },
    });

    if (heading) {
      tl.to(heading, { opacity: 1, y: 0, duration: 0.72, onComplete: () => settle(heading) });
    }
    if (cards.length) {
      tl.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.68,
        stagger: 0.08,
        onComplete: () => settle(cards),
      }, '-=0.55');
    }
  });

  // ScrollTrigger refresh после загрузки изображений
  // (иначе high-stats страница может скакать на первых кадрах)
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
