/* ============================================================
   case-animations.js — анимации для кейс-страниц.
   Подключается ТОЛЬКО на страницах кейсов.
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
  const BOUNCE_EASE = 'back.out(1.45)';

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
    const isCompact = window.matchMedia('(max-width: 768px)').matches;
    const cardOrigins = isCompact
      ? [
          { x: -14, y: 46, rotate: -1.8 },
          { x: 14, y: -34, rotate: 1.4 },
          { x: -10, y: 40, rotate: -1.2 },
        ]
      : [
          { x: -18, y: 54, rotate: -2.2 },
          { x: 0, y: -64, rotate: 1.2 },
          { x: 18, y: 54, rotate: 2.2 },
        ];

    if (cards.length) {
      gsap.set(cards, {
        opacity: 0,
        x: (i) => cardOrigins[i % cardOrigins.length].x,
        y: (i) => cardOrigins[i % cardOrigins.length].y,
        rotate: (i) => cardOrigins[i % cardOrigins.length].rotate,
        scale: 0.92,
        transformOrigin: '50% 50%',
      });
    }

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
        x: 0,
        y: 0,
        rotate: 0,
        scale: 1,
        duration: 0.86,
        ease: BOUNCE_EASE,
        stagger: 0.07,
        onComplete: () => settle(cards),
      }, '-=0.55');
    }
  });

  // ScrollTrigger refresh после загрузки изображений
  // (иначе high-stats страница может скакать на первых кадрах)
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
