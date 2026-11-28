(() => {
  const calculator = document.querySelector('[data-estimate]');
  const fields = calculator.querySelector('[data-estimate-fields]');
  const summary = calculator.querySelector('[data-estimate-scope]');
  const note = calculator.querySelector('[data-estimate-note]');
  const output = calculator.querySelector('[data-estimate-price]');
  const order = calculator.querySelector('[data-estimate-order]');
  const orderUrl = new URL(order.href);
  const english = document.documentElement.lang === 'en';
  const local = (ru, en) => english ? en : ru;
  const number = new Intl.NumberFormat(english ? 'en' : 'ru');
  const range = ([min, max]) => `${number.format(min * 1000)} – ${number.format(max * 1000)} ₽`;
  const unknown = local('После короткого брифа', 'After a short brief');
  const none = [local('Не нужны', 'Not needed'), 0, 0];
  const custom = [local('Нужно уточнить', 'To be confirmed'), null, null];

  const standardFields = {
    branding: {
      base: [25, 35], note: local('Включены логотип, фирменный стиль и гайдлайн. Печать оплачивается отдельно.', 'Includes the logo, visual identity and guidelines. Printing is priced separately.'),
      options: [
        [local('Носители фирменного стиля', 'Brand materials'), [[local('Базовый стиль', 'Basic identity'), 0, 0], [local('Два носителя', 'Two materials'), 10, 16], [local('Четыре носителя', 'Four materials'), 20, 32], [local('Упаковка или сложные носители', 'Packaging or other complex materials'), null, null]]],
        [local('Шаблоны для соцсетей', 'Social templates'), [none, [local('Три шаблона', 'Three templates'), 7, 12]]],
      ],
    },
    app: {
      base: [41, 52], note: local('Включены сценарии, макеты в Figma, прототип и UI-кит. Разработка оценивается отдельно.', 'Includes user flows, Figma layouts, a prototype and a UI kit. Development is priced separately.'),
      options: [
        [local('Количество уникальных экранов', 'Number of distinct screens'), [[local('До 5 экранов', 'Up to 5 screens'), 0, 0], ...Array.from({ length: 15 }, (_, index) => [local(`${index + 6} экранов`, `${index + 6} screens`), (index + 1) * 5, (index + 1) * 7]), custom]],
        [local('UI-кит', 'UI kit'), [[local('Базовый', 'Basic'), 0, 0], [local('Расширенный с документацией', 'Extended with documentation'), 12, 20]]],
      ],
    },
    'vibe-site': {
      base: [5, 8], note: local('Включены адаптивная страница, форма и публикация. Домен и платные сервисы оплачиваются отдельно.', 'Includes a responsive page, inquiry form and launch. Domain and paid services are billed separately.'),
      options: [
        [local('Количество блоков', 'Number of sections'), [[local('До 4 блоков', 'Up to 4 sections'), 0, 0], [local('5–7 блоков', '5–7 sections'), 3, 5], [local('8–10 блоков', '8–10 sections'), 7, 11], custom]],
        [local('Куда будут приходить заявки?', 'Where should inquiries go?'), [[local('На email', 'Email'), 0, 0], [local('На email и в Telegram', 'Email and Telegram'), 2, 4], [local('В CRM или другую систему', 'CRM or another system'), null, null]]],
      ],
    },
    bot: {
      base: [10, 15], note: local('Включены меню, сбор заявки, уведомление и запуск. Хостинг и подписки оцениваются отдельно.', 'Includes a menu, inquiry collection, notifications and launch. Hosting and subscriptions are priced separately.'),
      options: [
        [local('Сколько сценариев нужно?', 'Number of flows'), [[local('Один сценарий', 'One flow'), 0, 0], [local('2–3 сценария', '2–3 flows'), 8, 13], [local('4–5 сценариев', '4–5 flows'), 16, 26], [local('Оплата, несколько платформ или 6+ сценариев', 'Payments, multiple platforms or 6+ flows'), null, null]]],
        [local('Куда сохранять заявки?', 'Where should inquiries be saved?'), [[local('Достаточно уведомлений', 'Notifications only'), 0, 0], [local('Также в Google Таблицы', 'Also in Google Sheets'), 4, 8], [local('Также в CRM', 'Also in a CRM'), 12, 22]]],
      ],
    },
  };

  const plural = new Intl.PluralRules('ru');
  function labelVolume(quantity, isLanding) {
    if (english) return `${quantity} ${isLanding ? (quantity === 1 ? 'section' : 'sections') : (quantity === 1 ? 'page' : 'pages')}`;
    const forms = isLanding ? ['блок', 'блока', 'блоков'] : ['страница', 'страницы', 'страниц'];
    const index = { one: 0, few: 1, many: 2 }[plural.select(quantity)] ?? 2;
    return `${quantity} ${forms[index]}`;
  }

  function fillResult(lines, price, message) {
    output.textContent = price;
    note.textContent = message;
    summary.replaceChildren(...lines.map(([label, value]) => {
      const group = document.createElement('div');
      const name = document.createElement('dt');
      const content = document.createElement('dd');
      name.textContent = label;
      content.textContent = value;
      group.append(name, content);
      return group;
    }));
    const url = new URL(orderUrl);
    const details = lines.map(([label, value]) => `${label} — ${value}`).concat(price);
    url.searchParams.set('estimate', details.join('\n'));
    order.href = url.href;
  }

  function websiteCalculator() {
    const landing = local('Лендинг', 'Landing page');
    const multipage = local('Многостраничный', 'Multi-page site');
    const typeLabel = local('Тип сайта', 'Website type');
    const volumeLabel = local('Какой объём страниц?', 'What is the project size?');
    fields.innerHTML = `<fieldset><legend>${local('Какой сайт проектируем?', 'What are we designing?')}</legend>
      <div class="estimate-options">
        <label><input type="radio" name="estimate-type" value="landing" checked><span>${landing}</span></label>
        <label><input type="radio" name="estimate-type" value="multipage"><span>${multipage}</span></label>
      </div></fieldset>
      <div><label for="estimate-volume">${volumeLabel}</label>
      <input class="estimate-field" type="number" id="estimate-volume" inputmode="numeric" min="1" step="1" value="8"></div>`;
    const volume = fields.querySelector('#estimate-volume');
    const quantities = { landing: '8', multipage: '3' };
    let type = 'landing';
    const description = local('В стоимость входят: прототип, дизайн в Figma и макеты для телефона и компьютера. Точную цену назову после короткого брифа.', 'Includes a prototype, Figma design and desktop and mobile layouts. I’ll confirm the price after a short brief.');

    function render() {
      const isLanding = type === 'landing';
      const quantity = volume.valueAsNumber;
      const positiveInteger = Number.isInteger(quantity) && quantity >= 1;
      const scopeLabel = isLanding ? local('Количество блоков', 'Number of sections') : local('Количество страниц', 'Number of pages');
      const scopeValue = positiveInteger ? labelVolume(quantity, isLanding) : local('Уточним в брифе', 'To be confirmed');
      let price = unknown;
      if (positiveInteger && isLanding && quantity <= 12) price = range(quantity <= 7 ? [23, 30] : [29, 40]);
      if (positiveInteger && !isLanding && quantity <= 8) price = range([23 + 8 * (quantity - 1), 30 + 11 * (quantity - 1)]);
      fillResult([[typeLabel, isLanding ? landing : multipage], [scopeLabel, scopeValue]], price, description);
    }

    fields.querySelector('fieldset').addEventListener('change', event => {
      quantities[type] = volume.value;
      type = event.target.value;
      volume.value = quantities[type];
      fields.querySelector('label[for="estimate-volume"]').textContent = type === 'landing' ? volumeLabel : local('Сколько уникальных страниц?', 'How many distinct pages?');
      render();
    });
    volume.addEventListener('input', render);
    render();
  }

  function standardCalculator(service) {
    const selects = service.options.map(([title, options]) => {
      const label = document.createElement('label');
      const select = document.createElement('select');
      label.textContent = title;
      select.className = 'estimate-field';
      select.replaceChildren(...options.map(([label], index) => new Option(label, index)));
      label.append(select);
      fields.append(label);
      return select;
    });

    function render() {
      const chosen = service.options.map(([label, options], index) => [label, options[selects[index].selectedIndex]]);
      const sums = chosen.reduce(([min, max], [, [, low, high]]) => [min + low, max + high], service.base);
      const needsBrief = chosen.some(([, [, low]]) => low === null);
      fillResult(chosen.map(([label, [value]]) => [label, value]), needsBrief ? unknown : range(sums), service.note);
    }

    fields.addEventListener('change', render);
    render();
  }

  if (calculator.dataset.estimate === 'website') websiteCalculator();
  else standardCalculator(standardFields[calculator.dataset.estimate]);
})();
