(function () {
  function $(selector, scope) {
    return (scope || document).querySelector(selector);
  }

  function $all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  function openSearchUrl(form) {
    var input = $('input[type="search"]', form);
    var value = input ? input.value.trim() : '';
    var target = 'movies.html';
    if (value) {
      target += '?q=' + encodeURIComponent(value);
    }
    window.location.href = target;
  }

  function initHeader() {
    var toggle = $('.js-menu-toggle');
    var panel = $('.js-mobile-panel');
    if (toggle && panel) {
      toggle.addEventListener('click', function () {
        panel.classList.toggle('is-open');
      });
    }

    $all('.js-search-form').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        openSearchUrl(form);
      });
    });
  }

  function initHero() {
    var hero = $('.js-hero');
    if (!hero) {
      return;
    }

    var slides = $all('.hero-slide', hero);
    var dots = $all('.hero-dot', hero);
    var prev = $('.hero-arrow.prev', hero);
    var next = $('.hero-arrow.next', hero);
    var current = 0;
    var timer = null;

    function show(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(current - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(current + 1);
        restart();
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        show(index);
        restart();
      });
    });

    show(0);
    restart();
  }

  function initFilters() {
    var scope = $('.js-filter-scope');
    if (!scope) {
      return;
    }

    var input = $('.js-filter-input', scope);
    var selects = $all('.js-filter-select', scope);
    var cards = $all('.js-movie-card', scope);
    var empty = $('.js-empty-state', scope);
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';

    if (input && initial) {
      input.value = initial;
    }

    function selected(name) {
      var item = selects.find(function (select) {
        return select.name === name;
      });
      return item ? item.value : '';
    }

    function filter() {
      var keyword = input ? input.value.trim().toLowerCase() : '';
      var region = selected('region');
      var year = selected('year');
      var category = selected('category');
      var visible = 0;

      cards.forEach(function (card) {
        var text = (card.getAttribute('data-search') || '').toLowerCase();
        var ok = true;
        if (keyword && text.indexOf(keyword) === -1) {
          ok = false;
        }
        if (region && card.getAttribute('data-region') !== region) {
          ok = false;
        }
        if (year && card.getAttribute('data-year') !== year) {
          ok = false;
        }
        if (category && card.getAttribute('data-category') !== category) {
          ok = false;
        }
        card.hidden = !ok;
        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    if (input) {
      input.addEventListener('input', filter);
    }

    selects.forEach(function (select) {
      select.addEventListener('change', filter);
    });

    filter();
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initHero();
    initFilters();
  });
})();
