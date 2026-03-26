(function () {
  const WA = "971506939954";
  const PLANRADAR = "https://www.planradar.com/";

  function contactEmail() {
    const e = typeof window.ISTUDIO_CONTACT_EMAIL === "string" ? window.ISTUDIO_CONTACT_EMAIL.trim() : "";
    return e || "";
  }
  const LANG_KEY = "istudio_lang";

  const FALLBACK_IMAGES = {
    about: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80"
    ],
    smart: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80",
      "https://images.unsplash.com/photo-1600566752355-3577923c27fb?w=800&q=80"
    ]
  };

  let lang = localStorage.getItem(LANG_KEY) || "en";
  let selectedPhotos = new Map();

  function t(key) {
    return (window.I18N && window.I18N[lang] && window.I18N[lang][key]) || key;
  }

  function applyI18n() {
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.body.classList.toggle("lang-ar", lang === "ar");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = t(key);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        /* skip */
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });

    const btn = document.getElementById("btn-lang");
    if (btn) btn.textContent = lang === "en" ? t("lang.ar") : t("lang.en");
  }

  function wireImages() {
    document.querySelectorAll(".about-grid img").forEach((img, i) => {
      img.addEventListener(
        "error",
        () => {
          img.src = FALLBACK_IMAGES.about[i % FALLBACK_IMAGES.about.length];
        },
        { once: true }
      );
    });
    document.querySelectorAll(".smart-visuals img").forEach((img, i) => {
      img.addEventListener(
        "error",
        () => {
          img.src = FALLBACK_IMAGES.smart[i % FALLBACK_IMAGES.smart.length];
        },
        { once: true }
      );
    });
  }

  function registerSW() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }

  let deferredPrompt = null;
  function wireInstall() {
    const btn = document.getElementById("btn-install");
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btn) {
        btn.hidden = false;
      }
    });
    if (btn) {
      btn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        btn.hidden = true;
      });
    }
  }

  function wireNav() {
    /* Mobile uses horizontal .nav-strip; no hamburger menu. */
  }

  function wireLang() {
    document.getElementById("btn-lang")?.addEventListener("click", () => {
      lang = lang === "en" ? "ar" : "en";
      localStorage.setItem(LANG_KEY, lang);
      applyI18n();
    });
  }

  function getPexelsKey() {
    const k = typeof window.ISTUDIO_PEXELS_KEY === "string" ? window.ISTUDIO_PEXELS_KEY.trim() : "";
    return k || "";
  }

  function pexelsProxyUrl(q) {
    return `${window.location.origin}/.netlify/functions/pexels-search?q=${encodeURIComponent(q)}`;
  }

  async function fetchPexelsSearch(q) {
    const key = getPexelsKey();
    const direct = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=24&orientation=portrait`;
    if (key) {
      const res = await fetch(direct, { headers: { Authorization: key } });
      if (!res.ok) throw new Error("direct");
      return res.json();
    }
    const res = await fetch(pexelsProxyUrl(q));
    let data = {};
    try {
      data = await res.json();
    } catch {
      throw new Error("proxy");
    }
    if (!res.ok) throw new Error(data.error || "proxy");
    return data;
  }

  function wirePexels() {
    const queryInput = document.getElementById("pexels-query");
    const searchBtn = document.getElementById("pexels-search");
    const grid = document.getElementById("pexels-grid");
    const status = document.getElementById("pexels-status");
    const bar = document.getElementById("pexels-bar");
    const countEl = document.getElementById("pexels-count");
    const clearBtn = document.getElementById("pexels-clear");
    const mailBtn = document.getElementById("pexels-mail");

    async function search() {
      const q = queryInput?.value.trim() || "interior architecture";
      if (status) status.textContent = t("section2.loading");
      if (grid) grid.innerHTML = "";
      try {
        const data = await fetchPexelsSearch(q);
        if (!data.photos || !data.photos.length) {
          if (status) status.textContent = t("section2.error");
          return;
        }
        data.photos.forEach((p) => {
          const card = document.createElement("button");
          card.type = "button";
          card.className = "pexels-card";
          card.dataset.id = String(p.id);
          card.dataset.url = p.src.large2x || p.src.large;
          card.dataset.page = p.url || "";
          const img = document.createElement("img");
          img.src = p.src.medium;
          img.alt = p.alt || "Pexels";
          img.loading = "lazy";
          const check = document.createElement("span");
          check.className = "pexels-card-check";
          check.textContent = "✓";
          card.appendChild(img);
          card.appendChild(check);
          card.addEventListener("click", () => toggleSelect(card));
          grid?.appendChild(card);
        });
        if (status) status.textContent = "";
      } catch {
        if (status) {
          status.textContent = getPexelsKey() ? t("section2.error") : t("section2.errorProxy");
        }
      }
    }

    function toggleSelect(card) {
      const id = card.dataset.id;
      const url = card.dataset.url;
      if (selectedPhotos.has(id)) {
        selectedPhotos.delete(id);
        card.classList.remove("selected");
      } else {
        selectedPhotos.set(id, { url, page: card.dataset.page });
        card.classList.add("selected");
      }
      updateBar();
    }

    function updateBar() {
      const n = selectedPhotos.size;
      if (countEl) countEl.textContent = String(n);
      if (bar) bar.hidden = n === 0;
    }

    searchBtn?.addEventListener("click", search);
    queryInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        search();
      }
    });

    clearBtn?.addEventListener("click", () => {
      selectedPhotos.clear();
      document.querySelectorAll(".pexels-card.selected").forEach((c) => c.classList.remove("selected"));
      updateBar();
    });

    mailBtn?.addEventListener("click", () => {
      const to = contactEmail();
      if (!to) {
        if (status) status.textContent = t("section2.noEmail");
        return;
      }
      const lines = [];
      if (lang === "ar") {
        lines.push("فريق iStudio، المحترمون — أرسل مراجعًا بصرية مختارة لمشروعي:");
      } else {
        lines.push("Dear iStudio team — Please find my selected visual references below:");
      }
      let i = 1;
      selectedPhotos.forEach((meta) => {
        lines.push(`${i}. ${meta.url}`);
        if (meta.page) lines.push(`   (${meta.page})`);
        i += 1;
      });
      if (lang === "ar") {
        lines.push("أرجو اعتمادها كأساس لمناقشة اتجاه التصميم.");
      } else {
        lines.push("Kindly use these as the basis for our design-direction discussion.");
      }
      const body = lines.join("\n");
      const subject =
        lang === "ar" ? "مراجع بصرية — لوحة اتجاه التصميم" : "Visual references — design mood board";
      const href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = href;
    });
  }

  function wireStudentForm() {
    document.getElementById("student-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = fd.get("name") || "";
      const email = fd.get("email") || "";
      const school = fd.get("school") || "";
      const topic = fd.get("topic") || "";
      let body;
      if (lang === "ar") {
        body = [
          "طلب إرشاد طلابي — iStudio",
          `الاسم: ${name}`,
          `البريد: ${email}`,
          `الجهة: ${school}`,
          `الموضوع: ${topic}`,
          "أرغب في الاطلاع على برنامج الإرشاد (٥٠ درهمًا شهريًا) وخطوات التسجيل."
        ].join("\n");
      } else {
        body = [
          "Student mentorship enquiry — iStudio",
          `Name: ${name}`,
          `Email: ${email}`,
          `Institution: ${school}`,
          `Focus: ${topic}`,
          "Please share next steps for the AED 50/month guidance programme."
        ].join("\n");
      }
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
    });
  }

  function scrollToAboutIfDefault() {
    const id = (window.location.hash || "").replace(/^#/, "");
    if (id && id !== "about") return;
    const about = document.getElementById("about");
    if (!about) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    history.replaceState(null, "", "#about");
    requestAnimationFrame(() => {
      about.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    });
  }

  function wireSplash() {
    const splash = document.getElementById("splash");
    if (!splash) return;

    const AUTO_MS = 2800;
    let done = false;

    function closeSplash() {
      if (done) return;
      done = true;
      splash.classList.add("is-done");
      document.body.classList.remove("splash-open");
      splash.setAttribute("aria-hidden", "true");
      let removed = false;
      function removeSplash() {
        if (removed) return;
        removed = true;
        splash.remove();
        if (document.getElementById("about")) scrollToAboutIfDefault();
      }
      splash.addEventListener(
        "transitionend",
        (e) => {
          if (e.propertyName === "opacity") removeSplash();
        },
        { once: true }
      );
      setTimeout(removeSplash, 900);
    }

    document.body.classList.add("splash-open");
    splash.addEventListener("click", closeSplash);
    splash.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSplash();
    });

    const skip = document.querySelector(".skip-link");
    skip?.addEventListener(
      "focus",
      () => {
        closeSplash();
      },
      { once: true }
    );

    setTimeout(closeSplash, AUTO_MS);
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyI18n();
    if (document.getElementById("splash")) wireSplash();
    if (document.querySelector(".about-grid img, .smart-visuals img")) wireImages();
    registerSW();
    wireInstall();
    wireNav();
    wireLang();
    if (document.getElementById("pexels-query")) wirePexels();
    if (document.getElementById("student-form")) wireStudentForm();
  });
})();
