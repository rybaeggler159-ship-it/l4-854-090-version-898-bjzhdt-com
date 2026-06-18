(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    }

    function textOf(value) {
        return (value || "").toString().toLowerCase().trim();
    }

    ready(function () {
        var toggle = document.querySelector(".mobile-toggle");
        var panel = document.querySelector(".mobile-panel");
        if (toggle && panel) {
            toggle.addEventListener("click", function () {
                var opened = panel.hasAttribute("hidden");
                if (opened) {
                    panel.removeAttribute("hidden");
                    toggle.setAttribute("aria-expanded", "true");
                    toggle.textContent = "×";
                } else {
                    panel.setAttribute("hidden", "");
                    toggle.setAttribute("aria-expanded", "false");
                    toggle.textContent = "☰";
                }
            });
        }

        document.querySelectorAll('form[action="./search.html"]').forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = form.querySelector('input[name="q"]');
                if (input && input.value.trim()) {
                    event.preventDefault();
                    window.location.href = "./search.html?q=" + encodeURIComponent(input.value.trim());
                }
            });
        });

        var slides = Array.prototype.slice.call(document.querySelectorAll(".hero-slide"));
        var dots = Array.prototype.slice.call(document.querySelectorAll(".hero-dot"));
        var prev = document.querySelector(".hero-prev");
        var next = document.querySelector(".hero-next");
        var current = 0;
        var timer = null;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("is-active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("is-active", dotIndex === current);
            });
        }

        function startTimer() {
            if (timer) {
                clearInterval(timer);
            }
            if (slides.length > 1) {
                timer = setInterval(function () {
                    showSlide(current + 1);
                }, 5200);
            }
        }

        if (slides.length) {
            dots.forEach(function (dot) {
                dot.addEventListener("click", function () {
                    showSlide(parseInt(dot.getAttribute("data-slide"), 10) || 0);
                    startTimer();
                });
            });
            if (prev) {
                prev.addEventListener("click", function () {
                    showSlide(current - 1);
                    startTimer();
                });
            }
            if (next) {
                next.addEventListener("click", function () {
                    showSlide(current + 1);
                    startTimer();
                });
            }
            startTimer();
        }

        document.querySelectorAll(".catalog-filter").forEach(function (form) {
            var search = form.querySelector(".catalog-search");
            var type = form.querySelector(".type-filter");
            var grid = form.parentElement.querySelector(".catalog-grid");
            var empty = form.parentElement.querySelector(".empty-state");
            var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".movie-card")) : [];

            function applyFilter() {
                var query = textOf(search ? search.value : "");
                var selectedType = type ? type.value : "";
                var visible = 0;
                cards.forEach(function (card) {
                    var haystack = textOf([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-year"),
                        card.getAttribute("data-tags")
                    ].join(" "));
                    var matchedQuery = !query || haystack.indexOf(query) !== -1;
                    var matchedType = !selectedType || card.getAttribute("data-type") === selectedType;
                    var show = matchedQuery && matchedType;
                    card.hidden = !show;
                    if (show) {
                        visible += 1;
                    }
                });
                if (empty) {
                    empty.hidden = visible !== 0;
                }
            }

            if (search) {
                search.addEventListener("input", applyFilter);
            }
            if (type) {
                type.addEventListener("change", applyFilter);
            }
        });

        renderSearchPage();
    });

    function renderSearchPage() {
        var results = document.getElementById("searchResults");
        var input = document.getElementById("searchInput");
        var summary = document.getElementById("searchSummary");
        if (!results || !window.SITE_MOVIES) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var query = params.get("q") || "";
        if (input) {
            input.value = query;
        }
        var normalized = textOf(query);
        var matched = window.SITE_MOVIES.filter(function (movie) {
            if (!normalized) {
                return true;
            }
            return textOf(movie.title + " " + movie.region + " " + movie.type + " " + movie.year + " " + movie.genre + " " + movie.tags + " " + movie.oneLine).indexOf(normalized) !== -1;
        }).slice(0, 120);

        if (summary) {
            summary.textContent = normalized ? "搜索结果" : "热门推荐";
        }
        results.innerHTML = matched.map(function (movie) {
            return '<article class="movie-card">' +
                '<a class="poster-link" href="' + escapeAttr(movie.url) + '">' +
                '<img class="poster-img" src="' + escapeAttr(movie.cover) + '" alt="' + escapeAttr(movie.title) + '" loading="lazy">' +
                '<span class="poster-play">▶</span>' +
                '</a>' +
                '<div class="movie-card-body">' +
                '<div class="movie-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.year) + '</span></div>' +
                '<h2><a href="' + escapeAttr(movie.url) + '">' + escapeHtml(movie.title) + '</a></h2>' +
                '<p>' + escapeHtml(movie.oneLine) + '</p>' +
                '<div class="tag-row"><span>' + escapeHtml(movie.genre) + '</span></div>' +
                '</div>' +
                '</article>';
        }).join("");
    }

    function escapeHtml(value) {
        return (value || "").toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, "&#096;");
    }
})();

window.setupPlayer = function (sourceUrl) {
    var video = document.getElementById("movieVideo");
    var cover = document.querySelector(".player-cover");
    if (!video || !cover || !sourceUrl) {
        return;
    }

    var hlsInstance = null;
    var initialized = false;

    function hideCover() {
        cover.classList.add("is-hidden");
    }

    function playVideo() {
        hideCover();
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
            if (video.getAttribute("src") !== sourceUrl) {
                video.setAttribute("src", sourceUrl);
            }
            video.play().catch(function () {});
            return;
        }
        if (window.Hls && window.Hls.isSupported()) {
            if (!initialized) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hlsInstance.loadSource(sourceUrl);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    video.play().catch(function () {});
                });
                initialized = true;
            } else {
                video.play().catch(function () {});
            }
            return;
        }
        if (video.getAttribute("src") !== sourceUrl) {
            video.setAttribute("src", sourceUrl);
        }
        video.play().catch(function () {});
    }

    cover.addEventListener("click", playVideo);
    video.addEventListener("play", hideCover);
    video.addEventListener("click", function () {
        if (video.paused) {
            playVideo();
        }
    });
    window.addEventListener("pagehide", function () {
        if (hlsInstance) {
            hlsInstance.destroy();
        }
    });
};
