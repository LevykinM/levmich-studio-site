(() => {
  'use strict';

  const AUTH_KEY = 'levmich-admin-token';
  const LEGACY_AUTH_KEY = 'levmich-admin-auth';
  const DEFAULT_COMMAND = '/admin';
  const DEFAULT_NAME = 'Михаил';
  const API_URL = String(window.LEVMICH_ADMIN_API_URL || '').replace(/\/+$/, '');

  const BASE_CASES = [
    {
      id: 'front',
      slug: 'front',
      title: 'Front',
      kind: 'Брендинг и сайт',
      image: '../public/figma-assets/admin-case-front.png',
      editUrl: '../cases/front/',
      sourceFiles: ['cases/front/index.html', 'ru/cases/front/index.html', 'en/cases/front/index.html'],
      readonly: true,
    },
    {
      id: 'three',
      slug: 'three',
      title: 'Три семёрки',
      kind: 'Грузоперевозки',
      image: '../public/figma-assets/admin-case-three.png',
      editUrl: '../cases/three/',
      sourceFiles: ['cases/three/index.html', 'ru/cases/three/index.html', 'en/cases/three/index.html'],
      readonly: true,
    },
    {
      id: 'wedding',
      slug: 'wedding',
      title: 'Оксана и Костя',
      kind: 'Свадебный сайт',
      image: '../public/figma-assets/admin-case-wedding.png',
      editUrl: '../cases/wedding/',
      sourceFiles: ['cases/wedding/index.html', 'ru/cases/wedding/index.html', 'en/cases/wedding/index.html'],
      readonly: true,
    },
  ];

  const icons = {
    trash: `
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M12.2 4.9h7.6l1.2 2.9h5.4v3H5.6v-3H11l1.2-2.9Z" fill="currentColor"/>
        <path d="M8.4 12.7h15.2l-1.1 14.4H9.5L8.4 12.7Zm4.3 2.8.5 8.8h2.5l-.3-8.8h-2.7Zm6 0-.3 8.8h2.5l.5-8.8h-2.7Z" fill="currentColor"/>
      </svg>
    `,
    edit: `
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M6.8 22.7v2.5h2.5l13.5-13.5-2.5-2.5L6.8 22.7Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
        <path d="m20.4 9.1 2.4-2.4a2 2 0 0 1 2.8 0l.7.7a2 2 0 0 1 0 2.8l-2.4 2.4" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `,
  };

  const loginView = document.querySelector('[data-admin-login-view]');
  const panelView = document.querySelector('[data-admin-panel]');
  const form = document.querySelector('[data-admin-form]');
  const commandInput = document.querySelector('[data-admin-command]');
  const passwordInput = document.querySelector('[data-admin-password]');
  const errorEl = document.querySelector('[data-admin-error]');
  const apiStatusEl = document.querySelector('[data-admin-api-status]');
  const logoutButton = document.querySelector('[data-admin-logout]');
  const nameEl = document.querySelector('[data-admin-name]');
  const casesEl = document.querySelector('[data-admin-cases]');
  const addCaseButton = document.querySelector('[data-admin-add-case]');
  const editor = document.querySelector('[data-admin-editor]');
  const editorClose = document.querySelector('[data-admin-editor-close]');
  const caseForm = document.querySelector('[data-admin-case-form]');
  const publishStatus = document.querySelector('[data-admin-publish-status]');
  const coverPreview = document.querySelector('[data-admin-cover-preview]');

  const state = {
    token: sessionStorage.getItem(AUTH_KEY) || '',
    cases: [...BASE_CASES],
    coverDataUrl: '',
  };

  const parseEnv = (text) => {
    const result = {};
    text.split(/\r?\n/).forEach((line) => {
      const clean = line.trim();
      if (!clean || clean.startsWith('#')) return;
      const index = clean.indexOf('=');
      if (index === -1) return;
      const key = clean.slice(0, index).trim();
      const value = clean.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
      result[key] = value;
    });
    return result;
  };

  const loadLocalConfig = async () => {
    const config = {
      command: window.LEVMICH_ADMIN_COMMAND || DEFAULT_COMMAND,
      password: window.LEVMICH_ADMIN_PASSWORD || '',
      name: window.LEVMICH_ADMIN_NAME || DEFAULT_NAME,
    };

    try {
      const response = await fetch('./.env', { cache: 'no-store' });
      if (!response.ok) return config;
      const env = parseEnv(await response.text());
      return {
        command: env.LEVMICH_ADMIN_COMMAND || config.command,
        password: env.LEVMICH_ADMIN_PASSWORD || config.password,
        name: env.LEVMICH_ADMIN_NAME || config.name,
      };
    } catch {
      return config;
    }
  };

  const localConfigPromise = loadLocalConfig();

  const setError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message || '';
  };

  const setPublishStatus = (message, mode = '') => {
    if (!publishStatus) return;
    publishStatus.textContent = message;
    publishStatus.classList.toggle('is-error', mode === 'error');
    publishStatus.classList.toggle('is-success', mode === 'success');
  };

  const updateApiStatus = () => {
    if (!apiStatusEl) return;
    if (API_URL) {
      apiStatusEl.textContent = 'API подключён. Публикация кейсов доступна.';
      apiStatusEl.className = 'admin-login__status is-ready';
      return;
    }

    apiStatusEl.textContent = 'API пока не подключён: вход работает локально, публикация выключена.';
    apiStatusEl.className = 'admin-login__status is-offline';
  };

  const apiFetch = async (path, options = {}) => {
    if (!API_URL) throw new Error('API endpoint не настроен в admin/config.js.');
    const url = new URL(API_URL);
    url.searchParams.set('route', path);

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (state.token) headers.Authorization = `Bearer ${state.token}`;

    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || `API error ${response.status}`);
    }
    return data;
  };

  const normalizeCase = (item) => {
    const slug = String(item.slug || item.id || '').trim();
    const title = item.titleRu || item.title || slug;
    return {
      id: slug,
      slug,
      title,
      kind: item.kindLabelRu || item.kind || 'Кейс',
      image: item.cover || item.image || '../Assets/Main_page/Property 1=Photo 1.webp',
      editUrl: `../cases/${slug}/`,
      sourceFiles: [`cases/${slug}/index.html`, `ru/cases/${slug}/index.html`, `en/cases/${slug}/index.html`],
      readonly: Boolean(item.readonly),
      generated: true,
    };
  };

  const loadGeneratedCases = async () => {
    try {
      const response = await fetch('../data/cases.generated.json', { cache: 'no-store' });
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data.cases) ? data.cases.map(normalizeCase) : [];
    } catch {
      return [];
    }
  };

  const refreshCases = async () => {
    const generated = await loadGeneratedCases();
    state.cases = [...BASE_CASES, ...generated.filter(item => !BASE_CASES.some(base => base.slug === item.slug))];
    renderCases();
  };

  const renderCases = () => {
    if (!casesEl) return;
    casesEl.textContent = '';

    const fragment = document.createDocumentFragment();
    state.cases.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'admin-case-card';
      card.style.setProperty('--admin-case-delay', `${index * 65}ms`);
      card.dataset.adminCase = item.slug;

      const image = document.createElement('img');
      image.className = 'admin-case-card__image';
      image.src = item.image;
      image.alt = `${item.title} — превью кейса`;
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.decoding = 'async';

      const meta = document.createElement('div');
      meta.className = 'admin-case-card__meta';

      const title = document.createElement('h2');
      title.className = 'admin-case-card__title';
      title.textContent = item.title;

      const path = document.createElement('p');
      path.className = 'admin-case-card__path';
      path.textContent = item.sourceFiles[0];

      meta.append(title, path);

      const actions = document.createElement('div');
      actions.className = 'admin-case-card__actions';

      const deleteButton = document.createElement('button');
      deleteButton.className = 'admin-case-action admin-case-action--delete';
      deleteButton.type = 'button';
      deleteButton.dataset.adminDeleteCase = item.slug;
      deleteButton.disabled = item.readonly || !API_URL;
      deleteButton.setAttribute('aria-label', `Удалить кейс ${item.title}`);
      deleteButton.innerHTML = icons.trash;

      const editLink = document.createElement('a');
      editLink.className = 'admin-case-action admin-case-action--edit';
      editLink.href = item.editUrl;
      editLink.setAttribute('aria-label', `Открыть кейс ${item.title}`);
      editLink.innerHTML = `<span>Редактировать</span>${icons.edit}`;

      actions.append(deleteButton, editLink);
      card.append(image, meta, actions);
      fragment.append(card);
    });

    casesEl.append(fragment);
  };

  const showPanel = async () => {
    const config = await localConfigPromise;
    if (nameEl) nameEl.textContent = config.name || DEFAULT_NAME;
    await refreshCases();
    if (loginView) loginView.hidden = true;
    if (panelView) panelView.hidden = false;
    setError('');
  };

  const showLogin = () => {
    if (panelView) panelView.hidden = true;
    if (loginView) loginView.hidden = false;
  };

  const openEditor = () => {
    if (!editor || !caseForm) return;
    caseForm.reset();
    state.coverDataUrl = '';
    coverPreview?.classList.remove('has-image');
    const oldImage = coverPreview?.querySelector('img');
    oldImage?.remove();
    setPublishStatus(
      API_URL
        ? 'Заполните поля и загрузите обложку. После публикации GitHub Pages обновится через пару минут.'
        : 'Сначала укажите URL serverless API в admin/config.js.',
      API_URL ? '' : 'error',
    );
    editor.hidden = false;
  };

  const closeEditor = () => {
    if (editor) editor.hidden = true;
  };

  const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'e')
    .replace(/[^a-z0-9а-я-]+/g, '-')
    .replace(/[а-я]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });

  updateApiStatus();

  if (state.token || sessionStorage.getItem(LEGACY_AUTH_KEY) === '1') {
    showPanel();
  } else {
    showLogin();
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');

    const command = (commandInput?.value || '').trim();
    const password = passwordInput?.value || '';

    try {
      if (API_URL) {
        const data = await apiFetch('/login', {
          method: 'POST',
          body: JSON.stringify({ command, password }),
        });
        state.token = data.token || '';
        if (!state.token) throw new Error('API не вернул токен входа.');
        sessionStorage.setItem(AUTH_KEY, state.token);
        await showPanel();
        return;
      }

      const config = await localConfigPromise;
      if (command !== (config.command || DEFAULT_COMMAND)) {
        setError('Команда не совпадает. Введите /admin.');
        commandInput?.focus();
        return;
      }

      if (!config.password) {
        setError('Пароль не настроен. Добавьте LEVMICH_ADMIN_PASSWORD в admin/.env.');
        passwordInput?.focus();
        return;
      }

      if (password !== config.password) {
        setError('Пароль не подошёл. Проверьте раскладку и попробуйте ещё раз.');
        passwordInput?.focus();
        return;
      }

      sessionStorage.setItem(LEGACY_AUTH_KEY, '1');
      await showPanel();
    } catch (error) {
      setError(error.message || 'Не удалось войти.');
    }
  });

  logoutButton?.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(LEGACY_AUTH_KEY);
    window.location.href = '../main/';
  });

  addCaseButton?.addEventListener('click', openEditor);
  editorClose?.addEventListener('click', closeEditor);

  editor?.addEventListener('click', (event) => {
    if (event.target === editor) closeEditor();
  });

  caseForm?.slug?.addEventListener('input', (event) => {
    event.target.value = slugify(event.target.value);
  });

  caseForm?.titleEn?.addEventListener('input', () => {
    if (!caseForm?.slug || caseForm.slug.value) return;
    caseForm.slug.value = slugify(caseForm.titleEn.value);
  });

  caseForm?.cover?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file || !coverPreview) return;
    state.coverDataUrl = await fileToDataUrl(file);
    coverPreview.classList.add('has-image');
    coverPreview.querySelector('img')?.remove();
    const img = document.createElement('img');
    img.src = state.coverDataUrl;
    img.alt = 'Предпросмотр обложки';
    coverPreview.append(img);
  });

  caseForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!API_URL) {
      setPublishStatus('API endpoint не настроен в admin/config.js. Без него сайт на GitHub Pages не сможет публиковать кейсы.', 'error');
      return;
    }

    const submit = caseForm.querySelector('.admin-editor__submit');
    submit.disabled = true;
    setPublishStatus('Публикую кейс в репозиторий...', '');

    try {
      const payload = {
        slug: caseForm.slug.value.trim(),
        kind: caseForm.kind.value,
        titleRu: caseForm.titleRu.value.trim(),
        titleEn: caseForm.titleEn.value.trim(),
        summaryRu: caseForm.summaryRu.value.trim(),
        summaryEn: caseForm.summaryEn.value.trim(),
        accent: caseForm.accent.value,
        coverDataUrl: state.coverDataUrl,
      };

      if (!payload.coverDataUrl) throw new Error('Загрузите обложку кейса.');

      const result = await apiFetch('/cases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setPublishStatus(`Готово. Коммит: ${result.commitSha || 'создан'}. GitHub Pages обновится через пару минут.`, 'success');
      await refreshCases();
      setTimeout(closeEditor, 900);
    } catch (error) {
      setPublishStatus(error.message || 'Не удалось опубликовать кейс.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  casesEl?.addEventListener('click', async (event) => {
    const deleteButton = event.target.closest('[data-admin-delete-case]');
    if (!deleteButton) return;
    event.preventDefault();

    const slug = deleteButton.dataset.adminDeleteCase;
    const item = state.cases.find(entry => entry.slug === slug);
    if (!item || item.readonly) {
      deleteButton.animate(
        [
          { transform: 'scale(1)' },
          { transform: 'scale(.94)' },
          { transform: 'scale(1)' },
        ],
        { duration: 240, easing: 'cubic-bezier(.22,.61,.36,1)' },
      );
      return;
    }

    try {
      deleteButton.disabled = true;
      await apiFetch(`/cases/${encodeURIComponent(slug)}`, { method: 'DELETE' });
      await refreshCases();
    } catch {
      deleteButton.disabled = false;
    }
  });
})();
