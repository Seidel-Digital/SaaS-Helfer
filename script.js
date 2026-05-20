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
"Konto & Arbeitsumgebung": { url: "/onboarding-setup/konto-arbeitsumgebung", name: "Zurück zu Konto & Arbeitsumgebung" },
"Mobile App": { url: "/onboarding-setup/mobile-app", name: "Zurück zu Mobile App" },
"Tool-Migration": { url: "/onboarding-setup/tool-migration", name: "Zurück zu Tool-Migration" },
"E-Mail-Marketing": { url: "/marketing-kommunikation/e-mail-marketing", name: "Zurück zu E-Mail-Marketing" },
"Telefonie": { url: "/marketing-kommunikation/telefonie", name: "Zurück zu Telefonie" },
"WhatsApp": { url: "/marketing-kommunikation/whatsapp", name: "Zurück zu WhatsApp" },
"Social Media Planner": { url: "/marketing-kommunikation/social-media-planner", name: "Zurück zu Social Media Planner" },
"Chat-Widget": { url: "/marketing-kommunikation/chat-widget", name: "Zurück zu Chat-Widget" },
"Werbeanzeigen": { url: "/marketing-kommunikation/werbeanzeigen", name: "Zurück zu Werbeanzeigen" },
"Affiliate-Programm": { url: "/marketing-kommunikation/affiliate-programm", name: "Zurück zu Affiliate-Programm" },
"Lokale Sichtbarkeit": { url: "/marketing-kommunikation/lokale-sichtbarkeit", name: "Zurück zu Lokale Sichtbarkeit" },
"Reputation & Bewertungen": { url: "/marketing-kommunikation/reputation-bewertungen", name: "Zurück zu Reputation & Bewertungen" },
"Funnels & Websites": { url: "/websites-funnels/funnels-websites", name: "Zurück zu Funnels & Websites" },
"Formulare & Umfragen": { url: "/websites-funnels/formulare-umfragen", name: "Zurück zu Formulare & Umfragen" },
"Blog": { url: "/websites-funnels/blog", name: "Zurück zu Blog" },
"WordPress": { url: "/websites-funnels/wordpress", name: "Zurück zu WordPress" },
"Webinare": { url: "/websites-funnels/webinare", name: "Zurück zu Webinare" },
"Kontakte & Listen": { url: "/crm-vertrieb/kontakte-listen", name: "Zurück zu Kontakte & Listen" },
"Felder & Objekte": { url: "/crm-vertrieb/felder-objekte", name: "Zurück zu Felder & Objekte" },
"Pipelines & Leads": { url: "/crm-vertrieb/pipelines-leads", name: "Zurück zu Pipelines & Leads" },
"Konversationen": { url: "/crm-vertrieb/konversationen", name: "Zurück zu Konversationen" },
"Kalender – Grundlagen": { url: "/crm-vertrieb/kalender-grundlagen", name: "Zurück zu Kalender – Grundlagen" },
"Kalender – Spezial": { url: "/crm-vertrieb/kalender-spezial", name: "Zurück zu Kalender – Spezial" },
"Aufgaben & Notizen": { url: "/crm-vertrieb/aufgaben-notizen", name: "Zurück zu Aufgaben & Notizen" },
"Dokumente & Verträge": { url: "/crm-vertrieb/dokumente-vertrge", name: "Zurück zu Dokumente & Verträge" },
"Reporting & Dashboards": { url: "/crm-vertrieb/reporting-dashboards", name: "Zurück zu Reporting & Dashboards" },
"Zahlungen & Rechnungen": { url: "/produkte-angebote/zahlungen-rechnungen", name: "Zurück zu Zahlungen & Rechnungen" },
"Online-Kurse": { url: "/produkte-angebote/online-kurse", name: "Zurück zu Online-Kurse" },
"Kundenportal": { url: "/produkte-angebote/kundenportal", name: "Zurück zu Kundenportal" },
"Community-Gruppen": { url: "/produkte-angebote/community-gruppen", name: "Zurück zu Community-Gruppen" },
"GoKollab": { url: "/produkte-angebote/gokollab", name: "Zurück zu GoKollab" },
"Online-Shop": { url: "/produkte-angebote/online-shop", name: "Zurück zu Online-Shop" },
"Lead-Generierung": { url: "/best-practice-umsetzungen/lead-generierung", name: "Zurück zu Lead-Generierung" },
"E-Mail-Strategien": { url: "/best-practice-umsetzungen/e-mail-strategien", name: "Zurück zu E-Mail-Strategien" },
"Online-Sichtbarkeit": { url: "/best-practice-umsetzungen/online-sichtbarkeit", name: "Zurück zu Online-Sichtbarkeit" },
"Vertriebsprozesse": { url: "/best-practice-umsetzungen/vertriebsprozesse", name: "Zurück zu Vertriebsprozesse" },
"Bewertung & Service": { url: "/best-practice-umsetzungen/bewertung-service", name: "Zurück zu Bewertung & Service" },
"Terminbuchungen": { url: "/best-practice-umsetzungen/terminbuchungen", name: "Zurück zu Terminbuchungen" },
"DSGVO & Recht": { url: "/best-practice-umsetzungen/dsgvo-recht", name: "Zurück zu DSGVO & Recht" },
"Workflows – Grundlagen": { url: "/automationen-ki/workflows-grundlagen", name: "Zurück zu Workflows – Grundlagen" },
"Workflows – Fortgeschritten": { url: "/automationen-ki/workflows-fortgeschritten", name: "Zurück zu Workflows – Fortgeschritten" },
"KI Studio": { url: "/automationen-ki/ki-studio", name: "Zurück zu KI Studio" },
"Conversation AI": { url: "/automationen-ki/conversation-ai", name: "Zurück zu Conversation AI" },
"Voice AI": { url: "/automationen-ki/voice-ai", name: "Zurück zu Voice AI" },
"Content AI": { url: "/automationen-ki/content-ai", name: "Zurück zu Content AI" },
"Reviews AI": { url: "/automationen-ki/reviews-ai", name: "Zurück zu Reviews AI" },
"Webhooks & Schnittstellen": { url: "/automationen-ki/webhooks-schnittstellen", name: "Zurück zu Webhooks & Schnittstellen" },
    // … eine Zeile pro Modul (~50)
  };

  /* Modul-Wert über das Property-LABEL finden (hash-frei).
     Auf den Property-Block beschränkt — kein Ganzseiten-Scan. */
  function getModul() {
    const scopes = document.querySelectorAll(
      ".notion-page__properties, .notion-page__properties-layout, .notion-collection-page__properties, .notion-page__details"
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
    a.textContent = "‹  " + m.name;
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
