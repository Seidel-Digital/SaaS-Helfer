/**
 * notion-arrow.js
 * Verbindet mehrere Notion-Blöcke mit ihren Ziel-Elementen per handgezeichnetem SVG-Pfeil.
 * Einfügen in Super.so → Settings → Custom Code → Body (End)
 */

(function () {

  // ─── KONFIGURATION ──────────────────────────────────────────────────────────
  const ARROWS = [
    {
      // "Die Suchleiste" → Suchleiste
      fromBlockId:  "block-36743843e4d080c7a5b0dc0a7aa312e1",
      toSelector:   ".super-search-input",
      color:        "#2a2a2a",
      curvature:    0.5,
    },
    {
      // "Die Navigation" → Navigationsmenü
      fromBlockId:  "block-36743843e4d08006938fee779dde8885",
      toSelector:   ".super-navigation-menu__items",
      color:        "#2a2a2a",
      curvature:    0.5,
    },
    {
      // "Feedback-Formular" → Feedback-Anker
      fromBlockId:  "block-36743843e4d080a5858ac7d9946708fa",
      toSelector:   ".sff-anchor",
      color:        "#2a2a2a",
      curvature:    0.5,
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


  function buildArrow(fromEl, toEl, color, curvature, svgNS, markerId) {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect   = toEl.getBoundingClientRect();
    const sx = window.scrollX;
    const sy = window.scrollY;

    // START: obere linke Ecke des Quell-Blocks
    const x1 = fromRect.left + sx;
    const y1 = fromRect.top  + sy;

    // ENDE (Pfeilspitze): rechte Mitte des Ziel-Elements
    const x2 = toRect.right + sx;
    const y2 = toRect.top + toRect.height / 2 + sy;

    // Kontrollpunkt
    const cx = x1 - Math.abs(x2 - x1) * 0.1;
    const cy = y1 - Math.abs(y1 - y2) * curvature;

    // Pfeilkopf-Marker
    const defs   = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id",           markerId);
    marker.setAttribute("markerWidth",  "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX",         "5");
    marker.setAttribute("refY",         "5");
    marker.setAttribute("orient",       "auto");

    [["0","1","5","5"], ["0","9","5","5"]].forEach(function (coords) {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", coords[0]); line.setAttribute("y1", coords[1]);
      line.setAttribute("x2", coords[2]); line.setAttribute("y2", coords[3]);
      line.setAttribute("stroke",         color);
      line.setAttribute("stroke-width",   "1.8");
      line.setAttribute("stroke-linecap", "round");
      marker.appendChild(line);
    });

    defs.appendChild(marker);

    // Kurvenpfad
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d",              "M " + x1 + " " + y1 + " Q " + cx + " " + cy + " " + x2 + " " + y2);
    path.setAttribute("stroke",         color);
    path.setAttribute("stroke-width",   STROKE_WIDTH);
    path.setAttribute("fill",           "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("marker-end",     "url(#" + markerId + ")");

    return { defs: defs, path: path };
  }


  function drawAll() {
    const old = document.getElementById("notion-arrows-svg");
    if (old) old.remove();

    const pageW = Math.max(document.body.scrollWidth, window.innerWidth);
    const pageH = Math.max(document.body.scrollHeight, window.innerHeight);
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.id = "notion-arrows-svg";
    svg.setAttribute("width",  pageW);
    svg.setAttribute("height", pageH);
    svg.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "width:"  + pageW + "px",
      "height:" + pageH + "px",
      "pointer-events:none",
      "z-index:9999",
      "overflow:visible",
    ].join(";");

    ARROWS.forEach(function (cfg, i) {
      const fromEl = findBlock(cfg.fromBlockId);
      const toEl   = document.querySelector(cfg.toSelector);

      if (!fromEl) {
        console.warn("[notion-arrow] Block nicht gefunden: " + cfg.fromBlockId);
        return;
      }
      if (!toEl) {
        console.warn("[notion-arrow] Ziel nicht gefunden: " + cfg.toSelector);
        return;
      }

      const parts = buildArrow(fromEl, toEl, cfg.color, cfg.curvature, svgNS, "arrowhead-" + i);
      svg.appendChild(parts.defs);
      svg.appendChild(parts.path);
    });

    document.body.style.position = "relative";
    document.body.appendChild(svg);
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

})();
