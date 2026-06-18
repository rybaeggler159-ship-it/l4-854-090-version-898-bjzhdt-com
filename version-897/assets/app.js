(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function bindMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!button || !panel) {
      return;
    }
    button.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      document.body.classList.toggle("menu-open", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function bindSearchForms() {
    document.querySelectorAll(".site-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        var input = form.querySelector("input[name='q']");
        if (!input) {
          return;
        }
        var q = input.value.trim();
        if (!q) {
          event.preventDefault();
          input.focus();
          return;
        }
        event.preventDefault();
        window.location.href = "./search.html?q=" + encodeURIComponent(q);
      });
    });
  }

  function bindHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".hero-dot"));
    var prev = root.querySelector(".hero-prev");
    var next = root.querySelector(".hero-next");
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener("click", function () {
        show(index - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(index + 1);
        restart();
      });
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        restart();
      });
    });
    show(0);
    restart();
  }

  function normalize(value) {
    return (value || "").toString().toLowerCase();
  }

  function bindFilters() {
    var grids = document.querySelectorAll("[data-card-grid]");
    if (!grids.length) {
      return;
    }
    var params = new URLSearchParams(window.location.search);
    var queryValue = params.get("q") || "";
    var inputs = document.querySelectorAll(".page-search-input");
    var selects = document.querySelectorAll(".page-filter-select");
    var chips = document.querySelectorAll(".filter-chip");
    var empty = document.querySelector(".empty-state");

    inputs.forEach(function (input) {
      if (queryValue) {
        input.value = queryValue;
      }
      input.addEventListener("input", applyFilters);
    });

    selects.forEach(function (select) {
      select.addEventListener("change", applyFilters);
    });

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (item) {
          item.classList.remove("is-active");
        });
        chip.classList.add("is-active");
        applyFilters();
      });
    });

    function currentQuery() {
      var input = document.querySelector(".page-search-input");
      return input ? normalize(input.value.trim()) : "";
    }

    function currentType() {
      var select = document.querySelector(".page-filter-select");
      return select ? normalize(select.value) : "";
    }

    function currentChip() {
      var active = document.querySelector(".filter-chip.is-active");
      return active ? normalize(active.getAttribute("data-filter")) : "";
    }

    function applyFilters() {
      var q = currentQuery();
      var type = currentType();
      var chip = currentChip();
      var visible = 0;
      grids.forEach(function (grid) {
        grid.querySelectorAll(".movie-card").forEach(function (card) {
          var haystack = normalize(card.getAttribute("data-search"));
          var cardType = normalize(card.getAttribute("data-type"));
          var cardCategory = normalize(card.getAttribute("data-category"));
          var ok = true;
          if (q && haystack.indexOf(q) === -1) {
            ok = false;
          }
          if (type && cardType.indexOf(type) === -1) {
            ok = false;
          }
          if (chip && chip !== "all" && cardCategory !== chip) {
            ok = false;
          }
          card.hidden = !ok;
          if (ok) {
            visible += 1;
          }
        });
      });
      if (empty) {
        empty.classList.toggle("is-visible", visible === 0);
      }
    }

    applyFilters();
  }

  ready(function () {
    bindMenu();
    bindSearchForms();
    bindHero();
    bindFilters();
  });
})();

function initMoviePlayer(options) {
  var video = document.getElementById(options.videoId);
  var cover = document.querySelector(options.coverSelector);
  var url = options.url;
  var hls = null;
  var attached = false;

  if (!video || !url) {
    return;
  }

  function attach() {
    if (attached) {
      return Promise.resolve();
    }
    attached = true;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      return Promise.resolve();
    }
    if (window.Hls && window.Hls.isSupported()) {
      return new Promise(function (resolve) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MEDIA_ATTACHED, function () {
          hls.loadSource(url);
        });
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          resolve();
        });
        hls.on(window.Hls.Events.ERROR, function () {
          resolve();
        });
      });
    }
    video.src = url;
    return Promise.resolve();
  }

  function play() {
    if (cover) {
      cover.classList.add("is-hidden");
    }
    attach().then(function () {
      var promise = video.play();
      if (promise && promise.catch) {
        promise.catch(function () {});
      }
    });
  }

  if (cover) {
    cover.addEventListener("click", play);
  }

  video.addEventListener("click", function () {
    if (video.paused) {
      play();
    }
  });

  video.addEventListener("play", function () {
    if (cover) {
      cover.classList.add("is-hidden");
    }
  });

  window.addEventListener("pagehide", function () {
    if (hls && hls.destroy) {
      hls.destroy();
    }
  });
}
