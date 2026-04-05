(function () {
  "use strict";

  const TEXT_BASE = "resources/texts/";
  const IMG_BASE = "resources/images/";

  function getLoader() {
    return document.getElementById("page-loader");
  }

  function setLoaderActive(active) {
    const el = getLoader();
    if (!el) return;
    el.classList.toggle("is-active", active);
    el.setAttribute("aria-hidden", active ? "false" : "true");
  }

  async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.text();
  }

  async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  function setTextContent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text.trim();
  }

  function highlightActiveNav() {
    const page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll(".nav__link[data-nav]").forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.nav === page);
    });
  }

  function initMobileMenu() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".nav");
    if (!toggle || !nav) return;

    function closeMenu() {
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
      document.body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");
    }

    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("menu-open")) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll(".nav__link").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  const revealObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          function (entries, io) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                io.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px -40px 0px", threshold: 0.08 }
        )
      : null;

  function initScrollReveal(root) {
    const scope = root || document;
    const nodes = scope.querySelectorAll(".reveal:not(.is-visible)");
    if (!nodes.length) return;
    if (!revealObserver) {
      nodes.forEach(function (n) {
        n.classList.add("is-visible");
      });
      return;
    }
    nodes.forEach(function (n) {
      revealObserver.observe(n);
    });
  }

  function buildRepertoireRows(items) {
    return items
      .map(function (item) {
        const p = item.prices || {};
        return (
          "<tr><td>" +
          escapeHtml(item.title) +
          "</td><td>" +
          escapeHtml(item.genre) +
          "</td><td>" +
          escapeHtml(p.parterre || "—") +
          "</td><td>" +
          escapeHtml(p.amphitheater || "—") +
          "</td><td>" +
          escapeHtml(p.balcony || "—") +
          "</td></tr>"
        );
      })
      .join("");
  }

  function escapeHtml(str) {
    if (str == null) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function buildRepertoireCards(container, items) {
    if (!container) return;
    container.innerHTML = items
      .map(function (item) {
        const img = item.image || "hero-image.jpg";
        const alt = "Афиша: " + (item.title || "");
        return (
          '<article class="repertoire-card reveal">' +
          '<img src="' +
          IMG_BASE +
          escapeHtml(img) +
          '" alt="' +
          escapeHtml(alt) +
          '" width="800" height="600" loading="lazy" />' +
          '<div class="repertoire-card__body"><h3>' +
          escapeHtml(item.title) +
          "</h3><p><strong>" +
          escapeHtml(item.genre) +
          "</strong> · " +
          escapeHtml(item.duration || "") +
          "</p><p>" +
          escapeHtml(item.description) +
          "</p></div></article>"
        );
      })
      .join("");
    var cardsRoot = document.getElementById("repertoire-cards");
    if (cardsRoot) initScrollReveal(cardsRoot);
  }

  function buildAnnouncements(container, items) {
    if (!container) return;
    container.innerHTML = items
      .map(function (item) {
        const img = item.image || "performance-1.jpg";
        return (
          '<article class="announcement-card">' +
          '<img src="' +
          IMG_BASE +
          escapeHtml(img) +
          '" alt="Анонс: ' +
          escapeHtml(item.title) +
          '" width="800" height="600" loading="lazy" />' +
          '<div class="announcement-card__body"><h3>' +
          escapeHtml(item.title) +
          "</h3>" +
          '<p class="announcement-card__meta">' +
          escapeHtml(item.genre) +
          " · " +
          escapeHtml(item.duration || "") +
          "</p><p>" +
          escapeHtml(item.description) +
          '</p><a class="btn" href="repertoire.html">Подробнее</a></div></article>'
        );
      })
      .join("");
  }

  async function loadRepertoirePage() {
    const tbody = document.getElementById("repertoire-table-body");
    const cards = document.getElementById("repertoire-cards");
    if (!tbody && !cards) return;

    try {
      const items = await fetchJson(TEXT_BASE + "repertoire-items.json");
      if (tbody) tbody.innerHTML = buildRepertoireRows(items);
      if (cards) buildRepertoireCards(cards, items);
    } catch (e) {
      if (tbody) tbody.innerHTML = "<tr><td colspan='5'>Не удалось загрузить репертуар.</td></tr>";
      console.error(e);
    }
  }

  async function loadHomePage() {
    const desc = document.getElementById("main-description");
    const grid = document.getElementById("announcements-grid");
    if (!desc && !grid) return;

    try {
      const tasks = [];
      if (desc) tasks.push(fetchText(TEXT_BASE + "main-description.txt").then(function (t) { setTextContent("main-description", t); }));
      if (grid)
        tasks.push(
          fetchJson(TEXT_BASE + "repertoire-items.json").then(function (items) {
            buildAnnouncements(grid, items);
          })
        );
      await Promise.all(tasks);
    } catch (e) {
      if (desc) desc.textContent = "Не удалось загрузить описание.";
      console.error(e);
    }
  }

  async function loadAboutPage() {
    const aboutEl = document.getElementById("about-theater-text");
    const histEl = document.getElementById("history-text");
    if (!aboutEl && !histEl) return;

    try {
      const tasks = [];
      if (aboutEl)
        tasks.push(fetchText(TEXT_BASE + "about-theater.txt").then(function (t) { setTextContent("about-theater-text", t); }));
      if (histEl) tasks.push(fetchText(TEXT_BASE + "history.txt").then(function (t) { setTextContent("history-text", t); }));
      await Promise.all(tasks);
    } catch (e) {
      if (aboutEl) aboutEl.textContent = "Ошибка загрузки.";
      if (histEl) histEl.textContent = "Ошибка загрузки.";
      console.error(e);
    }
  }

  async function loadContactsBlock() {
    const full = document.getElementById("contacts-text");
    const footer = document.getElementById("footer-contacts");
    if (!full && !footer) return;

    try {
      const text = await fetchText(TEXT_BASE + "contacts.txt");
      if (full) setTextContent("contacts-text", text);
      if (footer) {
        const short = text.split("\n").slice(0, 2).join("\n");
        setTextContent("footer-contacts", short || text);
      }
    } catch (e) {
      const msg = "Контакты временно недоступны.";
      if (full) document.getElementById("contacts-text").textContent = msg;
      if (footer) document.getElementById("footer-contacts").textContent = msg;
      console.error(e);
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  }

  function initFeedbackForm() {
    const form = document.getElementById("feedback-form");
    if (!form) return;

    const nameInput = document.getElementById("feedback-name");
    const emailInput = document.getElementById("feedback-email");
    const subjectInput = document.getElementById("feedback-subject");
    const messageInput = document.getElementById("feedback-message");

    function showErr(id, show) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle("is-visible", show);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      let ok = true;
      showErr("err-name", false);
      showErr("err-email", false);
      showErr("err-subject", false);
      showErr("err-message", false);

      if (!nameInput.value.trim()) {
        showErr("err-name", true);
        ok = false;
      }
      if (!isValidEmail(emailInput.value)) {
        showErr("err-email", true);
        ok = false;
      }
      if (!subjectInput.value.trim()) {
        showErr("err-subject", true);
        ok = false;
      }
      if (!messageInput.value.trim()) {
        showErr("err-message", true);
        ok = false;
      }

      if (ok) {
        alert("Спасибо! Ваше сообщение принято (демо-режим: данные не отправляются на сервер).");
        form.reset();
      }
    });
  }

  function initGalleryModal() {
    const gallery = document.getElementById("photo-gallery");
    const modal = document.getElementById("gallery-modal");
    const modalImg = document.getElementById("gallery-modal-img");
    const closeBtn = document.getElementById("gallery-modal-close");
    if (!gallery || !modal || !modalImg) return;

    function openModal(src, alt) {
      modalImg.src = src;
      modalImg.alt = alt || "Фотография из галереи";
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modalImg.src = "";
      document.body.style.overflow = "";
    }

    gallery.querySelectorAll("button[data-full]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const src = btn.getAttribute("data-full");
        const img = btn.querySelector("img");
        openModal(src, img ? img.alt : "");
      });
    });

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
  }

  async function routePageLoads() {
    const page = document.body.dataset.page;
    const promises = [];

    if (page === "home") promises.push(loadHomePage());
    else if (page === "repertoire") promises.push(loadRepertoirePage());
    else if (page === "about") promises.push(loadAboutPage());

    promises.push(loadContactsBlock());

    setLoaderActive(true);
    try {
      await Promise.all(promises);
    } finally {
      setLoaderActive(false);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    highlightActiveNav();
    initMobileMenu();
    initSmoothScroll();
    initScrollReveal(document);
    initFeedbackForm();
    initGalleryModal();

    routePageLoads().catch(function (e) {
      console.error(e);
    });
  });
})();
