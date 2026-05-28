/* ============================================================
   Levmich Studio — клиентская логика.
   Подключения через CDN: GSAP, ScrollTrigger, Lenis.
   ============================================================ */

(() => {
  'use strict';

  // ------- Гварды и помощники --------------------------------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ============================================================
  // 1. SMOOTH SCROLL (Lenis)
  //    Тягучий скролл — даёт ощущение "дороже". Связываем
  //    с GSAP ticker, чтобы ScrollTrigger получал корректные
  //    значения скролла.
  // ============================================================
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.15,
      easing: t => 1 - Math.pow(1 - t, 3), // ease-out cubic
      smoothWheel: true,
      smoothTouch: false,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ============================================================
  // 2. REVEAL ON SCROLL
  //    Любой элемент с классом .reveal плавно появляется при
  //    входе в зону видимости.
  // ============================================================
  $$('.reveal').forEach(el => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleClass: { targets: el, className: 'is-in' },
        once: true,
      }
    });
  });

  // ============================================================
  // 3. CURSOR PARALLAX (5px по умолчанию)
  //    Любой элемент с data-parallax двигается за курсором.
  //    Сила в пикселях задаётся атрибутом, дефолт — 5.
  //    Используем requestAnimationFrame + GSAP quickTo для
  //    максимальной плавности и нулевой нагрузки.
  // ============================================================
  if (!reduceMotion) {
    const parallaxItems = $$('[data-parallax], .parallax').map(el => {
      const power = parseFloat(el.dataset.parallax) || 5;
      return {
        el,
        power,
        toX: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3.out' }),
        toY: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3.out' }),
      };
    });

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      // Нормализуем -1..1 относительно центра экрана
      mx = (e.clientX / window.innerWidth)  * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    gsap.ticker.add(() => {
      parallaxItems.forEach(({ toX, toY, power }) => {
        toX(mx * power);
        toY(my * power);
      });
    });
  }

  // ============================================================
  // 4. HERO ROTATION
  //    3 карточки в 3-х фиксированных слотах (Big, Small-top, Small-bot).
  //    Каждая карточка несёт свою инфо-плашку (видна только в slot Big).
  //    rotate(): big улетает влево (fade-out), пока летит — встаёт в slot
  //    Small-bot справа и проявляется. Small-top едет влево и увеличивается
  //    в Big. Small-bot едет вверх в Small-top.
  //    Клик по small-карточке → переход на её кейс.
  //    Hover на "Подробнее" — пауза.
  // ============================================================
  initHeroRotation();

  function initHeroRotation() {
    const track = $('#hero-track');
    if (!track) return;

    const cards = $$('.hero__card', track);
    if (cards.length < 3) return;

    // Координаты и размеры трёх слотов (по Figma 1:112)
    const SLOTS = [
      { x: 20,   y: 40,  w: 585, h: 781 }, // 0: Big (left)
      { x: 625,  y: 306, w: 386, h: 515 }, // 1: Small-top (right top)
      { x: 1031, y: 306, w: 386, h: 515 }, // 2: Small-bot (right bot)
    ];

    // order[slot] = индекс карточки в данном слоте
    let order = [0, 1, 2];
    let timer = null;
    let isPaused = false;
    let isAnimating = false;
    const INTERVAL = 5000;

    // ---- Установить карточку в слот (без анимации) ----
    const setSlot = (card, slotIdx) => {
      const s = SLOTS[slotIdx];
      gsap.set(card, { left: s.x, top: s.y, width: s.w, height: s.h, x: 0, opacity: 1 });
      card.classList.toggle('is-big', slotIdx === 0);
    };

    // ---- Появление инфо-плашки с пружинкой ----
    const showInfo = (card, delay = 0.3) => {
      const info = card.querySelector('.hero__info');
      if (!info) return;
      gsap.fromTo(info,
        { opacity: 0, y: 28, scale: .95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, delay, ease: 'back.out(1.6)' }
      );
    };

    // ---- Скрыть инфо-плашку ----
    const hideInfo = (card, dur = 0.25) => {
      const info = card.querySelector('.hero__info');
      if (!info) return;
      gsap.to(info, { opacity: 0, y: 28, scale: .95, duration: dur, ease: 'power2.in' });
    };

    // ---- Стартовое состояние ----
    cards.forEach((card, i) => setSlot(card, i));
    cards.slice(1).forEach(c => gsap.set(c.querySelector('.hero__info'), { opacity: 0, y: 28, scale: .95 }));
    showInfo(cards[order[0]]);

    // ---- Один цикл смены ----
    const rotate = () => {
      if (isPaused || isAnimating) return;
      isAnimating = true;

      const bigCard    = cards[order[0]];
      const smallTop   = cards[order[1]];   // станет big
      const smallBot   = cards[order[2]];   // станет small-top

      // 1. Скрываем info текущей big
      hideInfo(bigCard, 0.2);

      // 2. Big улетает влево с fade-out
      gsap.to(bigCard, {
        x: -700,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.in',
        onComplete() {
          // Перемещаем карточку в слот Small-bot (мгновенно, прозрачно)
          gsap.set(bigCard, {
            x: 0,
            left:   SLOTS[2].x,
            top:    SLOTS[2].y,
            width:  SLOTS[2].w,
            height: SLOTS[2].h,
            opacity: 0,
          });
          bigCard.classList.remove('is-big');
          // Появляется на новом месте справа
          gsap.to(bigCard, { opacity: 1, duration: 0.5, ease: 'power2.out' });
        }
      });

      // 3. Параллельно: Small-top → Big (едет влево + растёт)
      gsap.to(smallTop, {
        left: SLOTS[0].x, top: SLOTS[0].y,
        width: SLOTS[0].w, height: SLOTS[0].h,
        duration: 0.85,
        ease: 'power3.inOut',
        onStart() { smallTop.classList.add('is-big'); },
        onComplete() {
          showInfo(smallTop, 0.05);
          isAnimating = false;
        }
      });

      // 4. Small-bot → Small-top (едет вверх, размер тот же)
      gsap.to(smallBot, {
        left: SLOTS[1].x, top: SLOTS[1].y,
        duration: 0.85,
        ease: 'power3.inOut',
      });

      // Сдвигаем order: [a,b,c] → [b,c,a]
      order = [order[1], order[2], order[0]];
    };

    const start = () => { stop(); timer = setInterval(rotate, INTERVAL); };
    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };

    // Пауза при наведении на кнопку "Подробнее" в текущей big
    track.addEventListener('mouseenter', (e) => {
      if (e.target.closest && e.target.closest('.hero__info-btn')) {
        isPaused = true; stop();
      }
    }, true);
    track.addEventListener('mouseleave', (e) => {
      if (e.target.closest && e.target.closest('.hero__info-btn')) {
        isPaused = false; start();
      }
    }, true);

    // Клик по small-карточке → переход на её кейс
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Клик внутри инфо-плашки (текст, кнопка) — не считаем "переходом по карточке"
        if (e.target.closest('.hero__info')) return;
        // Big-карточка: клик не делает ничего (CTA — кнопка "Подробнее" внутри)
        if (card.classList.contains('is-big')) return;
        const href = card.dataset.href;
        if (href) window.location.href = href;
      });
    });

    start();
  }

  // ============================================================
  // 5. PROCESS — анимация рисующейся оранжевой линии
  //    SVG path рисуется через stroke-dashoffset → 0
  //    по мере скролла секции. На определённых "точках пути"
  //    (заранее заданные процент-маркеры) включаем .is-on у
  //    соответствующего шага.
  // ============================================================
  initProcess();

  function initProcess() {
    const wrap = $('#process-wrap');
    const path = $('#process-path');
    if (!wrap || !path) return;

    const steps = $$('.step', wrap);
    const total = path.getTotalLength();

    // Устанавливаем dash для эффекта "рисования"
    gsap.set(path, { strokeDasharray: total, strokeDashoffset: total });

    // Точки активации шагов — равномерно распределяем по длине пути.
    // Шаг 1 включаем сразу (он у самого старта). Дальше — по проценту.
    const triggers = steps.map((_, i) => i / (steps.length - 1));

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 75%',
      end:   'bottom 70%',
      scrub: 0.6,
      onUpdate(self) {
        const p = self.progress;            // 0..1
        // Линия рисуется
        gsap.set(path, { strokeDashoffset: total * (1 - p) });
        // Узлы загораются по достижении своих маркеров
        steps.forEach((step, i) => {
          if (p >= triggers[i] - 0.02) step.classList.add('is-on');
          else                          step.classList.remove('is-on');
        });
      }
    });
  }

  // ============================================================
  // 6. PORTFOLIO — нижние карточки растворяются под верхними
  //    Идея: пока следующая карточка приближается к верху вьюпорта,
  //    предыдущая прогрессивно блюрится и теряет прозрачность.
  // ============================================================
  initPortfolioStack();

  function initPortfolioStack() {
    const cases = $$('.portfolio .case');
    if (!cases.length) return;

    cases.forEach((card, i) => {
      // Последняя карточка не имеет "перекрывающей" — оставляем как есть.
      if (i === cases.length - 1) return;

      const next = cases[i + 1];
      ScrollTrigger.create({
        trigger: next,
        start: 'top 85%',
        end:   'top 35%',
        scrub: 0.4,
        onUpdate(self) {
          const p = self.progress;            // 0..1
          const blur = (p * 18).toFixed(2);   // 0..18px
          const op   = (1 - p * 0.95).toFixed(3);
          card.style.filter  = `blur(${blur}px)`;
          card.style.opacity = op;
        }
      });
    });
  }

  // ============================================================
  // 7. DOCK
  //    - Магнит-кнопка появляется когда пользователь доскроллил
  //      до Portfolio (data-state="expand")
  //    - Клик по бургеру открывает меню (data-state="open")
  //    - Клик мимо — закрывает
  //    - Когда меню открыто — включаем backdrop-overlay (блюр всего)
  // ============================================================
  initDock();

  function initDock() {
    const dock      = $('#dock');
    const menuBtn   = $('#dock-menu-btn');
    const langBtn   = $('#dock-lang-btn');
    const overlay   = $('#menu-overlay');
    if (!dock) return;

    // ---- Раскрытие магнит-кнопки при достижении Portfolio --
    const portfolio = $('#portfolio');
    if (portfolio) {
      ScrollTrigger.create({
        trigger: portfolio,
        start: 'top 60%',
        end:   'bottom top',
        onEnter()      { setState('expand'); },
        onEnterBack()  { setState('expand'); },
        onLeave()      { setState('rest'); },
        onLeaveBack()  { setState('rest'); },
      });
    }

    // ---- Открытие/закрытие меню --------------------------
    menuBtn?.addEventListener('click', () => {
      const isOpen = dock.dataset.state === 'open';
      if (isOpen) {
        // Если был open — возвращаем то состояние, которое было до открытия.
        // Считаем это просто: если portfolio в зоне — expand, иначе rest.
        const portRect = portfolio?.getBoundingClientRect();
        const inPort = portRect && portRect.top < window.innerHeight * 0.6 && portRect.bottom > 0;
        setState(inPort ? 'expand' : 'rest');
      } else {
        setState('open');
      }
    });

    // Закрытие по клику вне дока
    document.addEventListener('click', (e) => {
      if (dock.dataset.state !== 'open') return;
      if (!dock.contains(e.target)) {
        const portRect = portfolio?.getBoundingClientRect();
        const inPort = portRect && portRect.top < window.innerHeight * 0.6 && portRect.bottom > 0;
        setState(inPort ? 'expand' : 'rest');
      }
    });

    // Клик по любой ссылке внутри меню — мягко скроллим Lenis-ом.
    $$('a[href^="#"]', dock).forEach(a => {
      a.addEventListener('click', (e) => {
        const target = $(a.getAttribute('href'));
        if (target) {
          e.preventDefault();
          // Lenis ловит data-href? Используем явно:
          if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.2 });
          else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Если меню было открыто — закроем
        if (dock.dataset.state === 'open') {
          const portRect = portfolio?.getBoundingClientRect();
          const inPort = portRect && portRect.top < window.innerHeight * 0.6 && portRect.bottom > 0;
          setState(inPort ? 'expand' : 'rest');
        }
      });
    });

    // Ru-кнопка — заглушка, переключение языка пока не реализовано.
    langBtn?.addEventListener('click', () => {
      // TODO: i18n. Пока ничего не делаем — лежит на след. шаге.
    });

    function setState(s) {
      dock.dataset.state = s;
      menuBtn?.setAttribute('aria-expanded', String(s === 'open'));
      overlay?.classList.toggle('is-on', s === 'open');
    }
  }

  // ============================================================
  // 8. SMOOTH SCROLL для всех остальных якорных ссылок
  //    (не только в доке) — например, кнопки внутри hero-карточек.
  // ============================================================
  $$('a[href^="#"]').forEach(a => {
    if (a.closest('#dock')) return; // dock уже обработан
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.2 });
      else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

})();
