// ============================================================
// Levmich Admin — cases data layer
//
// MVP storage: localStorage (черновик). Сохранённые кейсы видны
// только в этом браузере. Реальная публикация будет прикручена позже.
//
// Block model:
//   { type: 'text',   heading, body }
//   { type: 'image',  images: [src, ...] }
//   { type: 'video',  src }
//   { type: 'result', heading, items: [{ name, desc }, ...] }
//
// Case model:
//   { id, title, cover, categories: ['branding'|'site'|'app'], blocks: [] }
// ============================================================

(function (global) {
  const LS_KEY = 'lm_cases';        // overrides + новые кейсы
  const LS_DELETED = 'lm_cases_deleted';

  const CATEGORIES = {
    branding: { label: 'Брендинг', cls: 'cat--branding', icon: 'Assets/SVG_files/mage_stars-c.svg' },
    site:     { label: 'Сайт',     cls: 'cat--site',     icon: 'Assets/SVG_files/dashicons_admin-site-alt3.svg' },
    app:      { label: 'Приложение', cls: 'cat--app',    icon: '' },
  };

  // Пути к ассетам — относительно корня сайта. В админке (/admin/)
  // добавляем ../ при рендере; см. assetUrl().
  const A = 'Assets/';

  // ---- Встроенные (существующие) кейсы, разобранные на блоки --------
  const BUILTIN = [
    {
      id: 'front',
      title: 'Front',
      cover: A + 'Main_page/Property 1=Photo 1.webp',
      categories: ['branding', 'site'],
      blocks: [
        { type: 'image', images: [A + 'Case_front/Property 1=Rectangle 27.webp'] },
        { type: 'text', heading: 'Описание', body: 'Front — патентное бюро, которое помогает стартапам и молодым компаниям зарегистрировать торговую марку до выхода на рынок. Слоган уже был — «Protect your brand before launch», — но не было визуальной идентичности, которая бы внушала доверие. Нужен был бренд, который выглядит уверенно, современно и при этом не отпугивает молодых основателей строгостью классического юридического стиля.' },
        { type: 'image', images: [A + 'Case_front/Photo 3.webp', A + 'Case_front/Photo 2.webp'] },
        { type: 'text', heading: 'Решение', body: 'Логотип построен на символе — круг с внутренней каплей-щитом. Это двойная метафора: защита (shield) и торговая марка (trademark™). Фирменный малиново-розовый цвет выделяет бренд среди традиционно строгих юридических компаний и апеллирует к молодым основателям бизнеса. Минималистичный шрифт работает в любой среде — от презентаций до наружной рекламы.' },
        { type: 'image', images: [A + 'Case_front/Property 1=Rectangle 27.webp'] },
        { type: 'result', heading: 'Было разработано', items: [
          { name: 'Логотип', desc: 'Знак, шрифты и цвета и правила их правильного использования' },
          { name: 'Дизайн сайта', desc: 'Привлекательный лендинг с ценами, успешными кейсами и удобной формой заявки' },
          { name: 'Носители', desc: 'Предметы, отражающие его ценности и которые передают уникальность и дух компании' },
        ] },
        { type: 'text', heading: 'Результат', body: 'Front получил законченный визуальный язык, на основе которого можно масштабировать коммуникацию. Сайт стал основной точкой входа: посетитель за 30 секунд понимает, что бюро решает конкретную задачу — защитить бренд до запуска, — и оставляет заявку, не уходя в долгие переговоры.' },
      ],
    },
    {
      id: 'three',
      title: 'Три семёрки',
      cover: A + 'Main_page/Property 1=Photo 3.webp',
      categories: ['branding'],
      blocks: [
        { type: 'image', images: [A + 'Case_Tri_semerki/Photo 1.webp'] },
        { type: 'text', heading: 'Описание', body: 'Компания «Три семёрки» — региональный перевозчик, предоставляющий услуги доставки товаров, вывоза мусора и аренды строительной техники. На старте у клиента не было ни фирменного стиля, ни единой визуальной коммуникации. Требовалось создать запоминаемый бренд, который работал бы и в диджитал, и в офлайн-среде — на бортах транспорта, билбордах и рекламных материалах.' },
        { type: 'image', images: [A + 'Case_Tri_semerki/Photo 2.webp', A + 'Case_Tri_semerki/Photo 3.webp'] },
        { type: 'text', heading: 'Решение', body: 'Логотип основан на трёх стилизованных семёрках — отсылке к названию компании. Динамичные диагональные срезы символизируют скорость и движение. Оранжевый цвет придаёт энергии и надёжности, хорошо смотрится на любом фоне. Для наружной рекламы создан дружелюбный курьер-персонаж, который сближает бренд с клиентом. Дизайн борта грузовика использует контраст чёрного и оранжевого для максимальной заметности на дороге.' },
        { type: 'image', images: [A + 'Case_Tri_semerki/Photo 4.webp'] },
        { type: 'result', heading: 'Было разработано', items: [
          { name: 'Логотип', desc: 'Знак, фирменные цвета и правила их правильного использования' },
          { name: 'Персонаж', desc: 'Привлекательный герой, которого можно использовать в соцсетях' },
          { name: 'Носители', desc: 'Предметы, отражающие его ценности и которые передают уникальность и дух компании' },
        ] },
        { type: 'text', heading: 'Результат', body: 'Бренд получил единый визуальный язык: от логотипа до фирменной упаковки и борта транспорта. За первый месяц после ребрендинга узнаваемость компании в регионе выросла, а ремонтные грузовики и курьерская доставка стали восприниматься как единая профессиональная служба.' },
      ],
    },
    {
      id: 'wedding',
      title: 'Оксана и Костя',
      cover: A + 'Main_page/Property 1=Photo 2.webp',
      categories: ['site'],
      blocks: [
        { type: 'image', images: [A + 'Case_Wedding_site/Photo 1.webp'] },
        { type: 'text', heading: 'Описание', body: 'Паре нужен был сайт вместо бумажного приглашения, который расскажет их историю, сообщит дату и место, объяснит дресс-код и соберёт подтверждения. При этом сайт должен был отражать их спокойную и искреннюю эстетику без лишнего декора.' },
        { type: 'image', images: [A + 'Case_Wedding_site/Photo 2.webp', A + 'Case_Wedding_site/Photo 3.webp'] },
        { type: 'text', heading: 'Решение', body: 'В основе — строгая редакционная типографика и чёрно-белые фотографии пары. Никаких украшений и флористики в интерфейсе: весь «воздух» создаётся крупными шрифтами, ритмом блоков и самими снимками. Цветная фотография на обложке — единственный яркий акцент. Сайт решает все практические задачи гостя за один визит: узнать дату и место, построить маршрут, добавить событие в календарь, посмотреть дресс-код с референсами на Pinterest — и подтвердить присутствие прямо на странице.' },
        { type: 'image', images: [A + 'Case_Wedding_site/Photo 1.webp'] },
        { type: 'text', heading: 'Результат', body: 'Сайт заменил бумажные открытки, отдельный чат для гостей и переписку «расскажи ещё раз, как доехать». Все приглашённые получили один короткий адрес и нашли там ответы на все вопросы — а пара освободила недели работы перед свадьбой.' },
      ],
    },
  ];

  // ---- localStorage helpers ----------------------------------------
  function readStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch { return {}; }
  }
  function writeStore(obj) {
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  }
  function readDeleted() {
    try { return JSON.parse(localStorage.getItem(LS_DELETED)) || []; }
    catch { return []; }
  }
  function writeDeleted(arr) {
    localStorage.setItem(LS_DELETED, JSON.stringify(arr));
  }

  // ---- Public API --------------------------------------------------

  // Все кейсы: встроенные (с возможными правками) + новые из localStorage,
  // минус удалённые. Порядок: встроенные сперва, затем новые по дате.
  function getCases() {
    const store = readStore();
    const deleted = readDeleted();
    const out = [];

    BUILTIN.forEach((b) => {
      if (deleted.includes(b.id)) return;
      out.push(store[b.id] ? store[b.id] : clone(b));
    });

    Object.keys(store).forEach((id) => {
      if (BUILTIN.some((b) => b.id === id)) return;  // уже учли как override
      if (deleted.includes(id)) return;
      out.push(store[id]);
    });

    return out;
  }

  function getCase(id) {
    if (id === 'new') return null;
    const store = readStore();
    if (store[id]) return store[id];
    const b = BUILTIN.find((x) => x.id === id);
    return b ? clone(b) : null;
  }

  function saveCase(c) {
    const store = readStore();
    store[c.id] = c;
    writeStore(store);
    // если кейс был помечен удалённым — снимаем метку
    const deleted = readDeleted().filter((d) => d !== c.id);
    writeDeleted(deleted);
  }

  function deleteCase(id) {
    const store = readStore();
    delete store[id];
    writeStore(store);
    if (BUILTIN.some((b) => b.id === id)) {
      const deleted = readDeleted();
      if (!deleted.includes(id)) { deleted.push(id); writeDeleted(deleted); }
    }
  }

  function isBuiltin(id) { return BUILTIN.some((b) => b.id === id); }

  function newId() {
    // компактный slug на основе времени + случайности (Date.now недоступен в воркфлоу,
    // но в браузере — норм)
    return 'case-' + Math.random().toString(36).slice(2, 8);
  }

  function blankCase() {
    return { id: newId(), title: '', cover: '', categories: [], blocks: [] };
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Превратить путь ассета в URL, корректный для текущей страницы.
  // В админке (/admin/...) ассеты лежат на уровень выше → ../
  // dataURL и абсолютные/внешние ссылки не трогаем.
  function assetUrl(src, fromAdmin) {
    if (!src) return '';
    if (/^(data:|https?:|\/)/.test(src)) return src;
    return (fromAdmin ? '../' : '') + src;
  }

  global.LMCases = {
    CATEGORIES,
    getCases, getCase, saveCase, deleteCase,
    isBuiltin, blankCase, clone, assetUrl,
  };
})(window);
