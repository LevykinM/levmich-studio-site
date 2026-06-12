// ============================================================
// Levmich Admin — authentication
//
// Как установить пароль:
//   1. Открой консоль браузера (F12)
//   2. Запусти:
//      crypto.subtle.digest('SHA-256', new TextEncoder().encode('твой_пароль'))
//        .then(h => console.log([...new Uint8Array(h)].map(b => b.toString(16).padStart(2,'0')).join('')))
//   3. Скопируй хэш и замени значение ADMIN_HASH ниже
// ============================================================

const ADMIN_COMMAND = '/admin';   // ожидаемая команда (будет своя у каждого сотрудника)
const ADMIN_HASH    = '01a248803c75b71c5ad0c13f6c9172b00ec1568844eaea36e9849bbabc013cd7';

const SESSION_KEY = 'lm_admin';
const SESSION_TTL = 8 * 60 * 60 * 1000;  // 8 часов

// ---- Helpers -----------------------------------------------

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function saveSession() {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    t: crypto.randomUUID(),
    exp: Date.now() + SESSION_TTL
  }));
}

function sessionValid() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY));
    return !!(s && s.t && s.exp > Date.now());
  } catch { return false; }
}

function endSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ---- Login page --------------------------------------------

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  if (sessionValid()) {
    location.replace('dashboard.html');
  }

  const cmdInput = document.getElementById('cmdInput');
  const pwdInput = document.getElementById('pwdInput');
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');

  cmdInput.focus();

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    [cmdInput, pwdInput].forEach(i => i.classList.remove('is-error'));

    const cmd = cmdInput.value.trim();
    const pwd = pwdInput.value;

    if (!cmd || !pwd) {
      fail('Введите команду и пароль', !cmd ? cmdInput : pwdInput);
      return;
    }

    if (ADMIN_HASH === '') {
      fail('Сначала установи пароль в admin.js', pwdInput);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Проверка…';

    const hash = await sha256(pwd);
    const cmdOk = cmd.toLowerCase() === ADMIN_COMMAND.toLowerCase();
    const pwdOk = hash === ADMIN_HASH;

    if (cmdOk && pwdOk) {
      saveSession();
      btn.textContent = 'Готово';
      setTimeout(() => location.replace('dashboard.html'), 200);
    } else {
      btn.disabled = false;
      btn.textContent = 'Войти';
      if (!cmdOk && !pwdOk) fail('Неверная команда и пароль', cmdInput);
      else if (!cmdOk)      fail('Неверная команда', cmdInput);
      else                  fail('Неверный пароль',  pwdInput);
    }
  });

  function fail(msg, focusEl) {
    errEl.textContent = msg;
    if (focusEl) {
      focusEl.classList.add('is-error');
      focusEl.focus();
      setTimeout(() => focusEl.classList.remove('is-error'), 600);
    }
  }
}

// ---- Logged-in pages (guard + logout) ----------------------

const authedPage = document.getElementById('dashboard')
  || document.getElementById('casesPage')
  || document.getElementById('editorPage');
if (authedPage) {
  if (!sessionValid()) {
    location.replace('index.html');
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      endSession();
      location.replace('/');
    });
  }
}

// ---- Dashboard hint ----------------------------------------

const dashboardEl = document.getElementById('dashboard');
if (dashboardEl) {
  const hint = document.getElementById('modeHint');
  const hintText = document.getElementById('hintText');
  const addCase = document.getElementById('modeAddCase');

  const showHint = (text) => {
    if (text) hintText.textContent = text;
    hint.classList.add('is-visible');
  };
  const hideHint = () => hint.classList.remove('is-visible');

  if (addCase) {
    addCase.addEventListener('mouseenter', () => showHint(hint.dataset.defaultText));
    addCase.addEventListener('mouseleave', hideHint);
    addCase.addEventListener('focus', () => showHint(hint.dataset.defaultText));
    addCase.addEventListener('blur', hideHint);
  }
}

// ---- Cases page --------------------------------------------

const casesPage = document.getElementById('casesPage');
if (casesPage) {
  const addBtn = document.getElementById('addCaseBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      location.href = 'edit-case.html?id=new';
    });
  }

  // cases-data.js loads after this script — render once it's ready
  window.addEventListener('DOMContentLoaded', renderCasesGrid);

  function renderCasesGrid() {
    if (!window.LMCases) return;
    const grid = document.getElementById('casesGrid');
    const add = document.getElementById('addCaseBtn');
    // remove any previously injected cards
    grid.querySelectorAll('.case-card--item').forEach((n) => n.remove());

    window.LMCases.getCases().forEach((c) => {
      const a = document.createElement('a');
      a.className = 'case-card case-card--item';
      a.href = 'edit-case.html?id=' + encodeURIComponent(c.id);

      if (c.cover) {
        const img = document.createElement('img');
        img.className = 'case-card__img';
        img.src = window.LMCases.assetUrl(c.cover, true);
        img.alt = '';
        a.appendChild(img);
      } else {
        a.classList.add('case-card--placeholder');
        const t = document.createElement('span');
        t.className = 'case-card__placeholder-title';
        t.textContent = c.title || 'Без названия';
        a.appendChild(t);
      }

      const edit = document.createElement('span');
      edit.className = 'case-card__edit';
      edit.textContent = 'Редактировать';
      a.appendChild(edit);

      grid.appendChild(a);
    });
  }
}
