(() => {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const english = params.get('lang') === 'en';
  const form = document.querySelector('#brief-form');
  const contact = form.elements.contact;
  const details = form.elements.details;
  const contactError = document.querySelector('#contact-error');
  const contactHint = document.querySelector('#contact-hint');
  const status = form.querySelector('.brief__status');
  const submit = form.querySelector('[type="submit"]');
  const success = document.querySelector('.brief__success');
  const channels = form.elements.channel;
  const contactName = form.querySelector('[data-contact-name]');
  const detailsCount = form.querySelector('[data-details-count]');

  const messages = english ? {
    required: 'This field is required',
    invalid: 'Enter an email address, phone number or social media handle',
    sending: 'Sending…',
    failed: 'Could not send your brief. Your answers are still here. Please try again.',
    unavailable: 'Online submission is temporarily unavailable.',
  } : {
    required: 'Обязательное поле',
    invalid: 'Укажите Telegram, VK, email или телефон',
    sending: 'Отправляю…',
    failed: 'Не удалось отправить заявку. Введённые данные сохранились. Попробуйте ещё раз.',
    unavailable: 'Отправка заявки пока недоступна.',
  };

  if (english) {
    const copy = {
      title: 'Let’s make something\nworth sharing',
      intro: 'Share a few details about your project and I’ll get in touch personally to discuss it.',
      serviceLabel: '1. What are we making?',
      branding: 'Branding', app: 'App', website: 'Website', other: 'Something else',
      'vibe-site': 'Vibe Website', bot: 'Bot',
      contactLabel: '2. How can I reach you?', phone: 'Phone', vk: 'VK',
      contactHint: 'Only used to contact you about the project',
      detailsLabel: '3. Tell me about your project',
      detailsPrompt: 'For example, I need a website for a coffee shop. I already have a logo or photos…',
      optional: 'Optional', send: 'Send brief',
      successTitle: 'Awesome! Your brief has been sent',
      successCopy: 'Thanks for reaching out to Levmich Studio. I’ll review your brief and get in touch using the contact details you provided.',
      successNext: 'We’ll discuss your project, clarify the details and decide where to start.',
      back: 'Back to the homepage', consult: 'Have a question?',
      consultCopy: 'Tell me a little about your project and I’ll get in touch.', consultButton: 'Fill out the brief',
      navigation: 'Navigation', about: 'About me', services: 'Services', process: 'How I work', cases: 'Cases', media: 'Socials',
      disclaimer: '*Meta is designated a terrorist organization in Russia', info: 'Info',
      terms: 'Public offer', privacy: 'Privacy policy', agreement: 'User agreement',
    };
    document.documentElement.lang = 'en';
    document.title = 'Project brief | Levmich Studio';
    document.querySelectorAll('[data-copy]').forEach(node => {
      const translation = copy[node.dataset.copy];
      if (translation) node.textContent = translation;
    });
    form.querySelectorAll('[data-placeholder]').forEach(node => {
      node.placeholder = copy[node.dataset.placeholder];
    });
    document.querySelectorAll('[data-home]').forEach(link => { link.pathname = '/en/main/'; });
    document.querySelectorAll('[data-info]').forEach(link => { link.pathname = '/en/info/'; });
    document.querySelector('.footer__nav').setAttribute('aria-label', 'Site navigation');
    document.querySelector('.footer__logo-link').setAttribute('aria-label', 'Home');
    document.querySelector('.footer__info-card').setAttribute('aria-label', 'Open the information page');
  }

  for (const choice of form.elements.service) {
    choice.checked = choice.value === params.get('service');
  }

  const contactByChannel = {
    telegram: { placeholder: '@username', label: english ? 'Telegram username' : 'Имя пользователя в Telegram', inputMode: 'text', autocomplete: 'off' },
    vk: { placeholder: 'vk.com/username', label: english ? 'VK profile' : 'Профиль ВКонтакте', inputMode: 'url', autocomplete: 'off' },
    phone: { placeholder: '+7', label: english ? 'Phone number' : 'Номер телефона', inputMode: 'tel', autocomplete: 'tel' },
    email: { placeholder: 'name@example.com', label: 'Email', inputMode: 'email', autocomplete: 'email' },
  };
  const channelValues = {};
  let channel = channels.value;

  function configureContact() {
    const config = contactByChannel[channel];
    contact.placeholder = config.placeholder;
    contact.inputMode = config.inputMode;
    contact.autocomplete = config.autocomplete;
    contactName.textContent = config.label;
  }

  form.querySelector('.brief__channels').addEventListener('change', () => {
    channelValues[channel] = contact.value;
    channel = channels.value;
    configureContact();
    contact.value = channelValues[channel] || '';
    showContactError('');
  });
  configureContact();

  const updateCount = () => { detailsCount.textContent = `${details.value.length}/${details.maxLength}`; };
  details.value = (params.get('estimate') || '').slice(0, details.maxLength);
  details.addEventListener('input', updateCount);
  updateCount();

  function contactProblem() {
    const value = contact.value.trim();
    if (!value) return messages.required;
    if (channel === 'phone' && (!/^\+?[\d\s().-]+$/.test(value) || !/^\d{10,15}$/.test(value.replace(/\D/g, '')))) {
      return english ? 'Enter a phone number' : 'Укажите номер телефона';
    }
    if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return english ? 'Enter a valid email address' : 'Укажите корректный email';
    }
    return /[\p{L}\p{N}]/u.test(value) ? '' : messages.invalid;
  }

  function showContactError(message) {
    contactError.textContent = message;
    contactError.hidden = !message;
    contactHint.hidden = Boolean(message);
    contact.setAttribute('aria-invalid', String(Boolean(message)));
    contact.setAttribute('aria-describedby', message ? 'contact-error' : 'contact-hint');
  }

  contact.addEventListener('blur', () => showContactError(contactProblem()));
  contact.addEventListener('input', () => {
    if (contact.getAttribute('aria-invalid') === 'true') showContactError(contactProblem());
  });

  const idleLabel = submit.textContent;
  let busy = false;
  let previousPayload = '';
  let requestId;

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;

    const problem = contactProblem();
    showContactError(problem);
    if (problem) {
      contact.focus();
      return;
    }

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      showStatus(messages.unavailable);
      return;
    }

    const payload = {
      service: form.elements.service.value || 'other',
      contact: contact.value.trim(),
      details: details.value.trim(),
      website: form.elements.website_url.value,
    };
    const immutablePayload = JSON.stringify(payload);
    if (immutablePayload !== previousPayload) {
      requestId = crypto.randomUUID();
      previousPayload = immutablePayload;
    }

    busy = true;
    submit.disabled = true;
    submit.textContent = messages.sending;
    showStatus('');
    form.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST', credentials: 'omit',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, requestId }), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error('Brief delivery failed');

      const showSuccess = () => {
        document.querySelector('.brief__content').hidden = true;
        document.querySelector('.brief').classList.add('is-complete');
        document.documentElement.classList.add('brief-complete');
        document.querySelector('.footer').hidden = true;
        success.hidden = false;
        document.title = english ? 'Brief sent | Levmich Studio' : 'Заявка отправлена | Levmich Studio';
        success.querySelector('h1').focus({ preventScroll: true });
        window.scrollTo(0, 0);
        form.reset();
        updateCount();
      };
      if (window.levmichPageTransition) await window.levmichPageTransition.swap(showSuccess);
      else showSuccess();
    } catch (_) {
      showStatus(messages.failed);
    } finally {
      window.clearTimeout(timeout);
      form.removeAttribute('aria-busy');
      submit.textContent = idleLabel;
      submit.disabled = false;
      busy = false;
    }
  });

  submit.disabled = false;
})();
