(function () {
  'use strict';

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function clean(value) {
    return String(value || '').trim().toLowerCase();
  }

  function startMobileNav() {
    var button = $('.mobile-toggle');
    var nav = $('.mobile-nav');

    if (!button || !nav) {
      return;
    }

    button.addEventListener('click', function () {
      var open = button.classList.toggle('is-open');
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function startHero() {
    var slider = $('.hero-slider');

    if (!slider) {
      return;
    }

    var slides = $all('.hero-slide', slider);
    var dots = $all('.hero-dot', slider);
    var prev = $('.hero-prev', slider);
    var next = $('.hero-next', slider);
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === index);
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }

      timer = window.setInterval(function () {
        show(index + 1);
      }, 6000);
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

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

    show(0);
    restart();
  }

  function startSearch() {
    var input = $('#site-search');
    var typeFilter = $('#type-filter');
    var items = $all('.searchable-item');

    if (!input || !items.length) {
      return;
    }

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');

    if (q) {
      input.value = q;
    }

    function run() {
      var keyword = clean(input.value);
      var typeValue = clean(typeFilter ? typeFilter.value : '');

      items.forEach(function (item) {
        var haystack = clean([
          item.getAttribute('data-title'),
          item.getAttribute('data-region'),
          item.getAttribute('data-year'),
          item.getAttribute('data-type'),
          item.getAttribute('data-genre'),
          item.textContent
        ].join(' '));
        var itemType = clean(item.getAttribute('data-type'));
        var matchText = !keyword || haystack.indexOf(keyword) !== -1;
        var matchType = !typeValue || itemType.indexOf(typeValue) !== -1 || haystack.indexOf(typeValue) !== -1;

        item.classList.toggle('is-hidden', !(matchText && matchType));
      });
    }

    input.addEventListener('input', run);

    if (typeFilter) {
      typeFilter.addEventListener('change', run);
    }

    run();
  }

  window.initMoviePlayer = function (source) {
    var video = $('#movie-player');
    var overlay = $('#player-overlay');
    var loaded = false;
    var hls = null;

    if (!video || !overlay || !source) {
      return;
    }

    function load() {
      if (loaded) {
        return;
      }

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else {
        video.src = source;
      }

      loaded = true;
    }

    function play() {
      load();
      overlay.classList.add('is-hidden');
      video.controls = true;
      var promise = video.play();

      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          overlay.classList.remove('is-hidden');
        });
      }
    }

    overlay.addEventListener('click', play);

    video.addEventListener('click', function () {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', function () {
      overlay.classList.add('is-hidden');
    });

    video.addEventListener('pause', function () {
      if (!video.ended) {
        overlay.classList.remove('is-hidden');
      }
    });

    video.addEventListener('ended', function () {
      overlay.classList.remove('is-hidden');
    });

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  document.addEventListener('DOMContentLoaded', function () {
    startMobileNav();
    startHero();
    startSearch();
  });
})();
