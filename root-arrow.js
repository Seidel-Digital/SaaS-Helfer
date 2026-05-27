/**
 * notion-arrow.js
 * Verbindet mehrere Notion-Blöcke mit ihren Ziel-Elementen per handgezeichnetem SVG-Pfeil.
 * Einfügen in Super.so → Settings → Custom Code → Body (End)
 *
 * Optionen pro Pfeil:
 *   fromBlockId   – Notion Block-ID des Startpunkts
 *   toSelector    – CSS-Selektor des Ziels
 *   color         – Farbe
 *   curvature     – Stärke der Kurve (0 = gerade)
 *   toSide        – "right" (Standard) | "left"  → welche Kante des Ziels
 *   curveDir      – "up" (Standard)    | "down"  → Richtung der Kurve
 *   endMidpoint   – true               → Pfeil endet auf halber Strecke (kein Pfeilkopf)
 *   behind        – true               → Pfeil wird hinter den Seiteninhalt gerendert
 */

(function () {

  // ─── KONFIGURATION ──────────────────────────────────────────────────────────
  const ARROWS = [
    {
      // "Die Suchleiste" → Suchleiste (oben links, Kurve nach oben)
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
      fromSide:    "bottomLeft",   // NEU
    },
    {
      // "Feedback-Formular" → Feedback-Anker
      fromBlockId: "block-36743843e4d080a5858ac7d9946708fa",
      toSelector:  ".sff-anchor",
      color:       "#2a2a2a",
      curvature:   0.4,
      toSide:      "left",
      curveDir:    "up",
      endMidpoint: false,
      behind:      true,
      fromSide:    "right",        // NEU
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

    // START: abhängig von fromSide
    var x1, y1;
    if (cfg.fromSide === "bottomLeft") {
      x1 = fromRect.left + sx;
      y1 = fromRect.bottom + sy;
    } else if (cfg.fromSide === "right") {
      x1 = fromRect.right + sx;
      y1 = fromRect.top + fromRect.height / 2 + sy;
    } else {
      // Default: oben links (bisheriges Verhalten)
      x1 = fromRect.left + sx;
      y1 = fromRect.top  + sy;
    }

    // VOLLES ZIEL
    const xFull = (cfg.toSide === "left" ? toRect.left : toRect.right) + sx;
    const yFull = toRect.top + toRect.height / 2 + sy;

    // ENDPUNKT: halbe Strecke oder volles Ziel
    const x2 = cfg.endMidpoint ? (x1 + xFull) / 2 : xFull;
    const y2 = cfg.endMidpoint ? (y1 + yFull) / 2 : yFull;

    // KONTROLLPUNKT: oben oder unten hängend
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const cx = x1 + (x2 - x1) * 0.3;
    const cy = cfg.curveDir === "down"
      ? y1 + dy * cfg.curvature          // nach unten hängen
      : y1 - dy * cfg.curvature;         // nach oben wölben

    // Pfeilkopf-Marker (nur wenn kein endMidpoint)
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

    // Kurvenpfad
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d",              "M " + x1 + " " + y1 + " Q " + cx + " " + cy + " " + x2 + " " + y2);
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

    // Zwei SVG-Ebenen: vor und hinter dem Inhalt
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

  // Resize & Scroll — unverändert
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAll, 150);
  });
  window.addEventListener("scroll", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawAll, 100);
  }, { passive: true });

  // NEU: SVGs sofort entfernen, wenn Super.so die Seite wechselt
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
