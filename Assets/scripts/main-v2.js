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
  const isPortrait = () => window.innerWidth < window.innerHeight;

  initLanguageSwitch();
  initTypographyPolish();
  initServicesNotice();
  initEdgeReflection();

  function initEdgeReflection() {
    if (reduceMotion || window.matchMedia('(pointer: coarse)').matches) return;

    const selector = [
      '.dock__pill',
      '.dock__menu',
      '.dock__menu-btn',
      '.dock__lang-btn',
      '.dock__magnet',
      '.dock__back',
      '.dock__behance-button',
      '.dock__info-progress',
      '.dock__menu-list a',
      '.dock__menu-socials a',
      '.footer__button',
      '.footer__nav-item',
      '.footer__info-card',
      '.footer__socials a',
      '.services__info',
      '.service__cta',
      '.info-side__list',
      '.info-complete',
      '.info-mobile-status',
    ].join(',');

    $$(selector).forEach(el => {
      let raf = 0;
      let px = 50;
      let py = 50;

      const setPoint = () => {
        raf = 0;
        el.style.setProperty('--edge-x', `${px.toFixed(2)}%`);
        el.style.setProperty('--edge-y', `${py.toFixed(2)}%`);
      };

      el.addEventListener('pointerenter', event => {
        el.classList.add('is-edge-hot');
        const rect = el.getBoundingClientRect();
        px = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
        py = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100;
        setPoint();
      }, { passive: true });

      el.addEventListener('pointermove', event => {
        const rect = el.getBoundingClientRect();
        px += (((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100 - px) * 0.42;
        py += (((event.clientY - rect.top) / Math.max(rect.height, 1)) * 100 - py) * 0.42;
        if (!raf) raf = requestAnimationFrame(setPoint);
      }, { passive: true });

      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-edge-hot');
      }, { passive: true });
    });
  }

  function initTypographyPolish() {
    const gluedWords = [
      'а', 'в', 'во', 'и', 'к', 'ко', 'о', 'об', 'обо', 'от', 'по',
      'с', 'со', 'у', 'за', 'из', 'изо', 'на', 'не', 'но', 'до',
      'для', 'без', 'над', 'под', 'при', 'про'
    ].join('|');
    const shortWord = new RegExp(`(^|[^А-Яа-яЁё])(${gluedWords})\\s+`, 'giu');
    const numberGlue = /(\d+)\s+(?=[А-Яа-яЁёA-Za-z₽%])/g;
    const skipSelector = 'script, style, svg, noscript, code, pre, textarea';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) nodes.push(walker.currentNode);

    nodes.forEach(node => {
      const parent = node.parentElement;
      if (!parent || parent.closest(skipSelector)) return;
      if (!/[А-Яа-яЁё0-9]/.test(node.nodeValue)) return;

      let text = node.nodeValue;
      for (let i = 0; i < 4; i += 1) {
        shortWord.lastIndex = 0;
        text = text.replace(shortWord, `$1$2\u00A0`);
      }
      text = text.replace(numberGlue, '$1\u00A0');
      node.nodeValue = text;
    });
  }

  function initServicesNotice() {
    // The redesigned Services section keeps its notification permanently
    // visible — no hover expansion, no class-driven animation. The old
    // open/close logic stays disabled so nothing toggles `is-notice-*`
    // and the panel never gets in the way of the static layout.
    const section = $('#services');
    if (section) {
      section.classList.remove('is-notice-active', 'is-notice-closing');
    }
  }

  function initLanguageSwitch() {
    const storageKey = 'levmich-lang';
    const url = new URL(window.location.href);
    const queryLang = url.searchParams.get('lang');
    let savedLang = null;
    try {
      savedLang = localStorage.getItem(storageKey);
    } catch (_) {
      savedLang = null;
    }
    let lang = queryLang === 'en' || queryLang === 'ru'
      ? queryLang
      : (savedLang === 'en' || savedLang === 'ru' ? savedLang : 'ru');

    const copy = {
      ru: {
        meta: {
          title: 'Levmich Studio — дизайн-студия Михаила Левыкина',
          description: 'Студия дизайна Михаила Левыкина: сайты, брендинг, дизайн приложений.',
        },
        hero: {
          slogan: 'Делаем красиво<br/>Некрасиво&nbsp;— не&nbsp;делаем',
          titles: ['Новый проект', 'Три семёрки', 'Оксана и Костя'],
          descs: [
            'Наша студия задизайнила логотип и сайт для крупного патентного бюро Front',
            'Бренд для регионального грузоперевозчика, который запомнят на дороге',
            'Сайт-приглашение, который взял на себя всю логистику свадьбы',
          ],
        },
        about: {
          title: 'Your <br/>GOAT',
          lede: 'Человек, который считается непревзойдённым в своей сфере.',
          name: 'Михаил',
          roles: ['Дизайнер', 'Фаундер'],
          body: [
            'Я делаю классные современные сайты, удобные интерфейсы и запоминающийся брендинг, объединяя стильный минимализм с продуманной структурой и ярким образом, чтобы дизайн вызывал доверие и эмоции.',
          ],
        },
        services: {
          title: 'Услуги',
          infoLabel: 'Инфо',
          notice: 'Нажимая кнопку «Начать бриф», вы даёте согласие с пользовательским соглашением и политикой конфиденциальности.',
          includedTitle: 'В услугу входят:',
          mobileIncludedTitle: 'В стоимость входят:',
          additionalTitle: 'Дополнительно:',
          names: ['Дизайн сайта', 'Брендинг', 'Дизайн приложений'],
          descs: [
            'Сайт, который не просто красиво выглядит, а приводит клиентов. Продумываю структуру, поведение пользователя — чтобы посетитель за 30 секунд понял, чем вы можете быть ему полезны, и оставил контакт.',
            'Не только логотип. Целостная визуальная система: знак, шрифт, цвета, паттерны — и применение во всех точках контакта. Чтобы бренд узнавался без подписи.',
            'Интерфейс, в котором пользователь не теряется. Проектирую путь от первого экрана до целевого действия так, чтобы каждый шаг был очевиден. Ваше приложение получает не просто красивые экраны, а продуманную логику взаимодействия.',
          ],
          prices: ['от 23.000 ₽', 'от 25.000 ₽', 'от 41.000 ₽'],
          details: [
            { included: ['Прототип', 'Адаптивы', 'Ui-Kit', 'Дизайн'], additional: ['ИИ изображение', 'Вёрстка'] },
            { included: ['Логотип', 'Фирменный стиль', 'Гайдлайн'], additional: ['Оформление соцсетей', 'Брендбук'] },
            { included: ['Пользовательский сценарий', 'Дизайн', 'Прототип', 'Ui-Kit'], additional: ['ИИ изображение'] },
          ],
          cta: 'Начать бриф',
        },
        portfolio: {
          title: 'Кейсы',
          names: ['Три Семёрки', 'Свадебный сайт', 'Front'],
          tags: ['Брендинг', 'Сайт', 'Брендинг', 'Сайт'],
          cursor: 'Подробнее',
        },
        nav: {
          title: 'Меню',
          items: ['Обо мне', 'Услуги', 'Кейсы'],
          media: 'Медиа',
          navigation: 'Навигация',
          slogan: 'Делаем красиво. Некрасиво — не делаем',
          magnet: 'К услугам',
          behancePrompt: 'Понравилась работа? поставь лайк на Behance',
          behanceLabel: 'Поставить лайк на Behance',
        },
        footer: {
          title: 'Не нашли ответ?',
          text: 'Оставьте заявку — ответим в течение одного рабочего дня.',
          button: 'Оставить заявку',
          infoTitle: 'Инфо',
          docs: ['Договор оферты', 'Политика конфиденциальности', 'Пользовательское соглашение'],
        },
        language: {
          label: 'Переключить язык на английский',
          current: 'Ru',
          target: 'En',
        },
        caseThree: {
          title: 'Три семёрки',
          sections: [
            ['Описание', 'Компания «Три семёрки» — региональный перевозчик, предоставляющий услуги доставки товаров, вывоза мусора и аренды строительной техники. На старте у клиента не было ни фирменного стиля, ни единой визуальной коммуникации. Требовалось создать запоминаемый бренд, который работал бы и в диджитал, и в офлайн-среде — на бортах транспорта, билбордах и рекламных материалах.'],
            ['Решение', 'Логотип основан на трёх стилизованных семёрках — отсылке к названию компании. Динамичные диагональные срезы символизируют скорость и движение. Оранжевый цвет придаёт энергии и надёжности, хорошо смотрится на любом фоне. Для наружной рекламы создан дружелюбный курьер-персонаж, который сближает бренд с клиентом. Дизайн борта грузовика использует контраст чёрного и оранжевого для максимальной заметности на дороге.'],
            ['Результат', 'Бренд получил единый визуальный язык: от логотипа до фирменной упаковки и борта транспорта. За первый месяц после ребрендинга узнаваемость компании в регионе выросла, а ремонтные грузовики и курьерская доставка стали восприниматься как единая профессиональная служба.'],
          ],
          components: {
            title: 'Было разработано',
            items: [
              ['Логотип', 'Знак из трёх семёрок, основной и инверсный варианты, гайды по охранному полю и допустимым фонам.'],
              ['Носители', 'Брендированные грузовики, спецодежда, документы, билборды и точки контакта в городской среде.'],
              ['Персонаж', '3D-курьер для рекламы, который очеловечивает бренд и используется на наружке, в соцсетях и презентациях.'],
            ],
          },
        },
        caseFront: {
          title: 'Front',
          sections: [
            ['Описание', 'Front — патентное бюро, которое помогает стартапам и молодым компаниям зарегистрировать торговую марку до выхода на рынок. Слоган уже был — «Protect your brand before launch», — но не было визуальной идентичности, которая бы внушала доверие. Нужен был бренд, который выглядит уверенно, современно и при этом не отпугивает молодых основателей строгостью классического юридического стиля.'],
            ['Решение', 'Логотип построен на символе — круг с внутренней каплей-щитом. Это двойная метафора: защита (shield) и торговая марка (trademark™). Фирменный малиново-розовый цвет выделяет бренд среди традиционно строгих юридических компаний и апеллирует к молодым основателям бизнеса. Минималистичный шрифт работает в любой среде — от презентаций до наружной рекламы.'],
            ['Результат', 'Front получил законченный визуальный язык, на основе которого можно масштабировать коммуникацию. Сайт стал основной точкой входа: посетитель за 30 секунд понимает, что бюро решает конкретную задачу — защитить бренд до запуска, — и оставляет заявку, не уходя в долгие переговоры.'],
          ],
          components: {
            title: 'Было разработано',
            items: [
              ['Логотип', 'Знак, шрифтовая часть, основная и инверсная версии, иконка приложения. Гайды по охранному полю.'],
              ['Дизайн сайта', 'Посадочная страница с оффером, описанием услуг, кейсами и понятным путём к консультации.'],
              ['Носители', 'Шаблоны для соцсетей, презентация для клиента, e-mail подпись и формат корпоративных документов.'],
            ],
          },
        },
        caseWedding: {
          title: 'Оксана и Костя',
          sections: [
            ['Описание', 'Паре нужен был сайт вместо бумажного приглашения, который расскажет их историю, сообщит дату и место, объяснит дресс-код и соберёт подтверждения. При этом сайт должен был отражать их спокойную и искреннюю эстетику без лишнего декора.'],
            ['Решение', 'В основе — строгая редакционная типографика и чёрно-белые фотографии пары. Никаких украшений и флористики в интерфейсе: весь «воздух» создаётся крупными шрифтами, ритмом блоков и самими снимками. Цветная фотография на обложке — единственный яркий акцент. Сайт решает все практические задачи гостя за один визит: узнать дату и место, построить маршрут, добавить событие в календарь, посмотреть дресс-код с референсами на Pinterest — и подтвердить присутствие прямо на странице.'],
            ['Результат', 'Сайт заменил бумажные открытки, отдельный чат для гостей и переписку «расскажи ещё раз, как доехать». Все приглашённые получили один короткий адрес и нашли там ответы на все вопросы — а пара освободила недели работы перед свадьбой.'],
          ],
        },
      },
      en: {
        meta: {
          title: 'Levmich Studio — design studio by Mikhail Levykin',
          description: 'Design studio by Mikhail Levykin: websites, branding and app interfaces.',
        },
        hero: {
          slogan: 'We make it beautiful<br/>Ugly&nbsp;— not&nbsp;our&nbsp;thing',
          titles: ['New project', 'Three Sevens', 'Oksana and Konstantin'],
          descs: [
            'We designed the logo and website for Front, a major patent bureau',
            'A brand for a regional freight company that people remember on the road',
            'A wedding website that took care of the whole event logistics',
          ],
        },
        about: {
          title: 'Your <br/>GOAT',
          lede: 'The person considered unmatched in their field.',
          name: 'Mikhail',
          roles: ['Designer', 'Founder'],
          body: [
            'I create cool modern websites, intuitive interfaces and memorable branding, combining stylish minimalism with a well-thought-out structure and a bold image, so the design evokes trust and emotion.',
          ],
        },
        services: {
          title: 'Services',
          infoLabel: 'Info',
          notice: 'By clicking the "Start brief" button you agree with the User Agreement and the Privacy Policy.',
          includedTitle: 'Included:',
          mobileIncludedTitle: 'Included:',
          additionalTitle: 'Additional:',
          names: ['Website design', 'Branding', 'App design'],
          descs: [
            'A website that does more than look good: it brings in clients. I think through structure, copy, navigation cues and user behavior so visitors understand your value in 30 seconds and leave a contact.',
            'Not just a logo. A complete visual system: mark, type, colors, patterns and their use across every touchpoint. So the brand is recognized without a caption.',
            'An interface where the user never gets lost. I design the path from the first screen to the target action so every step feels obvious. Your app gets not just beautiful screens, but thoughtful interaction logic.',
          ],
          prices: ['from $287.50', 'from $312.50', 'from $512.50'],
          details: [
            { included: ['Prototype', 'Responsive layouts', 'Ui-Kit', 'Design'], additional: ['AI image', 'Development'] },
            { included: ['Logo', 'Visual identity', 'Guideline'], additional: ['Social media design', 'Brandbook'] },
            { included: ['User flow', 'Design', 'Prototype', 'Ui-Kit'], additional: ['AI image'] },
          ],
          cta: 'Start brief',
        },
        portfolio: {
          title: 'Cases',
          names: ['Three Sevens', 'Wedding website', 'Front'],
          tags: ['Branding', 'Website', 'Branding', 'Website'],
          cursor: 'Details',
        },
        nav: {
          title: 'Menu',
          items: ['About me', 'Services', 'Cases'],
          media: 'Media',
          navigation: 'Navigation',
          slogan: 'We make it beautiful. Ugly — not our thing',
          magnet: 'To services',
          behancePrompt: 'Liked the work? leave a like on Behance',
          behanceLabel: 'Leave a like on Behance',
        },
        footer: {
          title: 'Did not find the answer?',
          text: 'Leave a request — we will reply within one business day.',
          button: 'Leave a request',
          infoTitle: 'Info',
          docs: ['Offer agreement', 'Privacy Policy', 'User Agreement'],
        },
        language: {
          label: 'Switch language to Russian',
          current: 'En',
          target: 'Ru',
        },
        caseThree: {
          title: 'Three Sevens',
          sections: [
            ['Brief', 'Three Sevens is a regional carrier offering goods delivery, waste removal and construction equipment rental. At the start, the client had no visual identity and no consistent communication. We needed to build a memorable brand that worked both in digital and offline environments — on truck sides, billboards and ad campaigns.'],
            ['Solution', 'The logo is based on three stylized sevens — a reference to the company name. Dynamic diagonal cuts symbolize speed and motion. Orange adds energy and reliability and reads well on any background. For outdoor campaigns we created a friendly courier character that brings the brand closer to the customer. The truck wrap uses black-and-orange contrast for maximum visibility on the road.'],
            ['Result', 'The brand got a unified visual language — from logo to corporate packaging and vehicle livery. Within the first month after rebranding, regional recognition went up and repair trucks and courier delivery started being perceived as one professional service.'],
          ],
          components: {
            title: 'What was made',
            items: [
              ['Logo', 'Three-sevens mark, main and inverse versions, guides for the protective field and acceptable backgrounds.'],
              ['Carriers', 'Branded trucks, workwear, documents, billboards and urban touchpoints.'],
              ['Mascot', '3D courier character for advertising — humanizes the brand and is used in outdoor, social media and presentations.'],
            ],
          },
        },
        caseFront: {
          title: 'Front',
          sections: [
            ['Brief', 'Front is a patent bureau that helps startups and young companies register a trademark before going to market. The slogan was there — “Protect your brand before launch” — but there was no visual identity that felt trustworthy. We needed a brand that looks confident and modern, without scaring young founders away with classic legal-firm strictness.'],
            ['Solution', 'The logo is built on a symbol — a circle with an inner droplet-shield. It is a double metaphor: protection (shield) and trademark (™). The magenta-pink stands the brand out among traditionally strict legal companies and appeals to young business founders. The minimal typeface works in any environment — from decks to outdoor.'],
            ['Result', 'Front got a finished visual language that scales communication. The website became the main entry point: a visitor understands in 30 seconds that the bureau solves a specific problem — protect the brand before launch — and submits a request without long discussions.'],
          ],
          components: {
            title: 'What was made',
            items: [
              ['Logo', 'Mark, wordmark, main and inverse versions, app icon. Guides for the protective field.'],
              ['Website design', 'Landing page with offer, services, cases and a clear path to a consultation.'],
              ['Carriers', 'Social media templates, client presentation, e-mail signature and corporate document format.'],
            ],
          },
        },
        caseWedding: {
          title: 'Oksana and Kostya',
          sections: [
            ['Brief', 'The couple needed a website instead of a paper invitation that would tell their story, share the date and venue, explain the dress code and collect RSVPs. The site had to reflect their calm and honest aesthetic without unnecessary decor.'],
            ['Solution', 'The foundation is strict editorial typography and black-and-white photos of the couple. No ornaments or floral patterns in the interface — all the “air” is created by large type, block rhythm and the photos themselves. The single color photo on the cover is the only bright accent. The site solves all practical tasks of a guest in one visit: find the date and venue, build a route, add the event to the calendar, see the dress code with Pinterest references — and confirm attendance right on the page.'],
            ['Result', 'The site replaced paper cards, a separate guest chat and endless “remind me again how to get there” messages. All invited guests received one short address and found answers to every question — and the couple freed up weeks of work before the wedding.'],
          ],
        },
      },
    };

    const setText = (selector, value) => {
      const el = $(selector);
      if (el && value !== undefined) el.textContent = value;
    };
    const setHtml = (selector, value) => {
      const el = $(selector);
      if (el && value !== undefined) el.innerHTML = value;
    };
    const setTexts = (selector, values) => {
      $$(selector).forEach((el, i) => {
        if (values[i] !== undefined) el.textContent = values[i];
      });
    };
    const setHtmls = (selector, values) => {
      $$(selector).forEach((el, i) => {
        if (values[i] !== undefined) el.innerHTML = values[i];
      });
    };
    const setLeadingTexts = (selector, values) => {
      $$(selector).forEach((el, i) => {
        if (values[i] === undefined) return;
        const node = Array.from(el.childNodes).find(child => child.nodeType === Node.TEXT_NODE && child.nodeValue.trim());
        if (node) node.nodeValue = `${values[i]} `;
        else el.insertBefore(document.createTextNode(`${values[i]} `), el.firstChild);
      });
    };

    const infoPageEn = {
      title: 'Info — Levmich Studio',
      description: 'Offer agreement, privacy policy and user agreement of Levmich Studio.',
      completeTitle: 'Thank you for reading the information!',
      completeText: 'Now you can return to services and choose exactly what you need.',
      completeButton: 'To services',
      docs: [
        {
          id: 'oferta',
          title: 'Offer Agreement',
          subtitle: 'Design services agreement for Levmich Studio<br/>Version 1.0. Effective from publication on the website.',
          sections: [
            ['1. General provisions', [
              'This document is a public offer under Article 437 of the Civil Code of the Russian Federation.',
              'Contractor: Mikhail Alekseevich Levykin, self-employed professional, Yekaterinburg.',
              'Client: an individual or legal entity who submits a request through the Telegram bot @Levmich_Studio_Bot and pays the prepayment.',
              'Acceptance of this offer is the Client’s prepayment for selected services using the payment details provided by the Contractor.',
            ]],
            ['2. Subject of the agreement', [
              'The Contractor provides design services selected in the Telegram bot, and the Client accepts and pays for them under this agreement.',
              'The scope is fixed in the final estimate generated by the bot.',
              'Base prices: website design from 23,000 RUB, branding from 28,000 RUB, app design from 33,000 RUB. The final price depends on scope, options, complexity and deadlines.',
            ]],
            ['3. Order and payment', [
              'The Client completes a brief in the Telegram bot and receives an individual estimate.',
              'Payment is made in two parts: 50% before work starts and 50% after final approval, before source files are transferred.',
              'Payments are made through the Russian Faster Payments System using the details provided by the Contractor. The Contractor issues self-employed receipts through the official My Tax service.',
            ]],
            ['4. Timeline and materials', [
              'The timeline is shown in the final estimate and is counted in business days from receipt of prepayment.',
              'If required materials or feedback are delayed for more than 3 business days, the timeline is extended accordingly.',
              'If the Client is unavailable for more than 14 calendar days, the Contractor may consider the order completed and does not refund the prepayment.',
            ]],
            ['5. Revisions and delivery', [
              'The order includes one design concept unless the estimate states otherwise.',
              'Revisions are paid separately or deducted from a reserved revision deposit if such a deposit is included in the estimate.',
              'After final payment, the Contractor transfers source materials according to the selected service: Figma files, exported layouts, brand book or other agreed files.',
            ]],
            ['6. Rights, support and portfolio', [
              'Exclusive rights to the final design transfer to the Client after full payment.',
              'The Contractor may show the work in the portfolio only with the Client’s written consent given in the Telegram bot or another messenger.',
              'For 7 calendar days after delivery, the Contractor answers questions and helps with minor technical clarifications.',
            ]],
            ['7. Refunds, liability and force majeure', [
              'The Client may refuse the agreement and pays for the work actually performed and costs already incurred.',
              'A full prepayment refund is possible only within 48 hours after payment if the Contractor has not started work. After final delivery and transfer of files, no refund is made.',
              'The Contractor’s liability is limited to the amount received under the order. The parties are not liable for non-performance caused by force majeure.',
            ]],
            ['8. Final provisions', [
              'The agreement is governed by Russian law. Disputes are resolved by negotiation, and if no agreement is reached, at the Contractor’s place of registration.',
              'Contacts: levmichstudio@gmail.com, Telegram @levmich_work, website levmich.studio.',
            ]],
          ],
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          subtitle: 'Personal data processing policy for levmich.studio<br/>Version 1.0. Effective from publication on the website.',
          sections: [
            ['1. General provisions', [
              'This policy explains how Levmich Studio processes personal data received through the website, Telegram bot and messengers.',
              'Operator: Mikhail Alekseevich Levykin, self-employed professional, Yekaterinburg.',
            ]],
            ['2. Data we process', [
              'Name or company name, contact details, project information, brief answers, payment and receipt data, messages sent through the bot or messengers, and technical website data such as cookies and IP address.',
            ]],
            ['3. Purposes and legal basis', [
              'Data is used to prepare estimates, communicate with clients, provide services, issue receipts, improve the website and comply with legal requirements.',
              'Processing is based on user consent, performance of a services agreement and legal obligations.',
            ]],
            ['4. Storage and transfer', [
              'Order data is stored for 3 years after service completion; receipt data is stored according to tax requirements; technical data is stored for no more than 12 months.',
              'Personal data is not sold. It may be transferred to tax authorities where required, to Telegram as the messaging platform, or to authorities when required by law.',
            ]],
            ['5. User rights', [
              'Users may request information about their data, ask to correct, block or delete it, withdraw consent and send complaints to the competent authority. Requests are sent to levmichstudio@gmail.com and reviewed within 30 calendar days.',
            ]],
            ['6. Cookies, analytics and changes', [
              'The website uses cookies for technical operation and user experience. Users may disable cookies in their browser, but some functions may work incorrectly.',
              'The Operator may update this policy. The current version is available on levmich.studio.',
            ]],
            ['7. Contacts', [
              'Email: levmichstudio@gmail.com. Telegram: @levmich_work. Website: levmich.studio.',
            ]],
          ],
        },
        {
          id: 'terms',
          title: 'User Agreement',
          subtitle: 'Agreement for using levmich.studio<br/>Version 1.0. Effective from publication on the website.',
          sections: [
            ['1. Terms', [
              'Website: levmich.studio and the related Telegram bot @Levmich_Studio_Bot.',
              'Administrator: Mikhail Alekseevich Levykin, self-employed professional, Yekaterinburg.',
              'User: any person visiting the website or using the related Telegram bot.',
              'Services: design services offered through the website and bot.',
            ]],
            ['2. Subject', [
              'This agreement sets the general rules for using the website and Telegram bot. Paid services are governed by the separate Offer Agreement, and personal data processing is governed by the Privacy Policy.',
            ]],
            ['3. Rules of use', [
              'The User agrees to use the website and bot in good faith: not to disrupt the services, upload malware, use automated mass scraping tools or distribute unlawful content.',
              'The User must provide accurate information in briefs and when entering into an agreement.',
            ]],
            ['4. Responsibility', [
              'The website and bot are provided as is. The Administrator makes reasonable efforts to keep them available but does not guarantee uninterrupted operation.',
              'The Administrator is not liable for temporary unavailability caused by hosting issues, Telegram failures or force majeure.',
            ]],
            ['5. Changes and law', [
              'The Administrator may update this agreement. Continued use of the website after publication of changes means acceptance of the new version.',
              'This agreement is governed by Russian law. Disputes are resolved at the Administrator’s place of registration.',
            ]],
            ['6. Contacts', [
              'Email: levmichstudio@gmail.com. Telegram: @levmich_work. Website: levmich.studio.',
            ]],
          ],
        },
      ],
    };

    const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char]));

    function renderInfoPageEn() {
      if (!document.body.classList.contains('info-page')) return;

      document.title = infoPageEn.title;
      $('meta[name="description"]')?.setAttribute('content', infoPageEn.description);

      const content = $('.info-content');
      if (content) {
        content.innerHTML = infoPageEn.docs.map(doc => `
          <section class="info-doc" id="doc-${doc.id}" data-doc-id="${doc.id}">
            <header class="info-doc__head">
              <h2 class="info-doc__title">${escapeHtml(doc.title)}</h2>
              <p class="info-doc__subtitle">${doc.subtitle}</p>
            </header>
            ${doc.sections.map(([title, items]) => `
              <section class="info-subsection">
                <h3 class="info-subsection__title">${escapeHtml(title)}</h3>
                <div class="info-subsection__body">
                  ${items.map((item, index) => `
                    <p class="info-p">
                      <span class="info-p__num">${String(index + 1).padStart(2, '0')}</span>
                      ${escapeHtml(item)}
                    </p>
                  `).join('')}
                </div>
              </section>
            `).join('')}
          </section>
        `).join('');
      }

      infoPageEn.docs.forEach(doc => {
        const sideItem = $(`.info-side__item[data-doc="${doc.id}"]`);
        sideItem?.setAttribute('href', `#doc-${doc.id}`);
        const label = sideItem?.querySelector('.info-side__label');
        if (label) label.textContent = doc.title;
      });

      setText('.info-mobile-status__label', infoPageEn.docs[0]?.title);
      setText('.info-complete__title', infoPageEn.completeTitle);
      setText('.info-complete__text', infoPageEn.completeText);
      setText('.info-complete__button', infoPageEn.completeButton);
    }

    function applyA11yLabels(d) {
      const labels = lang === 'ru'
        ? {
            roles: 'Роли',
            consent: 'Информация о согласии',
            openCase: 'Открыть кейс',
            footerNav: 'Навигация по сайту',
            home: 'На главную',
            info: 'Открыть информационную страницу',
            menu: 'Меню',
            language: 'Язык',
            documents: 'Документы',
            infoSections: 'Разделы информации',
            switchDoc: 'Переключить документ',
          }
        : {
            roles: 'Roles',
            consent: 'Consent information',
            openCase: 'Open case',
            footerNav: 'Site navigation',
            home: 'To homepage',
            info: 'Open information page',
            menu: 'Menu',
            language: 'Language',
            documents: 'Documents',
            infoSections: 'Information sections',
            switchDoc: 'Switch document',
          };

      const setLabel = (selector, value) => {
        $$(selector).forEach(el => el.setAttribute('aria-label', value));
      };

      setLabel('.about__roles', labels.roles);
      setLabel('.services__info', labels.consent);
      setLabel('.footer__nav', labels.footerNav);
      setLabel('.footer__logo-link, .dock__back', labels.home);
      setLabel('.footer__info-card', labels.info);
      setLabel('.dock__menu-btn', labels.menu);
      setLabel('.dock__lang-btn', labels.language);
      setLabel('.info-side', labels.documents);
      setLabel('.info-side__list', labels.infoSections);
      setLabel('.info-mobile-status, .dock__info-progress', labels.switchDoc);

      $$('.portfolio-case__media').forEach((el, i) => {
        const name = d.portfolio.names[i] || '';
        el.setAttribute('aria-label', name ? `${labels.openCase} ${name}` : labels.openCase);
      });
      $$('.portfolio-case__arrow').forEach(el => el.setAttribute('aria-label', labels.openCase));
    }

    function applyLanguage(nextLang) {
      lang = nextLang;
      const d = copy[lang];

      document.documentElement.lang = lang;
      document.body.dataset.lang = lang;
      document.title = d.meta.title;
      $('meta[name="description"]')?.setAttribute('content', d.meta.description);

      setHtml('.hero__slogan', d.hero.slogan);
      // Hero card plaques were removed — only the mobile hint pill remains.
      setText('#hero-pill .hero__pill-text', d.portfolio.cursor);
      $$('.hero__card-img').forEach((img, i) => {
        if (d.hero.titles[i]) img.setAttribute('alt', d.hero.titles[i].replace(/<[^>]*>/g, ' '));
      });

      setHtml('.about__title', d.about.title);
      setText('.about__lede', d.about.lede);
      setText('.about__name', d.about.name);
      setTexts('.about__roles .chip', d.about.roles);
      $$('.about__photos img').forEach(img => img.setAttribute('alt', lang === 'ru' ? 'Михаил Левыкин' : 'Mikhail Levykin'));
      const aboutBody = document.body.dataset.pageVersion === 'v3'
        ? {
            ru: ['Я делаю современные сайты, удобные интерфейсы и запоминающийся брендинг, объединяя стильный минимализм с продуманной структурой и ярким образом, чтобы дизайн вызывал доверие и эмоции.'],
            en: ['I create modern websites, intuitive interfaces and memorable branding, combining stylish minimalism with a well-thought-out structure and a bold image, so the design evokes trust and emotion.'],
          }[lang]
        : d.about.body;
      setHtmls('.about__bio > p', aboutBody);

      setText('.services__title', d.services.title);
      setText('.services__notice-label', d.services.infoLabel);
      $$('.services__notice-badge').forEach(el => el.setAttribute('aria-label', d.services.infoLabel));
      setText('.services__notice-text', d.services.notice);
      setTexts('.service__name', d.services.names);
      setTexts('.service__desc', d.services.descs);
      setTexts('.service__price', d.services.prices);
      $$('.service__note').forEach(el => { el.textContent = d.services.notice; });
      $$('.service__cta').forEach(el => { el.textContent = d.services.cta; });
      $$('.service__detail-title--included').forEach(el => { el.textContent = d.services.includedTitle; });
      $$('.service__detail-title--additional').forEach(el => { el.textContent = d.services.additionalTitle; });
      $$('.services--redesigned .service').forEach((service, i) => {
        const detail = d.services.details?.[i];
        if (!detail) return;
        const setScopedTexts = (selector, values) => {
          Array.from(service.querySelectorAll(selector)).forEach((el, j) => {
            if (values[j] !== undefined) el.textContent = values[j];
          });
        };
        setScopedTexts('.service__pills--included .service-pill', detail.included);
        setScopedTexts('.service__pills--additional .service-pill', detail.additional);
        setScopedTexts('.service-toggle__panel[data-toggle-panel="included"] .service-pill', detail.included);
        setScopedTexts('.service-toggle__panel[data-toggle-panel="additional"] .service-pill', detail.additional);
      });

      setText('.portfolio__title', d.portfolio.title);
      setTexts('.portfolio-case__title', d.portfolio.names);
      setLeadingTexts('.portfolio-tag', d.portfolio.tags);
      setTexts('.portfolio-case__button', d.portfolio.names.map(() => d.portfolio.cursor));
      setText('#case-cursor span', d.portfolio.cursor);
      $$('.portfolio-case__img').forEach((img, i) => {
        if (d.portfolio.names[i]) img.setAttribute('alt', d.portfolio.names[i]);
      });

      setText('.dock__menu-title', d.nav.title);
      setLeadingTexts('.dock__menu-list a', d.nav.items);
      setText('.dock__menu-slogan', d.nav.slogan);
      setText('.dock__magnet span', d.nav.magnet);
      setText('.dock__behance-text', d.nav.behancePrompt);
      $('.dock__behance-button')?.setAttribute('aria-label', d.nav.behanceLabel);
      setText('#dock-lang-btn .dock__lang-current', d.language.current);
      setText('#dock-lang-btn .dock__lang-target', d.language.target);
      $('#dock-lang-btn')?.setAttribute('aria-label', d.language.label);
      applyA11yLabels(d);

      setText('#footer-consult-title', d.footer.title);
      setText('.footer__text', d.footer.text);
      setText('.footer__button', d.footer.button);
      setText('.footer__nav .footer__heading', d.nav.navigation);
      setLeadingTexts('.footer__nav-item', d.nav.items);
      setText('#footer-media-title', d.nav.media);
      setTexts('.footer__docs a', d.footer.docs);
      setText('.footer__info-card-title', d.footer.infoTitle);
      setTexts('.footer__info-card-list span', d.footer.docs);
      $$('.footer__meta-disclaimer').forEach(el => {
        el.innerHTML = lang === 'ru'
          ? '*Компания Meta — признана в&nbsp;России террористической организацией'
          : '';
      });

      if (lang === 'en') renderInfoPageEn();

      // --- Перевод кейс-страниц ---
      // На body есть data-case-id="caseThree" / "caseFront" / "caseWedding".
      // По нему берём блок переводов из словаря и раскладываем в DOM.
      const caseId = document.body.dataset.caseId;
      const caseData = caseId && d[caseId];
      if (caseData) {
        setText('.case-layout__title', caseData.title);
        $$('.case-section').forEach((sec, i) => {
          const pair = caseData.sections && caseData.sections[i];
          if (!pair) return;
          const titleEl = sec.querySelector('.case-section__title');
          const textEl  = sec.querySelector('.case-section__text');
          if (titleEl && pair[0] !== undefined) titleEl.textContent = pair[0];
          if (textEl  && pair[1] !== undefined) textEl.textContent  = pair[1];
        });
        if (caseData.components) {
          setText('.case-components__title', caseData.components.title);
          $$('.case-component').forEach((comp, i) => {
            const pair = caseData.components.items[i];
            if (!pair) return;
            const nameEl = comp.querySelector('.case-component__name');
            const descEl = comp.querySelector('.case-component__desc');
            if (nameEl && pair[0] !== undefined) nameEl.textContent = pair[0];
            if (descEl && pair[1] !== undefined) descEl.textContent = pair[1];
          });
        }
        $$('.case-layout img').forEach((img, i) => img.setAttribute('alt', `${caseData.title} image ${i + 1}`));
        // Title тэга страницы под кейс
        document.title = caseData.title + ' — ' + (lang === 'ru' ? 'кейс Levmich Studio' : 'Levmich Studio case');
      }
    }

    applyLanguage(lang);

    $('#dock-lang-btn')?.addEventListener('click', () => {
      const nextLang = lang === 'ru' ? 'en' : 'ru';
      try {
        localStorage.setItem(storageKey, nextLang);
      } catch (_) {}
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('lang', nextLang);
      window.location.assign(nextUrl.toString());
    });
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ============================================================
  // 0. SMART ORIENTATION LAYOUT
  //    Не привязываемся к "планшет/ноутбук": только геометрия.
  //    Горизонталь получает десктопную композицию с единым scale,
  //    вертикаль — мобильную композицию с расширяемой рабочей шириной.
  // ============================================================
  function updateSmartLayoutVars() {
    const root = document.documentElement;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const portrait = isPortrait();

    if (portrait) {
      const content = Math.min(vw - 20, vw >= 700 ? 620 : 382);
      const portraitScale = Math.min(1.62, Math.max(1, content / Math.min(382, Math.max(300, vw - 20))));
      root.style.setProperty('--mobile-content', `${Math.max(300, content).toFixed(2)}px`);
      root.style.setProperty('--portrait-scale', portraitScale.toFixed(4));
      root.style.setProperty('--smart-scale', '1');
      root.style.setProperty('--smart-title-scale', '1');
      root.style.setProperty('--portfolio-scale', '1');
      return;
    }

    const safeW = Math.max(320, vw - 40);
    const safeH = Math.max(320, vh - 80);
    const smartScale = Math.min(1, Math.max(0.64, Math.min(safeW / 1400, safeH / 760)));
    const portfolioScale = Math.min(1, Math.max(0.68, Math.min(safeW / 1160, safeH / 720)));

    root.style.setProperty('--smart-scale', smartScale.toFixed(4));
    root.style.setProperty('--smart-title-scale', Math.min(1, Math.max(0.64, smartScale)).toFixed(4));
    root.style.setProperty('--portfolio-scale', portfolioScale.toFixed(4));
    root.style.setProperty('--portrait-scale', '1');
  }

  updateSmartLayoutVars();
  let smartResizeRaf = null;
  let smartLastWidth = window.innerWidth;
  let smartLastPortrait = isPortrait();
  window.addEventListener('resize', () => {
    const nextWidth = window.innerWidth;
    const nextPortrait = isPortrait();
    const widthChanged = Math.abs(nextWidth - smartLastWidth) > 2;
    const orientationChanged = nextPortrait !== smartLastPortrait;
    if (nextPortrait && !widthChanged && !orientationChanged) return;

    smartLastWidth = nextWidth;
    smartLastPortrait = nextPortrait;
    updateSmartLayoutVars();
    if (smartResizeRaf) cancelAnimationFrame(smartResizeRaf);
    smartResizeRaf = requestAnimationFrame(() => {
      smartResizeRaf = null;
      ScrollTrigger.refresh();
    });
  }, { passive: true });

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

  // iOS Safari mis-measures ScrollTrigger start/end positions before web
  // fonts + images settle and as the address bar collapses. Refresh once the
  // page and fonts are ready so every scroll-linked scene lines up there too.
  if (window.ScrollTrigger) {
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    }
  }

  // ============================================================
  // 2. REVEAL ON SCROLL
  //    Лёгкое появление без blur и без class-toggle в момент старта:
  //    так элементы не "подвисают" на слабых кадрах.
  // ============================================================
  const isV3Homepage = document.body.dataset.pageVersion === 'v3';
  const stackManagedRevealSelector = '.portfolio__title, .portfolio__grid .portfolio-case';
  const stackManagedRevealEls = isV3Homepage ? $$(stackManagedRevealSelector).filter(el => el.classList.contains('reveal')) : [];
  stackManagedRevealEls.forEach(el => {
    el.classList.add('is-in');
    el.style.opacity = '';
    el.style.visibility = '';
    el.style.transform = '';
    el.style.willChange = '';
  });

  const revealEls = $$('.reveal').filter(el => !(isV3Homepage && el.matches(stackManagedRevealSelector)));
  if (!window.gsap) {
    revealEls.forEach(el => el.classList.add('is-in'));
  } else {
    gsap.set(revealEls, {
      autoAlpha: 0,
      y: 22,
      force3D: true,
      willChange: 'transform, opacity',
    });

    const revealOne = (el) => {
      if (el.classList.contains('is-in')) return;
      let delay = 0;
      if (el.classList.contains('service')) {
        const siblings = [...el.parentElement.querySelectorAll('.service.reveal')];
        delay = Math.max(0, siblings.indexOf(el)) * 0.05;
      } else if (el.classList.contains('portfolio-case')) {
        const siblings = [...el.parentElement.querySelectorAll('.portfolio-case.reveal')];
        delay = Math.max(0, siblings.indexOf(el)) * 0.06;
      }
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        duration: 0.72,
        delay,
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => {
          el.classList.add('is-in');
          el.style.willChange = 'auto';
        },
      });
    };

    // Reveal via IntersectionObserver rather than ScrollTrigger. IO is rock
    // solid on iOS Safari — where ScrollTrigger combined with the dynamic
    // address-bar resize can mis-measure start positions — and it is no
    // longer hidden behind prefers-reduced-motion. iPhones commonly ship
    // with "Reduce Motion" enabled (often via Low Power Mode / accessibility),
    // which previously froze every reveal on the page; the studio wants the
    // signature reveal to play on every device.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            revealOne(entry.target);
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(revealOne);
    }
  }

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

    if (parallaxItems.length) {
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
  }

  // ============================================================
  // 3b. ABOUT PHOTOS CURSOR PARALLAX
  // ============================================================
  if (!reduceMotion && !window.matchMedia('(pointer: coarse)').matches) {
    const aboutPhotos = $('[data-about-parallax]');
    if (aboutPhotos) {
      const small = aboutPhotos.querySelector('.about__photo-small');
      const large = aboutPhotos.querySelector('.about__photo-large');
      if (small && large) {
        const aboutLandscape = window.matchMedia('(orientation: landscape)');
        const isV3 = document.body?.dataset.pageVersion === 'v3';
        const aboutHoverArea = isV3
          ? aboutPhotos.closest('.about') || aboutPhotos.closest('.about__inner') || aboutPhotos
          : aboutPhotos;
        let aboutInView = false;

        gsap.set([small, large], {
          transformPerspective: 900,
          transformOrigin: '50% 50%',
          force3D: true,
        });

        const sX = gsap.quickTo(small, 'x', { duration: 1.15, ease: 'power3.out' });
        const sY = gsap.quickTo(small, 'y', { duration: 1.15, ease: 'power3.out' });
        const sR = gsap.quickTo(small, 'rotation', { duration: 1.35, ease: 'power3.out' });
        const sRX = gsap.quickTo(small, 'rotationX', { duration: 1.35, ease: 'power3.out' });
        const sRY = gsap.quickTo(small, 'rotationY', { duration: 1.35, ease: 'power3.out' });
        const lX = gsap.quickTo(large, 'x', { duration: 1.05, ease: 'power3.out' });
        const lY = gsap.quickTo(large, 'y', { duration: 1.05, ease: 'power3.out' });
        const lR = gsap.quickTo(large, 'rotation', { duration: 1.25, ease: 'power3.out' });
        const lRX = gsap.quickTo(large, 'rotationX', { duration: 1.25, ease: 'power3.out' });
        const lRY = gsap.quickTo(large, 'rotationY', { duration: 1.25, ease: 'power3.out' });

        let amx = 0, amy = 0;
        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
        const resetAboutPhotos = () => {
          amx = 0; amy = 0;
          sX(0); sY(0); sR(0); sRX(0); sRY(0);
          lX(0); lY(0); lR(0); lRX(0); lRY(0);
        };

        ScrollTrigger.create({
          trigger: aboutHoverArea,
          start: 'top bottom',
          end: 'bottom top',
          onEnter: () => aboutInView = true,
          onLeave: () => { aboutInView = false; resetAboutPhotos(); },
          onEnterBack: () => aboutInView = true,
          onLeaveBack: () => { aboutInView = false; resetAboutPhotos(); },
        });

        aboutHoverArea.addEventListener('pointermove', (e) => {
          if (!aboutLandscape.matches) return;
          const rect = aboutHoverArea.getBoundingClientRect();
          const expandX = isV3 ? Math.max(140, rect.width * 0.18) : 0;
          const expandY = isV3 ? Math.max(110, rect.height * 0.18) : 0;
          const left = rect.left - expandX;
          const top = rect.top - expandY;
          const width = rect.width + expandX * 2;
          const height = rect.height + expandY * 2;
          amx = clamp(((e.clientX - left) / width) * 2 - 1, -1, 1);
          amy = clamp(((e.clientY - top) / height) * 2 - 1, -1, 1);
        }, { passive: true });

        aboutHoverArea.addEventListener('pointerleave', () => {
          resetAboutPhotos();
        }, { passive: true });
        if (aboutLandscape.addEventListener) aboutLandscape.addEventListener('change', resetAboutPhotos);

        gsap.ticker.add(() => {
          if (!aboutInView || !aboutLandscape.matches) return;
          sX(amx * 10);
          sY(amy * 7);
          sR(amx * -2.2);
          sRX(amy * -2);
          sRY(amx * 3);
          lX(amx * 16);
          lY(amy * 10);
          lR(amx * 2.8);
          lRX(amy * 2.4);
          lRY(amx * -3.4);
        });
      }
    }
  }

  // ============================================================
  // 4. CASE CURSOR
  //    Homepage-only "Подробнее" plaque for hero and portfolio cards.
  // ============================================================
  initCaseCursor();

  function initCaseCursor() {
    const cursor = $('#case-cursor');
    if (!cursor || reduceMotion || !window.gsap || window.matchMedia('(pointer: coarse)').matches) return;
    const landscape = window.matchMedia('(orientation: landscape)');

    const targets = $$('.hero__card, .portfolio-case');
    if (!targets.length) return;

    cursor.hidden = false;
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.32, ease: 'power3.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.32, ease: 'power3.out' });

    gsap.set(cursor, { x: -999, y: -999, autoAlpha: 0, scale: 0.96 });

    const move = (e) => {
      if (!landscape.matches) return;
      xTo(e.clientX + 12);
      yTo(e.clientY - 46);
    };

    const show = (e) => {
      if (!landscape.matches) return;
      move(e);
      gsap.to(cursor, { autoAlpha: 1, scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    };

    const hide = () => {
      gsap.to(cursor, { autoAlpha: 0, scale: 0.96, duration: 0.16, ease: 'power2.out', overwrite: 'auto' });
    };

    targets.forEach(target => {
      target.addEventListener('mouseenter', show);
      target.addEventListener('mousemove', move, { passive: true });
      target.addEventListener('mouseleave', hide);
    });

    window.addEventListener('blur', hide);
    if (landscape.addEventListener) landscape.addEventListener('change', hide);
  }

  // ============================================================
  // 5. HERO ROTATION (V2 — slide-then-grow + follower gap fix)
  //    SmallTop проезжает влево с малым размером (фаза A),
  //    затем вырастает до Big (фаза B).
  //    SmallBot СЛЕДУЕТ за правым краем SmallTop + 20px через
  //    gsap.ticker → зазор ровно 20px в любой момент анимации.
  //    Слоты вычисляются динамически от Figma-пропорций Hero.
  // ============================================================
  initHeroRotation();

  function initHeroRotation() {
    const heroEl = document.querySelector('.hero');
    const track  = $('#hero-track');
    if (!track || !heroEl) return;

    const cards = $$('.hero__card', track);
    if (cards.length < 3) return;

    // --- Динамические слоты по viewport ---
    // Hero всегда 100vh. Desktop держит Figma-пропорции карточек,
    // чтобы бренд сверху не конфликтовал с кейсами на широких экранах.
    function computeSlots() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = isPortrait();
      const mH = isMobile ? 10 : 20;
      const mV = isMobile ? 30 : 40;
      const gap = isMobile ? 10 : 20;
      const availW = vw - 2*mH;
      const availH = vh - 2*mV;

      if (isMobile) {
        const bigY = Math.round(mV + 227);
        const maxBigByWidth = vw >= 700 ? 620 : 340;
        const maxBigByHeight = Math.max(290, (vh - bigY - 40) * (340 / 500));
        const bigW = Math.min(maxBigByWidth, maxBigByHeight, Math.max(290, vw - 62));
        const bigH = Math.round(bigW * (500 / 340));
        const smallW = Math.round(bigW * (180 / 340));
        const smallH = Math.round(smallW * (250 / 180));
        const centerX = (vw - bigW) / 2;
        const smallY = bigY + bigH - smallH;
        const leftX = centerX - smallW - gap;
        const rightX = centerX + bigW + gap;

        return {
          slots: [
            { x: centerX, y: bigY, w: bigW, h: bigH },
            { x: rightX, y: smallY, w: smallW, h: smallH },
            { x: leftX,  y: smallY, w: smallW, h: smallH },
          ],
          heroH: Math.round(bigY + bigH + 40),
          mobile: true,
          gap,
          scale: 1,
        };
      }

      const figmaBigW = 585;
      const figmaBigH = 781;
      const figmaSmallW = 386;
      const figmaSmallH = 515;
      const figmaTotalW = figmaBigW + 2*figmaSmallW + 2*gap;
      const figmaFrameW = 1400;

      const scale = Math.min(1, availW / figmaTotalW, availH / figmaBigH);
      const bigW = figmaBigW * scale;
      const bigH = figmaBigH * scale;
      const smallW = figmaSmallW * scale;
      const smallH = figmaSmallH * scale;
      const frameW = figmaFrameW * scale;

      const startX = Math.max(mH, (vw - frameW) / 2);
      const bigY   = mV;
      const smallY = bigY + bigH - smallH;     // выровнены по нижнему краю big

      const stX = startX + bigW + gap;
      const sbX = stX + smallW + gap;

      return {
        slots: [
          { x: startX, y: bigY,   w: bigW,   h: bigH   },
          { x: stX,    y: smallY, w: smallW, h: smallH },
          { x: sbX,    y: smallY, w: smallW, h: smallH },
        ],
        heroH: vh,
        mobile: false,
        gap,
        scale,
      };
    }

    let { slots: SLOTS, heroH, mobile: IS_MOBILE, gap: SLOT_GAP, scale: HERO_SCALE } = computeSlots();

    // Mobile-only hint pill (single element, lives in the track). Pinned to
    // the centre-top of the big slot — it never travels with the cards.
    const heroPill = document.getElementById('hero-pill');

    // Применяем высоту hero и позицию brand
    const brand = heroEl.querySelector('.hero__brand');
    function applyLayout() {
      heroEl.style.height = heroH + 'px';
      heroEl.style.setProperty('--hero-scale', HERO_SCALE);
      if (brand) {
        // Brand span = от левого края slot-1 до правого края slot-2
        if (IS_MOBILE) {
          brand.style.left  = Math.max(10, (window.innerWidth - 284) / 2) + 'px';
          brand.style.top   = '40px';
          brand.style.width = '284px';
        } else {
          const brandW = SLOTS[2].x + SLOTS[2].w - SLOTS[1].x;
          brand.style.left  = SLOTS[1].x + 'px';
          brand.style.top   = SLOTS[0].y + 'px';
          brand.style.width = brandW + 'px';
        }
      }
      positionPill();
    }
    applyLayout();

    // ---- Вспомогательные функции --------------------------------
    // Fisher–Yates: на каждое открытие/перезагрузку — карточки
    // встают в случайном порядке (большая = слот 0).
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    let order = shuffle([0, 1, 2]);
    let timer = null;
    let isPaused = false;
    let isAnimating = false;
    let heroActive = true;
    const INTERVAL = 5000;

    const setSlot = (card, slotIdx) => {
      const s = SLOTS[slotIdx];
      gsap.set(card, { left: s.x, top: s.y, width: s.w, height: s.h, x: 0, opacity: 1 });
      card.classList.toggle('is-big', slotIdx === 0);
    };

    // ---- Mobile hint pill --------------------------------------
    // Single "Подробнее" pill pinned to the centre-top of the big slot. It
    // does NOT travel with the cards — it fades/slides in from above after the
    // big card has grown and dissolves before the next card shrinks. Desktop
    // keeps the hover cursor-follower, so the pill is display:none there and
    // these helpers are effectively no-ops.
    function positionPill() {
      if (!heroPill) return;
      if (!IS_MOBILE) { heroPill.style.display = 'none'; return; }
      heroPill.style.display = '';
      const big = SLOTS[0];
      heroPill.style.left = Math.round(big.x + big.w / 2) + 'px';
      heroPill.style.top  = Math.round(big.y + 16) + 'px';
    }

    // Enters from above (y:-14 → 0) so it visually drops in from the top.
    const showPill = (delay = 0.05) => {
      if (!heroPill || !IS_MOBILE || !window.gsap) return;
      positionPill();
      gsap.killTweensOf(heroPill);
      gsap.fromTo(heroPill,
        { xPercent: -50, y: -14, autoAlpha: 0, scale: 0.98 },
        { xPercent: -50, y: 0, autoAlpha: 1, scale: 1, duration: 0.5, delay, ease: 'back.out(1.6)' }
      );
    };

    // Quick dissolve back up — finishes well before the card has shrunk.
    const hidePill = (dur = 0.26) => {
      if (!heroPill || !window.gsap) return;
      gsap.killTweensOf(heroPill);
      gsap.to(heroPill, { xPercent: -50, y: -14, autoAlpha: 0, scale: 0.98, duration: dur, ease: 'power2.in' });
    };

    // Back-compat wrappers for the rotation call sites — the card argument is
    // ignored since the pill is a single shared element.
    const showInfo = (card, delay = 0.05) => showPill(delay);
    const hideInfo = (card, dur = 0.45) => hidePill(Math.min(dur, 0.3));

    // ---- Стартовое состояние ------------------------------------
    // Карточки расставлены в соответствии с РАНДОМНЫМ order: слот 0 = big.
    order.forEach((cardIdx, slotIdx) => setSlot(cards[cardIdx], slotIdx));
    // Pill starts hidden just above its slot; it's shown once the first big
    // card has landed (intro onComplete below).
    if (heroPill && window.gsap) {
      positionPill();
      gsap.set(heroPill, { xPercent: -50, y: -14, autoAlpha: 0, scale: 0.98 });
    }

    // === Intro-анимация: при загрузке все элементы Hero поднимаются
    //     из темноты (fade-in + slide-up). Логотип/слоган + 3 карточки. ===
    const brandEl = heroEl.querySelector('.hero__brand');
    // Intro plays regardless of prefers-reduced-motion — many iPhones report
    // reduce-motion and would otherwise get no hero entrance at all.
    if (window.gsap) {
      if (brandEl) {
        gsap.from(brandEl, {
          opacity: 0,
          y: 40,
          duration: 1.2,
          delay: 0.05,
          ease: 'power3.out',
        });
      }
      gsap.from(cards, {
        opacity: 0,
        y: 60,
        duration: 1.3,
        delay: 0.15,
        stagger: 0.12,
        ease: 'power3.out',
        onComplete: () => showInfo(cards[order[0]], 0),
      });
    } else {
      // Reduced motion / no GSAP — просто покажем info сразу
      showInfo(cards[order[0]]);
    }

    // ---- Resize: пересчитываем слоты и позиции ------------------
    window.addEventListener('resize', () => {
      const computed = computeSlots();
      SLOTS = computed.slots;
      heroH = computed.heroH;
      IS_MOBILE = computed.mobile;
      SLOT_GAP = computed.gap;
      HERO_SCALE = computed.scale;
      applyLayout();
      if (!isAnimating) {
        order.forEach((cardIdx, slotIdx) => setSlot(cards[cardIdx], slotIdx));
      }
    }, { passive: true });

    // ---- Один цикл смены ----------------------------------------
    const rotateMobile = () => {
      if (isPaused || isAnimating) return;
      isAnimating = true;

      const S = SLOTS;
      const centerCard = cards[order[0]];
      const rightCard  = cards[order[1]];
      const leftCard   = cards[order[2]];

      // Dissolve the hint pill first (quick, up & out) so it is gone before
      // the big card visibly shrinks — exactly the requested order.
      hidePill(0.22);
      rightCard.classList.add('is-big');
      centerCard.classList.remove('is-big');
      leftCard.classList.remove('is-big');

      const tl = gsap.timeline({
        onComplete() {
          showInfo(rightCard, 0.05);
          isAnimating = false;
        }
      });

      tl.to(leftCard, {
        left: S[2].x - S[2].w - SLOT_GAP,
        opacity: 0,
        duration: 0.42,
        ease: 'power2.in'
      }, 0);

      tl.to(centerCard, {
        left: S[2].x,
        top: S[2].y,
        width: S[2].w,
        height: S[2].h,
        duration: 0.72,
        ease: 'power3.inOut'
      }, 0.16);

      tl.to(rightCard, {
        left: S[0].x,
        top: S[0].y,
        width: S[0].w,
        height: S[0].h,
        duration: 0.78,
        ease: 'power3.inOut'
      }, 0.18);

      tl.set(leftCard, {
        left: S[1].x + S[1].w + SLOT_GAP,
        top: S[1].y,
        width: S[1].w,
        height: S[1].h,
        opacity: 0,
      }, 0.42);

      tl.to(leftCard, {
        left: S[1].x,
        opacity: 1,
        duration: 0.5,
        ease: 'power3.out'
      }, 0.48);

      order = [order[1], order[2], order[0]];
    };

    const rotate = () => {
      if (IS_MOBILE) {
        rotateMobile();
        return;
      }

      if (isPaused || isAnimating) return;
      isAnimating = true;

      const S        = SLOTS;                  // snapshot текущих слотов
      const bigCard  = cards[order[0]];
      const smallTop = cards[order[1]];        // → станет big
      const smallBot = cards[order[2]];        // → станет small-top

      // 1. Скрываем info текущей big — длительность согласована с уходом
      //    карточки (x:-700 + opacity:0 over 0.55s), чтобы плашка ехала
      //    вместе с изображением, а не пропадала на месте.
      hideInfo(bigCard, 0.5);

      // 2. Big улетает влево. На правом краю появится уже после фазы A,
      //    когда SmallBot успеет занять старый слот SmallTop без наслоения.
      const SLOT_DELTA = S[2].x - S[1].x;  // smallW + gap
      gsap.to(bigCard, {
        x: -700, opacity: 0, duration: 0.55, ease: 'power2.in',
        onComplete() {
          gsap.set(bigCard, {
            x: 0,
            left:   S[2].x + SLOT_DELTA,  // за правым краем экрана
            top:    S[2].y,
            width:  S[2].w,
            height: S[2].h,
            opacity: 0,
          });
          bigCard.classList.remove('is-big');
        }
      });

      // 3. SmallTop → Big:
      //    A: проходит свою ширину + gap, пока SmallBot встаёт ровно в её слот.
      //    B: только после этого растёт до big. Так карточки не залезают друг на друга.
      smallTop.classList.add('is-big');
      // Заранее ставим top для smallBot (он не меняется)
      gsap.set(smallBot, { top: S[1].y });

      const phaseAX = S[1].x - (S[1].w + SLOT_GAP);
      const updateFollower = () => {
        const stL = parseFloat(smallTop.style.left)  || S[1].x;
        const stW = parseFloat(smallTop.style.width) || S[1].w;
        smallBot.style.left = (stL + stW + SLOT_GAP) + 'px';
      };

      const tl = gsap.timeline({
        onComplete() {
          // Финальная посадка SmallBot в свой слот (на случай сабпиксельных ошибок)
          smallBot.style.left = S[1].x + 'px';
          smallBot.style.top  = S[1].y + 'px';
          smallBot.style.width  = S[1].w + 'px';
          smallBot.style.height = S[1].h + 'px';
          showInfo(smallTop, 0.05);
        }
      });
      tl.to(smallTop, { left: phaseAX, duration: 0.72, ease: 'power2.inOut', onUpdate: updateFollower }, 0);
      tl.set(smallBot, { left: S[1].x, top: S[1].y, width: S[1].w, height: S[1].h }, 0.72);
      tl.to(bigCard, { left: S[2].x, opacity: 1, duration: 0.75, ease: 'power3.inOut' }, 0.72);
      tl.to(smallTop, { left: S[0].x, top: S[0].y, width: S[0].w, height: S[0].h,
                        duration: 0.62, ease: 'power3.out' }, 0.78);

      // Разблокируем следующую анимацию после того как Big встал (t ≈ 1.45s)
      gsap.delayedCall(1.65, () => { isAnimating = false; });

      // Сдвигаем order: [a,b,c] → [b,c,a]
      order = [order[1], order[2], order[0]];
    };

    const start = () => {
      if (!heroActive) return;
      stop();
      timer = setInterval(rotate, INTERVAL);
    };
    const stop  = () => { if (timer) { clearInterval(timer); timer = null; } };

    // Пока человек рассматривает карточку, не перелистываем ее из-под курсора.
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => { isPaused = true; stop(); });
      card.addEventListener('mouseleave', () => { isPaused = false; start(); });
      card.addEventListener('click', (e) => {
        const href = card.dataset.href;
        if (href) window.location.href = href;
      });
    });

    if ('IntersectionObserver' in window) {
      heroActive = false;
      const heroObserver = new IntersectionObserver(entries => {
        heroActive = entries.some(entry => entry.isIntersecting && entry.intersectionRatio > 0.2);
        if (heroActive && !isPaused) start();
        else stop();
      }, { threshold: [0, 0.2, 0.5] });
      heroObserver.observe(heroEl);
    } else {
      start();
    }
  }

  // ============================================================
  // 5. PORTFOLIO — нижние карточки растворяются под верхними
  //    Идея: пока следующая карточка приближается к верху вьюпорта,
  //    предыдущая прогрессивно блюрится и теряет прозрачность.
  // ============================================================
  initMobilePanelStacks();

  function initMobilePanelStacks() {
    if (!window.matchMedia('(orientation: portrait)').matches) return;
    /* V3 homepage has its own stacked-scroll system — skip the older v2 one. */
    if (document.body.dataset.pageVersion === 'v3') return;

    const clamp01 = value => Math.min(1, Math.max(0, value));
    const snapPx = value => {
      const ratio = Math.max(1, window.devicePixelRatio || 1);
      return Math.round(value * ratio) / ratio;
    };
    const scrollY = () => window.scrollY || window.pageYOffset || 0;
    const docTop = (el, y = scrollY()) => el.getBoundingClientRect().top + y;
    const docBottom = (el, y = scrollY()) => el.getBoundingClientRect().bottom + y;

    const stacks = [
      {
        section: document.querySelector('#portfolio'),
        head: document.querySelector('.portfolio__title'),
        panels: ['three', 'front', 'wedding']
          .map(name => document.querySelector(`.portfolio-case[data-case="${name}"]`))
          .filter(Boolean),
        next: document.querySelector('#footer'),
      },
    ].filter(item => item.section && item.head && item.panels.length);

    if (!stacks.length) return;

    const measureStack = stack => {
      const { section, head, panels, next } = stack;
      const y = scrollY();
      const headStyles = getComputedStyle(head);
      const stickyTop = parseFloat(headStyles.top) || 40;
      const headBox = head.getBoundingClientRect();
      const panelMetrics = panels.map(panel => {
        const shift = parseFloat(panel.dataset.stackShift || '0') || 0;
        const rect = panel.getBoundingClientRect();
        return {
          top: rect.top + y - shift,
          height: rect.height,
        };
      });

      stack.metrics = {
        stickyTop,
        headHeight: headBox.height,
        stackTop: snapPx(stickyTop + headBox.height + 20),
        nextTop: next ? docTop(next, y) : docBottom(section, y),
        panels: panelMetrics,
        lastHeight: panelMetrics[panelMetrics.length - 1]?.height || 0,
      };
    };

    stacks.forEach(stack => measureStack(stack));

    const updateStack = stack => {
      const { head, panels, metrics } = stack;
      if (!metrics) return;

      const y = scrollY();
      const stackTop = metrics.stackTop;
      const nextTop = metrics.nextTop - y;
      const releaseStart = stackTop + metrics.lastHeight + 20;
      const headLeaveY = snapPx(Math.min(0, nextTop - releaseStart));
      const headTransform = headLeaveY < 0
        ? `translate3d(0, ${headLeaveY}px, 0)`
        : 'translate3d(0, 0, 0)';

      if (head.dataset.stackTransform !== headTransform) {
        head.dataset.stackTransform = headTransform;
        head.style.transform = headTransform;
      }

      const shifts = metrics.panels.map((panelMetric, i) => {
        const baseTop = panelMetric.top - y;
        const desired = Math.max(0, stackTop - baseTop);
        const shift = i === panels.length - 1 ? Math.max(0, desired + headLeaveY) : desired;
        return snapPx(shift);
      });

      metrics.panels.forEach((panelMetric, i) => {
        const panel = panels[i];
        const shift = shifts[i];
        panel.dataset.stackShift = String(shift);
      });

      metrics.panels.forEach((panelMetric, i) => {
        const panel = panels[i];
        if (i === panels.length - 1) {
          const transform = `translate3d(0, ${shifts[i]}px, 0)`;
          if (panel.dataset.stackTransform !== transform) {
            panel.dataset.stackTransform = transform;
            panel.style.transform = transform;
          }
          panel.style.opacity = '1';
          panel.style.filter = 'none';
          panel.style.pointerEvents = 'auto';
          return;
        }

        const nextMetric = metrics.panels[i + 1];
        const currentVisualTop = panelMetric.top - y + shifts[i];
        const nextVisualTop = nextMetric.top - y + shifts[i + 1];
        const fadeStart = currentVisualTop + panelMetric.height + 10;
        const fadeDistance = Math.max(1, fadeStart - stackTop);
        const p = clamp01((fadeStart - nextVisualTop) / fadeDistance);
        const scale = (1 - p * 0.05).toFixed(3);
        const opacity = (1 - p * 0.7).toFixed(3);
        const transform = `translate3d(0, ${shifts[i]}px, 0) scale(${scale})`;
        const pointerEvents = p > 0.12 ? 'none' : 'auto';

        if (panel.dataset.stackTransform !== transform) {
          panel.dataset.stackTransform = transform;
          panel.style.transform = transform;
        }
        if (panel.style.opacity !== opacity) panel.style.opacity = opacity;
        if (panel.style.filter !== 'none') panel.style.filter = 'none';
        if (panel.style.pointerEvents !== pointerEvents) panel.style.pointerEvents = pointerEvents;
      });
    };

    const update = () => {
      stacks.forEach(updateStack);
    };

    /*
      Mobile Safari can fire resize events while the browser chrome expands.
      The card positions themselves do not change on height-only resizes, so
      geometry is cached and refreshed only when width/orientation actually changes.
    */
    let measuredWidth = window.innerWidth;
    let measuredPortrait = isPortrait();
    const refreshMetrics = () => {
      stacks.forEach(stack => measureStack(stack));
      tick();
    };

    const onResize = () => {
      const nextWidth = window.innerWidth;
      const nextPortrait = isPortrait();
      const widthChanged = Math.abs(nextWidth - measuredWidth) > 2;
      const orientationChanged = nextPortrait !== measuredPortrait;
      if (!widthChanged && !orientationChanged) return;

      measuredWidth = nextWidth;
      measuredPortrait = nextPortrait;
      refreshMetrics();
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(refreshMetrics).catch(() => {});
    }
    window.addEventListener('load', refreshMetrics, { once: true });

    let stackRaf = 0;
    const tick = () => {
      if (stackRaf) return;
      stackRaf = requestAnimationFrame(() => {
        stackRaf = 0;
        update();
      });
    };
    if (lenis) lenis.on('scroll', tick);
    else window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', () => {
      measuredWidth = 0;
      requestAnimationFrame(refreshMetrics);
    }, { passive: true });
    tick();
  }

  function initMobileStackHeaders() {
    if (!window.matchMedia('(orientation: portrait)').matches) return;

    const setup = (sectionSelector, lastSelector, endTop) => {
      const section = document.querySelector(sectionSelector);
      const last = document.querySelector(lastSelector);
      if (!section || !last) return;

      ScrollTrigger.create({
        trigger: last,
        start: `top ${endTop}px`,
        end: 'bottom top',
        onEnter: () => section.classList.add('is-stack-final'),
        onLeaveBack: () => section.classList.remove('is-stack-final'),
      });
    };

    setup('#services', '.services .service:last-child', 200);
    setup('#portfolio', '.portfolio-case[data-case="wedding"]', 140);
  }

  function initPortfolioStack() {
    const cases = $$('.portfolio .case, .portfolio-case');
    if (!cases.length) return;
    if (!window.matchMedia('(max-width: 1024px)').matches) return;

    cases.forEach((card, i) => {
      if (i === cases.length - 1) return;

      // Подсказываем браузеру, что transform будет анимироваться → GPU layer
      card.style.willChange = 'transform, opacity';

      const next = cases[i + 1];
      ScrollTrigger.create({
        trigger: next,
        start: 'top 85%',
        end:   'top 35%',
        scrub: 0.4,
        onUpdate(self) {
          const p = self.progress;
          // Карточка чуть сжимается и тускнеет — намного дешевле для GPU чем blur
          const scale = (1 - p * 0.05).toFixed(3);   // 1.0 → 0.95
          const op    = (1 - p * 0.7).toFixed(3);    // 1.0 → 0.3
          card.style.transform = `scale(${scale})`;
          card.style.opacity = op;
        }
      });
    });
  }

  function initServicesStack() {
    const cards = $$('.services .service');
    if (!cards.length) return;
    if (!window.matchMedia('(max-width: 1024px)').matches) return;

    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;

      card.style.willChange = 'transform, opacity';

      const next = cards[i + 1];
      ScrollTrigger.create({
        trigger: next,
        start: 'top 85%',
        end:   'top 32%',
        scrub: 0.35,
        onUpdate(self) {
          const p = self.progress;
          const scale = (1 - p * 0.05).toFixed(3);
          const op    = (1 - p * 0.7).toFixed(3);
          card.style.transform = `scale(${scale})`;
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
  initCaseBehancePrompt();

  function initDock() {
    const dock      = $('#dock');
    const menuBtn   = $('#dock-menu-btn');
    const overlay   = $('#menu-overlay');
    if (!dock) return;

    // ---- Поведение dock-а по зонам скролла -----------------------
    //   До Services          → 'rest'   (компактная пилюля)
    //   После пролистывания Services → 'expand' (с магнитом "К услугам")
    //   На Footer          → 'hidden' (весь dock растворяется)
    // 'open' (меню развёрнуто) переопределяет всё — не трогаем.
    const services = $('#services');
    const footer   = $('#footer');

    function scrollState() {
      const vh = window.innerHeight;
      const servRect = services?.getBoundingClientRect();
      const footRect = footer?.getBoundingClientRect();

      // Footer уже вошёл в нижнюю часть экрана → скрываем dock
      const hideAt = document.body.classList.contains('info-page') ? 1.12 : 0.85;
      if (footRect && footRect.top < vh * hideAt) {
        return 'hidden';
      }
      // Services уже в основном пройден → появляется кнопка возврата к услугам
      if (servRect && servRect.bottom < vh * 0.55) {
        return 'expand';
      }
      return 'rest';
    }

    function reactToScroll() {
      if (dock.dataset.state === 'open') return;
      setState(scrollState());
    }
    if (lenis) lenis.on('scroll', reactToScroll);
    else window.addEventListener('scroll', reactToScroll, { passive: true });
    // Первичный вызов — на случай если страница открыта с ненулевым скроллом
    reactToScroll();

    // ---- Открытие/закрытие меню --------------------------
    menuBtn?.addEventListener('click', () => {
      const isOpen = dock.dataset.state === 'open';
      if (isOpen) {
        // Если был open — возвращаем то состояние, которое было до открытия.
        setState(scrollState());
      } else {
        setState('open');
      }
    });

    // Закрытие по клику вне дока
    document.addEventListener('click', (e) => {
      if (dock.dataset.state !== 'open') return;
      if (!dock.contains(e.target)) {
        setState(scrollState());
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
          setState(scrollState());
        }
      });
    });

    function setState(s) {
      dock.dataset.state = s;
      menuBtn?.setAttribute('aria-expanded', String(s === 'open'));
      $('#dock-menu')?.setAttribute('aria-hidden', String(s !== 'open'));
      document.body.classList.toggle('is-menu-open', s === 'open');
      overlay?.classList.toggle('is-on', s === 'open');
    }
  }

  function initCaseBehancePrompt() {
    if (!document.body.classList.contains('case-page')) return;

    const dock = $('#dock.dock--case');
    const pill = $('.dock__pill', dock);
    const menuButton = $('.dock__menu-btn', dock);
    const backButton = $('.dock__back', dock);
    const button = $('.dock__behance-button', dock);
    const langButton = $('.dock__lang-btn', dock);
    if (!dock || !pill || !menuButton || !backButton || !button || !langButton) return;

    const setBehanceTarget = () => {
      const pillStyle = window.getComputedStyle(pill);
      const gap = parseFloat(pillStyle.columnGap || pillStyle.gap) || 8;
      const padLeft = parseFloat(pillStyle.paddingLeft) || 0;
      const padRight = parseFloat(pillStyle.paddingRight) || 0;
      const pillWidth = pill.getBoundingClientRect().width;
      const buttonWidth = 105;
      const menuWidth = menuButton.getBoundingClientRect().width;
      const backWidth = backButton.getBoundingClientRect().width;
      const langWidth = langButton.getBoundingClientRect().width;
      const finalWidth = padLeft + menuWidth + gap + backWidth + gap + buttonWidth + gap + langWidth + padRight;
      const buttonCenterFromFinalLeft = padLeft + menuWidth + gap + backWidth + gap + (buttonWidth / 2);
      const buttonOffsetFromDockCenter = buttonCenterFromFinalLeft - (finalWidth / 2);

      pill.style.setProperty('--behance-start-x', `${pillWidth / 2}px`);
      pill.style.setProperty('--behance-collapse-x', `${(pillWidth / 2) + buttonOffsetFromDockCenter}px`);
      pill.style.setProperty('--behance-end-x', `${buttonCenterFromFinalLeft}px`);
      pill.style.setProperty('--behance-drop-y', `${(pill.getBoundingClientRect().height / 2) + 41}px`);
    };

    setBehanceTarget();
    window.addEventListener('resize', setBehanceTarget, { passive: true });

    if (reduceMotion) {
      dock.dataset.behance = 'ready';
      return;
    }

    let fired = false;
    const timers = [];

    const clearTimers = () => {
      while (timers.length) window.clearTimeout(timers.pop());
    };

    const start = () => {
      if (fired) return;
      fired = true;
      setBehanceTarget();
      dock.dataset.behance = 'tip';
      timers.push(window.setTimeout(() => {
        dock.dataset.behance = 'textless';
      }, 1480));
      timers.push(window.setTimeout(() => {
        dock.dataset.behance = 'pill';
      }, 1660));
      timers.push(window.setTimeout(() => {
        dock.dataset.behance = 'drop';
      }, 2350));
      timers.push(window.setTimeout(() => {
        dock.dataset.behance = 'ready';
      }, 3300));
      window.removeEventListener('scroll', check);
      if (lenis) lenis.off?.('scroll', check);
    };

    const check = () => {
      if (fired) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      if (window.scrollY / maxScroll >= 0.2) start();
    };

    if (lenis) lenis.on('scroll', check);
    else window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('pagehide', clearTimers, { once: true });
    check();
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
