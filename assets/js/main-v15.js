(() => {
  const root = document.documentElement;
  const body = document.body;
  const menuButton = document.querySelector('.menu-button');
  const navLinks = document.querySelector('.nav-links');
  const themeButton = document.querySelector('[data-theme-toggle]');
  const languageButton = document.querySelector('[data-language-toggle]');
  const themeIcon = document.querySelector('[data-theme-icon]');
  const themeLabel = document.querySelector('[data-theme-label]');
  const languageLabel = document.querySelector('[data-language-label]');

  const safeStore = (key, value) => { try { localStorage.setItem(key, value); } catch (_) {} };

  function updateDynamicControls() {
    const lang = root.dataset.lang === 'zh' ? 'zh' : 'en';
    const theme = root.dataset.theme === 'dark' ? 'dark' : 'light';
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? (lang === 'zh' ? '浅色' : 'Light') : (lang === 'zh' ? '深色' : 'Dark');
    if (themeButton) {
      const text = theme === 'dark' ? (lang === 'zh' ? '切换到浅色模式' : 'Switch to light mode') : (lang === 'zh' ? '切换到深色模式' : 'Switch to dark mode');
      themeButton.setAttribute('aria-label', text);
      themeButton.title = text;
    }
    if (languageLabel) languageLabel.textContent = lang === 'zh' ? 'EN' : '中文';
    if (languageButton) {
      const text = lang === 'zh' ? 'Switch to English' : '切换到简体中文';
      languageButton.setAttribute('aria-label', text);
      languageButton.title = text;
    }
  }

  function applyLanguage(lang, persist = true) {
    const next = lang === 'zh' ? 'zh' : 'en';
    root.dataset.lang = next;
    root.lang = next === 'zh' ? 'zh-CN' : 'en';
    document.querySelectorAll('[data-en][data-zh]').forEach((node) => {
      node.innerHTML = next === 'zh' ? node.dataset.zh : node.dataset.en;
    });
    document.querySelectorAll('[data-alt-en][data-alt-zh]').forEach((node) => {
      node.alt = next === 'zh' ? node.dataset.altZh : node.dataset.altEn;
    });
    if (body) {
      document.title = next === 'zh' ? body.dataset.titleZh : body.dataset.titleEn;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = next === 'zh' ? body.dataset.descriptionZh : body.dataset.descriptionEn;
    }
    updateDynamicControls();
    if (persist) safeStore('shaoda-language', next);
  }

  function applyTheme(theme, persist = true) {
    const next = theme === 'dark' ? 'dark' : 'light';
    root.dataset.theme = next;
    updateDynamicControls();
    if (persist) safeStore('shaoda-theme', next);
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', (event) => {
      if (!navLinks.contains(event.target) && !menuButton.contains(event.target)) {
        navLinks.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  themeButton?.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  languageButton?.addEventListener('click', () => applyLanguage(root.dataset.lang === 'zh' ? 'en' : 'zh'));

  document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });
  applyTheme(root.dataset.theme, false);
  applyLanguage(root.dataset.lang, false);
})();
