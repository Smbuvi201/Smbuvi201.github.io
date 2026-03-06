/*
  script.js
  Purpose: Vanilla JS enhancements for the portfolio:
  - Light/dark theme toggle with localStorage persistence
  - Mobile nav open/close + keyboard support
  - Scroll reveal animations via IntersectionObserver
  - Sticky nav active section highlighting (scroll spy)
  - Back-to-top button
  - Contact form: HTML5 validation + prefilled email via mailto:
*/

(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const rootEl = document.documentElement;

  // Footer year
  const yearEl = $("[data-year]");
  if (yearEl) yearEl.textContent = "2026";

  // Theme
  const THEME_KEY = "portfolio.theme";
  const themeToggle = $("[data-theme-toggle]");
  const themeLabel = $("[data-theme-label]");

  function getTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // ignore storage errors (privacy mode, etc.)
    }
    return "dark"; // requirement: dark by default
  }

  function setTheme(theme) {
    if (theme === "light") {
      rootEl.dataset.theme = "light";
      if (themeToggle) themeToggle.setAttribute("aria-pressed", "true");
      if (themeLabel) themeLabel.textContent = "Dark";
    } else {
      delete rootEl.dataset.theme;
      if (themeToggle) themeToggle.setAttribute("aria-pressed", "false");
      if (themeLabel) themeLabel.textContent = "Light";
    }

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore storage errors (privacy mode, etc.)
    }
  }

  setTheme(getTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isLight = rootEl.dataset.theme === "light";
      setTheme(isLight ? "dark" : "light");
    });
  }

  // Mobile nav
  const navToggle = $("[data-nav-toggle]");
  const navLinks = $("[data-nav-links]");

  function setNavOpen(open) {
    if (!navToggle || !navLinks) return;
    navLinks.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      setNavOpen(!navLinks.classList.contains("is-open"));
    });

    document.addEventListener("click", (e) => {
      if (!navLinks.classList.contains("is-open")) return;
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (navLinks.contains(target) || navToggle.contains(target)) return;
      setNavOpen(false);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (navLinks.classList.contains("is-open")) setNavOpen(false);
    });

    $$(".nav__link", navLinks).forEach((a) => {
      a.addEventListener("click", () => setNavOpen(false));
    });
  }

  // Scroll reveal
  const reducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealEls = $$(".reveal");
  if (!reducedMotion && revealEls.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Scroll spy for active nav link
  const navAnchors = $$(".nav__link");
  const sectionById = new Map(
    $$("main section[id]").map((s) => [s.id, s]),
  );

  function setActiveLink(id) {
    navAnchors.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const isActive = href === `#${id}`;
      if (isActive) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  if (navAnchors.length && sectionById.size && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];
        if (visible && visible.target && visible.target.id) setActiveLink(visible.target.id);
      },
      { rootMargin: `-${Math.round(0.32 * window.innerHeight)}px 0px -55% 0px`, threshold: [0.12, 0.2, 0.4] },
    );

    sectionById.forEach((section) => spy.observe(section));

    // Initial state (if page loads mid-scroll)
    const currentHash = (location.hash || "").replace("#", "");
    if (currentHash && sectionById.has(currentHash)) setActiveLink(currentHash);
    else setActiveLink("about");
  } else if (navAnchors.length) {
    // Fallback: set a reasonable default without observers
    setActiveLink("about");
  }

  // Back to top
  const toTop = $("[data-to-top]");
  function updateToTop() {
    if (!toTop) return;
    const show = window.scrollY > 700;
    toTop.classList.toggle("is-visible", show);
  }
  updateToTop();
  window.addEventListener("scroll", updateToTop, { passive: true });

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  // Contact form (HTML5 validation + mailto)
  const form = $("#contactForm");
  const statusEl = $("[data-form-status]");

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        setStatus("Please fix the highlighted fields and try again.");
        if (typeof form.reportValidity === "function") form.reportValidity();
        return;
      }

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const message = String(fd.get("message") || "").trim();

      const subject = `Portfolio contact from ${name || "someone"}`;
      const body = `${message}\n\n--\nFrom: ${name}\nEmail: ${email}`;
      const mailto = `mailto:simonguku11@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      setStatus("Opening your email client with a prefilled message...");
      window.location.href = mailto;

      // Keep data in place in case mail client is blocked; user can still copy.
      // Optional reset after a short delay.
      window.setTimeout(() => {
        setStatus("If your email app didn't open, you can copy the message and email me directly.");
      }, 1200);
    });

    form.addEventListener("input", () => {
      if (form.checkValidity()) setStatus("");
    });
  }
})();

