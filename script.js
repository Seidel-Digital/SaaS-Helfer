/* =====================================================================
   SaaS-Helfer KB — script.js
   Artikel → Modul Breadcrumb, oben im Content-Bereich.
   Extern laden mit defer:  <script defer src=".../script.js?v=1"></script>

   Hinweis: Die Navbar ist deaktiviert, daher wird das Breadcrumb als
   erstes Kind von <main> eingefügt (früher in der Navbar). Der alte
   URL-Klassen-Code und der In-Content-Parent-Link wurden entfernt —
   beides stammte aus der alten Struktur (Artikel als Modul-Unterseiten).
   ===================================================================== */
(function () {
  "use strict";
  if (window.__articleCrumb) return;
  window.__articleCrumb = true;

  /* ── KONFIGURATION ───────────────────────────────────────────────
     PROP_NAME : exakter Name der Modul-Select-Property in Notion.
     MODULES   : Modul-Wert → { url, name }. Eine Zeile pro Modul.
                 >>> Fürs finale Produkt hier alle ~34 Module eintragen
                     (Platzhalter m1/m2 dann ersetzen). */
  const PROP_NAME = "Modul";
  const MODULES = {
    "m1": { url: "/k1-1/m1", name: "Modul 1 - m1" },
    "m2": { url: "/k1-1/m2", name: "Modul 2 - m2" },
    // … eine Zeile pro Modul (~34)
  };

  /* Modul-Wert über das Property-LABEL finden (hash-frei).
     Auf den Property-Block beschränkt — kein Ganzseiten-Scan. */
  function getModul() {
    const scopes = document.querySelectorAll(
      ".notion-page__properties-layout, .notion-collection-page__properties, .notion-page__details"
    );
    const roots = scopes.length ? scopes : [document.body];
    for (const root of roots) {
      for (const el of root.querySelectorAll("div, span, td, th, p")) {
        if (el.closest(".notion-collection")) continue;       // DB-Views überspringen
        if (el.textContent.trim() !== PROP_NAME) continue;    // nur das Label
        if (el.querySelector(".notion-pill, .notion-property")) continue;
        let node = el;                                        // zum Wert hochklettern
        for (let i = 0; i < 4 && node; i++) {
          node = node.parentElement;
          const pill = node && node.querySelector(".notion-pill");
          if (pill) return pill.textContent.trim() || null;
        }
      }
    }
    return null;
  }

  /* Crumb oben im Content-Bereich bauen / aktualisieren (idempotent). */
  function refresh() {
    const val = getModul();
    const m   = val && MODULES[val];
    const bar = document.querySelector(".article-crumb");

    if (!m) {
      if (bar) bar.remove();
      if (val && !MODULES[val]) console.warn("[crumb] unmapped module:", val);
      return;
    }
    if (bar) {
      const a = bar.querySelector("a");
      if (a && a.getAttribute("href") === m.url) return;      // schon korrekt
      bar.remove();
    }
    const main = document.querySelector("main.super-content");
    if (!main) return;

    const wrap = document.createElement("div");
    wrap.className = "article-crumb";
    const a = document.createElement("a");
    a.href = m.url;
    a.textContent = "‹ " + m.name;
    wrap.appendChild(a);

    main.prepend(wrap);                                       // erstes Element im Content
  }

  /* Bei Initial-Load und nach jeder Client-Navigation neu ausführen.
     Kurze, gebündelte Retries fangen Supers asynchrones Rendern ab —
     danach Stopp. Kein Dauer-Polling (ersetzt das alte setInterval 300). */
  let navTimer = null;
  function onNav() {
    let tries = 0;
    if (navTimer) clearInterval(navTimer);
    refresh();
    navTimer = setInterval(function () {
      refresh();
      if (++tries >= 8) {                 // ~1,2 s, dann Stopp
        clearInterval(navTimer);
        navTimer = null;
      }
    }, 150);
  }

  /* SPA-Navigation von Super erkennen (History-API + popstate). */
  (function () {
    const fire = function () { window.dispatchEvent(new Event("super:navigate")); };
    ["pushState", "replaceState"].forEach(function (method) {
      const original = history[method];
      history[method] = function () {
        const result = original.apply(this, arguments);
        fire();
        return result;
      };
    });
    window.addEventListener("popstate", fire);
  })();
  window.addEventListener("super:navigate", onNav);

  /* Initial-Lauf (bei defer ist das DOM i. d. R. schon geparst). */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onNav);
  } else {
    onNav();
  }
})();
