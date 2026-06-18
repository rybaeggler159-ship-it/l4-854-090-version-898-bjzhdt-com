(function () {
  var mobileToggle = document.querySelector('[data-mobile-toggle]');
  var mobileNav = document.querySelector('[data-mobile-nav]');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('img[data-soft-image]').forEach(function (image) {
    image.addEventListener('error', function () {
      var parent = image.closest('.poster-wrap, .hero-poster, .detail-poster, .player-cover, .category-covers, .rank-row');
      if (parent) {
        parent.classList.add('no-image');
      }
      image.remove();
    }, { once: true });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach(function (dot, dotIndex) {
        var active = dotIndex === index;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-pressed', String(active));
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot') || 0));
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
    var scope = panel.parentElement || document;
    var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
    var keyword = panel.querySelector('[data-filter-keyword]');
    var category = panel.querySelector('[data-filter-category]');
    var year = panel.querySelector('[data-filter-year]');
    var type = panel.querySelector('[data-filter-type]');
    var region = panel.querySelector('[data-filter-region]');

    function valueOf(control) {
      return control ? control.value.trim().toLowerCase() : '';
    }

    function applyFilters() {
      var keywordValue = valueOf(keyword);
      var categoryValue = valueOf(category);
      var yearValue = valueOf(year);
      var typeValue = valueOf(type);
      var regionValue = valueOf(region);

      cards.forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-region'),
          card.getAttribute('data-year'),
          card.getAttribute('data-type'),
          card.getAttribute('data-tags')
        ].join(' ').toLowerCase();
        var show = true;

        if (keywordValue && text.indexOf(keywordValue) === -1) {
          show = false;
        }
        if (categoryValue && valueOf({ value: card.getAttribute('data-category') || '' }) !== categoryValue) {
          show = false;
        }
        if (yearValue && valueOf({ value: card.getAttribute('data-year') || '' }) !== yearValue) {
          show = false;
        }
        if (typeValue && valueOf({ value: card.getAttribute('data-type') || '' }) !== typeValue) {
          show = false;
        }
        if (regionValue && valueOf({ value: card.getAttribute('data-region') || '' }) !== regionValue) {
          show = false;
        }

        card.classList.toggle('is-hidden', !show);
      });
    }

    [keyword, category, year, type, region].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilters);
        control.addEventListener('change', applyFilters);
      }
    });

    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q && keyword) {
      keyword.value = q;
      applyFilters();
    }
  });

  document.querySelectorAll('[data-video-player]').forEach(function (wrap) {
    var video = wrap.querySelector('video');
    var cover = wrap.querySelector('.player-cover');
    var url = wrap.getAttribute('data-video-url');
    var started = false;
    var hls;

    function playVideo() {
      if (!video || !url) {
        return;
      }

      if (cover) {
        cover.classList.add('is-hidden');
      }

      if (!started) {
        started = true;
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
          video.play().catch(function () {});
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
            video.play().catch(function () {});
          });
        } else {
          video.src = url;
          video.play().catch(function () {});
        }
      } else {
        video.play().catch(function () {});
      }
    }

    if (cover) {
      cover.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('click', function () {
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      video.addEventListener('ended', function () {
        if (cover) {
          cover.classList.remove('is-hidden');
        }
      });
    }

    window.addEventListener('beforeunload', function () {
      if (hls) {
        hls.destroy();
      }
    });
  });
})();