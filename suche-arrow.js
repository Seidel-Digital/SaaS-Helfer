/**
 * notion-arrow.js
 * Verbindet die Suchleiste mit dem "Die Suchleiste"-Block per SVG-Pfeil.
 * Einfügen in Super.so unter: Settings → Custom Code → Body (End)
 */

(function () {

  // ─── KONFIGURATION ──────────────────────────────────────────────────────────
  const CONFIG = {
    // Notion Block-ID des Ziel-Elements
    targetBlockId: "block-36743843e4d080c7a5b0dc0a7aa312e1",

    // Farbe des Pfeils
    color: "#e07b39",

    // Strichbreite
    strokeWidth: 2.5,

    // Wie stark die Kurve gebogen ist (0 = gerade Linie)
    curvature: 0.45,

    // Wie lange gewartet wird bis Notion's DOM fertig ist (ms)
    initDelay: 1200,
  };
  // ────────────────────────────────────────────────────────────────────────────


  /**
   * Findet das Ziel-Element anhand der Notion Block-ID.
   * Probiert mehrere DOM-Muster, die Super.so/Notion verwenden kann.
   */
  function findTargetBlock(blockId) {
    // Muster 1: direkte Element-ID  →  id="block-36743843e4d080c7a5b0dc0a7aa312e1"
    const byId = document.getElementById(blockId);
    if (byId) return byId;

    // Muster 2: data-block-id Attribut (ohne "block-" Präfix)
    const rawId = blockId.replace(/^block-/, "");
    const byData = document.querySelector(`[data-block-id="${rawId}"]`);
    if (byData) return byData;

    // Muster 3: ID mit Bindestrichen (Notion UUID-Format)
    const dashedId = rawId.replace(
      /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
      "$1-$2-$3-$4-$5"
    );
    const byDashed = document.getElementById(dashedId)
      || document.querySelector(`[data-block-id="${dashedId}"]`);
    if (byDashed) return byDashed;

    return null;
  }


  /**
   * Findet das Suchleisten-Input-Feld.
   * Notion/Super.so verwendet mehrere mögliche Selektoren.
   */
  function findSearchBar() {
    const selectors = [
      '.super-search-input',
      'input[placeholder="Search"]',
      'input[placeholder="Suchen"]',
      '[role="search"] input',
      '.notion-search-button',
      '[placeholder*="Search"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }


  /**
   * Zeichnet einen SVG-Pfeil zwischen zwei Elementen.
   */
  function drawArrow(fromEl, toEl) {
    // Alten Pfeil entfernen, falls vorhanden
    const old = document.getElementById("notion-arrow-svg");
    if (old) old.remove();

    const fromRect = fromEl.getBoundingClientRect();
    const toRect   = toEl.getBoundingClientRect();

    // Startpunkt: rechte Mitte der Suchleiste
    const x1 = fromRect.right + window.scrollX;
    const y1 = fromRect.top  + fromRect.height / 2 + window.scrollY;

    // Endpunkt: linke Mitte des Ziel-Headings
    const x2 = toRect.left  + window.scrollX;
    const y2 = toRect.top   + toRect.height / 2 + window.scrollY;

    // Kontrollpunkt für Bézierkurve (horizontal geschwungen)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const cx = x1 + dx * CONFIG.curvature + Math.abs(dy) * 0.15;
    const cy = y1 + dy * CONFIG.curvature - Math.abs(dx) * 0.1;

    // SVG-Größe (gesamte Seite)
    const pageW = Math.max(document.body.scrollWidth, window.innerWidth);
    const pageH = Math.max(document.body.scrollHeight, window.innerHeight);

    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.id = "notion-arrow-svg";
    svg.setAttribute("width",  pageW);
    svg.setAttribute("height", pageH);
    svg.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: ${pageW}px;
      height: ${pageH}px;
      pointer-events: none;
      z-index: 9999;
      overflow: visible;
    `;

    // Pfeilspitze (marker)
    const defs   = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id",          "arrowhead");
    marker.setAttribute("markerWidth",  "8");
    marker.setAttribute("markerHeight", "6");
    marker.setAttribute("refX",         "8");
    marker.setAttribute("refY",         "3");
    marker.setAttribute("orient",       "auto");

    const arrowPoly = document.createElementNS(svgNS, "polygon");
    arrowPoly.setAttribute("points", "0 0, 8 3, 0 6");
    arrowPoly.setAttribute("fill",   CONFIG.color);
    marker.appendChild(arrowPoly);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Kurvenpfad
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
    path.setAttribute("stroke",           CONFIG.color);
    path.setAttribute("stroke-width",     CONFIG.strokeWidth);
    path.setAttribute("fill",             "none");
    path.setAttribute("stroke-dasharray", "0");
    path.setAttribute("marker-end",       "url(#arrowhead)");
    path.style.filter = "drop-shadow(0px 1px 2px rgba(0,0,0,0.15))";
    svg.appendChild(path);

    // SVG muss in einem position:relative Container liegen
    // → wir hängen es direkt an document.body
    document.body.style.position = "relative";
    document.body.appendChild(svg);
  }


  /**
   * Hauptfunktion: Elemente suchen und Pfeil zeichnen.
   */
  function init() {
    const searchEl = findSearchBar();
    const targetEl = findTargetBlock(CONFIG.targetBlockId);

    if (!searchEl) {
      console.warn("[notion-arrow] Suchleiste nicht gefunden.");
      return;
    }
    if (!targetEl) {
      console.warn('[notion-arrow] Block "' + CONFIG.targetBlockId + '" nicht gefunden.');
      return;
    }

    drawArrow(searchEl, targetEl);
  }


  // ─── INITIALISIERUNG ─────────────────────────────────────────────────────────

  // 1. Warte auf DOM + Notion-Rendering
  setTimeout(init, CONFIG.initDelay);

  // 2. Neu zeichnen bei Fenstergröße-Änderung
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  // 3. Neu zeichnen beim Scrollen (falls Layout sich verschiebt)
  window.addEventListener("scroll", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 100);
  }, { passive: true });

})();
