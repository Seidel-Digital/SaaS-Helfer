/**
 * notion-arrow.js
 * Verbindet mehrere Notion-Blöcke mit ihren Ziel-Elementen per handgezeichnetem SVG-Pfeil.
 * Einfügen in Super.so → Settings → Custom Code → Body (End)
 *
 * Optionen pro Pfeil:
 *   fromBlockId   – Notion Block-ID des Startpunkts
 *   toSelector    – CSS-Selektor des Ziels
 *   color         – Farbe
 *   curvature     – Stärke der Kurve (0 = gerade), nur für quadratic (cubic: false)
 *   toSide        – "right" | "left" | "bottom" → welche Kante des Ziels
 *   toOffset      – 0–1, Position entlang der Zielkante (0.5 = Mitte, Standard)
 *                   Bei toSide "bottom": horizontale Position (0 = links, 1 = rechts)
 *                   Bei toSide "left"/"right": vertikale Position (0 = oben, 1 = unten)
 *   curveDir      – "up" | "down" → Richtung der Kurve (nur quadratic)
 *   endMidpoint   – true → Pfeil endet auf halber Strecke (kein Pfeilkopf)
 *   behind        – true → Pfeil wird hinter den Seiteninhalt gerendert
 *   fromSide      – "topCenter"   → Mitte oben (x = 50% der Breite)
 *                   "topRight"    → 75% von links, oben (x = 75% der Breite)
 *                   "bottomLeft"  → unten links
 *                   "bottomRight" → unten rechts
 *                   default       → oben links
 *   cubic         – true → kubische Bézierkurve (S-Form) statt quadratisch
 *   cp1           – { x: 0–1, y: 0–1 } relatives Offset für Kontrollpunkt 1 (nur cubic)
 *   cp2           – { x: 0–1, y: 0–1 } relatives Offset für Kontrollpunkt 2 (nur cubic)
 *
 * HINWEIS FÜR KÜNFTIGE ENTWICKLER:
 *   Arrow 3 nutzt eine kubische Bézierkurve für die S-Form. Die Kontrollpunkte
 *   cp1 und cp2 sind als relative Anteile von dx/dy definiert, damit die Kurve
 *   auf allen Bildschirmgrößen (13"–27", verschiedene Skalierungen) proportional
 *   skaliert und der Text nicht geschnitten wird.
 *
 *   CP1 schiebt die Kurve zunächst nach rechts und leicht nach unten (horizontaler
 *   Anlauf vom Text weg), CP2 zieht sie dann von unten zum Ziel hoch.
 *
 *   Auf sehr breiten Bildschirmen kann das S-Shape flach werden, weil dx groß
 *   und dy klein ist. Falls das stört: einen minimalen dy-Wert erzwingen, z. B.
 *   const dy = Math.max(Math.abs(y2 - y1), pageH * 0.15);
 */

(function () {

  // ─── KONFIGURATION ──────────────────────────────────────────────────────────
  const ARROWS = [
    {
      // "Die Suchleiste" → Suchleiste
      fromBlockId: "block-36743843e4d080c7a5b0dc0a7aa312e1",
      toSelector:  ".super-search-input",
      color:       "#2a2a2a",
      curvature:   0.5,
      toSide:      "right",
      curveDir:    "up",
    },
    {
      // "Die Navigation" → Navigationsmenü
      fromBlockId: "block-36743843e4d08006938fee779dde8885",
      toSelector:  ".super-navigation-menu__items",
      color:       "#2a2a2a",
      curvature:   0.6,
      toSide:      "right",
      curveDir:    "down",
      fromSide:    "bottomRight",
    },
    {
      // "Feedback-Formular" → Feedback-Anker
      // Startet bei topCenter des Blocks (Textmitte, kein willkürlicher Pixel-Offset).
      // Landet an der Unterkante des Ziels bei 25% von links — Pfeilkopf zeigt von unten rein.
      fromBlockId: "block-36743843e4d080a5858ac7d9946708fa",
      toSelector:  ".sff-anchor",
      color:       "#2a2a2a",
      toSide:      "bottom",
      toOffset:    0.25,
      endMidpoint: false,
      behind:      true,
      fromSide:    "topCenter",
      cubic:       true,
      cp1:         { x: 0.4, y: 0.3 },
      cp2:         { x: 0.8, y: -0.2 },
    },
  ];

  const STROKE_WIDTH = 2;
  const INIT_DELAY   = 1200;
  // ────────────────────────────────────────────────────────────────────────────


  function findBlock(blockId) {
    const byId = document.getElementById(blockId);
    if (byId) return byId;

    const rawId  = blockId.replace(/^block-/, "");
    const byData = document.querySelector('[data-block-id="' + rawId + '"]');
    if (byData) return byData;

    const dashedId = rawId.replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      "$1-$2-$3-$4-$5"
    );
    return document.getElementById(dashedId)
      || document.querySelector('[data-block-id="' + dashedId + '"]')
      || null;
  }


  function buildArrow(fromEl, toEl, cfg, svgNS, markerId) {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect   = toEl.getBoundingClientRect();
    const sx = window.scrollX;
    const sy = window.scrollY;

    // ── START-PUNKT ──────────────────────────────────────────────────────────
    var x1, y1;
    if (cfg.fromSide === "topCenter") {
      x1 = fromRect.left + fromRect.width / 2 + sx;
      y1 = fromRect.top + sy;
    } else if (cfg.fromSide === "topRight") {
      x1 = fromRect.left + fromRect.width * 0.75 + sx;
      y1 = fromRect.top + sy;
    } else if (cfg.fromSide === "bottomLeft") {
      x1 = fromRect.left + sx;
      y1 = fromRect.bottom + sy;
    } else if (cfg.fromSide === "bottomRight") {
      x1 = fromRect.right + sx;
      y1 = fromRect.bottom + sy;
    } else {
      // Default: oben links
      x1 = fromRect.left + sx;
      y1 = fromRect.top  + sy;
    }

    // ── ZIEL-PUNKT ───────────────────────────────────────────────────────────
    const offset = (cfg.toOffset !== undefined) ? cfg.toOffset : 0.5;
    var x2, y2;
    if (cfg.toSide === "bottom") {
      x2 = toRect.left + toRect.width  * offset + sx;
      y2 = toRect.bottom + sy;
    } else if (cfg.toSide === "left") {
      x2 = toRect.left + sx;
      y2 = toRect.top  + toRect.height * offset + sy;
    } else {
      // "right" und default
      x2 = toRect.right + sx;
      y2 = toRect.top   + toRect.height * offset + sy;
    }

    // ── ENDPUNKT: halbe Strecke oder volles Ziel ─────────────────────────────
    if (cfg.endMidpoint) {
      x2 = (x1 + x2) / 2;
      y2 = (y1 + y2) / 2;
    }

    // ── PFAD ─────────────────────────────────────────────────────────────────
    const dx = x2 - x1;
    const dy = y2 - y1;
    var pathD;

    if (cfg.cubic) {
      // Kubische Bézierkurve: zwei Kontrollpunkte für S-Form
      const cp1x = x1 + dx * cfg.cp1.x;
      const cp1y = y1 + dy * cfg.cp1.y;
      const cp2x = x1 + dx * cfg.cp2.x;
      const cp2y = y1 + dy * cfg.cp2.y;
      pathD = "M " + x1 + " " + y1
            + " C " + cp1x + " " + cp1y
            + " "   + cp2x + " " + cp2y
            + " "   + x2   + " " + y2;
    } else {
      // Quadratische Bézierkurve (bisheriges Verhalten)
      const absDy = Math.abs(dy);
      const cx = x1 + dx * 0.3;
      const cy = cfg.curveDir === "down"
        ? y1 + absDy * cfg.curvature
        : y1 - absDy * cfg.curvature;
      pathD = "M " + x1 + " " + y1
            + " Q " + cx + " " + cy
            + " "   + x2 + " " + y2;
    }

    // ── MARKER & PATH ────────────────────────────────────────────────────────
    const defs = document.createElementNS(svgNS, "defs");

    if (!cfg.endMidpoint) {
      const marker = document.createElementNS(svgNS, "marker");
      marker.setAttribute("id",           markerId);
      marker.setAttribute("markerWidth",  "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("refX",         "5");
      marker.setAttribute("refY",         "5");
      marker.setAttribute("orient",       "auto");

      [["0","1","5","5"], ["0","9","5","5"]].forEach(function (c) {
        const line = document.createElementNS(svgNS, "line");
        line.setAttribute("x1", c[0]); line.setAttribute("y1", c[1]);
        line.setAttribute("x2", c[2]); line.setAttribute("y2", c[3]);
        line.setAttribute("stroke",         cfg.color);
        line.setAttribute("stroke-width",   "1.8");
        line.setAttribute("stroke-linecap", "round");
        marker.appendChild(line);
      });

      defs.appendChild(marker);
    }

    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d",              pathD);
    path.setAttribute("stroke",         cfg.color);
    path.setAttribute("stroke-width",   STROKE_WIDTH);
    path.setAttribute("fill",           "none");
    path.setAttribute("stroke-linecap", "round");

    if (!cfg.endMidpoint) {
      path.setAttribute("marker-end", "url(#" + markerId + ")");
    }

    return { defs: defs, path: path };
  }


  function makeSvg(svgNS, id, pageW, pageH, zIndex) {
    const svg = document.createElementNS(svgNS, "svg");
    svg.id = id;
    svg.setAttribute("width",  pageW);
    svg.setAttribute("height", pageH);
    svg.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "width:"  + pageW + "px",
      "height:" + pageH + "px",
      "pointer-events:none",
      "z-index:" + zIndex,
      "overflow:visible",
    ].join(";");
    return svg;
  }


  function drawAll() {
    ["notion-arrows-front", "notion-arrows-behind"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.remove();
    });

    const pageW = Math.max(document.body.scrollWidth, window.innerWidth);
    const pageH = Math.max(document.body.scrollHeight, window.innerHeight);
    const svgNS = "http://www.w3.org/2000/svg";

    const svgFront  = makeSvg(svgNS, "notion-arrows-front",  pageW, pageH, 9999);
    const svgBehind = makeSvg(svgNS, "notion-arrows-behind", pageW, pageH, 0);

    ARROWS.forEach(function (cfg, i) {
      const fromEl = findBlock(cfg.fromBlockId);
      const toEl   = document.querySelector(cfg.toSelector);

      if (!fromEl) { console.warn("[notion-arrow] Block nicht gefunden: " + cfg.fromBlockId); return; }
      if (!toEl)   { console.warn("[notion-arrow] Ziel nicht gefunden: "  + cfg.toSelector);  return; }

      const parts  = buildArrow(fromEl, toEl, cfg, svgNS, "arrowhead-" + i);
      const target = cfg.behind ? svgBehind : svgFront;
      target.appendChild(parts.defs);
      target.appendChild(parts.path);
    });

    document.body.style.position = "relative";
    document.body.appendChild(svgBehind);
    document.body.appendChild(svgFront);
  }


  setTimeout(drawAll, INIT_DELAY);

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAll, 150);
  });
  window.addEventListener("scroll", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAll, 100);
  }, { passive: true });

  var observer = new MutationObserver(function () {
    var currentPath = window.location.pathname;
    if (currentPath !== observer._lastPath) {
      observer._lastPath = currentPath;
      ["notion-arrows-front", "notion-arrows-behind"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.remove();
      });
    }
  });
  observer._lastPath = window.location.pathname;
  observer.observe(document.body, { childList: true, subtree: false });
})();
