(() => {
  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.querySelector('.mobile-nav');
  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  const slides = [...document.querySelectorAll('.hero-slide')];
  const dots = [...document.querySelectorAll('.hero-dot')];
  if (slides.length) {
    let current = 0;
    const showSlide = (index) => {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === current));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === current));
    };
    dots.forEach((dot, i) => dot.addEventListener('click', () => showSlide(i)));
    setInterval(() => showSlide(current + 1), 5200);
  }

  const filterScope = document.querySelector('[data-filter-scope]');
  if (filterScope) {
    const cards = [...filterScope.querySelectorAll('.movie-card')];
    const searchInput = document.querySelector('[data-filter-search]');
    const yearSelect = document.querySelector('[data-filter-year]');
    const typeSelect = document.querySelector('[data-filter-type]');
    const empty = document.querySelector('.empty-state');
    const normalize = (value) => String(value || '').toLowerCase().trim();
    const apply = () => {
      const q = normalize(searchInput && searchInput.value);
      const year = yearSelect ? yearSelect.value : '';
      const type = typeSelect ? typeSelect.value : '';
      let visible = 0;
      cards.forEach((card) => {
        const text = normalize([
          card.dataset.title,
          card.dataset.region,
          card.dataset.type,
          card.dataset.genre,
          card.dataset.category
        ].join(' '));
        const passSearch = !q || text.includes(q);
        const passYear = !year || card.dataset.year === year;
        const passType = !type || card.dataset.type === type;
        const pass = passSearch && passYear && passType;
        card.style.display = pass ? '' : 'none';
        if (pass) visible += 1;
      });
      if (empty) empty.style.display = visible ? 'none' : 'block';
    };
    [searchInput, yearSelect, typeSelect].forEach((el) => el && el.addEventListener('input', apply));
    const params = new URLSearchParams(location.search);
    if (searchInput && params.get('q')) {
      searchInput.value = params.get('q');
    }
    apply();
  }

  const player = document.querySelector('[data-play-url]');
  if (player) {
    const video = player.querySelector('video');
    const overlay = player.querySelector('.player-overlay');
    const startButton = player.querySelector('.player-start');
    const playUrl = player.getAttribute('data-play-url');
    let ready = false;
    let hlsInstance = null;
    const load = () => {
      if (ready || !video || !playUrl) return;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(playUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = playUrl;
      }
      ready = true;
    };
    const start = () => {
      load();
      if (overlay) overlay.classList.add('is-hidden');
      if (video) {
        video.controls = true;
        const playing = video.play();
        if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      }
    };
    if (startButton) startButton.addEventListener('click', start);
    if (overlay) overlay.addEventListener('click', start);
    if (video) {
      video.addEventListener('click', () => {
        if (!ready || video.paused) start();
        else video.pause();
      });
      video.addEventListener('ended', () => {
        if (overlay) overlay.classList.remove('is-hidden');
      });
    }
    window.addEventListener('beforeunload', () => {
      if (hlsInstance) hlsInstance.destroy();
    });
  }
})();
