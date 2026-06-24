// ============================================================
// Levmich Admin — case constructor (editor)
// ============================================================

(function () {
  const C = window.LMCases;
  if (!C) return;

  const params = new URLSearchParams(location.search);
  const rawId = params.get('id') || 'new';
  const CASES_HOME = './?view=cases';

  const state = {
    case: null,
    isNew: rawId === 'new',
    selected: null,   // index of selected block
  };

  // ---- elements --------------------------------------------------
  const $ = (id) => document.getElementById(id);
  const setupView  = $('setupView');
  const editorView = $('editorView');
  const cornerLabel = $('cornerLabel');

  // ===============================================================
  // INIT
  // ===============================================================
  if (state.isNew) {
    cornerLabel.textContent = 'Новый кейс';
    initSetup();
  } else {
    const c = C.getCase(rawId);
    if (!c) { location.replace(CASES_HOME); return; }
    state.case = C.clone(c);
    cornerLabel.textContent = 'Редактирование кейса';
    openEditor();
  }

  // ===============================================================
  // SETUP VIEW (new case)
  // ===============================================================
  function initSetup() {
    setupView.hidden = false;

    const nameEl = $('setupName');
    let cover = '';
    const cats = new Set();

    bindDrop($('setupDrop'), $('setupCoverInput'), $('setupCoverPreview'), $('setupDropHint'),
      (url) => { cover = url; });

    bindCatPills($('setupCats'), cats);

    $('setupContinue').addEventListener('click', () => {
      const title = nameEl.value.trim();
      if (!title) { toast('Введи название кейса'); nameEl.focus(); return; }
      const c = C.blankCase();
      c.title = title;
      c.cover = cover;
      c.categories = [...cats];
      state.case = c;
      setupView.hidden = true;
      cornerLabel.textContent = 'Создание кейса';
      openEditor();
    });
  }

  // ===============================================================
  // EDITOR VIEW
  // ===============================================================
  function openEditor() {
    editorView.hidden = false;
    $('editorTitle').textContent = state.case.title || 'Без названия';
    renderTags();
    renderBlocks();

    $('editorBack').addEventListener('click', () => {
      location.href = CASES_HOME;
    });

    // dock add buttons
    document.querySelectorAll('.dock-btn[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => addBlock(btn.dataset.add));
    });

    $('deleteSelected').addEventListener('click', deleteSelected);
    $('saveCase').addEventListener('click', save);

    $('editMetaBtn').addEventListener('click', openMeta);
  }

  function renderTags() {
    const wrap = $('editorTags');
    wrap.innerHTML = '';
    state.case.categories.forEach((key) => {
      const meta = C.CATEGORIES[key];
      if (!meta) return;
      const tag = document.createElement('span');
      tag.className = 'editor-tag ' + meta.cls;
      tag.appendChild(document.createTextNode(meta.label + ' '));
      if (meta.icon) {
        const img = document.createElement('img');
        img.src = '../' + meta.icon;
        img.alt = '';
        tag.appendChild(img);
      }
      wrap.appendChild(tag);
    });
  }

  // ---- block rendering -------------------------------------------
  function renderBlocks() {
    const stack = $('blocksStack');
    stack.innerHTML = '';
    const blocks = state.case.blocks;
    $('blocksEmpty').hidden = blocks.length > 0;

    blocks.forEach((block, i) => {
      stack.appendChild(renderBlock(block, i));
    });
  }

  function blockControls(i) {
    const ctr = document.createElement('div');
    ctr.className = 'block-ctrl';
    const up = ctrlBtn('▲', 'Вверх', () => moveBlock(i, -1));
    const down = ctrlBtn('▼', 'Вниз', () => moveBlock(i, 1));
    const del = ctrlBtn('✕', 'Удалить', () => { removeBlock(i); });
    if (i === 0) up.disabled = true;
    if (i === state.case.blocks.length - 1) down.disabled = true;
    ctr.append(up, down, del);
    return ctr;
  }
  function ctrlBtn(txt, label, fn) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'block-ctrl__btn';
    b.textContent = txt;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }

  function renderBlock(block, i) {
    const card = document.createElement('article');
    card.className = 'block block--' + block.type;
    if (state.selected === i) card.classList.add('is-selected');
    card.addEventListener('click', () => selectBlock(i));

    const toolbar = document.createElement('div');
    toolbar.className = 'block__toolbar';

    const badge = document.createElement('span');
    badge.className = 'block__badge';
    badge.innerHTML = blockIcon(block.type);

    toolbar.append(badge, blockControls(i));
    card.appendChild(toolbar);

    const body = document.createElement('div');
    body.className = 'block__body';

    if (block.type === 'text')   renderText(block, body);
    if (block.type === 'image')  renderImage(block, body);
    if (block.type === 'video')  renderVideo(block, body);
    if (block.type === 'result') renderResult(block, body);

    card.appendChild(body);
    return card;
  }

  function blockIcon(type) {
    if (type === 'text') return '<span class="block__t">T</span>';
    if (type === 'image') return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="9.5" r="1.6" fill="currentColor"/><path d="m4 17 5-4 4 3 3-2 4 3" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    if (type === 'video') return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><rect x="3" y="6" width="13" height="12" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M16 10.5 21 8v8l-5-2.5v-3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M12 3c1 2.5 2.2 3.7 4.7 4.7C14.2 8.7 13 9.9 12 12.4 11 9.9 9.8 8.7 7.3 7.7 9.8 6.7 11 5.5 12 3Z" fill="currentColor"/></svg>';
  }

  // ---- TEXT block -------------------------------------------------
  function renderText(block, body) {
    const head = textInput(block.heading || '', 'Заголовок', (v) => block.heading = v);
    head.classList.add('block__heading');
    const area = textArea(block.body || '', 'Основной текст', (v) => block.body = v);
    body.append(head, area);
  }

  // ---- IMAGE block ------------------------------------------------
  function renderImage(block, body) {
    block.images = block.images || [];
    const label = document.createElement('span');
    label.className = 'block__count';
    label.textContent = 'Изображений: ' + block.images.length;
    body.appendChild(label);

    const grid = document.createElement('div');
    grid.className = 'img-grid';

    block.images.forEach((src, idx) => {
      const cell = document.createElement('div');
      cell.className = 'img-cell';
      const img = document.createElement('img');
      img.src = C.assetUrl(src, true);
      img.alt = '';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'img-cell__rm';
      rm.textContent = '✕';
      rm.setAttribute('aria-label', 'Убрать изображение');
      rm.addEventListener('click', (e) => {
        e.stopPropagation();
        block.images.splice(idx, 1);
        renderBlocks();
      });
      cell.append(img, rm);
      grid.appendChild(cell);
    });

    // add cell
    const add = document.createElement('label');
    add.className = 'img-cell img-cell--add';
    add.innerHTML = '<span>+</span>';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.hidden = true;
    input.addEventListener('change', async (e) => {
      for (const f of e.target.files) {
        const url = await fileToDataURL(f);
        block.images.push(url);
      }
      renderBlocks();
    });
    add.appendChild(input);
    add.addEventListener('click', (e) => e.stopPropagation());
    grid.appendChild(add);

    body.appendChild(grid);
  }

  // ---- VIDEO block ------------------------------------------------
  function renderVideo(block, body) {
    const zone = document.createElement('label');
    zone.className = 'video-zone';

    if (block.src) {
      const v = document.createElement('video');
      v.src = C.assetUrl(block.src, true);
      v.controls = true;
      v.className = 'video-zone__preview';
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'video-zone__rm';
      rm.textContent = '✕';
      rm.addEventListener('click', (e) => { e.stopPropagation(); block.src = ''; renderBlocks(); });
      zone.append(v, rm);
    } else {
      zone.innerHTML = '<span class="video-zone__hint">＋ Загрузить видео</span>';
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      input.hidden = true;
      input.addEventListener('change', async (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 4 * 1024 * 1024) {
          toast('Видео больше 4 МБ не влезет в черновик. Лучше короткий клип.');
        }
        block.src = await fileToDataURL(f);
        renderBlocks();
      });
      zone.appendChild(input);
    }
    zone.addEventListener('click', (e) => { if (e.target.tagName === 'VIDEO') e.stopPropagation(); });
    body.appendChild(zone);
  }

  // ---- RESULT block -----------------------------------------------
  function renderResult(block, body) {
    block.items = block.items || [];
    const head = textInput(block.heading || 'Было разработано', 'Заголовок', (v) => block.heading = v);
    head.classList.add('block__heading');
    body.appendChild(head);

    const count = document.createElement('span');
    count.className = 'block__count';
    count.textContent = 'Пунктов: ' + block.items.length;
    body.appendChild(count);

    block.items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'result-item';

      const num = document.createElement('span');
      num.className = 'result-item__num';
      num.textContent = (idx + 1) + '.';

      const fields = document.createElement('div');
      fields.className = 'result-item__fields';
      const name = textInput(item.name || '', 'Заголовок', (v) => item.name = v);
      const desc = textArea(item.desc || '', 'Основной текст', (v) => item.desc = v);
      fields.append(name, desc);

      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'result-item__rm';
      rm.textContent = '✕';
      rm.addEventListener('click', (e) => { e.stopPropagation(); block.items.splice(idx, 1); renderBlocks(); });

      row.append(num, fields, rm);
      body.appendChild(row);
    });

    const addItem = document.createElement('button');
    addItem.type = 'button';
    addItem.className = 'result-add';
    addItem.textContent = '＋ Добавить пункт';
    addItem.addEventListener('click', (e) => {
      e.stopPropagation();
      block.items.push({ name: '', desc: '' });
      renderBlocks();
    });
    body.appendChild(addItem);
  }

  // ---- form helpers ----------------------------------------------
  function textInput(val, ph, onInput) {
    const el = document.createElement('input');
    el.type = 'text';
    el.className = 'block-input';
    el.value = val;
    el.placeholder = ph;
    el.addEventListener('input', () => onInput(el.value));
    el.addEventListener('click', (e) => e.stopPropagation());
    return el;
  }
  function textArea(val, ph, onInput) {
    const el = document.createElement('textarea');
    el.className = 'block-textarea';
    el.value = val;
    el.placeholder = ph;
    el.rows = 3;
    el.addEventListener('input', () => { onInput(el.value); autoGrow(el); });
    el.addEventListener('click', (e) => e.stopPropagation());
    requestAnimationFrame(() => autoGrow(el));
    return el;
  }
  function autoGrow(el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }

  // ---- block ops --------------------------------------------------
  function addBlock(type) {
    const block = newBlock(type);
    const at = state.selected != null ? state.selected + 1 : state.case.blocks.length;
    state.case.blocks.splice(at, 0, block);
    state.selected = at;
    renderBlocks();
    // scroll new block into view
    requestAnimationFrame(() => {
      const el = $('blocksStack').children[at];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function newBlock(type) {
    if (type === 'text') return { type: 'text', heading: '', body: '' };
    if (type === 'image') return { type: 'image', images: [] };
    if (type === 'video') return { type: 'video', src: '' };
    return { type: 'result', heading: 'Было разработано', items: [{ name: '', desc: '' }] };
  }
  function selectBlock(i) {
    state.selected = state.selected === i ? null : i;
    renderBlocks();
  }
  function removeBlock(i) {
    state.case.blocks.splice(i, 1);
    state.selected = null;
    renderBlocks();
  }
  function deleteSelected() {
    if (state.selected == null) { toast('Сначала выбери блок'); return; }
    removeBlock(state.selected);
  }
  function moveBlock(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= state.case.blocks.length) return;
    const arr = state.case.blocks;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    state.selected = j;
    renderBlocks();
  }

  // ===============================================================
  // META MODAL
  // ===============================================================
  function openMeta() {
    const modal = $('metaModal');
    modal.hidden = false;
    $('metaName').value = state.case.title;

    let cover = state.case.cover;
    const prev = $('metaCoverPreview');
    const hint = $('metaDropHint');
    if (cover) { prev.src = C.assetUrl(cover, true); prev.hidden = false; hint.hidden = true; }
    else { prev.hidden = true; hint.hidden = false; }

    bindDrop($('metaDrop'), $('metaCoverInput'), prev, hint, (url) => { cover = url; });

    const cats = new Set(state.case.categories);
    bindCatPills($('metaCats'), cats, true);

    $('metaCancel').onclick = () => { modal.hidden = true; };
    $('metaApply').onclick = () => {
      state.case.title = $('metaName').value.trim() || state.case.title;
      state.case.cover = cover;
      state.case.categories = [...cats];
      $('editorTitle').textContent = state.case.title;
      renderTags();
      modal.hidden = true;
    };
  }

  // ===============================================================
  // SAVE
  // ===============================================================
  function save() {
    if (!state.case.title) { toast('У кейса нет названия'); return; }
    try {
      C.saveCase(state.case);
      toast('Черновик сохранён локально. На сайт он не опубликован.');
      setTimeout(() => location.href = CASES_HOME, 1100);
    } catch (err) {
      if (err && err.name === 'QuotaExceededError') {
        toast('Не хватило места в черновике. Уменьши число/размер изображений.');
      } else {
        toast('Не удалось сохранить: ' + (err && err.message));
      }
    }
  }

  // ===============================================================
  // SHARED: dropzone + category pills + utils
  // ===============================================================
  function bindCatPills(wrap, set, reset) {
    wrap.querySelectorAll('.cat-pill').forEach((pill) => {
      const key = pill.dataset.cat;
      pill.classList.toggle('is-on', set.has(key));
      pill.onclick = () => {
        if (set.has(key)) { set.delete(key); pill.classList.remove('is-on'); }
        else { set.add(key); pill.classList.add('is-on'); }
      };
    });
  }

  function bindDrop(zone, input, preview, hint, onUrl) {
    const apply = (url) => {
      onUrl(url);
      preview.src = url;
      preview.hidden = false;
      hint.hidden = true;
    };
    zone.addEventListener('click', () => input.click());
    input.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (f) apply(await fileToDataURL(f));
    });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('is-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('is-over');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) apply(await fileToDataURL(f));
    });
    zone.addEventListener('paste', async (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) apply(await fileToDataURL(item.getAsFile()));
    });
  }

  function fileToDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.classList.remove('is-show'); setTimeout(() => t.hidden = true, 250); }, 2600);
  }
})();
