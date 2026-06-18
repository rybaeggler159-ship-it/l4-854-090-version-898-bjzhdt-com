const App = (() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function initMenu() {
    const toggle = qs("[data-menu-toggle]");
    const panel = qs("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", () => {
      panel.classList.toggle("is-open");
    });
  }

  function initShowcase() {
    const root = qs("[data-showcase]");
    if (!root) {
      return;
    }
    const slides = qsa("[data-showcase-slide]", root);
    const dots = qsa("[data-showcase-dot]", root);
    const prev = qs("[data-showcase-prev]", root);
    const next = qs("[data-showcase-next]", root);
    if (!slides.length) {
      return;
    }
    let index = 0;
    let timer = null;

    const show = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    };

    const restart = () => {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(() => show(index + 1), 5000);
    };

    prev && prev.addEventListener("click", () => {
      show(index - 1);
      restart();
    });

    next && next.addEventListener("click", () => {
      show(index + 1);
      restart();
    });

    dots.forEach((dot, dotIndex) => {
      dot.addEventListener("click", () => {
        show(dotIndex);
        restart();
      });
    });

    restart();
  }

  function initCardFilters() {
    qsa("[data-card-filter]").forEach((input) => {
      const target = document.getElementById(input.getAttribute("data-card-filter"));
      if (!target) {
        return;
      }
      const cards = qsa(".movie-card", target);
      input.addEventListener("input", () => {
        const words = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        cards.forEach((card) => {
          const text = [
            card.getAttribute("data-title"),
            card.getAttribute("data-tags"),
            card.getAttribute("data-year"),
            card.getAttribute("data-region")
          ].join(" ").toLowerCase();
          const matched = words.every((word) => text.includes(word));
          card.classList.toggle("is-hidden", !matched);
        });
      });
    });
  }

  function initSearchPage() {
    const results = qs("[data-search-results]");
    const input = qs("[data-search-page-input]");
    const title = qs("[data-search-title]");
    if (!results || !input || !window.SEARCH_INDEX) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q") || "";
    input.value = query;
    if (!query.trim()) {
      return;
    }
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matched = window.SEARCH_INDEX.filter((item) => {
      const text = [
        item.title,
        item.year,
        item.region,
        item.type,
        item.genre,
        item.tags,
        item.oneLine
      ].join(" ").toLowerCase();
      return words.every((word) => text.includes(word));
    }).slice(0, 120);

    title.textContent = `搜索结果：${query}`;
    if (!matched.length) {
      results.innerHTML = `<div class="search-empty">没有找到匹配影片，可更换关键词继续搜索。</div>`;
      return;
    }
    results.innerHTML = `<div class="poster-grid">${matched.map(renderSearchCard).join("")}</div>`;
  }

  function renderSearchCard(item) {
    const tags = item.tags.split(" ").slice(0, 3).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
    return `
      <article class="movie-card poster-card" data-title="${escapeHtml(item.title)}" data-tags="${escapeHtml(item.tags)}" data-year="${escapeHtml(item.year)}" data-region="${escapeHtml(item.region)}">
        <a href="./${escapeHtml(item.link)}" class="poster-link">
          <figure>
            <img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)}" loading="lazy">
            <figcaption>
              <span>${escapeHtml(item.year)}</span>
              <span>${escapeHtml(item.region)}</span>
            </figcaption>
          </figure>
          <div class="poster-body">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.oneLine)}</p>
            <div class="tag-list">${tags}</div>
          </div>
        </a>
      </article>`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function bindPlayer(streamUrl, videoId) {
    const video = document.getElementById(videoId);
    if (!video) {
      return;
    }
    const frame = video.closest("[data-player]");
    const start = frame ? qs(".player-start", frame) : null;
    let loaded = false;
    let hls = null;

    const load = () => {
      if (!loaded) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = streamUrl;
        } else if (window.Hls && window.Hls.isSupported()) {
          hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(video);
        } else {
          video.src = streamUrl;
        }
        loaded = true;
      }
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    if (start) {
      start.addEventListener("click", () => {
        start.hidden = true;
        load();
      });
    }

    video.addEventListener("click", () => {
      if (video.paused) {
        load();
      }
    });

    video.addEventListener("play", () => {
      if (start) {
        start.hidden = true;
      }
    });

    video.addEventListener("pause", () => {
      if (start && !video.ended) {
        start.hidden = false;
      }
    });

    window.addEventListener("beforeunload", () => {
      if (hls && typeof hls.destroy === "function") {
        hls.destroy();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initMenu();
    initShowcase();
    initCardFilters();
    initSearchPage();
  });

  return {
    bindPlayer
  };
})();
