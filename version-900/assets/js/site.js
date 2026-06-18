(function () {
  function selectAll(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function setupMenu() {
    var button = document.querySelector('[data-menu-button]');
    var panel = document.querySelector('[data-mobile-panel]');

    if (!button || !panel) {
      return;
    }

    button.addEventListener('click', function () {
      panel.classList.toggle('is-open');
      document.body.classList.toggle('menu-open', panel.classList.contains('is-open'));
    });
  }

  function setupHero() {
    var slider = document.querySelector('[data-hero-slider]');

    if (!slider) {
      return;
    }

    var slides = selectAll('[data-hero-slide]', slider);
    var dots = selectAll('[data-hero-dot]', slider);
    var prev = slider.querySelector('[data-hero-prev]');
    var next = slider.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(target) {
      if (!slides.length) {
        return;
      }

      index = (target + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener('click', function () {
        show(dotIndex);
        restart();
      });
    });

    show(0);
    restart();
  }

  function setupFilters() {
    var input = document.querySelector('[data-filter-input]');
    var cards = selectAll('[data-card="movie"]');
    var empty = document.querySelector('[data-empty-state]');
    var yearSelect = document.querySelector('[data-year-filter]');
    var regionSelect = document.querySelector('[data-region-filter]');
    var genreSelect = document.querySelector('[data-genre-filter]');

    if (!input || !cards.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var query = params.get('q');

    if (query) {
      input.value = query;
    }

    function clean(value) {
      return String(value || '').trim().toLowerCase();
    }

    function matches(card, term, year, region, genre) {
      var haystack = [
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-year'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags')
      ].join(' ').toLowerCase();
      var termMatch = !term || haystack.indexOf(term) !== -1;
      var yearMatch = !year || card.getAttribute('data-year') === year;
      var regionMatch = !region || card.getAttribute('data-region') === region;
      var genreMatch = !genre || clean(card.getAttribute('data-genre')).indexOf(clean(genre)) !== -1;

      return termMatch && yearMatch && regionMatch && genreMatch;
    }

    function update() {
      var term = clean(input.value);
      var year = yearSelect ? yearSelect.value : '';
      var region = regionSelect ? regionSelect.value : '';
      var genre = genreSelect ? genreSelect.value : '';
      var visible = 0;

      cards.forEach(function (card) {
        var show = matches(card, term, year, region, genre);
        card.hidden = !show;

        if (show) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    input.addEventListener('input', update);

    [yearSelect, regionSelect, genreSelect].forEach(function (select) {
      if (select) {
        select.addEventListener('change', update);
      }
    });

    update();
  }

  window.setupMoviePlayer = function (source) {
    var video = document.getElementById('movie-video');
    var overlay = document.getElementById('player-overlay');
    var button = document.getElementById('play-button');
    var loaded = false;
    var hls = null;

    if (!video || !overlay || !source) {
      return;
    }

    function load() {
      if (loaded) {
        return;
      }

      loaded = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }
    }

    function start() {
      load();
      overlay.classList.add('is-hidden');
      video.setAttribute('controls', 'controls');
      var attempt = video.play();

      if (attempt && attempt.catch) {
        attempt.catch(function () {});
      }
    }

    overlay.addEventListener('click', start);

    if (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        start();
      });
    }

    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });

    window.addEventListener('pagehide', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    setupMenu();
    setupHero();
    setupFilters();
  });
}());
