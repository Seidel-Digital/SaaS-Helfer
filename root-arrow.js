/**
 * notion-arrow.js
 * Verbindet "Die Suchleiste"-Block mit der Suchleiste per handgezeichnetem SVG-Pfeil.
 * Einfügen in Super.so → Settings → Custom Code → Body (End)
 */

(function () {

  // ─── KONFIGURATION ──────────────────────────────────────────────────────────
  const CONFIG = {
    targetBlockId: "block-36743843e4d080c7a5b0dc0a7aa312e1",
    color:         "#2a2a2a",   // Dunkel, wie handgezeichnet
    strokeWidth:   2,
    curvature:     0.5,
    initDelay:     1200,
  };
  // ────────────────────────────────────────────────────────────────────────────


  function findSearchBar() {
    const selectors = [
      ".super-search-input",
      'input[placeholder="Search"]',
      'input[placeholder="Suchen"]',
      "[role=\"search\"] input",
      "[placeholder*=\"Search\"]",
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }


  function findTargetBlock(blockId) {
    const byId = document.getElementById(blockId);
    if (byId) return byId;

    const rawId = blockId.replace(/^block-/, "");
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


  function drawArrow(searchEl, targetEl) {
    const old = document.getElementById("notion-arrow-svg");
    if (old) old.remove();

    const searchRect = searchEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // START: obere linke Ecke des "Die Suchleiste"-Blocks
    const x1 = targetRect.left + scrollX;
    const y1 = targetRect.top  + scrollY;

    // ENDE (Pfeilspitze): rechte Mitte der Suchleiste
    const x2 = searchRect.right  + scrollX;
    const y2 = searchRect.top + searchRect.height / 2 + scrollY;

    // Kontrollpunkt für geschwungene Kurve
    const cx = x1 - Math.abs(x2 - x1) * 0.1;
    const cy = y1 - Math.abs(y1 - y2) * CONFIG.curvature;

    const pageW = Math.max(document.body.scrollWidth, window.innerWidth);
    const pageH = Math.max(document.body.scrollHeight, window.innerHeight);

    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.id = "notion-arrow-svg";
    svg.setAttribute("width",  pageW);
    svg.setAttribute("height", pageH);
    svg.style.cssText = [
      "position:absolute",
      "top:0",
      "left:0",
      "width:" + pageW + "px",
      "height:" + pageH + "px",
      "pointer-events:none",
      "z-index:9999",
      "overflow:visible",
    ].join(";");

    // ── Handgezeichneter Pfeilkopf (zwei Linien, kein Polygon) ──
    const defs   = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id",           "arrowhead");
    marker.setAttribute("markerWidth",  "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX",         "5");
    marker.setAttribute("refY",         "5");
    marker.setAttribute("orient",       "auto");

    // Obere Linie des Pfeilkopfs
    const line1 = document.createElementNS(svgNS, "line");
    line1.setAttribute("x1", "0"); line1.setAttribute("y1", "1");
    line1.setAttribute("x2", "5"); line1.setAttribute("y2", "5");
    line1.setAttribute("stroke",       CONFIG.color);
    line1.setAttribute("stroke-width", "1.8");
    line1.setAttribute("stroke-linecap", "round");

    // Untere Linie des Pfeilkopfs
    const line2 = document.createElementNS(svgNS, "line");
    line2.setAttribute("x1", "0"); line2.setAttribute("y1", "9");
    line2.setAttribute("x2", "5"); line2.setAttribute("y2", "5");
    line2.setAttribute("stroke",       CONFIG.color);
    line2.setAttribute("stroke-width", "1.8");
    line2.setAttribute("stroke-linecap", "round");

    marker.appendChild(line1);
    marker.appendChild(line2);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // ── Kurvenpfad ──
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d",            "M " + x1 + " " + y1 + " Q " + cx + " " + cy + " " + x2 + " " + y2);
    path.setAttribute("stroke",       CONFIG.color);
    path.setAttribute("stroke-width", CONFIG.strokeWidth);
    path.setAttribute("fill",         "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("marker-end",   "url(#arrowhead)");

    svg.appendChild(path);

    document.body.style.position = "relative";
    document.body.appendChild(svg);
  }


  function init() {
    const searchEl = findSearchBar();
    const targetEl = findTargetBlock(CONFIG.targetBlockId);

    if (!searchEl) {
      console.warn("[notion-arrow] Suchleiste nicht gefunden.");
      return;
    }
    if (!targetEl) {
      console.warn("[notion-arrow] Block nicht gefunden: " + CONFIG.targetBlockId);
      return;
    }

    drawArrow(searchEl, targetEl);
  }


  setTimeout(init, CONFIG.initDelay);

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  window.addEventListener("scroll", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 100);
  }, { passive: true });

})();
