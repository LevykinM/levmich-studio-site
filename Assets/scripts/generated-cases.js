(() => {
  'use strict';

  const KIND_TAGS = {
    branding: [{ textRu: 'Брендинг', textEn: 'Branding', className: 'portfolio-tag--branding', icon: 'Assets/SVG_files/mage_stars-c.svg' }],
    site: [{ textRu: 'Сайт', textEn: 'Website', className: 'portfolio-tag--site', icon: 'Assets/SVG_files/dashicons_admin-site-alt3.svg' }],
    app: [{ textRu: 'Приложение', textEn: 'App', className: 'portfolio-tag--app', icon: 'Assets/SVG_files/Case.svg' }],
    'branding-site': [
      { textRu: 'Брендинг', textEn: 'Branding', className: 'portfolio-tag--branding', icon: 'Assets/SVG_files/mage_stars-c.svg' },
      { textRu: 'Сайт', textEn: 'Website', className: 'portfolio-tag--site', icon: 'Assets/SVG_files/dashicons_admin-site-alt3.svg' },
    ],
  };

  const getLang = () => {
    const path = window.location.pathname;
    if (path.startsWith('/en/')) return 'en';
    if (path.startsWith('/ru/')) return 'ru';
    return document.documentElement.lang === 'en' ? 'en' : 'ru';
  };

  const caseUrl = (slug, lang) => {
    if (lang === 'en') return `/en/cases/${slug}/`;
    if (lang === 'ru') return `/ru/cases/${slug}/`;
    return `/cases/${slug}/`;
  };

  const createTag = (tag, lang) => {
    const span = document.createElement('span');
    span.className = `portfolio-tag ${tag.className}`;
    span.append(document.createTextNode(lang === 'en' ? tag.textEn : tag.textRu));

    const icon = document.createElement('img');
    icon.src = tag.icon;
    icon.alt = '';
    span.append(icon);

    return span;
  };

  const assetUrl = (source) => {
    const value = String(source || '').trim();
    if (!value || /^(data:|https?:|\/)/i.test(value)) return value;
    return `/${value.replace(/^\.?\//, '')}`;
  };

  const caseTags = (item) => {
    const kinds = Array.isArray(item.kinds) && item.kinds.length ? item.kinds : [item.kind || 'site'];
    const seen = new Set();
    return kinds.flatMap((kind) => KIND_TAGS[kind] || KIND_TAGS.site).filter((tag) => {
      const key = tag.className;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const createCard = (item, lang) => {
    const slug = item.slug;
    const title = lang === 'en' ? (item.titleEn || item.titleRu || slug) : (item.titleRu || item.titleEn || slug);
    const href = caseUrl(slug, lang);
    const tags = caseTags(item);

    const card = document.createElement('article');
    card.className = 'portfolio-case reveal portfolio-case--generated';
    card.dataset.case = slug;

    const media = document.createElement('a');
    media.className = 'portfolio-case__media';
    media.href = href;
    media.setAttribute('aria-label', `${lang === 'en' ? 'Open case' : 'Открыть кейс'} ${title}`);

    const img = document.createElement('img');
    img.className = 'portfolio-case__img';
    img.src = assetUrl(item.cover);
    img.alt = title;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.append(img);

    const meta = document.createElement('div');
    meta.className = 'portfolio-case__meta';

    const copy = document.createElement('div');
    copy.className = 'portfolio-case__copy';

    const heading = document.createElement('h3');
    heading.className = 'portfolio-case__title';
    heading.textContent = title;

    const tagWrap = document.createElement('div');
    tagWrap.className = 'portfolio-case__tags';
    tags.forEach(tag => tagWrap.append(createTag(tag, lang)));
    copy.append(heading, tagWrap);

    const arrow = document.createElement('a');
    arrow.className = 'portfolio-case__arrow';
    arrow.href = href;
    arrow.setAttribute('aria-label', lang === 'en' ? 'Open case' : 'Открыть кейс');
    arrow.innerHTML = '<span aria-hidden="true">›</span>';

    const button = document.createElement('a');
    button.className = 'portfolio-case__button';
    button.href = href;
    button.textContent = lang === 'en' ? 'More' : 'Подробнее';

    meta.append(copy, arrow, button);
    card.append(media, meta);
    return card;
  };

  const updateCard = (card, item, lang) => {
    const slug = item.slug;
    const title = lang === 'en' ? (item.titleEn || item.titleRu || slug) : (item.titleRu || item.titleEn || slug);
    const href = caseUrl(slug, lang);
    const tags = caseTags(item);

    card.classList.add('portfolio-case--generated-override');

    const media = card.querySelector('.portfolio-case__media');
    const img = card.querySelector('.portfolio-case__img');
    const heading = card.querySelector('.portfolio-case__title');
    const tagWrap = card.querySelector('.portfolio-case__tags');
    const arrow = card.querySelector('.portfolio-case__arrow');
    const button = card.querySelector('.portfolio-case__button');

    if (media) {
      media.href = href;
      media.setAttribute('aria-label', `${lang === 'en' ? 'Open case' : 'Открыть кейс'} ${title}`);
    }
    if (img) {
      img.src = assetUrl(item.cover);
      img.alt = title;
    }
    if (heading) heading.textContent = title;
    if (tagWrap) {
      tagWrap.replaceChildren();
      tags.forEach(tag => tagWrap.append(createTag(tag, lang)));
    }
    if (arrow) {
      arrow.href = href;
      arrow.setAttribute('aria-label', lang === 'en' ? 'Open case' : 'Открыть кейс');
    }
    if (button) {
      button.href = href;
      button.textContent = lang === 'en' ? 'More' : 'Подробнее';
    }
  };

  const loadCases = async () => {
    const grid = document.querySelector('.portfolio__grid');
    if (!grid) return;

    try {
      const response = await fetch('/data/cases.generated.json', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data.cases) || !data.cases.length) return;

      const lang = getLang();
      const existing = new Map([...grid.querySelectorAll('.portfolio-case[data-case]')].map(card => [card.dataset.case, card]));
      const fragment = document.createDocumentFragment();
      data.cases
        .filter(item => item?.slug && item?.cover)
        .forEach((item) => {
          const card = existing.get(item.slug);
          if (card) {
            updateCard(card, item, lang);
            return;
          }
          fragment.append(createCard(item, lang));
        });
      grid.append(fragment);
    } catch {
      // Extra cases are optional; the static base site must keep working without them.
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCases, { once: true });
  } else {
    loadCases();
  }
})();
